#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'js/content/assets.js');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.replace(/\/\*[\s\S]*?\*\//g, '');
const activeRefs = [...source.matchAll(/file\s*:\s*["'](assets\/[^"']+)["']/g)].map(m => m[1]);
const optionalRefs = [...source.matchAll(/optionalFile\s*:\s*["'](assets\/[^"']+)["']/g)].map(m => m[1]);
const uniqueActive = [...new Set(activeRefs)].sort();
const uniqueOptional = [...new Set(optionalRefs)].sort();
const present = uniqueActive.filter(rel => fs.existsSync(path.join(root, rel)));
const missing = uniqueActive.filter(rel => !fs.existsSync(path.join(root, rel)));
const optionalPresent = uniqueOptional.filter(rel => fs.existsSync(path.join(root, rel)));
const optionalMissing = uniqueOptional.filter(rel => !fs.existsSync(path.join(root, rel)));
const lines = [
  'WARHAMMER 40,000 SOLO RPG — ASSET CHECK',
  `Active image paths requested by browser: ${uniqueActive.length}`,
  `Active files present: ${present.length}`,
  `Active files missing: ${missing.length}`,
  `Optional art paths retained for recovery: ${uniqueOptional.length}`,
  `Optional files present: ${optionalPresent.length}`,
  `Optional art files not supplied in this package: ${optionalMissing.length}`,
  '', 'Active files present:', ...(present.length ? present.map(x => `- ${x}`) : ['- none']),
  '', 'Missing active files (must be empty):', ...(missing.length ? missing.map(x => `- ${x}`) : ['- none']),
  '', 'Optional artwork not supplied:', ...(optionalMissing.length ? optionalMissing.map(x => `- ${x}`) : ['- none']),
  '', 'Policy: unavailable portrait/icon artwork is stored as optionalFile and not requested by the browser; scenes show fallback UI. User-provided five backgrounds and legacy location backgrounds remain active.'
];
const report = lines.join('\n') + '\n';
fs.writeFileSync(path.join(root, 'ASSET_CHECK_REPORT.txt'), report, 'utf8');
console.log(report);
if (missing.length) process.exitCode = 1;
