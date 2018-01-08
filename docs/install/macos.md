# macOS

This plugin was developed on a Mac and could also be run with Homebridge on a Mac. I haven't tried running it on one for a longer period of time though.

## Install node.js

Install node.js 9.3.0 from [nodejs.org](https://nodejs.org/en/download/current/).

## Install homebridge

This plugin needs version **0.4.35** of homebridge. Earlier versions will not work. Later should work.

In Terminal:

```bash
npm install -g homebridge --unsafe-perm
```

## Install noble dependencies

Please follow the installation instructions of the prerequisites from [noble](https://www.npmjs.com/package/noble), however it is not necessary to install noble itself.

## Install this plugin

In Terminal:

```bash
npm install -g homebridge-ranger --unsafe-perm
```

### On macOS High Sierra

The post install step of ```homebridge-ranger``` will automatically install a patched version of
noble for [macOS High Sierra](https://github.com/grover/noble/tree/macos_highsierra). This version
is not necessary AFAIK on earlier macOS versions and other platforms.

Unfortunately there were changes in the Bluetooth Stack in High Sierra, which make this
necessary.

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
DEBUG=homebridge,ranger:* homebridge
```

You should now see the execution logs of homebridge, which includes a scan of your Bluetooth LE neighborhood. If starting succeeded you can continue by [verifying your homebridge installation](verify.md).
