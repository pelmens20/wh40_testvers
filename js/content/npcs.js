/* ============================================================
   CONTENT / NPCS.JS — NPC улья Хелдон-Прайм
   ============================================================ */

const NPC_DEFS = {

  "Сержант Кейн": {
    name: "Сержант Кейн",
    avatar: "npc-kane",
    role: "Командир отделения Планетарных Сил Обороны (PDF) улья Хелдон-Прайм",
    attitude: 0,
    tags: ["PDF","Гарнизон","Сектор IX"],
    secret: "Скрывает нехватку людей в секторе. Двое его бойцов вернулись из туннеля — и молчат.",
    rumors: [
      {text:"«В техническом узле что-то есть. Что-то, что не хочет, чтобы его видели».", trust:0},
      {text:"«Запечатанный сектор — не про нашу смену. Туда ходили до нас».", trust:5}
    ],
    met: false
  },

  "Магос Хест": {
    name: "Магос Хест",
    avatar: "npc-hest",
    role: "Техножрец Адептус Механикус, приписан к Техно-капелле улья",
    attitude: -5,
    tags: ["Механикус","Техно-капелла"],
    secret: "Изучает неизвестный фрагмент, не сообщая Инквизиции. Фрагмент не из этого мира.",
    rumors: [
      {text:"«Плоть слаба. Машина — вечна. Но не всё, что построено, служит Омниссии».", trust:-10},
      {text:"«Дверь под ульем открыли не мы. Она была открыта до нас».", trust:10}
    ],
    met: false
  },

  "Лира Доминик": {
    name: "Лира Доминик",
    avatar: "npc-lyra",
    role: "Рядовой 22-го резервного полка Астра Милитарум",
    attitude: 0,
    tags: ["Милитарум","Свидетель"],
    secret: "Её отделение пропало за одну ночь после патруля в промзоне. Она не уверена, что выжила случайно.",
    rumors: [
      {text:"«Я слышала, как они звали меня по имени. Но их там не было».", trust:0},
      {text:"«Одиннадцать рабочих. Одиннадцать знаков. Это не совпадение».", trust:8}
    ],
    met: false
  },

  "Связист Тален": {
    name: "Связист Тален",
    avatar: "npc-unknown",
    role: "Техник дальней связи в Лорес-Секундус; гражданский служащий узла",
    attitude: 0,
    tags: ["Свидетель", "Связь", "Лорес-Секундус"],
    secret: "Пережил отключение питания на ретрансляционном узле, но не видел отправителя спорного сигнала.",
    rumors: [
      {text:"«Сигнал повторился после отключения питания. Я не видел, кто его передал». ", trust:0},
      {text:"«Временные метки в дежурном журнале меняли при ремонте, но я не знаю, кем и когда». ", trust:2}
    ],
    met: false
  }
};

function initNPCs(){
  GAME.npcs = {};
  for(const [k,v] of Object.entries(NPC_DEFS)){
    GAME.npcs[k] = JSON.parse(JSON.stringify(v));
  }
}

function normalizeNPCs(){
  if(!GAME.npcs || typeof GAME.npcs !== "object") GAME.npcs = {};
  for(const [name, def] of Object.entries(NPC_DEFS)){
    const existing = GAME.npcs[name];
    if(!existing){ GAME.npcs[name] = JSON.parse(JSON.stringify(def)); continue; }
    existing.name = existing.name || def.name;
    existing.role = existing.role || def.role;
    existing.avatar = existing.avatar || def.avatar;
    existing.tags = Array.isArray(existing.tags) ? existing.tags : [...def.tags];
    existing.rumors = Array.isArray(existing.rumors) ? existing.rumors : JSON.parse(JSON.stringify(def.rumors));
    existing.attitude = Number.isFinite(existing.attitude) ? Math.max(-20, Math.min(20, existing.attitude)) : def.attitude;
    existing.met = Boolean(existing.met);
  }
}

function getNPC(name){ return GAME.npcs && GAME.npcs[name]; }

function npcRelationshipLabel(attitude){
  if(attitude <= -12) return "Враждебность";
  if(attitude <= -5) return "Недоверие";
  if(attitude < 5) return "Нейтралитет";
  if(attitude < 12) return "Расположение";
  return "Доверие";
}

function bumpNPC(name, delta){
  const n = getNPC(name);
  if(!n || !Number.isFinite(delta)) return;
  // Initialize the continuity mirror before changing attitude; otherwise the
  // first-ever delta could be counted twice when no save state exists yet.
  if(typeof ensureContinuityRelationship === "function") ensureContinuityRelationship(name);
  const previous = Number.isFinite(n.attitude) ? n.attitude : 0;
  n.attitude = Math.max(-20, Math.min(20, previous + delta));
  const actualDelta = n.attitude - previous;
  if(actualDelta !== 0){
    Bus.emit("npc_attitude", {name, delta: actualDelta, attitude: n.attitude});
    if(typeof recordContinuityRelationshipChange === "function") recordContinuityRelationshipChange(name, actualDelta, "сюжетное отношение NPC");
  }
}

function markMet(name){
  const n = getNPC(name);
  if(n && !n.met){ n.met = true; Bus.emit("npc_met", {name}); }
}

function availableRumors(name){
  const n = getNPC(name);
  if(!n) return [];
  return n.rumors.filter(r => n.attitude >= r.trust);
}
