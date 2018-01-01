"use strict";

const encoders = {
  0x01: value => value,
  0x02: value => { throw new Error('Not implemented'); },
  0x03: value => { throw new Error('Not implemented'); },
  0x04: value => { throw new Error('Not implemented'); },
  0x05: value => { throw new Error('Not implemented'); },
  0x06: value => { throw new Error('Not implemented'); },
  0x07: value => { throw new Error('Not implemented'); },
  0x08: value => { throw new Error('Not implemented'); },
  0x09: value => new Buffer([value]),
  0x0A: value => { throw new Error('Not implemented'); },
  0x0B: value => { throw new Error('Not implemented'); },
  0x0C: value => { throw new Error('Not implemented'); },
  0x0D: value => { throw new Error('Not implemented'); },
  0x0E: value => { throw new Error('Not implemented'); },
  0x0F: value => { throw new Error('Not implemented'); },
  0x10: value => { throw new Error('Not implemented'); },
  0x11: value => { throw new Error('Not implemented'); },
  0x12: value => { throw new Error('Not implemented'); },
};

function encodeValue(key, value) {
  const encoder = encoders[key];
  return encoder(value);
}

function encode(obj) {
  let result = new Buffer(0);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const type = key;
      const valueBuffer = encodeValue(key, obj[key]);

      if (valueBuffer.length <= 255) {
        result = Buffer.concat([result, Buffer.from([type, valueBuffer.length]), valueBuffer]);
      }
      else {
        let leftLength = valueBuffer.length;
        let offset = 0;

        for (; leftLength > 0;) {
          const fragmentLength = leftLength > 255 ? 255 : leftLength;
          result = Buffer.concat([result, Buffer.from([type, fragmentLength]), valueBuffer.slice(offset, offset + fragmentLength)]);
          leftLength -= fragmentLength;
          offset += fragmentLength;
        }
      }
    }
  }

  return result;
}

module.exports = {
  encode: encode
};