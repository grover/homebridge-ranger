
const inherits = require('util').inherits;
const UUIDFormatter = require('./UUIDFormatter');

const TlvKeys = require('./hap/TlvKeys');

const FormatDecoders = require('./hap/formats/FormatDecoders');
const FormatEncoders = require('./hap/formats/FormatEncoders');

const WriteRequest = require('./hap/ops/WriteRequest');
const ReadRequest = require('./hap/ops/ReadRequest');

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;

    class ProxyCharacteristic {
      constructor(log, executor, hapProps) {
        Characteristic.call(this, '', hapProps.characteristic);

        this.log = log;

        this._executor = executor;
        this._hapProps = hapProps;

        const props = {
          format: hapProps.format,
          perms: hapProps.perms,
          ev: hapProps.ev
        };

        ['maxValue', 'minStep', 'minValue', 'unit'].forEach(item => {
          if (hapProps.hasOwnProperty(item)) {
            props[item] = hapProps[item];
          }
        });

        if (hapProps.hasOwnProperty('description')) {
          this.displayName = hapProps.description;
        }

        this.setProps(props);

        this.value = this.getDefaultValue();
        this.UUID = hapProps.characteristic;
        this.address = hapProps.address.characteristic;

        this.on('get', this._getCharacteristicValue.bind(this));
        this.on('set', this._setCharacteristicValue.bind(this));

        // TODO: Does this characteristic support events? If so, subscribe
        // to the events on the device (via GSN, when that changes.)
      }

      _setCharacteristicValue(value, callback) {
        this.log(`Setting characteristic ${this.UUID} to ${value}`);

        const dataBuffer = FormatEncoders.encode(this._hapProps.format, value);

        const payload = {};
        payload[TlvKeys.Value] = dataBuffer;

        const request = new WriteRequest(this._hapProps.address, this._hapProps.cid, payload);
        this._executor.run(request)
          .then(result => {
            try {
              this.log(`Successfully wrote characteristic ${this.UUID}`);
              callback(undefined);
            }
            catch (e) {
              this.log(`Homebridge callback issued an error: ${JSON.stringify(e)}`, e);
              callback(e);
            }
          })
          .catch(reason => {
            this.log(`Failed to write characteristic ${this.UUID}. Reason: ${reason}`, reason);
            callback(reason);
          });
      }

      async _getCharacteristicValue(callback) {
        this.log(`Returning characteristic ${this.UUID}`);

        this._readCharacteristic()
          .then(value => {
            callback(undefined, value);
          })
          .catch(reason => {
            callback(reason);
          });
      }

      notificationPending() {
        this._readCharacteristic()
          .then(value => {
            this.log(`Issueing HomeKit notification for characteristic ${this.UUID} with changed value ${value}`);
            this.updateValue(value);
          })
          .catch(reason => {
            this.log(`Failed to update characteristic ${this.UUID} in response to notification.`);
          });
      }

      _readCharacteristic() {
        return new Promise((resolve, reject) => {
          const request = new ReadRequest(this._hapProps.address, this._hapProps.cid, undefined);
          this._executor.run(request)
            .then(result => {
              try {
                const payload = result[TlvKeys.Value];
                const value = FormatDecoders.decode(this._hapProps.format, payload, 0, payload.length);
                this.log(`Value of characteristic ${this.UUID} is ${value}`);
                resolve(value);
              }
              catch (e) {
                this.log(`Homebridge callback issued an error: ${JSON.stringify(e)}`, e);
                reject(e);
              }
            })
            .catch(reason => {
              this.log(`Failed to read characteristic ${this.UUID}. Reason: ${reason}`, reason);
              reject(reason);
            });
        });
      }
    };

    Characteristic.ProxyCharacteristic = ProxyCharacteristic;
    inherits(Characteristic.ProxyCharacteristic, Characteristic);
  }
}
