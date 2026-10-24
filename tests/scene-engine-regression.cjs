#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/engine/scene.js'), 'utf8');

// Regression 1: an invalid destination must not finalize/change the current chapter.
const invalidSandbox = {
  GAME: { campaign: { active: true, scenarioId: 'oldScenario', sceneId: 'oldScene' } },
  CAMPAIGN_SCENARIOS: {},
  _campaignGeneration: 7,
  finalizeCalls: 0,
  finalizeChapterOutcome() { this.finalizeCalls++; },
  addSystem() {}, renderAll() {}, console: { error() {} }
};
vm.createContext(invalidSandbox);
vm.runInContext(source, invalidSandbox);
invalidSandbox.startScenario('nonexistentScenario');
assert.equal(invalidSandbox._campaignGeneration, 7, 'invalid scenario must not advance campaign generation');
assert.equal(invalidSandbox.finalizeCalls, 0, 'invalid scenario must not finalize the active chapter');
assert.equal(invalidSandbox.GAME.campaign.scenarioId, 'oldScenario', 'current campaign remains intact after an invalid destination');

// Regression 2: scene skip conditions are evaluated once, before scene side effects.
const emitted = [];
let requirementCalls = 0;
const sceneSandbox = {
  GAME: {
    campaign: { active: true, scenarioId: 'testScenario', sceneId: 'oldScene' },
    character: { location: 'Архив' },
    world: { flags: {}, appliedEffectIds: {}, day: 1 },
    quests: {}, story: [], dialogue: null
  },
  CAMPAIGN_SCENARIOS: {
    testScenario: {
      title: 'Тестовый сценарий', startScene: 'start',
      scenes: {
        gated: { title: 'Контрольная сцена', text: 'Текст', choices: [], skipIf: { probe: true }, skipTo: 'target' },
        target: { title: 'Целевая сцена', text: 'Цель', choices: [] },
        start: { title: 'Старт', text: 'Старт', choices: [] }
      }
    }
  },
  Bus: { emit(type, payload) { emitted.push({ type, payload }); } },
  sceneRequirementsMet() { requirementCalls++; return requirementCalls > 1; },
  setSoundContext() {}, revealLocation() {}, advanceTime() {}, tickCompanionRecovery() {},
  applyEffects() { return []; }, addSystem() {}, timeString() { return '00:00'; },
  saveGameSilent() {}, renderAll() {}, console: { error() {} }
};
vm.createContext(sceneSandbox);
vm.runInContext(source, sceneSandbox);
// Override the production predicate only to prove call-count/order behavior.
sceneSandbox.sceneRequirementsMet = function () { requirementCalls++; return requirementCalls > 1; };
sceneSandbox.enterScene('gated');
assert.equal(requirementCalls, 1, 'skipIf must only be evaluated once per scene entry');
assert.equal(sceneSandbox.GAME.campaign.sceneId, 'gated', 'fluctuating skip conditions cannot redirect after side effects');
assert.equal(emitted.filter(e => e.type === 'scene_entered').length, 1, 'one entered-scene event should be emitted');
assert.equal(emitted.find(e => e.type === 'scene_entered')?.payload?.sceneId, 'gated');
console.log('Scene engine regression: invalid destinations preserve active chapter; skip conditions are evaluated once before side effects.');
