
const version = require('../package.json').version;

const noble = require('noble');

const HapBleBrowser = require('./hap/HapBleBrowser');

const BleAccessory = require('./BleAccessory');
const ProxyCharacteristic = require('./ProxyCharacteristic');
const ProxyService = require('./ProxyService');

const HOMEBRIDGE = {
  Accessory: null,
  Service: null,
  Characteristic: null,
  UUIDGen: null
};

const platformName = 'homebridge-ranger';
const platformPrettyName = 'Ranger';

module.exports = (homebridge) => {
  HOMEBRIDGE.Accessory = homebridge.platformAccessory;
  HOMEBRIDGE.Service = homebridge.hap.Service;
  HOMEBRIDGE.Characteristic = homebridge.hap.Characteristic;
  HOMEBRIDGE.UUIDGen = homebridge.hap.uuid;
  HOMEBRIDGE.homebridge = homebridge;

  homebridge.registerPlatform(platformName, platformPrettyName, RangerPlatform, false);

  ProxyCharacteristic.registerWith(homebridge.hap);
  ProxyService.registerWith(homebridge.hap);
}

const RangerPlatform = class {
  constructor(log, config, api) {
    this.log = log;
    this.log('Ranger Platform Plugin Loaded');
    this.config = config;
    this.api = api;

    this._accessories = [];
    this._remotes = [];
    this._devices = {};

    this._hapBrowser = new HapBleBrowser(this.log, noble);
    this._hapBrowser.on('discovered', this._onHapAccessoryDiscovered.bind(this));

    this._createAccessories();

    this.api.on('didFinishLaunching', this._didFinishLaunching.bind(this));
  }

  _createAccessories() {
    const { devices } = this.config;

    this._accessories = devices.map(device => {
      this.log(`Found device in config: "${device.name}"`);

      if (this._devices[device.address]) {
        throw new Error('Multiple accessories configured with the same MAC address.');
      }

      const accessory = new BleAccessory(this.api, this.log, device);
      this._devices[device.address] = accessory;
      return accessory;
    });
  }

  _didFinishLaunching() {
    this.log('DidFinishLaunching');
  }

  accessories(callback) {
    // Save the callback, we'll need it later :)
    this._accessoriesCallback = callback;
    this._publishAccessories();
  }

  async _onHapAccessoryDiscovered(device) {

    // New device
    this.log(`New HAP-BLE accessory ${device.name} Address=${device.address} RSSI=${device.rssi}dB state=${device.state} isPaired=${device.isPaired}`);

    var accessoryForDevice = this._devices[device.address];
    if (!accessoryForDevice) {
      // No accessory configured for the device
      return;
    }

    await accessoryForDevice.assignDevice(device);
    this._publishAccessories();
  }

  _publishAccessories() {
    if (this._accessoriesCallback) {
      const allFound = this._allDevicesFound();
      if (allFound) {
        this._accessoriesCallback(this._accessories);
      }
      else {
        this.log(`Not all accessories have their devices. Not publishing yet.`);
      }
    }
  }

  _allDevicesFound() {
    return this._accessories.every(accessory => {
      if (!accessory.hasDevice()) {
        this.log(`Waiting for accessory: ${accessory.name}`);
      }
      return accessory.hasDevice();
    });
  }
}