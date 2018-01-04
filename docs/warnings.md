# A few words of caution

This plugin is a hacked solution for a range extender. It works for me. If it works for you great. If not, I'm sorry. I'll try to help as much as I can, but expect it to fail.

In addition there's a couple of things I urge you not to do via this plugin and to understand them properly before you continue.

## Firmware upgrades

Do not upgrade the firmware of your accessory ia this Plugin. Upgrading the firmware requires the exchange of large amounts of binary data. There's likely aspects of the protocols that haven't been understood or implemented wrong. Running a firmware update through this plugin may render you accessory useless.

If you really need to upgrade the firmware of the device:

- Remove it from the plugin configuration
- Reset it to factory settings
- Pair it to iOS directly
- Upgrade the device
- Unpair it from iOS
- [Pair](pairing/pairing.md) it again

You'll have to setup all your rules and scenes again.

## HomeKit Limitations

There's likely technical reasons why there's no commercially available range extender as of this writing. Expect to hit those technical restrictions for some devices.

## Device restrictions

Some devices may only support a limited total number of pairings over their life span. Do not pair/unpair excessively or you may run into this.

## Number of Bluetooth accessories

The current implementation does not work well with many paired bluetooth
accessories - a recommendation is to keep the total number lower than 5. However there's
no hard limit to this number - it may work well if you pair more devices. If you
start seeing issues, try reducing the number of paired accessories. The limit is
really in the Bluetooth stack of the system running Homebridge and thus the limitations
described on the [noble](https://github.com/sandeepmistry/noble) page apply.

### Using this plugin with other homebridge plugins

I have not tested running this plugin in parallel with other homebridge plugins. It'll likely work, but take note that there are some timing considerations in the HAP BLE protocol, which may render the connection to the Bluetooth accessory unstable.

Also the plugin will postpone the start of homebridge until it's seen all 
configured Bluetooth HomeKit Accessories.

I'd strongly encourage you to run this on a dedicated Raspberry Pi and not 
share the Homebridge instance with other plugins. You could always run 
multiple homebridge instances on the same system and they'll not affect each other.

Continue to [Requirements](requirements.md)
