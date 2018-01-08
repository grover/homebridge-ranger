# homebridge-ranger

A HomeKit range extender for Bluetooth Low Energy (BLE) accessories.

Bridges existing HomeKit BLE accessories to IP via [Homebridge](https://github.com/nfarina/homebridge) and makes them accessible even if they're out of range of your HomeKit Hub.

## Beware

**This plugin is in early development. While it has already been used in several situations, expect it to fail. Contributions are welcome to improve it.**

## Documentation

Please read the documentation in its entirety as this plugin is a bit more complex than your usual Homebridge plugin.

- [Why](docs/why.md)
- [A few words of caution](docs/warnings.md)
- [Requirements](docs/requirements.md)
- [Installation instructions](docs/install.md)
  - [Raspberry Pi](docs/install/raspberrypi.md)
  - [macOS](docs/install/macos.md)
  - [Verify your installation of homebridge-ranger](docs/install/verify.md)
- [Pairing accessories](docs/pairing/pairing.md)
  - [Attribute database](docs/pairing/attribute-database.md)
  - [Removing a pairing](docs/pairing/remove-pairing.md)
  - [Supported accessories](docs/pairing/accessories.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Credits](docs/credits.md)

## Some asks for friendly gestures

If you use this and like it - please leave a note by staring this package here or on GitHub.

If you use it and have a problem, file an issue at [GitHub](https://github.com/grover/homebridge-ranger/issues) - I'll try to help.

If you tried this, but don't like it: tell me about it in an issue too. I'll try my best
to address these in my spare time.

If you fork this, go ahead - I'll accept pull requests for enhancements. See [CONTRIBUTING](docs/CONTRIBUTING.md).

## License

MIT License

Copyright (c) 2017 Michael Fröhlich

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
