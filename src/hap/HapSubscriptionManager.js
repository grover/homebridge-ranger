"use strict";

class HapSubscriptionManager {

  constructor(log, noble, accessory, accessoryDatabase, device, executor) {
    this.log = log;
    this.noble = noble;
    this.accessory = accessory;
    this.accessoryDatabase = accessoryDatabase;
    this.device = device;

    this._activeSubscriptions = [];

    executor.on('secureSessionEstablished', this._onSecureSessionEstablished.bind(this));
    this.device.on('disconnected-event', this._handleDisconnectedDeviceEvents.bind(this));
    this.noble._bindings.on('read', this._handlePotentialNotification.bind(this));
  }

  _onSecureSessionEstablished(state) {
    this._enableAllSubscriptions();
  }

  _handleDisconnectedDeviceEvents() {
    // At least one of the characteristics exposed by the peripheral has changed. To reflect
    // this over IP, we have to connect to the peripheral and read all characteristics, which
    // have an indicate bit set in order to issue a change event via Homebridge.
    this.accessoryDatabase.services.forEach(svc => {
      svc.characteristics.forEach(c => {
        if (this._supportsDisconnectedEvents(c) && this._isSubscribed(c.address)) {
          // Potential candidate for a disconnected notification
          this._handleNotification(c.address);
        }
      });
    });
  }

  _isSubscribed(address) {
    this._activeSubscriptions.indexOf(address) !== -1;
  }

  _handleNotification(address) {
    this.log(`Handle notification of ${address.service}:${address.characteristic}`);

    // We know the specific characteristic that caused the change. Query it directly.
    const characteristic = this.accessory.getCharacteristic(address);
    if (characteristic) {
      /**
       * Refreshing the cached value causes the event to be sent too.
       */
      characteristic.refreshCachedValue();
    }
  }

  subscribe(address) {
    this.log(`Subscribe ${address.service}:${address.characteristic}`);

    this._activeSubscriptions.push(address);
    this._enableSubscription(address);
  }

  unsubscribe(address) {
    this.log(`Unsubscribe ${address.service}:${address.characteristic}`);
    const subscription = this._activeSubscriptions.indexOf(address);
    if (subscription !== -1) {
      this._activeSubscriptions.splice(subscription, 1);
    }

    this._disableSubscription(address);
  }

  _disableSubscription(address) {
    if (this.device.state === 'connected') {
      this.device.unsubscribeCharacteristic(address);
    }
  }

  _enableAllSubscriptions() {
    this.log('Enable all subscriptions on the device.');
    this._activeSubscriptions.forEach(address => {
      this._enableSubscription(address);

      // Trigger immediate notification to update state
      const supportsOnlyConnectedEvents = this._supportsOnlyConnectedEvents(address);
      if (supportsOnlyConnectedEvents) {
        this._handleNotification(address);
      }
    });
  }

  _enableSubscription(address) {
    if (this.device.state === 'connected') {
      this.device.subscribeCharacteristic(address);
    }
  }

  _supportsOnlyConnectedEvents(address) {
    const characteristic = this.accessoryDatabase.getCharacteristic(address);
    return !this._supportsDisconnectedEvents(characteristic)
      && this._supportsConnectedEvents(characteristic);
  }

  _supportsDisconnectedEvents(c) {
    return ((c.hapCharacteristicProperties & 0x100) === 0x100);
  }

  _supportsConnectedEvents(c) {
    return ((c.hapCharacteristicProperties & 0x80) === 0x80);
  }

  _handlePotentialNotification(peripheralUuid, serviceUuid, characteristicUuid, data, isNotification) {
    if (peripheralUuid === this.device.uuid) {
      if (isNotification || !data || data.length === 0) {
        const address = {
          service: serviceUuid,
          characteristic: characteristicUuid
        };

        this.log(`Connected event on ${address.service}:${address.characteristic}`);
        this._handleNotification(address);
      }
    }
  }
};

module.exports = HapSubscriptionManager;
