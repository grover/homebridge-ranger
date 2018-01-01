# macOS

## Install homebridge

```bash
npm install -g homebridge
```

## Install noble

Please follow the installation instructions of the prerequisites from [noble](https://www.npmjs.com/package/noble), however don't install noble itself. Use the following instructions to install noble for this plugin:

### On macOS High Sierra

```bash
npm install -g github:PolideaInternal/noble#4a18e3e640f5489df76a607a6e316988ade242c5
```

This patch is only necessary on High Sierra due to changes in the Bluetooth implementation there.

### On other versions of macOS

```bash
npm install -g noble
```

## Install this plugin

```bash
npm install -g homebridge-ranger
```

Go on to [pairing accessories](../pairing/pairing.md).
