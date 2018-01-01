"use strict";

const crypto = require('crypto');
const srp = require('fast-srp-hap');
const hkdf = require('../crypto/hkdf').HKDF;
const encryption = require('../crypto/encryption');
const ed25519 = require('ed25519');

const uuid = require('uuid/v4');

const OpCodes = require('./../OpCodes');

const TLVErrors = require('./TLVErrors');
const TlvKeys = require('./../TlvKeys');
const TLVType = require('./TLVType');
const TLV8Decoder = require('./../Tlv8Decoder');
const TLV8Encoder = require('./../Tlv8Encoder2');

class PairVerify {
  constructor(log, accessoryDatabase) {
    this.log = log;

    this._address = {
      service: '000000550000100080000026bb765291',
      characteristic: '0000004e0000100080000026bb765291'
    };
    this._accessoryDatabase = accessoryDatabase;
    this._cid = this._accessoryDatabase.getCharacteristic(this._address).cid;
    this._error = undefined;
    this._state = 0;

    this._verifySecretKey = encryption.generateCurve25519SecretKey();
    this._verifyPublicKey = encryption.generateCurve25519PublicKeyFromSecretKey(this._verifySecretKey);
  }

  hasMoreRequests() {
    return this._error === undefined && this._state < 4;
  }

  getRequest() {
    this._state++;
    this.log(`Returning pair verify request for M${this._state}`);

    switch (this._state) {
      case 1:
        return this.getM1Request();

      case 3:
        return this.getM3Request();
    }
  }

  getM1Request() {
    const tlv = {};
    tlv[TLVType.State] = Buffer.from([1]);
    tlv[TLVType.PublicKey] = this._verifyPublicKey;


    const payload = {};
    payload[TlvKeys.Value] = TLV8Encoder.encode(tlv);
    payload[TlvKeys.ReturnResponse] = 1;

    return {
      address: this._address,
      opcode: OpCodes.CharacteristicWrite,
      cid: this._cid,
      payload: payload,
      insecure: true
    };
  }

  getM3Request() {
    const controllerInfo = Buffer.concat([
      this._verifyPublicKey,
      Buffer.from(this._accessoryDatabase.pairing.rangerPairingID, 'utf-8'),
      this._accessoryPublicKey
    ]);

    const controllerSignature = ed25519.Sign(
      controllerInfo,
      Buffer.from(this._accessoryDatabase.pairing.rangerLTSK, 'hex'));

    let subtlv = {};
    subtlv[TLVType.Identifier] = Buffer.from(this._accessoryDatabase.pairing.rangerPairingID, 'utf-8');
    subtlv[TLVType.Signature] = controllerSignature;
    subtlv = TLV8Encoder.encode(subtlv);

    var ciphertextBuffer = Buffer.alloc(subtlv.length);
    var macBuffer = Buffer.alloc(16);
    encryption.encryptAndSeal(this._encryptionKey, Buffer.from("PV-Msg03"), subtlv, null, ciphertextBuffer, macBuffer);

    const tlv = {};
    tlv[TLVType.State] = Buffer.from([3]);
    tlv[TLVType.EncryptedData] = Buffer.concat([ciphertextBuffer, macBuffer]);

    const payload = {};
    payload[TlvKeys.Value] = TLV8Encoder.encode(tlv);
    payload[TlvKeys.ReturnResponse] = 1;

    return {
      address: this._address,
      opcode: OpCodes.CharacteristicWrite,
      cid: this._cid,
      payload: payload,
      insecure: true
    };
  }

  handleResponse(response) {
    const error = response[TLVType.Error];
    if (error) {
      this.log(error);
      // TODO: throw new HAPError(error);
      this._error = error;
      return;
    }

    this._state++;
    this.log(`Received pair verify response for M${this._state}`);

    const value = TLV8Decoder.decode(response[TlvKeys.Value]);
    if (value[TLVType.State][0] != this._state) {
      this._error = 'Wrong state returned from the accessory.';
      return;
    }

    switch (this._state) {
      case 2:
        return this.handleM2Response(value);

      case 4:
        return this.handleM4Response(value);
    }
  }

  handleM2Response(response) {

    const encryptedData = response[TLVType.EncryptedData];
    this._accessoryPublicKey = response[TLVType.PublicKey];


    // 4.8.3.1
    this._sharedSecret = encryption.generateCurve25519SharedSecKey(this._verifySecretKey, this._accessoryPublicKey);

    // 4.8.3.2
    const encSalt = Buffer.from("Pair-Verify-Encrypt-Salt");
    const encInfo = Buffer.from("Pair-Verify-Encrypt-Info");
    this._encryptionKey = hkdf("sha512", encSalt, this._sharedSecret, encInfo, 32);

    // 4.8.3.3
    var messageData = Buffer.alloc(encryptedData.length - 16);
    var authTagData = Buffer.alloc(16);
    encryptedData.copy(messageData, 0, 0, encryptedData.length - 16);
    encryptedData.copy(authTagData, 0, encryptedData.length - 16, encryptedData.length);
    var plaintextBuffer = Buffer.alloc(messageData.length);
    encryption.verifyAndDecrypt(this._encryptionKey, Buffer.from("PV-Msg02"), messageData, authTagData, null, plaintextBuffer);

    // 4.8.3.4
    const subtlv = TLV8Decoder.decode(plaintextBuffer);
    const accessoryPairingID = subtlv[TLVType.Identifier];
    const accessorySignature = subtlv[TLVType.Signature];

    if (accessoryPairingID.toString('utf-8') != this._accessoryDatabase.pairing.accessoryPairingID) {
      this._error = 'Accessory Pairing ID does not match';
    }

    const accessoryLTPK = Buffer.from(this._accessoryDatabase.pairing.accessoryLTPK, 'hex');
    const rangerLTPK = Buffer.from(this._accessoryDatabase.pairing.rangerLTPK, 'hex');

    const accessoryInfo = Buffer.concat([this._accessoryPublicKey, accessoryPairingID, this._verifyPublicKey]);
    if (!ed25519.Verify(accessoryInfo, accessorySignature, accessoryLTPK)) {
      this._error = 'Accessory signature verification failed';
    }
  }

  handleM4Response(response) {
    const encSalt = Buffer.from("Control-Salt");
    const infoRead = Buffer.from("Control-Read-Encryption-Key");
    const infoWrite = Buffer.from("Control-Write-Encryption-Key");
    // this.log(`Shared secret: ${JSON.stringify(this._sharedSecret)}`);

    this._result = {
      decryptKey: hkdf("sha512", encSalt, this._sharedSecret, infoRead, 32),
      encryptKey: hkdf("sha512", encSalt, this._sharedSecret, infoWrite, 32)
    };
  }

  getResult() {
    if (this._error) {
      const error = new Error(`Failed to establish secure session.`);
      error.hapError = this._error;
      return error;
    }

    return this._result;
  }
}

module.exports = PairVerify;
