
const RequestBase = require('./RequestBase');
const OpCodes = require('./../OpCodes');

class WriteRequest extends RequestBase {
  constructor(address, cid, payload) {
    const request = {
      address: address,
      opcode: OpCodes.CharacteristicWrite,
      cid: cid,
      payload: payload
    }

    super(request);
  }
};

module.exports = WriteRequest;
