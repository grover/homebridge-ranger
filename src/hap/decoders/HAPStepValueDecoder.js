
const FormatDecoders = require('./../formats/FormatDecoders');

function decode(metadata, buffer) {
  metadata.minStep = FormatDecoders.decode(metadata.format, buffer, 0, buffer.length);
}

module.exports = {
  decode: decode
};
