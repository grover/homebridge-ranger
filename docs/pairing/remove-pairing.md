# Remove a pairing

Starting with Version 0.4.0 of the plugin a pairing can be removed at any point
in time by changing the configuration and restarting homebridge.

## Steps to remove a pairing

Removing a pairing is a multiple step process:

1. Stop homebridge
1. Edit the configuration and add the ```"remove": true``` to the device entry to remove
1. Start homebridge
1. Wait for the removal confirmation line to appear in the homebridge log
1. Stop homebridge again
1. Remove the device entry from the configuration
1. Start homebridge again

## Configuration option to remove a pairing

A pairing can be removed by adding the remove field to the pairing:

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
          "pin": "123-45-678",
          "remove": true
        }
      ]
    }
  ]
}
```

If ```remove``` is specified and is true, the next run of homebridge will remove
the pairing. Homebridge will not start fully as the plugin will not look for 
other accessories and will not publish any accessories at all.

## Confirmation of the removal

The following log lines will appear once ranger has removed the pairing:

```text
[Ranger]
[Ranger] PAIRING REMOVED FROM ACCESSORY Accessory
[Ranger]
[Ranger] Please remove the device entry from the configuration and restart homebridge.
[Ranger]
```

The line will be printed in bright red if you're looking at the logs on the console.

Continue to [supported accessories](accessories.md).
