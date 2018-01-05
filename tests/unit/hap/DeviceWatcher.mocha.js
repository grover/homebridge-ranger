
"use strict";

const DeviceWatcher = require('../../../src/hap/DeviceWatcher');
const EventEmitter = require('events').EventEmitter;
const moment = require('moment');

const assert = require('chai').assert;
const sinon = require('sinon');

describe('DeviceWatcher', () => {

  const interval = 50;

  let clock;

  let visibleSpy;
  let watcher;

  before(() => {
    clock = sinon.useFakeTimers();
    clock.tick(1); // Do not start clock at absolute zero
  });

  after(() => {
    clock.restore();
  });

  beforeEach(() => {
    visibleSpy = sinon.stub();

    watcher = new DeviceWatcher(console.log, 'Test', interval);
    watcher.on('visible', visibleSpy);
  });

  function becomeVisible() {
    watcher.seen();
    clock.tick(1);
    watcher.seen();
    clock.tick(1);
    watcher.seen();
    clock.tick(1);
    watcher.seen();
    clock.tick(1);
    watcher.seen();
  }

  it('Should start in mode invisible', () => {
    assert.equal(watcher.mode, 'invisible');
  });

  it('Should not be seen', () => {
    assert.isUndefined(watcher.lastSeenAt);
  });

  it('Should update last seen', () => {
    watcher.seen();
    assert.isDefined(watcher.lastSeenAt);
    assert.isAbove(watcher.lastSeenAt, Date.now() - 1000);
  });

  it('Should not raise visible event on first update', () => {
    watcher.seen();
    assert.isFalse(visibleSpy.calledOnce);
  });

  it('Should wait for five consecutive advertisements to change mode to visible', () => {
    becomeVisible();
    assert.equal(watcher.mode, 'visible');
  });


  it('Should emit visible event on mode change', () => {
    becomeVisible();

    assert.isTrue(visibleSpy.firstCall.calledWith(true));
  });

  it('Should emit visible event after device has been gone', () => {
    becomeVisible();

    assert.isTrue(visibleSpy.firstCall.calledWith(true));

    clock.tick(interval * 3);
    assert.isTrue(visibleSpy.secondCall.calledWith(false));
  });

  it('Should become visible again', () => {
    becomeVisible();
    assert.isTrue(visibleSpy.firstCall.calledWith(true));

    clock.tick(interval * 3);
    assert.isTrue(visibleSpy.secondCall.calledWith(false));

    becomeVisible();
    assert.isTrue(visibleSpy.thirdCall.calledWith(true));
  });
});