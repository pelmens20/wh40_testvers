#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const sounds = fs.readFileSync(path.join(root, 'js/ui/sounds.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const expected = [
  'imperial-archive.ogg', 'hive-industrial.ogg', 'cathedral-crypt.ogg',
  'warp-disturbance.ogg', 'combat-underscore.ogg'
];
for (const name of expected) {
  const rel = `assets/audio/${name}`;
  const full = path.join(root, rel);
  assert.ok(fs.existsSync(full), `missing local ambience track: ${rel}`);
  const bytes = fs.readFileSync(full);
  assert.ok(bytes.length > 40_000, `ambient OGG appears truncated: ${rel} (${bytes.length} bytes)`);
  assert.equal(bytes.subarray(0,4).toString('ascii'), 'OggS', `invalid Ogg container: ${rel}`);
  assert.ok(sounds.includes(rel), `track is not declared in sounds.js: ${rel}`);
  console.log(`PASS local ambient track: ${name} (${bytes.length} bytes)`);
}
assert.match(sounds, /function _transitionAmbientTrack[\s\S]+?next\.loop\s*=\s*true/, 'tracks should switch with loop support');
assert.match(sounds, /function _ambientTargetVolume[\s\S]+?_contextMuted\(\)/, 'track volume must respect the sound settings/context mute rules');
assert.match(sounds, /\.catch\(\(\)\s*=>\s*\{[\s\S]*?fallback/, 'failed local audio must fail safely without breaking the game');
assert.match(app, /initAudio\(true\)/, 'main-menu action should unlock audio from a user gesture');
assert.doesNotMatch(sounds, /https?:\/\//i, 'audio system must not use remote audio URLs');
console.log('PASS ambient soundtrack routing, loop playback, settings integration, user-gesture unlock, and offline-only playback.');
