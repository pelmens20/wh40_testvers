/* ============================================================
   SYSTEMS / TALENTS.JS — логика талантов по веткам
   ============================================================ */

function initTalents() {
  const c = GAME.character;
  if (!c) return;
  if (!Array.isArray(c.talents)) c.talents = [];
  const defaults = {
    interrogation: 0, puritan: 0, scholar: 0,
    marksman: 0, siege: 0, veteran: 0,
    assault: 0, tactics: 0, resilience: 0
  };
  if (!c.branches || typeof c.branches !== "object" || Array.isArray(c.branches)) c.branches = {...defaults};
  else {
    c.branches = {...defaults, ...c.branches};
    for (const key of Object.keys(defaults)) {
      const value = c.branches[key];
      c.branches[key] = Number.isFinite(value) ? Math.max(0, Math.min(3, Math.floor(value))) : 0;
    }
  }
  if (!c._activeUsed || typeof c._activeUsed !== "object" || Array.isArray(c._activeUsed)) c._activeUsed = {};
}

function isTalentAvailable(talent) {
  initTalents();
  const c = GAME.character;
  if (!c || !talent || !talent.id) return false;
  if (c.talents.includes(talent.id)) return false;
  if (c.level < talent.level) return false;

  // НОВОЕ: нельзя взять два таланта одного уровня
  // Проверяем, есть ли уже взятый талант с тем же level
  const alreadyTakenAtLevel = c.talents.some(id => {
    const tree = TALENT_TREES[c.classId];
    if (!tree) return false;
    for (const branch of Object.values(tree.branches)) {
      const node = branch.nodes.find(n => n.id === id);
      if (node && node.level === talent.level) return true;
    }
    return false;
  });

  if (alreadyTakenAtLevel) return false;

  return true;
}

function takeTalent(talentId) {
  const c = GAME.character;
  const tree = TALENT_TREES[c.classId];
  if (!tree) {
    console.warn(`[Talents] Дерево для класса "${c.classId}" не найдено`);
    return false;
  }

  let talent = null;
  let branchKey = null;
  for (const [key, branch] of Object.entries(tree.branches)) {
    const found = branch.nodes.find(n => n.id === talentId);
    if (found) { talent = found; branchKey = key; break; }
  }
  if (!talent) {
    console.warn(`[Talents] Талант "${talentId}" не найден в дереве класса`);
    return false;
  }
  if (!isTalentAvailable(talent)) {
    console.warn(`[Talents] Талант "${talentId}" недоступен (уровень ${c.level}, нужен ${talent.level}, или уже взят)`);
    return false;
  }

  if (talent.type === "passive" && typeof talent.effect === "function") {
    talent.effect(c);
  }

  c.talents.push(talent.id);
    // Убираем уровень из «ожидающих»
  if (c._pendingTalentLevels) {
    c._pendingTalentLevels = c._pendingTalentLevels.filter(lvl => lvl !== talent.level);
  }
  c.branches[branchKey] = (c.branches[branchKey] || 0) + 1;

  addSystem("ТАЛАНТ ПОЛУЧЕН", `${talent.name}\n${talent.desc}`);
  checkBranchSpecialization(branchKey);

  saveGameSilent();
  renderAll();
  return true;
}

function checkBranchSpecialization(branchKey) {
  const c = GAME.character;
  const tree = TALENT_TREES[c.classId];
  const branch = tree.branches[branchKey];
  if (!branch || !branch.specialization) return;

  if (c.branches[branchKey] === 3 && !(c.specializations || []).includes(branch.specialization.id)) {
    c.specializations = c.specializations || [];
    c.specializations.push(branch.specialization.id);
    addSystem("СПЕЦИАЛИЗАЦИЯ",
      `${branch.specialization.name}\n${branch.specialization.desc}`);
  }
}

function getAvailableTalents() {
  initTalents();
  const c = GAME.character;
  if (!c) return [];
  const tree = TALENT_TREES[c.classId];
  if (!tree) return [];

  const available = [];
  for (const [branchKey, branch] of Object.entries(tree.branches)) {
    for (const node of branch.nodes) {
      if (isTalentAvailable(node)) {
        available.push({ ...node, branchKey, branchName: branch.name });
      }
    }
  }
  return available;
}

function talentBonus(key) {
  const c = GAME.character;
  if (!c) return 0;
  const value = c[key];
  return typeof value === "number" ? value : 0;
}

function getActiveTalents() {
  initTalents();
  const c = GAME.character;
  if (!c) return [];
  const tree = TALENT_TREES[c.classId];
  if (!tree) return [];

  const actives = [];
  for (const [branchKey, branch] of Object.entries(tree.branches)) {
    for (const node of branch.nodes) {
      if (node.type === "active" && c.talents.includes(node.id)) {
        actives.push({ ...node, branchKey });
      }
    }
    if (branch.specialization && c.branches[branchKey] >= 3) {
      const spec = branch.specialization;
      if (spec.active) {
        actives.push({
          id: spec.id,
          name: spec.name,
          desc: spec.desc,
          activeId: spec.active,
          isSpecialization: true
        });
      }
    }
  }
  return actives;
}

function resetActiveTalents() {
  const c = GAME.character;
  if (!c) return;
  c._activeUsed = {};
}
