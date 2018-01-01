
const HAPBLEAdvertisingIntervals = [
  { min: 0, max: 0 },
  { min: 10, max: 25 },
  { min: 26, max: 100 },
  { min: 101, max: 300 },
  { min: 301, max: 500 },
  { min: 501, max: 1250 },
  { min: 1250, max: 2500 },
  { min: 2500, max: Number.POSITIVE_INFINITY }
];

module.exports = function (buffer) {
  if (buffer.length < 17) {
    return {
      isHAP: false
    };
  }

  // 6.4.2.2
  const data = {
    coid: buffer.readUInt16LE(0),
    ty: buffer.readUInt8(2),
    advertisingInterval: buffer.readUInt8(3),
    sf: buffer.readUInt8(4),
    deviceid: buffer.slice(5, 11),
    acid: buffer.readUInt16LE(11),
    gsn: buffer.readUInt16LE(13),
    cn: buffer.readUInt8(15),
    cv: buffer.readUInt8(16)
  };

  data.isHAP = data.coid === 0x004C
    // HAP Simulator on Mac is 0x11 - && ((data.advertisingInterval & 0x1F) === 0x0D)
    && data.ty === 0x06
    && data.cv === 0x02;

  data.advertisingInterval = HAPBLEAdvertisingIntervals[data.AdvertisingInterval >> 5];

  data.isPaired = ((data.sf & 0x01) === 0x00);

  return data;
}
