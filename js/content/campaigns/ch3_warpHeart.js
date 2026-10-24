/* ============================================================
   CAMPAIGN CH3 — Сердце Варпа
   ------------------------------------------------------------
   Вход: явный выбор __chapter3__ из одной из трёх концовок главы II.
   Три пути: вера, знание, сила. Три варианта финала зависят от решения и результата ритуала.
   ============================================================ */

const CAMPAIGN_CH3 = {
  warpHeart: {
    title: "Глава III — Сердце Варпа",
    startScene: "wh_boot",
    scenes: {

      wh_boot: {
        title: "НОЧЬ ПЕРЕД СПУСКОМ",
        text: (game) => {
          const flags = game.world?.flags || {};
          const hasKralEvidence = !!(flags.knowsKraIl || flags.sawKraIlVision || flags.knowsKraIlVision || flags.foundKralRecords);
          const evidence = hasKralEvidence
            ? `На столе — записи и сведения, собранные во время расследования. В них повторяются слова Кралла: «шов», «врата», «цена».`
            : `На столе — краткая сводка по Запечатанному сектору. В ней сопоставлены слова «шов» и «врата», а имя Кралла указано как возможная связь. Подробностей пока мало.`;
          if(flags.fallen){
            return `После Низвержения ты не возвращаешься к обычной службе. Шёпот ведёт тебя глубже — к катакомбам под ульем.\n\n${evidence}\n\nЗа окном — тьма. Путь к Вратам ещё не завершён.`;
          }
          return `Ты не спишь третью ночь. Улей гудит, но в этом гуле теперь слышен другой ритм — медленный, как дыхание.\n\n${evidence}\n\nЗа окном — тьма. Утром — спуск.`;
        },
        choices: [
          {label: "Изучить записи Кралла",      goto: "wh_kral_notes"},
          {label: "Помолиться Императору",      goto: "wh_pray", 
            check:{stat:"wil", dc:12, label:"МОЛИТВА"}},
          {label: "Проверить снаряжение",       goto: "wh_gear"},
          {label: "Спуститься немедленно",      goto: "wh_descent"}
        ]
      },

      wh_kral_notes: {
        title: "ЗАПИСИ КРАЛЛА",
        text: `«Шов открывается только с двух сторон. С той стороны — Он. С этой — мы.

Я нашёл способ. Но он требует, чтобы кто-то остался. Я останусь. Пусть Кассий не ищет меня. Пусть живёт.»

Последняя запись датирована 43 годами назад.`,
        effects: {clue:3, flag:{foundKralRecords:true, knowsGatePrice:true}, corruption:1},
        choices: [
          {label: "Помолиться",           goto: "wh_pray", check:{stat:"wil", dc:12, label:"МОЛИТВА"}},
          {label: "Проверить снаряжение", goto: "wh_gear"},
          {label: "Спуститься",           goto: "wh_descent"}
        ]
      },

      wh_pray: {
        title: "МОЛИТВА",
        text: "Ты становишься на колени. Слова молитвы знакомы с детства. Но сегодня они звучат иначе — как будто кто-то слушает.",
        effects: {corruption:-1, flag:{prayedBeforeDescent:true}},
        choices: [
          {label: "Спуститься", goto: "wh_descent"}
        ]
      },

      wh_gear: {
        title: "СНАРЯЖЕНИЕ",
        text: `Ты проверяешь всё. Патроны. Медикаменты. Печать Инквизиции — та, что даёт доступ к запретному.

В ящике — старая святая вода, освящённая ещё при Кралле.`,
        effects: {item:"Святая вода", qty:1},
        choices: [
          {label: "Спуститься", goto: "wh_descent"}
        ]
      },

      wh_descent: {
        title: "СПУСК",
        text: `Старый лифт скрипит. Ты спускаешься в нижние уровни улья.

Катакомбы Инквизиции. Здесь хоронили тех, чьи имена нельзя произносить. Воздух холодный. Свет факелов дрожит.

Впереди — три прохода: налево — к записям, прямо — к вратам, направо — к Тени.`,
        choices: [
          {label: "Налево — к старым записям",   goto: "wh_archives"},
          {label: "Прямо — к вратам",            goto: "wh_gate_approach"},
          {label: "Направо — к Тени Кралла",     goto: "wh_shadow_approach"}
        ]
      },

      wh_archives: {
        title: "СТАРЫЕ ЗАПИСИ",
        text: `Полки с тысячами отчётов. Ты находишь папку с печатью Кралла. Внутри — карта врат и инструкция по закрытию.

«Шов можно зашить только памятью. Тот, кто шьёт, отдаёт самое дорогое. Иначе шов не держится.»`,
        effects: {clue:3, flag:{knowsGateRitual:true}, item:"Записи Кралла", qty:1},
        choices: [
          {label: "Идти к вратам",  goto: "wh_gate_approach"},
          {label: "Идти к Тени",    goto: "wh_shadow_approach"}
        ]
      },

      wh_shadow_approach: {
        title: "ТЕНЬ КРАЛЛА",
        text: (game) => game.character?.name === "Инквизитор Кассий Варро" && game.character?.classId === "inquisitor"
          ? `В конце коридора — фигура. Свет не отражается от неё. Это не человек. Это эхо человека.\n\n— Кассий… — голос знакомый. Ты слышал его в детстве.`
          : `В конце коридора — фигура. Свет не отражается от неё. Это не человек. Это эхо человека.\n\nГолос звучит прямо в мыслях. Фигура склоняет голову, будто пытаясь вспомнить тебя, но ты не узнаёшь её.`,
        choices: [
          {label: "Заговорить",  goto: "wh_shadow_dialogue"},
          {label: "Атаковать",   goto: "wh_combat_shadow"}
        ]
      },

      wh_shadow_dialogue: {
        title: "РАЗГОВОР С ТЕНЬЮ",
        text: (game) => game.character?.name === "Инквизитор Кассий Варро" && game.character?.classId === "inquisitor"
          ? "Ты говоришь с тем, кого давно нет. Или с тем, что от него осталось."
          : "Ты говоришь с фигурой, которая называет себя Краллом. Ты не знаешь, сам ли это инквизитор или лишь эхо Варпа, использующее его имя.",
        effects: {flag:{kralVoice:true}},
        choices: [
          {label: "Расспросить Тень о личном прошлом", dialogue: "Тень Кралла", requires: {characterName: "Инквизитор Кассий Варро", classId: "inquisitor"}, requiresFailText: "Эти воспоминания относятся к личному делу Кассия Варро."},
          {label: "Продолжить разговор", goto: "wh_shadow_continue"},
          {label: "Вспомнить сделку",   goto: "wh_shadow_reaction",
            requires: { flag: { shadowDeal: true } }}
        ]
      },

      wh_shadow_reaction: {
        title: "ТЕНЬ ПОМНИТ",
        text: `Тень смотрит на тебя. Долго.\n\n— Ты помнишь меня, — говорит она. — Я тоже тебя помню. Ты отдал мне часть себя. Я храню её.\n\nОна делает паузу.\n\n— Хочешь забрать? Или оставить?`,
        choices: [
          { label: "Забрать память",     goto: "wh_shadow_reclaim" },
          { label: "Оставить как есть",  goto: "wh_shadow_continue" }
        ]
      },

      wh_shadow_reclaim: {
        title: "ЗАБРАТЬ ПАМЯТЬ",
        text: `Тень касается твоего лба. Ты вспоминаешь. Всё. То, что отдал. То, что забыл. То, что было до сделки.\n\nЭто больно. Но это твоё.`,
        effects: {
          corruption: -2,
          clue: 2,
          flag: { reclaimedMemory: true }
        },
        choices: [
          { label: "Идти к Вратам", goto: "wh_gate_approach" }
        ]
      },

      wh_shadow_continue: {
        title: "ТЕНЬ ГОВОРИТ",
        text: `— Я отдал своё имя. Ты готов отдать своё?

Память. Самая дорогая. Ту, которую ты хранишь как святыню. Отдай её — и врата закроются.`,
        effects: {clue:2, flag:{knowsGatePrice:true}, corruption:1},
        choices: [
          {label: "Согласиться",     goto: "wh_gate_approach"},
          {label: "Отказаться",      goto: "wh_refuse_price"},
          {label: "Идти к вратам",   goto: "wh_gate_approach"}
        ]
      },

      wh_refuse_price: {
        title: "ОТКАЗ",
        text: `— Тогда ты заплатишь иначе, — тень не исчезает. — Кровью. Своей или чужой. Выбор за тобой.

Врата ждут.`,
        effects: {flag:{refusedMemoryPrice:true}},
        choices: [
          {label: "Идти к вратам", goto: "wh_gate_approach"}
        ]
      },

      wh_gate_approach: {
        title: "ВРАТА",
        text: `Ты входишь в зал. В центре — не дверь. Шов. Ткань реальности растянута и истончена. За ней — синий свет и голоса.

Голоса зовут. Один из них — Кралл. Другой — Он.`,
        onEnter: () => { markQuestObjective("warpHeart", "foundGate"); },
        choices: [
          {label: "Расспросить Голос из Врат", dialogue: "Голос из Врат"},
          {label: "Слушать голос Кралла", goto: "wh_voice_kral"},
          {label: "Слушать голос, назвавшийся Тзинчем",  goto: "wh_voice_tzeentch"},
          {label: "Начать ритуал закрытия", goto: "wh_ritual"}
        ]
      },

      wh_voice_kral: {
        title: "ГОЛОС КРАЛЛА",
        text: (game) => game.character?.name === "Инквизитор Кассий Варро" && game.character?.classId === "inquisitor"
          ? "Ты слышишь знакомые интонации своего наставника. Слова попадают в самое болезненное воспоминание и кажутся правдой, но голос за Вратами нельзя независимо подтвердить."
          : "Ты прислушиваешься к голосу, который называет себя Краллом. Ты не знаешь, действительно ли это сам Кралл или эхо Варпа, использующее его имя.",
        effects: {flag:{kralVoice:true}, corruption:1},
        onEnter: () => { markQuestObjective("warpHeart", "engagedVoice"); },
        choices: [
          {label: "Продолжить разговор с голосом",      goto: "wh_voice_tzeentch"},
          {label: "Начать ритуал",       goto: "wh_ritual"}
        ]
      },

      wh_voice_tzeentch: {
        title: "ГОЛОС, НАЗВАВШИЙ ИМЯ ТЗИНЧА",
        text: "Ты говоришь с голосом, который утверждает, что существовал до времени. Он предлагает всё, чего ты желал. Его слова кажутся безупречными — но впечатление не доказывает ни личность собеседника, ни правдивость обещаний. Даже знакомые символы могут быть приманкой, чужой памятью или искажением Варпа.",
        effects: {flag:{heardVoiceOfTzeentch:true}, corruption:2},
        onEnter: () => { markQuestObjective("warpHeart", "engagedVoice"); },
        choices: [
          {label: "Отвергнуть его",      goto: "wh_reject_tzeentch"},
          {label: "Слушать дальше",      goto: "wh_listen_tzeentch"},
          {label: "Начать ритуал",       goto: "wh_ritual"}
        ]
      },

      wh_reject_tzeentch: {
        title: "ОТВЕРЖЕНИЕ",
        text: "Ты отворачиваешься. Тебе слышится смех, но голос не преследует тебя. Свобода выбора может быть и даром, и оружием того, кто предлагает сделку; ты не знаешь, что именно произошло в этом зале.",
        effects: {corruption:-1, flag:{refusedWarpHeart:true}},
        choices: [
          {label: "Начать ритуал", goto: "wh_ritual"}
        ]
      },

      wh_listen_tzeentch: {
        title: "ВНИМАТЬ ГОЛОСУ",
        text: "Ты слушаешь долго. Слова складываются в убедительную картину, будто ты вспоминаешь то, чего никогда не знал. Что-то в тебе меняется, но ты не можешь установить, вызвано ли это воздействием Варпа, внушением сущности или твоим собственным решением довериться обещанию.",
        effects: {corruption:2, clue:3},
        choices: [
          {label: "Принять Сердце Варпа", goto: "wh_ending_heart",
            effects: {flag:{acceptedWarpHeart:true}, corruption:5}},
          {label: "Отвергнуть предложение и начать ритуал", goto: "wh_ritual"}
        ]
      },

      wh_ritual: {
        title: "РИТУАЛ ЗАКРЫТИЯ",
        text: `Ты становишься перед швом. Голоса стихают.

За спиной раздаётся скрежет сервоприводов. В проходе стоит фигура в силовой броне, покрытой символами Тзинча. Она пока не вмешивается.

Есть три способа закрыть врата: верой, знанием, силой. Каждый требует своей цены.
Одержимый Астартес — сильнее тебя. Бой с ним — почти самоубийство. Лучше закрыть Врата другим способом.`,
        choices: [
          {label: "Сразиться с одержимым Астартес", goto: "wh_combat_marine"},
          {label: "Закрыть верой (молитва и печать)",   goto: "wh_close_faith"},
          {label: "Закрыть знанием (понять и зашить)",  goto: "wh_close_knowledge"},
          {label: "Закрыть силой (уничтожить шов)",     goto: "wh_close_force"}
        ]
      },

        wh_close_faith: {
        title: "ПУТЬ ВЕРЫ",
        text: (game) => {
          const cls = game.character?.classId;
          if (cls === "guardsman") {
            return "Ты читаешь молитву, которой учили в полку. Ту, что читают перед боем. Ту, что не читают в тишине. Печать Инквизиции светится. Шов тянется, сопротивляется, но поддаётся.";
          }
          if (cls === "spaceMarine") {
            return "Ты читаешь молитву, которой учили в Ордене. Ту, что читают перед битвой. Ту, что не читают в тишине. Печать Инквизиции светится. Шов тянется, сопротивляется, но поддаётся.";
          }
          return "Ты читаешь молитву, которой учил Кралл. Печать Инквизиции светится. Шов тянется, сопротивляется, но поддаётся.";
        },
        check: {stat:"wil", dc:16, label:"ЗАКРЫТИЕ ВЕРОЙ"},
        onSuccess: "wh_ending_light",
        onFail: "wh_close_fail"
      },

      wh_close_knowledge: {
        title: "ПУТЬ ЗНАНИЯ",
        text: "Ты читаешь записи Кралла. Понимаешь механизм шва. Ты можешь зашить его — ценой памяти.",
        check: {stat:"int", dc:15, label:"ЗАКРЫТИЕ ЗНАНИЕМ"},
        onSuccess: "wh_ending_shadow",
        onFail: "wh_close_fail"
      },

      wh_close_force: {
        title: "ПУТЬ СИЛЫ",
        text: "Ты поднимаешь оружие. Шов — не дверь, но его можно разорвать. Если хватит силы.",
        check: {stat:"str", dc:17, label:"ЗАКРЫТИЕ СИЛОЙ"},
        onSuccess: "wh_ending_shadow",
        onFail: "wh_close_fail"
      },

      wh_close_fail: {
        title: "ПРОВАЛ РИТУАЛА",
        text: `Шов не поддаётся. Он расширяется. Синий свет заливает зал. Ты слышишь смех — не злой, но окончательный.

Голос, который ты принимаешь за голос Тзинча, произносит: «Ты не готов. Ещё нет. Но ты вернёшься». Ты не можешь установить, насколько этот прогноз правдив.`,
        effects: {corruption:1},
        choices: [
          {label: "Отступить",       goto: "wh_retreat"},
          {label: "Сразиться с тварью, вышедшей из шва", goto: "wh_combat_horror"},
          {label: "Попробовать снова", goto: "wh_ritual"}
        ]
      },

      wh_retreat: {
        title: "ОТСТУПЛЕНИЕ",
        text: `Ты выходишь из зала. Врата остаются открытыми. Свет за спиной не гаснет — он пульсирует, как рана.

Ты знаешь — однажды придётся вернуться. Но не сегодня.

Ты можешь попытаться сдержать Врата перед уходом. Или уйти сейчас, чтобы вернуться позже.`,
        effects: { corruption: 1 },
        choices: [
          { label: "Попытаться сдержать Врата",   goto: "wh_contain" },
          { label: "Уйти, оставив Врата открытыми", goto: "wh_abandon" }
        ]
      },

      wh_contain: {
        title: "СДЕРЖАТЬ ВРАТА",
        text: `Ты оборачиваешься. Читаешь молитву — короткую, злую. Не ту, что учил Кралл. Свою.

Шов не закрывается. Но свет тускнеет. Голоса стихают. Ты выиграл время.`,
        effects: {
          corruption: 1,
          clue: 1,
          flag: { gateContained: true, gateUnclosed: true }
        },
        choices: [
          { label: "Подняться наверх", goto: "wh_ending_shadow" }
        ]
      },

      wh_abandon: {
        title: "ОСТАВИТЬ ВРАТА ОТКРЫТЫМИ",
        text: `Ты уходишь. Не оборачиваешься. Свет за спиной становится ярче — как будто смеётся.

Ты знаешь, что сделал. И знаешь, что вернёшься.

Но не сегодня.`,
        effects: {
          corruption: 2,
          flag: { gateAbandoned: true, gateUnclosed: true }
        },
        choices: [
          { label: "Подняться наверх", goto: "wh_ending_abandoned" }
        ]
      },

       wh_ending_light: {
        title: "ФИНАЛ — СВЕТ",
        text: `Шов закрывается. Свет гаснет. Ты один в тёмном зале.

Ты выходишь наверх. Инквизиция выслушивает доклад. Улей спасён. Ты — герой. Но во снах ты слышишь шёпот. И знаешь: это не конец.`,
        effects: {xp:200, questComplete:"warpHeart", flag:{chapter3Ending:true}},
        onEnter: () => { markQuestObjective("warpHeart", "resolvedRift"); },
        choices: [
          {label: "Продолжить — Суд Ордо", goto: "__chapter4__"} // ← ИЗМЕНЕНО
        ]
      },

                wh_ending_shadow: {
        title: "ФИНАЛ — ТЕНЬ",
        text: (game) => {
          const flags = game.world.flags || {};
          if (flags.gateContained) {
            return `Врата сдержаны. Не закрыты — сдержаны. Свет за спиной тусклый, но он есть. Голоса молчат. Пока.

Ты знаешь, что вернёшься. И, возможно, не один.

Инквизиция выслушивает доклад. Улей спасён — на время. Ты — герой — но с оговоркой.`;
          }
          if (flags.closedGateByForce) {
            return `Шов закрывается силой. Взрыв отбрасывает тебя назад. Ты лежишь на полу, оглушённый. Голоса стихли.

Ты не уверен, что они закрыты навсегда. И это знание не уйдёт.

Инквизиция выслушивает доклад. Улей спасён. Ты — герой. Пока.`;
          }
          return `Ты выходишь из улья. Что-то осталось с тобой. Ты не знаешь, что. Но это не уйдёт.`;
        },
            effects: {xp:200, questComplete:"warpHeart", flag:{chapter3Ending:true}},
        onEnter: () => { markQuestObjective("warpHeart", "resolvedRift"); },
        choices: [
          {label: "Продолжить — Суд Ордо", goto: "__chapter4__"}
        ]
      },

            wh_ending_abandoned: {
        title: "ФИНАЛ — ОСТАВЛЕННЫЕ ВРАТА",
        text: `Ты поднимаешься наверх. Улей встречает тебя привычным гулом — но ты слышишь в нём другой ритм. Более глубокий. Более тёмный.

Врата открыты. Ты знаешь это. И знаешь, что вернёшься.

Инквизиция выслушивает доклад. Молча. Когда ты заканчиваешь, Крайс говорит: «Ты оставил их открытыми».

Он не спрашивает. Он утверждает.`,
        effects: {
          xp: 120,
          questComplete: "warpHeart",
          flag: { chapter3Ending: true }
        },
        onEnter: () => { markQuestObjective("warpHeart", "resolvedRift"); },
        choices: [
          { label: "Продолжить — Суд Ордо", goto: "__chapter4__" }
        ]
      },

                  wh_ending_heart: {
        title: "ФИНАЛ — СЕРДЦЕ",
        text: (game) => {
          const cls = game.character?.classId;
          let whoYouWere = "Инквизитор";
          if (cls === "guardsman") whoYouWere = "солдат";
          if (cls === "spaceMarine") whoYouWere = "Астартес";

          return `Ты не закрываешь шов. Ты входишь в него. Синий свет заполняет всё поле зрения, а голос, который ты связываешь с Тзинчем, звучит так близко, будто стал твоим собственным.

На миг тебе кажется, что прежняя роль — ${whoYouWere} — больше ничего не значит. Ты ощущаешь себя частью неведомого плана. Это переживание может быть следствием воздействия Варпа; оно не доказывает, что голос действительно принадлежит Тзинчу или что его обещания правдивы.

Если ты вернёшься, Империум потребует ответа за твой выбор.`;
        },
        onEnter: () => { markQuestObjective("warpHeart", "resolvedRift"); },
        effects: {
          xp: 150,
          questComplete: "warpHeart",
          flag: {
            chapter3Ending: true,
            acceptedWarpHeart: true
          }
        },
        auto: { goto: "__chapter4__", delay: 1500 }
      },

      wh_combat_shadow: {
        title: "БОЙ: ТЕНЬ КРАЛЛА",
        text: "Тень выпрямляется. В её руке — сияющий клинок.",
        combat: "warpEcho",
        returnScene: "wh_gate_approach",
        victoryEffects: {flag:{warpEchoDefeated:true}},
        skipIf: {flag:{warpEchoDefeated:true}},
        skipTo: "wh_gate_approach",
        skipMessage: "Тень уже была повержена. Повторный бой ничего не изменит."
      },

      wh_combat_horror: {
        title: "БОЙ: УЖАС ВАРПА",
        text: "Из шва выходит нечто. Оно улыбается. У него слишком много зубов.",
        combat: "pinkHorror",
        returnScene: "wh_ritual_after_horror",
        victoryEffects: {flag:{warpHorrorDefeated:true}},
        skipIf: {flag:{warpHorrorDefeated:true}},
        skipTo: "wh_ritual_after_horror",   // ← ЭТА СТРОКА ДОЛЖНА БЫТЬ ТАКОЙ
        skipMessage: "Тварь у шва уже уничтожена."
      },
            wh_ritual_after_horror: {
        title: "ПОСЛЕ БОЯ",
        text: `Ужас развеян. Ты стоишь перед швом. Голоса молчат.

Ты устал. Но ты знаешь, что делать. Осталось только выбрать способ.

Ты чувствуешь: если не закроешь сейчас — не закроешь никогда.`,
        choices: [
          { label: "Закрыть верой (молитва и печать)",  goto: "wh_close_faith" },
          { label: "Закрыть знанием (понять и зашить)",  goto: "wh_close_knowledge" },
          { label: "Закрыть силой (уничтожить шов)",     goto: "wh_close_force" }
        ]
      },

      wh_combat_marine: {
        title: "БОЙ: ОДЕРЖИМЫЙ АСТАРТЕС",
        text: "В зал входит фигура в силовой броне. Доспех покрыт символами Тзинча.",
        combat: "corruptedMarine",
        returnScene: "wh_ritual",
        victoryEffects: {flag:{corruptedMarineDefeated:true}},
        skipIf: {flag:{corruptedMarineDefeated:true}},
        skipTo: "wh_ritual",
        skipMessage: "Одержимый Астартес уже повержен."
      },
      wh_ritual_after_horror: {
        title: "ПОСЛЕ БОЯ",
        text: `Ужас развеян. Ты стоишь перед швом. Голоса молчат. Ты устал. Но ты знаешь, что делать.`,
        choices: [
          { label: "Закрыть верой",   goto: "wh_close_faith" },
          { label: "Закрыть знанием", goto: "wh_close_knowledge" },
          { label: "Закрыть силой",   goto: "wh_close_force" }
        ]
      },
    }
  }
};

const CAMPAIGN_SCENARIOS_CH3 = {
  ...CAMPAIGN_CH3
};
