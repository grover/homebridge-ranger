const EventEmitter = require('events').EventEmitter;

class HapBleBrowser extends EventEmitter {

  constructor(log, noble) {
    super();

    this.log = log;
    this.noble = noble;

    this._shouldScan = false;
    this._isScanning = false;
    this._suspended = 0;
    this._devices = {};

    this.noble.on('stateChange', this._onNobleStateChanged.bind(this));
    this.noble.on('discover', this._onBleDeviceDiscovered.bind(this));
    this.noble.on('scanStop', this._onScanStopped.bind(this));
  }

  start() {
    if (this._shouldScan === false) {
      this._scan();
      this._shouldScan = true;
    }
  }

  _scan() {
    if (this._nobleState === 'poweredOn' && this._shouldScan === true && this._suspended === 0 && this._isScanning === false) {
      this.log('Starting to scan for bluetooth devices');
      this.noble.startScanning([], true);
      this._isScanning = true;
    }
  }

  stop() {
    if (this._shouldScan) {
      this._shouldScan = false;
      this._stop();
    }
  }

  _stop() {
    if (this._isScanning) {
      this.log('Stopped to scan for BLE HomeKit accessories');
      this.noble.stopScanning();
      this._isScanning = false;
      this._devices = {};
    }
  }

  suspend() {
    this._suspended++;
    this.log(`Suspending BLE discovery: suspended=${this._suspended}`);
    if (this._suspended === 1) {
      this._stop();
    }
  }

  resume() {
    this._suspended--;
    this.log(`Resumed BLE discovery: suspended=${this._suspended}`);
    if (this._suspended === 0) {
      setTimeout(() => this._scan(), 1000);
    }
  }

  _onBleDeviceDiscovered(peripheral) {
    this.emit('discovered', peripheral);
  }

  _onScanStopped() {
    /**
     * RPi Zero W stops scanning once a connection has been established. We make sure that
     * we keep scanning here to receive disconnected events in the future. Additionally
     * we can't aggressively restart scanning as that interferes with the establishment of
     * accessory connections. Since they're of higher importance than "disconnected events",
     * as the connection is established to influence something, we hold of for 2s.
     */
    const DelayScanRestart = 2000;


    if (this._shouldScan === true && this._isScanning === true && this._suspended === 0) {
      this.log(`Scanning stopped externally. Restarting in ${DelayScanRestart / 1000}s.`);
      setTimeout(() => this._scan(), DelayScanRestart);
    }
  }

  _onNobleStateChanged(nobleState) {
    this._nobleState = nobleState;
    this._scan();
  }
};

module.exports = HapBleBrowser;