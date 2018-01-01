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

Continue to [Requirements](requirements.md)