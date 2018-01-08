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
const TLV8Encoder = require('./../Tlv8Encoder');

class PairVerify {
  constructor(log, accessoryDatabase, previousSessionKeys) {
    this.log = log;

    this._address = {
      service: '000000550000100080000026bb765291',
      characteristic: '0000004e0000100080000026bb765291'
    };
    this._accessoryDatabase = accessoryDatabase;
    this._cid = this._accessoryDatabase.getCharacteristic(this._address).cid;
    this._error = undefined;
    this._state = 0;
    if (previousSessionKeys) {
      this._sessionId = previousSessionKeys.sessionID;
      this._sharedSecret = previousSessionKeys.sharedSecret;
    }

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

    if (this._sessionId) {
      tlv[TLVType.Method] = Buffer.from([6]);
      tlv[TLVType.SessionID] = this._sessionId;

      const salt = Buffer.concat([this._verifyPublicKey, this._sessionId]);
      const info = Buffer.from("Pair-Resume-Request-Info");
      const requestKey = hkdf("sha512", salt, this._sharedSecret, info, 32);

      var ciphertextBuffer = Buffer.alloc(0);
      var macBuffer = Buffer.alloc(16);

      encryption.encryptAndSeal(requestKey, Buffer.from("PR-Msg01"), Buffer.alloc(0), undefined, ciphertextBuffer, macBuffer);
      tlv[TLVType.EncryptedData] = macBuffer;
    }

    const payload = {};
    payload[TlvKeys.Value] = TLV8Encoder.encode(tlv);
    payload[TlvKeys.ReturnResponse] = new Buffer([1]);

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
    payload[TlvKeys.ReturnResponse] = new Buffer([1]);

    return {
      address: this._address,
      opcode: OpCodes.CharacteristicWrite,
      cid: this._cid,
      payload: payload,
      insecure: true
    };
  }

  handleResponse(response) {
    this._state++;
    this.log(`Received pair verify response for M${this._state}`);

    const value = response[TlvKeys.Value];
    const tlvValue = TLV8Decoder.decode(value);

    const error = tlvValue[TLVType.Error];
    if (error) {
      this.log(error);
      this._error = error;
      return;
    }

    if (tlvValue[TLVType.State][0] != this._state) {
      this._error = 'Wrong state returned from the accessory.';
      return;
    }

    switch (this._state) {
      case 2:
        return this.handleM2Response(tlvValue);

      case 4:
        return this.handleM4Response(tlvValue);
    }
  }

  handleM2Response(response) {

    const method = response[TLVType.Method];
    if (method && method[0] === 6) {
      // If resume succeeds, we're done. If resume fails, we'll try again
      // without the previous session ID.
      this.log('Device responded with pair resume response.');
      this._handleResume(response);
      return;
    }

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
    if (!encryption.verifyAndDecrypt(this._encryptionKey, Buffer.from("PV-Msg02"), messageData, authTagData, null, plaintextBuffer)) {
      this._error = "Failed to verify M2 response.";
    }

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

    const resumeSalt = Buffer.from("Pair-Verify-ResumeSessionID-Salt");
    const resumeInfo = Buffer.from("Pair-Verify-ResumeSessionID-Info");

    this._result = {
      decryptKey: hkdf("sha512", encSalt, this._sharedSecret, infoRead, 32),
      encryptKey: hkdf("sha512", encSalt, this._sharedSecret, infoWrite, 32),
      sessionID: hkdf("sha512", resumeSalt, this._sharedSecret, resumeInfo, 32),
      sharedSecret: this._sharedSecret
    };
  }

  _handleResume(response) {

    const encryptedData = response[TLVType.EncryptedData];
    const newSessionID = response[TLVType.SessionID];

    const resumeSalt = Buffer.concat([this._verifyPublicKey, newSessionID]);
    const resumeInfo = Buffer.from("Pair-Resume-Response-Info");
    const responseKey = hkdf("sha512", resumeSalt, this._sharedSecret, resumeInfo, 32);

    var messageData = Buffer.alloc(0);
    var plaintextBuffer = Buffer.alloc(messageData.length);
    if (!encryption.verifyAndDecrypt(this._encryptionKey, Buffer.from("PR-Msg02"), messageData, encryptedData, null, plaintextBuffer)) {
      this._error = "Failed to verify resume session response";
      return;
    }

    const encSalt = Buffer.from("Control-Salt");
    const infoRead = Buffer.from("Control-Read-Encryption-Key");
    const infoWrite = Buffer.from("Control-Write-Encryption-Key");

    this._result = {
      decryptKey: hkdf("sha512", encSalt, this._sharedSecret, infoRead, 32),
      encryptKey: hkdf("sha512", encSalt, this._sharedSecret, infoWrite, 32),
      sessionID: newSessionID,
      sharedSecret: this._sharedSecret
    };
  }

  getResult() {
    if (this._error) {
      const error = new Error(`Failed to establish secure session.`);
      error.hapError = this._error;
      throw error;
    }

    return this._result;
  }
}

module.exports = PairVerify;
