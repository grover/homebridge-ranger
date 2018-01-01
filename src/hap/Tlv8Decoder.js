
function decode(data) {

  var objects = {};

  var leftLength = data.length;
  var currentIndex = 0;

  for (; leftLength > 0;) {
    var type = data[currentIndex];
    var length = data[currentIndex + 1];
    currentIndex += 2;
    leftLength -= 2;

    var newData = data.slice(currentIndex, currentIndex + length);

    if (objects[type]) {
      objects[type] = Buffer.concat([objects[type], newData]);
    } else {
      objects[type] = newData;
    }

    currentIndex += length;
    leftLength -= length;
  }

  return objects;
}

module.exports = {
  decode: decode
};