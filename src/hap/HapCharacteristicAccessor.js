"use strict";

const TlvKeys = require('./TlvKeys');

const FormatDecoders = require('./formats/FormatDecoders');
const FormatEncoders = require('./formats/FormatEncoders');

const WriteRequest = require('./ops/WriteRequest');
const ReadRequest = require('./ops/ReadRequest');

class HapCharacteristicAccessor {

  constructor(log, executor) {
    this.log = log;

    this._executor = executor;
  }

  async readCharacteristic(hapProps) {
    const request = new ReadRequest(hapProps.address, hapProps.cid, undefined);
    try {
      const result = await this._executor.run(request);
      const payload = result[TlvKeys.Value];
      const value = FormatDecoders.decode(hapProps.format, payload, 0, payload.length);
      this.log(`Value of characteristic ${hapProps.characteristic} is ${value}`);
      return value;
    }
    catch (e) {
      this.log(`Failed to read characteristic ${hapProps.characteristic}. Reason: ${e}`, reason);
      throw e;
    }
  }

  async writeCharacteristic(hapProps, value) {
    const dataBuffer = FormatEncoders.encode(hapProps.format, value);

    const payload = {};
    payload[TlvKeys.Value] = dataBuffer;

    const request = new WriteRequest(hapProps.address, hapProps.cid, payload);
    try {
      const result = await this._executor.run(request);
      this.log(`Successfully wrote characteristic ${hapProps.characteristic}`);
    }
    catch (e) {
      this.log(`Failed to write characteristic ${hapProps.characteristic}. Reason: ${reason}`, reason);
      throw e;
    }
  }

  async subscribeCharacteristic(hapProps) {
    this.log(`Subscribe ${hapProps.address}`);
  }

  async unsubscribeCharacteristic(hapProps) {
    this.log(`Unsubscribe ${hapProps.address}`);
  }
};

module.exports = HapCharacteristicAccessor;