# Contributing

This plugin is fairly new and there's likely still some stuff that needs to be done. Want to help? A big thank you ahead of time.

## How to help?

First of all there's a limited list of accessories that are known to work. It would be great if you have a device (or a device with a different hardware/firmware version) that's not on the list and you could test it out. If you find one that works or doesn't: File an [Issue](../../../issues/new) and tell me about it.

## Experimental stuff

This plugin has some rough edges that I couldn't test. It does log those edge cases. If you find one of the following situations, please tell me about them and we can figure out a plan to finish the implementation there.

### Service Signatures

HomeKit accessories support service signatures and one part of it is that multiple services can be linked together. I haven't seen a device that actually uses this and thus can't verify if my assumptions are correct. Notify me if you see the following log line in your homebridge installation:

```text
Found linked services, don't know how to parse ...
```

### Fragmented Writes

One topic that is not implemented yet is fragmented writes of larger amounts of data. If you happen to have device that doesn't work, or see the following in your logs - notify me:

```text
Tx packet fragmentation not implemented.
```

### Other contributions

You can always contribute to the documentation, implement missing features, provide bug fixes etc.

I'll gladly accept pull requests.

Continue to [Credits](credits.md)
