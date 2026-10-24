#!/usr/bin/env node
'use strict';

// Один запуск повторяет функциональные/структурные тесты, проверку ресурсов,
// синтаксиса и реального локального HTTP-лаунчера. Отсутствующая необязательная
// графика отражается диагностикой, а не маскируется под успешную проверку.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const reportPath = path.join(root, 'TEST_RESULTS_RELEASE_2_6.md');
const lines = [
  'WARHAMMER 40,000 SOLO RPG — RELEASE 2.6 QA REPORT',
  `Дата: ${new Date().toISOString()}`,
  `Node: ${process.version}`,
  '',
];
let failures = 0;
let passedSuites = 0;

function runNodeScript(label, relPath) {
  const result = spawnSync(process.execPath, [path.join(root, relPath)], {
    cwd: root, encoding: 'utf8', timeout: 180000, maxBuffer: 10 * 1024 * 1024
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').replaceAll(root, '.').trim();
  const ok = result.status === 0 && !result.error;
  lines.push(`${ok ? 'PASS' : 'FAIL'} — ${label}${result.error ? ` — ${result.error.message}` : ''}`);
  if (output) lines.push(output);
  lines.push('');
  if (ok) passedSuites++; else failures++;
  return ok;
}

function walk(folder, predicate, out = []) {
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.git' || item.name === '__pycache__') continue;
    const full = path.join(folder, item.name);
    if (item.isDirectory()) walk(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

const suites = [
  ['Smoke/regression suite', 'tests/smoke-test.cjs'],
  ['Chapter-specific opening encounters and class-sensitive narration', 'tests/chapter-opening-combat.cjs'],
  ['Scene engine regression: invalid chapters and skipIf order', 'tests/scene-engine-regression.cjs'],
  ['Warhammer 40,000 lore consistency guardrails', 'tests/lore-consistency.cjs'],
  ['Visible artwork, centered sigil, typography and beginner lore onboarding', 'tests/visual-onboarding-regression.cjs'],
  ['Quest progression / reward integrity', 'tests/quest-integrity.cjs'],
  ['Named objective state machine / migration-safe progress', 'tests/quest-objective-integrity.cjs'],
  ['Authored campaign quest-objective coverage', 'tests/quest-objectives-content.cjs'],
  ['Campaign director / class checks / world pressure', 'tests/campaign-director-integrity.cjs'],
  ['Timekeeping / multi-day rollover', 'tests/time-integrity.cjs'],
  ['Campaign graph / all story paths audit', 'tests/full-path-audit.cjs'],
  ['Cutscene coverage audit', 'tests/cutscene-audit.cjs'],
  ['Cutscene stress / overlay and keyboard-listener leaks', 'tests/cutscene-stress.cjs'],
  ['Local script and stylesheet references', 'tests/check-local-references.cjs'],
  ['Complete 126-file asset inventory and catalog behavior', 'tests/asset-coverage.cjs'],
  ['Render all asset-gallery cards against real availability and simulated full import', 'tests/asset-gallery-render.cjs'],
  ['Windows source-asset importer / manifest / report contract', 'tests/asset-importer-contract.cjs'],
  ['Included custom artwork integrity', 'tests/custom-assets-integrity.cjs'],
  ['Local ambient soundtrack assets and routing', 'tests/audio-track-integrity.cjs'],
  ['Asynchronous image-loader regression', 'tests/asset-loader-regression.cjs'],
  ['Offline-only / no remote script and AI dependency check', 'tests/offline-integrity.cjs'],
  ['Image path inventory (diagnostic)', 'tests/check-assets.cjs'],
];
for (const [label, rel] of suites) runNodeScript(label, rel);

const sources = walk(root, file => /\.(?:js|cjs)$/.test(file));
let syntaxFailures = 0;
for (const file of sources) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8', timeout: 15000 });
  if (result.status !== 0 || result.error) {
    syntaxFailures++;
    failures++;
    lines.push(`FAIL — JS syntax: ${path.relative(root, file)}`);
    lines.push((result.stderr || result.stdout || result.error?.message || 'Unknown syntax error').trim());
    lines.push('');
  }
}
if (!syntaxFailures) {
  passedSuites++;
  lines.push(`PASS — JavaScript syntax: ${sources.length} .js/.cjs files passed node --check.`, '');
}

// Python launcher smoke test is part of the release suite if Python is installed.
const pythonCandidates = process.platform === 'win32'
  ? [{ cmd: 'py', prefix: ['-3'] }, { cmd: 'python', prefix: [] }]
  : [{ cmd: 'python3', prefix: [] }, { cmd: 'python', prefix: [] }];
let pythonRan = false;
for (const candidate of pythonCandidates) {
  const probe = spawnSync(candidate.cmd, [...candidate.prefix, '--version'], { encoding: 'utf8', timeout: 5000 });
  if (probe.error || probe.status !== 0) continue;
  const result = spawnSync(candidate.cmd, [...candidate.prefix, path.join(root, 'tests/launcher-smoke.py')], {
    cwd: root, encoding: 'utf8', timeout: 20000, env: { ...process.env, WH40K_NO_BROWSER: '1' }, maxBuffer: 2 * 1024 * 1024
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').replaceAll(root, '.').trim();
  const ok = result.status === 0 && !result.error;
  lines.push(`${ok ? 'PASS' : 'FAIL'} — Local HTTP launcher smoke test`);
  if (output) lines.push(output);
  lines.push('');
  if (ok) passedSuites++; else failures++;
  pythonRan = true;
  break;
}
if (!pythonRan) {
  lines.push('SKIP — Python launcher smoke test (Python 3 is not installed; the game can still be opened via index.html).', '');
}

// Extract the asset inventory from the file the diagnostic test wrote.
const assetReport = path.join(root, 'ASSET_CHECK_REPORT.txt');
if (fs.existsSync(assetReport)) {
  const text = fs.readFileSync(assetReport, 'utf8');
  const found = text.match(/Active files present: (\d+)/);
  const missing = text.match(/Active files missing: (\d+)/);
  const optional = text.match(/Optional art files not supplied in this package: (\d+)/);
  lines.push(`ASSET DIAGNOSTIC — ${found ? found[1] : '?'} active files present, ${missing ? missing[1] : '?'} active files missing; ${optional ? optional[1] : '?'} optional art files not supplied. Optional art uses fallbacks and is not requested by the browser.`, '');
}

lines.push('SUMMARY', `Passing test groups/checks: ${passedSuites}`, `Failures: ${failures}`);
if (failures) lines.push('STATUS: FAILED — fix failed suites before release.');
else lines.push('STATUS: PASS — all executed automated suites passed; review the asset diagnostic, lore matrix, and browser E2E report for environmental/resource limitations.');
fs.writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');
console.log(lines.slice(-6).join('\n'));
console.log(`Full report: ${reportPath}`);
process.exitCode = failures ? 1 : 0;
