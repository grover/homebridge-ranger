"use strict";

const inherits = require('util').inherits;
const path = require('path');
const fs = require('fs');

const CharacteristicSignatureReadRequest = require('./ops/CharacteristicSignatureReadRequest');
const ServiceSignatureReadRequest = require('./ops/ServiceSignatureReadRequest');
const UUIDFormatter = require('./../UUIDFormatter');

/**
 * List of services that should not be exposed to HomeKit via IP.
 */
const hiddenServices = [
  // Accessory Information is added by homebridge
  // TODO: Need a VIA
  '0000003e0000100080000026bb765291',

  // HAP-BLE 2.0 Protocol Information Service
  '000000a20000100080000026bb765291',

  // HAP-BLE Pairing Service
  '000000550000100080000026bb765291',
];

const hiddenCharacteristics = [
  // '000000A5-0000-1000-8000-0026BB765291'
];

class AccessoryDatabase {

  constructor(api) {
    this._api = api;
  }

  async save() {
    const filePath = buildStoragePath(this._api, this.address);
    return this.storeToFile(filePath);
  }

  async storeToFile(filePath) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(this, (key, value) => {
        if (key === '_api') {
          return undefined;
        }

        return value;
      });

      fs.writeFile(filePath, data, (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  getCharacteristic(address) {
    const service = this.services.find(svc => svc.address === address.service);
    if (!service) {
      return undefined;
    }

    const characteristic = service.characteristics.find(c => c.address.characteristic == address.characteristic);
    return characteristic;
  }
};

async function create(api, device) {
  const filePath = buildStoragePath(api, device.address);

  let accessoryDatabase;
  try {
    accessoryDatabase = await loadFromFile(filePath);

    if (accessoryDatabase.configurationNumber !== device.manufacturerData.cn) {
      // Discard service cache as the CN doesn't match
      accessoryDatabase.services = undefined;
    }
  }
  catch (e) {
    // We'll build anew
  }

  let needsToBeSaved = false;
  if (!accessoryDatabase) {
    await device.connect();
    accessoryDatabase = await generateAccessoryDatabase(device);
    needsToBeSaved = true;
  }
  else if (accessoryDatabase && !accessoryDatabase.services) {
    await device.connect();
    // Device CN has changed, rediscover the services...
    accessoryDatabase.services = await generateServices(device);
    needsToBeSaved = true;
  }

  accessoryDatabase = Object.assign(new AccessoryDatabase(api), accessoryDatabase);
  if (needsToBeSaved) {
    await accessoryDatabase.save();
  }

  return accessoryDatabase;
}


function buildStoragePath(api, address) {
  const rangerDir = path.join(api.user.storagePath(), 'ranger');
  fs.mkdir(rangerDir, (err) => {
  });

  return path.join(rangerDir, `${address.replace(/\:/g, '-')}.json`);
}

async function loadFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        data = JSON.parse(data);
      }
      catch (e) {
        reject(e);
      }

      resolve(data);
    });
  });
}

async function generateAccessoryDatabase(device) {
  const hapServices = await generateServices(device);

  let accessoryDatabase = {
    address: device.address,
    configurationNumber: device.manufacturerData.cn,
    services: hapServices
  };

  return accessoryDatabase;
}


async function generateServices(device) {
  const allCharacteristics = device.services
    .map(service => {
      return service.characteristics
        .map(c => {
          return {
            service: service,
            characteristic: c
          };
        });
    })
    .reduce((p, c) => p.concat(c));

  const cids = await discoverCharacteristicIDs(allCharacteristics);
  const characteristics = await discoverCharacteristicMetadata(device, cids);
  const metadata = await discoverServiceMetadata(device, cids);

  const services = {};

  // set hidden flags on characteristics, which should not be exposed to HomeKit
  characteristics.forEach(c => {
    c.isHidden = shouldHideCharacteristicFromHomeKit(c);

    let service = services[c.address.service];
    if (service) {
      service.characteristics.push(c);
    }
    else {
      service = {
        address: c.address.service,
        isPrimary: false,
        isSecondary: false,
        isHidden: shouldHideServiceFromHomeKit(c.address.service),
        UUID: UUIDFormatter.format(c.address.service),
        characteristics: [c]
      };
    }

    services[c.address.service] = service;
  });

  const hapServices = [];
  Object.getOwnPropertyNames(services)
    .forEach(name => hapServices.push(services[name]));

  return hapServices;
}

function shouldHideServiceFromHomeKit(service) {
  return hiddenServices.indexOf(service) !== -1;
}


function shouldHideCharacteristicFromHomeKit(characteristic) {
  return hiddenCharacteristics.indexOf(characteristic.characteristic) !== -1;
}

async function discoverCharacteristicIDs(servicesAndCharacteristics) {
  const cids = [];
  for (let i = 0; i < servicesAndCharacteristics.length; i++) {
    const c = servicesAndCharacteristics[i];

    try {
      const instanceIdDescriptor = await discoverInstanceIDDescriptor(c.characteristic);

      const cid = {
        address: {
          service: c.service.uuid,
          characteristic: c.characteristic.uuid
        },
        cid: await readDescriptor(instanceIdDescriptor),
        characteristic: c.characteristic
      };

      if (cid.cid !== undefined) {
        cids.push(cid);
      }
    }
    catch (e) {
      // Skip characteristics, where we fail to retrieve the 
      // instance descriptor
    }
  }

  return cids;
}

function discoverInstanceIDDescriptor(characteristic) {
  return new Promise((resolve, reject) => {
    characteristic.discoverDescriptors((error, descriptors) => {
      if (error) {
        reject(error);
        return;
      }

      const instanceIdDescriptor = descriptors.find(d => d.uuid == 'dc46f0fe81d24616b5d96abdd796939a');
      if (!instanceIdDescriptor) {
        reject('No instance ID descriptor found');
        return;
      }

      resolve(instanceIdDescriptor);
    });
  });
}

function readDescriptor(descriptor) {
  return new Promise((resolve, reject) => {
    descriptor.readValue((error, data) => {
      if (error) {
        reject(error);
      }

      resolve(data.readUInt16LE(0));
    });
  });
}

async function discoverCharacteristicMetadata(device, cids) {
  const requests = cids
    .filter(c => c.address.characteristic !== '000000a50000100080000026bb765291')
    .map(c => new CharacteristicSignatureReadRequest(c.address, c.cid, c.characteristic));

  const signatures = [];
  for (let i = 0; i < requests.length; i++) {
    const r = requests[i];
    const signature = await device.run(r);
    if (signature) {
      signatures.push(signature);
    }
  }

  return signatures;
}

async function discoverServiceMetadata(device, characteristics) {

  const serviceSignature = characteristics
    .filter(c => c.address && c.address.characteristic === '000000a50000100080000026bb765291');

  if (serviceSignature.length === 0) {
    return {};
  }

  serviceSignature
    .map(async svc => {
      const sig = serviceSignature[0];
      const op = new ServiceSignatureReadRequest(svc.address, svc.cid);
      const service = await device.run(op);
      console.log(`Service signature ${JSON.stringify(service)}`);
    });
}

module.exports = {
  create: create,
};
