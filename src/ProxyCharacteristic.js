
const inherits = require('util').inherits;
const UUIDFormatter = require('./UUIDFormatter');

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;

    class ProxyCharacteristic {
      constructor(log, accessor, hapProps) {
        Characteristic.call(this, '', hapProps.characteristic);

        this.log = log;

        this._accessor = accessor;
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
        this.on('subscribe', this._subscribeCharacteristic.bind(this));
        this.on('unsubscribe', this._unsubscribeCharacteristic.bind(this));
      }

      _setCharacteristicValue(value, callback) {
        this.log(`Setting characteristic ${this.UUID} to ${value}`);

        this._accessor.writeCharacteristic(this._hapProps, value)
          .then(() => {
            callback(undefined);
          })
          .catch(reason => {
            callback(reason);
          });
      }

      _getCharacteristicValue(callback) {
        this.log(`Returning characteristic ${this.UUID}`);

        this._accessor.readCharacteristic(this._hapProps)
          .then(value => {
            callback(undefined, value);
          })
          .catch(reason => {
            callback(reason);
          });
      }

      _subscribeCharacteristic() {
        this._accessor.subscribeCharacteristic(this._hapProps);
      }

      _unsubscribeCharacteristic() {
        this._accessor.unsubscribeCharacteristic(this._hapProps);
      };

      notificationPending() {
        this._accessor.readCharacteristic(this._hapProps)
          .then(value => {
            this.log(`Issueing HomeKit notification for characteristic ${this.UUID} with changed value ${value}`);
            this.updateValue(value);
          })
          .catch(reason => {
            this.log(`Failed to update characteristic ${this.UUID} in response to notification.`);
          });
      }
    };

    Characteristic.ProxyCharacteristic = ProxyCharacteristic;
    inherits(Characteristic.ProxyCharacteristic, Characteristic);
  }
}
