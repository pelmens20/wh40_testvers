#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const defsText = fs.readFileSync(path.join(root, 'js/content/quests.js'), 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(defsText + '\nthis.__defs = QUEST_DEFS;', sandbox);
const defs = sandbox.__defs;
const files = fs.readdirSync(path.join(root, 'js/content/campaigns')).filter(name => name.endsWith('.js'));
const content = files.map(name => fs.readFileSync(path.join(root, 'js/content/campaigns', name), 'utf8')).join('\n');
const staleCounters = content.match(/questProgress\s*:/g) || [];
assert.equal(staleCounters.length, 0, 'authored campaign scenes should use named objectives instead of vague counter increments');
for (const quest of defs) {
  assert.equal(quest.objectives.length, 3, `${quest.id} should expose three named steps`);
  assert.equal(quest.objectiveKeys.length, quest.objectives.length, `${quest.id} objective key count`);
  assert.equal(new Set(quest.objectiveKeys).size, quest.objectiveKeys.length, `${quest.id} keys must be unique`);
  for (const key of quest.objectiveKeys) {
    const marker = new RegExp(`markQuestObjective\\(\\s*["']${quest.id}["']\\s*,\\s*["']${key}["']`);
    assert.match(content, marker, `No authored marker for ${quest.id}.${key}`);
  }
  assert.ok(content.includes(quest.id), `${quest.id} must remain referenced from campaign content`);
}
assert.match(content, /questFail\s*:/, 'optional quest refusals should have explicit failure effects');
console.log(`Quest content: ${defs.length} quests; ${defs.reduce((n,q)=>n+q.objectiveKeys.length,0)} named objective keys; no legacy counter-based progress — PASS.`);
