# Attribute database

As part of the pairing process a file will be written in your homebridge configuration folder. That file contains the attribute database for the accessory as well as the pairing keys. Make sure to back this file up and keep it safe as it contains the pairing keys and the full database of services and characteristics exposed by the accessory.

## File name & location

The file is located in your homebridge configuration folder in a subfolder named ```ranger/```. For example if your device MAC address is ```de:81:1d:f5:96:30``` the file will be called ```ranger/de:81:1d:f5:96:30.json```.

## Security implications

The attribute database contains the pairing keys. The one who has the keys can control your accessories and potentially
use them for malicious purposes. Make sure that your Raspberry configuration is safe, your backup storage is safe.

## Updates to the file

This file will be written everytime the configuration of an accessory changes. This doesn't mean changes done through HomeKit, but rather firmware updates performed against the device. Make sure you update your backups in those cases.

Continue to [removing a pairing](../remove-pairing.md).