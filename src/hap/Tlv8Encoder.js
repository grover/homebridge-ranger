"use strict";


function encode(obj) {
  let result = new Buffer(0);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const type = key;
      const valueBuffer = obj[key];

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