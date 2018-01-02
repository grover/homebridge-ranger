
const TlvDecoder = require('./Tlv8Decoder');

const GATTPresentationFormatDescriptorParser = require('./decoders/GATTPresentationFormatDescriptorDecoder');
const GATTValidRangeDecoder = require('./decoders/GATTValidRangeDecoder');
const HAPCharacteristicProperties = require('./decoders/HAPCharacteristicPropertiesDecoder');
const HAPStepValueDecoder = require('./decoders/HAPStepValueDecoder');
const FormatDecoders = require('./formats/FormatDecoders');

const Characteristic = require('hap-nodejs').Characteristic;

function decodeOrigin(metadata, field) {
  metadata.origin = field;
}

function decodeUuid(key, metadata, field) {
  field.reverse();

  const uuid = field.toString('hex', 0, 4) + '-'
    + field.toString('hex', 4, 6) + '-'
    + field.toString('hex', 6, 8) + '-'
    + field.toString('hex', 8, 10) + '-'
    + field.toString('hex', 10);

  metadata[key] = uuid.toUpperCase();
}

function decodeCharacteristicInstanceId(metadata, field) {
  metadata.cid = field.readUInt16LE(0);
}

function decodeSvcId(metadata, field) {
  metadata.serviceId = field.readUInt16LE(0);
}

function decodeTTL(metadata, field) {
  metadata.ttl = field;
}

function decodeParamReturnResponse(metadata, field) {
  metadata.paramReturnResponse = field;
}

function decodeDescription(metadata, field) {
  metadata.description = field.toString('utf8');
}

function decodeValidValues(metadata, value) {
  metadata['valid-values'] = value.splice(0, 2);
}

function decodeValidValuesRange(metadata, value) {
  // TODO: Split into minValue and maxValue
  metadata['valid-values-range'] = value.splice(0, 2);
}

function decodeServiceProperties(metadata, value) {
  metadata.serviceProperties = value.readUInt16LE();
}

function decodeLinkedServices(metadata, value) {
  if (value.length === 0) {
    metadata.linkedServices = [];
    return;
  }

  console.log(`Found linked services, don't know how to parse ${JSON.stringify(value)}`);
}

const decoderTable = {
  '3': (metadata, value) => decodeOrigin('characteristic', metadata, value),
  '4': (metadata, value) => decodeUuid('characteristic', metadata, value),
  '5': (metadata, value) => decodeCharacteristicInstanceId('characteristic', metadata, value),
  '6': (metadata, value) => decodeUuid('service', metadata, value),
  '7': (metadata, value) => decodeSvcId(metadata, value),
  '8': (metadata, value) => decodeTTL(metadata, value),
  '9': (metadata, value) => decodeParamReturnResponse(metadata, value),
  '10': (metadata, value) => HAPCharacteristicProperties.decode(metadata, value),
  '11': (metadata, value) => decodeDescription(metadata, value),
  '12': (metadata, value) => GATTPresentationFormatDescriptorParser.decode(metadata, value),
  '13': (metadata, value) => GATTValidRangeDecoder.decode(metadata, value),
  '14': (metadata, value) => HAPStepValueDecoder.decode(metadata, value),
  '15': (metadata, value) => decodeServiceProperties(metadata, value),
  '16': (metadata, value) => decodeLinkedServices(metadata, value),
  '17': (metadata, value) => decodeValidValues(metadata, value),
  '18': (metadata, value) => decodeValidValuesRange(metadata, value),
};

function decode(tlv) {
  const metadata = {};

  for (let key in decoderTable) {
    if (tlv.hasOwnProperty(key)) {
      decoderTable[key](metadata, tlv[key]);
    }
  }

  return metadata;
}

module.exports = {
  decode: decode
};
