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
      this.log(`Value of ${hapProps.address.service}:${hapProps.address.characteristic} is ${value}`);
      return value;
    }
    catch (e) {
      this.log(`Failed to read ${hapProps.address.service}:${hapProps.address.characteristic}. Reason: ${e}`, reason);
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
      this.log(`Successfully wrote ${hapProps.address.service}:${hapProps.address.characteristic}`);
    }
    catch (e) {
      this.log(`Failed to write ${hapProps.address.service}:${hapProps.address.characteristic}. Reason: ${reason}`, reason);
      throw e;
    }
  }
};

module.exports = HapCharacteristicAccessor;