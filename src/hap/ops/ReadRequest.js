
const RequestBase = require('./RequestBase');
const OpCodes = require('./../OpCodes');

class ReadRequest extends RequestBase {
  constructor(address, cid, payload) {
    const request = {
      address: address,
      opcode: OpCodes.CharacteristicRead,
      cid: cid,
      payload: payload
    }

    super(request);
  }
};

module.exports = ReadRequest;
