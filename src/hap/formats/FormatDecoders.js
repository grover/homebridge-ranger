
function decodeBool(buffer, offset, length) {
  return buffer.readUInt8(offset) !== 0;
}

function decodeUInt8(buffer, offset, length) {
  return buffer.readUInt8(offset);
}

function decodeUInt16(buffer, offset, length) {
  return buffer.readUInt16LE(offset);
}

function decodeUInt32(buffer, offset, length) {
  return buffer.readUInt32LE(offset);
}

function decodeUInt64(buffer, offset, length) {
  return buffer.readUInt64LE(offset);
}

function decodeInt(buffer, offset, length) {
  return buffer.readInt32LE(offset);
}

function decodeFloat(buffer, offset, length) {
  return buffer.readFloatLE(offset);
}

function decodeString(buffer, offset, length) {
  return buffer.toString('utf8');
}

function decodeTLV(buffer) {
  // HomeKit expects this to be transmitted as Base64 over IP, but homebridge
  // doesn't do so yet. Instead of decoding the value here, we're translating
  // the TLV8 buffer to base64 directly.
  const decoded = buffer.toString('base64');
  return decoded;
}

const formatDecoders = {
  'bool': decodeBool,
  'uint8': decodeUInt8,
  'uint16': decodeUInt16,
  'uint32': decodeUInt32,
  'uint64': decodeUInt64,
  'int': decodeInt,
  'float': decodeFloat,
  'string': decodeString,
  'data': decodeTLV,
  'tlv8': decodeTLV
};

function decode(format, buffer, offset, length) {

  const decoder = formatDecoders[format];
  if (!decoder) {
    throw new Error('Invalid format');
  }

  return decoder(buffer, offset, length);
}


const lengths = {
  'bool': 1,
  'uint8': 1,
  'uint16': 2,
  'uint32': 4,
  'uint64': 8,
  'int': 4,
  'float': 4
};

function getLengthOfFormat(format) {
  const length = lengths[format];
  if (typeof length === 'undefined') {
    throw new Error('Invalid format');
  }

  return length;
}

module.exports = {
  decode: decode,
  getLengthOfFormat: getLengthOfFormat
};
