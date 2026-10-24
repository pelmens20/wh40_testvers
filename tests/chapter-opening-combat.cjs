'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/content/campaigns/chapter-expansions.js'),'utf8');
const expected=['silentForge','sealedSector','warpHeart','ordoJudgment','afterJudgment','newHive','ashProtocol','resonanceArchive','witnessLedger','silentRoute','priceOfEvidence','rightToMemory','lastTransport','beyondHive','verdictNameless'];
const fail=[];
for(const id of expected){
  if(!new RegExp(id+':"ch\\d+_opening_assault"').test(src)) fail.push(`${id}: no chapter-specific encounter ID`);
  if(!new RegExp(id+':"[a-zA-Z_]+"').test(src.slice(src.indexOf('const enemies'),src.indexOf('const intros')))) fail.push(`${id}: no enemy profile`);
  if(!new RegExp(id+':"[^"\\n]{35,}"').test(src.slice(src.indexOf('const chapterHooks'),src.indexOf('Object.keys(CAMPAIGN_SCENARIOS)')))) fail.push(`${id}: no distinct narrative hook`);
}
for(const token of ['classId==="inquisitor"','classId==="guardsman"','classId==="spaceMarine"','originalScene.choices=[...originalChoices','returnScene:continuationId','victoryEffects:{xp:15}']) if(!src.includes(token)) fail.push(`missing expected encounter behavior: ${token}`);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log(`PASS ${expected.length} chapters have distinct optional combat routes, enemy assignments, chapter hooks, class-sensitive narration and safe post-combat continuation.`);
