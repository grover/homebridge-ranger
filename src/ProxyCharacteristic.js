
const inherits = require('util').inherits;
const UUIDFormatter = require('./UUIDFormatter');

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;

    class ProxyCharacteristic {
      constructor(log, accessor, hapProps, subscriptionManager) {
        Characteristic.call(this, '', hapProps.characteristic);

        this.log = log;

        this._accessor = accessor;
        this._hapProps = hapProps;
        this._subscriptionManager = subscriptionManager;

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

        if (!hapProps.ev) {
          this.on('get', this._getCharacteristicValue.bind(this));
        }

        this.on('set', this._setCharacteristicValue.bind(this));
        this.on('subscribe', this._subscribeCharacteristic.bind(this));
        this.on('unsubscribe', this._unsubscribeCharacteristic.bind(this));
      }

      _setCharacteristicValue(value, callback) {
        this._accessor.writeCharacteristic(this._hapProps, value)
          .then(() => {
            callback(undefined);
          })
          .catch(reason => {
            callback(reason);
          });
      }

      _getCharacteristicValue(callback) {
        this._accessor.readCharacteristic(this._hapProps)
          .then(value => {
            callback(undefined, value);
          })
          .catch(reason => {
            callback(reason);
          });
      }

      _subscribeCharacteristic() {
        this._subscriptionManager.subscribe(this._hapProps.address);
      }

      _unsubscribeCharacteristic() {
        this._subscriptionManager.unsubscribe(this._hapProps.address);
      };

      refreshCachedValue() {
        this.log.events('Refreshing %s:%s', this._hapProps.address.service, this._hapProps.address.characteristic);
        this._accessor.readCharacteristic(this._hapProps)
          .then(value => {
            this.updateValue(value);
          })
          .catch(reason => {
            this.log.error('Failed to refresh characteristic %s:%s', this._hapProps.address.service, this._hapProps.address.characteristic);
          });
      }
    };

    Characteristic.ProxyCharacteristic = ProxyCharacteristic;
    inherits(Characteristic.ProxyCharacteristic, Characteristic);
  }
}
