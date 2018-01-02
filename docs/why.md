# Why homebridge-ranger

Since the beginning HomeKit has always supported two ways to connect HomeKit accessories in a Home: Via regular home networking/WiFi and via Bluetooth. Bluetooth accessories suffer from range limitations and signal strength issues, but draw less power and are likely operated by batteries.

To circumvent the range limitations HomeKit supported a special type of accessories called range extenders. Unfortunately there's no range extender available on the market today (besides the Apple TV itself.)

It's a moot point to get into the speculation why none of the announced range extenders have made it to the market. There's likely market, business and
technical reasons for this, which have not been published yet.

Since I'm a nerd the easiest solution to circumvent the issue is to integrate range extending capabilities using a
[Homebridge](https://github.com/nfarina/homebridge) plugin. This plugin is a hacked up concept of a range extender and seems to do the job well enough for me to feel confident in publishing it. However please expect rough edges and things to go wrong. I'll gladly help improving this, but please understand that I don't have all devices available to test and there's likely aspects of the protocols not understood sufficiently. Try at your own risk and please don't use this for anything that your life, family, wealth or business depends upon.

Continue to a few words of [warnings](warnings.md)
