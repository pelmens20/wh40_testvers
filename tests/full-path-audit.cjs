#!/usr/bin/env node
'use strict';
const fs=require('node:fs'); const path=require('node:path'); const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scriptPaths=[...html.matchAll(/<script\s+src="([^"]+\.js)"/g)].map(m=>m[1]);
const store=new Map();
const stubElement=()=>({innerHTML:'',value:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},addEventListener(){},click(){},querySelectorAll(){return[]},querySelector(){return null}});
const elements=new Map();
const document={addEventListener(){},querySelectorAll(){return[]},querySelector(){return null},getElementById(id){if(!elements.has(id))elements.set(id,stubElement());return elements.get(id)},createElement(){return stubElement()},body:stubElement()};
const ctx=vm.createContext({console,document,localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},setTimeout(fn){return 1},clearTimeout(){},setInterval(fn){return 1},clearInterval(){},Date,Math,JSON,Object,Array,Set,Map,String,Number,Boolean,RegExp,Error,Promise});
for(const src of scriptPaths){const full=path.join(root,src);if(!fs.existsSync(full))throw new Error(`Missing script: ${src}`);vm.runInContext(fs.readFileSync(full,'utf8'),ctx,{filename:src});}
const data=vm.runInContext(`(() => {
 const result={scenarios:[],auditErrors:auditAll(),totalScenes:0,totalChoices:0,totalEdges:0,totalClassGates:0,totalFlags:0,unreachable:[],brokenTargets:[],classCoverage:[],dynamicTextErrors:[]};
 for(const [id,sc] of Object.entries(CAMPAIGN_SCENARIOS)){
   const seen=new Set(),todo=[sc.startScene,...(sc.externalEntryScenes||[])], edges=[], nodes=Object.entries(sc.scenes||{});
   while(todo.length){const sid=todo.pop();if(seen.has(sid)||!sc.scenes[sid])continue;seen.add(sid);const scene=sc.scenes[sid];
     const add=(from,to,label,kind='choice')=>{if(!to)return;edges.push({from,to,label:label||kind,kind});if(sc.scenes[to])todo.push(to);else if(!['__restart__','__exit','__chapter2__','__chapter3__','__chapter4__','__chapter5__','__chapter6__','__chapter7__','__chapter8__','__chapter9__','__chapter10__','__chapter11__','__chapter12__','__chapter13__','__chapter14__','__chapter15__'].includes(to))result.brokenTargets.push(id+'.'+from+' -> '+to)};
     (scene.choices||[]).forEach((c,i)=>{result.totalChoices++;if(c.requires&&c.requires.classId)result.totalClassGates++;add(sid,c.goto,c.label,'choice#'+(i+1));if(c.onFail)add(sid,c.onFail,(c.label||'choice')+' (провал)','onFail');});
     for(const key of ['onSuccess','onFail','skipTo','returnScene'])if(scene[key])add(sid,scene[key],key,key);
     if(scene.auto&&scene.auto.goto)add(sid,scene.auto.goto,'auto.goto','auto');
     (scene.dynamicTargets||[]).forEach(t=>add(sid,t,'динамический переход','dynamic'));
   }
   const missing=nodes.map(([sid])=>sid).filter(sid=>!seen.has(sid));
   result.unreachable.push(...missing.map(sid=>id+'.'+sid));
   const allEdges=edges.length; result.totalEdges+=allEdges; result.totalScenes+=nodes.length;
   const endings=nodes.filter(([sid,scene])=>scene.effects?.ending || scene.effects?.flag?.campaignComplete===true || ((scene.choices||[]).length===0 && (scene.dynamicTargets||[]).length===0)).map(([sid,scene])=>({id:sid,title:scene.title||sid}));
   const classOptions={inquisitor:[],guardsman:[],spaceMarine:[]};
   for(const [sid,scene] of nodes)for(const c of scene.choices||[])if(c.requires&&classOptions[c.requires.classId])classOptions[c.requires.classId].push(sid+': '+c.label);
   result.classCoverage.push({scenario:id,...Object.fromEntries(Object.entries(classOptions).map(([k,v])=>[k,v.length]))});
   const choiceRows=nodes.map(([sid,scene])=>{
     let classTexts=null;
     if(typeof scene.text==='function'){
       classTexts={};
       for(const cls of ['inquisitor','guardsman','spaceMarine']){
         try {
           const sampleCharacter=createCharacter({name:'Аудит текста',classId:cls});
           const sample={...GAME,started:true,character:sampleCharacter,world:{...GAME.world,flags:{},heat:0,clues:0,day:1,investigation:{evidence:[],deductions:{},history:[]}},campaign:{active:true,scenarioId:id,sceneId:sid,stack:[sid],pendingCombat:null},quests:{},npcs:{},companions:[],dialogueEffectsApplied:{}};
           const rendered=scene.text(sample);
           classTexts[cls]=typeof rendered==='string'?rendered:String(rendered ?? '[Текст не возвращён]');
           if(!classTexts[cls] || /\b(undefined|null)\b/.test(classTexts[cls])) result.dynamicTextErrors.push({scenario:id,scene:sid,classId:cls,issue:'пустой текст или литералы undefined/null',sample:classTexts[cls].slice(0,180)});
         } catch(e) {
           classTexts[cls]='[Не удалось вычислить на тестовом состоянии: '+e.message+']';
           result.dynamicTextErrors.push({scenario:id,scene:sid,classId:cls,issue:e.message});
         }
       }
     }
     return {id:sid,title:scene.title||sid,text:typeof scene.text==='string'?scene.text:'[Динамический текст — ниже примеры для классов при нейтральном тестовом состоянии]',classTexts,textFunctionSource:typeof scene.text==='function'?scene.text.toString():null,sceneProps:Object.fromEntries(Object.entries(scene).filter(([k,v])=>!['text','choices'].includes(k)&&typeof v!=='function')),sceneHooks:Object.fromEntries(Object.entries(scene).filter(([k,v])=>typeof v==='function'&&k!=='text').map(([k,v])=>[k,v.toString()])),choices:(scene.choices||[]).map((c,i)=>({n:i+1,label:c.label||'(без подписи)',goto:c.goto||null,meta:Object.fromEntries(Object.entries(c).filter(([k,v])=>!['label','goto'].includes(k)&&typeof v!=='function')),hooks:Object.fromEntries(Object.entries(c).filter(([k,v])=>typeof v==='function').map(([k,v])=>[k,v.toString()]))})),dynamicTargets:scene.dynamicTargets||[],terminal:!!scene.effects?.ending||scene.effects?.flag?.campaignComplete===true};
   });
   result.scenarios.push({id,title:sc.title||id,startScene:sc.startScene,externalEntryScenes:sc.externalEntryScenes||[],sceneCount:nodes.length,reachable:seen.size,choiceCount:nodes.reduce((n,[,s])=>n+(s.choices||[]).length,0),edges:allEdges,endings,choiceRows});
 }
 result.totalFlags=Object.keys(FLAG_REGISTRY||{}).length;
 return result;
})()`,ctx);
const plain=JSON.parse(JSON.stringify(data));
if(plain.auditErrors.length||plain.unreachable.length||plain.brokenTargets.length){
 console.error('PATH AUDIT FAILED');console.error(JSON.stringify({auditErrors:plain.auditErrors,unreachable:plain.unreachable,brokenTargets:plain.brokenTargets},null,2));process.exitCode=1;
}
const lines=[];lines.push('# Полный аудит сюжетных путей — Warhammer 40,000 Solo RPG, релиз 2.0','',`Дата: ${new Date().toISOString().slice(0,10)}`,'','## Сводка','',`- Сценариев: **${plain.scenarios.length}**`,`- Сцен: **${plain.totalScenes}**`,`- Кнопочных вариантов выбора: **${plain.totalChoices}**`,`- Проверенных рёбер переходов, включая провал проверки и динамические переходы: **${plain.totalEdges}**`,`- Классовых ограничений: **${plain.totalClassGates}**`,`- Зарегистрированных сюжетных флагов: **${plain.totalFlags}**`,`- Ошибки структурного аудита: **${plain.auditErrors.length}**`,`- Недостижимые сцены: **${plain.unreachable.length}**`,`- Сломанные цели переходов: **${plain.brokenTargets.length}**`,`- Динамических текстовых вариантов проверено: **${plain.scenarios.reduce((sum,sc)=>sum+sc.choiceRows.filter(n=>n.classTexts).length*3,0)}**`,`- Ошибки вычисления динамического текста: **${plain.dynamicTextErrors.length}**`,'','> Метод: статический обход всех объявленных кнопок, условий провала, специальных переходов и явно задекларированных динамических целей. Для динамических сцен включены тестовые рендеры на нейтральном состоянии для каждого класса и полный исходник функции текста, поэтому условные текстовые ветви по флагам можно проверить, а не только увидеть нейтральный результат. Циклические сцены учитываются как граф, а не разворачиваются в бесконечные повторные маршруты. Это покрытие всех объявленных ветвей, но не замена ручному прохождению каждого возможного сочетания скрытых состояний.','');
lines.push('## Покрытие классов','', '| Кампания | Инквизитор | Гвардеец | Космодесантник |','|---|---:|---:|---:|');for(const c of plain.classCoverage)lines.push(`| ${c.scenario} | ${c.inquisitor} | ${c.guardsman} | ${c.spaceMarine} |`);
lines.push('','## Все сценарии, весь доступный текст и все варианты действий','');
for(const sc of plain.scenarios){lines.push(`### ${sc.title} (${sc.id})`,'',`Старт: ${sc.startScene}. Сцен: ${sc.sceneCount}; выборов: ${sc.choiceCount}; проверенных переходов: ${sc.edges}.`);if(sc.externalEntryScenes.length)lines.push(`Внешние точки входа: ${sc.externalEntryScenes.join(', ')}.`);lines.push('','**Финалы/узлы завершения:**',...(sc.endings.length?sc.endings.map(e=>`- ${e.title} (${e.id})`):['- Явный финал не размечен.']),'');for(const node of sc.choiceRows){lines.push(`#### ${node.title} — ${node.id}`,'',node.text,'');if(node.classTexts){for(const [cls,txt] of Object.entries(node.classTexts))lines.push(`**Текст для ${cls}:** ${txt}`,'');}if(node.textFunctionSource){lines.push('**Исходник условного текста (все ветви по сюжетным флагам):**','','```javascript',node.textFunctionSource,'```','');}if(Object.keys(node.sceneProps).length){lines.push('**Полные данные сцены (условия, эффекты, проверки, авто-переходы и иные поля):**','','```json',JSON.stringify(node.sceneProps,null,2),'```','');}if(Object.keys(node.sceneHooks).length){lines.push('**Дополнительные обработчики сцены:**');for(const [hook,src] of Object.entries(node.sceneHooks))lines.push(`- ${hook}:`,'','```javascript',src,'```','');}if(node.choices.length){lines.push('Варианты:');for(const c of node.choices){const to=c.goto?` → ${c.goto}`:' → (нет прямого goto)';const req=c.meta.requires?` [условие: ${JSON.stringify(c.meta.requires)}]`:'';const check=c.meta.check?` [проверка: ${JSON.stringify(c.meta.check)}]`:'';const fail=c.meta.onFail?` [провал → ${c.meta.onFail}]`:'';lines.push(`${c.n}. **${c.label}**${to}${req}${check}${fail}`);if(Object.keys(c.meta).length)lines.push(`   - Полные метаданные выбора: ${JSON.stringify(c.meta)}`);if(Object.keys(c.hooks).length){for(const [hook,src] of Object.entries(c.hooks))lines.push(`   - Обработчик ${hook}:`,'','```javascript',src,'```');}}lines.push('');}if(node.dynamicTargets.length)lines.push(`Динамические переходы: ${node.dynamicTargets.join(', ')}.`,'');}}
if(plain.dynamicTextErrors.length){lines.push('## Ошибки вычисления динамического текста','','| Сценарий | Сцена | Класс | Ошибка/аномалия |','|---|---|---|---|');for(const e of plain.dynamicTextErrors)lines.push(`| ${e.scenario} | ${e.scene} | ${e.classId} | ${String(e.issue).replaceAll('|','\\|')} |`);lines.push('');}
lines.push('## Результат','',plain.auditErrors.length||plain.unreachable.length||plain.brokenTargets.length?'**ПРОВАЛ:** см. списки ошибок в stdout и исправь перед релизом.':'**PASS:** все объявленные сцены достижимы через основные или задекларированные внешние входы; все переходы проходят структурную проверку. Динамические тексты вычислены для всех трёх классов на нейтральном тестовом состоянии; см. ограничения метода.','');
const out=path.join(root,'FULL_PATH_AND_BRANCH_AUDIT.md');fs.writeFileSync(out,lines.join('\n'),'utf8');
console.log(`Scenarios=${plain.scenarios.length}; scenes=${plain.totalScenes}; choices=${plain.totalChoices}; edges=${plain.totalEdges}; classGates=${plain.totalClassGates}; auditErrors=${plain.auditErrors.length}; unreachable=${plain.unreachable.length}; brokenTargets=${plain.brokenTargets.length}; dynamicTextErrors=${plain.dynamicTextErrors.length}`);
console.log(`Report: ${out}`);
if(process.exitCode)process.exit(process.exitCode);
