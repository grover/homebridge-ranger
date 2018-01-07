
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

    noble.on('stateChange', this._onNobleStateChanged.bind(this));
    this.api.on('didFinishLaunching', this._didFinishLaunching.bind(this));
  }

  _onNobleStateChanged(state) {
    if (state === 'poweredOn') {
      this._hapBrowser.start();
    }
  }

  _createAccessories() {
    const { devices } = this.config;

    const isRemoving = this._isRemovingAccessories();

    this._accessories = devices
      .map(device => {
        if (isRemoving && device.remove !== true) {
          this.log(`Ignoring device ${device.name} as it's not to be removed.`);
          return undefined;
        }

        this.log(`Found device in config: "${device.name}"`);
        if (this._devices[device.address]) {
          throw new Error('Multiple accessories configured with the same MAC address.');
        }

        const accessory = new BleAccessory(this.api, this.log, noble, device);
        this._devices[device.address] = accessory;
        return accessory;
      })
      .filter(device => device !== undefined);
  }

  _isRemovingAccessories() {
    const isRemoving = this.config.devices.some(device => device.remove === true);
    return isRemoving;
  }

  _didFinishLaunching() {
    this.log('DidFinishLaunching');
  }

  accessories(callback) {
    // Save the callback, we'll need it later :)
    this._accessoriesCallback = callback;
    this._tryToPublish();
  }

  async _onHapAccessoryDiscovered(device) {
    var accessoryForDevice = this._devices[device.address];
    if (!accessoryForDevice) {
      // No accessory configured for the device, ignore it completely
      device.ignore = true;
      return;
    }

    if (accessoryForDevice.hasPeripheral() === false) {
      accessoryForDevice.assignPeripheral(device);
      await this._tryToPublish();
    }
  }

  async _tryToPublish() {
    const allFound = this._allDevicesFound();
    if (allFound) {
      await this._startAccessories();
      this._publishAccessories();
    }
    else {
      this.log(`Not all accessories have their devices. Not publishing yet.`);
    }
  }

  _allDevicesFound() {
    return this._accessories.every(accessory => {
      if (!accessory.hasPeripheral()) {
        this.log(`Waiting for accessory: ${accessory.name}`);
      }

      return accessory.hasPeripheral();
    });
  }

  async _stopScanning() {
    this._hapBrowser.stop();
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
  }

  async _startAccessories() {
    for (let accessory of this._accessories) {
      await accessory.start();
    }
  }

  _publishAccessories() {
    if (this._isRemovingAccessories()) {
      // Do not announce accessories to force restart of homebridge after removal.
      return;
    }

    if (this._accessoriesCallback) {
      this._accessoriesCallback(this._accessories);
      this._accessoriesCallback = undefined;
    }
  }
}