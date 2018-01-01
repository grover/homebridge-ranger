
const RequestBase = require('./RequestBase');

const OpCodes = require('./../OpCodes');
const HapCharacteristicSignatureDecoder = require('./../HapCharacteristicSignatureDecoder');

class CharacteristicSignatureReadRequest extends RequestBase {

  constructor(address, cid, characteristic) {
    super({
      address: address,
      opcode: OpCodes.CharacteristicSignatureRead,
      cid: cid
    });

    this._address = address;
    this._cid = cid;
    this._characteristic = characteristic;
  }

  handleResponse(response) {
    const signature = HapCharacteristicSignatureDecoder.decode(response);
    signature.cid = this._cid;
    signature.address = this._address;
    signature.bleProperties = this._characteristic.properties;
    this._signature = signature;
  }

  getResult() {
    return this._signature;
  }
};

module.exports = CharacteristicSignatureReadRequest;
