const EventEmitter = require('events').EventEmitter;
const ManufacturerDataParser = require('./ManufacturerDataParser');
const HapBleDevice = require('./HapBleDevice');
const chalk = require('chalk');

class HapBleBrowser extends EventEmitter {

  constructor(log, noble) {
    super();

    this.log = log;
    this.noble = noble;
    this._isScanning = false;
    this._devices = {};

    this.noble.on('stateChange', this._onNobleStateChanged.bind(this));
    this.noble.on('discover', this._onBleDeviceDiscovered.bind(this));
  }

  _onNobleStateChanged(state) {
    if (state === 'poweredOn') {
      if (!this._isScanning) {
        this.log('Starting to scan for BLE HomeKit accessories');
        // Need repetetive reports for the same device to detect the GSN for
        // disconnected events in order to update HomeKit about changes in
        // those characteristics.
        this.noble.startScanning([], true);
        this._isScanning = true;
      }
    }
    else if (this._isScanning) {
      this.noble.stopScanning();
      this._devices = {};
    }

    this.emit(state);
  }

  _onBleDeviceDiscovered(peripheral) {
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
    let device = this._devices[peripheral.id];
    if (device && device.ignore == false) {
      // Update manufacturerData to enable disconnected notifications
      device.updateManufacturerData(data);

      if (device.rssi != peripheral.rssi) {
        const diff = Math.abs(device.rssi - peripheral.rssi);

        // Ignore 1dB changes
        if (diff > 1) {
          device.rssi = peripheral.rssi;
          this.log(`${device.name}: rrsi=${device.rssi}dB`);
        }
      }
    }

    return device !== undefined;
  }

  _addDevice(peripheral, data) {
    const device = new HapBleDevice(this.log, peripheral, data);
    this._devices[peripheral.id] = device;

    if (device.isPaired) {
      this.log(`Found paired accessory ${device.name} address=${device.address} rssi=${device.rssi}dB`);
    }
    else {
      this.log(chalk.yellowBright(`Found unpaired accessory ${device.name} address=${device.address} rssi=${device.rssi}dB`));
    }

    this.emit('discovered', device);
  }
};

module.exports = HapBleBrowser;