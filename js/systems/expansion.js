/* ============================================================
   EXPANSION.JS — progression, field operations, local exploration,
   contacts, quartermaster, cinematic beats and campaign workshop.
   Fully offline. This expands existing systems instead of replacing them.
   ============================================================ */

const EXPANSION_DOCTRINES = {
  inquisitor: [
    {id:"inq-forensics", name:"Криминалистический анализ", icon:"⌕", desc:"Внимательность к документам, следам и противоречиям.", bonus:{int:2}},
    {id:"inq-interrogator", name:"Искусство допроса", icon:"⚖", desc:"Точнее формулирует вопросы, не подменяя доказательства давлением.", bonus:{cha:2}},
    {id:"inq-warded", name:"Осторожность перед Варпом", icon:"✠", desc:"Подготовка к психологическому давлению и варп-аномалиям.", bonus:{wil:1, corruptionResistance:1}},
    {id:"inq-seal-protocol", name:"Протоколы Ордо", icon:"⚖", desc:"Знание процедуры оформления досье, полномочий и цепочки хранения доказательств.", bonus:{cha:1, int:1}}
  ],
  guardsman: [
    {id:"guard-fireteam", name:"Огневая дисциплина", icon:"⌖", desc:"Отточенная стрельба и выбор момента для выстрела.", bonus:{dex:1, ranged:1}},
    {id:"guard-survivor", name:"Выживание в улье", icon:"⛨", desc:"Полевые навыки, наблюдение и поиск безопасных маршрутов.", bonus:{wil:1, explore:2}},
    {id:"guard-medic", name:"Полевая медицина", icon:"✚", desc:"Рациональное применение ограниченных медикаментов.", bonus:{con:1, healing:3}},
    {id:"guard-veteran", name:"Ветеранское чутьё", icon:"⚑", desc:"Навык распознавать опасные маршруты и удерживать отделение под давлением.", bonus:{wil:1, dex:1}}
  ],
  spaceMarine: [
    {id:"marine-bolter", name:"Доктрина болтера", icon:"⌖", desc:"Выверенные очереди и контроль оружия Астартес.", bonus:{dex:1, ranged:2}},
    {id:"marine-tactician", name:"Тактический анализ", icon:"⚙", desc:"Чтение поля боя и поиск уязвимостей противника.", bonus:{int:2, explore:1}},
    {id:"marine-endurance", name:"Неумолимое наступление", icon:"⚔", desc:"Поддержание боеспособности под тяжёлым огнём.", bonus:{con:2, melee:1}},
    {id:"marine-squad-leader", name:"Тактическое командование", icon:"⚜", desc:"Подготовка к координации боевого отделения и оценке целей. Не заменяет устав и полномочия офицеров Ордена.", bonus:{int:1, wil:1}}
  ]
};

const EXPANSION_OPERATION_DEFS = [
  {
    id:"worker-relief", title:"Эвакуация рабочих", location:"Промзона", icon:"⚙",
    description:"Несколько выживших скрываются между остановленными конвейерами. До прибытия следующей смены надо либо подтвердить их личности, либо вывести их из сектора.",
    evidence:"workerManifest", xp:55, credits:45, faction:"Militarum",
    approaches:[
      {id:"verify", label:"Сверить жетоны и журнал смены", stat:"int", dc:12, bonusFlag:"sawOrder117", success:"Записи и жетоны согласуются. Несколько рабочих эвакуированы, а список передан гарнизону.", fail:"В журналах есть пропуски. Рабочих удаётся вывести, но список нуждается в повторной проверке."},
      {id:"escort", label:"Организовать прикрытый выход", stat:"dex", dc:13, bonusFlag:"deducedWorkersTaken", success:"Ты организуешь безопасный проход и выводишь рабочих под прикрытием.", fail:"Маршрут оказывается опаснее ожидаемого. Рабочие уходят, но часть документов остаётся в секторе."}
    ]
  },
  {
    id:"archives-audit", title:"Аудит архивной записи", location:"Архив", icon:"▤",
    description:"В соседнем массиве обнаружена дублированная запись о перемещении оборудования. Нужно отделить техническую ошибку от намеренного вмешательства.",
    evidence:"cogitatorLog", xp:65, credits:35, faction:"Inquisition",
    approaches:[
      {id:"compare", label:"Сопоставить время, подписи и контрольные суммы", stat:"int", dc:13, bonusFlag:"sawOrder117", success:"В трёх копиях остаётся одинаковый разрыв временной метки. Запись доказывает вмешательство в архив, но не раскрывает исполнителя.", fail:"Часть метаданных повреждена. Несоответствие отмечено, однако для вывода нужны дополнительные источники."},
      {id:"request", label:"Запросить подтверждение у архивного служителя", stat:"cha", dc:12, bonusFlag:"deducedHestAuthorization", success:"Служитель подтверждает, что запись проходила вне обычной очереди. Его слова занесены как свидетельство, а не как доказательство личности виновного.", fail:"Служитель отказывается подписывать заявление. Ты фиксируешь сам факт отказа, не трактуя его как признание."}
    ]
  },
  {
    id:"supply-audit", title:"Несходящиеся номера снабжения", location:"Склад", icon:"▣",
    description:"В накладных на медикаменты и боеприпасы расходятся серийные номера. Проверка может помочь отряду, но обвинение в хищении без доказательств создаст конфликт с гарнизоном.",
    evidence:"supplySerials", xp:50, credits:70, faction:"PDF",
    approaches:[
      {id:"ledger", label:"Проверить накладные и номера контейнеров", stat:"int", dc:12, bonusFlag:"none", success:"Установлено, что два контейнера были перенаправлены. Личность инициатора пока не установлена.", fail:"Накладные частично утрачены. Несходящиеся номера зафиксированы, но обвинение делать рано."},
      {id:"negotiate", label:"Попросить старшего склада открыть резерв", stat:"cha", dc:13, bonusFlag:"none", success:"Старший выдаёт часть резерва под расписку; спорные номера остаются предметом отдельной проверки.", fail:"Старший отказывает без подписанного приказа. Потеря времени отмечена в журнале."}
    ]
  },
  {
    id:"morgue-audit", title:"Сверка морговых книг", location:"Морг", icon:"☠",
    description:"В книге приёма останков не хватает нескольких строк. Нужно проверить номера контейнеров и время передачи, не делая выводов о личности погибших по одному повреждённому листу.",
    evidence:"morgueTally", xp:55, credits:30, faction:"Inquisition",
    approaches:[
      {id:"register", label:"Сопоставить номера контейнеров и квитанции", stat:"int", dc:13, bonusFlag:"cogitatorLog", success:"Две записи были перенесены в другой журнал. Хронология становится яснее, но личности погибших требуют отдельного подтверждения.", fail:"Часть квитанций испорчена влагой. Пропуск в книге зафиксирован как факт, а не как доказательство сокрытия тел."},
      {id:"interview", label:"Поговорить с дежурным без обвинений", stat:"cha", dc:12, bonusFlag:"none", success:"Дежурный вспоминает аварийную смену и указывает, где искать дубликат журнала. Его память отмечена как свидетельство.", fail:"Дежурный не доверяет незнакомцу и не подписывает показания. Это не считается признанием."}
    ]
  },
  {
    id:"relay-audit", title:"Диагностика временных меток", location:"Технический узел", icon:"⌘",
    description:"Повторитель связи передавал записи с несовпадающими метками времени. Проверка должна различить сбой синхронизации, ручное изменение и необъяснённую аномалию.",
    evidence:"relayDiagnostics", xp:60, credits:40, faction:"Mechanicus",
    approaches:[
      {id:"checksum", label:"Сверить локальную память и контрольные суммы", stat:"int", dc:13, bonusFlag:"deducedTemporalAnomaly", success:"Повторитель действительно хранит несогласованные отметки. Технический сбой подтверждён, но его причина не установлена.", fail:"Память частично затёрта. Найдено расхождение, недостаточное для вывода о вмешательстве или воздействии Варпа."},
      {id:"isolate", label:"Изолировать узел и снять диагностический отчёт", stat:"wil", dc:12, bonusFlag:"none", success:"Узел безопасно изолирован, а диагностический отчёт сохранён для Механикус. Сам отчёт не указывает на конкретного виновного.", fail:"Изоляция заняла больше времени и вызвала тревогу. Узел остаётся объектом повторной проверки."}
    ]
  }
];

const EXPANSION_ARMORY = [
  {id:"medkit", name:"Медикамент", kind:"item", price:35, desc:"Одноразовая полевая аптечка.", quantity:1},
  {id:"repair-kit", name:"Ремкомплект", kind:"item", price:25, desc:"Для устранения заклинивания и мелкого ремонта.", quantity:1},
  {id:"ammo-pack", name:"Боекомплект к текущему оружию", kind:"ammo", price:18, desc:"Совместимый резерв: энергоячейки, болты, плазменные ячейки или картриджи — по типу экипированного оружия.", quantity:12},
  {id:"frag-grenade", name:"Осколочная граната", kind:"grenade", price:28, desc:"Против группы незащищённых целей.", quantity:1},
  {id:"krak-grenade", name:"Крак-граната", kind:"grenade", price:55, desc:"Редкий бронебойный заряд; в игре это ограниченный ресурс.", quantity:1},
  {id:"lasgun", name:"Лазган", kind:"ranged", price:85, desc:"Надёжное стандартное оружие Астра Милитарум.", requires:["guardsman","inquisitor"]},
  {id:"autogun", name:"Штурмовая винтовка", kind:"ranged", price:105, desc:"Обычное пороховое оружие; доступность зависит от местного снабжения.", requires:["guardsman","inquisitor"]},
  {id:"bolter", name:"Болтер", kind:"ranged", price:220, desc:"Оружие редкого снабжения; выдача человеку требует обоснованного допуска.", requires:["spaceMarine","inquisitor"], rep:{Inquisition:-5}},
  {id:"plasma", name:"Плазмаган", kind:"ranged", price:260, desc:"Редкое энергетическое оружие с риском перегрева; требует допуска и осторожного обращения.", requires:["guardsman","inquisitor","spaceMarine"], rep:{Mechanicus:-10}},
  {id:"chainsword", name:"Цепной меч", kind:"melee", price:115, desc:"Оружие ближнего боя с цепным лезвием.", requires:["guardsman","inquisitor","spaceMarine"]},
  {id:"power-sword", name:"Силовой меч", kind:"melee", price:300, desc:"Редкое энергетическое оружие с жёсткими требованиями к снабжению.", requires:["inquisitor","spaceMarine"], rep:{Inquisition:0}},
  {id:"reinforced-flak", name:"Усиленная флак-броня", kind:"armor", price:125, desc:"Усиленная защита для смертного бойца.", ac:16, requires:["guardsman","inquisitor"]},
  {id:"carapace", name:"Карапасная броня", kind:"armor", price:245, desc:"Тяжёлая защитная экипировка для допущенных агентов и элитных бойцов.", ac:17, requires:["guardsman","inquisitor"]}
];

const EXPANSION_CONTACTS = [
  {name:"Сержант Кейн", id:"kane", icon:"⚔", role:"Командир местной PDF", actions:[
    {id:"debrief", label:"Обсудить отчёт гарнизона", desc:"Поделиться проверенными сведениями и запросить содействие.", delta:1, need:()=>Boolean(GAME.npcs?.["Сержант Кейн"]?.met), text:"Кейн отмечает, что отделению проще действовать, когда доклад отделяет увиденное от слухов."},
    {id:"support", label:"Попросить помощь при эвакуации", desc:"Просьба требует ясной задачи и не гарантирует подкрепление.", delta:1, need:()=>Boolean(GAME.npcs?.["Сержант Кейн"]?.met) && (GAME.world.flags.deducedWorkersTaken || GAME.world.flags.patrolSurvivorSaved), text:"Кейн выделяет ограниченную помощь гарнизона. Он не обещает подразделение, которого у него нет."}
  ]},
  {name:"Магос Хест", id:"hest", icon:"⚙", role:"Техножрец Адептус Механикус", actions:[
    {id:"technical", label:"Запросить техническую оценку", desc:"Технический анализ не устанавливает мотивы и не заменяет расследование.", delta:0, need:()=>Boolean(GAME.npcs?.["Магос Хест"]?.met), text:"Хест объясняет, что архивная аномалия может быть вызвана ошибкой передачи, вмешательством оператора или неизвестным воздействием. Он отказывается считать одну из причин доказанной."},
    {id:"share-proof", label:"Предъявить проверяемые документы", desc:"Доступно после обнаружения приказа или печати.", delta:1, need:()=>Boolean(GAME.npcs?.["Магос Хест"]?.met) && (hasEvidence("order117") || hasEvidence("hestSeal")), text:"Хест подтверждает технические свойства печати, но не признаёт и не опровергает неизвестные мотивы. Документальная связь записана отдельно от гипотезы о культе."}
  ]},
  {name:"Лира Доминик", id:"lyra", icon:"✦", role:"Свидетель и возможная спутница", actions:[
    {id:"checkin", label:"Проверить, как она справляется", desc:"Спокойный разговор без давления помогает сохранить доверие.", delta:2, need:()=>Boolean(GAME.npcs?.["Лира Доминик"]?.met || GAME.world.flags.lyraCompanion), text:"Лира говорит о погибшем отделении. Ты выслушиваешь её, не требуя немедленно возвращаться к месту гибели."},
    {id:"memory", label:"Разобрать жетон отделения", desc:"Небольшой личный эпизод, не раскрывающий новые сведения о Варпе.", delta:1, need:()=>Boolean(GAME.world.flags.lyraCompanion || GAME.world.flags.lyraStaysFinal), text:"На жетоне нет ответа о судьбе отделения, но для Лиры важно, что память о товарищах не сведена к строке отчёта."}
  ]}
];

function ensureExpansionState(){
  if(!GAME.world || typeof GAME.world !== "object") GAME.world = {};
  const raw = GAME.world.expansion;
  const e = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  e.operations = e.operations && typeof e.operations === "object" && !Array.isArray(e.operations) ? e.operations : {};
  e.exploration = e.exploration && typeof e.exploration === "object" && !Array.isArray(e.exploration) ? e.exploration : {};
  e.interactions = e.interactions && typeof e.interactions === "object" && !Array.isArray(e.interactions) ? e.interactions : {};
  e.personalQuests = e.personalQuests && typeof e.personalQuests === "object" && !Array.isArray(e.personalQuests) ? e.personalQuests : {};
  if(!e.personalQuests.lyraDogtags || typeof e.personalQuests.lyraDogtags !== "object") e.personalQuests.lyraDogtags = {status:"available", attempts:{}, history:[]};
  const lyraQuest = e.personalQuests.lyraDogtags;
  if(!["available","active","complete","closed"].includes(lyraQuest.status)) lyraQuest.status = "available";
  lyraQuest.attempts = lyraQuest.attempts && typeof lyraQuest.attempts === "object" && !Array.isArray(lyraQuest.attempts) ? lyraQuest.attempts : {};
  lyraQuest.history = Array.isArray(lyraQuest.history) ? lyraQuest.history : [];
  e.drafts = Array.isArray(e.drafts) ? e.drafts.filter(d => d && typeof d === "object") : [];
  e.cinematicHistory = Array.isArray(e.cinematicHistory) ? e.cinematicHistory : [];
  if(!e.cinematic || typeof e.cinematic !== "object") e.cinematic = null;
  if(!e.editorForm || typeof e.editorForm !== "object") e.editorForm = {id:"",title:"",description:"",choiceLabel:"",goto:""};
  GAME.world.expansion = e;
  const c = GAME.character;
  if(c){
    c.doctrines = Array.isArray(c.doctrines) ? [...new Set(c.doctrines.filter(x => typeof x === "string"))] : [];
    c.doctrinePoints = Math.max(0, Math.min(20, Math.floor(Math.max(1,c.level||1)/3) - c.doctrines.length));
    c.doctrineChoices = Array.isArray(c.doctrineChoices) ? c.doctrineChoices.filter(x => typeof x === "string") : [...c.doctrines];
    if(!Number.isFinite(c.fieldSupplyBonus)) c.fieldSupplyBonus = 0;
  }
  return e;
}

function initializeExpansionSystems(){
  const e = ensureExpansionState();
  for(const def of EXPANSION_OPERATION_DEFS){
    if(!e.operations[def.id] || typeof e.operations[def.id] !== "object") e.operations[def.id] = {status:"available", attempts:0, history:[]};
    if(!["available","active","complete"].includes(e.operations[def.id].status)) e.operations[def.id].status = "available";
    if(!Array.isArray(e.operations[def.id].history)) e.operations[def.id].history = [];
    if(!Number.isFinite(e.operations[def.id].attempts)) e.operations[def.id].attempts = 0;
  }
  return e;
}

function getClassDoctrines(){ return EXPANSION_DOCTRINES[GAME.character?.classId] || []; }
function hasDoctrine(id){ return Boolean(GAME.character?.doctrines?.includes(id)); }
function getDoctrineCheckBonus(stat){
  let total = 0;
  for(const d of getClassDoctrines()) if(hasDoctrine(d.id) && Number.isFinite(d.bonus?.[stat])) total += d.bonus[stat];
  return total;
}
function getDoctrineCombatBonus(slot){
  let total = 0;
  for(const d of getClassDoctrines()) if(hasDoctrine(d.id) && Number.isFinite(d.bonus?.[slot])) total += d.bonus[slot];
  return total;
}
function getDoctrineDefenceBonus(){
  return hasDoctrine("marine-endurance") ? 1 : 0;
}
function getDoctrineExploreBonus(){ return getDoctrineCheckBonus("explore"); }
function expansionRelationshipLabel(attitude){
  const n = Number.isFinite(attitude) ? attitude : 0;
  return n >= 12 ? "Высокое доверие" : n >= 5 ? "Доверяет" : n >= 1 ? "Сдержанно расположен" : n <= -8 ? "Враждебен" : n <= -3 ? "Подозревает" : "Нейтрален";
}
function getDoctrineHealingBonus(){ return getDoctrineCheckBonus("healing"); }

function selectDoctrine(id){
  initializeExpansionSystems();
  const c = GAME.character;
  const doctrine = getClassDoctrines().find(d => d.id === id);
  if(!c || !doctrine) return {ok:false,message:"Эта доктрина недоступна выбранному классу."};
  if(c.doctrines.includes(id)) return {ok:false,message:"Эта доктрина уже изучена."};
  if(c.doctrinePoints <= 0) return {ok:false,message:"Нет очков полевой подготовки. Они выдаются на уровнях 3, 6, 9 и 12."};
  c.doctrines.push(id); c.doctrinePoints--;
  const note = `Выбрана доктрина: ${doctrine.name}. ${doctrine.desc}`;
  if(typeof addSystem === "function") addSystem("ПОЛЕВАЯ ПОДГОТОВКА", note);
  if(typeof jlog === "function") jlog("doctrine", {id, name:doctrine.name});
  if(typeof saveGameSilent === "function") saveGameSilent();
  if(typeof renderAll === "function") renderAll();
  return {ok:true,message:note};
}

function renderDevelopmentPanel(){
  initializeExpansionSystems();
  const c=GAME.character, doctrines=getClassDoctrines();
  const learned=new Set(c.doctrines||[]);
  const cards=doctrines.map(d=>`<article class="exp-card ${learned.has(d.id)?"exp-complete":""}"><div class="exp-card-head"><span class="exp-icon">${d.icon}</span><div><h3>${esc(d.name)}</h3><small>${learned.has(d.id)?"ИЗУЧЕНО":"ПОЛЕВАЯ ДОКТРИНА"}</small></div></div><p>${esc(d.desc)}</p><div class="exp-note">Эффект: ${esc(Object.entries(d.bonus||{}).map(([k,v])=>`${k.toUpperCase()} ${v>0?"+":""}${v}`).join(" · "))}</div><button class="secondary-btn" data-doctrine="${d.id}" ${learned.has(d.id)||c.doctrinePoints<=0?"disabled":""}>${learned.has(d.id)?"УЖЕ ИЗУЧЕНО":c.doctrinePoints<=0?"НЕТ ОЧКОВ ПОДГОТОВКИ":"ИЗУЧИТЬ ДОКТРИНУ"}</button></article>`).join("");
  const doctrineLog=(c.doctrines||[]).map(id=>doctrines.find(d=>d.id===id)?.name).filter(Boolean);
  return `<section class="panel exp-panel"><div class="panel-head"><span>ПОЛЕВАЯ ПОДГОТОВКА</span><span>УРОВЕНЬ ${c.level} · ОЧКИ ${c.doctrinePoints}</span></div><div class="panel-body"><p class="exp-intro">На уровнях 3, 6, 9 и 12 открывается по одному очку доктрины. Эти небольшие, детерминированные бонусы дополняют, но не заменяют классические таланты. Они не меняют происхождение персонажа и не дают знания, которых герой не мог получить.</p><div class="exp-grid">${cards}</div><div class="section-title">ИЗУЧЕНО</div>${doctrineLog.length?`<div class="tag-list">${doctrineLog.map(n=>`<span class="tag green">${esc(n)}</span>`).join("")}</div>`:`<div class="exp-note">Пока не выбрано ни одной доктрины.</div>`}<div class="footer-note">Каждая доктрина изучается один раз. При загрузке старых сохранений уровень и уже изученные доктрины нормализуются без сброса сюжетного прогресса.</div></div></section>`;
}

function setExpansionCinematic(title, text, assetKey){
  const e = initializeExpansionSystems();
  const cue = {id:`${GAME.campaign?.scenarioId||"world"}:${GAME.campaign?.sceneId||"scene"}:${GAME.turn||0}:${e.cinematicHistory.length}`, title:String(title||"СОБЫТИЕ").slice(0,100), text:String(text||"").slice(0,1200), assetKey:assetKey || GAME.character?.location || null, day:GAME.world.day||1, time:typeof timeString === "function" ? timeString() : "--:--", seen:false};
  e.cinematic = cue; e.cinematicHistory.push({...cue});
  if(e.cinematicHistory.length > 60) e.cinematicHistory.splice(0, e.cinematicHistory.length-60);
  return cue;
}
function dismissExpansionCinematic(){ const e=initializeExpansionSystems(); if(e.cinematic) e.cinematic.seen=true; if(typeof saveGameSilent === "function") saveGameSilent(); if(typeof renderAll === "function") renderAll(); }
function renderExpansionCinematic(){
  const cue = initializeExpansionSystems().cinematic;
  if(!cue || cue.seen) return "";
  const src = cue.assetKey && typeof getAsset === "function" ? (getAsset("backgrounds", cue.assetKey) || getAsset("scenes", cue.assetKey)) : null;
  const loaded = !!src;
  return `<section class="panel cinematic-beat ${loaded ? "cinematic-has-image" : ""}" ${loaded ? `style="--cinematic-image:url('../${esc(src)}')"` : ""}><div class="cinematic-kicker">${esc(cue.time)} · ДЕНЬ ${cue.day} · ПОЛЕВАЯ ХРОНИКА</div><h2>${esc(cue.title)}</h2><p>${esc(cue.text)}</p><button class="secondary-btn" data-cinematic-dismiss>ПРОДОЛЖИТЬ</button></section>`;
}

function currentOperationLocationMatches(def){ return GAME.character?.location === def.location; }
function startExpansionOperation(id){
  const e=initializeExpansionSystems(), def=EXPANSION_OPERATION_DEFS.find(x=>x.id===id), op=e.operations[id];
  if(!def || !op) return {ok:false,message:"Операция не найдена."};
  if(op.status === "complete") return {ok:false,message:"Эта операция уже завершена."};
  if(op.status === "active") return {ok:false,message:"Операция уже начата; выбери метод выполнения."};
  if(!currentOperationLocationMatches(def)) return {ok:false,message:`Для начала операции необходимо прибыть в локацию «${def.location}».`};
  op.status="active"; op.startedDay=GAME.world.day||1; op.attempts=0;
  if(typeof setExpansionCinematic === "function") setExpansionCinematic(def.title, def.description, def.location);
  if(typeof addSystem === "function") addSystem("ОПЕРАЦИЯ ПРИНЯТА", `${def.title}\n${def.description}`);
  if(typeof saveGameSilent === "function") saveGameSilent();
  if(typeof renderAll === "function") renderAll();
  return {ok:true,message:`Операция начата: ${def.title}.`};
}

function resolveExpansionOperation(id, approachId){
  const e=initializeExpansionSystems(), def=EXPANSION_OPERATION_DEFS.find(x=>x.id===id), op=e.operations[id];
  if(!def || !op || op.status !== "active") return {ok:false,message:"Сначала начни доступную операцию."};
  if(!currentOperationLocationMatches(def)) return {ok:false,message:"Нельзя выполнить операцию из другой локации."};
  const approach=def.approaches.find(x=>x.id===approachId);
  if(!approach) return {ok:false,message:"Способ выполнения не найден."};
  const hasApproachEvidence = approach.bonusFlag && approach.bonusFlag !== "none" && typeof hasEvidence === "function" && hasEvidence(approach.bonusFlag);
  const bonusKnown = approach.bonusFlag && approach.bonusFlag !== "none" && (GAME.world.flags?.[approach.bonusFlag] || hasApproachEvidence);
  const bonus = bonusKnown ? 2 : 0;
  const roll = checkStat(approach.stat, approach.dc, {label:`ОПЕРАЦИЯ: ${def.title}`, bonus});
  addRoll(formatRoll(roll), rollClass(roll.result));
  const success = roll.result === "success" || roll.result === "critical";
  op.status="complete"; op.attempts++; op.approach=approachId; op.result=success ? "success" : "complication";
  op.completedDay=GAME.world.day||1; op.roll={d20:roll.d20,total:roll.total,dc:roll.dc,bonus:roll.bonus||0,result:roll.result};
  op.history.push({day:op.completedDay,approach:approachId,result:op.result});
  const xp = success ? def.xp : Math.max(10, Math.floor(def.xp/3));
  const credits = success ? def.credits : Math.floor(def.credits/4);
  addXP(xp); GAME.character.credits += credits;
  if(success && def.evidence && typeof recordEvidence === "function") recordEvidence(def.evidence, `operation:${id}`);
  if(success && def.faction && typeof changeRep === "function") changeRep(def.faction, 1);
  else if(!success) GAME.world.heat=Math.min(10,(GAME.world.heat||0)+1);
  if(success && id === "worker-relief" && typeof bumpNPC === "function") bumpNPC("Сержант Кейн", 1);
  if(success && id === "archives-audit" && typeof bumpNPC === "function") bumpNPC("Магос Хест", -1);
  advanceTime(20);
  const outcome=success ? approach.success : approach.fail;
  if(typeof addSystem === "function") addSystem(success ? "ОПЕРАЦИЯ ВЫПОЛНЕНА" : "ОПЕРАЦИЯ С ОСЛОЖНЕНИЯМИ", `${def.title}\n${outcome}\nНаграда: ${xp} XP, ${credits} кредитов.${success && def.evidence ? " Новые сведения внесены в досье." : ""}`);
  if(typeof setExpansionCinematic === "function") setExpansionCinematic(success ? "ОТЧЁТ ПРИНЯТ" : "ДОКЛАД С ОГОВОРКАМИ", outcome, GAME.character.location);
  e.cinematic.seen = false;
  if(typeof continuityRecordEvent === "function") continuityRecordEvent("side-operation", def.title, outcome, {operationId:id, success});
  if(typeof saveGameSilent === "function") saveGameSilent();
  if(typeof renderAll === "function") renderAll();
  return {ok:true,success,message:outcome};
}

function renderOperationsPanel(){
  initializeExpansionSystems();
  const current=GAME.character?.location;
  const cards=EXPANSION_OPERATION_DEFS.map(def=>{
    const op=GAME.world.expansion.operations[def.id];
    const here=currentOperationLocationMatches(def);
    const status=op.status==="complete" ? (op.result==="success" ? "ВЫПОЛНЕНО" : "ЗАВЕРШЕНО С ОСЛОЖНЕНИЯМИ") : op.status==="active" ? "В РАБОТЕ" : here ? "ДОСТУПНО" : `ЛОКАЦИЯ: ${def.location}`;
    const approaches=op.status==="active" ? `<div class="exp-action-grid">${def.approaches.map(a=>`<button class="secondary-btn" data-operation-choice="${def.id}|${a.id}"><b>${esc(a.label)}</b><small>${esc(a.stat.toUpperCase())} · СЛОЖНОСТЬ ${a.dc}</small></button>`).join("")}</div>` : "";
    return `<article class="exp-card ${op.status==="complete"?"exp-complete":""}"><div class="exp-card-head"><span class="exp-icon">${def.icon}</span><div><h3>${esc(def.title)}</h3><small>${esc(def.location)} · ${status}</small></div></div><p>${esc(def.description)}</p>${op.status==="available" && here ? `<button class="danger-btn" data-operation-start="${def.id}">ПРИНЯТЬ ОПЕРАЦИЮ</button>` : ""}${approaches}${op.status==="complete"?`<div class="exp-note">${esc(op.result==="success"?"Операция выполнена. Повторная выдача награды невозможна.":"Операция завершена с осложнениями. Повторная попытка не отменит последствия.")}</div>`:""}</article>`;
  }).join("");
  return `<section class="panel exp-panel"><div class="panel-head"><span>ПЛАНШЕТ ОПЕРАЦИЙ</span><span>${esc(current||"—")}</span></div><div class="panel-body"><p class="exp-intro">Необязательные задания расширяют кампанию, снабжение и расследование. Провал проверки может дать частичный исход и последствия — но не превращает недостаток улик в доказательство вины.</p><div class="exp-grid">${cards}</div><div class="footer-note">Награды и результаты фиксируются в локальном сохранении. Каждая операция разрешается один раз.</div></div></section>`;
}

function exploreCurrentLocation(action){
  const e=initializeExpansionSystems(), c=GAME.character, location=c?.location;
  if(!c || GAME.mode==="combat") return {ok:false,message:"Исследование доступно вне боя."};
  if(!["rest","search"].includes(action)) return {ok:false,message:"Неизвестный тип исследования."};
  const key=`${GAME.world.day||1}:${location}:${action}`;
  if(e.exploration[key]) return {ok:false,message:"Ты уже выполнил это действие в этой локации сегодня."};
  e.exploration[key]={attempted:true};
  if(action==="rest"){
    const old=c.hp; c.hp=Math.min(c.maxHp,c.hp+Math.max(4,Math.floor(c.maxHp*0.25)));
    if(typeof tickCompanionRecovery === "function") { tickCompanionRecovery(); tickCompanionRecovery(); }
    GAME.world.heat=Math.max(0,(GAME.world.heat||0)-1);
    advanceTime(360);
    const healed=c.hp-old;
    addSystem("ПЕРЕДЫШКА", `Ты находишь относительно безопасное место и приводишь снаряжение в порядок. Восстановлено ${healed} HP; тревога снижена на 1. Потрачено 6 часов. В опасных зонах это не гарантирует безопасность.`);
    if(typeof setExpansionCinematic === "function") setExpansionCinematic("ПАУЗА МЕЖДУ ДЕЛАМИ", "Гул улья не прекращается. Отдых лишь возвращает немного сил; угрозы вокруг никуда не исчезли.", location);
  } else if(action === "search"){
    const roll=checkStat("int",12,{label:`ОСМОТР ЛОКАЦИИ: ${location}`,bonus:getDoctrineExploreBonus()});
    addRoll(formatRoll(roll),rollClass(roll.result));
    const ok=roll.result==="success"||roll.result==="critical";
    if(ok){
      GAME.world.clues=(GAME.world.clues||0)+1;
      if(typeof addXP === "function") addXP(10);
      const evidenceMap={"Промзона":"workerManifest","Архив":"cogitatorLog","Склад":"supplySerials","Старый туннель":"elevenMarks","Доки Навигатор":"dockTracks"};
      const evidenceId=evidenceMap[location];
      const found=evidenceId && typeof recordEvidence==="function" ? recordEvidence(evidenceId,`exploration:${location}`) : [];
      addSystem("ОСМОТР", `Осмотр приносит полезную деталь. Получено 10 XP и 1 нить расследования.${found?.length?" Новая запись внесена в досье.":" Прямого нового документа не обнаружено; запись остаётся наблюдением."}`);
      if(typeof setExpansionCinematic === "function") setExpansionCinematic("ДЕТАЛЬ, КОТОРУЮ НЕ ЗАМЕТИЛИ", `В ${location.toLowerCase()} обнаружена деталь, требующая проверки. Даже совпадающий след не доказывает личность виновного.`, location);
    } else {
      GAME.world.heat=Math.min(10,(GAME.world.heat||0)+1);
      addSystem("ОСМОТР С ОГОВОРКОЙ", "Осмотр затянулся, а шум привлёк внимание. Надёжной новой улики не найдено; тревога повышена.");
    }
    advanceTime(15);
  }
  if(typeof saveGameSilent === "function") saveGameSilent();
  if(typeof renderAll === "function") renderAll();
  return {ok:true};
}

function renderExpansionExploration(){
  initializeExpansionSystems();
  const e=GAME.world.expansion, loc=GAME.character.location, day=GAME.world.day||1;
  const restDone=Boolean(e.exploration[`${day}:${loc}:rest`]);
  const searchDone=Boolean(e.exploration[`${day}:${loc}:search`]);
  const districtKey=({"Доки Навигатор":"docks","Промзона":"sectorIX","Техно-капелла":"techChapel","Архив":"archives","Катакомбы":"catacombs","Запечатанный сектор":"catacombs","Старый туннель":"sectorIX","Старый лифт":"catacombs","Технический узел":"techChapel","Новый улей":"newHive"})[loc];
  const district= districtKey && typeof ensureContinuityState==="function" ? ensureContinuityState().districts?.[districtKey] : null;
  const statusMarkup=district ? `<div class="exp-condition-grid"><div><span>СТАБИЛЬНОСТЬ</span><b>${district.stability}/100</b><i><em style="width:${Math.max(0,Math.min(100,district.stability))}%"></em></i></div><div><span>БЕЗОПАСНОСТЬ</span><b>${district.security}/100</b><i><em style="width:${Math.max(0,Math.min(100,district.security))}%"></em></i></div><div><span>РИСК ВАРПА</span><b>${district.warpRisk}/100</b><i><em style="width:${Math.max(0,Math.min(100,district.warpRisk))}%"></em></i></div></div>` : `<div class="exp-note">Для этого района пока нет отдельной сводки состояния. Не делай вывод об отсутствии угрозы только из-за нехватки данных.</div>`;
  const gates=typeof getLocationGateInfo==="function" ? getLocationGateInfo() : [];
  const nearbyLocks=gates.filter(g=>!g.allowed && locationNeighbors().some(n=>n.name===g.key));
  return `<section class="panel exp-exploration"><div class="panel-head"><span>ПОЛЕВОЕ ИССЛЕДОВАНИЕ</span><span>${esc(loc)} · ДЕНЬ ${day}</span></div><div class="panel-body"><p>Осматривай местность, ищи необязательные доказательства и следи за состоянием района. Поиск и отдых доступны один раз на локацию за местные сутки; опасные и запечатанные зоны сохраняют сюжетные ограничения.</p>${statusMarkup}<div class="exp-action-grid"><button class="secondary-btn" data-explore-action="search" ${searchDone?"disabled":""}>⌕ ОСМОТРЕТЬ МЕСТО ${searchDone?"· СЕГОДНЯ УЖЕ ПРОВЕРЕНО":"· 15 МИНУТ"}</button><button class="secondary-btn" data-explore-action="rest" ${restDone?"disabled":""}>⏳ ОТДОХНУТЬ ${restDone?"· СЕГОДНЯ УЖЕ ОТДЫХАЛ":"· 6 ЧАСОВ"}</button></div>${nearbyLocks.length?`<div class="exp-note"><b>ПЕРЕКРЫТЫЕ МАРШРУТЫ</b>${nearbyLocks.map(g=>`<p>${esc(g.label)}: ${esc(g.reason)}</p>`).join("")}</div>`:""}</div></section>`;
}

function performContactAction(contactId, actionId){
  const e=initializeExpansionSystems();
  const contact=EXPANSION_CONTACTS.find(x=>x.id===contactId), action=contact?.actions.find(x=>x.id===actionId);
  if(!contact || !action) return {ok:false,message:"Контакт или действие не найдены."};
  if(!action.need()) return {ok:false,message:"Пока нет оснований для такого разговора. Сначала встреться с персонажем или собери нужные сведения."};
  const key=`${GAME.world.day||1}:${contactId}`;
  if(e.interactions[key]) return {ok:false,message:"Сегодня этот разговор уже состоялся. Новое доверие нужно заслужить поступками, а не повторением одной реплики."};
  e.interactions[key]=actionId;
  if(action.delta && typeof bumpNPC === "function") bumpNPC(contact.name,action.delta);
  if(typeof rememberNPC === "function") rememberNPC(contact.name, action.text, "неформальный разговор", {actionId});
  if(typeof recordDialogueDecision === "function") recordDialogueDecision(contact.name,{label:action.label});
  if(typeof addSystem === "function") addSystem(`РАЗГОВОР · ${contact.name.toUpperCase()}`,`${action.label}\n${action.text}${action.delta?`\nОтношение изменилось на ${action.delta>0?"+":""}${action.delta}.`:""}`);
  if(typeof continuityRecordEvent === "function") continuityRecordEvent("contact",`${contact.name}: ${action.label}`,action.text,{contactId,actionId});
  if(typeof setExpansionCinematic === "function") setExpansionCinematic("ЛИЧНЫЙ МОМЕНТ",action.text, GAME.character.location);
  if(typeof saveGameSilent === "function") saveGameSilent();
  if(typeof renderAll === "function") renderAll();
  return {ok:true,message:action.text};
}

function renderSquadPanel(){
  initializeExpansionSystems();
  const continuity=typeof ensureContinuityState==="function"?ensureContinuityState():null;
  const cards=EXPANSION_CONTACTS.map(contact=>{
    const npc=GAME.npcs?.[contact.name], known=Boolean(npc?.met || (contact.id==="lyra" && GAME.world.flags.lyraCompanion));
    const rel=continuity?.relationships?.[contact.name] || {trust:0,memory:[]};
    const interactions=contact.actions.map(action=>{
      const done=Boolean(GAME.world.expansion.interactions[`${GAME.world.day||1}:${contact.id}`]);
      const can=known && action.need() && !done;
      return `<button class="secondary-btn" data-contact-action="${contact.id}|${action.id}" ${can?"":"disabled"}><b>${esc(action.label)}</b><small>${esc(action.desc)}${done?" · СЕГОДНЯ УЖЕ БЫЛО":!known?" · СНАЧАЛА ВСТРЕТИТЬ":""}</small></button>`;
    }).join("");
    const memories=Array.isArray(rel.memories)?rel.memories.slice(-2):[];
    return `<article class="exp-card"><div class="exp-card-head"><span class="exp-icon">${contact.icon}</span><div><h3>${esc(contact.name)}</h3><small>${esc(contact.role)} · ${known?"КОНТАКТ УСТАНОВЛЕН":"НЕ ВСТРЕЧЕН"}</small></div></div><div class="small-row"><span>Отношение</span><b>${esc(typeof getRelationshipStatus==="function"?getRelationshipStatus(contact.name):expansionRelationshipLabel(npc?.attitude||0))}</b></div><div class="progress"><i style="width:${Math.max(0,Math.min(100,((npc?.attitude||0)+20)/40*100))}%"></i></div><p>${esc(npc?.secret || "Пока нет личных сведений.")}</p><div class="exp-action-grid">${interactions}</div>${memories.length?`<div class="exp-note"><b>Недавняя память</b>${memories.map(m=>`<p>${esc(typeof m==="string"?m:m.text||m.memory||"")}</p>`).join("")}</div>`:""}</article>`;
  }).join("");
  const comps=(GAME.companions||[]).map(c=>`<article class="exp-card"><div class="exp-card-head"><span class="exp-icon">${esc(c.icon||"✦")}</span><div><h3>${esc(c.name)}</h3><small>${esc(c.role||"Спутник")} ${c.utility?"· УТИЛИТАРНЫЙ":"· АКТИВНЫЙ ОТРЯД"}</small></div></div>${c.utility?`<p>Пассивные функции: ${esc(Object.entries(c.passiveBonus||{}).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")||"нет")}</p>`:`<div class="small-row"><span>HP</span><b>${c.hp}/${c.maxHp}</b></div><div class="progress"><i style="width:${Math.max(0,c.hp/c.maxHp*100)}%"></i></div><p>${c.wounded?`Ранен. Восстановление: ${c.recoveryTurns} сцен.`:"Готов к следующему столкновению, если сюжет не ограничивает участие."}</p>`}</article>`).join("");
  const pq=GAME.world.expansion.personalQuests.lyraDogtags;
  const lyraKnown=Boolean(GAME.npcs?.["Лира Доминик"]?.met || GAME.world.flags.lyraCompanion || GAME.world.flags.lyraStaysFinal);
  const questChoices=pq.status==="active"?`<div class="exp-action-grid"><button class="secondary-btn" data-personal-quest="checkpoint" ${GAME.character.location!=="Промзона"||pq.attempts.checkpoint?"disabled":""}>Осмотреть контрольный пункт · ПРОМЗОНА</button><button class="secondary-btn" data-personal-quest="roster" ${GAME.character.location!=="Казармы"||pq.attempts.roster||!GAME.npcs?.["Сержант Кейн"]?.met?"disabled":""}>Сверить список с Кейном · КАЗАРМЫ</button></div>`:"";
  const questStatus=pq.status==="available"?"ДОСТУПНО ПОСЛЕ ЗНАКОМСТВА":pq.status==="active"?"В РАБОТЕ":pq.status==="complete"?"ЗАВЕРШЕНО": "ЗАКРЫТО — ПОПЫТКИ ИСЧЕРПАНЫ";
  const personalQuest=`<article class="exp-card exp-personal-quest"><div class="exp-card-head"><span class="exp-icon">✦</span><div><h3>Жетоны погибшего отделения</h3><small>ЛИЧНОЕ ДЕЛО ЛИРЫ · ${questStatus}</small></div></div><p>Небольшая личная история о памяти павших. Она не раскрывает автоматически причины исчезновений и не превращает совпадение записей в доказательство ереси.</p>${pq.status==="available"&&lyraKnown?`<button class="secondary-btn" data-personal-quest="start">ПРИНЯТЬ ЛИЧНОЕ ДЕЛО</button>`:""}${questChoices}${pq.status==="complete"?`<div class="exp-note">Жетоны собраны. Лира запомнит, что её товарищей не свели к одной строке в рапорте.</div>`:pq.status==="closed"?`<div class="exp-note">Доступные способы проверки исчерпаны; история сохраняет неполный результат, без выдуманного объяснения.</div>`:""}</article>`;
  return `<section class="panel exp-panel"><div class="panel-head"><span>ОТРЯД И КОНТАКТЫ</span><span>${(GAME.companions||[]).length} СПУТНИКОВ</span></div><div class="panel-body"><p class="exp-intro">Союзники не являются расходным бонусом. Разговоры ограничены одним содержательным взаимодействием на контакт за местные сутки; новые сведения должны оставаться проверяемыми.</p>${comps?`<div class="exp-grid">${comps}</div>`:`<div class="exp-note">Активных спутников пока нет. Сюжетные персонажи присоединяются только при выполнении условий кампании.</div>`}<div class="section-title">ЛИЧНЫЕ СЮЖЕТНЫЕ ЛИНИИ</div><div class="exp-grid">${personalQuest}</div><div class="section-title">КОНТАКТЫ УЛЬЯ</div><div class="exp-grid">${cards}</div></div></section>`;
}

function startLyraPersonalQuest(){
  const e=initializeExpansionSystems(), q=e.personalQuests.lyraDogtags;
  const known=Boolean(GAME.npcs?.["Лира Доминик"]?.met || GAME.world.flags.lyraCompanion || GAME.world.flags.lyraStaysFinal);
  if(!known) return {ok:false,message:"Сначала познакомься с Лирой или добейся её доверия по основной сюжетной линии."};
  if(q.status!=="available") return {ok:false,message:"Это личное дело уже начато или завершено; повторно выдавать его нельзя."};
  q.status="active"; q.startedDay=GAME.world.day||1;
  const text="Лира просит найти жетоны погибших товарищей. Она не уверена, что они остались в промышленной зоне, и не хочет, чтобы поиск превратился в обвинение без оснований.";
  q.history.push({day:q.startedDay,event:"started",text});
  if(typeof rememberNPC==="function") rememberNPC("Лира Доминик",text,"личное задание",{questId:"lyraDogtags"});
  if(typeof continuityRecordEvent==="function") continuityRecordEvent("personal-quest","Жетоны отделения Лиры",text,{questId:"lyraDogtags",status:"active"});
  setExpansionCinematic("ЛИЧНОЕ ДЕЛО: ЖЕТОНЫ ОТДЕЛЕНИЯ",text,GAME.character.location);
  addSystem("ЛИЧНОЕ ДЕЛО ЛИРЫ",text); saveGameSilent(); renderAll();
  return {ok:true,message:text};
}
function resolveLyraPersonalQuest(approachId){
  const e=initializeExpansionSystems(), q=e.personalQuests.lyraDogtags;
  if(q.status!=="active") return {ok:false,message:"Личное дело не активно."};
  const approaches={
    checkpoint:{location:"Промзона",stat:"dex",dc:12,label:"Осмотреть старый контрольный пункт",success:"На старом посту найдены три жетона и журнал дежурства. Даты совпадают с маршрутом отделения, но не объясняют причину гибели товарищей.",fail:"Пост частично разобран. Следы указывают на прежнее присутствие отделения, но жетоны не найдены."},
    roster:{location:"Казармы",stat:"int",dc:13,label:"Сверить список отделения с сержантом Кейном",success:"Кейн сверяет номерные записи с неполным журналом подразделения. Несколько жетонов удалось учесть; сам список не доказывает, кто виноват в гибели патруля.",fail:"Часть ведомости утрачена, а номера не совпадают. Кейн отказывается угадывать личности по неполным записям."}
  };
  const a=approaches[approachId]; if(!a) return {ok:false,message:"Такого способа нет."};
  if(GAME.character.location!==a.location) return {ok:false,message:`Для этого способа нужно прибыть в локацию «${a.location}».`};
  if(q.attempts[approachId]) return {ok:false,message:"Этот способ уже использован; нельзя повторять ту же проверку ради награды."};
  if(approachId==="roster" && !GAME.npcs?.["Сержант Кейн"]?.met) return {ok:false,message:"Сначала встреться с сержантом Кейном."};
  q.attempts[approachId]=true;
  const roll=checkStat(a.stat,a.dc,{label:`ЛИЧНОЕ ДЕЛО ЛИРЫ: ${a.label}`});
  addRoll(formatRoll(roll),rollClass(roll.result));
  const success=roll.result==="success"||roll.result==="critical";
  const text=success?a.success:a.fail;
  q.history.push({day:GAME.world.day||1,event:success?"success":"failed",approach:approachId,text,roll:{d20:roll.d20,total:roll.total,dc:roll.dc,result:roll.result}});
  if(success){
    q.status="complete"; q.completedDay=GAME.world.day||1;
    addItem("Жетоны погибшего отделения",1); addXP(40);
    if(typeof bumpNPC==="function") bumpNPC("Лира Доминик",2);
    if(typeof rememberNPC==="function") rememberNPC("Лира Доминик",text,"личное задание",{questId:"lyraDogtags",completed:true});
    setExpansionCinematic("ПАМЯТЬ ОТДЕЛЕНИЯ",text,GAME.character.location);
  }else{
    const alternatives=Object.keys(approaches).filter(k=>!q.attempts[k]);
    if(!alternatives.length) q.status="closed";
    if(typeof rememberNPC==="function") rememberNPC("Лира Доминик",text,"личное задание",{questId:"lyraDogtags",completed:false});
    setExpansionCinematic("НЕПОЛНЫЕ СВЕДЕНИЯ",text,GAME.character.location);
  }
  if(typeof continuityRecordEvent==="function") continuityRecordEvent("personal-quest","Жетоны отделения Лиры",text,{questId:"lyraDogtags",approachId,success,status:q.status});
  advanceTime(20); addSystem(success?"ЛИЧНОЕ ДЕЛО ЗАВЕРШЕНО":"ПОИСК НЕ ДАЛ ПОЛНОГО ОТВЕТА",text+(success?" Получены 40 XP и предмет памяти; Лира помнит оказанную помощь.":q.status==="closed"?" Доступные способы исчерпаны; больше попыток не будет.":" Можно попробовать второй независимый источник."));
  saveGameSilent(); renderAll(); return {ok:true,success,message:text};
}

function expansionClassName(id){ return ({inquisitor:"Инквизитор",guardsman:"Гвардеец",spaceMarine:"Космодесантник"})[id] || String(id||""); }
function canUseArmory(item){
  const c=GAME.character; if(!c || !item) return false;
  if(item.requires && !item.requires.includes(c.classId)) return false;
  if(item.rep) for(const [faction,limit] of Object.entries(item.rep)) if((c.reputation?.[faction]||0)<limit) return false;
  // Power armour is deliberately absent from ordinary stock: it is not a generic upgrade for baseline humans.
  return true;
}
function purchaseArmoryItem(id){
  const item=EXPANSION_ARMORY.find(x=>x.id===id), c=GAME.character;
  if(!item || !c) return {ok:false,message:"Товар не найден."};
  if(!canUseArmory(item)) return {ok:false,message:"Требуются соответствующая подготовка, класс или допуск снабжения. Ограничение нельзя обойти покупкой."};
  if((item.kind==="ranged" && c.weapon===item.name) || (item.kind==="melee" && c.meleeWeapon===item.name) || (item.kind==="armor" && c.armor===item.name)) return {ok:false,message:"Этот предмет уже экипирован."};
  if(c.credits < item.price) return {ok:false,message:`Недостаточно кредитов. Нужно ${item.price}, в наличии ${c.credits}.`};
  c.credits -= item.price;
  let note="";
  if(item.kind === "item"){
    addItem(item.name,item.quantity||1); note=`В инвентарь добавлено: ${item.name} ×${item.quantity||1}.`;
  } else if(item.kind === "ammo"){
    const reserveName=getAmmoReserveName(c.weapon);
    addItem(reserveName,item.quantity||1); note=`В инвентарь добавлено: ${reserveName} ×${item.quantity||1}.`;
  } else if(item.kind === "grenade"){
    c.grenades ||= {}; c.grenades[item.name]=(c.grenades[item.name]||0)+(item.quantity||1); note=`Запас увеличен: ${item.name} ×${item.quantity||1}.`;
  } else if(item.kind === "ranged"){
    const w=RANGED_WEAPONS[item.name]; if(!w){c.credits+=item.price;return {ok:false,message:"Оружие отсутствует в справочнике; покупка отменена."};}
    c.weapon=item.name; c.ammo ||= {}; c.ammo[w.ammoType]=Math.min(w.ammoMax, Math.max(c.ammo[w.ammoType]||0,Math.ceil(w.ammoMax/2))); note=`Экипировано: ${item.name}. Боезапас ${c.ammo[w.ammoType]}/${w.ammoMax}.`;
  } else if(item.kind === "melee"){
    if(!MELEE_WEAPONS[item.name]){c.credits+=item.price;return {ok:false,message:"Оружие отсутствует в справочнике; покупка отменена."};}
    c.meleeWeapon=item.name; note=`Экипировано оружие ближнего боя: ${item.name}.`;
  } else if(item.kind === "armor"){
    c.armor=item.name; c.ac=item.ac || ARMOR[item.name]?.ac || c.ac; note=`Экипировано: ${item.name}. Защита AC ${c.ac}.`;
  }
  addSystem("СНАБЖЕНИЕ",`${item.name}\nСтоимость: ${item.price} кредитов.\n${note}`);
  if(typeof jlog === "function") jlog("purchase",{id,item:item.name,price:item.price});
  if(typeof saveGameSilent === "function") saveGameSilent(); if(typeof renderAll === "function") renderAll();
  return {ok:true,message:note};
}
function renderArmoryPanel(){
  const c=GAME.character;
  const stock=EXPANSION_ARMORY.map(item=>{
    const permitted=canUseArmory(item), owned=item.kind==="ranged"?c.weapon===item.name:item.kind==="melee"?c.meleeWeapon===item.name:item.kind==="armor"?c.armor===item.name:false;
    return `<article class="exp-card"><div class="exp-card-head"><span class="exp-icon">${item.kind==="armor"?"⛨":item.kind==="ranged"||item.kind==="melee"?"⚔":"▣"}</span><div><h3>${esc(item.name)}</h3><small>${esc(item.kind.toUpperCase())} · ${item.price} КРЕД.</small></div></div><p>${esc(item.desc)}</p>${item.ac?`<div class="small-row"><span>AC при экипировке</span><b>${item.ac}</b></div>`:""}${item.requires?`<div class="exp-note">Допуск класса: ${esc(item.requires.map(expansionClassName).join(", "))}.</div>`:""}<button class="secondary-btn" data-armory-buy="${item.id}" ${!permitted||c.credits<item.price||owned?"disabled":""}>${owned?"УЖЕ ЭКИПИРОВАНО":!permitted?"НЕТ ДОПУСКА":c.credits<item.price?"НЕДОСТАТОЧНО КРЕДИТОВ":"КУПИТЬ / ЭКИПИРОВАТЬ"}</button></article>`;
  }).join("");
  return `<section class="panel exp-panel"><div class="panel-head"><span>КВАРТЕРМЕЙСТЕР</span><span>${c.credits} КРЕД.</span></div><div class="panel-body"><p class="exp-intro">Это абстрактный интерфейс снабжения, доступный между сценами. Он не означает, что любая военная техника свободно продаётся на рынке: часть предметов требует соответствующего класса или допуска. Силовая броня Астартес не включена в общий торговый каталог.</p><div class="exp-grid">${stock}</div><div class="footer-note">Перед покупкой проверь класс и тип оружия. Новая экипировка не меняет сюжетные факты и не создаёт бесплатные боеприпасы сверх заявленного запаса.</div></div></section>`;
}

function renderCampaignWorkshop(){
  const e=initializeExpansionSystems(), form=e.editorForm, drafts=e.drafts;
  const knownScenes=[];
  if(typeof CAMPAIGN_SCENARIOS!=="undefined") for(const [sid,sc] of Object.entries(CAMPAIGN_SCENARIOS)) for(const sceneId of Object.keys(sc.scenes||{})) knownScenes.push(`${sid}:${sceneId}`);
  const draftCards=drafts.map((d,i)=>`<article class="exp-card"><div class="exp-card-head"><span class="exp-icon">✎</span><div><h3>${esc(d.title||d.id)}</h3><small>${esc(d.id)} → ${esc(d.goto||"—")}</small></div></div><p>${esc(d.description||"")}</p><p><b>Выбор:</b> ${esc(d.choiceLabel||"—")}</p><button class="secondary-btn" data-editor-delete="${i}">УДАЛИТЬ ЧЕРНОВИК</button></article>`).join("");
  return `<section class="panel exp-panel"><div class="panel-head"><span>ЛОКАЛЬНАЯ МАСТЕРСКАЯ КАМПАНИИ</span><span>${drafts.length} ЧЕРНОВИКОВ</span></div><div class="panel-body"><p class="exp-intro">Редактор создаёт локальные черновики сцен и проверяет ссылки. Они не встраиваются автоматически в каноническую кампанию: сначала нужно проверить IDs, сюжетную последовательность и лор. Это авторский инструмент, не поле действий персонажа.</p><div class="exp-editor-form"><label for="editorId">ID сцены (латиница, цифры, дефис)</label><input id="editorId" data-editor-field="id" maxlength="48" value="${esc(form.id||"")}" placeholder="side_scene_01"><label for="editorTitle">Название сцены</label><input id="editorTitle" data-editor-field="title" maxlength="100" value="${esc(form.title||"")}" placeholder="Название сцены"><label for="editorDescription">Описание</label><textarea id="editorDescription" data-editor-field="description" maxlength="1200" rows="4" placeholder="Окружение, наблюдаемые факты и контекст">${esc(form.description||"")}</textarea><label for="editorChoiceLabel">Текст варианта выбора</label><input id="editorChoiceLabel" data-editor-field="choiceLabel" maxlength="180" value="${esc(form.choiceLabel||"")}" placeholder="Например: Сверить записи"><label for="editorGoto">ID целевой сцены</label><input id="editorGoto" data-editor-field="goto" maxlength="48" value="${esc(form.goto||"")}" placeholder="existing_scene_id"><div class="exp-action-grid"><button class="danger-btn" data-editor-action="save">СОХРАНИТЬ ЧЕРНОВИК</button><button class="secondary-btn" data-editor-action="validate">ПРОВЕРИТЬ ССЫЛКИ</button><button class="secondary-btn" data-editor-action="export">ЭКСПОРТИРОВАТЬ JSON</button></div><div class="exp-note">Сцены кампании: ${knownScenes.length}. Проверка не изменяет оригинальные главы.</div></div><div class="section-title">ЛОКАЛЬНЫЕ ЧЕРНОВИКИ</div><div class="exp-grid">${draftCards||`<div class="exp-note">Пока нет черновиков.</div>`}</div><div class="footer-note">Изменения хранятся в сохранении браузера. Для переноса используй экспорт JSON и сохрани файл вместе с проектом.</div></div></section>`;
}

function updateExpansionEditorField(name,value){
  const e=initializeExpansionSystems(); if(!["id","title","description","choiceLabel","goto"].includes(name)) return;
  e.editorForm[name]=String(value||"").slice(0, name==="description"?1200:180);
  saveGameSilent();
}
function saveExpansionDraft(){
  const e=initializeExpansionSystems(), f=e.editorForm;
  const id=String(f.id||"").trim(), title=String(f.title||"").trim(), description=String(f.description||"").trim(), choiceLabel=String(f.choiceLabel||"").trim(), goto=String(f.goto||"").trim();
  if(!/^[a-z][a-z0-9_-]{1,47}$/.test(id)) return {ok:false,message:"ID должен начинаться с латинской буквы и содержать только латиницу, цифры, дефис или подчёркивание."};
  if(!title || !description || !choiceLabel || !goto) return {ok:false,message:"Заполни название, описание, текст выбора и целевую сцену."};
  const other=e.drafts.find(d=>d.id===id); if(other) return {ok:false,message:"Черновик с таким ID уже существует."};
  e.drafts.push({id,title,description,choiceLabel,goto,createdDay:GAME.world.day||1,sourceScenario:GAME.campaign?.scenarioId||null});
  f.id="";f.title="";f.description="";f.choiceLabel="";f.goto="";
  addSystem("МАСТЕРСКАЯ",`Черновик «${title}» сохранён локально. Он не активирован в основной кампании.`);
  saveGameSilent(); renderAll(); return {ok:true,message:"Черновик сохранён."};
}
function validateExpansionDrafts(){
  const e=initializeExpansionSystems(), existing=new Set();
  for(const sc of Object.values(CAMPAIGN_SCENARIOS||{})) for(const id of Object.keys(sc.scenes||{})) existing.add(id);
  const draftIds=new Set(e.drafts.map(d=>d.id));
  const errors=[];
  for(const d of e.drafts){
    if(!/^[a-z][a-z0-9_-]{1,47}$/.test(d.id||"")) errors.push(`${d.id||"(без ID)"}: недопустимый ID`);
    if(e.drafts.filter(x=>x.id===d.id).length>1) errors.push(`${d.id}: повторяющийся ID`);
    const gotoId = String(d.goto||"").includes(":") ? String(d.goto).split(":").slice(1).join(":") : String(d.goto||"");
    if(!existing.has(gotoId) && !draftIds.has(gotoId) && !draftIds.has(d.goto)) errors.push(`${d.id}: целевая сцена «${d.goto}» не найдена ни в кампании, ни среди черновиков`);
    if(existing.has(d.id)) errors.push(`${d.id}: ID конфликтует с действующей сценой`);
  }
  if(typeof addSystem === "function") addSystem(errors.length?"ПРОВЕРКА ЧЕРНОВИКОВ":"ПРОВЕРКА МАСТЕРСКОЙ",errors.length?errors.join("\n"): `Проверено черновиков: ${e.drafts.length}. Ошибок ссылок нет. Это структурная проверка; соответствие лору проверяется отдельно.`);
  return {ok:errors.length===0,errors};
}
function deleteExpansionDraft(index){ const e=initializeExpansionSystems(); if(Number.isInteger(index)&&index>=0&&index<e.drafts.length) e.drafts.splice(index,1); saveGameSilent(); renderAll(); }
function exportExpansionDrafts(){
  const e=initializeExpansionSystems();
  const payload={format:"wh40k-solo-rpg-scene-drafts-v1",exportedAt:new Date().toISOString(),note:"Drafts are not automatically merged into the campaign. Validate links and lore before integration.",drafts:e.drafts};
  if(typeof Blob==="undefined" || typeof URL==="undefined" || typeof document=== "undefined") return JSON.stringify(payload,null,2);
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}), url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url;a.download="wh40k_campaign_drafts.json";a.click();URL.revokeObjectURL(url);return "Экспорт черновиков подготовлен.";
}

/* Extend the existing evidence network with side-mission documents. */
if(typeof INVESTIGATION_EVIDENCE !== "undefined") Object.assign(INVESTIGATION_EVIDENCE, {
  workerManifest:{title:"Список эвакуируемых рабочих",type:"Документ / свидетельство",location:"Промышленный сектор IX",description:"Список жетонов и отметок смены, собранный при эвакуации. Он помогает установить часть личностей работников.",reliability:"Сопоставленный список",caution:"Список не охватывает всех пропавших и не устанавливает, кто организовал их перемещение."},
  cogitatorLog:{title:"Журнал передачи когитатора",type:"Технический журнал",location:"Имперский архив",description:"Контрольные метки указывают, что архивная запись была обработана вне обычной очереди.",reliability:"Техническая запись",caution:"Журнал фиксирует изменение данных, но не называет оператора и не устанавливает его мотив."},
  supplySerials:{title:"Несовпадающие номера контейнеров",type:"Документы снабжения",location:"Склад снабжения",description:"Серийные номера в накладных не совпадают с фактически зарегистрированными контейнерами.",reliability:"Сопоставление записей",caution:"Несовпадение требует проверки; само по себе оно не доказывает кражу или ересь."},
  morgueTally:{title:"Сверенная запись морга",type:"Документ учёта",location:"Городской морг",description:"Найдена копия части книги приёма; несколько контейнеров были отражены в другом журнале.",reliability:"Сопоставление документов",caution:"Запись не устанавливает личности всех погибших и не доказывает злой умысел."},
  relayDiagnostics:{title:"Диагностический отчёт повторителя",type:"Технический отчёт",location:"Технический узел",description:"В памяти повторителя обнаружены несогласованные временные метки.",reliability:"Техническая диагностика",caution:"Причиной могут быть сбой синхронизации, вмешательство оператора или иное воздействие; отчёт не доказывает природу Варпа."}
});
if(typeof INVESTIGATION_LINKS !== "undefined" && !INVESTIGATION_LINKS.some(x => x.id === "workerManifestLink")) INVESTIGATION_LINKS.push(
  {id:"workerManifestLink",title:"Эвакуированные рабочие",requires:["workerManifest","dockTracks"],relation:"Сопоставление маршрута и списка рабочих",detail:"Маршрут и список подтверждают, что часть людей прошла через промышленный сектор.",caution:"Это не устанавливает судьбу всех пропавших и не доказывает виновность конкретного лица."},
  {id:"archiveIntegrityLink",title:"Целостность архивных записей",requires:["cogitatorLog","temporalRecords"],relation:"Техническая запись и хронологическое противоречие",detail:"Несовпадение метаданных заслуживает отдельного аудита.",caution:"Это не доказывает, что причиной стало воздействие Варпа."},
  {id:"morgueLedgerLink",title:"Реестр морга и маршрут пропавших",requires:["morgueTally","workerManifest"],relation:"Сопоставление двух систем учёта",detail:"Часть сведений можно сопоставить между журналом работников и морговым реестром.",caution:"Сходство записей не устанавливает личность неизвестных останков без второго подтверждения."},
  {id:"relayTimeLink",title:"Повторитель и временная шкала",requires:["relayDiagnostics","temporalRecords"],relation:"Техническая диагностика и конфликт дат",detail:"Два источника фиксируют рассогласованные временные метки.",caution:"Это подтверждает проблему синхронизации, но не её причину."}
);
