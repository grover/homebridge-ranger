"use strict";

const os = require('os');
const child_process = require('child_process');

/**
 * Replace the default noble installation with a customized noble, which works
 * on High Sierra.
 */
if (os.platform() === 'darwin') {
  if (os.release().startsWith('17.') === true) {
    // MacOS High Sierra has changed the bluetooth XPC protocol, which doesn't
    // work with noble 1.8.1 out of the box. There's some patched versions out
    // there and I made some patches too, to make it work. Pull my version from
    // github instead of the default noble dependency.
    child_process.execSync(
      "npm install --no-save github:grover/noble#f7f16a2acd29cdd1e264189e7bfcb2b9a7f1e366",
      { stdio: [0, 1, 2] });

  }
}
else if (os.platform() === 'linux') {
  /**
   * 
   * RPi noble has issues :(, see:
   * 
   * - https://github.com/sandeepmistry/noble/issues/480
   * - https://github.com/sandeepmistry/noble/issues/474
   * - https://github.com/sandeepmistry/noble/issues/465
   * 
   * Install version with changed timeouts to circumvent some of those, even
   * though this only helps in some cases :(
   * 
   */
  child_process.execSync(
    'npm install --no-save github:grover/noble#730865a5152d6d767a2d1413c0c27eac4bde3df5',
    { stdio: [0, 1, 2] });
}
