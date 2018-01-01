"use strict";

const inherits = require('util').inherits;
const AccessoryDatabase = require('./hap/AccessoryDatabase');
const HapExecutor = require('./hap/HapExecutor');

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

    this._isReachable = true; // We did discover the device, so it must be reachable
    this._device;
    this._services = [];

    /**
     * Create default services for the accessory:
     * 
     * - Accessory Information Service (tbd)
     * - Bridging State Service
     * 
     */
    this.createServices(this.api);
  }

  async assignDevice(device) {
    this._device = device;

    this.accessoryDatabase = await AccessoryDatabase.create(this.api, device);
    this.hapExecutor = new HapExecutor(this.log, device, this.accessoryDatabase);

    // Build the service list first
    const services = this.accessoryDatabase.services
      .map(service => {
        this.log(`Publishing BLE service ${service.UUID}`);
        return new Service.ProxyService(this.api, this.log, this.hapExecutor, service);
      });

    this._services = this._services.concat(services);

    if (!this._device.isPaired) {
      this.log(`Device is not paired yet, pairing now.`);

      const pairSetup = new PairSetup(this.log, this.accessoryDatabase, this.config.pin);
      this.hapExecutor.run(pairSetup)
        .then(result => {
          this.accessoryDatabase.pairing = result;
          this.accessoryDatabase.save();
          this._device.disconnect();
          this.log(`Pairing completed.`);
        })
        .catch(e => {
          this.log(`Pairing failed: ${JSON.stringify(e)}`, e);
        });
    }

    this._device.on('disconnected-event', this._handleDisconnectedDeviceEvents.bind(this));
    this._device.on('connected-event', this._handleNotification.bind(this));

    this.log(`Accessory found.`);
  }

  _handleDisconnectedDeviceEvents() {
    // Any of the characteristics exposed by the device has changed. To reflect
    // this over IP, we have to connect to the device and read all
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
    return this._services.filter(service => !service.isHidden);
  }

  createServices(homebridge) {
    this._services.push(this.getBridgingStateService());
  }

  getBridgingStateService() {
    this._bridgingService = new Service.BridgingState();

    this._bridgingService.getCharacteristic(Characteristic.Reachable)
      .on('get', this._getReachable.bind(this))
      .updateValue(this._isReachable);

    return this._bridgingService;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);

    // Look up the accessory information service, identify Characteristic
    // from the accessory database and write a '1' in there.
    const svc = this._getService(Service.AccessoryInformation.UUID);
    if (svc) {
      const c = svc.getCharacteristic(Characteristic.Identify);
      c.setValue(true, callback);
    }
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
