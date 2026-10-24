#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root=path.resolve(__dirname,'..');
const handlers={};
const sandbox={
  GAME:{world:{day:1,hour:7,minute:15,flags:{},heat:0},character:{classId:'inquisitor',stats:{int:16,cha:14},reputation:{}},campaign:{scenarioId:'silentForge',sceneId:'test_scene'}},
  Bus:{on(name,fn){(handlers[name] ||= []).push(fn);},emit(name,payload){for(const fn of handlers[name]||[])fn(payload||{});}},
  esc:s=>String(s).replace(/[&<>"']/g,'?'),
  timeString:()=> '07:15',
  console,
  Math, Number, String, Object, Array, Date,
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'js/systems/campaign-director.js'),'utf8'),sandbox,{filename:'campaign-director.js'});
const run=src=>vm.runInContext(src,sandbox);
run('initCampaignDirector()');
assert.equal(run('GAME.world.director.threat'),22);
run('Bus.emit("scene_entered",{sceneId:"A",title:"Scene A"})');
run('Bus.emit("scene_entered",{sceneId:"A",title:"Scene A"})');
assert.equal(run('GAME.world.director.scenesVisited'),2);
assert.equal(run('GAME.world.director.sceneVisits["silentForge:A"]'),2);
assert.equal(run('GAME.world.director.log.filter(e=>e.type==="scene").length'),1,'scene visit log should avoid duplicate first-visit notices');
run('Bus.emit("choice_made",{sceneId:"A",choice:{label:"Проверить архив"}})');
assert.equal(run('GAME.world.director.choicesMade'),1);
run('Bus.emit("evidence_discovered",{id:"order117",title:"Приказ 117-Г"})');
run('Bus.emit("evidence_discovered",{id:"order117",title:"Приказ 117-Г"})');
assert.equal(run('GAME.world.director.evidenceFound'),1,'same evidence must be counted once');
assert.equal(run('GAME.world.director.order'),49,'evidence increments operational control once');
assert.ok(run('campaignDirectorCheckModifiers("int","Анализ досье")').bonus>=1,'Inquisitor gets a contextual investigation bonus');
run('GAME.character.classId="guardsman"');
assert.ok(run('campaignDirectorCheckModifiers("dex","Тактическое укрытие")').bonus>=1,'Guardsman gets a contextual field bonus');
run('GAME.character.classId="spaceMarine"');
assert.ok(run('campaignDirectorCheckModifiers("str","Силовой пролом")').bonus>=2,'Astartes gets a contextual strength bonus');
run('GAME.world.director.threat=99; campaignDirectorAdjust("threat",20,"bound test")');
assert.equal(run('GAME.world.director.threat'),100,'pressure is clamped to 100');
run('campaignDirectorAdjust("threat",-15,"once", "test:once"); campaignDirectorAdjust("threat",-15,"once", "test:once")');
assert.equal(run('GAME.world.director.threat'),85,'idempotent signal changes pressure once');
assert.ok(run('renderCampaignDirectorPanel().includes("ОПЕРАТИВНАЯ ОБСТАНОВКА")'));
console.log('Campaign director integrity: bounded pressure, idempotent evidence, scene log, choice counter, role bonuses, panel render — PASS.');
