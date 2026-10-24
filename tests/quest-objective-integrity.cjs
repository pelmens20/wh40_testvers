#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sandbox = {
  GAME: { quests: {}, character: { credits: 0, reputation: {} }, world: { day: 1 }, campaign: { scenarioId: 'test', sceneId: 'test' } },
  QUEST_DEFS: [
    { id: 'named', title: 'Именованные этапы', description: 'Тест', objectiveKeys: ['first','second','third'], objectives: ['Первый','Второй','Третий'], rewards: { xp: 25, credits: 7, reputation: { Inquisition: 1 } } },
    { id: 'forced', title: 'Обходной путь', description: 'Тест', objectiveKeys: ['a','b','c'], objectives: ['А','Б','В'], rewards: { xp: 5, credits: 1, reputation: {} } }
  ],
  Bus: { emit() {} }, addSystem() {}, saveGameSilent() {},
  addXP(value) { sandbox.xp = (sandbox.xp || 0) + value; return []; },
  changeRep(faction, delta) { sandbox.GAME.character.reputation[faction] = (sandbox.GAME.character.reputation[faction] || 0) + delta; }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/systems/quests.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/rules/effects.js'), 'utf8'), sandbox);
sandbox.initQuests();
const q = sandbox.GAME.quests.named;
assert.equal(sandbox.markQuestObjective('named', 'third'), true, 'an objective can be recorded out of sequence');
assert.equal(q.progress, 0, 'out-of-order completion must not pretend the first objective is done');
assert.equal(sandbox.markQuestObjective('named', 'third'), false, 'same objective cannot be farmed');
assert.equal(sandbox.markQuestObjective('named', 'first'), true);
assert.equal(q.progress, 1);
assert.equal(sandbox.markQuestObjective('named', 'second'), true);
assert.equal(q.progress, 3, 'resolving the missing middle objective advances contiguous progress');
assert.equal(q.status, 'active', 'objective completion alone must not hand out final rewards before the authored ending');
assert.equal(sandbox.completeQuest('named'), true);
assert.equal(q.status, 'complete');
assert.equal(sandbox.GAME.character.credits, 7);
assert.equal(sandbox.GAME.character.reputation.Inquisition, 1);
assert.equal(sandbox.markQuestObjective('named', 'first'), false, 'terminal quests reject post-completion mutation');
assert.equal(sandbox.GAME.character.credits, 7, 'no duplicate reward');
const forced = sandbox.GAME.quests.forced;
sandbox.markQuestObjective('forced', 'a');
assert.equal(sandbox.completeQuest('forced', { force: true }), true);
assert.equal(forced.completedObjectives.a, true);
assert.equal(forced.completedObjectives.b, 'skipped');
assert.equal(forced.completedObjectives.c, 'skipped');
assert.equal(sandbox.failQuest('named', 'late failure'), false, 'completed quest cannot be failed');
// The effect interpreter must wire objective markers, explicit abandonment and multi-quest endings.
sandbox.initQuests();
sandbox.applyEffects({ questObjective: { id: 'named', key: 'first' } }, 'scene:named-first');
assert.equal(sandbox.GAME.quests.named.completedObjectives.first, true, 'questObjective effects must call the named-objective API');
sandbox.applyEffects({ questFail: { id: 'named', reason: 'Оперативник отказался.' } }, 'choice:named-refuse');
assert.equal(sandbox.GAME.quests.named.status, 'failed', 'questFail effects must set a terminal failed state');
sandbox.applyEffects({ questComplete: ['named', 'forced'] }, 'ending:double-completion');
assert.equal(sandbox.GAME.quests.named.status, 'failed', 'an ending cannot revive a failed quest');
assert.equal(sandbox.GAME.quests.forced.status, 'complete', 'array questComplete supports a chapter ending resolving multiple quests');
console.log('Quest objectives: order, deduplication, explicit completion/failure, skipped-path notation and effect integration — PASS.');
