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
[Ranger] New HAP-BLE accessory Eve Energy 7443 Address=xx:xx:xx:xx:xx:xx RSSI=-71dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-69dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Door B4B8 Address=xx:xx:xx:xx:xx:xx RSSI=-85dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Door 89DB Address=xx:xx:xx:xx:xx:xx RSSI=-68dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Door B6AC Address=xx:xx:xx:xx:xx:xx RSSI=-84dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Door F9DA Address=xx:xx:xx:xx:xx:xx RSSI=-90dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-66dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-69dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-61dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-71dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-44dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-85dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-57dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-69dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-68dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Door 28B3 Address=xx:xx:xx:xx:xx:xx RSSI=-74dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-72dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-76dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-73dB state=disconnected isPaired=true
[Ranger] New HAP-BLE accessory Eve Address=xx:xx:xx:xx:xx:xx RSSI=-46dB state=disconnected isPaired=true
```

Yours will likely show different devices with different signal strenghts and pairing information. The plugin will continuously scan for accessories in order to locate all in your environment and to get notifications from accessories. Additionally the scan will help you locate the BLE accessories that you want to pair with the plugin.

If everything worked out as explained above go on to [pairing accessories](../pairing/pairing.md).
