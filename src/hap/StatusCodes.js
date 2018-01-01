
const codes = [
  'The request was successful.',
  'The request failed as the HAP PDU was not recognized or supported.',
  'The request failed as the accessory has reached the the limit on the simultaneous procedures it can handle.',
  'Characteristic requires additional authorization data.',
  'The HAP Request\'s characteristic Instance id did not match the addressed characteristic\'s instance id.',
  'Characteristic access required a secure session to be established.',
  'Accessory was not able to perform the requested operation.'
];

function toString(code) {
  if (0 <= code && code < codes.length) {
    return codes[code];
  }

  return 'Unknown error';
}

module.exports = {
  SUCCESS: 0x00,
  UNSUPPORTED_PDU: 0x01,
  MAX_PROCEDURES: 0x02,
  INSUFFICIENT_AUTHORIZATION: 0x03,
  INVALID_INSTANCE_ID: 0x04,
  INSUFFICIENT_AUTHENTICATION: 0x05,
  INVALID_REQUEST: 0x06,
  toString: toString
};
