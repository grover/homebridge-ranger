"use strict";

const crypto = require('crypto');
const srp = require('fast-srp-hap');
const hkdf = require('../crypto/hkdf').HKDF;
const encryption = require('../crypto/encryption');
const ed25519 = require('ed25519');

const uuid = require('uuid/v4');

const OpCodes = require('./../OpCodes');

const TLV8Decoder = require('./../Tlv8Decoder');
const TLV8Encoder = require('./../Tlv8Encoder2');
const TlvKeys = require('./../TlvKeys');
const TLVType = require('./TLVType');


/**
 * 
 * Pairing commands are encapsulated in regular characteristic writes, within
 * the HAP-Param-Value type and must also include an additional 
 * HAP-Param-Return-Response key with a 1.
 * 
 * Responses are similarly TLV packed in a HAP-Param-Value TLV.
 * 
 */
class PairSetup {

  constructor(log, attributeDatabase, pin) {
    this.log = log;

    this._state = 0;
    this._address = {
      service: '000000550000100080000026bb765291',
      characteristic: '0000004c0000100080000026bb765291'
    };
    this._cid = attributeDatabase.getCharacteristic(this._address).cid;
    this._encryptionKey;
    this._error = undefined;
    this._key = crypto.randomBytes(32);
    this._params = srp.params["3072"];
    this._pin = pin;
    this._srp;
    this._rangerPairingID;
    this._rangerPublicKey;
    this._rangerProof;
    this._rangerLTPK;
    this._rangerLTSK;
    this._srpSharedSecret;
  }

  hasMoreRequests() {
    return this._error === undefined && this._state < 6;
  }

  getRequest() {
    this._state++;
    this.log(`Returning pairing request for M${this._state}`);

    switch (this._state) {
      case 1:
        return this.getM1Request();

      case 3:
        return this.getM3Request();

      case 5:
        return this.getM5Request();
    }
  }

  getM1Request() {
    const tlv = {};
    tlv[TLVType.State] = Buffer.from([this._state]);
    tlv[TLVType.Method] = Buffer.from([1]);

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
    const identity = Buffer.from('Pair-Setup');
    const password = Buffer.from(this._pin);  // Accessory pin

    this._srp = new srp.Client(this._params, this._salt, identity, password, this._key);
    this._srp.setB(this._accessoryPublicKey);

    this._rangerPublicKey = this._srp.computeA();
    this._rangerProof = this._srp.computeM1();

    const tlv = {};
    tlv[TLVType.State] = Buffer.from([this._state]);
    tlv[TLVType.PublicKey] = this._rangerPublicKey;
    tlv[TLVType.Proof] = this._rangerProof;

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

  getM5Request() {

    // 4.7.5.2.1
    const seed = crypto.randomBytes(32);
    const keyPair = ed25519.MakeKeypair(seed);
    this._rangerPairingID = Buffer.from(uuid());
    this._rangerLTSK = keyPair.privateKey;
    this._rangerLTPK = keyPair.publicKey;

    // 4.7.5.2.2
    this._srpSharedSecret = this._srp.computeK();
    const controllerSalt = Buffer.from("Pair-Setup-Controller-Sign-Salt");
    const controllerInfo = Buffer.from("Pair-Setup-Controller-Sign-Info");
    const iOSDeviceX = hkdf("sha512", controllerSalt, this._srpSharedSecret, controllerInfo, 32);

    // 4.7.5.2.3
    const iOSDeviceInfo = Buffer.concat([iOSDeviceX, this._rangerPairingID, this._rangerLTPK]);

    // 4.7.5.2.4
    const iOSDeviceSignature = ed25519.Sign(iOSDeviceInfo, this._rangerLTSK);

    // 4.7.5.2.5
    let subtlv = {};
    subtlv[TLVType.Identifier] = this._rangerPairingID;
    subtlv[TLVType.PublicKey] = this._rangerLTPK;
    subtlv[TLVType.Signature] = iOSDeviceSignature;
    subtlv = TLV8Encoder.encode(subtlv);

    // 4.7.5.2.6
    var ciphertextBuffer = Buffer.alloc(subtlv.length);
    var macBuffer = Buffer.alloc(16);
    var encSalt = Buffer.from("Pair-Setup-Encrypt-Salt");
    var encInfo = Buffer.from("Pair-Setup-Encrypt-Info");

    this._encryptionKey = hkdf("sha512", encSalt, this._srpSharedSecret, encInfo, 32);
    encryption.encryptAndSeal(this._encryptionKey, Buffer.from("PS-Msg05"), subtlv, null, ciphertextBuffer, macBuffer);

    // 4.7.5.2.7
    const tlv = {};
    tlv[TLVType.State] = Buffer.from([this._state]);
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

    const value = TLV8Decoder.decode(response[TlvKeys.Value]);

    this._state++;
    this.log(`Received pairing response for M${this._state}`);

    switch (this._state) {
      case 2:
        return this.handleM2Response(value);

      case 4:
        return this.handleM4Response(value);

      case 6:
        return this.handleM6Response(value);
    }
  }

  handleM2Response(response) {
    this._salt = response[TLVType.Salt];
    this._accessoryPublicKey = response[TLVType.PublicKey];
  }


  handleM4Response(response) {
    const accessoryProof = response[TLVType.Proof];

    try {
      this._srp.checkM2(accessoryProof);
    }
    catch (err) {
      this.log('Error while checking accessory proof', err);
      this._error = err;
    }
  }

  handleM6Response(response) {

    const encryptedData = response[TLVType.EncryptedData];
    var messageData = Buffer.alloc(encryptedData.length - 16);
    var authTagData = Buffer.alloc(16);
    encryptedData.copy(messageData, 0, 0, encryptedData.length - 16);
    encryptedData.copy(authTagData, 0, encryptedData.length - 16, encryptedData.length);

    var plaintextBuffer = Buffer.alloc(messageData.length);
    encryption.verifyAndDecrypt(this._encryptionKey, Buffer.from("PS-Msg06"), messageData, authTagData, null, plaintextBuffer);

    const accessoryInfo = TLV8Decoder.decode(plaintextBuffer);
    const accessoryPairingID = accessoryInfo[TLVType.Identifier];
    const accessoryLTPK = accessoryInfo[TLVType.PublicKey];
    const accessorySignature = accessoryInfo[TLVType.Signature];

    var accessorySignSalt = Buffer.from("Pair-Setup-Accessory-Sign-Salt");
    var accessorySignInfo = Buffer.from("Pair-Setup-Accessory-Sign-Info");
    var outputKey = hkdf("sha512", accessorySignSalt, this._srpSharedSecret, accessorySignInfo, 32);

    var material = Buffer.concat([outputKey, accessoryPairingID, accessoryLTPK]);
    if (!ed25519.Verify(material, accessorySignature, accessoryLTPK)) {
      this.log('Invalid accessory signature');
      return;
    }

    this._result = {
      rangerPairingID: this._rangerPairingID.toString(),
      rangerLTSK: this._rangerLTSK.toString('hex'),
      rangerLTPK: this._rangerLTPK.toString('hex'),
      accessoryPairingID: accessoryPairingID.toString(),
      accessoryLTPK: accessoryLTPK.toString('hex'),
    };

    thislog(`Pairing result:\n${JSON.stringify(this._result)}`);
  }
  getResult() {
    if (this._error) {
      // TODO: Throw the error
      this.log(`Pairing resulted in error ${error}.`);
    }

    return this._result;
  }
};

module.exports = PairSetup;
