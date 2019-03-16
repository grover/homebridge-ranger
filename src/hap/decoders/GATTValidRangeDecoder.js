
const FormatDecoders = require('./../formats/FormatDecoders');

function decode(metadata, buffer) {
  try {
    const offset = FormatDecoders.getLengthOfFormat(metadata.format);

    const minValue = FormatDecoders.decode(metadata.format, buffer, 0, buffer.length);
    if (Number.isFinite(minValue) && !Number.isNaN(minValue)) {
      metadata.minValue = minValue;
    }

    const maxValue = FormatDecoders.decode(metadata.format, buffer, offset, buffer.length);
    if (Number.isFinite(maxValue) && !Number.isNaN(maxValue)) {
      metadata.maxValue = maxValue;
    }
  }
  catch (e) {
    // Invalid format, ignore the range descriptor
  }
}

module.exports = {
  decode: decode
};
