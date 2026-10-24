/* ============================================================
   CONTENT / ENEMIES.JS — враги сектора IX
   ------------------------------------------------------------
   Культ — Тзинч, Бог Перемен. Интриги, планы, символы.
   ============================================================ */

const ENEMIES = {

  cultist: {
    name: "Культист Тзинча",
    faction:"Chaos",
    hp:12, maxHp:12, ac:11,
    dmg:"1d6", die:6, attack:2, xp:30, loot:["Медикамент"],
    weaknesses:["Огонь","Святое слово"],
    resistances:["Яд"],
    analysisDc:10,
    desc:"Обычный человек, отдавший душу Тзинчу, Богу Перемен. Слаб телом, но верен — и хитрит."
  },

  cult_leader: {
    name: "Культоводитель Тзинча",
    faction:"Chaos",
    hp:22, maxHp:22, ac:13,
    dmg:"1d10", die:10, attack:4, xp:80, loot:["Таинственный фрагмент"],
    weaknesses:["Святая вода","Психическая атака"],
    resistances:["Страх"],
    analysisDc:15,
    desc:"Тот, кто ведёт других по плану, который видит только он. Знает многое — и скажет не всё."
  },

  horror_pink: {
  name: "Розовый Ужас",
  faction:"Chaos",
  hp:22, maxHp:22, ac:14,
  dmg:"1d8", die:8, attack:4, xp:110, loot:["Таинственный фрагмент"],
  weaknesses:["Огонь","Святое слово"],
  resistances:["Обычное оружие","Пси-атаки"],
  analysisDc:16,
  desc:"Младший демон Тзинча. Розовый Ужас. Погибая, распадается на двух Синих Ужасов."
},
horror_blue: {
  name: "Синий Ужас",
  faction:"Chaos",
  hp:10, maxHp:10, ac:12,
  dmg:"1d6", die:6, attack:3, xp:40, loot:["Медикамент"],
  weaknesses:["Огонь"],
  resistances:["Пси-атаки"],
  analysisDc:13,
  desc:"Младший демон Тзинча. Может появиться при разделении Розового Ужаса; численность зависит от обстоятельств столкновения."
},
flamer_tzeentch: {
  name: "Флеймер Тзинча",
  faction:"Chaos",
  hp:28, maxHp:28, ac:15,
  dmg:"1d10", die:10, attack:5, xp:140, loot:["Таинственный фрагмент"],
  weaknesses:["Холод","Святое слово"],
  resistances:["Огонь","Обычное оружие"],
  analysisDc:18,
  desc:"Демон Тзинча, пылающий синим огнём перемен. Не бьёт вблизи — жжёт издалека."
},
screamer: {
  name: "Крикун Тзинча",
  faction:"Chaos",
  hp:16, maxHp:16, ac:14,
  dmg:"1d6", die:6, attack:4, xp:60, loot:[],
  weaknesses:["Тяжёлое оружие"],
  resistances:["Пси-атаки"],
  analysisDc:15,
  desc:"Летающий демон Тзинча. Быстрый, зубастый, издаёт пронзительный визг."
},

  heretic_marine: {
    name: "Еретик-Астартес",
    faction:"Chaos",
    hp:40, maxHp:40, ac:18,
    dmg:"1d12", die:12, attack:6, xp:200, loot:["Таинственный фрагмент"],
    weaknesses:["Пси-атака"],
    resistances:["Боль","Обычное оружие"],
    analysisDc:19,
    desc:"Предатель-Астартес, опасный противник для обычных солдат. Исход столкновения зависит от снаряжения, подготовки, численности и условий боя."
  },

  renegade: {
    name: "Ренегат PDF",
    faction:"RenegadePDF",
    hp:18, maxHp:18, ac:13,
    dmg:"1d8", die:8, attack:3, xp:45, loot:["Ремкомплект"],
    weaknesses:["Газ"],
    resistances:["Автоматическое оружие"],
    analysisDc:12,
    desc:"Бывший солдат Планетарных Сил Обороны. Дезертир. Дерётся по привычке."
  },

  pdf: {
    name: "Солдат PDF",
    faction:"Militarum",
    hp:14, maxHp:14, ac:14,
    dmg:"1d8", die:8, attack:2, xp:35, loot:["Энергоячейки"],
    weaknesses:["Мораль"],
    resistances:[],
    analysisDc:11,
    desc:"Солдат Планетарных Сил Обороны улья. Обычно — не желает драться."
  },

  servitor: {
    name: "Боевой сервитор",
    faction:"Mechanicus",
    hp:20, maxHp:20, ac:15,
    dmg:"1d8", die:8, attack:3, xp:50, loot:["Ремкомплект"],
    weaknesses:["Импульс","ЭМИ"],
    resistances:["Пси-атаки","Боль"],
    analysisDc:13,
    desc:"Биомеханическое создание, чьи когнитивные функции и личность подавлены или перестроены ради заданной службы. Исполняет заложенные функции; степень автономности зависит от типа."
  },

  ork: {
    name: "Орк-бойз",
    faction:"Orks",
    hp:24, maxHp:24, ac:14,
    dmg:"1d10", die:10, attack:3, xp:60, loot:["Медикамент"],
    weaknesses:["Тяжёлое оружие"],
    resistances:["Боль"],
    analysisDc:14,
    desc:"Гринскин. Ксенос. Ищет бой и добычу; масштаб его WAAAGH! зависит от вожака, собравшейся орды и обстоятельств."
  },

    // ---------- Глава III: Сердце Варпа ----------
  pinkHorror:  {name:"Розовый Ужас", faction:"Chaos", hp:22, maxHp:22, ac:14, dmg:"1d8", die:8, attack:4, xp:110, loot:["Таинственный фрагмент"], traits:"Варп; при уничтожении в некоторых столкновениях распадается на Синих Ужасов"},
  blueHorror:  {name:"Синий Ужас", faction:"Chaos", hp:10, maxHp:10, ac:12, dmg:"1d6", die:6, attack:3, xp:40, loot:["Медикамент"], traits:"Варп; численность и поведение зависят от столкновения"},
  tzeentchCultist: {name:"Адепт культа Тзинча", faction:"Chaos", hp:22, maxHp:22, ac:14, dmg:"1d8", die:8, attack:4, xp:90, loot:["Таинственный фрагмент"], traits:"Подготовленный участник культа; колдовство в рамках конкретной сцены"},
  corruptedMarine: {name:"Одержимый Астартес", faction:"Chaos", hp:44, maxHp:44, ac:18, dmg:"1d12", die:12, attack:5, xp:180, loot:["Печать Инквизиции"], traits:"Силовая броня; одержим"},
  warpEcho:    {name:"Эхо Варпа", faction:"WarpAnomaly", hp:16, maxHp:16, ac:15, dmg:"1d10", die:10, attack:4, xp:70, loot:[], traits:"Не имеет плоти; уязвим к вере"}
};
