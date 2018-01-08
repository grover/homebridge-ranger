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
    this.log.reads('Reading %s:%s', hapProps.address.service, hapProps.address.characteristic);
    const request = new ReadRequest(hapProps.address, hapProps.cid, undefined);
    try {
      const result = await this._executor.run(request);
      const payload = result[TlvKeys.Value];
      const value = FormatDecoders.decode(hapProps.format, payload, 0, payload.length);
      this.log.reads('Value of %s:%s is %o', hapProps.address.service, hapProps.address.characteristic, value);
      return value;
    }
    catch (e) {
      this.log.error('Failed to read %s:%s - %o', hapProps.address.service, hapProps.address.characteristic, e);
      throw e;
    }
  }

  async writeCharacteristic(hapProps, value) {
    const dataBuffer = FormatEncoders.encode(hapProps.format, value);

    const payload = {};
    payload[TlvKeys.Value] = dataBuffer;

    this.log.writes('Writing %o to %s:%s', value, hapProps.address.service, hapProps.address.characteristic);
    const request = new WriteRequest(hapProps.address, hapProps.cid, payload);
    try {
      const result = await this._executor.run(request);
      this.log.writes('Successfully wrote %s:%s', hapProps.address.service, hapProps.address.characteristic);
    }
    catch (e) {
      this.log.error('Failed to write %s:%s - %o', hapProps.address.service, hapProps.address.characteristic, e);
      throw e;
    }
  }
};

module.exports = HapCharacteristicAccessor;