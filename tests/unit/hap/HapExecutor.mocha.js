"use strict";

const HapExecutor = require('../../../src/hap/HapExecutor');

const assert = require('chai').assert;
const sinon = require('sinon');

describe('HapExecutor', () => {

  let accessoryDatabase;
  let device;
  let executor;

  beforeEach(() => {
    accessoryDatabase = {
      getCharacteristic: () => {
        return 13;
      },
      pairing: {
        "rangerPairingID": "d3ca4078-2c92-4f5e-94b0-34dd22ae3039",
        "rangerLTSK": "4d2b74e6f74f3ee177b17df38a88a8881038194e7c509b1167753640c81b673fd962f9ea67754bd4c63a302febf575f3c0dc7df48d77eb5de1c307246dec22fd",
        "rangerLTPK": "d962f9ea67754bd4c63a302febf575f3c0dc7df48d77eb5de1c307246dec22fd",
        "accessoryPairingID": "8e077fbe-48ce-429a-a1b9-4f724725a6f1",
        "accessoryLTPK": "7c87f2dfd74df402ad2f3ee236230bc536dbd5c8fce6df35c533af56495d64a7"
      }
    };

    device = {
      name: 'Testdevice',
      state: 'connected',
      connect: () => { },
      disconnect: () => { },
      getCharacteristic: () => {
        return null;
      },
      write: () => {
        throw new Error('Disconnected')
      }
    };

    executor = new HapExecutor(console.log, device, accessoryDatabase);
  });

  it('Should throw an error if establishing the connection fails.', async () => {
    let _error;
    try {
      await executor._establishSecureConnection();
    }
    catch (e) {
      _error = e;
    }

    assert.isOk(_error);
    assert.match(_error.message, /Failed to establish connection to the device/);
  });

  it('Should reconnect again if connection is lost during reverification', async () => {
    const executeCommandStub = sinon.stub();
    executeCommandStub.onFirstCall().throws(new Error('Disconnected'));
    executeCommandStub.onSecondCall().returns({
      decryptKey: 'abc',
      encryptKey: 'def'
    });

    executor._executeCommand = executeCommandStub;
    const result = await executor._establishSecureConnection();

    assert.isOk(executeCommandStub.calledTwice);
    assert.isOk(result);
  });
});
