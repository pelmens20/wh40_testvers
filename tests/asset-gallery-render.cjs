#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'tools/assets-inventory.json'), 'utf8'));
const panels = fs.readFileSync(path.join(root, 'js/ui/panels.js'), 'utf8');
const start = panels.indexOf('function renderAssetArchive(){');
const end = panels.indexOf('\n/* ============================================================\n   КОДЕКС — единая карточка', start);
assert.ok(start >= 0 && end > start, 'asset archive renderer must be present and bounded');
const renderer = panels.slice(start, end);
const availability = new Set(inventory.files.filter(x => fs.existsSync(path.join(root, x.path))).map(x => x.path));
const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const stats = () => ({ expected: inventory.files.length, images: inventory.files.filter(x => x.type === 'image').length, audio: inventory.files.filter(x => x.type === 'audio').length, available: inventory.files.filter(x => availability.has(x.path)).length, missing: inventory.files.filter(x => !availability.has(x.path)).length });
function render(category='all', query='', useFullInventory=false) {
  const currentAvailability = useFullInventory ? new Set(inventory.files.map(x=>x.path)) : availability;
  const sandbox = { ASSET_INVENTORY: inventory.files, GAME: { _assetArchiveCategory: category, _assetArchiveQuery: query }, window: { ASSET_AVAILABLE_FILES: currentAvailability, ASSET_IMPORT_STATUS: { source: 'test', copiedFromSource: 0, missing: inventory.files.length - currentAvailability.size } }, assetInventoryStats: () => ({ expected: inventory.files.length, images: inventory.imageCount, audio: inventory.audioCount, available: currentAvailability.size, missing: inventory.files.length - currentAvailability.size }), esc, Set, Array, String, Number, Object };
  vm.createContext(sandbox);
  vm.runInContext(`${renderer}\nthis.__rendered = renderAssetArchive();`, sandbox, { timeout: 1000 });
  return sandbox.__rendered;
}
const all = render();
assert.equal((all.match(/data-asset-record=/g)||[]).length, 126, 'rendered archive must show all 126 records');
for (const entry of inventory.files) assert.ok(all.includes(`data-asset-record="${entry.path}"`), `visible archive card absent for ${entry.path}`);
for (const entry of inventory.files) {
  if (availability.has(entry.path)) assert.ok(all.includes(`src="${entry.path}"`), `available media should have a real src: ${entry.path}`);
  else assert.ok(!all.includes(`src="${entry.path}"`), `missing media must not generate a dead request: ${entry.path}`);
}
const audio = render('audio');
assert.equal((audio.match(/data-asset-record=/g)||[]).length, 5, 'audio category should show five tracks');
assert.equal((audio.match(/<audio controls preload="none"/g)||[]).length, availability.has('assets/audio/imperial-archive.ogg') ? inventory.files.filter(x=>x.type==='audio' && availability.has(x.path)).length : 0, 'only available tracks should have playable audio elements');
const backgrounds = render('backgrounds');
assert.equal((backgrounds.match(/data-asset-record=/g)||[]).length, inventory.files.filter(x=>x.category==='backgrounds').length, 'background filter count');
const search = render('all', 'тзинч');
assert.equal((search.match(/data-asset-record=/g)||[]).length, 1, 'search should narrow to one matching lore asset');
assert.ok(search.includes('assets/chaos-gods/tzeentch.png'), 'search result should show correct asset');
const simulatedFull = render('all', '', true);
assert.equal((simulatedFull.match(/<img data-asset-img/g)||[]).length, 121, 'with a successful full Windows asset import, each image gets an actual image element');
assert.equal((simulatedFull.match(/<audio controls preload="none"/g)||[]).length, 5, 'with a full import, each audio file gets a playable element');
const ordosSource = panels.slice(panels.indexOf('function renderCodexInquisition(){'), panels.indexOf('/* ============================================================\n   КОДЕКС — Боги Хаоса', panels.indexOf('function renderCodexInquisition(){')));
assert.ok(ordosSource.includes('function renderCodexInquisition(){'), 'Codex must contain dedicated Ordos page');
assert.match(panels, /inquisition:\s*\{ title: \"ОРДО ИНКВИЗИЦИИ\", custom: \"inquisition\" \}/, 'the Ordos tab must be registered in Codex route dispatch');
const codexSandbox = {getAsset:(category,key)=>({ 'ordo-hereticus':'assets/inquisition/ordo-hereticus.png', 'ordo-malleus':'assets/inquisition/ordo-malleus.png', 'ordo-xenos':'assets/inquisition/ordo-xenos.png' }[key] || null), esc};
vm.createContext(codexSandbox);
vm.runInContext(`${ordosSource}\nthis.__ordos = renderCodexInquisition();`, codexSandbox, {timeout:1000});
assert.equal((codexSandbox.__ordos.match(/<img class=\"codex-card-img/g)||[]).length, 3, 'all three Ordo badges should have dedicated Codex image cards');
assert.ok(codexSandbox.__ordos.includes('Ордо Херетикус') && codexSandbox.__ordos.includes('Ордо Маллеус') && codexSandbox.__ordos.includes('Ордо Ксенос'), 'all main Ordos should be represented');
console.log(`PASS dynamic gallery rendering: all 126 records rendered; ${availability.size} local media files get real src elements, missing user-owned files avoid dead requests.`);
console.log('PASS simulated full import: 121 image elements + 5 playable OGG tracks.');
console.log('PASS category filters, Russian search and three Ordo Codex image cards.');
