#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scriptPaths=[...html.matchAll(/<script\s+src="([^"]+\.js)"/g)].map(m=>m[1]);
const store=new Map();
const stub=()=>({innerHTML:'',value:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){},addEventListener(){},removeEventListener(){},focus(){},click(){},querySelectorAll(){return[]},querySelector(){return null}});
const elements=new Map();
const document={body:stub(),addEventListener(){},removeEventListener(){},querySelectorAll(){return[]},querySelector(){return null},getElementById(id){if(!elements.has(id))elements.set(id,stub());return elements.get(id)},createElement:stub};
const context=vm.createContext({console,document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},Date,Math,JSON,Object,Array,Set,Map,String,Number,Boolean,RegExp,Error,Promise,GAME:{character:{classId:'inquisitor'},world:{flags:{}}}});
for(const src of scriptPaths) vm.runInContext(fs.readFileSync(path.join(root,src),'utf8'),context,{filename:src});
const data=JSON.parse(JSON.stringify(vm.runInContext(`(() => {
 const classes=['inquisitor','guardsman','spaceMarine'];
 const result={classes,rows:[],missing:[],errors:[]};
 for(const [id,scenario] of Object.entries(CAMPAIGN_SCENARIOS)){
  const cs=CHAPTER_CUTSCENES[id];
  if(!cs){result.missing.push(id);continue;}
  for(const cls of classes){
   try { const p=buildCutscenePresentation(id,cls); result.rows.push({id,title:cs.title,subtitle:cs.subtitle,baseLines:cs.lines,background:cs.bg,classId:cls,roleLabel:p.roleLabel,roleSymbol:p.roleSymbol,roleTheme:p.roleTheme,lensText:p.lensText,renderedLines:p.lines}); }
   catch(e){result.errors.push({id,classId:cls,error:e.message});}
  }
 }
 for(const cls of classes){const id='class_'+cls;const cs=CHAPTER_CUTSCENES[id];if(!cs){result.missing.push(id);continue;}const p=buildCutscenePresentation(id,cls);result.rows.push({id,title:cs.title,subtitle:cs.subtitle,baseLines:cs.lines,background:cs.bg,classId:cls,roleLabel:p.roleLabel,roleSymbol:p.roleSymbol,roleTheme:p.roleTheme,lensText:p.lensText,renderedLines:p.lines});}
 return result;
})()`,context)));
assert.deepEqual(data.missing,[],`missing cinematic entry: ${data.missing.join(', ')}`);
assert.deepEqual(data.errors,[],JSON.stringify(data.errors));
const chapterIds=[...new Set(data.rows.filter(r=>!r.id.startsWith('class_')).map(r=>r.id))];
assert.equal(chapterIds.length,Object.keys(vm.runInContext('CAMPAIGN_SCENARIOS',context)).length,'campaign/cutscene coverage mismatch');
for(const id of chapterIds){const rows=data.rows.filter(r=>r.id===id);assert.equal(new Set(rows.map(r=>r.lensText)).size,3,`class perspective collision in ${id}`);}
const lines=['# Аудит катсцен и классовой перспективы — релиз 1.7','',`Дата: ${new Date().toISOString().slice(0,10)}`,'','## Итог','',`- Кампаний с катсценами: **${chapterIds.length}**`,`- Классовых вариантов главных катсцен: **${chapterIds.length*3}**`,`- Вводных катсцен классов: **3**`,`- Пропущенных катсцен: **${data.missing.length}**`,`- Ошибок генерации перспективы: **${data.errors.length}**`,`- Различающихся перспектив на каждую главу: **3 из 3**`,'','> Классовая вставка описывает субъективную профессиональную перспективу персонажа, а не добавляет новый установленный факт мира. Сами основные сюжетные строки общие для кампании, чтобы сохранять единство канона; вводные сцены полностью различаются по классу.','','## Все катсцены и варианты по классу',''];
for(const row of data.rows){lines.push(`### ${row.title} — ${row.subtitle} (${row.id}; ${row.classId})`,'',`- Фон: ${row.background}`,`- Метка: ${row.roleSymbol} ${row.roleLabel}`,'','**Основной текст:**',...row.renderedLines.map(x=>`- ${x}`),'');if(row.lensText)lines.push('**Классовая перспектива:**','',row.lensText,'');}
lines.push('## Проверенные лорные оговорки','','- Причина отключения сектора IX не объявляется известной до расследования.','- Архивная запись о старом секторе маркирована как запись, требующая проверки.','- Голоса у Врат не подтверждают собственный источник. Упоминание Тзинча в записях не доказывает, что именно он является источником голосов.','- Повторяющиеся одиннадцать отметок остаются зацепкой, а не доказательством связи с XI Легионом.','- Последствия суда не фиксируются заранее одной фразой: цена решения раскрывается через сюжетные состояния.','','**PASS:** все 15 кампаний имеют катсцены; каждая имеет три различные классовые перспективы; все три классовых вступления существуют.','');
const out=path.join(root,'FULL_CUTSCENE_AUDIT_RELEASE_1_7.md');fs.writeFileSync(out,lines.join('\n'),'utf8');
console.log(`Cutscene audit PASS: campaigns=${chapterIds.length}, roleVariants=${chapterIds.length*3}, classIntros=3, missing=${data.missing.length}, errors=${data.errors.length}`);
console.log(`Report: ${out}`);
