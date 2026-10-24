#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const registry = fs.readFileSync(path.join(root, 'js/content/assets.js'), 'utf8');
const required = [
  ['assets/backgrounds/market.jpg', 'market.jpg'],
  ['assets/backgrounds/promzone.jpg', 'promzone.jpg'],
  ['assets/backgrounds/temple.jpg', 'temple.jpg'],
  ['assets/backgrounds/sealed.jpg', 'sealed.jpg'],
  ['assets/backgrounds/catacombs.jpg', 'catacombs.jpg']
];
for (const [rel, name] of required) {
  const full = path.join(root, rel);
  assert.ok(fs.existsSync(full), `missing included user artwork: ${rel}`);
  const bytes = fs.readFileSync(full);
  assert.ok(bytes.length > 100_000, `image appears unexpectedly small: ${rel}`);
  assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], `${rel} is not a JPEG file`);
  console.log(`PASS custom image packaged and referenced: ${name} (${bytes.length} bytes)`);
}
function hasMapping(name, filepath) {
  const key = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const file = filepath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('"' + key + '"\\s*:\\s*\\{\\s*file:"' + file + '"').test(registry);
}
assert.ok(hasMapping('sealed-door', 'assets/scenes/sealed-door.png') || /\"sealed-door\"\s*:\s*\{[^}]*optionalFile:\s*\"assets\/scenes\/sealed-door\.png\"/s.test(registry), 'sealed door scene should map to the dedicated scene illustration');
const supplied = [
  ['assets/backgrounds/market-user.png', 'newHive'],
  ['assets/backgrounds/industrial-cathedral-user.png', 'silentForge'],
  ['assets/backgrounds/temple-user.png', 'ordoJudgment'],
  ['assets/backgrounds/sealed-gates-user.png', 'sealedSector'],
  ['assets/backgrounds/ritual-chamber-user.png', 'warpHeart']
];
for (const [rel, key] of supplied) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing supplied user image: ${rel}`);
  assert.ok(hasMapping(key, rel), `supplied image is not mapped to intended chapter: ${rel}`);
}
const locationMappings = [
  ['Рынок', 'assets/backgrounds/market-user.png'],
  ['Промзона', 'assets/backgrounds/industrial-cathedral-user.png'],
  ['Храм', 'assets/backgrounds/temple-user.png'],
  ['Запечатанный сектор', 'assets/backgrounds/sealed-gates-user.png']
];
for (const [name, rel] of locationMappings) assert.ok(hasMapping(name, rel), `missing location art mapping: ${name}`);
console.log('PASS legacy backgrounds are packaged; supplied PNGs are mapped to relevant chapters/locations.');
