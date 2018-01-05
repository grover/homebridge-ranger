# Pairing accessories

This plugin automatically tries to pair to your accessories if they're unpaired. In order to pair your accessory, you need:

- The name of the accessory
- The BLE mac address of the accessory
- The pin code of the accessory

## Find your device

After you've added the plugin to your homebridge (see the [installation instructions](../install.md)) you should run homebridge. The log file will show all devices it sees in the logs, with lines similar to the following:

```text
[Ranger] Found unpaired accessory Eve Energy 7443 address=xx:xx:xx:xx:xx:xx rssi=-71dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-69dB
```

The lines give you the information you need to pair your accessories:

- The name of the accessory (as it announces itself.)
- The bluetooth hardware address of the accessory
- The rssi is an indicator of signal strength (the lower the negative number, the better.)

Unpaired accessories will show in yellow color and be reported as such.

## Choosing the accessory

Make sure that the accessory you want to pair reports as unpaired. The plugin will not pair with accessories that are already paired to a different controller.

> Some devices create new hardware addresses when paired/unpaired. Check that your addresses still match if you unpaired
> recently.

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

| Field | Type | Required | Description |
|---|---|---|---|
| name | String | Yes | Required field, which specifies the name of the accessory as seen in HomeKit. |
| address | String | Yes | The MAC address of the accessory. With colons and all lower case. Best use the MAC address printed in the log, when the device is discovered. |
| pin | String | Yes | The 9 digit pin of the accessory with the dashes.
| reachability | bool | No | Default is true. Updates the device reachability characteristic. |
| reachabilityTimeout | Number | No | Default is 30s. Determines the number of milliseconds that need to expire without advertisements before a device is considered unreachable. |
| rssi | bool | No | Default is false. Log RSSI updates for the device to the homebridge log. |

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

Should pairing fail on first attempt, the plugin will attempt to repeat the process up to three times. If all attempts fail, the plugin will stop trying and will not publish any of the accessories. Please put your device close to the accessory while pairing. If all fails, please file an [issue](https://github.com/grover/homebridge-ranger/issues).

Continue to the [attribute database](attribute-database.md).