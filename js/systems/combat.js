/* ============================================================
   SYSTEMS / COMBAT.JS — бой с несколькими врагами
   ============================================================ */

const ENEMY_TACTICS = {
  cultist: { id:"skirmisher", title:"Непредсказуемый боец", description:"Может менять цель и искать уязвимого противника.", companionChance:0.38 },
  cult_leader: { id:"controller", title:"Координатор", description:"Старается сохранять контроль над столкновением.", companionChance:0.12 },
  horror_pink: { id:"warp", title:"Демон с нестабильной формой", description:"Форма и природа угрозы требуют анализа; не делай выводов по одному наблюдению.", companionChance:0.2 },
  horror_blue: { id:"skirmisher", title:"Быстрый налётчик", description:"Полагается на скорость и короткие атаки.", companionChance:0.35 },
  flamer_tzeentch: { id:"marksman", title:"Дальняя огневая угроза", description:"Дистанционная атака может частично обходить укрытие.", companionChance:0.05, piercesCover:true },
  screamer: { id:"flanker", title:"Мобильный налётчик", description:"На чётных раундах может найти угол в обычном укрытии.", companionChance:0.4, flanksCover:true },
  heretic_marine: { id:"brute", title:"Тяжёлый штурмовик", description:"Давит фронтально и представляет прямую угрозу.", companionChance:0.12 },
  renegade: { id:"flanker", title:"Полевой обходчик", description:"На чётных раундах может найти угол в обычном укрытии.", companionChance:0.35, flanksCover:true },
  pdf: { id:"marksman", title:"Стрелок отделения", description:"Держит линию огня и может частично обходить укрытие.", companionChance:0.2, piercesCover:true },
  servitor: { id:"marksman", title:"Автоматизированная огневая платформа", description:"Держит цель по машинному шаблону и частично игнорирует укрытие.", companionChance:0.05, piercesCover:true }
};
function getEnemyTactics(type){
  const profile = ENEMY_TACTICS[type] || {id:"standard",title:"Неизвестный боевой профиль",description:"Тактика ещё не установлена.",companionChance:0.3};
  return {...profile};
}

function startCombat(enemyTypes){
  if (typeof setSoundContext === "function") setSoundContext("combat");
  if (typeof playSound === "function") playSound("combat");
  const list = Array.isArray(enemyTypes) ? enemyTypes : [enemyTypes];

  // Фильтруем — оставляем только существующих врагов
  const valid = list.filter(t => {
    if(!ENEMIES[t]){
      console.warn(`[Combat] Неизвестный враг: "${t}". Пропускаем.`);
      return false;
    }
    return true;
  });

  if(!valid.length){
    addSystem("ОШИБКА", "Нет противников для боя.");
    return;
  }

  GAME.combat = {
    enemies: valid.map(t => createEnemy(t)),
    targetIndex: 0,
    turn: "player",
    defending: false,
    aimed: false,
    inCover: false,
    round: 1,
    weaponSlot: "ranged",
    playerInit: 0,
    enemyInit: 0
  };
  GAME.mode = "combat";
    // Фиксируем встречу с врагами — для Бестиария
  if (!GAME.world.seenEnemies) GAME.world.seenEnemies = {};
  valid.forEach(type => {
    GAME.world.seenEnemies[type] = true;
  });

  const initP = RNG.die(20) + GAME.character.initiative;
  const initE = RNG.die(20) + Math.max(...GAME.combat.enemies.map(e => e.attack));
  GAME.combat.playerInit = initP;
  GAME.combat.enemyInit  = initE;

  Bus.emit("combat_started", {enemies: list, initP, initE});

  addSystem("БОЕВОЕ СТОЛКНОВЕНИЕ",
    `Угроз: ${list.length}\nИнициатива: ${initP} против ${initE}`);

  // Реплика компаньонов при начале боя — ПОСЛЕ сообщения
  if(typeof companionsReact === "function") companionsReact("combat_start");

  if(initP < initE) runEnemyTurns(true);
  renderAll();
}

function createEnemy(type){
  const e = ENEMIES[type];
  if(!e){
    console.error(`[Combat] createEnemy: враг "${type}" не найден`);
    return null;
  }
  return {
    type,
    faction: e.faction || "Unknown",
    hp: e.hp, maxHp: e.maxHp, ac: e.ac,
    dmg: e.dmg, die: e.die, attack: e.attack, xp: e.xp, loot: [...e.loot],
    weaknesses: [...(e.weaknesses||[])],
    resistances: [...(e.resistances||[])],
    analysisDc: e.analysisDc || 12,
    name: e.name,
    desc: e.desc || "",
    tactics: getEnemyTactics(type),
    identified: false,
    nameRevealed: false,
    hasAttacked: false
  };
}

/* ---------- Анализ противника ---------- */
function analyzeEnemy(){
  const co = GAME.combat;
  if(!co) return;
  const target = co.enemies[co.targetIndex];
  if(!target) return;
  if(target.identified){
    addSystem("АНАЛИЗ", `${target.name} уже полностью изучен.`);
    renderAll();
    return;
  }

  const r = checkStat("int", target.analysisDc, {
    label: `АНАЛИЗ (${target.nameRevealed ? target.name : "неизвестная угроза"})`
  });

  playRoll(r).then(() => {
    addRoll(formatRoll(r), rollClass(r.result));
    if(r.result === "success" || r.result === "critical"){
      target.identified = true;
      target.nameRevealed = true;
      addSystem("ДАННЫЕ РАСКРЫТЫ",
        `${target.name}\nHP: ${target.hp}/${target.maxHp}\nAC: ${target.ac}\n${target.desc}\nСлабости: ${target.weaknesses.join(", ") || "не обнаружены"}\nСопротивления: ${target.resistances.join(", ") || "не обнаружены"}`);
    } else {
      addSystem("АНАЛИЗ", "Недостаточно данных.");
    }
    advanceTime(3);
    runEnemyTurns();
    renderAll();
  });
}

/* ---------- Тактические действия ---------- */
function combatAim(){
  const co=GAME.combat, c=GAME.character;
  if(!co || !c) return;
  if(co.weaponSlot !== "ranged"){
    addSystem("ПРИЦЕЛИВАНИЕ","Прицеливание доступно только со стрелковым оружием.");
    renderAll(); return;
  }
  const weapon=getCurrentWeapon("ranged");
  if(!weapon || (c.ammo?.[weapon.ammoType]||0)<=0){
    addSystem("ПРИЦЕЛИВАНИЕ","Для прицельного выстрела нужно исправное стрелковое оружие и боеприпасы.");
    renderAll(); return;
  }
  co.aimed=true;
  addSystem("ПРИЦЕЛИВАНИЕ","Ты тратишь действие на стабилизацию оружия. Следующая стрельба получает +2 к проверке атаки; бонус не складывается при повторном прицеливании.");
  afterPlayerCombatAction();
  if(typeof saveGameSilent==="function") saveGameSilent();
  renderAll();
}

function combatTakeCover(){
  const co=GAME.combat;
  if(!co) return;
  co.inCover=true;
  addCondition("Прикрытие");
  addSystem("ТАКТИЧЕСКОЕ УКРЫТИЕ","Ты используешь доступное укрытие. До завершения следующего хода противников получаешь +2 к защите; укрытие не помогает спутнику, если враг выбирает его целью.");
  afterPlayerCombatAction();
  if(typeof saveGameSilent==="function") saveGameSilent();
  renderAll();
}

/* ---------- Смена слота ---------- */
function switchWeaponSlot(slot){
  const co = GAME.combat;
  if(!co) return;
  co.weaponSlot = slot;
  addSystem("СМЕНА ОРУЖИЯ", `Активен слот: ${WEAPON_CATEGORIES[slot]}`);
  renderAll();
}

/* ---------- После действия игрока: спутники, потом враги ---------- */
function afterPlayerCombatAction(){
  // Recovery advances on scene transitions only, not on every combat action.
  if(GAME.combat && GAME.combat.enemies.every(e => e.hp <= 0)){
    return endCombat(true);
  }
  if(typeof runCompanionTurns === "function") runCompanionTurns();
  if(GAME.combat && GAME.combat.enemies.every(e => e.hp <= 0)){
    return endCombat(true);
  }
  runEnemyTurns();
}

/* ---------- Атака ---------- */
function combatAttack(){
  const c = GAME.character, co = GAME.combat;
  if(!co) return;

  // Проверка формата боя — ДО списания ресурсов
  if(!co.enemies || !Array.isArray(co.enemies)){
    addSystem("ОШИБКА", "Формат боя не поддерживается.");
    GAME.combat = null;
    GAME.mode = "explore";
    renderAll(); return;
  }

  const slot = co.weaponSlot;
  const weapon = getCurrentWeapon(slot);
  if(!weapon){
    addSystem("ОРУЖИЕ","Нет оружия в этом слоте.");
    renderAll(); return;
  }

  // Misfires and plasma overheating are explicit action costs, not permanent softlocks.
  if(slot === "ranged" && c.weapon === "Плазмаган" && hasCondition("Перегрев")){
    removeCondition("Перегрев");
    addSystem("ОХЛАЖДЕНИЕ", "Ты тратишь действие на охлаждение плазмагана. Выстрел не произведён, боеприпас не потрачен.");
    afterPlayerCombatAction(); renderAll(); saveGameSilent(); return;
  }
  if(slot === "ranged" && hasCondition("Заклинивание")){
    removeCondition("Заклинивание");
    addSystem("НЕИСПРАВНОСТЬ УСТРАНЕНА", "Ты тратишь действие на очистку механизма. Выстрел не произведён, боеприпас не потрачен.");
    afterPlayerCombatAction(); renderAll(); saveGameSilent(); return;
  }

  const isAreaGrenade = slot === "grenade" &&
    (weapon.name === "Осколочная граната" || weapon.name === "Дымовая граната");
  const target = co.enemies[co.targetIndex];
  // Проверяем цель до расходования патронов/гранат. Площадные гранаты цели не требуют.
  if(!isAreaGrenade && (!target || target.hp <= 0)){
    addSystem("ЦЕЛЬ", "У этой цели нет HP. Выбери другую.");
    renderAll(); return;
  }

  if(slot === "ranged"){
    const key = weapon.ammoType;
    if((c.ammo[key]||0) <= 0){
      addSystem("ПУСТО","Патронов не осталось.");
      renderAll(); return;
    }
    c.ammo[key]--;
  }
  if(slot === "grenade"){
    if(!c.grenades || (c.grenades[weapon.name]||0) <= 0){
      addSystem("ГРАНАТ","Этих гранат больше нет.");
      renderAll(); return;
    }
    c.grenades[weapon.name]--;
  }

  if(slot === "grenade" && weapon.name === "Осколочная граната") return throwFragGrenade(weapon);
  if(slot === "grenade" && weapon.name === "Дымовая граната")    return throwSmokeGrenade(weapon);
  // Бонус от Ярости Императора
  const wrathAtkBonus = c._wrathBonus || 0;
  const aimBonus = slot === "ranged" && co.aimed ? 2 : 0;
  const doctrineCombatBonus = typeof getDoctrineCombatBonus === "function" ? getDoctrineCombatBonus(slot) : 0;
  const bonus = (weapon.bonus || 0) + wrathAtkBonus + aimBonus + doctrineCombatBonus;
  // Aim applies to a single ranged attack; it cannot be banked indefinitely.
  if(slot === "ranged" && co.aimed) co.aimed = false;
  
  const attackStat = slot === "melee" ? "str" : "dex";
  const r = checkStat(attackStat, target.ac, {label:`АТАКА (${slot})`, bonus});

  playRoll(r).then(() => {
    addRoll(formatRoll(r), rollClass(r.result));
        // Звук при атаке
    if (r.result === "critical") {
      if (typeof playSound === "function") playSound("crit");
    } else if (r.result === "success") {
      if (typeof playSound === "function") playSound("hit");
    }

    if(r.result === "success" || r.result === "critical"){
      let dmg = rollDamage(weapon.die, weapon.bonus || 0);
      if(r.result === "critical") dmg += rollDamage(weapon.die, 0);
      if(slot === "ranged") dmg += talentBonus("_rangedDamageBonus");
      if(slot === "melee")  dmg += talentBonus("_meleeBonus") + Math.max(0, modifier(c.stats.str));
      // The identified enemy's listed weaknesses/resistances are tactical clues, not hidden omniscience.
      if(target.identified && target.weaknesses.includes("Тяжёлое оружие") && ["Болтер","Плазмаган","Крак-граната"].includes(weapon.name)) dmg += 2;
      if(target.identified && target.resistances.includes("Обычное оружие") && ["Лазган","Лазпистолет","Штурмовая винтовка"].includes(weapon.name)) dmg = Math.max(1,dmg-2);
            // Ярость Императора — +1d6 урона
      if (c._wrathActive > 0) {
        const wrathDmg = RNG.die(6);
        dmg += wrathDmg;
        addSystem("ЯРОСТЬ", `+${wrathDmg} урона от транса.`);
      }
      target.hp -= dmg;
      addSystem("ПОПАДАНИЕ",
        `Урон: ${dmg}\n${target.nameRevealed ? target.name : "Угроза"}: ${Math.max(0,target.hp)}/${target.maxHp}`);
      if(target.hp <= 0){
        addSystem("УСТРАНЁН",
          `${target.nameRevealed ? target.name : "Противник"} выведен из строя.`);
        const next = co.enemies.findIndex(e => e.hp > 0);
        if(next >= 0) co.targetIndex = next;
      }
    } else if(r.result === "critical_fail"){
      if(slot === "ranged" && c.weapon === "Плазмаган"){
        addCondition("Перегрев");
        addSystem("ПЕРЕГРЕВ", "Плазмаган перегрелся. До следующей стрельбы потребуется потратить действие на охлаждение; боеприпас уже израсходован.");
      } else if(slot === "ranged") {
        addCondition("Заклинивание");
        addSystem("ОСЛОЖНЕНИЕ","Стрелковое оружие заклинило. Для восстановления потребуется отдельное действие.");
      } else {
        addSystem("ОСЛОЖНЕНИЕ", "Неудачное движение лишило тебя возможности атаковать в этот ход.");
      }
    } else {
      addSystem("ПРОМАХ","Атака не достигает цели.");
    }

    if(co.enemies.every(e => e.hp <= 0)) return endCombat(true);

    afterPlayerCombatAction();
    renderAll();
    saveGameSilent();
  });
}

function throwFragGrenade(weapon){
  const co = GAME.combat;
  if(!co) return;   // бой уже закончился
  const r = checkStat("dex", 12, {label:"БРОСОК ГРАНАТЫ"});
  playRoll(r).then(() => {
    addRoll(formatRoll(r), rollClass(r.result));
    if(!GAME.combat) return;   // бой мог закончиться за время анимации
    if(r.result === "fail" || r.result === "critical_fail"){
      addSystem("ГРАНАТА", "Граната падает не туда.");
      runEnemyTurns();
      renderAll();
      return;
    }
    let totalDmg = 0;
    co.enemies.forEach(e => {
      if(e.hp <= 0) return;
      const dmg = rollDamage(weapon.die, 0);
      e.hp -= dmg;
      totalDmg += dmg;
    });
    addSystem("ВЗРЫВ", `Осколки накрывают всех. Общий урон: ${totalDmg}`);
    co.enemies.forEach(e => {
      if(e.hp <= 0) addSystem("УСТРАНЁН", `${e.nameRevealed ? e.name : "Противник"} выведен из строя.`);
    });
    if(co.enemies.every(e => e.hp <= 0)) return endCombat(true);
    afterPlayerCombatAction();
    renderAll();
    saveGameSilent();
  });
}

function throwSmokeGrenade(){
  if(!GAME.combat) return;
  addSystem("ДЫМ", "Дым накрывает поле. Точность атак снижена.");
  addCondition("Прикрытие");
  afterPlayerCombatAction();
  renderAll();
  saveGameSilent();
}

/* ---------- Оборона ---------- */
function combatDefend(){
  if(!GAME.combat) return;
  GAME.combat.defending = true;
  addCondition("Прикрытие");
  addSystem("ЗАЩИТА","Ты занимаешь оборонительную позицию.");
  afterPlayerCombatAction();
  renderAll();
  saveGameSilent();
}

/* ---------- Отступление ---------- */
function combatFlee(){
  if(!GAME.combat) return;
  const r = checkStat("dex", 13, {label:"ОТСТУПЛЕНИЕ"});
  playRoll(r).then(() => {
    addRoll(formatRoll(r), rollClass(r.result));
    if(!GAME.combat) return;

    if(r.result === "success" || r.result === "critical"){
      addSystem("ОТСТУПЛЕНИЕ","Ты выходишь из боя.");
      GAME.mode = "explore";
      GAME.combat = null;
      advanceTime(4);
      Bus.emit("combat_ended", {result:"flee"});
      if(typeof companionsReact === "function") companionsReact("combat_flee");

      // 1) Если был pendingCombat — вернуться в его returnScene
      if(GAME.campaign?.active && GAME.campaign.pendingCombat){
        const pc = GAME.campaign.pendingCombat;
        GAME.campaign.pendingCombat = null;
        if(pc.returnScene){
          renderAll();
          return enterScene(pc.returnScene);
        }
      }

      // 2) Fallback: если сцена — бой в Главе III — вернуться в ритуал
      if(GAME.campaign?.active && GAME.campaign.scenarioId === "warpHeart"){
        const combatScenes = ["wh_combat_marine","wh_combat_horror","wh_combat_shadow"];
        if(combatScenes.includes(GAME.campaign.sceneId)){
          GAME.campaign.pendingCombat = null;
          renderAll();
          return enterScene("wh_ritual");
        }
      }

      // 3) Fallback: если сцена — бой в любой другой главе — вернуться в стартовую сцену
      if(GAME.campaign?.active){
        const sc = CAMPAIGN_SCENARIOS[GAME.campaign.scenarioId];
        if(sc && sc.startScene && GAME.campaign.sceneId !== sc.startScene){
          GAME.campaign.pendingCombat = null;
          renderAll();
          return enterScene(sc.startScene);
        }
      }
    } else {
      addSystem("ОТСТУПЛЕНИЕ","Путь перекрыт.");
      runEnemyTurns();
    }
    renderAll();
  });
}
/* ---------- Ход врагов ---------- */
function runEnemyTurns(openingPhase = false){
  const co = GAME.combat;
  if(!co) return;

  co.enemies.forEach((e, i) => {
    if(e.hp <= 0) return;
    // Пропуск хода (Слово Инквизитора)
    if (e.skipTurn) {
      e.skipTurn = false;   // сбрасываем после пропуска
      addSystem("ПРОПУСК ХОДА",
        `${e.nameRevealed ? e.name : "Противник"} не решается атаковать Инквизитора.`);
      return;
    }
    enemyTurnOne(e, i);
  });

  co.defending = false;
  co.inCover = false;
  removeCondition("Прикрытие");
  if (!openingPhase && GAME.combat && GAME.mode === "combat") GAME.combat.round = Math.max(1, Math.floor(GAME.combat.round || 1)) + 1;

  if(GAME.character.hp <= 0) handleDeath();
}

function enemyTurnOne(enemy, index){
  const c = GAME.character;
  const comps = (typeof activeCompanions === "function") ? activeCompanions() : [];
  // Ярость Императора — счётчик ходов
  if (c._wrathActive > 0) {
    c._wrathActive--;
    if (c._wrathActive === 0) {
      c._wrathBonus = 0;
      addSystem("ЯРОСТЬ", "Боевой транс заканчивается. Ты снова в обычном состоянии.");
    }
  }

  // 30% шанс атаковать спутника, если есть активные
  const companionChance = Number.isFinite(enemy.tactics?.companionChance) ? enemy.tactics.companionChance : 0.30;
  const targetCompanion = comps.length && RNG.chance(companionChance)
    ? comps[RNG.int(0, comps.length - 1)]
    : null;

  if(targetCompanion){
    const ac = targetCompanion.ac;
    const r = rollCheck({
      statScore: 10, prof: 0, dc: ac,
      label: `АТАКА → ${targetCompanion.name}`,
      bonus: enemy.attack
    });
    addRoll(formatRoll(r), r.result === "success" ? "entry-fail" : "entry-roll");
    enemy.hasAttacked = true;
    if(!enemy.nameRevealed){
      enemy.nameRevealed = true;
      addSystem("УГРОЗА ОПОЗНАНА", `Перед тобой: ${enemy.name}.`);
    }
    if(r.result === "success" || r.result === "critical"){
      let dmg = rollDamage(enemy.die);
      if(r.result === "critical") dmg += rollDamage(enemy.die);
      if(typeof damageCompanion === "function") damageCompanion(targetCompanion, dmg);
      addSystem("УРОН СПУТНИКУ",
        `${enemy.name} бьёт ${targetCompanion.name}: ${dmg} урона. HP: ${targetCompanion.hp}/${targetCompanion.maxHp}`);
    } else {
      addSystem("ОБОРОНА", `${enemy.name} промахивается по ${targetCompanion.name}.`);
    }
    return;
  }

  const companionAC = (typeof companionBonus === "function") ? companionBonus("ac") : 0;
  const flanksCover = !!enemy.tactics?.flanksCover && (GAME.combat.round || 1) % 2 === 0;
  const coverBonus = GAME.combat.inCover && !enemy.tactics?.piercesCover && !flanksCover ? 2 : 0;
  if (GAME.combat.inCover && (enemy.tactics?.piercesCover || flanksCover)) {
    addSystem("ТАКТИЧЕСКИЙ МАНЁВР", `${enemy.nameRevealed ? enemy.name : "Противник"}: ${flanksCover ? "ищет угол для обхода укрытия" : "ведёт огонь по открытым секторам укрытия"}. Защита укрытия не сработала против этой атаки.`);
  }
  const doctrineDefence = typeof getDoctrineDefenceBonus === "function" ? getDoctrineDefenceBonus() : 0;
  const ac = c.ac + (GAME.combat.defending ? 2 + talentBonus("_defendBonus") : 0) + coverBonus + doctrineDefence + companionAC;
  
  const r = rollCheck({
    statScore: 10, prof: 0, dc: ac,
    label: `АТАКА (враг ${index+1})`,
    bonus: enemy.attack
  });
  addRoll(formatRoll(r), r.result === "success" ? "entry-fail" : "entry-roll");

  enemy.hasAttacked = true;
  if(!enemy.nameRevealed){
    enemy.nameRevealed = true;
    addSystem("УГРОЗА ОПОЗНАНА",
      `Перед тобой: ${enemy.name}. Слабости всё ещё неизвестны.`);
  }

  if(r.result === "success" || r.result === "critical"){
    let dmg = rollDamage(enemy.die);
    if(r.result === "critical") dmg += rollDamage(enemy.die);
    dmg = Math.max(1, dmg - talentBonus("_damageReduction"));
    dealDamageToPlayer(dmg);
    addSystem("ПОЛУЧЕН УРОН",
      `${enemy.name} наносит ${dmg} урона.\nHP: ${c.hp}/${c.maxHp}`);
    if(typeof companionsReact === "function" && c.hp < c.maxHp * 0.5){
      companionsReact("player_hurt");
    }
  } else {
    addSystem("ОБОРОНА", `${enemy.name} промахивается.`);
  }
}

/* ---------- Победа ---------- */
function endCombat(victory){
  if (typeof setSoundContext === "function") setSoundContext("story");
  if (victory && typeof playSound === "function") playSound("victory");
  const co = GAME.combat;
  if(!co) return;

  // Сбрасываем флаг броска, чтобы анимации не выстреливали после боя
  GAME._rolling = false;

  if(victory){
    GAME.mode = "explore";
    let totalXp = 0;
    const loot = [];
    const defeatedFactions = new Set();

    co.enemies.forEach(e => {
      if(e.hp <= 0){
        totalXp += e.xp;
        if(Array.isArray(e.loot) && e.loot.length){
          const drop = RNG.pick(e.loot);
          if(typeof drop === "string" && drop.trim()) loot.push(drop);
        }
        if(e.faction) defeatedFactions.add(e.faction);
      }
    });

    GAME.combat = null;
    const xpEvents = addXP(totalXp);
    loot.forEach(l => addItem(l, 1));
    // Reputation follows the opponents actually defeated; it is not awarded for killing any target indiscriminately.
    if(defeatedFactions.has("Chaos")){
      changeRep("Imperium", 1);
      changeRep("Inquisition", 1);
      changeRep("Chaos", -1);
    }
    if(defeatedFactions.has("Orks")){
      changeRep("Imperium", 1);
      changeRep("Orks", -1);
    }
    if(defeatedFactions.has("RenegadePDF")){
      changeRep("Militarum", 1);
    }
    const lootSummary = loot.length ? loot.join(", ") : "нет трофеев";
    addSystem("ПОБЕДА", `Противники устранены.\nXP: ${totalXp}\nДобыча: ${lootSummary}`);
    xpEvents.forEach(x => addSystem("ПОВЫШЕНИЕ", x));
    advanceTime(8);
    Bus.emit("combat_ended", {result:"victory"});

    if(typeof companionsReact === "function") companionsReact("combat_win");

    if(GAME.campaign?.active && GAME.campaign.pendingCombat){
      const pc = GAME.campaign.pendingCombat;
      // Сюжетные последствия назначаются только после настоящей победы.
      // Флаг победы позволяет не запускать необязательный бой повторно.
      if(pc.victoryEffects){
        const effectEvents = applyEffects(pc.victoryEffects);
        (effectEvents || []).forEach(e => e && addSystem("ЭФФЕКТ", e));
      }
      GAME.campaign.pendingCombat = null;
      if(pc.returnScene) return enterScene(pc.returnScene);
    }
    saveGameSilent();
  }
  renderAll();
}

function getCurrentWeapon(slot){
  const c = GAME.character;
  if(slot === "ranged")  return RANGED_WEAPONS[c.weapon];
  if(slot === "melee")   return MELEE_WEAPONS[c.meleeWeapon || "Боевой нож"];
  if(slot === "grenade"){
    if(c.grenades){
      if(c.grenades["Осколочная граната"] > 0) return GRENADE_WEAPONS["Осколочная граната"];
      if(c.grenades["Крак-граната"] > 0)       return GRENADE_WEAPONS["Крак-граната"];
      if(c.grenades["Дымовая граната"] > 0)    return GRENADE_WEAPONS["Дымовая граната"];
    }
    return null;
  }
  return null;
}

function handleDeath(){
  GAME.mode = "death";
  addSystem("КРИТИЧЕСКОЕ СОСТОЯНИЕ",
    "Персонаж получил смертельное количество повреждений.");
  renderAll();
}

function lastStand(){
  const c = GAME.character;
  if(c.fate > 0){
    c.fate--;
    c.hp = Math.max(1, Math.floor(c.maxHp * 0.25));
    GAME.mode = "explore";

    addSystem("СУДЬБА", "Последняя попытка удалась. Ты выжил ценой одного очка Судьбы.");

    // Return to the pending scene when it exists; otherwise fall back to the
    // opening scene of the active chapter (including chapter III).
    const pending = GAME.campaign?.pendingCombat;
    const campaignId = CAMPAIGN_SCENARIOS[GAME.campaign?.scenarioId] ? GAME.campaign.scenarioId : "silentForge";
    const scenario = CAMPAIGN_SCENARIOS[campaignId];
    const requestedScene = pending?.returnScene;
    const returnScene = scenario.scenes[requestedScene] ? requestedScene : scenario.startScene;
    GAME.combat = null;
    GAME.campaign = GAME.campaign || {active:true, scenarioId:campaignId, sceneId:returnScene, stack:[], pendingCombat:null};
    GAME.campaign.active = true;
    GAME.campaign.scenarioId = campaignId;
    GAME.campaign.pendingCombat = null;
    if(!Array.isArray(GAME.campaign.stack)) GAME.campaign.stack = [];
    if(scenario.scenes[returnScene]){
      enterScene(returnScene);
      return;
    }
    // Defensive last resort for a malformed campaign registry.
    GAME.mode = "dead";
    addSystem("ОШИБКА КАМПАНИИ", "Не удалось восстановить сцену после последнего шанса.");
    renderAll();
    return;
  }

  GAME.mode = "dead";
  addSystem("КОНЕЦ КАМПАНИИ", "Запаса Судьбы больше нет. Персонаж погиб.");
  renderAll();
  saveGameSilent();
}

/* ============================================================
   ПЕРЕЗАРЯДКА ОРУЖИЯ
   ------------------------------------------------------------
   Заполняет магазин из совместимого запаса: энергоячеек, болтов,
   плазменных ячеек или картриджей. Старые сохранения сохраняют запас «Патроны».
   В бою тратит ход — враги атакуют после.
   ============================================================ */
function reloadWeapon(){
  const c = GAME.character;
  const co = GAME.combat;
  const slot = co ? co.weaponSlot : "ranged";

  if(slot !== "ranged"){
    addSystem("ПЕРЕЗАРЯДКА", "Перезаряжать можно только стрелковое оружие.");
    renderAll();
    return;
  }

  const w = RANGED_WEAPONS[c.weapon];
  if(!w){
    addSystem("ПЕРЕЗАРЯДКА", "Стрелкового оружия нет.");
    renderAll();
    return;
  }

  const type = w.ammoType;
  const max = w.ammoMax;
  const cur = c.ammo[type] || 0;

  if(cur >= max){
    addSystem("ПЕРЕЗАРЯДКА", "Магазин полон.");
    renderAll();
    return;
  }

  const typedReserve = getAmmoReserveName(c.weapon);
  let reserveName = typedReserve;
  let inv = c.inventory.find(i => i.name === typedReserve);
  // Compatibility path for old saves with the former universal «Патроны» stack.
  if(!inv && typedReserve !== "Патроны") { inv = c.inventory.find(i => i.name === "Патроны"); reserveName = "Патроны"; }
  const have = inv ? inv.qty : 0;

  if(have <= 0){
    addSystem("ПЕРЕЗАРЯДКА", `Нет совместимого запаса (${typedReserve}).`);
    renderAll();
    return;
  }

  const need = max - cur;
  const use = Math.min(need, have);

  removeItem(reserveName, use);
  c.ammo[type] = cur + use;

  const left = (c.inventory.find(i => i.name === reserveName) || {}).qty || 0;

  addSystem("ПЕРЕЗАРЯДКА",
    `${c.weapon} перезаряжен.\nВ магазине: ${c.ammo[type]}/${max}\nИспользовано: ${use} (${reserveName}).\nВ запасе осталось: ${left}`);

  // В бою тратит ход — враги атакуют
  if(co && typeof runEnemyTurns === "function"){
    runEnemyTurns();
  }

  renderAll();
  saveGameSilent();
}

function addXP(amount){
  const c = GAME.character;
  c.xp += amount;
  const events = [];
  while(c.xp >= c.nextXp){
    c.xp -= c.nextXp;
    c.level++;
    c.nextXp = Math.round(c.nextXp * 1.35);
    c.maxHp += 4;
    c.hp = c.maxHp;
    events.push(`Повышение уровня: ${c.level}. HP увеличено.`);

    // Новый уровень — если это уровень таланта, добавляем в список
    if (typeof TALENT_LEVELS !== "undefined" && TALENT_LEVELS.includes(c.level)) {
      events.push(`На уровне ${c.level} открыт новый талант!`);
      if (!c._pendingTalentLevels) c._pendingTalentLevels = [];
      if (!c._pendingTalentLevels.includes(c.level)) {
        c._pendingTalentLevels.push(c.level);
      }
    }
  }
  return events;
}
