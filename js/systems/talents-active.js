/* ============================================================
   SYSTEMS / TALENTS-ACTIVE.JS — активные таланты в бою и диалоге
   ============================================================ */

const ACTIVE_TALENTS = {

  /* ---------- ИНКВИЗИТОР ---------- */
  "interrogate": {
    name: "Допрос",
    type: "combat",
    targetType: "humanoid",
    apply: () => {
      const co = GAME.combat;
      const t = co.enemies[co.targetIndex];
      const humanTypes = ["cultist", "renegade", "pdf"];
      if (!humanTypes.includes(t.type)) {
        addSystem("ДОПРОС", `${t.name} не понимает страха. Допрос не работает.`);
        return false;
      }
      t.skipTurn = true;
      addSystem("ДОПРОС", `${t.name} дрогнул. Он пропускает ход.`);
      return true;
    }
  },

  "execute": {
    name: "Казнь",
    type: "combat",
    apply: () => {
      const co = GAME.combat;
      const t = co.enemies[co.targetIndex];
      if (t.hp / t.maxHp > 0.25) {
        addSystem("КАЗНЬ", "Цель слишком здорова для казни. Нужно снизить HP до 25%.");
        return false;
      }
      addSystem("КАЗНЬ", `${t.name} приговорён. Один выстрел.`);
      t.hp = 0;
      return true;
    }
  },

  "purge": {
    name: "Очищение",
    type: "combat",
    apply: () => {
      if (typeof changeCorruption === "function") {
        changeCorruption(-3, "Активная молитва очищает душу.");
      }
      addSystem("ОЧИЩЕНИЕ", "Ты читаешь молитву на ходу. Порча отступает.");
      return true;
    }
  },

  /* ---------- ГВАРДЕЕЦ ---------- */
  "aimed-shot": {
    name: "Прицельный выстрел",
    type: "combat",
    apply: () => {
      const co = GAME.combat;
      const t = co.enemies[co.targetIndex];
      const w = getCurrentWeapon("ranged");
      if (!w) return false;
      const dmg = rollDamage(w.die, w.bonus || 0);
      t.hp -= dmg;
      addSystem("ПРИЦЕЛЬНЫЙ ВЫСТРЕЛ", `Гарантированное попадание. Урон: ${dmg}.`);
      return true;
    }
  },

  "barrage": {
    name: "Осколочный залп",
    type: "combat",
    apply: () => {
      const co = GAME.combat;
      let total = 0;
      for (let i = 0; i < 3; i++) {
        co.enemies.forEach(e => {
          if (e.hp <= 0) return;
          const dmg = rollDamage(10, 0);
          e.hp -= dmg;
          total += dmg;
        });
      }
      addSystem("ОСКОЛОЧНЫЙ ЗАЛП", `Три гранаты. Общий урон: ${total}.`);
      return true;
    }
  },

  "command": {
    name: "Приказ",
    type: "combat",
    apply: () => {
      const comps = (typeof activeCompanions === "function") ? activeCompanions() : [];
      if (!comps.length) {
        addSystem("ПРИКАЗ", "У тебя нет спутников.");
        return false;
      }
      if (typeof runCompanionTurns === "function") {
        runCompanionTurns();
        runCompanionTurns();
      }
      addSystem("ПРИКАЗ", "Спутники атакуют дважды.");
      return true;
    }
  },

  /* ---------- КОСМОДЕСАНТНИК ---------- */
  "assault": {
    name: "Штурмовой порыв",
    type: "combat",
    apply: () => {
      const co = GAME.combat;
      const t = co.enemies[co.targetIndex];
      const w = getCurrentWeapon("melee");
      if (!w) return false;
      for (let i = 0; i < 2; i++) {
        const dmg = rollDamage(w.die, w.bonus || 0) + talentBonus("_meleeDamageBonus");
        t.hp -= dmg;
        addSystem("ШТУРМ", `Удар ${i + 1}: ${dmg} урона.`);
      }
      return true;
    }
  },

  "aimed-bolt": {
    name: "Прицельный болт",
    type: "combat",
    apply: () => {
      const co = GAME.combat;
      const t = co.enemies[co.targetIndex];
      const w = getCurrentWeapon("ranged");
      if (!w) return false;
      const dmg = rollDamage(w.die, w.bonus || 0) + 2;
      t.hp -= dmg;
      addSystem("ПРИЦЕЛЬНЫЙ БОЛТ", `Точное попадание. Урон: ${dmg}.`);
      return true;
    }
  },

  "recover": {
    name: "Регенерация",
    type: "combat",
    apply: () => {
      const c = GAME.character;
      c.hp = Math.min(c.maxHp, c.hp + 15);
      addSystem("РЕГЕНЕРАЦИЯ", `+15 HP. Текущее: ${c.hp}/${c.maxHp}.`);
      return true;
    }
  },
    /* ---------- 10 УРОВЕНЬ: НОВЫЕ АКТИВНЫЕ ---------- */
  
  "word-of-inquisitor": {
    name: "Слово Инквизитора",
    type: "combat",
    apply: () => {
      const co = GAME.combat;
      if (!co) return false;

      // Проверка: есть ли враги-люди
      const humanTypes = ["cultist", "renegade", "pdf"];
      const humans = co.enemies.filter(e => e.hp > 0 && humanTypes.includes(e.type));
      if (!humans.length) {
        addSystem("СЛОВО ИНКВИЗИТОРА",
          "Никто из врагов не понимает авторитета Инквизиции. Слово не действует.");
        return false;
      }

      // Все враги-люди пропускают ход
      humans.forEach(e => {
        e.skipTurn = true;
      });

      addSystem("СЛОВО ИНКВИЗИТОРА",
        `Ты поднимаешь Розу Инквизиции. ${humans.length} ${humans.length === 1 ? "враг" : "врага"} дрогнули. Они не решаются стрелять.`);
      return true;
    }
  },

  "volley": {
    name: "Залп",
    type: "combat",
    apply: () => {
      const co = GAME.combat;
      if (!co) return false;

      const target = co.enemies[co.targetIndex];
      if (!target || target.hp <= 0) {
        addSystem("ЗАЛП", "Нет цели для залпа.");
        return false;
      }

      const w = getCurrentWeapon("ranged");
      if (!w) {
        addSystem("ЗАЛП", "Стрелкового оружия нет.");
        return false;
      }

      // Два выстрела — два броска
      let totalDamage = 0;
      let hits = 0;
      for (let i = 0; i < 2; i++) {
        const r = rollCheck({
          statScore: GAME.character.stats.dex,
          prof: GAME.character.prof,
          dc: target.ac,
          label: `ЗАЛП (выстрел ${i+1})`,
          bonus: w.bonus || 0
        });
        if (r.result === "success" || r.result === "critical") {
          const dmg = rollDamage(w.die, w.bonus || 0);
          target.hp -= dmg;
          totalDamage += dmg;
          hits++;
        }
      }

      addSystem("ЗАЛП",
        `Ты стреляешь дважды. Попаданий: ${hits}/2. Урон: ${totalDamage}.\n${target.nameRevealed ? target.name : "Угроза"}: ${Math.max(0, target.hp)}/${target.maxHp}`);

      if (target.hp <= 0) {
        addSystem("УСТРАНЁН", `${target.nameRevealed ? target.name : "Противник"} выведен из строя.`);
        const next = co.enemies.findIndex(e => e.hp > 0);
        if (next >= 0) co.targetIndex = next;
      }

      return true;
    }
  },

  "emperor-wrath": {
    name: "Ярость Императора",
    type: "combat",
    apply: () => {
      const co = GAME.combat;
      const c = GAME.character;
      if (!co || !c) return false;

      // Проверка: HP < 50%
      if (c.hp / c.maxHp >= 0.5) {
        addSystem("ЯРОСТЬ ИМПЕРАТОРА",
          "Ты ещё не в том состоянии. Нужно быть ниже 50% HP.");
        return false;
      }

      // Активируем бонус на 3 хода
      c._wrathActive = 3;    // осталось ходов
      c._wrathBonus = 3;     // +3 к атаке
      addSystem("ЯРОСТЬ ИМПЕРАТОРА",
        "Ты входишь в боевой транс. +3 к атаке, +1d6 урона. Три хода.");
      return true;
    }
  }
};

/* ---------- Использование активного таланта ---------- */
function useActiveTalent(activeId) {
  const c = GAME.character;
  if (!c) return;
  c._activeUsed = c._activeUsed || {};
  if (c._activeUsed[activeId]) {
    addSystem("ТАЛАНТ", "Этот талант уже использован в этом бою.");
    renderAll();
    return;
  }

  const talent = ACTIVE_TALENTS[activeId];
  if (!talent) {
    addSystem("ТАЛАНТ", "Неизвестный талант.");
    renderAll();
    return;
  }

  const success = talent.apply();
  if (success) {
    c._activeUsed[activeId] = true;
    // Проверка смерти врагов
    const co = GAME.combat;
    if (co && co.enemies.every(e => e.hp <= 0)) {
      if (typeof endCombat === "function") endCombat(true);
      return;
    }
    if (typeof runEnemyTurns === "function") runEnemyTurns();
  }
  renderAll();
  saveGameSilent();
}
