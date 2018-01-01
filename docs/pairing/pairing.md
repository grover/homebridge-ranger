# Pairing accessories

This plugin automatically tries to pair to your accessories if they're unpaired. In order to pair your accessory, you need:

- The name of the accessory
- The BLE mac address of the accessory
- The pin code of the accessory

## Find your device

After you've added the plugin to your homebridge (see the [installation instructions](../install.md)) you should run homebridge. The log file will show all devices it sees in the logs, with lines similar to the following:

```text
[Ranger] New HAP-BLE accessory Eve Energy A095 Address=ec:75:3f:9b:0e:e6 RSSI=-78dB isPaired=true
```

The line gives you a couple of items of knowledge:

- The name of the accessory
- The mac address of the accessory
- The RSSI is an indicator of signal strength (the lower the negative number, the better.)
- Wether the accessory reports itself as paired

## Choosing the accessory

Make sure that the accessory you want to pair reports as unpaired. The plugin will not pair with accessories that are already paired to a different controller.

## Configuring the plugin

```json
{
  "bridge": {
    ...
  },
  "platforms": [
    {
      "platform": "Ranger",
      "devices": [
        {
          "name": "Accessory",
          "address": "df:52:3a:f5:96:30",
          "pin": "123-45-678"
        }
      ]
    }
  ]
}
```

The above configuration will add a single BLE accessory to the plugin. You can pair multiple accessories on a single device running homebridge, but beware of limitations of the system. See the [installation instructions](../install.md) for more.

### Configuration options

| Field | Type | Description |
|---|---|---|
| name | String | Required field, which specifies the name of the accessory as seen in HomeKit. |
| address | String | The MAC address of the accessory. With colons and all lower case. Best use the MAC address printed in the log, when the device is discovered. |
| pin | String | The 9 digit pin of the accessory with the dashes.

## Pairing

Make sure you've read and understood the [warnings](../warnings.md) before you continue.

The plugin will pair with the accessory the first time you're running with the configuration. Please note there's no way to unpair at the moment. You'll have to use the means provided by the manufacturer of the accessory to reset it to factory settings if you want to unpair.

Also please note that HomeKit accessories may have a physical limitation to the number of pairings that they can create in the product lifespan.

Simply configuring the plugin properly will initiate a pairing process, which can be observed by following the log:

```text
[Ranger] Device is not paired yet, pairing now.
[Ranger] Returning pairing request for M1
[Ranger] Received pairing response for M2
[Ranger] Returning pairing request for M3
[Ranger] Received pairing response for M4
[Ranger] Returning pairing request for M5
[Ranger] Received pairing response for M6
[Ranger] Pairing completed.
```

Should yours deviate from the above or signal an error, please try again. Please put your device close to the accessory while pairing. If all fails, please file an [issue](https://github.com/grover/homebridge-ranger/issues).

### Attribute database

As part of the pairing process a file will be written in your homebridge configuration folder in ```ranger/```, which starts with the device MAC address.

That file contains the attribute database for the accessory as well as the pairing keys. Make sure to backup this file and keep it safe as it contains the pairing keys and the full database of services and characteristics exposed by the accessory.

This file will be written everytime something in the pairing changes or the device advertises a configuration change.
