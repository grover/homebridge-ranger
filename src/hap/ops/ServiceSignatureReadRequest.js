
const RequestBase = require('./RequestBase');

const OpCodes = require('./../OpCodes');
const HapCharacteristicSignatureDecoder = require('./../HapCharacteristicSignatureDecoder');

class ServiceSignatureReadRequest extends RequestBase {

  constructor(address, cid) {
    const request = {
      address: address,
      opcode: OpCodes.ServiceSignatureRead,
      cid: cid,
      payload: []
    }

    super(request);

    this._address = address;
    this._cid = cid;
  }

  handleResponse(response) {
    console.log(`Service signature response ${JSON.stringify(response)}`);
    const signature = HapCharacteristicSignatureDecoder.decode(response);
    this._signature = signature;
  }

  getResult() {
    return this._signature;
  }
};

module.exports = ServiceSignatureReadRequest;
