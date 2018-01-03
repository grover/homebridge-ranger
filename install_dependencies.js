"use strict";

const os = require('os');

/**
 * Replace the default noble installation with a customized noble, which works
 * on High Sierra.
 */
if (os.platform() == 'darwin') {
  if (os.release().startsWith('17.') == true) {
    // MacOS High Sierra has changed the bluetooth XPC protocol, which doesn't
    // work with noble 1.8.1 out of the box. There's some patched versions out
    // there and I made some patches too, to make it work. Pull my version from
    // github instead of the default noble dependency.
    const child_process = require('child_process');
    child_process.execSync(
      "npm install --no-save github:grover/noble#f7f16a2acd29cdd1e264189e7bfcb2b9a7f1e366",
      { stdio: [0, 1, 2] });

  }
}