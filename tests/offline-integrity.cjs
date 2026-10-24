#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const remoteRefs = [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["'](https?:\/\/[^"']+)["'][^>]*>/gi)].map(m => m[1]);
assert.deepEqual(remoteRefs, [], `the app must not require remote JS/CSS/fonts: ${remoteRefs.join(', ')}`);
const hasAiIntegration = /\b(fetch\s*\(|XMLHttpRequest|WebSocket\s*\(|openai\.com\/v1|api\.anthropic\.com|generativelanguage\.googleapis\.com)\b/i.test(
  ['js/app.js','js/core/state.js','js/systems/intent.js','js/systems/resolver.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n')
);
assert.equal(hasAiIntegration, false, 'gameplay must remain local and must not call external AI APIs');
console.log('PASS offline integrity: no external script/stylesheet/font dependencies; no external AI/API calls in the core gameplay path.');
