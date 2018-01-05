"use strict";

const inherits = require('util').inherits;
const AccessoryDatabase = require('./hap/AccessoryDatabase');

const HapExecutor = require('./hap/HapExecutor');
const HapCharacteristicAccessor = require('./hap/HapCharacteristicAccessor');
const HapSubscriptionManager = require('./hap/HapSubscriptionManager');
const DeviceWatcher = require('./hap/DeviceWatcher');

const PairSetup = require('./hap/pairing/PairSetup');

let Characteristic, Service;

const ServiceBlacklist = [
  '0000003E-0000-1000-8000-0026BB765291', // Accessory Information
  '00000062-0000-1000-8000-0026BB765291', // BridgingState Service
  '00000055-0000-1000-8000-0026BB765291', // HAP-BLE Pairing Service
  '000000A2-0000-1000-8000-0026BB765291', // HAP-BLE Protocol Information Service
];


class BleAccessory {

  constructor(api, log, noble, config) {
    this.api = api;

    Characteristic = this.api.hap.Characteristic;
    Service = this.api.hap.Service;

    this.log = log;
    this.name = config.name;

    this.config = config;
    if (this.config.reachability === undefined) {
      this.config.reachability = true;
    }
    if (this.config.reachabilityTimeout === undefined) {
      this.config.reachabilityTimeout = 30000;
    }
    if (this.config.rssi === undefined) {
      this.config.rssi = false;
    }

    this._isReachable = false;
    this._noble = noble;
    this._peripheral;
    this._services = [];
    this._started = false;

    this._createServices(this.api);
  }

  assignPeripheral(peripheral) {

    this._peripheral = peripheral;
    if (this.config.rssi) {
      this._peripheral.on('rssi', this._rssiChanged.bind(this));
    }

    if (this.config.reachability) {
      this._watcher = new DeviceWatcher(this.log, this.name, this.config.reachabilityTimeout);
      this._watcher.on('visible', this._setReachable.bind(this));
      this._peripheral.on('manufacturerData', this._updateWatcher.bind(this));
      this._updateWatcher(peripheral.manufacturerData);
    }
    else {
      // Simulate reachability if not requested
      this._setReachable(true);
    }

    this.log(`Accessory '${this.name}' found.`);
  }

  _updateWatcher(data) {
    this._watcher.seen();
  }

  _rssiChanged(rssi, diff) {
    // Ignore 1dB changes
    if (diff > 1) {
      this.log(`${this.name}: rrsi=${this._peripheral.rssi}dB`);
    }
  }

  async start() {
    this.accessoryDatabase = await AccessoryDatabase.create(this.api, this._peripheral);
    this.hapExecutor = new HapExecutor(this.log, this._peripheral, this.accessoryDatabase);
    this.hapAccessor = new HapCharacteristicAccessor(this.log, this.hapExecutor);
    this.subscriptionManager = new HapSubscriptionManager(
      this.log, this._noble, this, this.accessoryDatabase, this._peripheral, this.hapExecutor);

    await this._ensureDeviceIsPaired();
    await this._refreshAccessoryInformation();
    await this._createServiceAndCharacteristicsProxies();
    await this._refreshAllCharacteristics();
    this._started = true;
  }

  hasPeripheral() {
    return this._peripheral !== undefined;
  }

  async _ensureDeviceIsPaired() {
    if (!this._peripheral.isPaired) {
      this.log(`Device is not paired yet, pairing now.`);

      let attempt = 1;
      let paired = this._peripheral.isPaired;

      for (let attempt = 1; paired === false && attempt < 4; attempt++) {
        paired = await this._pairDevice();
        if (!paired) {
          this.log(`Failed pairing attempt #${attempt}, waiting 1s and trying again.`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (paired == false) {
        this.log(`Failed to pair with device ${this.name} after third attempt. Halting.`);
      }
      else {
        this.log(`Pairing completed.`);
      }
    }
  }

  async _pairDevice() {
    const pairSetup = new PairSetup(this.log, this.accessoryDatabase, this.config.pin);
    try {
      const result = await this.hapExecutor.run(pairSetup);
      this.accessoryDatabase.pairing = result;
      this.accessoryDatabase.save();
      this._peripheral.disconnect();
    }
    catch (e) {
      this.log(`Pairing failed: ${JSON.stringify(e)}`, e);
      return false;
    }

    return true;
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

  /**
   * This updates the Charactistic.value to match the actual values on the devices.
   */
  async _refreshAllCharacteristics() {
    this._services
      .filter(svc => ServiceBlacklist.indexOf(svc.UUID) === -1)
      .forEach(svc => {
        svc.characteristics
          .filter(c => this._isRefreshableCharacteristic(c))
          .forEach(c => {
            c.refreshCachedValue();
          });
      });
  }

  _isRefreshableCharacteristic(c) {
    return c instanceof Characteristic.ProxyCharacteristic
      && c.props.format !== 'data'
      && c.props.format !== 'tlv8';
  }

  _createServiceAndCharacteristicsProxies() {
    const services = this.accessoryDatabase.services
      .filter(svc => !ServiceBlacklist
        .includes(svc.UUID))
      .map(service => {
        this.log(`Publishing BLE service ${service.UUID} via proxy`);
        return new Service.ProxyService(this.api, this.log, this.hapAccessor, this.subscriptionManager, service);
      });

    this._services = this._services.concat(services);
  }

  getCharacteristic(address) {
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
    this.log(`Reported reachability for ${this.name}: ${state}`);
    if (this._isReachable === state) {
      return;
    }

    this._isReachable = state;

    this._bridgingService.getCharacteristic(Characteristic.Reachable)
      .updateValue(this._isReachable);

    if (this._started && this._isReachable) {
      // In case the device has been gone, we should refresh 
      // the cached state
      this._refreshAllCharacteristics();
    }
  }
}

module.exports = BleAccessory;
