
const Characteristic = require('hap-nodejs').Characteristic;

const constants = {
  READ: 0x0001,
  WRITE: 0x0002,
  ADDITIONAL_AUTHORIZATION: 0x0004,
  TIMED_WRITE: 0x0008,
  PAIRED_READ: 0x0010,
  PAIRED_WRITE: 0x0020,
  HIDDEN: 0x0040,
  EVENTS: 0x0080,
  DISCONNECTED_EVENTS: 0x0100
};

const permissions = {
  'pr': constants.PAIRED_READ,
  'pw': constants.PAIRED_WRITE,
  'ev': constants.EVENTS | constants.DISCONNECTED_EVENTS,
  'aa': constants.ADDITIONAL_AUTHORIZATION,
  'tw': constants.TIMED_WRITE,
  'hd': constants.HIDDEN
};

function decode(metadata, buffer) {
  const code = buffer.readUInt16LE(0);

  const perms = [];
  for (key in permissions) {
    if ((permissions[key] & code) !== 0) {
      perms.push(key);
    }
  }

  metadata.hapCharacteristicProperties = code;
  metadata.perms = perms;
  metadata.ev = ((constants.EVENTS | constants.DISCONNECTED_EVENTS) & code) != 0;
}

module.exports = {
  decode: decode
};

Object.assign(module.exports, constants);
