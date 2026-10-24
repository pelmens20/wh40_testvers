#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

class FakeElement {
  constructor(tag='div') {
    this.tagName=tag; this.children=[]; this.parentNode=null; this.attributes={};
    this.style={}; this.dataset={}; this.textContent=''; this.className=''; this.onclick=null;
    this.classList={values:new Set(),add:(...xs)=>xs.forEach(x=>this.classList.values.add(x)),remove:(...xs)=>xs.forEach(x=>this.classList.values.delete(x)),contains:x=>this.classList.values.has(x)};
  }
  appendChild(child){ if(child.parentNode) child.parentNode.removeChild(child); this.children.push(child); child.parentNode=this; return child; }
  removeChild(child){ const i=this.children.indexOf(child); if(i>=0)this.children.splice(i,1); child.parentNode=null; return child; }
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k] ?? null;}
  addEventListener(){}
  removeEventListener(){}
  focus(){}
  click(){if(typeof this.onclick==='function')this.onclick();}
  querySelector(selector){ if(selector.startsWith('.')) { const cls=selector.slice(1); const visit=n=>{for(const c of n.children){if(String(c.className).split(/\s+/).includes(cls))return c;const x=visit(c);if(x)return x;}return null;}; return visit(this); } return null; }
}
const byId=new Map();
const listeners=new Map();
const document={
  body:new FakeElement('body'),
  createElement(tag){return new FakeElement(tag);},
  getElementById(id){return byId.get(id)||null;},
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
};
const originalAppend=document.body.appendChild.bind(document.body);
document.body.appendChild=(el)=>{if(el.id)byId.set(el.id,el);const result=originalAppend(el);return result;};
const originalRemove=document.body.removeChild.bind(document.body);
document.body.removeChild=(el)=>{if(el.id)byId.delete(el.id);return originalRemove(el);};
const context=vm.createContext({
  console, document, Date, Math, JSON, Object, Array, Set, Map, String, Number, Boolean, RegExp, Error, Promise,
  setTimeout, clearTimeout, setInterval, clearInterval,
  window:{matchMedia:()=>({matches:true})},
  GAME:{character:{classId:'inquisitor'},world:{flags:{}}},
  setSoundContext(){}, playSound(){},
});
const root=path.resolve(__dirname,'..');
vm.runInContext(fs.readFileSync(path.join(root,'js/ui/cutscenes.js'),'utf8'),context,{filename:'js/ui/cutscenes.js'});
const run=expr=>vm.runInContext(expr,context);
const chapters=['silentForge','sealedSector','warpHeart','ordoJudgment','afterJudgment','newHive','ashProtocol','resonanceArchive','witnessLedger','silentRoute','priceOfEvidence','rightToMemory','lastTransport','beyondHive','verdictNameless'];
const classes=['inquisitor','guardsman','spaceMarine'];
(async()=>{
  let passed=0;
  for(const chapter of chapters){
    for(const cls of classes){
      run(`GAME.character.classId=${JSON.stringify(cls)}`);
      const promise=run(`playChapterCutscene(${JSON.stringify(chapter)})`);
      const overlay=document.getElementById('chapterCutscene');
      assert.ok(overlay,`overlay missing for ${chapter}/${cls}`);
      assert.equal(overlay.getAttribute('role'),'dialog');
      const stamp=overlay.children.find(c=>c.className==='cutscene-role-stamp');
      assert.ok(stamp && stamp.textContent.includes(cls==='spaceMarine'?'КАРАУЛА СМЕРТИ':cls==='guardsman'?'ГВАРДЕЙЦА':'ИНКВИЗИЦИИ'),`role stamp wrong for ${chapter}/${cls}`);
      const lens=overlay.querySelector('.cutscene-class-lens');
      assert.ok(lens,`class lens missing for ${chapter}/${cls}`);
      const skip=overlay.children.find(c=>c.className==='cutscene-skip');
      assert.ok(skip && typeof skip.onclick==='function');
      skip.click();
      const result=await promise;
      assert.equal(result,'skipped');
      assert.equal(document.getElementById('chapterCutscene'),null,`overlay leaked for ${chapter}/${cls}`);
      assert.equal(listeners.get('keydown')?.size||0,0,`keydown listener leaked for ${chapter}/${cls}`);
      passed++;
    }
  }
  for(const cls of classes){
    run(`GAME.character.classId=${JSON.stringify(cls)}`);
    const promise=run(`playChapterCutscene(${JSON.stringify('class_'+cls)})`);
    const overlay=document.getElementById('chapterCutscene');
    assert.ok(overlay,`class intro missing: ${cls}`);
    assert.equal(overlay.querySelector('.cutscene-class-lens'),null,'class intro should not duplicate its class perspective');
    overlay.children.find(c=>c.className==='cutscene-skip').click();
    assert.equal(await promise,'skipped');
    passed++;
  }
  // Keyboard skip path must settle and release the listener.
  run(`GAME.character.classId='guardsman'`);
  const keyboardPromise=run(`playChapterCutscene('rightToMemory')`);
  const keyboardHandler=[...(listeners.get('keydown')||[])][0];
  assert.ok(keyboardHandler,'keyboard listener not installed');
  keyboardHandler({key:'Escape',preventDefault(){}});
  assert.equal(await keyboardPromise,'skipped');
  assert.equal(document.getElementById('chapterCutscene'),null);
  assert.equal(listeners.get('keydown')?.size||0,0);
  passed++;
  // Starting another cutscene replaces the first one without leaking its overlay.
  run(`GAME.character.classId='spaceMarine'`);
  const replacedPromise=run(`playChapterCutscene('lastTransport')`);
  const currentPromise=run(`playChapterCutscene('beyondHive')`);
  assert.equal(await replacedPromise,'replaced');
  assert.ok(document.getElementById('chapterCutscene'));
  document.getElementById('chapterCutscene').children.find(c=>c.className==='cutscene-skip').click();
  assert.equal(await currentPromise,'skipped');
  assert.equal(document.getElementById('chapterCutscene'),null);
  assert.equal(listeners.get('keydown')?.size||0,0);
  passed++;
  // Automatic close path must also settle, remove the overlay and release the listener.
  run(`GAME.character.classId='inquisitor'`);
  const autoPromise=run(`playChapterCutscene('silentForge')`);
  assert.ok(document.getElementById('chapterCutscene'));
  assert.equal(await autoPromise,'finished');
  assert.equal(document.getElementById('chapterCutscene'),null);
  assert.equal(listeners.get('keydown')?.size||0,0);
  passed++;
  console.log(`Cutscene stress: ${passed} scenarios passed; 0 leaked overlays; 0 leaked keyboard listeners.`);
})().catch(err=>{console.error(err);process.exitCode=1;});
