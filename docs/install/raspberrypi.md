# Installation on Raspberry Pi

This project was primarily made to run on one or more small Raspberry Pis that
are distributed to achieve good signal strength closely located to the Bluetooth
accessories you might have.

## Compatible Hardware

This project was tested with a Raspberry Pi Zero W, which has an integrated WiFi
and Bluetooth chipset. Other combinations may work or not. If you find a combination
that works, please contribute your knowledge.

## Install Raspbian Stretch

I've good experiences running this on a fresh Raspbian Stretch. As always: Other versions may
work and your mileage may vary.

Follow the [official guidelines to install Raspbian](https://www.raspberrypi.org/documentation/installation/).

Once you've configured Raspbian including all networking stuff, you'll need Node.js.

## Remove node.js 4.8.3

The Raspbian distribution may still include the old Node 4.8.3 distribution. Uninstall this before you continue with the following steps:

```bash
sudo apt-get remove nodejs
```

This will prompt you to remove nodejs, node-legacy, nodered and potentially some other packages that depend upon it.

## Download node.js

> _These instructions ask you to install node.js 9.3.0, but a newer version may work too._

Download the proper [Node.js version 9.3.0](https://nodejs.org/en/download/current/)
depending upon your version of the Raspberry Pi. If you're not sure which one is right for you,
run:

```bash
pi@raspberrypi:~ $ uname -m
armv6l
```

In the above case you'd download the armv6 version of node.js using the following command:

```bash
wget https://nodejs.org/dist/v9.3.0/node-v9.3.0-linux-armv6l.tar.xz
```

## Install node.js

Install node.js using the following commands:

```bash
tar -xvf node-v9.3.0-linux-armv6l.tar.xz
sudo mv node-v9.3.0-linux-armv6l /opt/
sudo ln -s /opt/node-v9.3.0-linux-armv6l/ /opt/node
sudo chown -R root:root /opt/node*
sudo ln -s /opt/node/bin/node /usr/bin/node
sudo ln -s /opt/node/bin/npm /usr/bin/npm
```

Verify that the installation has succeeded by running

```bash
node -v
npm -v
```

The above commands should print ```v9.3.0``` and ```5.5.1``` respectively. Newer versions may work.

## Install homebridge

This plugin needs version **0.4.35** of homebridge. Earlier versions will not work. Later should work.

```bash
sudo apt-get install libavahi-compat-libdnssd-dev
sudo npm install -g homebridge --unsafe-perm
```

## Bluetooth issues

Please be aware of the following problems in noble, which affect the bluetooth
connections to your accessories:

- [Noble #465](https://github.com/sandeepmistry/noble/issues/465)
- [Noble #480](https://github.com/sandeepmistry/noble/issues/480)
- [Noble #474](https://github.com/sandeepmistry/noble/issues/474)

The install script downloads a version of noble, which is supposed to circumvent
the issues. At the end connections to accessories work, sometimes you'll still
see immediate disconnects. Please restart homebridge if you see those issues.

I'm working on it. My recommendation at the moment is to report the issues in the
noble project.

## Install noble dependencies

Install the noble dependencies for Raspbian by executing the commands:

```bash
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```

## Install this plugin

And finally install homebridge-ranger with:

```bash
sudo npm install -g homebridge-ranger --unsafe-perm
```

## Launch homebridge upon boot

I'd recommend running homebridge via systemd - this is best described in [this gist by @johannrichard](https://gist.github.com/johannrichard/0ad0de1feb6adb9eb61a/).

The path to ```homebridge``` is ```/opt/node/bin/homebridge``` if you followed these instructions. As such the ```ExecStart``` line in ```homebridge.service``` should be:

```text
ExecStart=/opt/node/bin/homebridge $HOMEBRIDGE_OPTS
```

Additionally change ```/etc/default/homebridge``` to look as follows:

```text
# Defaults / Configuration options for homebridge
# The following settings tells homebridge where to find the config.json file 
# and where to persist the data (i.e. pairing and others)
HOMEBRIDGE_OPTS=-D -U /var/lib/homebridge

# If you uncomment the following line, homebridge will log more
# You can display this via systemd's journalctl: journalctl -f -u homebridge
DEBUG=homebridge,ranger:*
```

I would not recommend using the ```DEBUG=*``` option as this will give you a lot of logging from the bluetooth stack, which is usually not necessary. The debug option accepts a comma separated list of names if you need logging from other modules.

You can inspect the logs later using:

```bash
sudo journalctl -f -u homebridge
```

## Give node bluetooth privileges

If you're launching homebridge as a non-root user (you should!) you need to give the node executable permissions to start and stop bluetooth advertising:

```bash
sudo apt-get install libcap2-bin
sudo setcap cap_net_raw+eip /opt/node/bin/node
```

## Create a skeleton homebridge configuration

You need to create the following folder:

```bash
sudo mkdir /var/lib/homebridge
```

and create the homebridge configuration file with ```nano```:

```bash
sudo nano /var/lib/homebridge/config.json
```

Paste the following configuration block, save with Ctrl+O and exit with Ctrl+X:

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

> I'd recommend changing the name, username, port and pin properties to be unique in your installation.

Finally you need to give the homebridge user account permissions to the folder and all files it contains:

```bash
sudo chmod -R 777 /var/lib/homebridge
sudo chown -R homebridge:homebridge /var/lib/homebridge
```

## Enable your homebridge installation

If you've followed the installation up to this point you can finish up the installation by running:

```bash
sudo systemctl daemon-reload
sudo systemctl enable homebridge
sudo systemctl start homebridge
```

Continue by [verifying your homebridge installation](verify.md).
