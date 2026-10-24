#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/content/assets.js'), 'utf8');

function makeContext(started) {
  let timerId = 0;
  const timers = new Map();
  const cleared = new Set();
  let renders = 0;
  class FakeImage {
    set src(value) {
      this._src = value;
      // Simulate successful loading of the custom user artwork, and failures for
      // absent optional artwork. onload/onerror are invoked as separate browser events.
      queueMicrotask(() => {
        if (value === 'assets/backgrounds/market-user.png' || value === 'assets/backgrounds/sealed-gates-user.png' || value === 'assets/backgrounds/sealed.jpg') this.onload?.();
        else this.onerror?.();
      });
    }
  }
  const context = vm.createContext({
    console,
    GAME: { started, _assetCache: {} },
    Image: FakeImage,
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout(id) { cleared.add(id); timers.delete(id); },
    renderAll() { renders++; },
    Date, Math, JSON, Object, Array, Set, Map, String, Number, Boolean, RegExp, Error, Promise, queueMicrotask
  });
  vm.runInContext(source, context, { filename: 'js/content/assets.js' });
  return {context, timers, cleared, get renders(){return renders;}, flush(){ const work=[...timers.values()]; timers.clear(); work.forEach(fn=>fn()); }};
}

(async () => {
  const active = makeContext(true);
  vm.runInContext('preloadAssets()', active.context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(active.context.GAME._assetCache['assets/backgrounds/market-user.png'], true, 'custom market image should load');
  assert.equal(active.context.GAME._assetCache['assets/backgrounds/sealed-gates-user.png'], true, 'custom sealed gate image should load');
  assert.equal(active.timers.size, 1, 'many completed image loads must debounce to a single pending render');
  active.flush();
  assert.equal(active.renders, 1, 'successful image load should refresh the active scene once');

  const boot = makeContext(false);
  vm.runInContext('preloadAssets()', boot.context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(boot.timers.size, 0, 'asset preloading on the boot screen must not schedule gameplay renders');
  assert.equal(boot.renders, 0, 'asset preloading on the boot screen must not rerender the app');
  console.log('PASS image-loader regression: active scene refreshes once after async assets load; boot screen avoids unnecessary rerenders.');
})().catch(error => { console.error(error); process.exitCode = 1; });
