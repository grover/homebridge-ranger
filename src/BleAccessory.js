"use strict";

const inherits = require('util').inherits;
const AccessoryDatabase = require('./hap/AccessoryDatabase');

const HapExecutor = require('./hap/HapExecutor');
const HapCharacteristicAccessor = require('./hap/HapCharacteristicAccessor');

const PairSetup = require('./hap/pairing/PairSetup');

let Characteristic, Service;

class BleAccessory {

  constructor(api, log, config) {
    this.api = api;

    Characteristic = this.api.hap.Characteristic;
    Service = this.api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.config = config;

    this._isReachable = true; // We did discover the peripheral, so it must be reachable
    this._peripheral;
    this._services = [];

    this._createServices(this.api);
  }

  assignPeripheral(peripheral) {
    this._peripheral = peripheral;
    this.log(`Accessory '${this.name}' found.`);
  }

  async start() {
    this.accessoryDatabase = await AccessoryDatabase.create(this.api, this._peripheral);
    this.hapExecutor = new HapExecutor(this.log, this._peripheral, this.accessoryDatabase);
    this.hapAccessor = new HapCharacteristicAccessor(this.log, this.hapExecutor);

    await this._ensureDeviceIsPaired();
    await this._refreshAccessoryInformation();
    this._createServiceAndCharacteristicsProxies();

    this._peripheral.on('disconnected-event', this._handleDisconnectedDeviceEvents.bind(this));
    this._peripheral.on('connected-event', this._handleNotification.bind(this));
  }

  hasPeripheral() {
    return this._peripheral !== undefined;
  }

  async _ensureDeviceIsPaired() {
    if (!this._peripheral.isPaired) {
      this.log(`Device is not paired yet, pairing now.`);

      const pairSetup = new PairSetup(this.log, this.accessoryDatabase, this.config.pin);
      try {
        const result = await this.hapExecutor.run(pairSetup);
        this.accessoryDatabase.pairing = result;
        this.accessoryDatabase.save();
        this._peripheral.disconnect();
        this.log(`Pairing completed.`);
      }
      catch (e) {
        this.log(`Pairing failed: ${JSON.stringify(e)}`, e);
        throw e;
      }
    }
  }

  async _refreshAccessoryInformation() {
    /**
     * 
     * Unfortunately Homebridge/HAP-NodeJS is treating this service in a
     * stupidly special way, which prevents us from running the regular 
     * proxying for it.
     * 
     */

    const accessoryInformationService = '0000003e0000100080000026bb765291';
    const characteristicsToMove = [
      { ble: '000000200000100080000026bb765291', characteristic: Characteristic.Manufacturer },
      { ble: '000000210000100080000026bb765291', characteristic: Characteristic.Model },
      { ble: '000000230000100080000026bb765291', characteristic: Characteristic.Name },
      { ble: '000000300000100080000026bb765291', characteristic: Characteristic.SerialNumber },
      { ble: '000000520000100080000026bb765291', characteristic: Characteristic.FirmwareRevision },
      { ble: '000000530000100080000026bb765291', characteristic: Characteristic.HardwareRevision },
      //{ ble: '000000a60000100080000026bb765291', characteristic: Characteristic.AccessoryFlags }
    ];

    for (let i = 0; i < characteristicsToMove.length; i++) {
      const c = characteristicsToMove[i];
      const address = {
        service: accessoryInformationService,
        characteristic: c.ble
      };

      const characteristic = this._accessoryInformationService.getCharacteristic(c.characteristic);

      const hapProps = this.accessoryDatabase.getCharacteristic(address);
      if (hapProps) {
        try {
          const value = await this.hapAccessor.readCharacteristic(hapProps);
          this.log(`Retrieved accessory information ${characteristic.displayName}=${value}`);
          characteristic.setValue(value);
        }
        catch (e) {
          // Ignore characteristics that fail - for now.
          this.log(`Failed to retrieve characteristic ${characteristic.displayName} for accessory information.`);
        }
      }
    };
  }

  _createServiceAndCharacteristicsProxies() {
    const blacklist = [
      Service.AccessoryInformation.UUID,
      '00000055-0000-1000-8000-0026BB765291', // HAP-BLE Pairing Service
      '000000A2-0000-1000-8000-0026BB765291', // HAP-BLE Protocol Information Service
    ];

    const services = this.accessoryDatabase.services
      .filter(svc => !blacklist.includes(svc.UUID))
      .map(service => {
        this.log(`Publishing BLE service ${service.UUID} via proxy`);
        return new Service.ProxyService(this.api, this.log, this.hapAccessor, service);
      });

    this._services = this._services.concat(services);
  }

  _handleDisconnectedDeviceEvents() {
    // Any of the characteristics exposed by the peripheral has changed. To reflect
    // this over IP, we have to connect to the peripheral and read all
    // characteristics, which have an indicate bit set in order to issue a
    // change event via Homebridge.

    this.accessoryDatabase.services.forEach(svc => {
      svc.characteristics.forEach(c => {
        if (c.ev) {
          // Potential candidate for a disconnected notification
          this._handleNotification(c.address);
        }
      });
    });
  }

  _handleNotification(address) {
    // We know the specific characteristic that caused the change. Query it
    // directly.
    const characteristic = this._getCharacteristic(address);
    if (characteristic) {
      characteristic.notificationPending();
    }
  }

  _getCharacteristic(address) {
    const service = this._services.find(svc => svc.address === address.service);
    if (service) {
      const characteristic = service.characteristics.find(c => c.address === address.characteristic);
      return characteristic;
    }

    return undefined;
  }

  getServices() {
    return this._services;
  }

  _createServices(homebridge) {
    this._services.push(
      this._getAccessoryInformationService(),
      this._getBridgingStateService()
    );
  }

  _getAccessoryInformationService() {
    this._accessoryInformationService = new Service.AccessoryInformation();
    return this._accessoryInformationService;
  }

  _getBridgingStateService() {
    this._bridgingService = new Service.BridgingState();

    this._bridgingService.getCharacteristic(Characteristic.Reachable)
      .on('get', this._getReachable.bind(this))
      .updateValue(this._isReachable);

    return this._bridgingService;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);

    const address = {
      service: '0000003e0000100080000026bb765291',
      characteristic: '000000140000100080000026bb765291'
    };

    const hapProps = this.accessoryDatabase.getCharacteristic(address);
    if (!hapProps) {
      this.log('Failed to locate Identify characteristic.');
      callback(undefined);
    }

    // HACK: Force this characteristic to a boolean
    // Elgato Eve Firmware 1.3.1 reports the Identify characteristic as a TLV8.
    // TODO: Should AccessoryDatabase force known/predefined characteristics to
    // their respective type?
    hapProps.format = 'bool';

    this.hapAccessor.writeCharacteristic(hapProps, true)
      .then(() => {
        callback(undefined);
      })
      .catch(e => {
        callback(e);
      });
  }

  _getService(uuid) {
    return this._services.find(svc => svc.UUID === uuid);
  }

  _getReachable(callback) {
    this.log(`Returning reachability state: ${this._isReachable}`);
    callback(undefined, this._isReachable);
  }

  _setReachable(state) {
    if (this._isReachable === state) {
      return;
    }

    this._isReachable = state;

    this._bridgingService.getCharacteristic(Characteristic.Reachable)
      .updateValue(this._isReachable);
  }
}

module.exports = BleAccessory;
