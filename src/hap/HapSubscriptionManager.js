"use strict";

class HapSubscriptionManager {

  constructor(log, noble, accessory, accessoryDatabase, device) {
    this.log = log;
    this.noble = noble;
    this.accessory = accessory;
    this.accessoryDatabase = accessoryDatabase;
    this.device = device;

    this._activeSubscriptions = [];

    /**
     * There's no need to keep the device connection alive if the device supports disconnected 
     * events and all _activeSubscriptions support disconnected events. Once enabled, will
     * only be disabled after the last unsubscribe.
     */
    this._forceKeepAlives = false;

    this.device.on('stateChanged', this._onDeviceStateChanged.bind(this));

    // F*CK/TODO: Needs scanning to work while connected
    this.device.on('disconnected-event', this._handleDisconnectedDeviceEvents.bind(this));

    this.noble._bindings.on('read', this._handlePotentialNotification.bind(this));
  }

  _onDeviceStateChanged(state) {
    if (state === 'connected') {
      this._enableAllSubscriptions();
    }
  }

  _handleDisconnectedDeviceEvents() {
    // At least one of the characteristics exposed by the peripheral has changed. To reflect
    // this over IP, we have to connect to the peripheral and read all characteristics, which
    // have an indicate bit set in order to issue a change event via Homebridge.
    this.accessoryDatabase.services.forEach(svc => {
      svc.characteristics.forEach(c => {
        if (c.ev) {
          // Potential candidate for a disconnected notification
          this._handleNotification(c.address);
        }
      });
    });
  }

  _handleNotification(address) {
    this.log(`Handle notification of ${address.service}:${address.characteristic}`);

    // We know the specific characteristic that caused the change. Query it directly.
    const characteristic = this.accessory.getCharacteristic(address);
    if (characteristic) {
      characteristic.notificationPending();
    }
  }

  subscribe(address) {
    this.log(`Subscribe ${address.service}:${address.characteristic}`);

    const supportsOnlyConnectedEvents = this._supportsOnlyConnectedEvents(address);
    // TODO: Trigger a keep alive and a connect on the HapExecutor
    this._forceKeepAlives |= supportsOnlyConnectedEvents;
    this._activeSubscriptions.push(address);

    this._enableSubscription(address);
  }

  unsubscribe(address) {
    this.log(`Unsubscribe ${address.service}:${address.characteristic}`);
    const subscription = this._activeSubscriptions.indexOf(address);
    if (subscription !== -1) {
      this._activeSubscriptions.splice(subscription, 1);
    }

    if (this._activeSubscriptions.length === 0) {
      // TODO: Reset HapExecutor to enable closing connections
      this._forceKeepAlives = false;
    }

    this._disableSubscription(address);
  }

  _supportsOnlyConnectedEvents(address) {
    const characteristic = this.accessoryDatabase.getCharacteristic(address);
    return ((characteristic.hapCharacteristicProperties & 0x100) === 0x0
      && (characteristic.hapCharacteristicProperties & 0x80) === 0x80);
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
    });
  }

  _enableSubscription(address) {
    if (this.device.state === 'connected') {
      this.device.subscribeCharacteristic(address);
    }
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
