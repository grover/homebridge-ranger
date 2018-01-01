"use strict";

const chacha20poly1305 = require('./crypto/chacha20poly1305');
const moment = require('moment');

class HapBleSessionCrypto {
  constructor(log) {
    this.log = log;

    this.reset();
  }

  decrypt(packet) {
    if (!this._decryptKey) {
      throw new Error('Not encrypted');
    }

    const ciphertext = packet.slice(0, packet.length - 16);
    const mac = packet.slice(packet.length - 16, packet.length);

    const padding = (16 - ciphertext.length % 16) % 16;
    const paddedCiphertext = Buffer.concat([ciphertext, Buffer.alloc(padding)]);

    const nonce = this.createNonce(this._decryptNonce++);
    const ctx = this.createChachaContext(this._decryptKey, nonce);
    const poly1305key = this.createPoly1305Key(ctx);

    const expectedMac = this.createAuthenticationTag(poly1305key, paddedCiphertext, ciphertext.length);

    if (chacha20poly1305.poly1305_verify(mac, expectedMac) != 1) {
      this.log('Packet authentication tag verification failed.');
      throw new Error('Packet authentication tag verification failed.');
    }

    const plaintext = Buffer.alloc(ciphertext.length);
    const written = chacha20poly1305.chacha20_update(ctx, plaintext, paddedCiphertext, ciphertext.length);
    chacha20poly1305.chacha20_final(ctx, plaintext.slice(written, plaintext.length));
    return plaintext;
  }

  encrypt(packet) {
    if (!this._encryptKey) {
      throw new Error('Not encrypted');
    }

    const nonce = this.createNonce(this._encryptNonce++);
    const ctx = this.createChachaContext(this._encryptKey, nonce);
    const poly1305key = this.createPoly1305Key(ctx);

    const padding = (16 - packet.length % 16) % 16;
    const paddedCiphertext = Buffer.alloc(packet.length + padding);

    const written = chacha20poly1305.chacha20_update(ctx, paddedCiphertext, packet, packet.length);

    chacha20poly1305.chacha20_final(ctx, paddedCiphertext.slice(written, packet.length));

    const message = paddedCiphertext.slice(0, packet.length);
    const mac = this.createAuthenticationTag(poly1305key, paddedCiphertext, packet.length);

    const result = Buffer.concat([message, mac]);
    return result;
  }

  createNonce(count) {
    const nonce = Buffer.alloc(8);
    this.writeUInt64LE(count, nonce, 0);
    return nonce;
  }

  createChachaContext(key, nonce) {
    const ctx = new chacha20poly1305.Chacha20Ctx();
    chacha20poly1305.chacha20_keysetup(ctx, key);
    chacha20poly1305.chacha20_ivsetup(ctx, nonce);
    return ctx;
  }

  createPoly1305Key(ctx) {
    const poly1305key = Buffer.alloc(64);
    const zeros = Buffer.alloc(64);
    chacha20poly1305.chacha20_update(ctx, poly1305key, zeros, zeros.length);
    return poly1305key;
  }

  createAuthenticationTag(key, paddedCiphertext, messageLength) {
    const length = Buffer.alloc(16);
    length.writeUInt16LE(messageLength, 8);

    const mac = Buffer.alloc(16);

    const poly1305_contxt = new chacha20poly1305.Poly1305Ctx();
    chacha20poly1305.poly1305_init(poly1305_contxt, key);

    chacha20poly1305.poly1305_update(poly1305_contxt, paddedCiphertext, paddedCiphertext.length);
    chacha20poly1305.poly1305_update(poly1305_contxt, length, length.length);
    chacha20poly1305.poly1305_finish(poly1305_contxt, mac);

    return mac;
  }

  writeUInt64LE(number, buffer, offset) {
    offset = offset || 0
    var hl = this.uintHighLow(number)
    buffer.writeUInt32LE(hl[1], offset)
    buffer.writeUInt32LE(hl[0], offset + 4)
  }

  uintHighLow(number) {

    const MAX_UINT32 = 0x00000000FFFFFFFF;
    // const MAX_INT53 = 0x001FFFFFFFFFFFFF;

    // assert(number > -1 && number <= MAX_INT53, "number out of range")
    // assert(Math.floor(number) === number, "number must be an integer")
    var high = 0
    var signbit = number & 0xFFFFFFFF
    var low = signbit < 0 ? (number & 0x7FFFFFFF) + 0x80000000 : signbit
    if (number > MAX_UINT32) {
      high = (number - low) / (MAX_UINT32 + 1)
    }
    return [high, low]
  }

  isExpired() {
    return !this.isEncrypted()
      || moment().isAfter(this._nextPairVerify);
  }

  isEncrypted() {
    return this._decryptKey != undefined
      && this._encryptKey != undefined;
  }

  reset() {
    this._encryptKey = undefined;
    this._encryptNonce = 0;
    this._decryptKey = undefined;
    this._decryptNonce = 0;
    this._nextPairVerify = undefined;
  }

  setSessionKeys(keys) {
    // this.log(`Setup encryption keys ${JSON.stringify(keys)}`);
    this._decryptKey = keys.decryptKey;
    this._decryptNonce = 0;
    this._encryptKey = keys.encryptKey;
    this._encryptNonce = 0;
    this._nextPairVerify = moment().add(15, 's');
  }
};

module.exports = HapBleSessionCrypto;