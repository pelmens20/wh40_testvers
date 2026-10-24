#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const missing = [];
const checked = [];
for (const m of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
  const ref = m[1];
  if (/^(?:https?:|data:|#)/i.test(ref)) continue;
  const rel = ref.split(/[?#]/, 1)[0];
  if (!rel) continue;
  checked.push(rel);
  if (!fs.existsSync(path.join(root, rel))) missing.push(rel);
}
if (new Set(checked).size !== checked.length) {
  // Repeated local references are legal, so this is informational only.
}
console.log(`HTML local resources checked: ${checked.length}`);
console.log(`Missing HTML local resources: ${missing.length}`);
if (missing.length) {
  for (const f of [...new Set(missing)]) console.error(`MISSING ${f}`);
  process.exitCode = 1;
} else {
  console.log('PASS: every local script and stylesheet referenced by index.html exists.');
}
