
"use strict";

const EventEmitter = require('events').EventEmitter;

const Visibility = {
  invisible: 'invisible',
  visible: 'visible'
};

class DeviceWatcher extends EventEmitter {

  constructor(log, name, interval) {
    super();

    this.log = log;
    this._name = name;
    this._interval = interval;
    this._timer = undefined;

    this.lastSeenAt = undefined;
    this.mode = Visibility.invisible;
  }

  seen() {
    const now = Date.now();

    if (this.mode === Visibility.invisible) {
      const diff = now - this.lastSeenAt;

      if (diff < this._interval) {
        this._consecutiveAnnouncements++;
      }
      else if (this.lastSeenAt) {
        this._consecutiveAnnouncements = 1;
        this.log(`${this._name}: First advertisement after ${diff}ms.`);
      }
      else {
        this._consecutiveAnnouncements = 1;
      }

      if (this._consecutiveAnnouncements == 5) {
        // Seen :)
        this._changeMode(Visibility.visible);
        this._startTimer();
      }
    }

    this.lastSeenAt = now;
  }

  _onTimeout() {
    this._timer = undefined;

    const gone = this._isGone();
    if (gone) {
      this._changeMode(Visibility.invisible);
      return;
    }

    // Device is still there, check back later
    this._startTimer();
  }

  _isGone() {
    if (!this.lastSeenAt) {
      return true;
    }

    const now = Date.now();
    const timeDiff = now - this.lastSeenAt;
    const maxDiff = this._interval;
    const isGone = timeDiff >= maxDiff;
    return isGone;
  }

  _changeMode(mode) {
    if (this.mode !== mode) {
      this.emit('visible', (mode === Visibility.visible));
      this.mode = mode;
    }
  }

  _startTimer() {
    if (this._timer !== undefined) {
      clearTimeout(this._timer);
    }

    setTimeout(this._onTimeout.bind(this), this._interval);
  }
};

module.exports = DeviceWatcher;
