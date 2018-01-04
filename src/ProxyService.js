"use strict";

const inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {

    const Service = hap.Service;


    Service.ProxyService = function (api, log, accessor, subscriptionManager, service) {

      Service.call(this, '', service.UUID);

      this.log = log;
      this._service = service;
      this.isHidden = service.isHidden;

      service.characteristics
        .filter(c => !c.isHidden)
        .forEach(characteristic => {
          const c = new api.hap.Characteristic.ProxyCharacteristic(
            this.log, accessor, characteristic, subscriptionManager);
          this.addCharacteristic(c);
        });

      this.UUID = service.UUID;
      this.address = service.address;
    };

    inherits(Service.ProxyService, Service);
  }
}
