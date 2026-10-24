#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sandbox = {
  GAME: { quests: {}, character: { credits: 0, reputation: {} } },
  QUEST_DEFS: [
    { id: 'side', title: 'Проверка', description: 'Тест', objectives: ['А', 'Б'], rewards: { xp: 10, credits: 5, reputation: { Militarum: 2 } } }
  ],
  Bus: { emit() {} },
  addSystem() {},
  addXP(amount) { sandbox.xp = (sandbox.xp || 0) + amount; return []; },
  changeRep(faction, delta) { sandbox.GAME.character.reputation[faction] = (sandbox.GAME.character.reputation[faction] || 0) + delta; }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/systems/quests.js'), 'utf8'), sandbox);
sandbox.initQuests();
sandbox.updateQuest('side', 1, 'scene:a');
sandbox.updateQuest('side', 1, 'scene:a');
assert.equal(sandbox.GAME.quests.side.progress, 1, 'same scene source must not advance progress twice');
sandbox.updateQuest('side', 1, 'scene:b');
assert.equal(sandbox.GAME.quests.side.status, 'complete', 'quest should complete at objective limit');
assert.equal(sandbox.GAME.character.credits, 5, 'credits should be awarded once');
assert.equal(sandbox.xp, 10, 'XP should be awarded once');
assert.equal(sandbox.GAME.character.reputation.Militarum, 2, 'declared faction reputation reward should be paid');
sandbox.updateQuest('side', 1, 'scene:c');
sandbox.completeQuest('side');
assert.equal(sandbox.GAME.character.credits, 5, 'completed quest cannot pay twice');
assert.equal(sandbox.xp, 10, 'completed quest cannot grant XP twice');
assert.equal(sandbox.GAME.character.reputation.Militarum, 2, 'completed quest cannot grant reputation twice');
sandbox.GAME.quests.side.status = 'failed';
sandbox.GAME.quests.side.rewardClaimed = false;
sandbox.completeQuest('side', {force:true});
assert.equal(sandbox.GAME.quests.side.status, 'failed', 'failed quest is terminal');
assert.equal(sandbox.GAME.character.credits, 5, 'failed quest cannot pay credits');
assert.equal(sandbox.xp, 10, 'failed quest cannot grant XP');
assert.equal(sandbox.updateQuest('side', -10, 'negative'), false, 'negative progress is rejected');
sandbox.initQuests();
sandbox.updateQuest('side', 1, 'start-fail-test');
assert.equal(sandbox.failQuest('side', 'Свидетель утрачен.'), true, 'active quest can be failed explicitly');
assert.equal(sandbox.GAME.quests.side.status, 'failed');
assert.equal(sandbox.completeQuest('side', {force:true}), false, 'failed quest cannot be completed through a later ending');
assert.equal(sandbox.GAME.character.credits, 5, 'failed quest must never grant another reward');
console.log('Quest integrity: duplicate source prevented; failed quests cannot be revived or rewarded; bounds validated.');
