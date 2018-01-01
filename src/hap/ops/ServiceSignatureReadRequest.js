
const RequestBase = require('./RequestBase');

const OpCodes = require('./../OpCodes');
const HapCharacteristicSignatureDecoder = require('./../HapCharacteristicSignatureDecoder');

class ServiceSignatureReadRequest extends RequestBase {

  constructor(address, cid) {
    this._address = address;
    this._cid = cid;

    const request = {
      address: address,
      opcode: OpCodes.ServiceSignatureRead,
      cid: cid,
      payload: payload
    }

    super(request);
  }

  handleResponse(response) {
    const signature = HapCharacteristicSignatureDecoder.decode(response);
    this._signature = signature;
  }

  getResult() {
    return this._signature;
  }
};

module.exports = ServiceSignatureReadRequest;
