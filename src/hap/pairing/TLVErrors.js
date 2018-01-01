
"use strict";

const Codes = {
  // Success: 0x00,
  Unknown: 0x01,
  Authentication: 0x02,
  Backoff: 0x03,
  MaxPeers: 0x04,
  MaxTries: 0x05,
  Unavailable: 0x06,
  Busy: 0x07
};

const CodeStrings = [
  'Unexpected error',
  'Setup code or signature verification failed',
  'Client must look at the retry delay TLV item and wait that many seconds before retrying',
  'Device cannot accept any more pairings',
  'Device reached its maximum number of authentication attempts',
  'Server pairing method is unavailable',
  'Server is busy and cannot accept a pairing request at this time'
];

function toString(code) {
  code--;
  if (0 <= code && code < CodeStrings.length) {
    return CodeStrings[code];
  }

  throw new Error('Unknown error code');
}

module.exports = {
  Codes: Codes,
  toString: toString
}
