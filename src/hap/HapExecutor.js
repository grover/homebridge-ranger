"use strict";

const SequentialTaskQueue = require('sequential-task-queue').SequentialTaskQueue;

const TLV8Encoder = require('./Tlv8Encoder');
const TLV8Decoder = require('./Tlv8Decoder');
const PairVerify = require('./pairing/PairVerify');

const HapBleSessionCrypto = require('./HapBleSessionCrypto');

class HapExecutor {

  constructor(log, device, accessoryDatabase) {
    this.log = log;

    this._accessoryDatabase = accessoryDatabase;
    this._device = device;
    this._queue = new SequentialTaskQueue();
    this._sessionCrypto = new HapBleSessionCrypto(log);
    this._transactionId = Math.floor(Math.random() * 255);
  }

  /**
   * Runs the command in its entirety in sequence with
   * other commands issued by HomeKit.
   * 
   * @param {*} cmd 
   */
  run(cmd) {
    return this._queue.push(async () => {
      await this._establishSecureConnection();
      const result = await this._executeCommand(cmd);
      return result;
    });
  }

  async _executeCommand(cmd) {
    while (cmd.hasMoreRequests()) {
      // request is a structure with op, address, cid and payload
      const request = cmd.getRequest();
      const c = this._device.getCharacteristic(request.address);
      const transactionId = this._transactionId++ % 255;

      // Encode the payload and build the payload fragments
      // TODO: TLV8Encoder should obey max. payload size and build fragments
      const payload = TLV8Encoder.encode(request.payload);
      if (payload.length > 505) {
        throw new Error('Tx packet fragmentation not implemented.');
      }

      const packet = this._buildPacket(request.opcode, transactionId, request.cid, payload);
      const encryptedPacket = this._encryptTxPacket(packet, !request.insecure);

      // TODO: Iterate over the fragments
      await this._device.write(c, encryptedPacket);

      // TODO: Iterate over response fragments
      let responsePayload = await this._read(c, request.insecure, transactionId);
      const response = TLV8Decoder.decode(responsePayload);
      cmd.handleResponse(response);
    }

    return cmd.getResult();
  }

  async _read(c, insecure, transactionId) {
    let payload = Buffer.alloc(0);
    while (true) {
      const rxPacket = await this._device.read(c);
      if (!rxPacket || rxPacket.length === 0) {
        break;
      }

      const decryptedPacket = this._decryptRxPacket(rxPacket, !insecure);
      const responsePayload = this._getResponsePayload(decryptedPacket, transactionId);
      payload = Buffer.concat([payload, responsePayload]);
    }

    return payload;
  }

  _buildPacket(op, transactionId, cid, payload) {
    payload = payload || [];

    const buffer = new Buffer(7 + payload.length);
    buffer.writeUInt8(0, 0);
    buffer.writeUInt8(op, 1);
    buffer.writeUInt8(transactionId, 2);
    buffer.writeUInt16LE(cid, 3);
    buffer.writeUInt16LE(payload.length, 5);
    buffer.set(payload, 7);

    return buffer;
  }

  _encryptTxPacket(packet, encrypt) {
    if (!this._sessionCrypto.isEncrypted() || !encrypt) {
      return packet;
    }

    // this.log(`Encrypt ${JSON.stringify(packet)}`);
    const encrypted = this._sessionCrypto.encrypt(packet);
    // this.log(`Encrypted ${JSON.stringify(encrypted)}`);
    return encrypted;
  }

  _decryptRxPacket(packet, encrypt) {
    if (!this._sessionCrypto.isEncrypted() || !encrypt) {
      return packet;
    }

    // this.log(`Decrypt ${JSON.stringify(packet)}`);
    const decrypted = this._sessionCrypto.decrypt(packet);
    // this.log(`Decrypted ${JSON.stringify(decrypted)}`);
    return decrypted;
  }

  _getResponsePayload(packet, transactionId) {
    let offset = 2;

    const ctl = packet.readUInt8(0);
    const tid = packet.readUInt8(1);

    if (tid != transactionId) {
      throw new Error('HAP-BLE response didn\'t match request transaction ID');
    }

    // Only valid if this is the first fragment
    const status = packet.readUInt8(2);
    if (status != 0x00) {
      // TODO: Use the proper status from the device!
      throw new Error(`HAP-BLE request failed with status ${status}`);
    }
    offset = 3;

    if (packet.length > 3) {
      const payloadLength = packet.readUInt16LE(offset);
      offset += 2;

      return packet.slice(offset);
    }

    return Buffer.alloc(0);
  }

  async _establishSecureConnection() {
    let isConnected = false;
    for (let i = 0; i < 2 && !isConnected; i++) {
      await this._connectToBleDevice();
      isConnected = await this._establishSessionSecurity();
    }

    if (!isConnected) {
      throw new Error('Failed to establish connection to the device');
    }

    return isConnected;
  }

  async _connectToBleDevice() {
    if (this._device.state !== 'connected') {
      this.log(`Connecting to ${this._device.name}`);
      this._sessionCrypto.reset();
      await this._device.connect();
      this.log(`Connected to ${this._device.name}`);
    }
  }

  async _establishSessionSecurity() {
    if (!this._hasPairingInformation()) {
      // No pairing information yet, skip establishing session security and
      // pretend that we're done.
      return true;
    }

    let isSecure = this._sessionCrypto.isSecureSessionValid();
    if (!isSecure) {
      this.log(`Securing connection to ${this._device.name}`);
      const pairVerify = new PairVerify(this.log, this._accessoryDatabase);
      try {
        const sessionKeys = await this._executeCommand(pairVerify);
        this._sessionCrypto.setSessionKeys(sessionKeys);
        this.log(`Secure connection to ${this._device.name} established.`);
        isSecure = true;
      }
      catch (e) {
        this._sessionCrypto.reset();
        await this._device.disconnect();
        this.log(`Failed to establish secure session to ${this._device.name}. Reason: ${e.message}`);
        isSecure = false;
      }
    }

    return isSecure;
  }

  _hasPairingInformation() {
    return this._accessoryDatabase && this._accessoryDatabase.pairing;
  }
};

module.exports = HapExecutor;
