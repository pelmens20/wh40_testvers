/* ============================================================
   SYSTEMS / COMPANIONS.JS — система спутников
   ------------------------------------------------------------
   Лира Доминик идёт с игроком, стреляет в бою, попадает в беду.
   ============================================================ */

function initCompanions(){
  if(!Array.isArray(GAME.companions)) GAME.companions = [];
  // Normalize companions loaded from older saves without resetting their progress.
  GAME.companions = GAME.companions.filter(c => c && c.id && COMPANION_DEFS[c.id]).map(c => {
  const def = COMPANION_DEFS[c.id];
  return {
    ...def, ...c,
    hp: Number.isFinite(c.hp) ? Math.max(0, Math.min(c.maxHp || def.maxHp, c.hp)) : def.hp,
    maxHp: Number.isFinite(c.maxHp) && c.maxHp > 0 ? c.maxHp : def.maxHp,
    wounded: Boolean(c.wounded),
    recoveryTurns: Number.isFinite(c.recoveryTurns) ? Math.max(0, c.recoveryTurns) : 0,
    abilities: Array.isArray(c.abilities) ? c.abilities : [...(def.abilities || [])],
    lines: c.lines && typeof c.lines === "object" ? c.lines : (def.lines || {}),
    utility: Boolean(def.utility),
    passiveBonus: def.passiveBonus && typeof def.passiveBonus === "object"
      ? { ...def.passiveBonus }
      : null
  };
  });
  if(!GAME.dialogueEffectsApplied || typeof GAME.dialogueEffectsApplied !== "object") GAME.dialogueEffectsApplied = {};
}

// The story flag is the source of truth for recruitment; adding is idempotent.
function syncCompanionsFromFlags(){
  if(!GAME.world || !GAME.world.flags) return;
  if(GAME.world.flags.lyraCompanion) addCompanion("Лира Доминик");
}


function addCompanion(id){
  const def = COMPANION_DEFS[id];
  if(!def) return false;
  if(!GAME.companions) GAME.companions = [];
  if(GAME.companions.find(c => c.id === id)) return false;

  GAME.companions.push({
    id,
    name: def.name,
    role: def.role,
    icon: def.icon,
    hp: def.hp,
    maxHp: def.maxHp,
    ac: def.ac,
    die: def.die,
    bonus: def.bonus,
    attack: def.attack,
    ranged: def.ranged,
    abilities: [...(def.abilities || [])],
    wounded: false,
    recoveryTurns: 0,
    lines: def.lines || {},
    utility: Boolean(def.utility),
    passiveBonus: def.passiveBonus && typeof def.passiveBonus === "object"
      ? { ...def.passiveBonus }
      : null
});
  addSystem("СПУТНИК", `${def.name} присоединяется к тебе.`);
  Bus.emit("companion_joined", {id, name: def.name});
  return true;
}

function removeCompanion(id){
  if(!GAME.companions) return;
  GAME.companions = GAME.companions.filter(c => c.id !== id);
}

function getCompanion(id){
  return (GAME.companions || []).find(c => c.id === id);
}

function activeCompanions(){
  return (GAME.companions || []).filter(c => !c.wounded && c.hp > 0);
}

function companionSay(id, key){
  const c = getCompanion(id);
  if(!c || !c.lines[key]) return;
  addSystem(c.name.toUpperCase(), c.lines[key]);
}

function checkCompanionTriggers(){
  syncCompanionsFromFlags();
}

/* ---------- Реакция компаньонов на события ---------- */
function companionsReact(event){
  if(!GAME.companions) return;
  GAME.companions.forEach(c => {
    if(c.wounded) return;
    if(c.hp <= 0) return;
    if(c.lines && c.lines[event]){
      addSystem(c.name.toUpperCase(), c.lines[event]);
    }
  });
}

function companionCombatLines(event){
  companionsReact(event);
}

/* ---------- Бой: ход компаньонов ---------- */
function runCompanionTurns(){
  const co = GAME.combat;
  if(!co) return;
  const list = activeCompanions();
  if(!list.length) return;

  // Утилитарные спутники (сервочереп) не атакуют — они не бойцы
  const combatants = list.filter(c => !c.utility);
  if(!combatants.length) return;

  combatants.forEach(c => {
    let target = co.enemies[co.targetIndex];
    if(!target || target.hp <= 0){
      const next = co.enemies.findIndex(e => e.hp > 0);
      if(next < 0) return;
      co.targetIndex = next;
      target = co.enemies[co.targetIndex];
    }
    if(!target || target.hp <= 0) return;

    const r = rollCheck({
      statScore: 12,
      prof: 2,
      dc: target.ac,
      label: `${c.name}: АТАКА`,
      bonus: c.bonus || 0
    });
    addRoll(formatRoll(r), r.result === "success" ? "entry-success" : "entry-fail");

    if(r.result === "success" || r.result === "critical"){
      let dmg = rollDamage(c.die, c.bonus || 0);
      if(r.result === "critical") dmg += rollDamage(c.die, 0);
      target.hp -= dmg;
      addSystem(c.name.toUpperCase(),
        `${c.name} стреляет. Урон: ${dmg}.\n${target.nameRevealed ? target.name : "Угроза"}: ${Math.max(0, target.hp)}/${target.maxHp}`);
      if(target.hp <= 0){
        addSystem("УСТРАНЁН",
          `${target.nameRevealed ? target.name : "Противник"} выведен из строя.`);
        const next = co.enemies.findIndex(e => e.hp > 0);
        if(next >= 0) co.targetIndex = next;
      }
    } else {
      addSystem(c.name.toUpperCase(), `${c.name} промахивается.`);
    }
  });
}

/* ---------- Урон компаньону ---------- */
function damageCompanion(companion, dmg){
  if(!companion) return;
  companion.hp = Math.max(0, companion.hp - dmg);
  if(companion.hp <= 0){
    woundCompanion(companion.id);
  } else if(dmg >= 4 && companion.lines && companion.lines.self_hurt){
    addSystem(companion.name.toUpperCase(), companion.lines.self_hurt);
  } else if(companion.hp <= companion.maxHp * 0.3 && companion.lines && companion.lines.low_hp){
    addSystem(companion.name.toUpperCase(), companion.lines.low_hp);
  }
}

function woundCompanion(id){
  const c = getCompanion(id);
  if(!c) return;
  c.wounded = true;
  c.recoveryTurns = 3;
  c.hp = 0;
  addSystem("РАНЕНИЕ", `${c.name} тяжело ранена и выходит из боя.`);
  if(c.lines && c.lines.down) addSystem(c.name.toUpperCase(), c.lines.down);
}

function tickCompanionRecovery(){
  if(!GAME.companions) return;
  GAME.companions.forEach(c => {
    if(c.wounded && c.recoveryTurns > 0){
      c.recoveryTurns--;
      if(c.recoveryTurns <= 0){
        c.wounded = false;
        c.hp = Math.max(1, Math.floor(c.maxHp * 0.5));
        addSystem("ВЫЗДОРОВЛЕНИЕ", `${c.name} снова в строю.`);
      }
    }
  });
}

/* ---------- Панель компаньонов ---------- */
function renderCompanionsPanel(){
  const list = GAME.companions || [];
  if(!list.length) return "";

  return `
    <div class="panel" style="margin-top:12px">
      <div class="panel-head">
        <span>СПУТНИКИ</span>
        <span>${list.length}</span>
      </div>
      <div class="panel-body">
        <div class="list">
          ${list.map(c => `
            <div class="list-item companion-card ${c.wounded ? "companion-wounded" : ""}">
              <div class="companion-header">
                <span class="companion-icon">${esc(c.icon)}</span>
                <div class="companion-name">
                  <b>${esc(c.name)}</b>
                  <small>${esc(c.role)}</small>
                </div>
              </div>
              ${c.wounded
                ? `<p style="color:#d98076;">Ранена. Восстановление: ${c.recoveryTurns} сцен.</p>`
                : `
                  <div class="small-row"><span>HP</span><strong>${c.hp}/${c.maxHp}</strong></div>
                  <div class="progress"><i style="width:${Math.max(0, (c.hp/c.maxHp)*100)}%"></i></div>
                  <div class="small-row" style="margin-top:6px"><span>AC</span><strong>${c.ac}</strong></div>
                `
              }
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   БОНУСЫ УТИЛИТАРНЫХ СПУТНИКОВ
   ------------------------------------------------------------
   Сервочереп даёт +2 к INT-проверкам и +1 к AC в бою.
   ============================================================ */

function companionBonus(stat){
  if(!GAME.companions) return 0;
  let total = 0;
  GAME.companions.forEach(c => {
    if(c.wounded) return;                  // раненые не помогают
    if(c.utility && c.passiveBonus && Number.isFinite(c.passiveBonus[stat])){
      total += c.passiveBonus[stat];
    }
  });
  return total;
}
