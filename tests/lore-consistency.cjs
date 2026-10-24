#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const classes = read('js/content/classes.js');
const codex = read('js/content/codex-lore.js');
const rules = read('js/content/rules-lore.js');
const investigation = read('js/systems/investigation.js');
const quests = read('js/content/quests.js');
const warp = read('js/content/campaigns/ch3_warpHeart.js');
const sealed = read('js/content/campaigns/ch2_sealedSector.js');

// Distinguish official faction concepts from campaign-original places/regiments.
assert.match(classes, /агент Ордо Херетикус/i, 'Inquisitor role should match Hereticus focus');
assert.match(classes, /Ордо Маллеус/i, 'daemon threats may involve Ordo Malleus');
assert.match(classes, /Астра Милитарум/i, 'Guardsman must be grounded as mortal Astra Militarum soldier');
assert.match(classes, /Караул[а-яё]* Смерти/i, 'Astartes class is specifically Deathwatch');
assert.match(classes, /охоты на ксеносов/i, 'Deathwatch specialization should stay xenos-focused');
assert.match(classes, /авторские элементы этой кампании/i, 'custom regiment/places must be declared campaign-original');
assert.match(codex, /не официальная география/i, 'campaign-specific world is separated from published canon');
assert.match(codex, /связи с Тзинчем не доказано/i, 'the repeated XI motif must remain unproven');
assert.match(investigation, /гипотезой, а не доказанным фактом/i, 'XI Legion connection remains a hypothesis');
assert.match(investigation, /не доказывает связи с XI Легионом/i, 'evidence must not prove missing Legion lore');
assert.match(warp, /не доказывает/i, 'Warp voice is not automatically authenticated as Tzeentch');
assert.match(sealed, /гипотез/i, 'sealed-sector interpretation retains uncertainty');
assert.match(quests, /осколок XI Легиона/i, 'XI Legion item is a claim within an investigation, not asserted canonical history');
assert.match(rules, /Домашняя механика этой игры/i, 'Fate-like resource is identified as house rule');
assert.match(rules, /не официальная универсальная/i, 'd20 adaptation is not presented as official GW RPG rules');

// Block a few especially risky absolute claims in active campaign text.
const campaignFiles = fs.readdirSync(path.join(root, 'js/content/campaigns')).filter(f => f.endsWith('.js'));
const wholeCampaign = campaignFiles.map(f => read(path.join('js/content/campaigns', f))).join('\n');
const unsafeClaims = [
  /XI\s+Легион\s+(?:официально\s+)?(?:был\s+обнаружен|существовал\s+в\s+секторе|подтверждён\s+каноном)/i,
  /голос\s+Тзинча\s+доказан(?:но|ный)\s+(?:принадлежит|говорил)/i,
  /аномалия\s+однозначно\s+доказывает\s+(?:демона|Тзинча|Варп)/i
];
for (const pattern of unsafeClaims) assert.doesNotMatch(wholeCampaign, pattern, `Potential overclaim in campaign text: ${pattern}`);
console.log('Lore consistency: Ordos, Astra Militarum, Deathwatch, homebrew rules, local geography, XI Legion hypothesis and Warp ambiguity are explicitly distinguished.');
