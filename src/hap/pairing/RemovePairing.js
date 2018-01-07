"use strict";

const chalk = require('chalk');

const OpCodes = require('./../OpCodes');

const TlvKeys = require('./../TlvKeys');
const TLVType = require('./TLVType');
const TLV8Decoder = require('./../Tlv8Decoder');
const TLV8Encoder = require('./../Tlv8Encoder');

class RemovePairing {
  constructor(log, name, accessoryDatabase) {
    this.log = log;

    this._address = {
      service: '000000550000100080000026bb765291',
      characteristic: '000000500000100080000026bb765291'
    };
    this._accessoryDatabase = accessoryDatabase;
    this._cid = this._accessoryDatabase.getCharacteristic(this._address).cid;
    this._error = undefined;
    this._name = name;
    this._state = 0;
  }

  hasMoreRequests() {
    return this._state !== 1;
  }

  getRequest() {
    this.log(`Returning remove pairing request`);
    this._state++;

    const tlv = {};
    tlv[TLVType.State] = Buffer.from([1]);
    tlv[TLVType.Method] = Buffer.from([4]);
    tlv[TLVType.Identifier] = Buffer.from(this._accessoryDatabase.pairing.rangerPairingID, 'utf-8');

    const payload = {};
    payload[TlvKeys.Value] = TLV8Encoder.encode(tlv);
    payload[TlvKeys.ReturnResponse] = new Buffer([1]);

    return {
      address: this._address,
      opcode: OpCodes.CharacteristicWrite,
      cid: this._cid,
      payload: payload
    };
  }

  handleResponse(response) {
    const tlvValue = response[TlvKeys.Value];
    if (!tlvValue) {
      this._error = 'No value in response to remove pairing request';
      this.log(this._error);
      return;
    }

    const value = TLV8Decoder.decode(tlvValue);

    const error = value[TLVType.Error];
    if (error) {
      this.log(error);
      this._error = error;
      return;
    }

    const state = value[TLVType.State];
    if (!state || state[0] != 2) {
      this._error = 'Invalid response to remove pairing request.';
      this.log('Received an invalid response to the remove pairing request.');
      return;
    }

    this.log(``);
    this.log(chalk.redBright(`PAIRING REMOVED FROM ACCESSORY ${this._name}`));
    this.log(``);
    this.log(chalk.redBright(`Please remove the device entry from the configuration and restart homebridge.`));
    this.log(``);
  }

  getResult() {
    if (this._error) {
      const error = new Error(`Failed to establish secure session.`);
      error.hapError = this._error;
      throw error;
    }

    return undefined;
  }
}

module.exports = RemovePairing;
