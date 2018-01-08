# Logging

This plugin logs uses [debug](www.npmjs.com/packages/debug) for logging. Beginning with version 0.3.1 the regular homebridge logging facilities are gradually replaced with debug and the logging is namespaced. Using these facilities you can enable/disable specific sections of interest. 

## Bug reporting

In the event that you encounter problems with this plugin and intend to file a bug report, please enable
logging from all sections using:

```bash
DEBUG=ranger:*
```

## Section names

The namespaces of the individual debug sections are generally created according to the following principle:

> ```ranger:device:module```

Where device name corresponds to the name you've selected in ```config.json``` for the device. See [pairing](../pairing/pairing.md) for this.

There's several modules defined, which are listed below.

## Modules

The following modules are used by the ranger plugin. Please note that this list will likely grow with
each new release as the transition from homebridge log to debug is in progress.

| Module | Description |
|---|---|
|reads| Logs all read operations against accessories on a high level.|
|writes| Logs all write operations against accessories on a high level.|
|events| Logs all events from an accessory on a high level.|
|errors| Logs all errors from an accessory.|

To log all events from an accessory named ```door```, you'd set ```DEBUG``` to:

> ```DEBUG=ranger:door:events```
