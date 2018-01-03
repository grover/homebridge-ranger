# Verify the installation of homebridge-ranger

It is recommended that you inspect the logs to verify if you correctly installed everything before you contine.

You should see the results of the Bluetooth LE scan of your home, which will not exactly look like the following, but similar.

```text
Loaded plugin: homebridge-ranger
Registering platform 'homebridge-ranger.Ranger'
---
Loaded config.json with 0 accessories and 1 platforms.
---
Loading 1 platforms...
[Ranger] Initializing Ranger platform...
[Ranger] Ranger Platform Plugin Loaded
[Ranger] DidFinishLaunching
[Ranger] Starting to scan for BLE HomeKit accessories
[Ranger] Found unpaired accessory Eve Energy 7443 address=xx:xx:xx:xx:xx:xx rssi=-71dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-69dB
[Ranger] Found paired accessory Eve Door B4B8 address=xx:xx:xx:xx:xx:xx rssi=-85dB
[Ranger] Found paired accessory Eve Door 89DB address=xx:xx:xx:xx:xx:xx rssi=-68dB
[Ranger] Found paired accessory Eve Door B6AC address=xx:xx:xx:xx:xx:xx rssi=-84dB
[Ranger] Found paired accessory Eve Door F9DA address=xx:xx:xx:xx:xx:xx rssi=-90dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-66dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-69dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-61dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-71dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-44dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-85dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-57dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-69dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-68dB
[Ranger] Found paired accessory Eve Door 28B3 address=xx:xx:xx:xx:xx:xx rssi=-74dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-72dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-76dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-73dB
[Ranger] Found paired accessory Eve address=xx:xx:xx:xx:xx:xx rssi=-46dB
```

Yours will likely show different devices with different signal strenghts and pairing information. The plugin will continuously scan for accessories in order to locate all in your environment and to get notifications from accessories. Additionally the scan will help you locate the BLE accessories that you want to pair with the plugin.

If everything worked out as explained above go on to [pairing accessories](../pairing/pairing.md).
