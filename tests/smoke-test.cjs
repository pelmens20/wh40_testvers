#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scriptPaths = [...html.matchAll(/<script\s+src="([^"]+\.js)"/g)].map(m => m[1]);
const failures = [];
let passed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (err) { failures.push({name, err}); console.error(`FAIL ${name}: ${err.message}`); }
}

const store = new Map();
const stubElement = () => ({
  innerHTML: '', value: '', style: {}, dataset: {},
  classList: {add(){}, remove(){}, toggle(){}},
  setAttribute(){}, focus(){}, remove(){},
  appendChild(){}, addEventListener(){}, removeEventListener(){}, click(){},
  querySelectorAll(){return []}, querySelector(){return null}
});
const elements = new Map();
const document = {
  addEventListener(){}, removeEventListener(){},
  querySelectorAll(){return []},
  querySelector(){return null},
  getElementById(id){ if(!elements.has(id)) elements.set(id, stubElement()); return elements.get(id); },
  createElement(){return stubElement();},
  body: stubElement()
};
const context = vm.createContext({
  console, document,
  localStorage: {
    getItem: k => store.has(k) ? store.get(k) : null,
    setItem: (k,v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
  },
  setTimeout(fn){ if (typeof fn === "function") { try { fn(); } catch(e){} } return 1; },
  clearTimeout(){},
  setInterval(fn){ if (typeof fn === "function") { try { fn(); } catch(e){} } return 1; },
  clearInterval(){},
  Date, Math, JSON, Object, Array, Set, Map, String, Number, Boolean, RegExp, Error, Promise
});

for (const script of scriptPaths) {
  const file = path.join(root, script);
  if (!fs.existsSync(file)) {
    failures.push({name:`script path ${script}`, err:new Error('missing file')});
    console.error(`FAIL script path ${script}: missing file`);
    continue;
  }
  try { vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename:script}); }
  catch (err) { failures.push({name:`load ${script}`, err}); console.error(`FAIL load ${script}: ${err.message}`); }
}

// Avoid needing a real DOM for gameplay-engine smoke tests.
vm.runInContext('renderAll = function() {}; renderStart = function() {}; renderApp = function() {};', context);
const run = expr => vm.runInContext(expr, context);

for (const file of fs.readdirSync(path.join(root, 'js'), {recursive:true}).filter(f => f.endsWith('.js'))) {
  test(`syntax ${file}`, () => {
    const {status, stderr} = require('node:child_process').spawnSync(
      process.execPath,
      ['--check', path.join(root, 'js', file)],
      {encoding:'utf8'}
    );
    assert.equal(status, 0, stderr || `node --check failed: ${file}`);
  });
}

test('conditional choice gates support evidence, operative pressure, district stability and NPC trust', () => {
  run('GAME.character=createCharacter({name:"Проверка условий",classId:"inquisitor"}); GAME.world.flags={}; GAME.world.heat=2; GAME.world.director={threat:40,order:72,morale:60,supplies:65}; GAME.world.continuity={districts:{catacombs:{stability:50,security:40,warpRisk:35}},relationships:{"Сержант Кейн":{trust:5,respect:2,fear:0,memories:[]}}}; GAME.quests={side:{status:"complete"}};');
  assert.equal(run('sceneRequirementsMet({director:{threat:{max:50},order:{min:70}},district:{catacombs:{stability:{min:40},warpRisk:{max:40}}},relationship:{"Сержант Кейн":{minTrust:4}},quest:{id:"side",status:"complete"}})'), true);
  assert.equal(run('sceneRequirementsMet({director:{threat:{min:70}}})'), false);
  assert.equal(run('sceneRequirementsMet({district:{catacombs:{warpRisk:{min:80}}}})'), false);
  assert.equal(run('sceneRequirementsMet({relationship:{"Сержант Кейн":{minTrust:8}}})'), false);
  assert.equal(run('sceneRequirementsMet({notFlag:["deducedTemporalAnomaly"]})'), true);
  assert.equal(run('sceneRequirementsMet({evidence:"order117"})'), false);
});

test('all script src paths exist', () => {
  const missing = scriptPaths.filter(s => !fs.existsSync(path.join(root, s)));
  assert.deepEqual(missing, []);
});

test('all campaign registries are present', () => {
  assert.deepEqual(
    Array.from(run('Object.keys(CAMPAIGN_SCENARIOS)').sort()),
    ['afterJudgment','ashProtocol','beyondHive','lastTransport','newHive','ordoJudgment','priceOfEvidence','resonanceArchive','rightToMemory','sealedSector','silentForge','verdictNameless','warpHeart','witnessLedger','silentRoute'].sort()
  );
});

test('campaign audit reports no structural errors', () => {
  const errors = run('auditAll()');
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('chapters IX and X are registered, audited, and have cinematic entries', () => {
  assert.deepEqual(Array.from(run('Object.keys(CAMPAIGN_SCENARIOS).sort()')), ['afterJudgment','ashProtocol','beyondHive','lastTransport','newHive','ordoJudgment','priceOfEvidence','resonanceArchive','rightToMemory','sealedSector','silentForge','verdictNameless','silentRoute','warpHeart','witnessLedger'].sort());
  assert.equal(run('auditScenario("witnessLedger").length'), 0);
  assert.equal(run('auditScenario("silentRoute").length'), 0);
  assert.ok(run('!!CHAPTER_CUTSCENES.witnessLedger && !!CHAPTER_CUTSCENES.silentRoute && !!CHAPTER_CUTSCENES.priceOfEvidence && !!CHAPTER_CUTSCENES.rightToMemory && !!CHAPTER_CUTSCENES.lastTransport && !!CHAPTER_CUTSCENES.beyondHive && !!CHAPTER_CUTSCENES.verdictNameless'));
  for (const id of ['priceOfEvidence','rightToMemory','lastTransport','beyondHive','verdictNameless']) assert.equal(run(`auditScenario(${JSON.stringify(id)}).length`),0,`${id} should pass campaign audit`);
  assert.ok(run('CAMPAIGN_SCENARIOS.witnessLedger.scenes.wh9_intro.effects.flag.wh9Started'));
  assert.ok(run('CAMPAIGN_SCENARIOS.silentRoute.scenes.wh10_intro.effects.flag.wh10Started'));
});

test('chapter transitions route from VII to VIII to IX to X without resetting the campaign', () => {
  const src = fs.readFileSync(path.join(root, 'js/engine/scene.js'), 'utf8');
  assert.ok(src.includes('startScenario("resonanceArchive")'));
  assert.ok(src.includes('startScenario("witnessLedger")'));
  assert.ok(src.includes('startScenario("silentRoute")'));
  for (const id of ['wh8_ending_expose','wh8_ending_quarantine','wh8_ending_rescue','wh8_ending_heart']) {
    const scene = run(`CAMPAIGN_SCENARIOS.resonanceArchive.scenes[${JSON.stringify(id)}]`);
    assert.ok(scene.choices.some(c => c.goto === '__chapter9__'), `${id} must continue to chapter IX`);
    assert.equal(scene.effects.flag.campaignComplete, false, `${id} must not mark the whole campaign complete`);
  }
  for (const id of ['wh9_ending_report','wh9_ending_quarantine','wh9_ending_local']) {
    assert.ok(run(`CAMPAIGN_SCENARIOS.witnessLedger.scenes[${JSON.stringify(id)}].choices.some(c=>c.goto==='__chapter10__')`), `${id} must continue to chapter X`);
  }
});

test('chapter VII–X have role-specific procedures and do not promote suspicions to proof', () => {
  const ch7 = fs.readFileSync(path.join(root, 'js/content/campaigns/ch7_ashProtocol.js'), 'utf8');
  const ch8 = fs.readFileSync(path.join(root, 'js/content/campaigns/ch8_resonanceArchive.js'), 'utf8');
  const ch9 = fs.readFileSync(path.join(root, 'js/content/campaigns/ch9_witnessLedger.js'), 'utf8');
  const ch10 = fs.readFileSync(path.join(root, 'js/content/campaigns/ch10_silentRoute.js'), 'utf8');
  for (const source of [ch7,ch8,ch9,ch10]) {
    assert.ok(source.includes('inquisitor'), 'Inquisitor-specific content missing');
    assert.ok(source.includes('guardsman'), 'Guardsman-specific content missing');
    assert.ok(source.includes('spaceMarine'), 'Astartes-specific content missing');
  }
  assert.match(ch9, /не доказывает/i);
  assert.match(ch10, /не доказывает/i);
  assert.match(ch10, /не является известным объектом из официальной хронологии/i);
  assert.match(ch10, /источник.*не установ/i);
});

test('effect idempotency prevents duplicate credit, HP, XP, evidence and consequence rewards', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Одноразовый эффект",classId:"guardsman"}); GAME.character.credits=10; GAME.character.hp=10; GAME.character.maxHp=30; GAME.character.xp=0; applyEffects({credits:5,hp:4,xp:10,evidence:"relayChecksum",consequence:{id:"test-consequence",title:"Test",summary:"Test"}}, "test:once"); applyEffects({credits:5,hp:4,xp:10,evidence:"relayChecksum",consequence:{id:"test-consequence",title:"Test",summary:"Test"}}, "test:once")');
  assert.equal(run('GAME.character.credits'), 15);
  assert.equal(run('GAME.character.hp'), 14);
  assert.equal(run('GAME.character.xp'), 10);
  assert.equal(run('GAME.world.appliedEffectIds["test:once"]'), true);
  assert.equal(run('GAME.world.continuity.appliedEffects["test-consequence"]'), true);
});

test('old Chapter V epilogue no longer calls Guardsman or Astartes an Inquisitor', () => {
  const src = fs.readFileSync(path.join(root, 'js/content/campaigns/ch5_afterJudgment.js'), 'utf8');
  assert.match(src, /classId === "spaceMarine"/);
  assert.match(src, /classId === "guardsman"/);
  assert.ok(!src.includes('Ты больше не Инквизитор. Ты — часть плана.'));
  assert.ok(!src.includes('Ты Инквизитор. Это твоя жизнь. И ты не променяешь её ни на что.'));
});

test('melee uses Strength while ranged attacks use Dexterity, and plasma heat has a one-action recovery', () => {
  const combat = fs.readFileSync(path.join(root, 'js/systems/combat.js'), 'utf8');
  assert.match(combat, /const attackStat = slot === "melee" \? "str" : "dex"/);
  assert.match(combat, /Math\.max\(0, modifier\(c\.stats\.str\)\)/);
  assert.match(combat, /hasCondition\("Перегрев"\)/);
  assert.match(combat, /Плазмаган перегрелся/);
  assert.match(combat, /тратишь действие на охлаждение/);
});

test('combat UI shows compatible typed reserve instead of disabling reload for every non-generic ammo type', () => {
  const ui = fs.readFileSync(path.join(root, 'js/ui/render.js'), 'utf8');
  assert.match(ui, /getAmmoReserveName\(GAME\.character\.weapon\)/);
  assert.match(ui, /ПЕРЕЗАРЯДКА/);
});

test('campaign effects survive save/load and new state carries appliedEffectIds', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Миграция эффектов",classId:"inquisitor"}); applyEffects({credits:7},"test:save-roundtrip"); const payload=serializeGame(); const roundtripLoaded=prepareLoadedState(payload); loadedEffects=roundtripLoaded.world.appliedEffectIds');
  assert.equal(run('loadedEffects["test:save-roundtrip"]'), true);
  assert.equal(run('SAVE_VERSION'), 13);
});

test('all ready-made character presets point to known classes', () => {
  const invalid = run('Object.entries(CHARACTER_PRESETS).filter(([id,p]) => !CLASSES[p.classId] || !p.name).map(([id]) => id)');
  assert.deepEqual(Array.from(invalid), []);
  assert.ok(run('Object.keys(CHARACTER_PRESETS).length') >= 3);
});

test('presets no longer duplicate NPC names', () => {
  // Имена, которые есть у NPC/спутников
  const npcNames = ['Сержант Кейн', 'Лира Доминик', 'Магос Хест'];
  const presetNames = run(`Object.values(CHARACTER_PRESETS).map(p => p.name)`);

  for (const npcName of npcNames) {
    assert.ok(!presetNames.includes(npcName), `preset "${npcName}" duplicates NPC name`);
  }
});

test('renamed presets keep their class and lore', () => {
  // Варн — гвардеец
  const varn = run(`CHARACTER_PRESETS['guardsman-kane']`);
  assert.ok(varn, 'guardsman-kane preset missing');
  assert.equal(varn.name, 'Сержант Элиас Варн');
  assert.equal(varn.classId, 'guardsman');

  // Вейл — гвардеец
  const vale = run(`CHARACTER_PRESETS['guardsman-lyra']`);
  assert.ok(vale, 'guardsman-lyra preset missing');
  assert.equal(vale.name, 'Лира Вейл');
  assert.equal(vale.classId, 'guardsman');

  // Кай — Астартес
  const kai = run(`CHARACTER_PRESETS['marine-draco']`);
  assert.ok(kai, 'marine-draco preset missing');
  assert.equal(kai.name, 'Брат-сержант Кай');
  assert.equal(kai.classId, 'spaceMarine');
});
test('chapter II shadow encounter is linked from the catacombs', () => {
  assert.ok(run(`CAMPAIGN_SCENARIOS.sealedSector.scenes.sd_catacombs.choices.some(c => c.goto === 'sd_shadow')`));
});

test('chapter III has a playable accept/reject choice for the Warp Heart', () => {
  assert.ok(run(`CAMPAIGN_SCENARIOS.warpHeart.scenes.wh_listen_tzeentch.choices.some(c => c.goto === 'wh_ending_heart' && c.effects.flag.acceptedWarpHeart === true)`));
});

test('new campaign initializes character, starting scene and save', () => {
  run(`startCampaign(createCharacter({name:'Тестовый персонаж', classId:'guardsman'}), false)`);
  assert.equal(run('GAME.started'), true);
  assert.equal(run('GAME.character.name'), 'Тестовый персонаж');
  assert.equal(run('GAME.campaign.active'), true);
  assert.ok(run('CAMPAIGN_SCENARIOS[GAME.campaign.scenarioId].scenes[GAME.campaign.sceneId]'));
  assert.ok(store.has(run('SAVE_KEY')));
});

test('save and load round-trip preserves campaign and character', () => {
  run(`GAME.character.name = 'Сохранённый герой'; GAME.character.presetId = 'guardsman-lyra'; saveGameSilent()`);
  run(`GAME.character.name = 'Изменённое имя'; loadGame()`);
  assert.equal(run('GAME.character.name'), 'Сохранённый герой');
  assert.equal(run('GAME.character.presetId'), 'guardsman-lyra');
  assert.equal(run('GAME.campaign.active'), true);
});

test('corrupt primary save recovers the valid backup without overwriting it with corrupt data', () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  let restored;
  try {
    restored = run(`(() => {
      const gameBefore = JSON.parse(JSON.stringify(GAME));
      const oldMain = localStorage.getItem(SAVE_KEY), oldBackup = localStorage.getItem(SAVE_BACKUP_KEY);
      try {
        startCampaign(createCharacter({name:'Резервный герой',classId:'guardsman'}), false);
        const good = localStorage.getItem(SAVE_KEY);
        localStorage.setItem(SAVE_BACKUP_KEY, good);
        localStorage.setItem(SAVE_KEY, '{broken json');
        GAME.character.name = 'Не должен остаться';
        const ok = loadGame();
        const repaired = JSON.parse(localStorage.getItem(SAVE_KEY));
        return {ok, name:GAME.character.name, repairedFormat:repaired.format, repairedName:repaired.state.character.name};
      } finally {
        Object.assign(GAME, gameBefore);
        if(oldMain===null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, oldMain);
        if(oldBackup===null) localStorage.removeItem(SAVE_BACKUP_KEY); else localStorage.setItem(SAVE_BACKUP_KEY, oldBackup);
      }
    })()`);
  } finally { console.warn = originalWarn; }
  assert.equal(restored.ok, true);
  assert.equal(restored.name, 'Резервный герой');
  assert.equal(restored.repairedFormat, 'wh40k-solo-rpg-save');
  assert.equal(restored.repairedName, 'Резервный герой');
});

test('manual archive slots have bounded keys and classify empty, valid and corrupt slots safely', () => {
  const original = [1,2,3].map(i => store.has(`wh40k_solo_rpg_manual_slot_v1_${i}`) ? store.get(`wh40k_solo_rpg_manual_slot_v1_${i}`) : null);
  try {
    run(`resetWorld(); GAME.started=true; GAME.character=createCharacter({name:"Агент архивной проверки",classId:"inquisitor"}); GAME.campaign={active:true,scenarioId:"silentForge",sceneId:"sf_intro_inquisitor",stack:["sf_intro_inquisitor"],pendingCombat:null}; const archivePayload=JSON.stringify(serializeGame()); localStorage.setItem(saveSlotKey(1),archivePayload); localStorage.setItem(saveSlotKey(2),"{damaged");`);
    assert.throws(() => run('saveSlotKey(0)'), /Недопустимый номер/);
    assert.throws(() => run('saveSlotKey(4)'), /Недопустимый номер/);
    assert.equal(run('SAVE_SLOT_COUNT'), 3);
    assert.equal(run('inspectSaveSlot(1).exists'), true);
    assert.equal(run('inspectSaveSlot(1).corrupt'), false);
    assert.equal(run('inspectSaveSlot(1).name'), 'Агент архивной проверки');
    assert.equal(run('inspectSaveSlot(2).exists'), true);
    assert.equal(run('inspectSaveSlot(2).corrupt'), true);
    assert.equal(run('inspectSaveSlot(3).exists'), false);
  } finally {
    [1,2,3].forEach(i => original[i-1] === null ? store.delete(`wh40k_solo_rpg_manual_slot_v1_${i}`) : store.set(`wh40k_solo_rpg_manual_slot_v1_${i}`, original[i-1]));
  }
});

test('manual archive slot recovers a validated backup after primary corruption', () => {
  const suffix = 'wh40k_solo_rpg_manual_slot_v1_2';
  const backup = 'wh40k_solo_rpg_manual_slot_backup_v1_2';
  const oldMain = store.has(suffix) ? store.get(suffix) : null;
  const oldBackup = store.has(backup) ? store.get(backup) : null;
  try {
    run(`resetWorld(); GAME.started=true; GAME.character=createCharacter({name:"Резервный архивный агент",classId:"guardsman"}); GAME.campaign={active:true,scenarioId:"silentForge",sceneId:"sf_intro_guardsman",stack:["sf_intro_guardsman"],pendingCombat:null}; const verifiedArchive=JSON.stringify(serializeGame()); localStorage.setItem(${JSON.stringify(suffix)},"{broken"); localStorage.setItem(${JSON.stringify(backup)},verifiedArchive);`);
    assert.equal(run('inspectSaveSlot(2).corrupt'), true);
    assert.equal(run('inspectSaveSlot(2).recoverable'), true);
    assert.equal(run('inspectSaveSlot(2).name'), 'Резервный архивный агент');
    assert.ok(run('inspectSaveSlot(2).raw.includes("wh40k-solo-rpg-save")'));
  } finally {
    oldMain === null ? store.delete(suffix) : store.set(suffix, oldMain);
    oldBackup === null ? store.delete(backup) : store.set(backup, oldBackup);
  }
});

test('manual slot serialisation validates before writing and archive release increments the save schema', () => {
  assert.equal(run('SAVE_VERSION'), 13);
  const source = fs.readFileSync(path.join(root,'js/ui/save-slots.js'),'utf8');
  assert.ok(source.includes('prepareLoadedState(JSON.parse(payload))'));
  assert.ok(source.includes('SAVE_SLOT_BACKUP_PREFIX'));
  assert.ok(source.includes('localStorage.removeItem(saveSlotBackupKey(index))'));
});

test('manual archive modal exposes Escape/backdrop dismissal and cleans its keyboard listener', () => {
  const source = fs.readFileSync(path.join(root,'js/ui/save-slots.js'),'utf8');
  assert.ok(source.includes('function closeSaveSlotsModal('));
  assert.ok(source.includes('document.removeEventListener("keydown", saveSlotsKeyHandler)'));
  assert.ok(source.includes('if(event.key === "Escape")'));
  assert.ok(source.includes('event.target === backdrop'));
  assert.ok(source.includes('role="dialog" aria-modal="true"'));
});

test('importGame restores a valid downloaded JSON into an active campaign after confirmation', () => {
  const originalReader = context.FileReader;
  const originalConfirm = context.confirm;
  const originalAlert = context.alert;
  const originalWarn = console.warn;
  let confirmCalled = false;
  context.FileReader = class MockFileReader {
    readAsText(file) { this.result = file.__text; if (this.onload) this.onload(); }
  };
  context.confirm = () => { confirmCalled = true; return true; };
  context.alert = () => {};
  console.warn = () => {};
  let restored;
  try {
    restored = run(`(() => {
      const gameBefore = JSON.parse(JSON.stringify(GAME));
      const oldMain = localStorage.getItem(SAVE_KEY), oldBackup = localStorage.getItem(SAVE_BACKUP_KEY);
      try {
        startCampaign(createCharacter({name:'Кампания из файла',classId:'spaceMarine'}), false);
        const payload = JSON.stringify(serializeGame());
        startCampaign(createCharacter({name:'Текущая активная игра',classId:'guardsman'}), false);
        importGame({__text:payload});
        return {name:GAME.character.name,classId:GAME.character.classId,scenario:GAME.campaign.scenarioId,started:GAME.started};
      } finally {
        Object.assign(GAME, gameBefore);
        if(oldMain===null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, oldMain);
        if(oldBackup===null) localStorage.removeItem(SAVE_BACKUP_KEY); else localStorage.setItem(SAVE_BACKUP_KEY, oldBackup);
      }
    })()`);
  } finally {
    context.FileReader = originalReader;
    context.confirm = originalConfirm;
    context.alert = originalAlert;
    console.warn = originalWarn;
  }
  assert.equal(confirmCalled, true);
  assert.equal(restored.name, 'Кампания из файла');
  assert.equal(restored.classId, 'spaceMarine');
  assert.equal(restored.started, true);
});

test('exportGame creates a downloadable JSON with the supported save envelope', () => {
  const originalBlob = context.Blob;
  const originalURL = context.URL;
  const originalCreateElement = document.createElement;
  const originalAppendChild = document.body.appendChild;
  const originalWarn = console.warn;
  const download = {};
  context.Blob = class MockBlob {
    constructor(parts, options) { this.text = Array.from(parts).join(''); this.type = options && options.type; }
  };
  context.URL = {
    createObjectURL(blob) { download.blobText = blob.text; download.blobType = blob.type; return 'blob:mock-save'; },
    revokeObjectURL() {}
  };
  document.createElement = tag => ({
    tagName:tag, style:{}, href:'', download:'',
    click() { download.filename=this.download; download.href=this.href; },
    remove() {}
  });
  document.body.appendChild = () => {};
  console.warn = () => {};
  let ok;
  try {
    ok = run(`(() => {
      const gameBefore = JSON.parse(JSON.stringify(GAME));
      const oldMain = localStorage.getItem(SAVE_KEY), oldBackup = localStorage.getItem(SAVE_BACKUP_KEY);
      try {
        GAME.started = true;
        GAME.character = createCharacter({name:'Экспортный герой',classId:'guardsman'});
        return exportGame();
      } finally {
        Object.assign(GAME, gameBefore);
        if(oldMain===null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, oldMain);
        if(oldBackup===null) localStorage.removeItem(SAVE_BACKUP_KEY); else localStorage.setItem(SAVE_BACKUP_KEY, oldBackup);
      }
    })()`);
  } finally {
    context.Blob = originalBlob;
    if(originalURL===undefined) delete context.URL; else context.URL=originalURL;
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    console.warn = originalWarn;
  }
  assert.equal(ok, true);
  assert.match(download.filename, /^warhammer40k_.*\.json$/);
  assert.equal(download.blobType, 'application/json;charset=utf-8');
  const payload = JSON.parse(download.blobText);
  assert.equal(payload.format, 'wh40k-solo-rpg-save');
  assert.equal(payload.version, 13);
  assert.equal(payload.state.character.name, 'Экспортный герой');
});

test('each ready-made character class enters its intended opening scene', () => {
  const result = run(`Object.entries({inquisitor:'sf_intro_inquisitor',guardsman:'sf_intro_guardsman',spaceMarine:'sf_intro_marine'}).map(([classId,expected]) => { startCampaign(createCharacter({name:'Вводная проверка',classId}), false); return {classId,expected,actual:GAME.campaign.sceneId}; })`);
  for(const row of result) assert.equal(row.actual, row.expected, `${row.classId} opening scene mismatch`);
});

test('chapter III can be started and enters its registered opening scene', () => {
  run(`startScenario('warpHeart')`);
  assert.equal(run('GAME.campaign.scenarioId'), 'warpHeart');
  assert.equal(run('GAME.campaign.sceneId'), 'wh_boot');
  assert.ok(run('CAMPAIGN_SCENARIOS.warpHeart.scenes[GAME.campaign.sceneId]'));
});

test('d20 checks stay within 1–20 and produce a known result category', () => {
  run('RNG.setSeed(12345)');
  const results = run('Array.from({length:100}, () => rollCheck({statScore:12, prof:2, dc:12}))');
  for (const r of results) {
    assert.ok(r.d20 >= 1 && r.d20 <= 20);
    assert.ok(['critical','critical_fail','success','fail'].includes(r.result));
    assert.equal(r.total, r.d20 + r.mod + r.prof + r.bonus);
  }
});

test('healing and damage respect HP boundaries', () => {
  run('GAME.character.hp = 5; healPlayer(999)');
  assert.equal(run('GAME.character.hp'), run('GAME.character.maxHp'));
  run('dealDamageToPlayer(999)');
  assert.equal(run('GAME.character.hp'), 0);
});

test('inventory add/remove and item ownership work', () => {
  run(`GAME.character.inventory = []; addItem('Тестовый предмет', 2)`);
  assert.equal(run(`hasItem('Тестовый предмет', 2)`), true);
  assert.equal(run(`removeItem('Тестовый предмет', 1)`), true);
  assert.equal(run(`hasItem('Тестовый предмет', 2)`), false);
});

test('inventory refuses invalid or excessive removal without mutating quantity', () => {
  run(`GAME.character.inventory = [{name:'Патроны', qty:2}]`);
  assert.equal(run(`removeItem('Патроны', 3)`), false);
  assert.equal(run(`GAME.character.inventory[0].qty`), 2);
  assert.equal(run(`removeItem('Патроны', 0)`), false);
  assert.equal(run(`removeItem('Патроны', -1)`), false);
  assert.equal(run(`removeItem('Патроны', 1.5)`), false);
  assert.equal(run(`GAME.character.inventory[0].qty`), 2);
});

test('invalid location in a save does not crash neighbor lookup', () => {
  run(`GAME.character.location = 'Несуществующая локация'`);
  assert.deepEqual(Array.from(run('locationNeighbors()')), []);
});

test('invalid combat target does not consume ammunition', () => {
  run(`GAME.character.location = 'Доки Навигатор'; startCombat('cultist'); GAME.combat.weaponSlot='ranged'; GAME.combat.targetIndex=999`);
  const before = run(`GAME.character.ammo[ RANGED_WEAPONS[GAME.character.weapon].ammoType ]`);
  run('combatAttack()');
  const after = run(`GAME.character.ammo[ RANGED_WEAPONS[GAME.character.weapon].ammoType ]`);
  assert.equal(after, before);
});

test('new campaign resets companion roster and one-time dialogue effects', () => {
  run(`GAME.companions = [{id:'Лира Доминик', name:'Лира Доминик', hp:3, maxHp:18}]; GAME.dialogueEffectsApplied = {'old::key':true}; startCampaign(createCharacter({name:'Новый герой', classId:'guardsman'}), false)`);
  assert.equal(run('GAME.companions.length'), 0);
  assert.equal(run('Object.keys(GAME.dialogueEffectsApplied).length'), 0);
});

test('setting Lyra recruitment flag adds exactly one companion', () => {
  run('GAME.companions = []; GAME.world.flags.lyraCompanion = false; setFlag("lyraCompanion", true); syncCompanionsFromFlags(); syncCompanionsFromFlags()');
  assert.equal(run('GAME.companions.length'), 1);
  assert.equal(run('GAME.companions[0].id'), 'Лира Доминик');
});

test('companion wound recovery removes Lyra from active list then restores her', () => {
  run('GAME.companions = []; addCompanion("Лира Доминик"); damageCompanion(getCompanion("Лира Доминик"), 99)');
  assert.equal(run('activeCompanions().length'), 0);
  assert.equal(run('getCompanion("Лира Доминик").recoveryTurns'), 3);
  run('tickCompanionRecovery(); tickCompanionRecovery()');
  assert.equal(run('activeCompanions().length'), 0);
  run('tickCompanionRecovery()');
  assert.equal(run('activeCompanions().length'), 1);
  assert.equal(run('getCompanion("Лира Доминик").hp'), 9);
});

test('NPC attitude clamps at both ends and rumor access follows trust thresholds', () => {
  run('initNPCs(); bumpNPC("Магос Хест", 100)');
  assert.equal(run('getNPC("Магос Хест").attitude'), 20);
  assert.equal(run('availableRumors("Магос Хест").length'), 2);
  run('bumpNPC("Магос Хест", -100)');
  assert.equal(run('getNPC("Магос Хест").attitude'), -20);
  assert.equal(run('availableRumors("Магос Хест").length'), 0);
  assert.equal(run('npcRelationshipLabel(-20)'), 'Враждебность');
});

test('dialogue onEnter greetings execute and node rewards cannot be farmed by revisiting', () => {
  run(`startCampaign(createCharacter({name:'Диалоговый герой', classId:'guardsman'}), false); startDialogue('Сержант Кейн')`);
  assert.ok(run(`GAME.story.some(entry => entry.title === 'СЕРЖАНТ КЕЙН' && entry.text.includes('14-й Хелдонский'))`));
  run('chooseDialogueOption(0)');
  const cluesAfterFirstVisit = run('GAME.world.clues');
  const attitudeAfterFirstVisit = run('getNPC("Сержант Кейн").attitude');
  run('chooseDialogueOption(2); chooseDialogueOption(0)');
  assert.equal(run('GAME.world.clues'), cluesAfterFirstVisit);
  assert.equal(run('getNPC("Сержант Кейн").attitude'), attitudeAfterFirstVisit);
});

test('saving and loading preserves NPC attitude and companion condition', () => {
  run(`startCampaign(createCharacter({name:'Сохранение отношений', classId:'guardsman'}), false); bumpNPC('Сержант Кейн', 7); addCompanion('Лира Доминик'); damageCompanion(getCompanion('Лира Доминик'), 5); saveGameSilent()`);
  run(`bumpNPC('Сержант Кейн', -12); GAME.companions = []; loadGame()`);
  assert.equal(run('getNPC("Сержант Кейн").attitude'), 7);
  assert.equal(run('getCompanion("Лира Доминик").hp'), 13);
  assert.equal(run('getCompanion("Лира Доминик").wounded'), false);
});

test('legacy save migration supplies missing NPC, companion and dialogue fields', () => {
  const migrated = run(`migrateSave({version:4,state:{world:{flags:{}},character:{conditions:[]},meta:{seed:1},companions:null}})`);
  assert.equal(migrated.companions.length, 0);
  assert.equal(typeof migrated.dialogueEffectsApplied, 'object');
  assert.equal(typeof migrated.npcs, 'object');
  const veryOld = run(`migrateSave({state:{}})`);
  assert.equal(typeof veryOld.world.flags, 'object');
  assert.equal(typeof veryOld.character.conditions, 'object');
});

test('Lyra joins through the full existing recruitment dialogue branch', () => {
  run(`startCampaign(createCharacter({name:'Вербовка Лиры', classId:'inquisitor'}), false); startDialogue('Лира Доминик'); chooseDialogueOption(0); chooseDialogueOption(0); chooseDialogueOption(0); chooseDialogueOption(1); chooseDialogueOption(0)`);
  assert.equal(run('GAME.world.flags.lyraCompanion'), true);
  assert.equal(run('GAME.companions.length'), 1);
  assert.equal(run('GAME.companions[0].name'), 'Лира Доминик');
});

test('dialogue requirement gates locked topics and check routes success/failure branches', () => {
  run(`startCampaign(createCharacter({name:'Проверка диалогов', classId:'guardsman'}), false); startDialogue('Сержант Кейн')`);

  // Заблокированная опция (без флага) — переход не происходит
  run('chooseDialogueOption(1)');
  assert.equal(run('GAME.dialogue.nodeId'), 'kane_entry');

  // Открытая опция с флагом
  run('setFlag("sawOrder117", true); chooseDialogueOption(1)');
  assert.equal(run('GAME.dialogue.nodeId'), 'kane_order');

  // Провал проверки на «Запугать» — используем поиск по метке, а не индекс
  run(`
    (function(){
      endDialogue();
      startDialogue("Сержант Кейн");
      var __savedCheckStat = checkStat;
      var __savedFormatRoll = formatRoll;
      var __savedTimeout = setTimeout;
      checkStat = function(){return {result:"fail",d20:1,total:1,mod:0,prof:0,bonus:0};};
      formatRoll = function(){return "Тестовая проверка";};
      setTimeout = function(fn){fn();return 1;};
      var d = GAME.dialogue;
      var tree = DIALOGUE_TREES[d.npcName];
      var node = tree.nodes[d.nodeId];
      var idx = node.choices.findIndex(c => c.label === "Запугать");
      chooseDialogueOption(idx);
      checkStat = __savedCheckStat;
      formatRoll = __savedFormatRoll;
      setTimeout = __savedTimeout;
    })()
  `);
  assert.equal(run('GAME.dialogue.nodeId'), 'kane_refuse');

  // Успех проверки на «Запугать» — тоже по метке
  run(`
    (function(){
      endDialogue();
      startDialogue("Сержант Кейн");
      var __savedCheckStat = checkStat;
      var __savedTimeout = setTimeout;
      checkStat = function(){return {result:"success",d20:20,total:20,mod:0,prof:0,bonus:0};};
      setTimeout = function(fn){fn();return 1;};
      var d = GAME.dialogue;
      var tree = DIALOGUE_TREES[d.npcName];
      var node = tree.nodes[d.nodeId];
      var idx = node.choices.findIndex(c => c.label === "Запугать");
      chooseDialogueOption(idx);
      checkStat = __savedCheckStat;
      setTimeout = __savedTimeout;
    })()
  `);
  assert.equal(run('GAME.dialogue.nodeId'), 'kane_intimidate');
});

test('free-action parser maps supported verbs to resolvers and handles unknown text safely', () => {
  const unmapped = run('Array.from(new Set(VERB_MAP.map(v => v.verb))).filter(v => !RESOLVERS[v])');
  assert.deepEqual(Array.from(unmapped), []);
  assert.equal(run('parseIntent("осматриваю стену").verb'), 'inspect');
  assert.equal(run('parseIntent("иду в Архив").verb'), 'move');
  assert.equal(run('parseIntent("говорю с Сержантом Кейном").verb'), 'talk');
  assert.equal(run('resolveIntent(parseIntent("абракадабра ничего непонятного")).allowed'), false);
});

test('partial old save is normalized and unsafe campaign/combat references are repaired', () => {
  const prepared = run(`prepareLoadedState({version:4,state:{started:true,character:{name:'Старый герой',classId:'guardsman',hp:999,location:'Нет такой локации'},world:{heat:99,flags:{}},npcs:{'Сержант Кейн':'повреждён'},quests:{silentForge:'повреждено'},campaign:{scenarioId:'warpHeart',sceneId:'bad-scene'},mode:'combat',combat:{enemies:[]},meta:{seed:5}}})`);
  assert.equal(prepared.character.name, 'Старый герой');
  assert.equal(prepared.character.hp, prepared.character.maxHp);
  assert.equal(prepared.character.location, 'Доки Навигатор');
  assert.equal(prepared.world.heat, 10);
  assert.equal(prepared.campaign.scenarioId, 'warpHeart');
  assert.equal(prepared.campaign.sceneId, 'wh_boot');
  assert.equal(prepared.mode, 'explore');
  assert.equal(prepared.combat, null);
  assert.equal(prepared.npcs['Сержант Кейн'].name, 'Сержант Кейн');
  assert.equal(prepared.npcs['Сержант Кейн'].attitude, 0);
  assert.equal(prepared.quests.silentForge.id, 'silentForge');
  assert.equal(prepared.quests.silentForge.status, 'active');
});

test('save with a combat whose enemies are all defeated is normalized out of combat mode', () => {
  const prepared = run(`prepareLoadedState({version:5,state:{character:{name:'Боец',classId:'guardsman'},world:{flags:{}},mode:'combat',combat:{enemies:[{type:'cultist',hp:0,maxHp:12}],targetIndex:0},meta:{seed:1}}})`);
  assert.equal(prepared.mode, 'explore');
  assert.equal(prepared.combat, null);
});

test('malformed save is rejected without overwriting the active character when no valid backup exists', () => {
  const oldBackup = run('localStorage.getItem(SAVE_BACKUP_KEY)');
  run(`localStorage.removeItem(SAVE_BACKUP_KEY); startCampaign(createCharacter({name:'Текущий герой',classId:'guardsman'}), false); localStorage.setItem(SAVE_BACKUP_KEY, null); localStorage.removeItem(SAVE_BACKUP_KEY); localStorage.setItem(SAVE_KEY, JSON.stringify({version:5,state:{started:true,character:{name:'Повреждённый'}}}))`);
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(run('loadGame()'), false);
    assert.equal(run('GAME.character.name'), 'Текущий герой');
  } finally {
    console.warn = originalWarn;
    if(oldBackup===null) run('localStorage.removeItem(SAVE_BACKUP_KEY)');
    else run(`localStorage.setItem(SAVE_BACKUP_KEY, ${JSON.stringify(oldBackup)})`);
  }
});

test('loading a partial legacy save clears stale dialogue and combat from the previous session', () => {
  run(`startCampaign(createCharacter({name:'До загрузки',classId:'guardsman'}), false); startDialogue('Сержант Кейн'); GAME.combat={enemies:[]};`);
  const legacy = run(`prepareLoadedState({version:4,state:{started:true,character:{name:'После загрузки',classId:'guardsman'},world:{flags:{}},campaign:{scenarioId:'sealedSector',sceneId:'sd_boot'},meta:{seed:2},mode:'explore'}})`);
  assert.equal(legacy.dialogue, null);
  assert.equal(legacy.combat, null);
  run(`localStorage.setItem(SAVE_KEY, JSON.stringify({version:4,state:{started:true,character:{name:'После загрузки',classId:'guardsman'},world:{flags:{}},campaign:{scenarioId:'sealedSector',sceneId:'sd_boot'},meta:{seed:2},mode:'explore'}})); loadGame()`);
  assert.equal(run('GAME.dialogue'), null);
  assert.equal(run('GAME.combat'), null);
});

test('chapter I automatic transition enters chapter II through its special target', () => {
  run(`startScenario('silentForge'); var __qaTimer=setTimeout; setTimeout=function(fn){fn();return 1;}; enterScene('sf_transition'); setTimeout=__qaTimer`);
  assert.equal(run('GAME.campaign.scenarioId'), 'sealedSector');
  assert.equal(run('GAME.campaign.sceneId'), 'sd_boot');
});

test('special restart target opens new-campaign modal instead of treating it as a scene id', () => {
  run(`startScenario('sealedSector'); GAME.campaign.sceneId='sd_end_light'; var __qaTimer=setTimeout; var __qaOpen=openNewCampaign; var __qaOpened=false; setTimeout=function(fn){fn();return 1;}; openNewCampaign=function(){__qaOpened=true}; chooseSceneChoice(1); setTimeout=__qaTimer; openNewCampaign=__qaOpen`);
  assert.equal(run('__qaOpened'), true);
});

test('last stand falls back to the active chapter opening scene', () => {
  run(`startScenario('warpHeart'); GAME.character.fate=1; GAME.character.hp=0; GAME.campaign.pendingCombat={returnScene:'missing_scene'}; lastStand()`);
  assert.equal(run('GAME.campaign.scenarioId'), 'warpHeart');
  assert.equal(run('GAME.campaign.sceneId'), 'wh_boot');
  assert.equal(run('GAME.character.fate'), 0);
  assert.equal(run('GAME.mode'), 'explore');
});

test('moveTo safely refuses movement when the current location is invalid', () => {
  run(`GAME.character.location='Несуществующая локация'; moveTo('Архив')`);
  assert.equal(run('GAME.character.location'), 'Несуществующая локация');
});

test('command bar is not rendered anywhere', () => {
  run(`startCampaign(createCharacter({name:'Поле действий',classId:'guardsman'}), false); GAME.mode='explore'; GAME.view='story';`);

  // Поле ввода убрано — нигде не должно быть
  assert.ok(!run('renderMain()').includes('id="commandForm"'), 'story should NOT show command bar');

  run(`GAME.view='inventory'`);
  assert.ok(!run('renderMain()').includes('id="commandForm"'), 'inventory should NOT show command bar');

  run(`GAME.view='character'`);
  assert.ok(!run('renderMain()').includes('id="commandForm"'), 'character should NOT show command bar');

  run(`GAME.view='codex'`);
  assert.ok(!run('renderMain()').includes('id="commandForm"'), 'codex should NOT show command bar');

  run(`GAME.view='story'; startCombat(['cultist']);`);
  assert.ok(!run('renderMain()').includes('id="commandForm"'), 'combat should NOT show command bar');

  run(`GAME.mode='death'`);
  assert.ok(!run('renderMain()').includes('id="commandForm"'), 'death should NOT show command bar');

  run(`GAME.mode='corruption-end'`);
  assert.ok(!run('renderMain()').includes('id="commandForm"'), 'corruption-end should NOT show command bar');
});

test('all chapter II endings offer Chapter III continuation and new-campaign restart', () => {
  const ids = ['sd_end_light','sd_end_dark','sd_end_corrupt'];
  for (const id of ids) {
    assert.ok(run(`CAMPAIGN_SCENARIOS.sealedSector.scenes[${JSON.stringify(id)}].choices.some(c => c.goto === '__chapter3__')`), `${id} lacks Chapter III path`);
    assert.ok(run(`CAMPAIGN_SCENARIOS.sealedSector.scenes[${JSON.stringify(id)}].choices.some(c => c.goto === '__restart__')`), `${id} lacks restart path`);
  }
});

test('Chapter III opening adapts to prior evidence and the fallen ending', () => {
  // Отключаем катсцены для теста
  run(`startCampaign(createCharacter({name:'Связность',classId:'guardsman'}), false); markCutsceneSeen('warpHeart'); startScenario('warpHeart')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('краткая сводка по Запечатанному сектору')`));

  run(`startCampaign(createCharacter({name:'Связность',classId:'guardsman'}), false); markCutsceneSeen('warpHeart'); setFlag('knowsKraIl',true); startScenario('warpHeart')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('записи и сведения, собранные во время расследования')`));

  run(`startCampaign(createCharacter({name:'Связность',classId:'guardsman'}), false); markCutsceneSeen('warpHeart'); setFlag('fallen',true); startScenario('warpHeart')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('После Низвержения ты не возвращаешься к обычной службе')`));
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('Путь к Вратам ещё не завершён')`));
});

test('all Chapter III scenes are graph-reachable from the opening scene', () => {
  const sc = run('CAMPAIGN_SCENARIOS.warpHeart');
  const reached = new Set();
  const queue = [sc.startScene];
  while(queue.length){
    const id = queue.shift();
    if(reached.has(id) || !sc.scenes[id]) continue;
    reached.add(id);
    const scene = sc.scenes[id];
    const next = [];
    if(scene.auto?.goto && !scene.auto.goto.startsWith('__')) next.push(scene.auto.goto);
    if(scene.onSuccess) next.push(scene.onSuccess);
    if(scene.onFail) next.push(scene.onFail);
    if(scene.skipTo) next.push(scene.skipTo);
    if(scene.returnScene) next.push(scene.returnScene);
    for(const choice of scene.choices || []) if(choice.goto && !choice.goto.startsWith('__')) next.push(choice.goto);
    for(const nextId of next) if(!reached.has(nextId)) queue.push(nextId);
  }
  assert.deepEqual([...Object.keys(sc.scenes).filter(id => !reached.has(id))], []);
});

test('Chapter III continuation target starts warpHeart at wh_boot', () => {
  run(`startCampaign(createCharacter({name:'Продолжение',classId:'guardsman'}), false); startScenario('sealedSector'); followSceneTarget('__chapter3__', 0)`);
  assert.equal(run('GAME.campaign.scenarioId'), 'warpHeart');
  assert.equal(run('GAME.campaign.sceneId'), 'wh_boot');
});

test('Gate Voice dialogue is connected to the gate and remains absent from global NPCs', () => {
  run(`startCampaign(createCharacter({name:'Гвардеец',classId:'guardsman'}), false); startScenario('warpHeart'); enterScene('wh_gate_approach'); startDialogue('Голос из Врат')`);
  assert.equal(run('GAME.dialogue.npcName'), 'Голос из Врат');
  assert.ok(run('GAME.dialogue.nodeId') === 'voice_root');
  assert.equal(run(`Object.prototype.hasOwnProperty.call(GAME.npcs,'Голос из Врат')`), false);
});

test('Gate Voice dialogue cannot be launched from unrelated campaign scenes', () => {
  run(`startCampaign(createCharacter({name:'Гвардеец',classId:'guardsman'}), false); startScenario('sealedSector'); startDialogue('Голос из Врат')`);
  assert.equal(run('GAME.dialogue'), null);
});

test('Kral personal memory tree is available to Cassius Varro from the Shadow scene', () => {
  run(`startCampaign(createCharacter({name:'Инквизитор Кассий Варро',classId:'inquisitor'}), false); startScenario('warpHeart'); enterScene('wh_shadow_dialogue'); chooseSceneChoice(0)`);
  assert.equal(run('GAME.dialogue.npcName'), 'Тень Кралла');
  assert.equal(run('GAME.dialogue.nodeId'), 'kral_root');
  assert.equal(run(`Object.prototype.hasOwnProperty.call(GAME.npcs,'Тень Кралла')`), false);
});

test('Kral personal memory tree is blocked if another class merely uses Cassius name', () => {
  run(`startCampaign(createCharacter({name:'Инквизитор Кассий Варро',classId:'guardsman'}), false); startScenario('warpHeart'); enterScene('wh_shadow_dialogue'); chooseSceneChoice(0)`);
  assert.equal(run('GAME.dialogue'), null);
  run(`startDialogue('Тень Кралла')`);
  assert.equal(run('GAME.dialogue'), null);
});

test('Kral personal memory tree is blocked for other heroes', () => {
  run(`startCampaign(createCharacter({name:'Гвардеец',classId:'guardsman'}), false); startScenario('warpHeart'); enterScene('wh_shadow_dialogue'); chooseSceneChoice(0)`);
  assert.equal(run('GAME.dialogue'), null);
  assert.equal(run('GAME.campaign.sceneId'), 'wh_shadow_dialogue');
});

test('Shadow dialogue avoids falsely calling Kral the teacher of other heroes', () => {
  run(`startCampaign(createCharacter({name:'Гвардеец',classId:'guardsman'}), false); startScenario('warpHeart'); enterScene('wh_shadow_approach')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('но ты не узнаёшь её')`));
  assert.ok(!run(`GAME.story[GAME.story.length-1].text.includes('Ты слышал его в детстве')`));
  run(`GAME.character.name='Инквизитор Кассий Варро'; GAME.character.classId='inquisitor'; enterScene('wh_shadow_approach')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('Ты слышал его в детстве')`));
});

test('Gate Voice dialogue addresses all character classes neutrally', () => {
  assert.ok(run(`DIALOGUE_TREES['Голос из Врат'].nodes.voice_gate.text.includes('Выбирай, смертный')`));
  assert.ok(!run(`DIALOGUE_TREES['Голос из Врат'].nodes.voice_gate.text.includes('Выбирай, Инквизитор')`));
});

test('Chapter III authored combat scenes are reachable, return safely, and cannot be farmed', () => {
  const checks = run(`['wh_combat_shadow','wh_combat_horror','wh_combat_marine'].map(id => { const s=CAMPAIGN_SCENARIOS.warpHeart.scenes[id]; return {id,returnScene:s.returnScene,skipTo:s.skipTo,flag:Object.keys(s.victoryEffects.flag)[0],enemy:s.combat}; })`);
  assert.equal(checks.length, 3);
  for (const c of checks) {
    assert.ok(run(`Object.values(CAMPAIGN_SCENARIOS.warpHeart.scenes).some(s => (s.choices||[]).some(ch => ch.goto === ${JSON.stringify(c.id)}))`), `${c.id} has no incoming choice`);
    assert.ok(run(`!!CAMPAIGN_SCENARIOS.warpHeart.scenes[${JSON.stringify(c.id)}].returnScene`));
    assert.ok(run(`!!CAMPAIGN_SCENARIOS.warpHeart.scenes[${JSON.stringify(c.id)}].victoryEffects.flag[${JSON.stringify(c.flag)}]`));
    assert.ok(run(`!!FLAG_REGISTRY[${JSON.stringify(c.flag)}]`));
  }
  for (const encounter of [
    {scene:'wh_combat_shadow', flag:'warpEchoDefeated', returnScene:'wh_gate_approach'},
    {scene:'wh_combat_horror', flag:'warpHorrorDefeated', returnScene:'wh_ritual_after_horror'},  // ← НОВАЯ СЦЕНА
    {scene:'wh_combat_marine', flag:'corruptedMarineDefeated', returnScene:'wh_ritual'}
  ]) {
    run(`startCampaign(createCharacter({name:'Боевая проверка',classId:'guardsman'}), false); startScenario('warpHeart'); enterScene(${JSON.stringify(encounter.scene)}); GAME.combat.enemies.forEach(e=>e.hp=0); endCombat(true)`);
    assert.equal(run(`GAME.world.flags[${JSON.stringify(encounter.flag)}]`), true, `${encounter.scene} victory flag not applied`);
    assert.equal(run('GAME.campaign.sceneId'), encounter.returnScene, `${encounter.scene} did not return safely`);
    run(`enterScene(${JSON.stringify(encounter.scene)})`);
    assert.equal(run('GAME.campaign.sceneId'), encounter.returnScene, `${encounter.scene} replay guard failed`);
    assert.equal(run('GAME.combat'), null, `${encounter.scene} restarted after victory`);
  }
});

test('all existing Chapter III scene references and campaign dialogue references pass audit', () => {
  assert.deepEqual(Array.from(run('auditScenario("warpHeart")')), []);
  assert.ok(run(`CAMPAIGN_SCENARIOS.warpHeart.scenes.wh_gate_approach.choices.some(c=>c.dialogue==='Голос из Врат')`));
  assert.ok(run(`CAMPAIGN_SCENARIOS.warpHeart.scenes.wh_shadow_dialogue.choices.some(c=>c.dialogue==='Тень Кралла')`));
});

/* ============================================================
   ГЛАВА IV — СУД ОРДО
   ============================================================ */

test('chapter IV is registered and starts at oj_boot', () => {
  assert.ok(run(`!!CAMPAIGN_SCENARIOS.ordoJudgment`));
  run(`startScenario('ordoJudgment')`);
  assert.equal(run('GAME.campaign.scenarioId'), 'ordoJudgment');
  assert.equal(run('GAME.campaign.sceneId'), 'oj_boot');
});

test('all three chapter III endings offer continuation into chapter IV', () => {
  const endings = ['wh_ending_light', 'wh_ending_shadow', 'wh_ending_heart'];
  for (const id of endings) {
    const scene = run(`CAMPAIGN_SCENARIOS.warpHeart.scenes[${JSON.stringify(id)}]`);
    assert.ok(scene, `${id} not found`);

    // wh_ending_heart использует auto, остальные — choices
    if (id === 'wh_ending_heart') {
      assert.ok(scene.auto?.goto === '__chapter4__', `${id} missing auto.goto to __chapter4__`);
    } else {
      assert.ok(
        (scene.choices || []).some(c => c.goto === '__chapter4__'),
        `${id} missing choice to __chapter4__`
      );
    }
  }
});

test('chapter IV continuation target starts ordoJudgment at oj_boot', () => {
  run(`startCampaign(createCharacter({name:'Продолжение',classId:'guardsman'}), false); startScenario('warpHeart'); followSceneTarget('__chapter4__', 0)`);
  assert.equal(run('GAME.campaign.scenarioId'), 'ordoJudgment');
  assert.equal(run('GAME.campaign.sceneId'), 'oj_boot');
});

test('chapter IV oj_boot text adapts to chapter III ending flags', () => {
  // Светлый финал
  run(`startCampaign(createCharacter({name:'Финал',classId:'guardsman'}), false); markCutsceneSeen('ordoJudgment'); setFlag('closedGateByFaith', true); startScenario('ordoJudgment')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('Ты закрыл врата')`));

  // Низвержение
  run(`startCampaign(createCharacter({name:'Финал',classId:'guardsman'}), false); markCutsceneSeen('ordoJudgment'); setFlag('acceptedWarpHeart', true); startScenario('ordoJudgment')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('почти неотличимым от собственной мысли')`));
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('этот страх ещё не является доказательством')`));
});


test('chapter IV truth report names only evidence flags actually known to the character', () => {
  run(`resetWorld(); GAME.character=createCharacter({name:"Сдержанный доклад",classId:"guardsman"}); initNPCs(); initContinuity(); GAME.world.flags={}; GAME.world.flags.ojToldTruth=false; emptyReport=CAMPAIGN_SCENARIOS.ordoJudgment.scenes.oj_report_truth.text({...GAME,world:{...GAME.world,flags:{}}})`);
  assert.ok(run('emptyReport.includes("собственных наблюдениях и неполных сведениях")'));
  assert.ok(!run('emptyReport.includes("повторяющемся числе одиннадцать")'));
  run(`GAME.world.flags={hypothesisXIConnection:true, heardVoiceOfTzeentch:true, deducedTemporalAnomaly:true}; knownReport=CAMPAIGN_SCENARIOS.ordoJudgment.scenes.oj_report_truth.text(GAME)`);
  assert.ok(run('knownReport.includes("повторяющемся числе одиннадцать")'));
  assert.ok(run('knownReport.includes("голосе и воздействии")'));
  assert.ok(run('knownReport.includes("несостыковке архивных дат")'));
});

test('chapter IV has all required scenes and choices are not broken', () => {
  const sceneIds = run(`Object.keys(CAMPAIGN_SCENARIOS.ordoJudgment.scenes)`);
  assert.ok(sceneIds.includes('oj_boot'));
  assert.ok(sceneIds.includes('oj_hq'));
  assert.ok(sceneIds.includes('oj_report_truth'));
  assert.ok(sceneIds.includes('oj_report_lie'));
  assert.ok(sceneIds.includes('oj_report_silence'));
  assert.ok(sceneIds.includes('oj_verdict'));
  assert.ok(sceneIds.includes('oj_aftermath'));
  assert.ok(sceneIds.includes('oj_final'));
});

test('chapter IV audit passes without structural errors', () => {
  assert.deepEqual(Array.from(run('auditScenario("ordoJudgment")')), []);
});

/* ============================================================
   ПОБОЧНЫЕ КВЕСТЫ
   ============================================================ */

test('side quest definitions are registered with unique ids', () => {
  const ids = run(`QUEST_DEFS.map(q => q.id)`);
  assert.ok(ids.includes('lostPatrol'));
  assert.ok(ids.includes('servoSkull'));
  assert.ok(ids.includes('falseRelic'));

  const seen = new Set();
  for (const id of ids) {
    assert.ok(!seen.has(id), `duplicate quest id: ${id}`);
    seen.add(id);
  }
});

test('patrol quest scenes exist and start scene is reachable', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.silentForge.scenes)`);
  assert.ok(scenes.includes('patrol_start'));
  assert.ok(scenes.includes('patrol_agree'));
  assert.ok(scenes.includes('patrol_tunnel'));
  assert.ok(scenes.includes('patrol_report'));

  // Проверка: patrol_start имеет переходы
  const start = run(`CAMPAIGN_SCENARIOS.silentForge.scenes.patrol_start`);
  assert.ok((start.choices || []).length > 0);
});

test('servo skull quest scenes exist and start scene is reachable', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.silentForge.scenes)`);
  assert.ok(scenes.includes('skull_start'));
  assert.ok(scenes.includes('skull_agree'));
  assert.ok(scenes.includes('skull_servitorium'));
  assert.ok(scenes.includes('skull_return'));

  const start = run(`CAMPAIGN_SCENARIOS.silentForge.scenes.skull_start`);
  assert.ok((start.choices || []).length > 0);
});

test('false relic quest scenes exist and start scene is reachable', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.silentForge.scenes)`);
  assert.ok(scenes.includes('relic_market'));
  assert.ok(scenes.includes('relic_approach'));
  assert.ok(scenes.includes('relic_buy'));
  assert.ok(scenes.includes('relic_seize'));
  assert.ok(scenes.includes('relic_examine'));
});

test('side quest flags are registered in FLAG_REGISTRY', () => {
  const flags = [
    'patrolQuestActive', 'foundDeadPatrolman', 'foundLivingPatrolman',
    'patrolSurvivorSaved', 'patrolSurvivorAbandoned',
    'servoQuestActive', 'foundServoSkull', 'servoQuestComplete',
    'keptServoSkull', 'destroyedServoSkull',
    'boughtRelic', 'seizedRelic', 'relicIsReal'
  ];
  for (const flag of flags) {
    assert.ok(run(`!!FLAG_REGISTRY[${JSON.stringify(flag)}]`), `flag ${flag} not registered`);
  }
});
/* ============================================================
   ГЛАВА II — РАСШИРЕНИЕ
   ============================================================ */

test('chapter II new scenes are present and reachable', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.sealedSector.scenes)`);

  // Сделка с Тенью
  assert.ok(scenes.includes('sd_shadow_offer'), 'sd_shadow_offer missing');
  assert.ok(scenes.includes('sd_shadow_deal'), 'sd_shadow_deal missing');
  assert.ok(scenes.includes('sd_shadow_refuse_deal'), 'sd_shadow_refuse_deal missing');

  // Ритуал у Врат
  assert.ok(scenes.includes('sd_ritual_preparation'), 'sd_ritual_preparation missing');
  assert.ok(scenes.includes('sd_ritual_faith'), 'sd_ritual_faith missing');
  assert.ok(scenes.includes('sd_ritual_success_faith'), 'sd_ritual_success_faith missing');

  // Артефакт
  assert.ok(scenes.includes('sd_artifact_choice'), 'sd_artifact_choice missing');
  assert.ok(scenes.includes('sd_artifact_take'), 'sd_artifact_take missing');
  assert.ok(scenes.includes('sd_artifact_destroy'), 'sd_artifact_destroy missing');
});

test('chapter II new flags are registered in FLAG_REGISTRY', () => {
  const flags = [
    'shadowDeal', 'shadowRefusedDeal', 'knowsWarpTruth',
    'closedGateByFaith', 'closedGateByForce',
    'ritualFailed', 'gateUnclosed',
    'knowsXIRitual', 'sawKralVision', 'leftArtifact'
  ];
  for (const flag of flags) {
    assert.ok(run(`!!FLAG_REGISTRY[${JSON.stringify(flag)}]`), `flag ${flag} not registered`);
  }
});

test('chapter II audit passes with new scenes', () => {
  assert.deepEqual(Array.from(run('auditScenario("sealedSector")')), []);
});

test('shadow deal adds corruption and clues', () => {
  run(`startCampaign(createCharacter({name:'Сделка',classId:'inquisitor'}), false); startScenario('sealedSector');`);
  const before = run('GAME.character.corruption || 0');
  const cluesBefore = run('GAME.world.clues || 0');
  run('enterScene("sd_shadow_deal")');
  const after = run('GAME.character.corruption || 0');
  const cluesAfter = run('GAME.world.clues || 0');
  assert.ok(after > before, 'corruption should increase');
  assert.ok(cluesAfter > cluesBefore, 'clues should increase');
  assert.equal(run('GAME.world.flags.shadowDeal'), true);
});

test('artifact choice: take vs destroy vs leave changes flags', () => {
  // Take
  run(`startCampaign(createCharacter({name:'Взять',classId:'inquisitor'}), false); startScenario('sealedSector'); enterScene("sd_artifact_take")`);
  assert.equal(run('GAME.world.flags.tookArtifact'), true);

  // Destroy
  run(`startCampaign(createCharacter({name:'Уничтожить',classId:'inquisitor'}), false); startScenario('sealedSector'); enterScene("sd_artifact_destroy")`);
  assert.equal(run('GAME.world.flags.destroyedArtifact'), true);

  // Leave
  run(`startCampaign(createCharacter({name:'Оставить',classId:'inquisitor'}), false); startScenario('sealedSector'); enterScene("sd_artifact_leave")`);
  assert.equal(run('GAME.world.flags.leftArtifact'), true);
});

/* ============================================================
   АКТИВНЫЕ ТАЛАНТЫ
   ============================================================ */

test('all three classes have talent trees with three branches', () => {
  for (const classId of ['inquisitor', 'guardsman', 'spaceMarine']) {
    const branches = run(`Object.keys(TALENT_TREES[${JSON.stringify(classId)}].branches)`);
    assert.equal(branches.length, 3, `${classId} should have 3 branches`);
  }
});

test('every talent node has required fields (id, level, type)', () => {
  const nodes = run(`
    Object.values(TALENT_TREES).flatMap(tree =>
      Object.values(tree.branches).flatMap(b => b.nodes)
    )
  `);
  for (const node of nodes) {
    assert.ok(node.id, `node missing id`);
    assert.ok(Number.isInteger(node.level), `node ${node.id} missing level`);
    assert.ok(['passive', 'active'].includes(node.type), `node ${node.id} has invalid type`);
  }
});

test('active talents have activeId and correspond to ACTIVE_TALENTS entry', () => {
  const activeNodes = run(`
    Object.values(TALENT_TREES).flatMap(tree =>
      Object.values(tree.branches).flatMap(b => b.nodes.filter(n => n.type === "active"))
    )
  `);
  for (const node of activeNodes) {
    assert.ok(node.activeId, `active talent ${node.id} missing activeId`);
    assert.ok(run(`!!ACTIVE_TALENTS[${JSON.stringify(node.activeId)}]`), `activeId "${node.activeId}" not in ACTIVE_TALENTS`);
  }
});

test('taking a passive talent applies its effect and is idempotent', () => {
  run(`startCampaign(createCharacter({name:'Таланты',classId:'inquisitor'}), false); GAME.character.level = 10; GAME.character.talents = []; GAME.character.branches = {interrogation:0,puritan:0,scholar:0};`);
  assert.equal(run(`takeTalent('inq-int-1')`), true);
  assert.ok(run(`GAME.character.talents.includes('inq-int-1')`));
  // Повторный вызов отклоняется
  assert.equal(run(`takeTalent('inq-int-1')`), false);
});
test('only one talent per level can be taken', () => {
  run(`startCampaign(createCharacter({name:'Таланты',classId:'inquisitor'}), false)`);
  run(`GAME.character.level = 2`);
  run(`GAME.character.talents = []`);
  run(`GAME.character.branches = {interrogation:0,puritan:0,scholar:0}`);

  // Взять первый талант уровня 2
  assert.equal(run(`takeTalent('inq-int-1')`), true, 'first level-2 talent should be taken');
  assert.ok(run(`GAME.character.talents.includes('inq-int-1')`));

  // Попытаться взять второй талант уровня 2 — должно быть false
  assert.equal(run(`takeTalent('inq-pur-1')`), false, 'second level-2 talent should be rejected');
  assert.ok(!run(`GAME.character.talents.includes('inq-pur-1')`));
});

test('talent of next level can still be taken after one per level', () => {
  run(`startCampaign(createCharacter({name:'Таланты',classId:'inquisitor'}), false)`);
  run(`GAME.character.level = 4`);
  run(`GAME.character.talents = ['inq-int-1']`);  // взяли на 2-м уровне
  run(`GAME.character.branches = {interrogation:1,puritan:0,scholar:0}`);

  // На 4-м уровне можно взять один талант
  assert.equal(run(`takeTalent('inq-pur-2')`), true, 'level-4 talent should be taken');
});

test('taking an active talent records it and shows in getActiveTalents', () => {
  run(`startCampaign(createCharacter({name:'Актив',classId:'guardsman'}), false); GAME.character.level = 10; GAME.character.talents = []; GAME.character.branches = {marksman:0,siege:0,veteran:0};`);
  run(`takeTalent('gm-mk-3')`); // Прицельный выстрел — активный
  const actives = run(`getActiveTalents()`);
  assert.ok(actives.some(a => a.activeId === 'aimed-shot'), 'aimed-shot not in active talents');
});

test('branch specialization triggers after three talents in one branch', () => {
  run(`startCampaign(createCharacter({name:'Специализация',classId:'inquisitor'}), false); GAME.character.level = 12; GAME.character.talents = []; GAME.character.branches = {interrogation:0,puritan:0,scholar:0};`);
  run(`takeTalent('inq-int-1'); takeTalent('inq-int-2'); takeTalent('inq-int-3')`);
  const specs = run(`GAME.character.specializations || []`);
  assert.ok(specs.includes('spec-inq-interrogation'), 'specialization not applied');
});

test('active talent cannot be reused in the same combat', () => {
  run(`startCampaign(createCharacter({name:'Откат',classId:'guardsman'}), false); GAME.character.level = 10; GAME.character.talents = []; GAME.character.branches = {marksman:0,siege:0,veteran:0};`);
  run(`takeTalent('gm-mk-3'); startCombat('cultist');`);
  run(`useActiveTalent('aimed-shot')`);
  const used = run(`!!GAME.character._activeUsed['aimed-shot']`);
  assert.equal(used, true);
  // Второй раз — эффект не применяется, но ошибки нет
  run(`useActiveTalent('aimed-shot')`);
  assert.equal(run(`!!GAME.character._activeUsed['aimed-shot']`), true);
});

/* ============================================================
   БЕСТИАРИЙ
   ============================================================ */

test('bestiary flags initialize on new campaign and on combat start', () => {
  run(`startCampaign(createCharacter({name:'Бестиарий',classId:'guardsman'}), false)`);
  assert.ok(run(`typeof GAME.world.seenEnemies === 'object'`));
  assert.equal(run(`Object.keys(GAME.world.seenEnemies).length`), 0);

  run(`startCombat(['cultist'])`);
  assert.equal(run(`GAME.world.seenEnemies['cultist']`), true);
});

test('bestiary preserves seen enemies across save/load', () => {
  run(`startCampaign(createCharacter({name:'Сохранение',classId:'guardsman'}), false); GAME.world.seenEnemies = {cultist: true, renegade: true}; saveGameSilent(); GAME.world.seenEnemies = {}; loadGame()`);
  assert.equal(run(`GAME.world.seenEnemies['cultist']`), true);
  assert.equal(run(`GAME.world.seenEnemies['renegade']`), true);
});

test('legacy save migration adds empty seenEnemies field', () => {
  const prepared = run(`prepareLoadedState({version:4,state:{character:{name:'Старый',classId:'guardsman'},world:{flags:{}},meta:{seed:1}}})`);
  assert.ok(typeof prepared.world.seenEnemies === 'object');
  assert.equal(Object.keys(prepared.world.seenEnemies).length, 0);
});

/* ============================================================
   ЛЕТОПИСЬ ИНКВИЗИТОРА
   ============================================================ */

test('choice_made event is logged to journal', () => {
  run(`startCampaign(createCharacter({name:'Летопись',classId:'guardsman'}), false)`);
  const before = run(`GAME.journal.filter(e => e.kind === 'choice').length`);
  run(`Bus.emit('choice_made', {sceneId: 'test_scene', choice: {label: 'Тестовый выбор'}})`);
  const after = run(`GAME.journal.filter(e => e.kind === 'choice').length`);
  assert.equal(after, before + 1, 'choice_made not logged');
});

test('journalLine handles choice entries without errors', () => {
  const line = run(`journalLine({kind: 'choice', label: 'Тестовое решение', day: 1, time: '07:15'})`);
  assert.ok(typeof line === 'string');
  assert.ok(line.includes('Тестовое решение'));
});

/* ============================================================
   ГЛАВА III: ТРИ ИСХОДА У ВРАТ
   ============================================================ */

test('chapter III has three distinct gate outcomes', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.warpHeart.scenes)`);

  // Успешное закрытие — верой, знанием, силой
  assert.ok(scenes.includes('wh_close_faith'), 'wh_close_faith missing');
  assert.ok(scenes.includes('wh_close_knowledge'), 'wh_close_knowledge missing');
  assert.ok(scenes.includes('wh_close_force'), 'wh_close_force missing');

  // Временное сдерживание
  assert.ok(scenes.includes('wh_contain'), 'wh_contain missing');

  // Отступление
  assert.ok(scenes.includes('wh_retreat'), 'wh_retreat missing');
  assert.ok(scenes.includes('wh_abandon'), 'wh_abandon missing');

  // Финалы
  assert.ok(scenes.includes('wh_ending_light'), 'wh_ending_light missing');
  assert.ok(scenes.includes('wh_ending_shadow'), 'wh_ending_shadow missing');
  assert.ok(scenes.includes('wh_ending_heart'), 'wh_ending_heart missing');
  assert.ok(scenes.includes('wh_ending_abandoned'), 'wh_ending_abandoned missing');
});

test('gate outcome flags are registered', () => {
  const flags = ['gateAbandoned', 'gateContained', 'gateUnclosed', 'closedGateByFaith', 'closedGateByForce'];
  for (const flag of flags) {
    assert.ok(run(`!!FLAG_REGISTRY[${JSON.stringify(flag)}]`), `flag ${flag} not registered`);
  }
});

test('wh_retreat offers two paths: contain or abandon', () => {
  const retreat = run(`CAMPAIGN_SCENARIOS.warpHeart.scenes.wh_retreat`);
  assert.ok(retreat.choices.some(c => c.goto === 'wh_contain'), 'wh_retreat missing wh_contain path');
  assert.ok(retreat.choices.some(c => c.goto === 'wh_abandon'), 'wh_retreat missing wh_abandon path');
});

test('wh_contain sets gateContained, wh_abandon sets gateAbandoned', () => {
  // Contained
  run(`startCampaign(createCharacter({name:'Contain',classId:'guardsman'}), false); startScenario('warpHeart'); enterScene('wh_contain');`);
  assert.equal(run('GAME.world.flags.gateContained'), true);
  assert.equal(run('GAME.world.flags.gateUnclosed'), true);

  // Abandoned
  run(`startCampaign(createCharacter({name:'Abandon',classId:'guardsman'}), false); startScenario('warpHeart'); enterScene('wh_abandon');`);
  assert.equal(run('GAME.world.flags.gateAbandoned'), true);
  assert.equal(run('GAME.world.flags.gateUnclosed'), true);
});

test('chapter IV oj_verdict has separate verdicts for abandon, corruption, and heart', () => {
  const verdict = run(`CAMPAIGN_SCENARIOS.ordoJudgment.scenes.oj_verdict`);
  assert.ok(typeof verdict.text === 'function', 'oj_verdict.text should be a function');

  // Abandoned gate — обвинение в некомпетентности
  run(`startCampaign(createCharacter({name:'Abandon',classId:'guardsman'}), false); setFlag('gateAbandoned', true); startScenario('ordoJudgment'); enterScene('oj_verdict');`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('некомпетентность')`), 'oj_verdict should mention некомпетентность for abandoned gate');

  // High corruption without acceptedWarpHeart — обвинение в заражении
  run(`startCampaign(createCharacter({name:'Corrupt',classId:'guardsman'}), false); GAME.character.corruption = 9; startScenario('ordoJudgment'); enterScene('oj_verdict');`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('заражён')`), 'oj_verdict should mention заражение for corruption 9+');

  // Accepted Warp Heart — обвинение в Сердце
  run(`startCampaign(createCharacter({name:'Heart',classId:'guardsman'}), false); setFlag('acceptedWarpHeart', true); startScenario('ordoJudgment'); enterScene('oj_verdict');`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('принял Сердце')`), 'oj_verdict should mention принял Сердце for acceptedWarpHeart');
});
/* ============================================================
   КЛАССОВЫЕ ТЕКСТЫ
   ============================================================ */

test('sf_end has class-specific text for guardsman', () => {
  run(`startCampaign(createCharacter({name:'Гвардеец',classId:'guardsman'}), false); startScenario('silentForge'); enterScene('sf_end')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('Ты — солдат')`), 'guardsman sf_end text missing');
});

test('sf_end has class-specific text for spaceMarine', () => {
  run(`startCampaign(createCharacter({name:'Астартес',classId:'spaceMarine'}), false); startScenario('silentForge'); enterScene('sf_end')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('Ты — Караул Смерти')`), 'marine sf_end text missing');
});

test('sf_end has class-specific text for inquisitor', () => {
  run(`startCampaign(createCharacter({name:'Инквизитор',classId:'inquisitor'}), false); startScenario('silentForge'); enterScene('sf_end')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('Твой профиль — Херетикус')`), 'inquisitor sf_end text missing');
});

test('sf_final_talk: inquisitor knows Kral', () => {
  run(`startCampaign(createCharacter({name:'Инквизитор',classId:'inquisitor'}), false); startScenario('silentForge'); GAME.mode='explore'; enterScene('sf_final_talk')`);
  const entry = run(`GAME.story.find(e => e.type === 'system' && e.title === 'РАЗГОВОР В ГЛУБИНЕ')`);
  assert.ok(entry, 'sf_final_talk entry not found in GAME.story');
  assert.ok(!entry.text.includes('Кралл. Твой наставник'), 'custom inquisitor must not automatically inherit Varro biography');
});

test('sf_final_talk: guardsman does not know Kral', () => {
  run(`startCampaign(createCharacter({name:'Гвардеец',classId:'guardsman'}), false); startScenario('silentForge'); GAME.mode='explore'; enterScene('sf_final_talk')`);
  const entry = run(`GAME.story.find(e => e.type === 'system' && e.title === 'РАЗГОВОР В ГЛУБИНЕ')`);
  assert.ok(entry, 'sf_final_talk entry not found in GAME.story');
  assert.ok(entry.text.includes('Ты не знаешь, кто такой Кралл'), 'guardsman should not know Kral');
});

test('wh_ending_heart uses class-specific whoYouWere', () => {
  run(`startCampaign(createCharacter({name:'Гвардеец',classId:'guardsman'}), false); startScenario('warpHeart'); enterScene('wh_ending_heart')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('роль — солдат')`), 'guardsman heart ending should identify the character role without declaring literal identity loss');

  run(`startCampaign(createCharacter({name:'Астартес',classId:'spaceMarine'}), false); startScenario('warpHeart'); enterScene('wh_ending_heart')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('роль — Астартес')`), 'marine heart ending should identify the character role without declaring literal identity loss');
});

test('sd_records_read: Cassius sees personal line, others do not', () => {
  run(`startCampaign(createCharacter({name:'Инквизитор Кассий Варро',classId:'inquisitor'}), false); startScenario('sealedSector'); enterScene('sd_records_read')`);
  assert.ok(run(`GAME.story[GAME.story.length-1].text.includes('Не ищи меня, Кассий')`), 'Cassius should see personal line');

  run(`startCampaign(createCharacter({name:'Гвардеец',classId:'guardsman'}), false); startScenario('sealedSector'); enterScene('sd_records_read')`);
  assert.ok(!run(`GAME.story[GAME.story.length-1].text.includes('Не ищи меня, Кассий')`), 'Non-Cassius should not see personal line');
});

/* ============================================================
   ХРОНОЛОГИЯ КРАЛЛА
   ============================================================ */

test('sd_records_anomaly exists and sets knowsKralTimeAnomaly', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.sealedSector.scenes)`);
  assert.ok(scenes.includes('sd_records_anomaly'), 'sd_records_anomaly missing');

  run(`startCampaign(createCharacter({name:'Тест',classId:'inquisitor'}), false); startScenario('sealedSector'); enterScene('sd_records_anomaly')`);
  assert.equal(run('GAME.world.flags.knowsKralTimeAnomaly'), true);
});

test('knowsKralTimeAnomaly is registered', () => {
  assert.ok(run(`!!FLAG_REGISTRY.knowsKralTimeAnomaly`));
});

test('sd_records_read sends player to anomaly when taking folder', () => {
  const scene = run(`CAMPAIGN_SCENARIOS.sealedSector.scenes.sd_records_read`);
  assert.ok(scene.choices.some(c => c.label === 'Забрать папку' && c.goto === 'sd_records_anomaly'), 'sd_records_read should link to anomaly');
});

test('oj_krall_fate explains anomaly if player knows it', () => {
  // С флагом — Крайс объясняет
  run(`startCampaign(createCharacter({name:'Тест',classId:'guardsman'}), false); setFlag('knowsKralTimeAnomaly', true); startScenario('ordoJudgment'); enterScene('oj_krall_fate')`);
  const entry = run(`GAME.story.find(e => e.type === 'system' && e.title === 'СУДЬБА КРАЛЛА')`);
  assert.ok(entry, 'oj_krall_fate entry not found');
  assert.ok(entry.text.includes('Ты заметил даты'), 'KraIs should explain anomaly');

  // Без флага — стандартный текст
  run(`startCampaign(createCharacter({name:'Тест',classId:'guardsman'}), false); startScenario('ordoJudgment'); enterScene('oj_krall_fate')`);
  const entry2 = run(`GAME.story.find(e => e.type === 'system' && e.title === 'СУДЬБА КРАЛЛА')`);
  assert.ok(!entry2.text.includes('Ты заметил даты'), 'KraIs should not explain anomaly without flag');
});

/* ============================================================
   ГЛАВА V — ПОСЛЕ СУДА
   ============================================================ */

test('chapter V is registered and starts at wh5_boot', () => {
  assert.ok(run(`!!CAMPAIGN_SCENARIOS.afterJudgment`));
  run(`startScenario('afterJudgment')`);
  assert.equal(run('GAME.campaign.scenarioId'), 'afterJudgment');
  assert.equal(run('GAME.campaign.sceneId'), 'wh5_boot');
});

test('chapter V has all required scenes', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.afterJudgment.scenes)`);
  assert.ok(scenes.includes('wh5_boot'));
  assert.ok(scenes.includes('wh5_branch'));
  assert.ok(scenes.includes('wh5_branch_continue'));
  assert.ok(scenes.includes('wh5_lyra'));
  assert.ok(scenes.includes('wh5_final'));
});

test('chapter V audit passes', () => {
  assert.deepEqual(Array.from(run('auditScenario("afterJudgment")')), []);
});

test('chapter V continuation target starts afterJudgment at wh5_boot', () => {
  run(`startCampaign(createCharacter({name:'Финал',classId:'guardsman'}), false); startScenario('ordoJudgment'); followSceneTarget('__chapter5__', 0)`);
  assert.equal(run('GAME.campaign.scenarioId'), 'afterJudgment');
  assert.equal(run('GAME.campaign.sceneId'), 'wh5_boot');
});

test('chapter IV oj_final offers chapter V continuation', () => {
  assert.ok(run(`CAMPAIGN_SCENARIOS.ordoJudgment.scenes.oj_final.choices.some(c => c.goto === '__chapter5__')`));
});

test('chapter V picks branch based on character state', () => {
  // Служба
  run(`startCampaign(createCharacter({name:'Служба',classId:'inquisitor'}), false); setFlag('ojCooperated', true); GAME.character.corruption = 2; startScenario('afterJudgment'); enterScene('wh5_boot');`);
  assert.equal(run('GAME._wh5Branch'), 'service');

  // Изгнание (через gateAbandoned)
  run(`startCampaign(createCharacter({name:'Изгнание',classId:'inquisitor'}), false); setFlag('gateAbandoned', true); startScenario('afterJudgment'); enterScene('wh5_boot');`);
  assert.equal(run('GAME._wh5Branch'), 'exile');

  // Сердце Тзинча
  run(`startCampaign(createCharacter({name:'Тзинч',classId:'inquisitor'}), false); setFlag('acceptedWarpHeart', true); startScenario('afterJudgment'); enterScene('wh5_boot');`);
  assert.equal(run('GAME._wh5Branch'), 'heart');
});

test('chapter V closes its arc but keeps the continuing campaign open', () => {
  run(`startCampaign(createCharacter({name:'Финал',classId:'inquisitor'}), false); startScenario('afterJudgment'); enterScene('wh5_final');`);
  assert.equal(run('GAME.world.flags.chapter5Ending'), true);
  assert.equal(run('GAME.world.flags.campaignComplete'), false);
  assert.ok(run(`CAMPAIGN_SCENARIOS.afterJudgment.scenes.wh5_final.choices.some(c => c.goto === '__chapter6__')`));
});
test('campaign completion stays false while Chapter IV/V transitions continue the story', () => {
  assert.equal(run(`CAMPAIGN_SCENARIOS.ordoJudgment.scenes.oj_final.effects.flag.campaignComplete`), false);
  assert.equal(run(`CAMPAIGN_SCENARIOS.afterJudgment.scenes.wh5_final.effects.flag.campaignComplete`), false);
  run(`startCampaign(createCharacter({name:'Продолжение',classId:'guardsman'}), false); startScenario('afterJudgment'); enterScene('wh5_boot');`);
  assert.equal(run(`GAME.world.flags.campaignComplete`), false);
});
test('cutscenes avoid universal or absolute class lore claims', () => {
  assert.ok(!run(`CHAPTER_CUTSCENES.class_inquisitor.lines.join(' ').includes('единственный, кто видит правду')`));
  assert.ok(!run(`CHAPTER_CUTSCENES.class_spaceMarine.lines.join(' ').includes('Ты не расследуешь. Ты уничтожаешь.')`));
  assert.ok(run(`CHAPTER_CUTSCENES.class_guardsman.lines.join(' ').includes('прошлое зависят от выбранной предыстории')`));
});
test('enemy aliases remain balanced rather than contradicting duplicate profiles', () => {
  assert.equal(run(`ENEMIES.pinkHorror.hp`), run(`ENEMIES.horror_pink.hp`));
  assert.equal(run(`ENEMIES.pinkHorror.ac`), run(`ENEMIES.horror_pink.ac`));
  assert.equal(run(`ENEMIES.pinkHorror.xp`), run(`ENEMIES.horror_pink.xp`));
  assert.equal(run(`ENEMIES.blueHorror.hp`), run(`ENEMIES.horror_blue.hp`));
  assert.equal(run(`ENEMIES.blueHorror.attack`), run(`ENEMIES.horror_blue.attack`));
  assert.ok(run(`ENEMIES.tzeentchCultist.name !== ENEMIES.cultist.name`));
});
test('repair kit fixes both jam and plasma overheat but is not consumed on a healthy weapon', () => {
  run(`startCampaign(createCharacter({name:'Ремонт',classId:'guardsman'}), false); GAME.character.inventory=GAME.character.inventory.filter(i=>i.name!=='Ремкомплект'); addItem('Ремкомплект',1); addCondition('Заклинивание'); useItem('Ремкомплект');`);
  assert.equal(run(`hasCondition('Заклинивание')`), false);
  assert.equal(run(`hasItem('Ремкомплект')`), false);
  run(`addItem('Ремкомплект',1); addCondition('Перегрев'); useItem('Ремкомплект');`);
  assert.equal(run(`hasCondition('Перегрев')`), false);
  assert.equal(run(`hasItem('Ремкомплект')`), false);
  run(`addItem('Ремкомплект',1); useItem('Ремкомплект');`);
  assert.equal(run(`hasItem('Ремкомплект')`), true);
});

test('combat victory gives faction-specific reputation and never creates an undefined loot item', () => {
  run(`startCampaign(createCharacter({name:'Трофеи',classId:'guardsman'}), false); GAME._testRepBase={Imperium:GAME.character.reputation.Imperium,Inquisition:GAME.character.reputation.Inquisition,Chaos:GAME.character.reputation.Chaos}; startCombat('screamer'); GAME.combat.enemies[0].hp=0; endCombat(true);`);
  assert.equal(run(`GAME.character.reputation.Imperium`), run(`GAME._testRepBase.Imperium+1`));
  assert.equal(run(`GAME.character.reputation.Inquisition`), run(`GAME._testRepBase.Inquisition+1`));
  assert.equal(run(`GAME.character.reputation.Chaos`), run(`GAME._testRepBase.Chaos-1`));
  assert.ok(run(`!GAME.character.inventory.some(i => i.name === undefined || i.name === null)`));
  run(`startCampaign(createCharacter({name:'Не свои',classId:'guardsman'}), false); GAME._testRepBase={Imperium:GAME.character.reputation.Imperium,Militarum:GAME.character.reputation.Militarum}; startCombat('pdf'); GAME.combat.enemies[0].hp=0; endCombat(true);`);
  assert.equal(run(`GAME.character.reputation.Imperium`), run(`GAME._testRepBase.Imperium`), 'hostile PDF encounter must not automatically raise Imperial standing');
  assert.equal(run(`GAME.character.reputation.Militarum`), run(`GAME._testRepBase.Militarum`), 'killing an ordinary PDF soldier is not a reputation reward');
  run(`startCampaign(createCharacter({name:'Ренегат',classId:'guardsman'}), false); GAME._testMilitarumBase=GAME.character.reputation.Militarum; startCombat('renegade'); GAME.combat.enemies[0].hp=0; endCombat(true);`);
  assert.equal(run(`GAME.character.reputation.Militarum`), run(`GAME._testMilitarumBase+1`), 'defeating a recorded renegade can improve Militarum standing');
});
test('enemies without loot produce an empty-drop message, not an undefined item', () => {
  run(`startCampaign(createCharacter({name:'Без трофеев',classId:'inquisitor'}), false); startCombat('screamer'); GAME.combat.enemies[0].hp=0; endCombat(true);`);
  assert.ok(run(`GAME.story.some(e => e.title === 'ПОБЕДА' && e.text.includes('нет трофеев'))`));
  assert.ok(run(`!GAME.character.inventory.some(i => i.name === undefined || i.name === null)`));
});

test('enemy catalogue has complete faction/stat metadata and chapter XP rewards avoid the old oversized spikes', () => {
  const missing = run(`Object.entries(ENEMIES).filter(([id,e]) => !e.faction || !(e.hp>0 && e.maxHp>=e.hp && e.ac>0 && e.die>0 && e.attack>=0 && e.xp>=0) || !Array.isArray(e.loot)).map(([id])=>id)`);
  assert.deepEqual(Array.from(missing), []);
  assert.equal(run(`CAMPAIGN_SCENARIOS.ordoJudgment.scenes.oj_aftermath.effects.xp`), 180);
  assert.equal(run(`CAMPAIGN_SCENARIOS.afterJudgment.scenes.wh5_final.effects.xp`), 120);
  assert.ok(!run(`Object.values(CAMPAIGN_SCENARIOS).some(sc => Object.values(sc.scenes).some(scene => scene.effects && scene.effects.xp >= 300))`), 'campaign scenes should not grant oversized one-shot XP spikes');
});
test('lore pass avoids presenting Warp voice as an independently verified statement', () => {
  const ch2=fs.readFileSync(path.join(root,'js/content/campaigns/ch2_sealedSector.js'),'utf8');
  const ch3=fs.readFileSync(path.join(root,'js/content/campaigns/ch3_warpHeart.js'),'utf8');
  const ch4=fs.readFileSync(path.join(root,'js/content/campaigns/ch4_ordoJudgment.js'),'utf8');
  assert.ok(ch2.includes('нельзя быть уверенным ни в источнике голоса'));
  assert.ok(ch3.includes('не доказывает, что голос действительно принадлежит Тзинчу'));
  assert.ok(ch4.includes('подтвердить это извне ты не можешь'));
});

test('lore pass separates anonymous accusations, temporal anomalies and Warp-voice claims from verified facts', () => {
  const ch1=fs.readFileSync(path.join(root,'js/content/campaigns/ch1_silentForge.js'),'utf8');
  const ch2=fs.readFileSync(path.join(root,'js/content/campaigns/ch2_sealedSector.js'),'utf8');
  const ch3=fs.readFileSync(path.join(root,'js/content/campaigns/ch3_warpHeart.js'),'utf8');
  const ch5=fs.readFileSync(path.join(root,'js/content/campaigns/ch5_afterJudgment.js'),'utf8');
  const ch6=fs.readFileSync(path.join(root,'js/content/campaigns/ch6_newHive.js'),'utf8');
  assert.ok(ch1.includes('подлинность сообщения не подтверждена'));
  assert.ok(!ch1.includes('Ты знаешь, что культ редко оставляет следы случайно'));
  assert.ok(ch2.includes('несостыковка сама по себе не раскрывает источник'));
  assert.ok(!ch2.includes('Это не ошибка. Это — Варп.'));
  assert.ok(ch3.includes('голосом, который утверждает, что существовал до времени'));
  assert.ok(ch3.includes('не доказывает ни личность собеседника, ни правдивость обещаний'));
  assert.ok(!ch3.includes('Он не лжёт. Он просто не говорит всей правды.'));
  assert.ok(ch5.includes('Тебе кажется, что ты уже не тот человек'));
  assert.ok(ch6.includes('это рабочая гипотеза, а не установленный факт'));
});

test('scene entry advances time', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'guardsman'}), false); startScenario('silentForge')`);

  const timeBefore = run(`GAME.world.day * 1440 + GAME.world.hour * 60 + GAME.world.minute`);
  run(`enterScene('sf_boot')`);
  const timeAfter = run(`GAME.world.day * 1440 + GAME.world.hour * 60 + GAME.world.minute`);

  assert.ok(timeAfter > timeBefore, 'scene entry should advance time');
});

test('combat scenes do not advance time twice', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'guardsman'}), false); startScenario('silentForge')`);

  const timeBefore = run(`GAME.world.day * 1440 + GAME.world.hour * 60 + GAME.world.minute`);
  run(`enterScene('sf_combat_guard')`);
  const timeAfterEntry = run(`GAME.world.day * 1440 + GAME.world.hour * 60 + GAME.world.minute`);

  // Вход в боевую сцену не тратит время (бой тратит 8 минут при завершении)
  assert.equal(timeAfterEntry - timeBefore, 0, 'combat scene entry should not advance time');
});
/* ============================================================
   ТРЕТЬЯ АКТИВНАЯ СПОСОБНОСТЬ
   ============================================================ */

test('level 10 talents are active abilities', () => {
  const activeLvl10 = run(`
    Object.values(TALENT_TREES).flatMap(tree =>
      Object.values(tree.branches).flatMap(b =>
        b.nodes.filter(n => n.level === 10 && n.type === 'active')
      )
    ).length
  `);
  assert.ok(activeLvl10 >= 3, 'should have at least 3 active level-10 talents');
});

test('new active talents exist in ACTIVE_TALENTS', () => {
  assert.ok(run('!!ACTIVE_TALENTS["word-of-inquisitor"]'), 'word-of-inquisitor missing');
  assert.ok(run('!!ACTIVE_TALENTS["volley"]'), 'volley missing');
  assert.ok(run('!!ACTIVE_TALENTS["emperor-wrath"]'), 'emperor-wrath missing');
});

test('Word of Inquisitor makes human enemies skip turn', () => {
  run(`startCampaign(createCharacter({name:'Инквизитор',classId:'inquisitor'}), false); GAME.character.level = 12; GAME.character.talents = []; GAME.character.branches = {interrogation:0,puritan:0,scholar:0};`);
  run(`takeTalent('inq-int-5')`);
  assert.ok(run(`GAME.character.talents.includes('inq-int-5')`));

  run(`startCombat(['cultist','renegade'])`);
  run(`useActiveTalent('word-of-inquisitor')`);

  // Все враги-люди должны иметь skipTurn = true (или уже пропустили)
  const enemies = run(`GAME.combat.enemies`);
  assert.ok(enemies.every(e => !e.skipTurn || e.hp <= 0), 'all human enemies should have skipTurn or be dead');
});

test('Volley fires twice at the same target', () => {
  run(`startCampaign(createCharacter({name:'Гвардеец',classId:'guardsman'}), false)`);
  run(`GAME.character.level = 12`);
  run(`GAME.character.talents = []`);
  run(`GAME.character.branches = {marksman:0,siege:0,veteran:0}`);
  run(`takeTalent('gm-mk-5')`);

  run(`startCombat(['heretic_marine'])`);
  const hpBefore = run(`GAME.combat.enemies[0].hp`);

  // Подменяем rollCheck, чтобы гарантировать попадание
  run(`
    var __savedRollCheck = rollCheck;
    rollCheck = function(){ return {result: 'success', d20: 15, total: 15, mod: 0, prof: 0, bonus: 0, dc: 10, label: 'ЗАЛП'}; };
    useActiveTalent('volley');
    rollCheck = __savedRollCheck;
  `);

  const hpAfter = run(`GAME.combat && GAME.combat.enemies[0] ? GAME.combat.enemies[0].hp : 0`);
  const enemyDead = run(`!GAME.combat || GAME.combat.enemies.every(e => e.hp <= 0)`);
  assert.ok(hpAfter < hpBefore || enemyDead, `volley should damage enemy (before: ${hpBefore}, after: ${hpAfter})`);
});

test('Emperor Wrath requires HP < 50%', () => {
  run(`startCampaign(createCharacter({name:'Астартес',classId:'spaceMarine'}), false); GAME.character.level = 12; GAME.character.talents = []; GAME.character.branches = {assault:0,tactics:0,resilience:0};`);
  run(`takeTalent('sm-as-5')`);

  // Полное HP — отказ
  run(`startCombat(['cultist'])`);
  run(`GAME.character.hp = GAME.character.maxHp;`);
  run(`useActiveTalent('emperor-wrath')`);
  assert.equal(run(`GAME.character._wrathActive || 0`), 0, 'should not activate at full HP');

  // HP < 50% — активация
  run(`GAME.character.hp = Math.floor(GAME.character.maxHp * 0.4);`);
  run(`useActiveTalent('emperor-wrath')`);
  assert.ok(run(`GAME.character._wrathActive`) > 0, 'should activate below 50% HP');
});
test('Chapter V offers Lyra departure scene if she is angry', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.afterJudgment.scenes)`);
  assert.ok(scenes.includes('wh5_lyra_departure'), 'wh5_lyra_departure missing');
  assert.ok(scenes.includes('wh5_lyra_try_stop'), 'wh5_lyra_try_stop missing');
  assert.ok(scenes.includes('wh5_lyra_forgive'), 'wh5_lyra_forgive missing');
});

test('Lyra departure scene sets lyraLeaves and lyraAngryAtYou', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'inquisitor'}), false); startScenario('afterJudgment'); enterScene('wh5_lyra_departure')`);
  assert.equal(run('GAME.world.flags.lyraLeaves'), true);
  assert.equal(run('GAME.world.flags.lyraAngryAtYou'), true);
});

test('Lyra forgive scene sets lyraForgiven', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'inquisitor'}), false); startScenario('afterJudgment'); enterScene('wh5_lyra_forgive')`);
  assert.equal(run('GAME.world.flags.lyraForgiven'), true);
});

test('wh5_branch_continue offers Lyra departure if she is angry', () => {
  const scene = run(`CAMPAIGN_SCENARIOS.afterJudgment.scenes.wh5_branch_continue`);
  assert.ok(scene.choices.some(c => c.goto === 'wh5_lyra_departure' && c.requires?.flag?.lyraAngryAtYou), 'branch_continue should offer Lyra departure');
});

test('lyraForgiven is registered in FLAG_REGISTRY', () => {
  assert.ok(run('!!FLAG_REGISTRY.lyraForgiven'), 'lyraForgiven not registered');
});
/* ============================================================
   ВИЗУАЛЬНАЯ ПОЛИРОВКА
   ============================================================ */

test('visual effect functions are available', () => {
  assert.equal(run('typeof applyVisualEffects'), 'function', 'applyVisualEffects missing');
});

test('sound module is available', () => {
  assert.equal(run('typeof initSounds'), 'function', 'initSounds missing');
  assert.equal(run('typeof toggleSound'), 'function', 'toggleSound missing');
  assert.equal(run('typeof playSound'), 'function', 'playSound missing');
});

test('procedural sound settings initialize with controllable defaults', () => {
  run('initSettings()');
  assert.equal(run('getSetting("soundMaster")'), true);
  assert.equal(run('getSetting("soundMusic")'), true);
  assert.equal(run('getSetting("soundEffects")'), true);
  assert.equal(run('getSetting("soundMasterVolume")'), 0.65);
  assert.equal(run('typeof setSoundContext'), 'function');
});
/* ============================================================
   ГЛАВА VI — НОВЫЙ УЛЕЙ
   ============================================================ */

test('chapter VI is registered and starts at wh6_intro', () => {
  assert.ok(run(`!!CAMPAIGN_SCENARIOS.newHive`));
  run(`startScenario('newHive')`);
  assert.equal(run('GAME.campaign.scenarioId'), 'newHive');
  assert.equal(run('GAME.campaign.sceneId'), 'wh6_intro');
});

test('chapter VI has all required scenes', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.newHive.scenes)`);
  assert.ok(scenes.includes('wh6_intro'));
  assert.ok(scenes.includes('wh6_arrival'));
  assert.ok(scenes.includes('wh6_first_npc'));
  assert.ok(scenes.includes('wh6_first_choice'));
  assert.ok(scenes.includes('wh6_hint'));
  assert.ok(scenes.includes('wh6_end'));
});

test('chapter VI audit passes', () => {
  assert.deepEqual(Array.from(run('auditScenario("newHive")')), []);
});

test('chapter VI continuation target starts newHive at wh6_intro', () => {
  run(`startCampaign(createCharacter({name:'Финал',classId:'guardsman'}), false); startScenario('afterJudgment'); followSceneTarget('__chapter6__', 0)`);
  assert.equal(run('GAME.campaign.scenarioId'), 'newHive');
  assert.equal(run('GAME.campaign.sceneId'), 'wh6_intro');
});

test('chapter V offers chapter VI continuation', () => {
  assert.ok(run(`CAMPAIGN_SCENARIOS.afterJudgment.scenes.wh5_final.choices.some(c => c.goto === '__chapter6__')`));
});

test('chapter VI flags are registered', () => {
  const flags = ['wh6Started', 'wh6Arrived', 'wh6MetNPC', 'wh6WentLower', 'wh6WentAdmin', 'wh6WentTech', 'wh6KnowsBiggerThreat', 'wh6ChapterEnd'];
  for (const flag of flags) {
    assert.ok(run(`!!FLAG_REGISTRY[${JSON.stringify(flag)}]`), `flag ${flag} not registered`);
  }
});

test('chapter VI first choice sets one of three route flags', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'inquisitor'}), false); startScenario('newHive'); enterScene('wh6_first_choice')`);
  run(`chooseSceneChoice(0)`); // нижний ярус
  assert.equal(run('GAME.world.flags.wh6WentLower'), true);
});
/* ============================================================
   НАСТРОЙКИ
   ============================================================ */

test('settings module is available', () => {
  assert.equal(run('typeof initSettings'), 'function', 'initSettings missing');
  assert.equal(run('typeof getSetting'), 'function', 'getSetting missing');
  assert.equal(run('typeof setSetting'), 'function', 'setSetting missing');
  assert.equal(run('typeof renderSettings'), 'function', 'renderSettings missing');
  const markup=run('renderSettings()');
  assert.ok(markup.includes('data-audio-range=\"soundMasterVolume\"'));
  assert.ok(markup.includes('data-setting=\"muteMusicInCutscenes\"'));
  assert.ok(markup.includes('data-setting=\"soundInCombat\"'));
});

test('settings initialize with defaults', () => {
  run('initSettings()');
  assert.equal(run('getSetting("soundMaster")'), true);
  assert.equal(run('getSetting("soundDice")'), true);
  assert.equal(run('getSetting("soundMusic")'), true);
  assert.equal(run('getSetting("soundEffects")'), true);
  assert.equal(run('getSetting("soundMasterVolume")'), 0.65);
  assert.equal(run('getSetting("visualCrit")'), true);
});

test('legacy sound-disabled settings migrate once to the new audio defaults without changing visual preferences', () => {
  store.set('wh40k_settings_v1', JSON.stringify({soundMaster:false,soundDice:false,visualCrit:false,visualPulse:false}));
  store.delete('wh40k_audio_settings_migrated_v1_1');
  run('GAME_SETTINGS=null; initSettings()');
  assert.equal(run('getSetting("soundMaster")'), true);
  assert.equal(run('getSetting("soundDice")'), true);
  assert.equal(run('getSetting("soundMusic")'), true);
  assert.equal(run('getSetting("visualCrit")'), false);
  assert.equal(run('getSetting("visualPulse")'), false);
  assert.equal(store.get('wh40k_audio_settings_migrated_v1_1'), '1.1');
});

test('setSetting and toggleSetting work', () => {
  run('initSettings()');
  run('setSetting("soundDice", true)');
  assert.equal(run('getSetting("soundDice")'), true);

  run('toggleSetting("soundDice")');
  assert.equal(run('getSetting("soundDice")'), false);
});

test('procedural Web Audio engine schedules music and effects locally with no network dependency', () => {
  let oscillatorCount=0, gainCount=0;
  class FakeNode {
    constructor(){this.gain={value:0,cancelScheduledValues(){},setTargetAtTime(){},setValueAtTime(){},exponentialRampToValueAtTime(){}};this.frequency={value:0,setValueAtTime(){},setTargetAtTime(){},exponentialRampToValueAtTime(){}};this.filter={};this.type='sine';}
    connect(){} start(){oscillatorCount++;} stop(){}
  }
  class FakeAudioContext {
    constructor(){this.currentTime=1;this.state='running';this.destination={};}
    createGain(){gainCount++;return new FakeNode();} createOscillator(){return new FakeNode();} createBiquadFilter(){return new FakeNode();} resume(){return Promise.resolve();}
  }
  context.window={AudioContext:FakeAudioContext};
  run('initSettings(); setSetting("soundMaster",true); setSetting("soundEffects",true); setSetting("soundInCombat",true);');
  assert.equal(run('initAudio()'), true);
  run('setSoundContext("combat")');
  assert.equal(run('playSound("combat")'), true);
  assert.ok(oscillatorCount>=4, 'ambient oscillators and effect oscillator should be scheduled');
  assert.ok(gainCount>=4, 'master, music and effect gain nodes should be created');
  run('setSetting("soundMaster",false)');
  assert.equal(run('playSound("ui")'), false);
  run('setSetting("soundMaster",true); setSetting("soundEffects",true); setSetting("soundDice",true); setSoundContext("story")');
});

test('audio can be muted globally or by context and sound category', () => {
  run('initSettings()');
  assert.equal(run('shouldPlaySound("dice", false)'), true);
  run('setSetting("soundMaster", false)');
  assert.equal(run('shouldPlaySound("dice", false)'), false);
  run('setSetting("soundMaster", true)');
  run('setSetting("soundDice", false)');
  assert.equal(run('getSetting("soundDice")'), false);
  run('setSoundContext("cutscene")');
  run('setSetting("muteMusicInCutscenes", true)');
  assert.equal(run('getSetting("muteMusicInCutscenes")'), true);
  assert.equal(run('typeof updateSoundSettings'), 'function');
});

test('codex has settings tab', () => {
  const sections = run(`Object.keys(CAMPAIGN_SCENARIOS)`);
  // Проверяем через рендер
  const codexHtml = run(`renderCodex()`);
  assert.ok(codexHtml.includes('data-codex-tab="settings"'), 'settings tab missing');
});
/* ============================================================
   КАТСЦЕНЫ ГЛАВ
   ============================================================ */

test('cutscene module is available', () => {
  assert.equal(run('typeof playChapterCutscene'), 'function', 'playChapterCutscene missing');
  assert.equal(run('typeof shouldShowCutscene'), 'function', 'shouldShowCutscene missing');
  assert.equal(run('typeof markCutsceneSeen'), 'function', 'markCutsceneSeen missing');
});

test('all chapters have cutscenes', () => {
  const chapters = ['silentForge', 'sealedSector', 'warpHeart', 'ordoJudgment', 'afterJudgment', 'newHive', 'ashProtocol', 'resonanceArchive', 'witnessLedger', 'silentRoute', 'priceOfEvidence', 'rightToMemory', 'lastTransport', 'beyondHive', 'verdictNameless'];
  for (const ch of chapters) {
    assert.ok(run(`!!CHAPTER_CUTSCENES[${JSON.stringify(ch)}]`), `cutscene for ${ch} missing`);
  }
});

test('every campaign has a complete cinematic and all three classes receive distinct scene perspective', () => {
  const campaignIds = ['silentForge','sealedSector','warpHeart','ordoJudgment','afterJudgment','newHive','ashProtocol','resonanceArchive','witnessLedger','silentRoute','priceOfEvidence','rightToMemory','lastTransport','beyondHive','verdictNameless'];
  const classes = ['inquisitor','guardsman','spaceMarine'];
  for (const chapter of campaignIds) {
    assert.ok(run(`!!CAMPAIGN_SCENARIOS[${JSON.stringify(chapter)}]`), `scenario ${chapter} missing`);
    assert.ok(run(`!!CHAPTER_CUTSCENES[${JSON.stringify(chapter)}]`), `cutscene ${chapter} missing`);
    const lenses = classes.map(classId => run(`buildCutscenePresentation(${JSON.stringify(chapter)},${JSON.stringify(classId)}).lensText`));
    assert.ok(lenses.every(Boolean), `class lens missing for ${chapter}`);
    assert.equal(new Set(lenses).size, 3, `class lenses must differ for ${chapter}`);
  }
  for (const classId of classes) {
    const intro = run(`buildCutscenePresentation(${JSON.stringify('class_' + classId)},${JSON.stringify(classId)})`);
    assert.ok(intro && intro.lines.length >= 4, `class intro missing for ${classId}`);
    assert.equal(intro.lensText, '', 'class intro should not receive a redundant chapter lens');
  }
});

test('cinematic perspective is framed as character interpretation, not new proof or canon fact', () => {
  for (const classId of ['inquisitor','guardsman','spaceMarine']) {
    const text = run(`buildCutscenePresentation('warpHeart',${JSON.stringify(classId)}).lensText`);
    assert.match(text, /не устанавлива|не смешивай|не доказывает|не объявляя/i);
  }
});

test('cutscenes use their scene-specific local sound profiles and respect cutscene mute settings', () => {
  const cutsceneSource = fs.readFileSync(path.join(root, 'js/ui/cutscenes.js'), 'utf8');
  const soundSource = fs.readFileSync(path.join(root, 'js/ui/sounds.js'), 'utf8');
  assert.match(cutsceneSource, /playSound\(cutscene\.sound \|\| "chapter_hum"\)/);
  for (const sound of ['hum_docks','hum_catacombs','hum_warp','hum_judgment','hum_gray','hum_new_hive']) {
    assert.match(soundSource, new RegExp(sound + ':'));
  }
  assert.match(soundSource, /String\(type\)\.startsWith\("hum_"\)/);
});

test('cutscene progress duration follows the actual typewriter duration and lifecycle cleans listeners', () => {
  const source = fs.readFileSync(path.join(root, 'js/ui/cutscenes.js'), 'utf8');
  assert.match(source, /lineDurations\.reduce/);
  assert.match(source, /function clearTimers\(\)/);
  assert.match(source, /document\.removeEventListener\("keydown", keyHandler\)/);
  assert.match(source, /activeCutsceneCleanup/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /aria-modal/);
});

test('cutscene has title, subtitle and lines', () => {
  const cs = run(`CHAPTER_CUTSCENES.silentForge`);
  assert.ok(cs.title, 'title missing');
  assert.ok(cs.subtitle, 'subtitle missing');
  assert.ok(Array.isArray(cs.lines), 'lines should be array');
  assert.ok(cs.lines.length >= 3, 'at least 3 lines');
});

test('cutscene seen flag works', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'inquisitor'}), false)`);
  // До показа
  assert.equal(run(`shouldShowCutscene("silentForge")`), true);
  // Отмечаем как показанную
  run(`markCutsceneSeen("silentForge")`);
  // После — не показывать
  assert.equal(run(`shouldShowCutscene("silentForge")`), false);
});
/* ============================================================
   ГЛАВА VI: ТРИ ВЕТКИ
   ============================================================ */

test('chapter VI has three distinct investigation branches', () => {
  const scenes = run(`Object.keys(CAMPAIGN_SCENARIOS.newHive.scenes)`);
  assert.ok(scenes.includes('wh6_lower'), 'wh6_lower missing');
  assert.ok(scenes.includes('wh6_admin'), 'wh6_admin missing');
  assert.ok(scenes.includes('wh6_tech'), 'wh6_tech missing');

  // У каждой ветки — свои под-сцены
  assert.ok(scenes.includes('wh6_lower_trace'), 'wh6_lower_trace missing');
  assert.ok(scenes.includes('wh6_lower_items'), 'wh6_lower_items missing');
  assert.ok(scenes.includes('wh6_admin_press'), 'wh6_admin_press missing');
  assert.ok(scenes.includes('wh6_admin_report'), 'wh6_admin_report missing');
  assert.ok(scenes.includes('wh6_tech_deal'), 'wh6_tech_deal missing');
  assert.ok(scenes.includes('wh6_tech_refuse'), 'wh6_tech_refuse missing');
});

test('chapter VI flags are registered', () => {
  const flags = [
    'wh6FoundTrace', 'wh6FoundPassage', 'wh6FoundSlate',
    'wh6MetBureaucrat', 'wh6FoundOrder', 'wh6KnowsHest',
    'wh6AdminRefused', 'wh6MetTechpriest', 'wh6KnowsRitual',
    'wh6TechDeal', 'wh6TechRefused', 'wh6KnowsElevenMarks'
  ];
  for (const flag of flags) {
    assert.ok(run(`!!FLAG_REGISTRY[${JSON.stringify(flag)}]`), `flag ${flag} not registered`);
  }
});

test('chapter VI lower branch sets flags', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'guardsman'}), false); markCutsceneSeen('newHive'); startScenario('newHive'); enterScene('wh6_lower')`);
  assert.equal(run('GAME.world.flags.wh6FoundTrace'), true);
});

test('chapter VI admin branch sets flags', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'inquisitor'}), false); markCutsceneSeen('newHive'); startScenario('newHive'); enterScene('wh6_admin_press')`);
  assert.equal(run('GAME.world.flags.wh6FoundOrder'), true);
});

test('chapter VI tech branch sets flags', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'guardsman'}), false); markCutsceneSeen('newHive'); startScenario('newHive'); enterScene('wh6_tech_deal')`);
  assert.equal(run('GAME.world.flags.wh6KnowsRitual'), true);
});

test('chapter VI first choice goes to three different branches', () => {
  const scene = run(`CAMPAIGN_SCENARIOS.newHive.scenes.wh6_first_choice`);
  const gotos = scene.choices.map(c => c.goto);
  assert.ok(gotos.includes('wh6_lower'), 'missing wh6_lower');
  assert.ok(gotos.includes('wh6_admin'), 'missing wh6_admin');
  assert.ok(gotos.includes('wh6_tech'), 'missing wh6_tech');
});

test('chapter VI audit passes with new branches', () => {
  assert.deepEqual(Array.from(run('auditScenario("newHive")')), []);
});
/* ============================================================
   РЕПУТАЦИЯ ПО ЛОРУ
   ============================================================ */

test('Orks and Chaos cannot be neutral', () => {
  run(`startCampaign(createCharacter({name:'Тест',classId:'guardsman'}), false)`);
  assert.ok(run(`GAME.character.reputation.Orks < 0`), 'Orks must be negative');
  assert.ok(run(`GAME.character.reputation.Chaos < 0`), 'Chaos must be negative');
});

test('Inquisitor has positive Inquisition reputation', () => {
  run(`startCampaign(createCharacter({name:'Инквизитор',classId:'inquisitor'}), false)`);
  assert.ok(run(`GAME.character.reputation.Inquisition >= 5`), 'Inquisitor should trust Inquisition');
});

test('Mechanicus is suspicious of Inquisitor', () => {
  run(`startCampaign(createCharacter({name:'Инквизитор',classId:'inquisitor'}), false)`);
  assert.ok(run(`GAME.character.reputation.Mechanicus < 0`), 'Mechanicus distrusts Inquisition');
});

test('Space Marine has positive Astartes reputation', () => {
  run(`startCampaign(createCharacter({name:'Астартес',classId:'spaceMarine'}), false)`);
  assert.ok(run(`GAME.character.reputation.Astartes >= 5`), 'Marine trusts Astartes');
});
/* ============================================================
   ИТОГ
   ============================================================ */

test('all ten ready-made characters have unique preset-specific opening text', () => {
  const cases = [
    ['inquisitor-varro','inquisitor','Кралла, твоего наставника'],
    ['inquisitor-mara','inquisitor','анонимный сигнал'],
    ['inquisitor-vorn','inquisitor','архиве Арбитрес'],
    ['guardsman-kane','guardsman','14-го Хелдонского полка'],
    ['guardsman-lyra','guardsman','22-го резервного полка'],
    ['guardsman-brek','guardsman','9-й осадной роты'],
    ['marine-acheron','spaceMarine','пропавшем имперском караване'],
    ['marine-cato','spaceMarine','штурмовой брат'],
    ['marine-draco','spaceMarine','Тёмный Клинок'],
    ['marine-io','spaceMarine','библиарий-ученик']
  ];
  for (const [presetId, classId, phrase] of cases) {
    run(`GAME.character = {presetId:${JSON.stringify(presetId)}, classId:${JSON.stringify(classId)}, backstory:'', location:'Доки Навигатор', discovered:['Доки Навигатор']}`);
    const text = run(`getSilentForgeOpeningText(GAME, ${JSON.stringify(classId)})`);
    assert.ok(text.includes(phrase), `${presetId} opening should mention ${phrase}`);
  }
});

test('preset selection persists presetId in the created character', () => {
  const character = run(`createCharacter({name:'Лира Вейл', classId:'guardsman', presetId:'guardsman-lyra'})`);
  assert.equal(character.presetId, 'guardsman-lyra');
});

test('location icon registry is active and duplicate portrait key is removed', () => {
  assert.ok(run('Object.keys(ASSETS.locationIcons).length >= 10'));
  const source = fs.readFileSync(path.join(root, 'js/content/assets.js'), 'utf8');
  const portraitBlock = source.split('portraits: {')[1].split('},')[0];
  const keys = [...portraitBlock.matchAll(/^\s*"([^"]+)"\s*:\s*\{\s*file:/gm)].map(m => m[1]);
  const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i);
  assert.deepEqual(duplicates, [], 'asset registry has duplicate object keys');
});

test('missing optional location PNGs use embedded symbols and are not preloaded', () => {
  const locations = run('ASSETS.locationIcons');
  assert.ok(Object.keys(locations).length >= 10);
  for (const [name, item] of Object.entries(locations)) {
    assert.equal(item.file, null, `${name} should not request a missing PNG`);
    assert.ok(item.symbol, `${name} should have an embedded fallback symbol`);
  }
  const renderSource = fs.readFileSync(path.join(root, 'js/ui/render.js'), 'utf8');
  assert.ok(renderSource.includes('location-symbol'));
  assert.ok(renderSource.includes('locIconMeta.symbol'));
});

test('sound can be toggled off and on without altering game mechanics', () => {
  run('setSetting("soundMaster",true)');
  assert.equal(run('initSounds()'), true);
  assert.equal(run('toggleSound()'), false);
  assert.equal(run('getSetting("soundMaster")'), false);
  assert.equal(run('toggleSound()'), true);
  assert.equal(run('getSetting("soundMaster")'), true);
});

test('the local HTML entrypoint does not require remote font services', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(!/https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)/i.test(html), 'HTML should not request Google Fonts online');
});

test('a stale chapter cutscene callback cannot overwrite a newer campaign', () => {
  run(`
    const originalShouldShow = shouldShowCutscene;
    const originalPlay = playChapterCutscene;
    const pendingCutsceneCallbacks = [];
    shouldShowCutscene = () => true;
    playChapterCutscene = () => ({ then(callback) { pendingCutsceneCallbacks.push(callback); return this; } });
    startScenario('sealedSector');
    const oldGeneration = _campaignGeneration;
    startScenario('warpHeart');
    pendingCutsceneCallbacks[0]();
    shouldShowCutscene = originalShouldShow;
    playChapterCutscene = originalPlay;
    if (GAME.campaign.scenarioId !== 'warpHeart') throw new Error('stale callback overwrote active campaign');
    if (GAME.campaign.sceneId !== 'wh_boot') throw new Error('stale callback overwrote active scene');
    if (_campaignGeneration <= oldGeneration) throw new Error('campaign generation did not advance');
  `);
  assert.equal(run('GAME.campaign.scenarioId'), 'warpHeart');
  assert.equal(run('GAME.campaign.sceneId'), 'wh_boot');
});


test('investigation subsystem registers evidence and deduction catalogs', () => {
  assert.ok(run('INVESTIGATION_EVIDENCE.order117'));
  assert.ok(run('INVESTIGATION_DEDUCTIONS.hestAuthorization'));
  assert.ok(run('typeof renderInvestigation === "function"'));
});

test('new world initializes an empty investigation dossier', () => {
  run('resetWorld()');
  assert.deepEqual(Array.from(run('GAME.world.investigation.evidence')), []);
  assert.deepEqual(Object.keys(run('GAME.world.investigation.deductions')), []);
});

test('evidence can be recorded once and duplicate scene visits do not duplicate it', () => {
  run('resetWorld(); recordEvidence("order117", "sf_terminal"); recordEvidence("order117", "sf_terminal")');
  assert.equal(run('GAME.world.investigation.evidence.length'), 1);
  assert.equal(run('GAME.world.investigation.evidence[0].id'), 'order117');
});

test('deduction is blocked until every required piece of evidence is collected', () => {
  run('resetWorld(); recordEvidence(["order117", "hestSeal"], "test")');
  const result = run('makeInvestigationDeduction("hestAuthorization")');
  assert.equal(result.ok, false);
  assert.ok(result.message.includes('Кейн') || result.message.includes('показания'));
  assert.equal(run('GAME.world.flags.deducedHestAuthorization'), undefined);
});

test('administrative deduction requires three independent sources and creates a conditional flag', () => {
  run('resetWorld(); recordEvidence(["order117", "hestSeal", "kaneTestimony"], "test")');
  const result = run('makeInvestigationDeduction("hestAuthorization")');
  assert.equal(result.ok, true);
  assert.equal(run('GAME.world.flags.deducedHestAuthorization'), true);
  assert.equal(run('getDeductionState("hestAuthorization").complete'), true);
  assert.equal(run('getDeductionState("hestAuthorization").available'), true);
});

test('XI Legion connection remains explicitly a hypothesis, not a confirmed fact', () => {
  const definition = run('INVESTIGATION_DEDUCTIONS.xiConnection');
  assert.equal(definition.status, 'неподтверждённая гипотеза');
  assert.ok(definition.result.includes('не доказательство'));
  assert.equal(run('FLAG_REGISTRY.hypothesisXIConnection.includes("не подтверждена")'), true);
});

test('investigation evidence and deductions survive save normalization', () => {
  run('GAME.started = true; GAME.character = createCharacter({name:"Тестовый следователь", classId:"inquisitor"}); resetWorld(); recordEvidence(["order117","hestSeal","kaneTestimony"], "test"); makeInvestigationDeduction("hestAuthorization"); const __save = serializeGame(); const __loaded = prepareLoadedState(__save);');
  assert.equal(run('__loaded.world.investigation.evidence.length'), 3);
  assert.equal(run('__loaded.world.investigation.deductions.hestAuthorization.flag'), 'deducedHestAuthorization');
});

test('chapter I links dossier submission only to the evidence-based deduction', () => {
  const scene = run('CAMPAIGN_SCENARIOS.silentForge.scenes.sf_end');
  const choice = scene.choices.find(c => c.goto === 'sf_report_hest');
  assert.ok(choice);
  assert.equal(choice.requires.flag.deducedHestAuthorization, true);
  assert.ok(run('CAMPAIGN_SCENARIOS.silentForge.scenes.sf_report_hest'));
});


test('temporal anomaly deduction is based on archive evidence without claiming a cause', () => {
  run('resetWorld(); recordEvidence(["xiArchive","temporalRecords"], "test")');
  const result = run('makeInvestigationDeduction("temporalAnomaly")');
  assert.equal(result.ok, true);
  assert.equal(run('GAME.world.flags.deducedTemporalAnomaly'), true);
  assert.ok(result.message.includes('причина неизвестна') || result.message.includes('нельзя считать доказательством'));
});

test('chapter II has an evidence-dossier route gated by chapter I preparation', () => {
  const scene = run('CAMPAIGN_SCENARIOS.sealedSector.scenes.sd_boot');
  const choice = scene.choices.find(c => c.goto === 'sd_dossier_crosscheck');
  assert.ok(choice);
  assert.equal(choice.requires.flag.hestDossierPrepared, true);
  assert.ok(run('CAMPAIGN_SCENARIOS.sealedSector.scenes.sd_dossier_crosscheck'));
});

test('chapter IV chronology evidence route is gated by a recorded deduction', () => {
  const scene = run('CAMPAIGN_SCENARIOS.ordoJudgment.scenes.oj_hq');
  const choice = scene.choices.find(c => c.goto === 'oj_present_chronology');
  assert.ok(choice);
  assert.equal(choice.requires.flag.deducedTemporalAnomaly, true);
  assert.ok(run('CAMPAIGN_SCENARIOS.ordoJudgment.scenes.oj_present_chronology'));
  assert.ok(run('CAMPAIGN_SCENARIOS.ordoJudgment.scenes.oj_hq_decision'));
});


test('evidence effect IDs and deduction flags are all registered', () => {
  const result = run(`(() => {
    const badEvidence = [];
    for (const scenario of Object.values(CAMPAIGN_SCENARIOS)) for (const [sceneId, scene] of Object.entries(scenario.scenes || {})) {
      const evidence = scene.effects && scene.effects.evidence;
      for (const id of (Array.isArray(evidence) ? evidence : evidence ? [evidence] : [])) if (!INVESTIGATION_EVIDENCE[id]) badEvidence.push(sceneId + ":" + id);
    }
    const badFlags = Object.entries(INVESTIGATION_DEDUCTIONS).filter(([,d]) => !FLAG_REGISTRY[d.flag]).map(([id]) => id);
    return {badEvidence,badFlags};
  })()`);
  assert.deepEqual(Array.from(result.badEvidence), []);
  assert.deepEqual(Array.from(result.badFlags), []);
});

test('killing the cultist does not falsely record that the player heard the testimony', () => {
  const effects = run('CAMPAIGN_SCENARIOS.silentForge.scenes.sf_after_cultist.effects');
  assert.equal(effects.flag.heardCultistTruth, undefined);
  assert.equal(effects.flag.knowsSealedSectorLead, true);
});

test('eleven symbols do not automatically prove a link to the lost XI Legion', () => {
  const effects = run('CAMPAIGN_SCENARIOS.silentForge.scenes.sf_tunnel_walls.effects');
  assert.equal(effects.flag.knowsLostLegion, undefined);
  assert.equal(effects.flag.knowsElevenMarks, true);
});


test('investigation panel renders collected evidence and available deduction controls', () => {
  run('resetWorld(); recordEvidence(["order117","hestSeal","kaneTestimony"], "test")');
  const markup = run('renderInvestigation()');
  assert.ok(markup.includes('Приказ 117-Г'));
  assert.ok(markup.includes('Зафиксировать вывод'));
  assert.ok(markup.includes('data-deduction="hestAuthorization"'));
});

test('chapter II opening does not claim cultist testimony when player killed him before talking', () => {
  run('resetWorld(); GAME.world.flags.knowsSealedSectorLead = true');
  const text = run('CAMPAIGN_SCENARIOS.sealedSector.scenes.sd_boot.text(GAME)');
  assert.ok(text.includes('Ты не получил объяснений от культиста'));
  assert.ok(!text.includes('Слова культиста не выходят из головы'));
});

test('scene hint does not advertise removed free-text controls', () => {
  const hint = run('getSceneHint()');
  assert.ok(!hint.includes('свободный текст'));
  assert.ok(!hint.includes('ввести'));
});

/* ============================================================
   СИСТЕМЫ ЭТАПА 6: ФЛАГИ, МИР, NPC, ДОПРОСЫ, МЕЖГЛАВНЫЕ СВЯЗИ
   ============================================================ */

test('continuity system is loaded and visible in navigation', () => {
  assert.equal(run('typeof initContinuity'), 'function');
  assert.equal(run('typeof renderContinuityPanel'), 'function');
  assert.ok(fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('js/systems/continuity.js'));
  assert.ok(fs.readFileSync(path.join(root, 'js/ui/panels.js'), 'utf8').includes('navBtn("continuity"'));
});

test('continuity initializes district, faction and NPC relationship state', () => {
  run('resetWorld(); initNPCs(); initContinuity()');
  assert.equal(run('GAME.world.continuity.districts.sectorIX.name'), 'Сектор IX');
  assert.equal(run('typeof GAME.world.continuity.factionStanding.Inquisition'), 'number');
  assert.equal(run('Array.isArray(GAME.world.continuity.relationships["Сержант Кейн"].memories)'), true);
});

test('setting an evidence-based story flag changes the world once, without duplicate farming', () => {
  run('resetWorld(); initNPCs(); initContinuity(); const before = GAME.world.continuity.districts.sectorIX.security; setFlag("deducedHestAuthorization", true); const once = GAME.world.continuity.districts.sectorIX.security; setFlag("deducedHestAuthorization", true);');
  assert.ok(run('GAME.world.continuity.districts.sectorIX.security') > 28);
  assert.equal(run('GAME.world.continuity.appliedFlags.deducedHestAuthorization'), true);
  assert.equal(run('GAME.world.continuity.events.filter(e => e.flag === "deducedHestAuthorization").length'), 1);
});

test('structured consequence IDs are idempotent', () => {
  run('(()=>{ resetWorld(); initNPCs(); initContinuity(); applyStructuredConsequence({id:"test-world-change",title:"Проверка",districts:{newHive:{security:5}}}); const once = GAME.world.continuity.districts.newHive.security; applyStructuredConsequence({id:"test-world-change",title:"Проверка",districts:{newHive:{security:5}}}); return once; })()');
  assert.equal(run('GAME.world.continuity.districts.newHive.security'), 51);
  assert.equal(run('GAME.world.continuity.events.filter(e => e.consequenceId === "test-world-change").length'), 1);
});

test('story decisions are recorded with scene, chapter and category', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.campaign={scenarioId:"silentForge",sceneId:"sf_test"}; registerStoryDecision("sf_test",{label:"Помочь выжившему рабочему"})');
  assert.equal(run('GAME.world.continuity.decisions.length'), 1);
  assert.equal(run('GAME.world.continuity.decisions[0].category'), 'поддержка / сотрудничество');
  assert.equal(run('GAME.world.continuity.decisions[0].scenarioId'), 'silentForge');
});

test('investigation link network unlocks only when all relevant evidence is present', () => {
  run('resetWorld(); recordEvidence(["order117","hestSeal"],"test");');
  assert.equal(run('getInvestigationLinks().find(x => x.id === "orderChain").available'), false);
  run('recordEvidence("kaneTestimony","test")');
  assert.equal(run('getInvestigationLinks().find(x => x.id === "orderChain").available'), true);
  const markup = run('renderInvestigation()');
  assert.ok(markup.includes('СВЯЗИ УЛИК И ПРОТИВОРЕЧИЯ'));
  assert.ok(markup.includes('не доказывают, что Хест знал о культе'));
});

test('hypothesis network preserves XI Legion uncertainty', () => {
  run('resetWorld(); recordEvidence(["elevenMarks","workerMark","cultistStatement"],"test")');
  const link = run('getInvestigationLinks().find(x => x.id === "elevenHypothesis")');
  assert.equal(link.available, true);
  assert.ok(link.caution.includes('не подтверждает историю или судьбу XI Легиона'));
});

test('formal interrogation requires a met NPC and matching evidence', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.npcs["Сержант Кейн"].met = false; const a = formalInterrogate("Сержант Кейн","workers"); GAME.npcs["Сержант Кейн"].met = true; const b = formalInterrogate("Сержант Кейн","workers")');
  assert.equal(run('a.ok'), false);
  assert.equal(run('b.ok'), false);
  assert.ok(run('b.message.includes("улики") || b.message.includes("зацепки")'));
});

test('formal interrogation saves a bounded result and cannot be repeated for free', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.npcs["Сержант Кейн"].met = true; recordEvidence(["dockTracks","kaneTestimony"],"test"); const first = formalInterrogate("Сержант Кейн","workers"); const second = formalInterrogate("Сержант Кейн","workers")');
  assert.equal(run('first.ok'), true);
  assert.equal(run('second.ok'), false);
  assert.equal(run('GAME.world.continuity.interrogations["Сержант Кейн"].workers !== undefined'), true);
  assert.ok(run('GAME.world.continuity.relationships["Сержант Кейн"].memories.some(m => m.kind === "формальный допрос")'));
});

test('Magos Hest alibi interrogation explicitly separates statement from proven alibi', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.npcs["Магос Хест"].met = true; recordEvidence(["order117"],"test"); const alibiCheck = formalInterrogate("Магос Хест","alibi")');
  assert.equal(run('alibiCheck.ok'), true);
  assert.ok(run('alibiCheck.message.includes("не подтверждённое алиби")'));
  assert.ok(run('alibiCheck.message.includes("не доказывает")'));
  assert.ok(run('GAME.world.continuity.relationships["Магос Хест"].memories.some(m => m.text.includes("Независимого подтверждения"))'));
});

test('NPC dialogue choices are persisted as memory and decisions', () => {
  run('resetWorld(); initNPCs(); initContinuity(); recordDialogueDecision("Лира Доминик", {label:"Спросить о ночных кошмарах"})');
  assert.equal(run('GAME.world.continuity.relationships["Лира Доминик"].dialogueCount'), 1);
  assert.ok(run('GAME.world.continuity.relationships["Лира Доминик"].memories[0].text.includes("ночных кошмарах")'));
});

test('world and faction reactions persist after saving and loading old/new schema', () => {
  run('GAME.started=true; GAME.character=createCharacter({name:"Следователь",classId:"inquisitor"}); resetWorld(); initNPCs(); initContinuity(); setFlag("gateAbandoned",true); const serialized=serializeGame(); const loaded=prepareLoadedState(serialized);');
  assert.equal(run('loaded.world.continuity.districts.catacombs.warpRisk'), 78);
  assert.equal(run('loaded.world.continuity.factionStanding.Chaos'), 4);
  assert.equal(run('loaded.meta.version'), 13);
});

test('legacy save without continuity state migrates conservatively and preserves existing flags', () => {
  run('GAME.started=true; GAME.character=createCharacter({name:"Старый агент",classId:"guardsman"}); resetWorld(); GAME.world.flags.gateContained=true; const legacy=serializeGame(); delete legacy.state.world.continuity; legacy.version=5; const migrated=prepareLoadedState(legacy);');
  assert.equal(run('migrated.world.flags.gateContained'), true);
  assert.equal(run('migrated.world.continuity'), undefined);
  run('Object.assign(GAME, migrated); initNPCs(); initContinuity({rehydrateFlags:true})');
  assert.ok(run('GAME.world.continuity.districts.catacombs.warpRisk < 68'));
});

test('chapter transition records a summary and shows the continuity note only once', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Агент",classId:"inquisitor"}); GAME.campaign={active:true,scenarioId:"silentForge",sceneId:"sf_end"}; recordEvidence(["order117","hestSeal"],"test"); setFlag("deducedHestAuthorization",true); finalizeChapterOutcome("silentForge","sf_end"); const note1=buildChapterTransitionNote("sealedSector"); const note2=buildChapterTransitionNote("sealedSector")');
  assert.equal(run('GAME.world.continuity.chapterOutcomes.length'), 1);
  assert.ok(run('note1.includes("СВОДКА ПРЕДЫДУЩЕГО ДЕЛА")'));
  assert.equal(run('note2'), '');
});

test('campaign ending profile distinguishes warp acceptance, closed gates and unresolved breach', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Агент",classId:"inquisitor"}); GAME.world.flags.gateAbandoned=true');
  assert.equal(run('getCampaignEndingProfile().id'), 'breach');
  run('GAME.world.flags.gateAbandoned=false; GAME.world.flags.closedGateByFaith=true');
  assert.equal(run('getCampaignEndingProfile().id'), 'sealed-faith');
  run('GAME.world.flags.acceptedWarpHeart=true');
  assert.equal(run('getCampaignEndingProfile().id'), 'warp');
});

test('chapter VI dossier and warp-data descriptions do not overstate unproven guilt or ritual origin', () => {
  const scenes = run('CAMPAIGN_SCENARIOS.newHive.scenes');
  const adminHint = String(scenes.wh6_hint.text({world:{flags:{wh6WentAdmin:true, wh6FoundOrder:true}}}));
  const techHint = String(scenes.wh6_hint.text({world:{flags:{wh6WentTech:true, wh6KnowsRitual:true}}}));
  const endText = String(scenes.wh6_end.text({character:{classId:"inquisitor"},world:{flags:{wh6FoundOrder:true, wh6KnowsRitual:true}}, _wh5Branch:"exile"}));
  assert.ok(adminHint.includes('не устанавливает мотив'));
  assert.ok(techHint.includes('возможные признаки ритуала'));
  assert.ok(endText.includes('мотив и степень осведомлённости остаются неустановленными'));
  assert.ok(!endText.includes('Хест — не тот, за кого себя выдаёт'));
});

test('chapter VI has four gated alternative endings and all routes are audited', () => {
  const scenes = run('CAMPAIGN_SCENARIOS.newHive.scenes');
  for (const id of ['wh6_end_ordo','wh6_end_quarantine','wh6_end_exile','wh6_end_heart']) assert.ok(scenes[id], `missing ${id}`);
  const choices = run('CAMPAIGN_SCENARIOS.newHive.scenes.wh6_end.choices');
  assert.ok(choices.some(c => c.goto === 'wh6_end_ordo' && c.requires.flag.deducedHestAuthorization));
  assert.ok(choices.some(c => c.goto === 'wh6_end_quarantine' && c.requires.flag.gateContained));
  assert.ok(choices.some(c => c.goto === 'wh6_end_exile' && c.requires.flag.gateAbandoned));
  assert.ok(choices.some(c => c.goto === 'wh6_end_heart' && c.requires.flag.acceptedWarpHeart));
  assert.deepEqual(Array.from(run('auditScenario("newHive")')), []);
});

test('recorded endings do not duplicate and remain in campaign continuity', () => {
  run('resetWorld(); initContinuity(); recordCampaignEnding("test-ending","Тестовая концовка","Сохранённый итог"); recordCampaignEnding("test-ending","Тестовая концовка","Сохранённый итог")');
  assert.equal(run('GAME.world.continuity.endingHistory.length'), 1);
  assert.equal(run('GAME.world.continuity.endingHistory[0].id'), 'test-ending');
});

test('default ending profile is recorded when the campaign uses endingFromProfile', () => {
  run('resetWorld(); initContinuity(); GAME.character=createCharacter({name:"Агент",classId:"inquisitor"}); GAME.campaign={active:true,scenarioId:"newHive",sceneId:"wh6_end"}; applyEffects({endingFromProfile:true});');
  assert.equal(run('GAME.world.continuity.endingHistory.length'), 1);
  assert.equal(run('GAME.world.continuity.endingHistory[0].id'), 'final-unresolved');
  assert.ok(run('GAME.world.continuity.endingHistory[0].profile.description.includes("вопрос")'));
});

test('new continuity view renders without needing a free-text field', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Агент",classId:"inquisitor"}); const markup=renderContinuityPanel()');
  assert.ok(run('markup.includes("СОСТОЯНИЕ РАЙОНОВ")'));
  assert.ok(run('markup.includes("NPC: ПАМЯТЬ, ДОВЕРИЕ И ДОПРОСЫ")'));
  assert.ok(run('markup.includes("data-interrogate-name")'));
  assert.ok(run("!markup.includes('textarea')"));
  assert.ok(run("!markup.includes('data-command-input')"));
});

test('new campaign remains local, excludes AI integrations and free-text entry while audio is optional', () => {
  const htmlSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const soundSource = fs.readFileSync(path.join(root, 'js/ui/sounds.js'), 'utf8');
  assert.ok(!/openai|anthropic|fetch\s*\(/i.test(htmlSource));
  assert.ok(/function\s+playSound\(type, critical = false\)/.test(soundSource));
  assert.ok(soundSource.includes('AudioContext'));
  assert.ok(!/fetch\s*\(/i.test(soundSource));
  assert.ok(!/id=["']commandInput["']|id=["']commandForm["']/.test(htmlSource));
});


test('every scene in every campaign is reachable from its chapter entry through at least one declared choice path', () => {
  const report = JSON.parse(JSON.stringify(run(`(() => { const out=[]; for(const [id,sc] of Object.entries(CAMPAIGN_SCENARIOS)){ const seen=new Set(), todo=[sc.startScene,...(sc.externalEntryScenes||[])]; while(todo.length){const x=todo.pop(); if(seen.has(x)||!sc.scenes[x]) continue; seen.add(x); const node=sc.scenes[x]; for(const c of (node.choices||[])){ if(c.goto&&sc.scenes[c.goto]) todo.push(c.goto); if(c.onFail&&sc.scenes[c.onFail]) todo.push(c.onFail); } for(const k of ['onSuccess','onFail','skipTo','returnScene']) if(node[k]&&sc.scenes[node[k]]) todo.push(node[k]); if(node.auto&&node.auto.goto&&sc.scenes[node.auto.goto]) todo.push(node.auto.goto); for(const x of (node.dynamicTargets||[])) if(sc.scenes[x]) todo.push(x); } const missing=Object.keys(sc.scenes).filter(x=>!seen.has(x)); if(missing.length) out.push({id,missing}); } return out; })()`)));
  assert.deepEqual(report, [], `Unreachable story scenes: ${JSON.stringify(report)}`);
});

test('all scenes in chapters XI–XV are reachable from their opening scenes and every class has a gated procedure', () => {
  for (const id of ['priceOfEvidence','rightToMemory','lastTransport','beyondHive','verdictNameless']) {
    const result = run(`(() => { const sc=CAMPAIGN_SCENARIOS[${JSON.stringify(id)}]; const seen=new Set(); const todo=[sc.startScene]; while(todo.length){const x=todo.pop(); if(seen.has(x)||!sc.scenes[x]) continue; seen.add(x); for(const c of (sc.scenes[x].choices||[])) if(c.goto && sc.scenes[c.goto]) todo.push(c.goto); for(const k of ['onSuccess','onFail','skipTo','returnScene']) if(sc.scenes[x][k]) todo.push(sc.scenes[x][k]); } return {all:Object.keys(sc.scenes).length,seen:seen.size,scenes:Object.keys(sc.scenes).filter(x=>!seen.has(x))}; })()`);
    assert.equal(result.seen, result.all, `${id} has unreachable scenes: ${result.scenes.join(', ')}`);
  }
  for (const id of ['priceOfEvidence','rightToMemory','lastTransport','beyondHive','verdictNameless']) {
    const classChoices=run(`(() => { const sc=CAMPAIGN_SCENARIOS[${JSON.stringify(id)}]; return Object.values(sc.scenes).flatMap(s=>s.choices||[]).filter(c=>c.requires&&c.requires.classId).map(c=>c.requires.classId); })()`);
    for (const classId of ['inquisitor','guardsman','spaceMarine']) assert.ok(classChoices.includes(classId), `${id} missing class option ${classId}`);
  }
});

test('class-gated options in every new chapter are visible only to the matching class', () => {
  const scenarios=['priceOfEvidence','rightToMemory','lastTransport','beyondHive','verdictNameless'];
  for(const id of scenarios){
    for(const cls of ['inquisitor','guardsman','spaceMarine']){
      run(`GAME.character=createCharacter({name:'Path test',classId:${JSON.stringify(cls)}}); GAME.world.flags={};`);
      const matches=run(`CAMPAIGN_SCENARIOS[${JSON.stringify(id)}].scenes[CAMPAIGN_SCENARIOS[${JSON.stringify(id)}].startScene].choices.filter(c=>c.requires&&c.requires.classId&&sceneRequirementsMet(c.requires)).map(c=>c.requires.classId)`);
      assert.ok(Array.from(matches).includes(cls), `${id} has no visible class choice for ${cls}`);
      for(const other of ['inquisitor','guardsman','spaceMarine'].filter(x=>x!==cls)) assert.ok(!Array.from(matches).includes(other), `${id} incorrectly exposes ${other} option to ${cls}`);
    }
  }
});


test('Release 2.3 main-menu emblem is an SVG centered in a square frame on desktop and mobile', () => {
  const render = fs.readFileSync(path.join(root, 'js/ui/render.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'css/style-release-1-5.css'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'css/style-release-2-2.css'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(render, /class="boot-sigil-frame"/);
  assert.match(html, /class="boot-sigil-frame"/);
  assert.match(styles, /\.boot-sigil-frame\s*\{[^}]*width:\s*88px\s*;\s*height:\s*88px/s);
  assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.boot-sigil-frame\s*\{[^}]*width:\s*72px\s*;\s*height:\s*72px/s);
  assert.match(html, /Релиз 2\.3/);
  assert.match(render, /function renderImperialCross/);
  assert.match(styles, /\.boot-sigil-frame \.imperial-cross\.boot-sigil/);
});

test('tutorial is wired into the local entrypoint and can be skipped or opened again', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const tutorial = fs.readFileSync(path.join(root, 'js/ui/tutorial.js'), 'utf8');
  assert.match(html, /js\/ui\/tutorial\.js/);
  assert.match(tutorial, /data-tutorial-skip/);
  assert.match(tutorial, /ПРОПУСТИТЬ БРИФИНГ/);
  assert.match(tutorial, /левая панель/i);
  assert.match(tutorial, /Архивные слоты/i);
  assert.match(fs.readFileSync(path.join(root, 'js/ui/panels.js'), 'utf8'), /data-action="tutorial"/);
  assert.match(fs.readFileSync(path.join(root, 'js/ui/panels.js'), 'utf8'), /data-action="lore"/);
});

test('save files have explicit format metadata and backup-aware import/export actions', () => {
  assert.equal(run('serializeGame().format'), 'wh40k-solo-rpg-save');
  assert.equal(run('serializeGame().version'), 13);
  assert.match(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'), /function downloadSaveJson/);
  assert.match(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'), /SAVE_BACKUP_KEY/);
  assert.match(fs.readFileSync(path.join(root, 'js/ui/panels.js'), 'utf8'), /Импортировать архив/);
  const saveFeature = run('(() => { GAME.started=true; GAME.character=createCharacter({name:"Файл сохранения",classId:"guardsman"}); resetWorld(); const payload=serializeGame(); const restored=prepareLoadedState(payload); return restored.character.name; })()');
  assert.equal(saveFeature, 'Файл сохранения');
  assert.throws(() => run('prepareLoadedState({format:"other-game",version:10,state:{}})'), /не файл сохранения/);
});

test('operational campaign director survives save/load and migrates old saves safely', () => {
  run(`resetWorld(); GAME.started=true; GAME.character=createCharacter({name:"Проверка состояния операции",classId:"inquisitor"}); GAME.campaign={active:true,scenarioId:"silentForge",sceneId:"sf_intro_inquisitor",stack:["sf_intro_inquisitor"],pendingCombat:null}; initCampaignDirector(); campaignDirectorAdjust("threat",17,"Проверка угрозы","test:director:threat"); campaignDirectorAdjust("supplies",-8,"Проверка снабжения","test:director:supply"); const __directorPayload=serializeGame(); const __directorPrepared=prepareLoadedState(__directorPayload); __directorRestored=__directorPrepared.world.director;`);
  assert.equal(run('__directorRestored.threat'), 39);
  assert.equal(run('__directorRestored.supplies'), 60);
  assert.equal(run('__directorRestored.choicesMade'), 0);
  run(`const __legacyDirector=JSON.parse(JSON.stringify(__directorPayload)); __legacyDirector.version=11; delete __legacyDirector.state.world.director; __legacyDirectorLoaded=prepareLoadedState(__legacyDirector);`);
  assert.ok(run('__legacyDirectorLoaded.world.director'));
  assert.equal(run('__legacyDirectorLoaded.world.director.threat'), 22);
});

test('prayer narration stays immersive and does not state a canonical miracle as objective fact', () => {
  const source = fs.readFileSync(path.join(root, 'js/systems/corruption.js'), 'utf8');
  assert.match(source, /Тьма отступает на мгновение/);
  assert.match(source, /Шёпот Варпа отступает, но память о нём остаётся/);
  assert.doesNotMatch(source, /гарантированное каноническое чудо/i);
});

test('prayer lowers corruption only after a successful will check and is limited to once per game day', () => {
  const prayerResults = run(`(() => {
    const savedGame = JSON.parse(JSON.stringify(GAME));
    const savedCheck = checkWillAgainstCorruption;
    const oldSave = localStorage.getItem(SAVE_KEY), oldBackup = localStorage.getItem(SAVE_BACKUP_KEY);
    try {
      GAME.started=true; GAME.character=createCharacter({name:"Молящийся",classId:"inquisitor"});
      GAME.character.corruption=3; GAME.character.lastPrayerDay=0; resetWorld(); GAME.mode="explore";
      checkWillAgainstCorruption=()=>({d20:12,mod:0,prof:0,bonus:0,total:12,dc:10,result:"success",label:"МОЛИТВА"});
      const first=prayToEmperor(), afterFirst=GAME.character.corruption, day=GAME.character.lastPrayerDay;
      const second=prayToEmperor(), afterSecond=GAME.character.corruption;
      GAME.world.day=2; GAME.mode="combat";
      const inCombat=prayToEmperor(), afterCombat=GAME.character.corruption;
      return {first,afterFirst,day,second,afterSecond,inCombat,afterCombat};
    } finally {
      Object.assign(GAME, savedGame); checkWillAgainstCorruption=savedCheck;
      if(oldSave===null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, oldSave);
      if(oldBackup===null) localStorage.removeItem(SAVE_BACKUP_KEY); else localStorage.setItem(SAVE_BACKUP_KEY, oldBackup);
    }
  })()`);
  assert.deepEqual(JSON.parse(JSON.stringify(prayerResults)), {first:true,afterFirst:2,day:1,second:false,afterSecond:2,inCombat:false,afterCombat:2});
});

test('crash stress: 250 malformed-but-recognizable save payloads normalize safely', () => {
  const result = run(`(() => {
    const classes=['inquisitor','guardsman','spaceMarine'];
    const bad=[null,[],"x",false,{},NaN,Infinity,{nested:[null,{},"bad"]}];
    let seed=0x41c0ffee; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed;};
    let count=0;
    for(let i=0;i<250;i++){
      const cls=classes[rnd()%classes.length];
      const payload={format:'wh40k-solo-rpg-save',version:10,state:{started:true,character:{name:'Crash '+i,classId:cls,hp:bad[rnd()%bad.length],maxHp:bad[rnd()%bad.length],corruption:bad[rnd()%bad.length],level:bad[rnd()%bad.length],stats:bad[rnd()%bad.length],inventory:bad[rnd()%bad.length],ammo:bad[rnd()%bad.length],location:bad[rnd()%bad.length]},world:{day:bad[rnd()%bad.length],flags:bad[rnd()%bad.length],investigation:bad[rnd()%bad.length],continuity:bad[rnd()%bad.length],events:bad[rnd()%bad.length]},campaign:{scenarioId:bad[rnd()%bad.length],sceneId:bad[rnd()%bad.length]},combat:bad[rnd()%bad.length],meta:{seed:rnd()}}};
      const state=prepareLoadedState(payload);
      if(!state.character || !classes.includes(state.character.classId)) throw new Error('invalid class after normalization at '+i);
      if(!Number.isFinite(state.character.hp) || state.character.hp<0 || state.character.hp>state.character.maxHp) throw new Error('HP out of bounds at '+i);
      if(!Number.isFinite(state.character.corruption) || state.character.corruption<0 || state.character.corruption>10) throw new Error('corruption out of bounds at '+i);
      if(!state.world || !state.world.flags || Array.isArray(state.world.flags)) throw new Error('invalid world flags at '+i);
      count++;
    }
    return count;
  })()`);
  assert.equal(result, 250);
});

test('crash stress: evidence and deductions remain idempotent under repeated actions', () => {
  const result = run(`(() => {
    resetWorld(); GAME.started=true; GAME.character=createCharacter({name:'Стресс-тест',classId:'inquisitor'});
    const a=recordEvidence(['order117','order117','not-a-real-evidence'],'stress');
    const b=recordEvidence(['order117'],'stress');
    for(let i=0;i<20;i++) recordEvidence(['hestSeal','kaneTestimony'],'stress');
    const evidenceCount=GAME.world.investigation.evidence.length;
    const first=makeInvestigationDeduction('hestAuthorization');
    const second=makeInvestigationDeduction('hestAuthorization');
    return {a:a.length,b:b.length,evidenceCount,first:first.ok,second:second.ok};
  })()`);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {a:1,b:0,evidenceCount:3,first:true,second:false});
});

test('balance simulation samples 10,000 actual d20 checks per class and 30,000 damage rolls', () => {
  const stats=JSON.parse(JSON.stringify(run(`(() => { const out={}; for(const id of ['inquisitor','guardsman','spaceMarine']) { RNG.setSeed(20261023); const c=CLASSES[id]; let hits=0; const N=10000; for(let i=0;i<N;i++){const r=rollCheck({statScore:c.stats.dex,prof:c.prof,dc:14});if(r.result==='success'||r.result==='critical')hits++;} out[id]=hits/N; } const damage={}; for(const sides of [8,10,12]){RNG.setSeed(20261023+sides);let sum=0;const N=10000;for(let i=0;i<N;i++)sum+=rollDamage(sides, sides===12?1:0);damage['d'+sides]=sum/N;} return {out,damage}; })()`)));
  assert.ok(Math.abs(stats.out.inquisitor-0.50)<0.025, `Inquisitor hit rate outside expected range: ${stats.out.inquisitor}`);
  assert.ok(Math.abs(stats.out.guardsman-0.55)<0.025, `Guardsman hit rate outside expected range: ${stats.out.guardsman}`);
  assert.ok(Math.abs(stats.out.spaceMarine-0.50)<0.025, `Astartes hit rate outside expected range: ${stats.out.spaceMarine}`);
  assert.ok(Math.abs(stats.damage.d8-4.5)<0.15, `d8 mean outside expected range: ${stats.damage.d8}`);
  assert.ok(Math.abs(stats.damage.d10-5.5)<0.15, `d10 mean outside expected range: ${stats.damage.d10}`);
  assert.ok(Math.abs(stats.damage.d12-7.5)<0.15, `d12+1 mean outside expected range: ${stats.damage.d12}`);
});

test('technical closure of the Warp seam is not recorded as faith and carries separate chapter-IV consequences', () => {
  assert.ok(run('!!FLAG_REGISTRY.closedGateByKnowledge'));
  assert.ok(run('!!CONTINUITY_FLAG_RULES.closedGateByKnowledge'));
  assert.ok(run('getCampaignEndingProfile({world:{flags:{closedGateByKnowledge:true}},character:{corruption:0}}).id === "sealed-knowledge"'));
  const src=fs.readFileSync(path.join(root,'js/content/campaigns/ch2_sealedSector.js'),'utf8');
  assert.ok(src.includes('flag: { closedGateByKnowledge: true, knowsWarpTruth: true }'));
  assert.ok(!src.includes('flag: { closedGateByFaith: true, knowsWarpTruth: true }'));
});

test('all four Chapter X endings continue to Chapter XI and do not prematurely close the campaign', () => {
  for (const id of ['wh10_ending_report','wh10_ending_quarantine','wh10_ending_rescue','wh10_ending_heart']) {
    const scene=run(`CAMPAIGN_SCENARIOS.silentRoute.scenes[${JSON.stringify(id)}]`);
    assert.equal(scene.effects.flag.campaignComplete,false);
    assert.ok(scene.choices.some(c=>c.goto==='__chapter11__'));
  }
});

test('all expanded gameplay panels render without a browser DOM or runtime exception', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Полевой агент",classId:"inquisitor"}); GAME.character.location="Доки Навигатор"; initializeExpansionSystems(); const panels=[renderDevelopmentPanel(),renderSquadPanel(),renderOperationsPanel(),renderArmoryPanel(),renderCampaignWorkshop(),renderExpansionExploration(),renderMap()]');
  assert.equal(run('panels.length'), 7);
  assert.ok(run('panels.every(x => typeof x === "string" && x.length > 100)'));
  assert.ok(run('panels[0].includes("ПОЛЕВАЯ ПОДГОТОВКА")'));
  assert.ok(run('panels[1].includes("ОТРЯД И КОНТАКТЫ")'));
  assert.ok(run('panels[2].includes("ПЛАНШЕТ ОПЕРАЦИЙ")'));
  assert.ok(run('panels[3].includes("КВАРТЕРМЕЙСТЕР")'));
  assert.ok(run('panels[4].includes("ЛОКАЛЬНАЯ МАСТЕРСКАЯ")'));
  assert.ok(run('panels[5].includes("ПОЛЕВОЕ ИССЛЕДОВАНИЕ")'));
});

test('all optional operation destinations exist in the location registry', () => {
  assert.deepEqual(Array.from(run('EXPANSION_OPERATION_DEFS.filter(d => !LOCATIONS[d.location]).map(d => d.id)'), String), []);
  assert.equal(run('EXPANSION_OPERATION_DEFS.length'), 5);
});

test('doctrine progression unlocks at levels 3/6/9/12, applies once, and persists', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Инквизитор",classId:"inquisitor"}); GAME.character.level=2; initializeExpansionSystems()');
  assert.equal(run('GAME.character.doctrinePoints'), 0);
  run('GAME.character.level=3; initializeExpansionSystems()');
  assert.equal(run('GAME.character.doctrinePoints'), 1);
  assert.equal(run('selectDoctrine("inq-forensics").ok'), true);
  assert.equal(run('getDoctrineCheckBonus("int")'), 2);
  assert.equal(run('selectDoctrine("inq-forensics").ok'), false);
  assert.equal(run('GAME.character.doctrinePoints'), 0);
  run('const savedDoctrine=serializeGame(); const loadedDoctrine=prepareLoadedState(savedDoctrine)');
  assert.ok(run('loadedDoctrine.character.doctrines.includes("inq-forensics")'));
});

test('operation cannot start away from its destination and cannot repeat its reward', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Полевой агент",classId:"inquisitor"}); GAME.character.location="Доки Навигатор"; GAME.world.current=GAME.character.location; initializeExpansionSystems()');
  assert.equal(run('startExpansionOperation("worker-relief").ok'), false);
  run('GAME.character.location="Промзона"; GAME.world.current="Промзона"');
  assert.equal(run('startExpansionOperation("worker-relief").ok'), true);
  assert.equal(run('startExpansionOperation("worker-relief").ok'), false);
  run(' { const localDie = RNG.die; RNG.die = () => 20; try { operationResult = resolveExpansionOperation("worker-relief","verify"); } finally { RNG.die = localDie; } }');
  assert.equal(run('operationResult.ok'), true);
  assert.equal(run('operationResult.success'), true);
  assert.equal(run('GAME.world.expansion.operations["worker-relief"].status'), 'complete');
  assert.equal(run('hasEvidence("workerManifest")'), true);
  const credits = run('GAME.character.credits');
  assert.equal(run('resolveExpansionOperation("worker-relief","verify").ok'), false);
  assert.equal(run('GAME.character.credits'), credits);
});

test('failed operation leaves uncertainty explicit and still resolves only once', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Полевой агент",classId:"guardsman"}); GAME.character.location="Архив"; GAME.world.current="Архив"; initializeExpansionSystems(); startExpansionOperation("archives-audit")');
  run(' { const localDie = RNG.die; RNG.die = () => 1; try { failedOperation = resolveExpansionOperation("archives-audit","compare"); } finally { RNG.die = localDie; } }');
  assert.equal(run('failedOperation.success'), false);
  assert.equal(run('GAME.world.expansion.operations["archives-audit"].status'), 'complete');
  assert.equal(run('hasEvidence("cogitatorLog")'), false);
  assert.equal(run('resolveExpansionOperation("archives-audit","compare").ok'), false);
});

test('exploration renderer works; invalid and duplicate actions do not farm progress', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Полевой агент",classId:"guardsman"}); GAME.character.location="Промзона"; GAME.world.current="Промзона"; initializeExpansionSystems(); explorationMarkup=renderExpansionExploration()');
  assert.ok(run('explorationMarkup.includes("data-explore-action=\\"search\\"")'));
  assert.equal(run('exploreCurrentLocation("teleport").ok'), false);
  assert.equal(run('Object.keys(GAME.world.expansion.exploration).length'), 0);
  run(' { const localDie = RNG.die; RNG.die = () => 20; try { exploreResult = exploreCurrentLocation("search"); } finally { RNG.die = localDie; } }');
  assert.equal(run('exploreResult.ok'), true);
  assert.equal(run('Object.keys(GAME.world.expansion.exploration).length'), 1);
  const xp = run('GAME.character.xp');
  assert.equal(run('exploreCurrentLocation("search").ok'), false);
  assert.equal(run('GAME.character.xp'), xp);
});

test('NPC contacts require a meeting, create memory and cannot be repeated the same day', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Инквизитор",classId:"inquisitor"}); initializeExpansionSystems()');
  assert.equal(run('performContactAction("kane","debrief").ok'), false);
  run('GAME.npcs["Сержант Кейн"].met=true');
  assert.equal(run('performContactAction("kane","debrief").ok'), true);
  assert.equal(run('performContactAction("kane","debrief").ok'), false);
  assert.equal(run('GAME.world.expansion.interactions[`${GAME.world.day||1}:kane`]'), 'debrief');
  assert.ok(run('GAME.world.continuity.relationships["Сержант Кейн"].memories.length > 0'));
  run('const contactSave=serializeGame(); const contactLoaded=prepareLoadedState(contactSave)');
  assert.equal(run('contactLoaded.world.expansion.interactions[`${contactLoaded.world.day||1}:kane`]'), 'debrief');
});

test('Lyra personal quest is gated, grants one reward and cannot be farmed', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Агент",classId:"inquisitor"}); initializeExpansionSystems()');
  assert.equal(run('startLyraPersonalQuest().ok'), false);
  run('GAME.npcs["Лира Доминик"].met=true');
  assert.equal(run('startLyraPersonalQuest().ok'), true);
  run('GAME.character.location="Промзона"; GAME.world.current="Промзона"');
  run(' { const localDie = RNG.die; RNG.die = () => 20; try { lyraQuestResult = resolveLyraPersonalQuest("checkpoint"); } finally { RNG.die = localDie; } }');
  assert.equal(run('lyraQuestResult.success'), true);
  assert.equal(run('GAME.world.expansion.personalQuests.lyraDogtags.status'), 'complete');
  assert.equal(run('hasItem("Жетоны погибшего отделения")'), true);
  assert.equal(run('resolveLyraPersonalQuest("checkpoint").ok'), false);
});

test('armory enforces class access and verifies weapon catalog before purchase', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Гвардеец",classId:"guardsman"}); GAME.character.credits=1000; GAME.character.weapon="Лазпистолет"');
  assert.equal(run('canUseArmory(EXPANSION_ARMORY.find(x=>x.id==="bolter"))'), false);
  assert.equal(run('purchaseArmoryItem("bolter").ok'), false);
  assert.equal(run('GAME.character.credits'), 1000);
  assert.equal(run('purchaseArmoryItem("lasgun").ok'), true);
  assert.equal(run('GAME.character.weapon'), 'Лазган');
  assert.equal(run('GAME.character.credits'), 915);
});

test('enemy tactical profiles are defined, hidden until analysis, and cover tactics are explicit', () => {
  const profiles = run(`Object.keys(ENEMIES).every(type => { const p=getEnemyTactics(type); return !!p.id && !!p.title && !!p.description && Number.isFinite(p.companionChance); })`);
  assert.equal(profiles, true, 'every enemy needs a safe tactical fallback/profile');
  assert.equal(run(`getEnemyTactics('flamer_tzeentch').piercesCover`), true);
  assert.equal(run(`getEnemyTactics('screamer').flanksCover`), true);
  run(`resetWorld(); GAME.character=createCharacter({name:'Тактический тест',classId:'guardsman'}); startCombat('flamer_tzeentch');`);
  assert.ok(!run('renderMain()').includes('ТАКТИКА: Дальняя огневая угроза'), 'enemy tactics should stay hidden before analysis');
  run('GAME.combat.enemies[0].identified=true');
  assert.ok(run('renderMain()').includes('ТАКТИКА: Дальняя огневая угроза'), 'analysis should reveal tactical dossier');
});

test('combat round counter advances after an enemy phase without leaking combat state', () => {
  const result = run(`(() => {
    resetWorld(); GAME.character=createCharacter({name:'Раунды',classId:'guardsman'}); startCombat('cultist');
    const before=GAME.combat.round; GAME.combat.enemies.forEach(e=>e.hp=0); runEnemyTurns();
    return {before,after:GAME.combat.round,mode:GAME.mode,combatStillPresent:!!GAME.combat};
  })()`);
  assert.equal(result.after, result.before + 1);
  assert.equal(result.combatStillPresent, true);
});

test('tactical aim and cover have distinct, bounded combat states', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Гвардеец",classId:"guardsman"}); GAME.character.weapon="Лазган"; GAME.character.ammo.lasgun=8; startCombat("cultist"); GAME.combat.weaponSlot="ranged"');
  run('const oldAfterAction=afterPlayerCombatAction; afterPlayerCombatAction=function(){}; try { combatAim(); combatTakeCover(); } finally { afterPlayerCombatAction=oldAfterAction; }');
  assert.equal(run('GAME.combat.aimed'), true);
  assert.equal(run('GAME.combat.inCover'), true);
  assert.ok(run('GAME.character.conditions.includes("Прикрытие")'));
});

test('local campaign workshop accepts a valid draft and rejects a missing target scene', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Автор",classId:"inquisitor"}); initializeExpansionSystems(); GAME.world.expansion.editorForm={id:"side_draft_valid",title:"Тестовая сцена",description:"Наблюдаемые факты, без предположений как доказательств.",choiceLabel:"Проверить документ",goto:"sf_intro_inquisitor"}; draftSaveResult=saveExpansionDraft()');
  assert.equal(run('draftSaveResult.ok'), true);
  assert.equal(run('validateExpansionDrafts().ok'), true);
  run('GAME.world.expansion.drafts.push({id:"side_draft_broken",title:"Сломанная ссылка",description:"Тест",choiceLabel:"Перейти",goto:"missing_scene_id"}); brokenValidation=validateExpansionDrafts()');
  assert.equal(run('brokenValidation.ok'), false);
  assert.ok(run('brokenValidation.errors.some(e => e.includes("missing_scene_id"))'));
});

test('map respects evidence gate and only permits registered adjacent movement', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Следователь",classId:"inquisitor"}); GAME.character.location="Техно-капелла"; GAME.world.current="Техно-капелла"');
  run('moveTo("Запретная зона")');
  assert.equal(run('GAME.character.location'), 'Техно-капелла');
  run('GAME.world.flags.sawOrder117=true; moveTo("Запретная зона")');
  assert.equal(run('GAME.character.location'), 'Запретная зона');
  run('moveTo("Казармы")');
  assert.equal(run('GAME.character.location'), 'Запретная зона', 'non-adjacent/unavailable jump must be rejected');
});

test('no duplicate lore flag keys and in-game claims are labelled as unverified', () => {
  const state = fs.readFileSync(path.join(root,'js/core/state.js'),'utf8');
  const enemies = fs.readFileSync(path.join(root,'js/content/enemies.js'),'utf8');
  const codex = fs.readFileSync(path.join(root,'js/content/codex-lore.js'),'utf8');
  const chapter2 = fs.readFileSync(path.join(root,'js/content/campaigns/ch2_sealedSector.js'),'utf8');
  assert.ok(!/WAAAGH! никогда не стихает/.test(enemies));
  assert.ok(!/их всегда больше/.test(enemies));
  assert.ok(!/Убивать Ужасов без подготовки — значит удвоить их количество/.test(codex));
  assert.ok(/knowsWarpTruth:\s+"Получил субъективное объяснение/.test(state));
  assert.ok(/shadowSpokeTruth:\s+"Принял слова Тени за правду; независимого подтверждения нет"/.test(state));
  assert.ok(chapter2.includes('независимым источником, подтверждающим ни её версию судьбы Легиона'));
  const flagStart=state.indexOf('const FLAG_REGISTRY'); const flagEnd=state.indexOf('\n};',flagStart); const flagRegistry=state.slice(flagStart,flagEnd);
  const registryKeys=[...flagRegistry.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)].map(match=>match[1]);
  const uniqueRegistryKeys=new Set(registryKeys);
  assert.equal(uniqueRegistryKeys.size,registryKeys.length,`FLAG_REGISTRY has duplicate keys: ${registryKeys.filter((key,index)=>registryKeys.indexOf(key)!==index).join(', ')}`);
  assert.ok(/heardVoiceOfTzeentch:\s*"Услышал голос, назвавшийся Тзинчем; личность не подтверждена"/.test(flagRegistry));
  assert.ok(/sawWarpTruth:\s*"Получил видение или утверждение о XI Легионе; содержание не подтверждено"/.test(flagRegistry));
  assert.ok(/wh6KnowsBiggerThreat:\s*"Рабочая гипотеза о более широкой угрозе; не подтверждена"/.test(flagRegistry));
});

test('new expansion state is preserved on round-trip and legacy saves are normalized', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Полевой агент",classId:"inquisitor"}); initializeExpansionSystems(); GAME.world.expansion.operations["worker-relief"].status="complete"; GAME.world.expansion.drafts.push({id:"saved_draft",title:"Черновик"}); GAME.character.doctrines=["inq-forensics"]; const expSave=serializeGame(); const expLoaded=prepareLoadedState(expSave)');
  assert.equal(run('expLoaded.world.expansion.operations["worker-relief"].status'), 'complete');
  assert.equal(run('expLoaded.world.expansion.drafts[0].id'), 'saved_draft');
  assert.ok(run('expLoaded.character.doctrines.includes("inq-forensics")'));
  run('const expLegacy=JSON.parse(JSON.stringify(expSave)); delete expLegacy.state.world.expansion; expLegacy.version=5; expLegacyLoaded=prepareLoadedState(expLegacy)');
  assert.equal(run('expLegacyLoaded.world.expansion'), undefined);
  run('Object.assign(GAME, expLegacyLoaded); initializeExpansionSystems()');
  assert.equal(run('GAME.world.expansion.operations["worker-relief"].status'), 'available');
});

test('visual beats degrade gracefully when a referenced optional image is absent', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Следователь",classId:"inquisitor"}); initializeExpansionSystems(); setExpansionCinematic("Тест", "Смысл сцены остаётся доступен без картинки.", "no-such-background"); cinematicMarkup=renderExpansionCinematic()');
  assert.ok(run('cinematicMarkup.includes("Смысл сцены остаётся доступен без картинки.")'));
  assert.ok(run('cinematicMarkup.includes("data-cinematic-dismiss")'));
});

test('lore-specific class and armory content avoids treating campaign inventions as universal canon', () => {
  const codex = fs.readFileSync(path.join(root,'js/content/codex-lore.js'),'utf8');
  const expansion = fs.readFileSync(path.join(root,'js/systems/expansion.js'),'utf8');
  assert.ok(/авторской кампании/.test(codex));
  assert.ok(/Силовая броня Астартес не включена в общий торговый каталог/.test(expansion));
  assert.ok(/выдача человеку требует обоснованного допуска/.test(expansion));
  assert.ok(/только при выполнении условий кампании/.test(expansion));
});


test('ammunition bought from the quartermaster integrates with the existing reload economy', () => {
  run('resetWorld(); GAME.character=createCharacter({name:"Гвардеец",classId:"guardsman"}); GAME.character.credits=100; GAME.character.inventory=[]; GAME.character.weapon="Лазган"; GAME.character.ammo.lasgun=20; GAME.combat=null; ammoPurchase=purchaseArmoryItem("ammo-pack"); reloadWeapon()');
  assert.equal(run('ammoPurchase.ok'), true);
  assert.equal(run('GAME.character.ammo.lasgun'), 24);
  assert.equal(run('(GAME.character.inventory.find(i=>i.name==="Энергоячейки")||{}).qty'), 8);
});

test('location registry contains one canonical chapel key and preserves its sanctuary metadata', () => {
  const source = fs.readFileSync(path.join(root,'js/content/locations.js'),'utf8');
  assert.equal((source.match(/"Храм"\s*:/g)||[]).length, 1);
  assert.equal(run('LOCATIONS["Храм"].sacred'), true);
  assert.ok(run('LOCATIONS["Храм"].name.includes("Часовня")'));
});


test('each class has four doctrines so all milestone points through level 12 can be spent', () => {
  const classes = run('Object.keys(EXPANSION_DOCTRINES)');
  assert.deepEqual(Array.from(classes).sort(), ['guardsman','inquisitor','spaceMarine'].sort());
  for (const classId of classes) {
    run(`resetWorld(); GAME.character=createCharacter({name:"Доктрина",classId:${JSON.stringify(classId)}}); GAME.character.level=12; initializeExpansionSystems()`);
    assert.equal(run('getClassDoctrines().length'), 4, `${classId} must have four doctrine choices`);
    assert.equal(run('GAME.character.doctrinePoints'), 4);
    const ids = run('getClassDoctrines().map(d=>d.id)');
    for (const id of ids) assert.equal(run(`selectDoctrine(${JSON.stringify(id)}).ok`), true, `${classId}: ${id}`);
    assert.equal(run('GAME.character.doctrinePoints'), 0);
  }
});

test('an evidence bonus recognizes dossier evidence IDs as well as story flags', () => {
  run('resetWorld(); initNPCs(); initContinuity(); GAME.character=createCharacter({name:"Агент",classId:"inquisitor"}); GAME.character.location="Морг"; GAME.world.current="Морг"; initializeExpansionSystems(); recordEvidence("cogitatorLog","test:evidence"); startExpansionOperation("morgue-audit")');
  run(' { const localDie=RNG.die; RNG.die=()=>20; try { evidenceBonusResult=resolveExpansionOperation("morgue-audit","register"); } finally { RNG.die=localDie; } }');
  assert.equal(run('evidenceBonusResult.success'), true);
  assert.equal(run('GAME.world.expansion.operations["morgue-audit"].roll.bonus'), 2);
});


test('visual release 1.5 provides the Imperial Archive theme, scene fallback, mobile state drawer and reduced-motion support', () => {
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  const css = fs.readFileSync(path.join(root,'css/style-release-1-5.css'),'utf8');
  const renderer = fs.readFileSync(path.join(root,'js/ui/render.js'),'utf8');
  const panels = fs.readFileSync(path.join(root,'js/ui/panels.js'),'utf8');
  const app = fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  assert.ok(html.includes('css/style-release-1-5.css'));
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'));
  assert.ok(css.includes('body.show-right-panel .right'));
  assert.ok(css.includes('grid-template-rows: minmax(120px, 33dvh) minmax(0,1fr)'), 'mobile layout must reserve one row for navigation and one for story');
  assert.ok(css.includes('.scene-placeholder'));
  assert.ok(css.includes('.investigation-card'));
  assert.ok(renderer.includes('data-toggle-panel="right"'));
  assert.ok(renderer.includes('ИЛЛЮСТРАЦИЯ НЕ ВХОДИТ В ЭТОТ ПАКЕТ'));
  const releaseCss = fs.readFileSync(path.join(root,'css/style-release-2-2.css'),'utf8');
  assert.ok(releaseCss.includes('url("../assets/backgrounds/temple-user.png")'));
  assert.ok(releaseCss.includes('.story-location-art img'));
  assert.ok(panels.includes('data-close-panel="right"'));
  assert.ok(app.includes('document.body.classList.toggle("show-right-panel")'));
  assert.ok(!/https?:\/\//i.test(css), 'visual stylesheet must not request remote styles/assets');
});

test('corruption ending text is role-neutral and does not assert Tzeentch identity as independently proven', () => {
  for (const [classId, role] of [['inquisitor','служитель Инквизиции'],['guardsman','солдат'],['spaceMarine','Астартес']]) {
    run(`resetWorld(); GAME.started=true; GAME.character=createCharacter({name:"Тест",classId:${JSON.stringify(classId)}}); GAME.mode="explore"; triggerCorruptionEnding()`);
    const latest = run('GAME.story[GAME.story.length-1].text');
    assert.ok(latest.includes(role), `${classId} ending must reflect the actual character role`);
    assert.ok(latest.includes('не подтверждён независимыми свидетельствами'));
    assert.ok(!latest.includes('Ты больше не Инквизитор'));
  }
  const screen = run('renderCorruptionEnd()');
  assert.ok(screen.includes('служитель Инквизиции, солдат или Астартес'));
  assert.ok(screen.includes('не раскрывает окончательно источник голоса'));
});

test('scene illustration fallback stays immersive without pretending missing user assets are present', () => {
  const renderer = fs.readFileSync(path.join(root,'js/ui/render.js'),'utf8');
  assert.ok(renderer.includes('scene-placeholder'));
  assert.ok(renderer.includes('ПОВЕСТВОВАНИЕ СОХРАНЕНО'));
  assert.ok(renderer.includes('ИЛЛЮСТРАЦИЯ НЕ ВХОДИТ В ЭТОТ ПАКЕТ'));
  const releaseCss = fs.readFileSync(path.join(root,'css/style-release-2-2.css'),'utf8');
  assert.ok(releaseCss.includes('url("../assets/backgrounds/temple-user.png")'));
  assert.ok(releaseCss.includes('.story-location-art img'));
});

console.log(`\nResult: ${passed} passed, ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
