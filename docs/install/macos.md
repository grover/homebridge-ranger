# macOS

This plugin was developed on a Mac and could also be run with Homebridge on a Mac. I haven't tried running it on one for a longer period of time though.

## Install node.js

Install node.js 9.3.0 from [nodejs.org](https://nodejs.org/en/download/current/).

## Install homebridge

In Terminal:

```bash
npm install -g homebridge --unsafe-perm
```

## Install noble

Please follow the installation instructions of the prerequisites from [noble](https://www.npmjs.com/package/noble), however don't install noble itself.

### On macOS High Sierra

In Terminal:

```bash
npm install -g github:grover/noble#8249e9c3b2c50a0a63e81d859d9dc16acd84c080
```

This patch is only necessary on High Sierra due to changes in the Bluetooth implementation there.

### On other versions of macOS

In Terminal:

```bash
npm install -g noble --unsafe-perm
```

## Install this plugin

In Terminal:

```bash
npm install -g homebridge-ranger --unsafe-perm
```

## Create the skeleton homebridge configuration

Create a plain text file in ~/.homebridge/config.json - create the folder if necessary:

```text
{
  "bridge": {
    "name": "Homebridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "platforms": [
    {
      "platform": "Ranger",
      "devices": [
      ]
    }
  ]
}
```

## Run homebridge

The above assumes you'll run homebridge as your current user account. You can start homebridge now, by executing the following in Terminal:

```bash
DEBUG=homebridge homebridge
```

You should now see the execution logs of homebridge, which includes a scan of your Bluetooth LE neighborhood. If starting succeeded you can continue by [verifying your homebridge installation](verify.md).
