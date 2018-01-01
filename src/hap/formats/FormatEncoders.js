
function encodeBool(value) {
  value = value ? 1 : 0;

  const buffer = Buffer.alloc(1);
  buffer.writeUInt8(value, 0);
  return buffer;
}

function encodeUInt8(value) {
  const buffer = Buffer.alloc(1);
  buffer.writeUInt8(value, 0);
  return buffer;
}

function encodeUInt16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function encodeUInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value, 0);
  return buffer;
}

function encodeUInt64(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt64LE(value, 0);
  return buffer;
}

function encodeInt(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32LE(value, 0);
  return buffer;
}

function encodeFloat(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatLE(value, 0);
  return buffer;
}

function encodeString(value) {
  return Buffer.from(value, 'utf8');
}

function encodeTLV(value) {
  return Buffer.from(value, 'base64');
}

const formatEncoders = {
  'bool': encodeBool,
  'uint8': encodeUInt8,
  'uint16': encodeUInt16,
  'uint32': encodeUInt32,
  'uint64': encodeUInt64,
  'int': encodeInt,
  'float': encodeFloat,
  'string': encodeString,
  'tlv8': encodeTLV
};

function encode(format, value) {
  const encoder = formatEncoders[format];
  if (!encoder) {
    throw new Error('Invalid format');
  }

  return encoder(value);
}

module.exports = {
  encode: encode,
  encodeBool: encodeBool,
  encodeUInt8: encodeUInt8,
  encodeUInt16: encodeUInt16,
  encodeUInt32: encodeUInt32,
  encodeUInt64: encodeUInt64,
  encodeInt: encodeInt,
  encodeFloat: encodeFloat,
  encodeString: encodeString
};
