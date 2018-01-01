

const RequestBase = require('./RequestBase');
const OpCodes = require('./../OpCodes');

class ExecuteWriteRequest extends RequestBase {

  constructor(address, cid, payload) {
    const request = {
      address: address,
      opcode: OpCodes.CharacteristicExecuteWrite,
      cid: cid,
      payload: payload
    }

    super(request);
  }
};

module.exports = ExecuteWriteRequest;
