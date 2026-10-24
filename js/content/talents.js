/* ============================================================
   CONTENT / TALENTS.JS — деревья талантов по веткам
   ------------------------------------------------------------
   На уровнях 2, 4, 6, 8, 10, 12 игрок выбирает один талант.
   Три ветки на класс. Взял 3 таланта из одной ветки — специализация.
   ============================================================ */

const TALENT_LEVELS = [2, 4, 6, 8, 10, 12];

const TALENT_TREES = {

  inquisitor: {
    name: "Инквизитор Ордо Херетикус",
    branches: {

      interrogation: {
        name: "Дознание",
        icon: "⚖",
        description: "Ты выжигаешь ересь словом и страхом. Люди боятся тебя — и это работает.",
        specialization: {
          id: "spec-inq-interrogation",
          name: "Мастер допроса",
          desc: "Все проверки ЗАПУГИВАНИЯ и УБЕЖДЕНИЯ получают +3. Раз за бой можешь заставить врага-человека пропустить ход.",
          active: "active-interrogate"
        },
        nodes: [
          {
            level: 2,
            id: "inq-int-1",
            name: "Чтение людей",
            desc: "+2 к проверкам CHA при диалоге.",
            type: "passive",
            effect: (c) => { c._bonusCha = (c._bonusCha || 0) + 2; }
          },
          {
            level: 4,
            id: "inq-int-2",
            name: "Допрос",
            desc: "Активный талант: раз за бой заставить врага-человека пропустить ход.",
            type: "active",
            activeId: "interrogate"
          },
          {
            level: 6,
            id: "inq-int-3",
            name: "Авторитет Инквизиции",
            desc: "+5 к репутации Инквизиции. NPC боятся тебя — но не любят.",
            type: "passive",
            effect: (c) => {
              c.reputation.Inquisition = (c.reputation.Inquisition || 0) + 5;
            }
          },
          {
            level: 8,
            id: "inq-int-4",
            name: "Железная воля",
            desc: "Иммунитет к состоянию «Испуг». Порча растёт на 20% медленнее.",
            type: "passive",
            effect: (c) => { c._immuneFear = true; c._corruptionSlow = true; }
          },
          {
            level: 10,
            id: "inq-int-5",
            name: "Слово Инквизитора",
            desc: "Активный талант: раз за бой заставить всех врагов-людей пропустить ход.",
            type: "active",
            activeId: "word-of-inquisitor"
          },
          {
            level: 12,
            id: "inq-int-6",
            name: "Роза Инквизиции",
            desc: "+10 к репутации Инквизиции. Раз за главу можешь потребовать у любого NPC ответ без проверки.",
            type: "passive",
            effect: (c) => {
              c.reputation.Inquisition = (c.reputation.Inquisition || 0) + 10;
              c._rosetteAuthority = true;
            }
          }
        ]
      },

      puritan: {
        name: "Кара",
        icon: "☠",
        description: "Ересь не переубедить. Её нужно уничтожить — оружием в руках.",
        specialization: {
          id: "spec-inq-puritan",
          name: "Каратель",
          desc: "+2 к урону из лазпистолета. Раз за бой можешь выстрелить дважды подряд.",
          active: "active-execute"
        },
        nodes: [
          {
            level: 2,
            id: "inq-pur-1",
            name: "Боевая стойка",
            desc: "+1 к AC, когда ты атакуешь в этом ходу.",
            type: "passive",
            effect: (c) => { c._attackACBonus = 1; }
          },
          {
            level: 4,
            id: "inq-pur-2",
            name: "Точный выстрел",
            desc: "+1 к урону из лазпистолета.",
            type: "passive",
            effect: (c) => { c._rangedDamageBonus = (c._rangedDamageBonus || 0) + 1; }
          },
          {
            level: 6,
            id: "inq-pur-3",
            name: "Казнь",
            desc: "Активный талант: раз за бой, если враг ниже 25% HP, добить его без проверки.",
            type: "active",
            activeId: "execute"
          },
          {
            level: 8,
            id: "inq-pur-4",
            name: "Инквизиторское право",
            desc: "Урон +1 против культистов и ренегатов. Против демонов — без бонуса.",
            type: "passive",
            effect: (c) => { c._antiHereticBonus = 1; }
          },
          {
            level: 10,
            id: "inq-pur-5",
            name: "Быстрая рука",
            desc: "Перезарядка — свободное действие (не тратит ход врагов).",
            type: "passive",
            effect: (c) => { c._fastReload = true; }
          },
          {
            level: 12,
            id: "inq-pur-6",
            name: "Приговор",
            desc: "При критическом успехе (20) урон удваивается. Раз за бой — гарантированный крит.",
            type: "passive",
            effect: (c) => { c._critMultiplier = 2; c._guaranteedCrit = 1; }
          }
        ]
      },

      scholar: {
        name: "Знание",
        icon: "✦",
        description: "Демонов нельзя убить невежеством. Ты изучаешь Варп, чтобы его победить.",
        specialization: {
          id: "spec-inq-scholar",
          name: "Молеус-инквизитор",
          desc: "+3 к проверкам WIL против Порчи. Молитва очищает на 2 Порчи вместо 1.",
          active: "active-purge"
        },
        nodes: [
          {
            level: 2,
            id: "inq-sch-1",
            name: "Анализ",
            desc: "+2 к проверкам INT при расследовании и анализе улик.",
            type: "passive",
            effect: (c) => { c._bonusInt = (c._bonusInt || 0) + 2; }
          },
          {
            level: 4,
            id: "inq-sch-2",
            name: "Сопротивление Варпу",
            desc: "-1 к получаемой Порче (минимум 1 за раз).",
            type: "passive",
            effect: (c) => { c._corruptionResist = 1; }
          },
          {
            level: 6,
            id: "inq-sch-3",
            name: "Очищение",
            desc: "Активный талант: раз за бой снять 3 Порчи молитвой Императору, не тратя ход.",
            type: "active",
            activeId: "purge"
          },
          {
            level: 8,
            id: "inq-sch-4",
            name: "Знание — оружие",
            desc: "Урон +2 против демонов Тзинча. Ты знаешь их слабости.",
            type: "passive",
            effect: (c) => { c._antiDaemonBonus = 2; }
          },
          {
            level: 10,
            id: "inq-sch-5",
            name: "Истинное имя",
            desc: "Раз за главу можешь назвать истинное имя демона — он теряет 25% HP.",
            type: "passive",
            effect: (c) => { c._trueName = 1; }
          },
          {
            level: 12,
            id: "inq-sch-6",
            name: "Печать Маллеус",
            desc: "Порча больше не может превысить 8. Финальное низвержение недоступно.",
            type: "passive",
            effect: (c) => { c._corruptionCap = 8; }
          }
        ]
      }
    }
  },

  guardsman: {
    name: "Гвардеец Астра Милитарум",
    branches: {

      marksman: {
        name: "Стрелок",
        icon: "✦",
        description: "Ты — тот, кто держит линию огня. Один выстрел — одна цель.",
        specialization: {
          id: "spec-gm-marksman",
          name: "Снайпер",
          desc: "+2 к урону из лазгана. Раз за бой — автоматическое попадание по цели.",
          active: "active-aimed-shot"
        },
        nodes: [
          {
            level: 2,
            id: "gm-mk-1",
            name: "Военная подготовка",
            desc: "+1 к атаке из стрелкового оружия.",
            type: "passive",
            effect: (c) => { c._rangedAttackBonus = (c._rangedAttackBonus || 0) + 1; }
          },
          {
            level: 4,
            id: "gm-mk-2",
            name: "Меткий стрелок",
            desc: "+1 к урону из лазгана.",
            type: "passive",
            effect: (c) => { c._rangedDamageBonus = (c._rangedDamageBonus || 0) + 1; }
          },
          {
            level: 6,
            id: "gm-mk-3",
            name: "Прицельный выстрел",
            desc: "Активный талант: раз за бой автоматическое попадание по цели.",
            type: "active",
            activeId: "aimed-shot"
          },
          {
            level: 8,
            id: "gm-mk-4",
            name: "Быстрая перезарядка",
            desc: "Перезарядка — свободное действие.",
            type: "passive",
            effect: (c) => { c._fastReload = true; }
          },
          {
            level: 10,
            id: "gm-mk-5",
            name: "Залп",
            desc: "Активный талант: раз за бой атаковать дважды из стрелкового оружия.",
            type: "active",
            activeId: "volley"
          },
          {
            level: 12,
            id: "gm-mk-6",
            name: "Снайпер",
            desc: "Критический успех (20) наносит тройной урон. Раз за бой — гарантированный крит.",
            type: "passive",
            effect: (c) => { c._critMultiplier = 3; c._guaranteedCrit = 1; }
          }
        ]
      },

      siege: {
        name: "Осадник",
        icon: "☣",
        description: "Ты не воюешь — ты уничтожаешь позиции. Гранаты, тяжёлое оружие, огонь.",
        specialization: {
          id: "spec-gm-siege",
          name: "Огневая поддержка",
          desc: "+1 граната каждого типа. Урон от гранат +3.",
          active: "active-barrage"
        },
        nodes: [
          {
            level: 2,
            id: "gm-sg-1",
            name: "Гранатомётчик",
            desc: "+1 осколочная граната.",
            type: "passive",
            effect: (c) => {
              if (!c.grenades) c.grenades = {};
              c.grenades["Осколочная граната"] = (c.grenades["Осколочная граната"] || 0) + 1;
            }
          },
          {
            level: 4,
            id: "gm-sg-2",
            name: "Тяжёлое оружие",
            desc: "+2 к урону из стрелкового оружия, но -1 к AC (тяжёлое оружие стесняет движения).",
            type: "passive",
            effect: (c) => {
              c._rangedDamageBonus = (c._rangedDamageBonus || 0) + 2;
              c.ac -= 1;
            }
          },
          {
            level: 6,
            id: "gm-sg-3",
            name: "Осколочный залп",
            desc: "Активный талант: раз за бой бросить 3 гранаты подряд (без перезарядки).",
            type: "active",
            activeId: "barrage"
          },
          {
            level: 8,
            id: "gm-sg-4",
            name: "Крак-гранаты",
            desc: "+2 крак-гранаты.",
            type: "passive",
            effect: (c) => {
              if (!c.grenades) c.grenades = {};
              c.grenades["Крак-граната"] = (c.grenades["Крак-граната"] || 0) + 2;
            }
          },
          {
            level: 10,
            id: "gm-sg-5",
            name: "Осадный ветеран",
            desc: "+1 к урону против врагов в укрытии.",
            type: "passive",
            effect: (c) => { c._siegeBonus = 1; }
          },
          {
            level: 12,
            id: "gm-sg-6",
            name: "Огневая мощь",
            desc: "Все гранаты наносят двойной урон. Раз за бой — бесплатная граната.",
            type: "passive",
            effect: (c) => { c._grenadeDouble = true; c._freeGrenade = 1; }
          }
        ]
      },

      veteran: {
        name: "Ветеран",
        icon: "☠",
        description: "Ты выжил там, где гибли полки. Твоя сила — не в оружии, а в опыте.",
        specialization: {
          id: "spec-gm-veteran",
          name: "Сержант",
          desc: "+5 HP. Все спутники получают +1 AC. Раз за бой можешь отдать приказ.",
          active: "active-command"
        },
        nodes: [
          {
            level: 2,
            id: "gm-vt-1",
            name: "Тактическая выучка",
            desc: "+1 к AC, когда защищаешься.",
            type: "passive",
            effect: (c) => { c._defendBonus = 1; }
          },
          {
            level: 4,
            id: "gm-vt-2",
            name: "Полевой медик",
            desc: "Медикамент восстанавливает +2 HP.",
            type: "passive",
            effect: (c) => { c._medkitBonus = 2; }
          },
          {
            level: 6,
            id: "gm-vt-3",
            name: "Приказ",
            desc: "Активный талант: раз за бой отдать приказ спутнику — он атакует дважды.",
            type: "active",
            activeId: "command"
          },
          {
            level: 8,
            id: "gm-vt-4",
            name: "Ветеран",
            desc: "+5 к максимуму HP.",
            type: "passive",
            effect: (c) => { c.maxHp += 5; c.hp += 5; }
          },
          {
            level: 10,
            id: "gm-vt-5",
            name: "Непоколебимость",
            desc: "Иммунитет к «Испугу» и «Усталости».",
            type: "passive",
            effect: (c) => { c._immuneFear = true; c._immuneFatigue = true; }
          },
          {
            level: 12,
            id: "gm-vt-6",
            name: "Живая легенда",
            desc: "При HP < 25% AC +3. Спутники не могут погибнуть, пока ты жив.",
            type: "passive",
            effect: (c) => { c._lastStandAC = 3; c._companionGuard = true; }
          }
        ]
      }
    }
  },

  spaceMarine: {
    name: "Адептус Астартес, Караул Смерти",
    branches: {

      assault: {
        name: "Штурм",
        icon: "⚔",
        description: "Ты — молот Императора. Ближний бой — твой дом.",
        specialization: {
          id: "spec-sm-assault",
          name: "Штурмовой брат",
          desc: "+2 к урону в ближнем бою. Раз за бой — атаковать дважды.",
          active: "active-assault"
        },
        nodes: [
          {
            level: 2,
            id: "sm-as-1",
            name: "Боевая доктрина",
            desc: "+1 к атаке в ближнем бою.",
            type: "passive",
            effect: (c) => { c._meleeBonus = (c._meleeBonus || 0) + 1; }
          },
          {
            level: 4,
            id: "sm-as-2",
            name: "Цепной меч",
            desc: "+1 к урону в ближнем бою.",
            type: "passive",
            effect: (c) => { c._meleeDamageBonus = (c._meleeDamageBonus || 0) + 1; }
          },
          {
            level: 6,
            id: "sm-as-3",
            name: "Штурмовой порыв",
            desc: "Активный талант: раз за бой атаковать дважды.",
            type: "active",
            activeId: "assault"
          },
          {
            level: 8,
            id: "sm-as-4",
            name: "Ярость Императора",
            desc: "При HP < 50% +2 к атаке в ближнем бою.",
            type: "passive",
            effect: (c) => { c._lowHpMeleeBonus = 2; }
          },
          {
            level: 10,
            id: "sm-as-5",
            name: "Ярость Императора",
            desc: "Активный талант: раз за бой при HP < 50% получить +3 к атаке и +1d6 урона на 3 хода.",
            type: "active",
            activeId: "emperor-wrath"
          },
          {
            level: 12,
            id: "sm-as-6",
            name: "Молот Императора",
            desc: "Все атаки в ближнем бою +3 урона. Раз за бой — гарантированный крит.",
            type: "passive",
            effect: (c) => {
              c._meleeDamageBonus = (c._meleeDamageBonus || 0) + 3;
              c._guaranteedCrit = 1;
            }
          }
        ]
      },

      tactics: {
        name: "Тактика",
        icon: "☠",
        description: "Ты — скальпель, а не молот. Один выстрел — одна цель.",
        specialization: {
          id: "spec-sm-tactics",
          name: "Тактический брат",
          desc: "+2 к урону из болтера. Раз за бой — прицельный выстрел.",
          active: "active-aimed-bolt"
        },
        nodes: [
          {
            level: 2,
            id: "sm-tc-1",
            name: "Тактическая доктрина",
            desc: "+1 к атаке из стрелкового оружия.",
            type: "passive",
            effect: (c) => { c._rangedAttackBonus = (c._rangedAttackBonus || 0) + 1; }
          },
          {
            level: 4,
            id: "sm-tc-2",
            name: "Болтер",
            desc: "+1 к урону из болтера.",
            type: "passive",
            effect: (c) => { c._rangedDamageBonus = (c._rangedDamageBonus || 0) + 1; }
          },
          {
            level: 6,
            id: "sm-tc-3",
            name: "Прицельный выстрел",
            desc: "Активный талант: раз за бой автоматическое попадание.",
            type: "active",
            activeId: "aimed-shot"
          },
          {
            level: 8,
            id: "sm-tc-4",
            name: "Анализ слабостей",
            desc: "Анализ врага раскрывает имя, HP и AC автоматически (без проверки).",
            type: "passive",
            effect: (c) => { c._autoAnalyze = true; }
          },
          {
            level: 10,
            id: "sm-tc-5",
            name: "Бронебойные патроны",
            desc: "+2 к урону против врагов в силовой броне.",
            type: "passive",
            effect: (c) => { c._armorPiercing = 2; }
          },
          {
            level: 12,
            id: "sm-tc-6",
            name: "Караул Смерти",
            desc: "Все стрелковые атаки +2 урона. Раз за бой — гарантированный крит.",
            type: "passive",
            effect: (c) => {
              c._rangedDamageBonus = (c._rangedDamageBonus || 0) + 2;
              c._guaranteedCrit = 1;
            }
          }
        ]
      },

      resilience: {
        name: "Устойчивость",
        icon: "✚",
        description: "Ты — не человек. Ты — оружие Императора. Оружие не ломается.",
        specialization: {
          id: "spec-sm-resilience",
          name: "Ветеран Караула",
          desc: "+8 HP. Иммунитет к кровотечению. Раз за бой — восстановить 15 HP.",
          active: "active-recover"
        },
        nodes: [
          {
            level: 2,
            id: "sm-rs-1",
            name: "Броня Астартес",
            desc: "-1 к получаемому урону.",
            type: "passive",
            effect: (c) => { c._damageReduction = (c._damageReduction || 0) + 1; }
          },
          {
            level: 4,
            id: "sm-rs-2",
            name: "Трансчеловечность",
            desc: "Иммунитет к «Отравлению» и «Кровотечению».",
            type: "passive",
            effect: (c) => { c._immunePoison = true; c._immuneBleed = true; }
          },
          {
            level: 6,
            id: "sm-rs-3",
            name: "Регенерация",
            desc: "Активный талант: раз за бой восстановить 15 HP без медикаментов.",
            type: "active",
            activeId: "recover"
          },
          {
            level: 8,
            id: "sm-rs-4",
            name: "Каталепсический узел",
            desc: "При HP < 25% +2 к атаке и +2 к AC.",
            type: "passive",
            effect: (c) => { c._lastStandBonus = 2; c._lastStandAC = 2; }
          },
          {
            level: 10,
            id: "sm-rs-5",
            name: "Геномное семя",
            desc: "Максимум HP +8. Медикаменты восстанавливают +3 HP.",
            type: "passive",
            effect: (c) => { c.maxHp += 8; c.hp += 8; c._medkitBonus = 3; }
          },
          {
            level: 12,
            id: "sm-rs-6",
            name: "Неуязвимость",
            desc: "Первые 10 урона в бою игнорируются. Раз за бой — автоматическое выживание при 0 HP.",
            type: "passive",
            effect: (c) => { c._damageShield = 10; c._autoSurvive = 1; }
          }
        ]
      }
    }
  }
};
