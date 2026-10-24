/* ============================================================
   SYSTEMS / RESOLVER.JS — резолвер намерений
   ============================================================ */

const RESOLVERS = {

  /* ---------- Перемещение ---------- */
  move(intent, ctx){
    if(!intent.direction){
      const neighbors = locationNeighbors();
      return {
        allowed: false,
        reason: "Куда именно ты направляешься? Соседние секторы: " +
                neighbors.map(n => n.name).join(", ") + "."
      };
    }
    const neighbors = locationNeighbors();
    const match = neighbors.find(n =>
      n.name.toLowerCase().includes(intent.direction)
    );
    if(!match){
      return {
        allowed: false,
        reason: `Путь «${intent.direction}» сейчас недоступен. Соседние направления: ` +
                neighbors.map(n => n.name).join(", ") + "."
      };
    }
    return {
      allowed: true,
      outcome: () => {
        moveTo(match.name);
        return `Ты направляешься в ${match.name}.`;
      }
    };
  },

  approach(intent, ctx){
    const t = intent.target;
    if(!t){
      return { allowed: false, reason: "К чему именно ты подходишь? Уточни цель." };
    }
    if(intent.method === "stealth"){
      const dc = 12 + (GAME.world.heat > 5 ? 3 : 0);
      return {
        allowed: true,
        check: { stat:"dex", dc, label:"СКРЫТНЫЙ ПОДХОД" },
        onSuccess: () => `Ты подходишь к ${t} незамеченным.`,
        onFail:    () => `Тебя замечают у ${t}. Тревога растёт.`,
        failEffects: { heat: 1 }
      };
    }
    return {
      allowed: true,
      outcome: () => `Ты подходишь к ${t}. Ничего не происходит.`
    };
  },

  enter(intent, ctx){
    if(intent.direction) return RESOLVERS.move(intent, ctx);
    const t = intent.target;
    if(!t) return { allowed: false, reason: "Куда именно ты входишь? Уточни." };
    return { allowed: true, outcome: () => `Ты входишь в ${t}.` };
  },

  leave(intent, ctx){
    return { allowed: true, outcome: () => "Ты покидаешь это место." };
  },

  climb(intent, ctx){
    return {
      allowed: true,
      check: { stat:"str", dc:13, label:"ЛАЗАНИЕ" },
      onSuccess: () => "Ты забираешься наверх.",
      onFail:    () => "Ты срываешься и падаешь обратно."
    };
  },

  jump(intent, ctx){
    return {
      allowed: true,
      check: { stat:"dex", dc:12, label:"ПРЫЖОК" },
      onSuccess: () => "Ты перепрыгиваешь.",
      onFail:    () => "Ты не долетаешь и едва удерживаешься."
    };
  },

  hide(intent, ctx){
    return {
      allowed: true,
      check: { stat:"dex", dc:12, label:"СКРЫТЬСЯ" },
      onSuccess: () => "Ты растворяешься в тени.",
      onFail:    () => "Тебя замечают. Тревога растёт.",
      failEffects: { heat: 1 }
    };
  },

  /* ---------- Наблюдение ---------- */
  inspect(intent, ctx){
    const t = intent.target || "окружение";
    return {
      allowed: true,
      check: { stat:"int", dc:12, label:`ОСМОТР (${t})` },
      onSuccess: () => describeFinding(t, true),
      onFail:    () => describeFinding(t, false)
    };
  },

  listen(intent, ctx){
    return {
      allowed: true,
      check: { stat:"wil", dc:11, label:"ВНИМАНИЕ" },
      onSuccess: () => "Ты слышишь далёкий ритмичный стук. Он исходит снизу.",
      onFail:    () => "Тишина. Только гул генераторов."
    };
  },

  search(intent, ctx){
    const t = intent.target || "место";
    return {
      allowed: true,
      check: { stat:"int", dc:13, label:`ПОИСК (${t})` },
      onSuccess: () => {
        if(RNG.int(1,3) === 1){
          GAME.world.clues++;
          Bus.emit("clue_gained", {delta:1, total:GAME.world.clues});
          return "Ты находишь обрывок записи: «одиннадцать… увести вниз…»";
        }
        return `Ты тщательно обыскиваешь ${t}. Ничего нового.`;
      },
      onFail: () => `В ${t} нет ничего, кроме пыли.`
    };
  },

  check(intent, ctx){
    return RESOLVERS.inspect(intent, ctx);
  },

  /* ---------- Взаимодействие ---------- */
  open(intent, ctx){
    const t = intent.target;
    if(t === "терминал" || t === "панель" || t === "контейнер" || t === "шкаф"){
      return {
        allowed: true,
        check: { stat:"dex", dc:11, label:`ОТКРЫТЬ (${t})` },
        onSuccess: () => `${t} поддаётся. Внутри — пыль и слабый запах старого металла.`,
        onFail:    () => `${t} не поддаётся. Нужен инструмент.`
      };
    }
    if(t === "дверь"){
      const locked = RNG.chance(0.4);
      if(locked){
        return {
          allowed: true,
          check: { stat:"dex", dc:15, label:"ВЗЛОМ ДВЕРИ" },
          onSuccess: () => "Замок щёлкает. Дверь открывается.",
          onFail:    () => "Замок держится. Силой не выйдет."
        };
      }
      return { allowed: true, outcome: () => "Дверь открывается без сопротивления." };
    }
    return { allowed: true, outcome: () => `Ты открываешь ${t || "то, что перед тобой"}.` };
  },

  close(intent, ctx){
    return { allowed: true, outcome: () => `Ты закрываешь ${intent.target || "то, что было открыто"}.` };
  },

  use(intent, ctx){
    if(!intent.tool) return { allowed: false, reason: "Что именно ты используешь?" };
    if(!hasItem(intent.tool)) return { allowed: false, reason: `У тебя нет «${intent.tool}».` };
    return { allowed: true, outcome: () => { useItem(intent.tool); return ""; } };
  },

  take(intent, ctx){
    if(!intent.target) return { allowed: false, reason: "Что именно ты берёшь?" };
    return { allowed: true, outcome: () => `Ты берёшь ${intent.target}.` };
  },

  place(intent, ctx){
    return { allowed: true, outcome: () => `Ты оставляешь ${intent.target || "предмет"} на месте.` };
  },

  break(intent, ctx){
    if(!intent.target) return { allowed: false, reason: "Что именно ты ломаешь?" };
    return {
      allowed: true,
      check: { stat:"str", dc:14, label:`СЛОМАТЬ (${intent.target})` },
      onSuccess: () => `${intent.target} поддаётся.`,
      onFail:    () => `${intent.target} держится.`
    };
  },

  read(intent, ctx){
    const t = intent.target || "документ";
    return {
      allowed: true,
      check: { stat:"int", dc:10, label:`ЧТЕНИЕ (${t})` },
      onSuccess: () => `Ты читаешь ${t}. Много слов, но одна строка выделяется.`,
      onFail:    () => `${t} написан на языке, который ты не понимаешь.`
    };
  },

  write(intent, ctx){
    return { allowed: true, outcome: () => "Ты записываешь это в свой журнал." };
  },

  /* ---------- Социальное ---------- */
talk(intent, ctx){
  const t = intent.target;
  if(!t) return { allowed: false, reason: "С кем именно ты говоришь? Уточни имя NPC." };
  if(!GAME.npcs[t]) return { allowed: false, reason: `Здесь нет никого с именем «${t}».` };

  // Если цель — NPC и есть дерево диалогов — запускаем диалог
  if(typeof DIALOGUE_TREES !== "undefined" && DIALOGUE_TREES[t]){
    return {
      allowed: true,
      outcome: () => { startDialogue(t); return ""; }
    };
  }

  // Иначе — простая проверка
  return {
    allowed: true,
    check: { stat:"cha", dc:12, label:`РАЗГОВОР (${t})` },
    onSuccess: () => { markMet(t); bumpNPC(t, +1); return `${t} отвечает.`; },
    onFail:    () => `${t} явно не настроен говорить.`
  };
},

  ask(intent, ctx){
    const t = intent.target;
    if(!t) return { allowed: false, reason: "У кого ты спрашиваешь?" };
    return {
      allowed: true,
      check: { stat:"cha", dc:13, label:`ВОПРОС (${t})` },
      onSuccess: () => `${t} делится тем, что знает.`,
      onFail:    () => `${t} уклоняется от ответа.`
    };
  },

answer(intent, ctx){
  if(GAME.dialogue){
    return { allowed: false, reason: "Выбери один из вариантов ответа в панели диалога." };
  }
  return { allowed: true, outcome: () => "Ты отвечаешь." };
},

  persuade(intent, ctx){
    const t = intent.target;
    if(!t) return { allowed: false, reason: "Кого ты убеждаешь?" };
    const dc = intent.method === "polite" ? 13 : 15;
    return {
      allowed: true,
      check: { stat:"cha", dc, label:`УБЕЖДЕНИЕ (${t})` },
      onSuccess: () => { bumpNPC(t, +2); return `${t} соглашается.`; },
      onFail:    () => { bumpNPC(t, -1); return `${t} остаётся при своём.`; }
    };
  },

  intimidate(intent, ctx){
    const t = intent.target;
    if(!t) return { allowed: false, reason: "Кого ты запугиваешь?" };
    const bonus = talentBonus("_intimidateBonus");
    return {
      allowed: true,
      check: { stat:"wil", dc:14, label:`ЗАПУГИВАНИЕ (${t})`, bonus },
      onSuccess: () => { bumpNPC(t, -2); return `${t} сдаётся под давлением.`; },
      onFail:    () => { bumpNPC(t, -3); return `${t} не боится. И запомнит это.`; }
    };
  },

  deceive(intent, ctx){
    const t = intent.target;
    if(!t) return { allowed: false, reason: "Кого ты обманываешь?" };
    return {
      allowed: true,
      check: { stat:"cha", dc:14, label:`ОБМАН (${t})` },
      onSuccess: () => `${t} верит тебе.`,
      onFail:    () => `${t} чувствует ложь.`
    };
  },

  /* ---------- Бой (вне сцены) ---------- */
  attack(intent, ctx){
    return { allowed: false, reason: "Здесь нет противника, которого можно атаковать." };
  },
  defend(intent, ctx){
    return { allowed: false, reason: "Сейчас нет угрозы, от которой нужно защищаться." };
  },
  flee(intent, ctx){
    return { allowed: false, reason: "Не от кого убегать." };
  },

  /* ---------- Боевые действия внутри боя ---------- */
  analyze(intent, ctx){
    if(GAME.mode !== "combat") return { allowed: false, reason: "Только в бою можно изучать противника." };
    return { allowed: true, outcome: () => { analyzeEnemy(); return ""; } };
  },
  switchWeapon(intent, ctx){
    if(GAME.mode !== "combat") return { allowed: false, reason: "Смена оружия — только в бою." };
    const slot = intent.target || "ranged";
    return { allowed: true, outcome: () => { switchWeaponSlot(slot); return ""; } };
  },
  grenade(intent, ctx){
    if(GAME.mode !== "combat") return { allowed: false, reason: "Граната — только в бою." };
    GAME.combat.weaponSlot = "grenade";
    return { allowed: true, outcome: () => { combatAttack(); return ""; } };
  },
  melee(intent, ctx){
    if(GAME.mode !== "combat") return { allowed: false, reason: "Ближний бой — только в бою." };
    GAME.combat.weaponSlot = "melee";
    return { allowed: true, outcome: () => { combatAttack(); return ""; } };
  },

  /* ---------- Техника / медицина ---------- */
  hack(intent, ctx){
    if(intent.target !== "терминал" && intent.target !== "панель"){
      return { allowed: false, reason: "Здесь нет терминала, который можно взломать." };
    }
    const bonus = intent.tool === "Печать допуска" ? 3 : 0;
    return {
      allowed: true,
      check: { stat:"int", dc:14, label:"ВЗЛОМ ТЕРМИНАЛА", bonus },
      onSuccess: () => {
        GAME.world.clues++;
        Bus.emit("clue_gained", {delta:1, total:GAME.world.clues});
        return "Терминал выдаёт фрагмент журнала.";
      },
      onFail: () => "Доступ отклонён."
    };
  },

  repair(intent, ctx){
    if(!hasItem("Ремкомплект")) return { allowed: false, reason: "Тебе нужен ремкомплект." };
    return {
      allowed: true,
      outcome: () => {
        removeItem("Ремкомплект", 1);
        removeCondition("Заклинивание");
        return "Ты приводишь снаряжение в порядок.";
      }
    };
  },

  heal(intent, ctx){
    if(!hasItem("Медикамент")) return { allowed: false, reason: "Медикаментов нет." };
    return { allowed: true, outcome: () => { useItem("Медикамент"); return ""; } };
  },

  pray(intent, ctx){
  const c = GAME.character;
  const corruption = c.corruption || 0;

  // Проверка на недавнюю молитву — по игровому времени
  const lastPrayMinute = GAME.world.flags._lastPrayMinute;
  const currentMinute = GAME.world.day * 1440 + GAME.world.hour * 60 + GAME.world.minute;

  if(typeof lastPrayMinute === "number" && (currentMinute - lastPrayMinute) < 120){
    return {
      allowed: false,
      reason: "Ты уже молился недавно. Император слышит тебя, но не отвечает дважды подряд. Нужно подождать."
    };
  }

  if(corruption <= 0){
    return {
      allowed: true,
      outcome: () => "Ты молишься, но Императору нечего очищать. Ты пока чист."
    };
  }

  const dc = 10 + Math.floor(corruption / 2);
  const inTemple = GAME.character.location === "Храм";
  const bonus = inTemple ? 3 : 0;

  // Вручную бросаем кубик
  const r = checkStat("wil", dc, { label: "МОЛИТВА ИМПЕРАТОРУ", bonus });

  return {
    allowed: true,
    outcome: () => {
      addRoll(formatRoll(r), rollClass(r.result));

      const success = r.result === "success" || r.result === "critical";

      // Записываем минуту молитвы — в любом случае
      GAME.world.flags._lastPrayMinute = currentMinute;

      if(success){
        const drop = corruption >= 7 ? 2 : 1;
        if(typeof changeCorruption === "function"){
          changeCorruption(-drop, "Молитва к Бог-Императору услышана.");
        }
        addCondition("Вдохновение");
        advanceTime(30);
        return `Ты молишься. Тепло разливается по телу. Свет Императора смывает часть скверны. Порча −${drop}.`;
      } else {
        advanceTime(30);
        return "Ты молишься, но ответа нет. Возможно, слишком поздно.";
      }
    }
  };
},


  /* ---------- Внутреннее ---------- */
  think(intent, ctx){
    return {
      allowed: true,
      outcome: () => {
        advanceTime(5);
        const clues = GAME.world.clues;
        if(clues >= 5) return `Ты собираешь всё в голове. Зацепок ${clues}.`;
        if(clues >= 2) return "Ты прокручиваешь события в памяти.";
        return "Ты думаешь. Пока ничего нового.";
      }
    };
  },

  wait(intent, ctx){
    return {
      allowed: true,
      outcome: () => {
        advanceTime(15);
        return "Ты ждёшь. Мимо проходит патруль.";
      }
    };
  }
};

function resolveIntent(intent){
  const ctx = {
    location:   GAME.character.location,
    heat:       GAME.world.heat,
    clues:      GAME.world.clues,
    conditions: GAME.character.conditions
  };

  if(!intent.verb){
    return {
      allowed: false,
      reason: "Не понял, что именно ты пытаешься сделать. Опиши действие глаголом: «осматриваю», «иду», «говорю», «взламываю»."
    };
  }

  const resolver = RESOLVERS[intent.verb];
  if(!resolver){
    return { allowed: false, reason: `Действие «${intent.verb}» пока не поддерживается.` };
  }

  return resolver(intent, ctx);
}

function describeFinding(target, success){
  const flavor = {
    "дверь":     success ? "На двери свежие царапины у замка." : "Обычная дверь.",
    "терминал":  success ? "Терминал мигает. След недавнего использования." : "Терминал работает штатно.",
    "труп":      success ? "На теле — те же метки, что и на стенах." : "Мёртвое тело.",
    "стена":     success ? "За слоем штукатурки — старые символы. Их ровно одиннадцать." : "Стена как стена.",
    "пол":       success ? "Под пылью — следы тяжёлых ботинок." : "Обычный пол.",
    "потолок":   success ? "На потолке — решётка вентиляции. Кто-то сдвигал её недавно." : "Обычный потолок.",
    "контейнер": success ? "Контейнер заперт, но не запечатан." : "Обычный контейнер.",
    "шкаф":      success ? "На полке — обрывок бумаги с номером." : "Шкаф пуст.",
    "панель":    success ? "Панель мигает. Тут недавно проводили диагностику." : "Панель в рабочем состоянии.",
    "записи":    success ? "Одна запись: «смена в 04:00, вниз, к узлу»." : "Записи неразборчивы."
  };
  return flavor[target] || (success
    ? `Ты замечаешь на ${target} деталь, которая раньше не бросалась в глаза.`
    : `${target} не даёт новых подсказок.`);
}
