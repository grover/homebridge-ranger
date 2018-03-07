
const version = require('../package.json').version;

const noble = require('noble');

const HapBleBrowser = require('./hap/HapBleBrowser');
const ManufacturerDataParser = require('./hap/ManufacturerDataParser');

const BleAccessory = require('./BleAccessory');
const ProxyCharacteristic = require('./ProxyCharacteristic');
const ProxyService = require('./ProxyService');

const HapBleDevice = require('./hap/HapBleDevice');
const chalk = require('chalk');

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

    this._macToAccessory = {};
    this._devices = {};

    this._hapBrowser = new HapBleBrowser(this.log, noble);
    this._hapBrowser.on('discovered', this._onBluetoothDeviceDiscovered.bind(this));

    this._createAccessories();

    this.api.on('didFinishLaunching', this._didFinishLaunching.bind(this));
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
        if (this._macToAccessory[device.address]) {
          throw new Error('Multiple accessories configured with the same MAC address.');
        }

        const accessory = new BleAccessory(this.api, this.log, noble, device);
        this._macToAccessory[device.address] = accessory;
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
    this._hapBrowser.start();
  }

  accessories(callback) {
    // Save the callback, we'll need it later :)
    this._accessoriesCallback = callback;
    this._tryToPublish();
  }

  async _onBluetoothDeviceDiscovered(peripheral) {
    var accessoryForDevice = this._macToAccessory[peripheral.address];
    if (!accessoryForDevice) {
      return;
    }


    if (peripheral.advertisement.manufacturerData) {
      const data = ManufacturerDataParser(peripheral.advertisement.manufacturerData);
      if (data.isHAP) {
        if (this._ensureMacAddressIsAvailable(peripheral)) {
          if (this._updateDevice(peripheral, data) === false) {
            this._addDevice(peripheral, data);
          }
        }
      }
    }
  }

  _ensureMacAddressIsAvailable(peripheral) {
    // Mac specific hack :(
    if (peripheral.address === 'unknown' && peripheral.advertisement.localName !== 'unknown') {
      // CoreBluetooth doesn't have the address in its cache, connect to it once
      // to ensure the address is available.
      peripheral.connect((error) => {
        if (!error) {
          peripheral.disconnect();
        }
      });

      return false;
    }

    return true;
  }

  _updateDevice(peripheral, data) {
    let device = this._devices[peripheral.address];
    if (device) {
      // Update manufacturerData to enable disconnected notifications
      device.updateManufacturerData(data);
      device.updateRSSI(peripheral.rssi);
    }

    return device !== undefined;
  }


  _addDevice(peripheral, data) {
    const device = new HapBleDevice(this.log, peripheral, data, this._hapBrowser);
    this._devices[peripheral.address] = device;

    if (device.isPaired) {
      this.log(`Found paired accessory ${device.name} address=${device.address} rssi=${device.rssi}dB`);
    }
    else {
      this.log(chalk.yellowBright(`Found unpaired accessory ${device.name} address=${device.address} rssi=${device.rssi}dB`));
    }

    this._onHapAccessoryDiscovered(device);
  }

  async _onHapAccessoryDiscovered(device) {
    const accessoryForDevice = this._macToAccessory[device.address];

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
      await accessory.start(this._hapBrowser);
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