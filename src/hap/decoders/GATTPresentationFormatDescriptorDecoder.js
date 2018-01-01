
const Characteristic = require('hap-nodejs').Characteristic;

const formatCodes = {
  0x01: Characteristic.Formats.BOOL,
  0x04: Characteristic.Formats.UINT8,
  0x06: Characteristic.Formats.UINT16,
  0x08: Characteristic.Formats.UINT32,
  0x0A: Characteristic.Formats.UINT64,
  0x10: Characteristic.Formats.INT,
  0x14: Characteristic.Formats.FLOAT,
  0x19: Characteristic.Formats.STRING,
  0x1B: Characteristic.Formats.TLV8
};

const unitCodes = {
  9984: '',
  9987: Characteristic.Units.SECONDS,
  10031: Characteristic.Units.CELSIUS,
  10033: Characteristic.Units.LUX,
  10083: Characteristic.Units.ARC_DEGREE,
  10157: Characteristic.Units.PERCENTAGE
};

function decode(metadata, buffer) {

  const formatCode = buffer.readUInt8(0);
  const exponent = buffer.readInt8(1);
  const unitCode = buffer.readUInt16LE(2);
  const namespace = buffer.readInt8(4);
  const description = buffer.readUInt16LE(5);

  if (exponent != 0 || namespace != 1 || description != 0) {
    throw new Error(`Unexpected presentation format: ${buffer.values}`);
  }

  metadata.format = formatCodes[formatCode];

  const unit = unitCodes[unitCode];
  if (unit) {
    metadata.unit = unit;
  }
}

module.exports = {
  decode: decode
};
