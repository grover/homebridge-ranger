const EventEmitter = require('events').EventEmitter;
const ManufacturerDataParser = require('./ManufacturerDataParser');
const HapBleDevice = require('./HapBleDevice');

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

        let device = this._devices[peripheral.id];
        if (device) {
          // Update manufacturerData
          device.updateManufacturerData(data);
        }
        else {
          const device = new HapBleDevice(this.log, peripheral, data);
          this._devices[peripheral.id] = device;

          this.emit('discovered', device);
        }
      }
    }
  }
};

module.exports = HapBleBrowser;