/* ============================================================
   INVESTIGATION.JS — доска улик и выводов расследования
   Локальная детерминированная система: никаких внешних API/ИИ.
   Доказательство хранится отдельно от интерпретации игрока.
   ============================================================ */

const INVESTIGATION_EVIDENCE = {
  order117: { title: "Приказ 117-Г", type: "Документ", location: "Терминал доков", description: "Работы в секторе IX остановлены по требованию Техно-капеллы; в записи указана печать Магоса Хеста.", reliability: "Документальная запись", caution: "Подтверждает наличие приказа, но не доказывает мотив его автора." },
  dockTracks: { title: "Следы на погрузочной платформе", type: "Вещественная улика", location: "Доки Навигатор", description: "Свежие следы грузового сервитора и тяжёлого ботинка ведут к старому техническому туннелю.", reliability: "Наблюдение", caution: "Следы не устанавливают, кто именно перемещался по туннелю." },
  kaneTestimony: { title: "Показания сержанта Кейна", type: "Свидетельство", location: "Доки Навигатор", description: "Кейн сообщает, что людей увели через технический узел, а приказ 117-Г провела Техно-капелла.", reliability: "Свидетельство", caution: "Кейн не видел всех событий лично; часть сведений получена от подчинённых." },
  hestSeal: { title: "Печать Магоса Хеста", type: "Документальная улика", location: "Ворота сектора IX", description: "На обороте карантинного распоряжения обнаружен оттиск личной печати Хеста.", reliability: "Физический оттиск", caution: "Печать связывает Хеста с распоряжением, но сама по себе не доказывает его участие в культе." },
  elevenMarks: { title: "Одиннадцать знаков", type: "Символы / наблюдение", location: "Старый технический туннель", description: "На стене повторяются одиннадцать символов; часть похожа на метки Механикус, остальные имеют неизвестное происхождение.", reliability: "Непосредственное наблюдение", caution: "Связь с XI Легионом пока является гипотезой, а не доказанным фактом." },
  cultistStatement: { title: "Слова культиста", type: "Свидетельство", location: "Зал в глубине туннеля", description: "Культист говорит об одиннадцати ключах и связывает происходящее с Тзинчем.", reliability: "Заинтересованный свидетель", caution: "Культист может лгать, манипулировать или сам не понимать увиденного." },
  artifactFragment: { title: "Необычный фрагмент", type: "Вещественная улика", location: "Зал в глубине туннеля", description: "Металлический фрагмент испускает неестественный синий свет и вызывает тревожные ощущения.", reliability: "Непосредственное наблюдение", caution: "Природа фрагмента не установлена; не называй его происхождение доказанным." },
  workerMark: { title: "Надпись у рабочего", type: "След / свидетельство", location: "Зал в глубине туннеля", description: "Рядом с выжившим рабочим обнаружена надпись: «Один из одиннадцати уже здесь».", reliability: "Физическая надпись", caution: "Автор неизвестен; смысл надписи открыт для толкования." },
  workerSeal: { title: "Печать с номером 117-Г", type: "Вещественная улика", location: "Зал в глубине туннеля", description: "Рабочий передал печать допуска с номером, совпадающим с приказом 117-Г.", reliability: "Физический предмет", caution: "Номер связывает предмет с приказом, но не раскрывает всю цепочку ответственности." },
  xiArchive: { title: "Архивная папка «Одиннадцатый»", type: "Архивный документ", location: "Архив Запечатанного сектора", description: "В папке собраны фрагменты записей о двери, ритуале и событиях, разделённых десятилетиями.", reliability: "Архивная запись", caution: "Документы неполны; их происхождение и хронология требуют проверки." },
  temporalRecords: { title: "Несовпадающие даты и почерк", type: "Хронологическая улика", location: "Архив Запечатанного сектора", description: "Даты в нескольких записях расходятся, тогда как почерк и состояние бумаги выглядят одинаково.", reliability: "Сопоставление документов", caution: "Несостыковка подтверждена, но её причина не установлена; Варп — возможное, не единственное объяснение." },
  livingGlyphs: { title: "Изменяющиеся знаки", type: "Аномальное наблюдение", location: "Зал в глубине туннеля", description: "Символы визуально дрожат и кажутся живыми; наблюдение сопровождается тревожным ощущением чужого присутствия.", reliability: "Субъективное наблюдение", caution: "Это свидетельство аномалии, но не самостоятельное доказательство конкретной сущности или причины." },
  relayChecksum: { title: "Контрольные суммы ретранслятора", type: "Техническая запись", location: "Ретрансляционный узел Лорес-Секундус", description: "Локальный буфер и резервная копия имеют разные контрольные суммы и несовпадающие временные метки.", reliability: "Повторяемое техническое измерение", caution: "Расхождение установлено, но его причина может быть технической, намеренной или аномальной." },
  survivorStatement: { title: "Показания связиста Талена", type: "Свидетельство", location: "Ретрансляционный узел Лорес-Секундус", description: "Связист сообщает о повторном сигнале после отключения питания и прямо отмечает пробелы в памяти.", reliability: "Подписанное свидетельство", caution: "Свидетель не видел отправителя и не может надёжно определить номер канала." },
  sealFragment: { title: "Фрагмент контрольной пломбы", type: "Вещественная улика", location: "Сервисный кожух ретранслятора", description: "Фрагмент маркированной пломбы совпадает с частью номера в журнале обслуживания.", reliability: "Физический предмет", caution: "Пломба могла быть заменена при ремонте; она не устанавливает личность того, кто открыл корпус." },
  evacuationRoster: { title: "Список эвакуированных", type: "Административная запись", location: "Административный сектор Лорес-Секундус", description: "Часть отметок о времени эвакуации внесена задним числом и требует сопоставления с журналами смен.", reliability: "Документ", caution: "Несвоевременное внесение записи не доказывает намеренную фальсификацию." },
  relayAnomalySummary: { title: "Сводка сверки сигнала", type: "Сводное заключение", location: "Ретрансляционный узел Лорес-Секундус", description: "Контрольные суммы, показания связиста и физическая пломба подтверждают несогласованность материалов.", reliability: "Сопоставление независимых источников", caution: "Подтверждена аномалия в данных, но не источник сигнала, мотив или связь с какой-либо фракцией/Легионом." },
  relayArchivePacket: { title: "Копия архивного пакета", type: "Цифровое доказательство", location: "Архив передачи Лорес-Секундус", description: "Резервная копия содержит последовательность маркеров и фрагменты телеметрии с повреждёнными заголовками.", reliability: "Копия из архивного кэша", caution: "Последовательность из одиннадцати маркеров не доказывает связь с XI Легионом; формат и происхождение пакета требуют экспертизы." }
};

const INVESTIGATION_DEDUCTIONS = {
  hestAuthorization: {
    title: "Хест связан с закрытием сектора",
    description: "Сопоставить приказ, печать и показания Кейна. Вывод касается административной ответственности, а не доказанной ереси.",
    requires: ["order117", "hestSeal", "kaneTestimony"],
    flag: "deducedHestAuthorization",
    status: "обоснованный вывод",
    result: "Документы и свидетельство независимо указывают на роль Хеста в закрытии сектора. Его мотив и осведомлённость о культе пока не установлены."
  },
  workersTaken: {
    title: "Рабочих, вероятно, увели, а не просто потеряли",
    description: "Сопоставить следы на платформе и показания Кейна с сообщением о живом рабочем в глубине.",
    requires: ["dockTracks", "kaneTestimony", "workerMark"],
    flag: "deducedWorkersTaken",
    status: "обоснованный вывод",
    result: "Версия организованного перемещения лучше согласуется с уликами, чем версия обычной аварии. Судьба всех пропавших всё ещё неизвестна."
  },
  cultNetwork: {
    title: "В секторе действует культ Тзинча",
    description: "Сопоставить слова культиста, необычный фрагмент и изменяющиеся знаки.",
    requires: ["cultistStatement", "artifactFragment", "livingGlyphs"],
    flag: "deducedCultNetwork",
    status: "сильное подозрение",
    result: "Совокупность признаков указывает на деятельность культа и вероятное воздействие Варпа. Точная природа аномалии не установлена."
  },
  xiConnection: {
    title: "Гипотеза о связи с XI Легионом",
    description: "Сопоставить одиннадцать знаков, надпись рабочего и слова культиста. Вывод остаётся гипотезой.",
    requires: ["elevenMarks", "workerMark", "cultistStatement"],
    flag: "hypothesisXIConnection",
    status: "неподтверждённая гипотеза",
    result: "Число одиннадцать повторяется в нескольких источниках. Это повод искать дополнительные документы, но не доказательство судьбы или истории XI Легиона."
  },
  temporalAnomaly: {
    title: "В архивах есть временная несостыковка",
    description: "Сопоставить папку «Одиннадцатый» и записи с несовпадающими датами. Зафиксировать аномалию, не утверждая её механизм.",
    requires: ["xiArchive", "temporalRecords"],
    flag: "deducedTemporalAnomaly",
    status: "подтверждённая несостыковка; причина неизвестна",
    result: "Даты и состояние записей противоречат обычной хронологии. Это следует доложить Инквизиции, но нельзя считать доказательством конкретного варп-механизма или судьбы Кралла."
  },
  relaySignalAnomaly: {
    title: "В ретрансляторе подтверждено несоответствие данных",
    description: "Сопоставить контрольные суммы, подписанные показания связиста и физический фрагмент пломбы. Вывод подтверждает несоответствие записей, не указывая на виновного или источник.",
    requires: ["relayChecksum", "survivorStatement", "sealFragment"],
    flag: "wh7EvidenceCrosschecked",
    status: "подтверждённое несоответствие; причина неизвестна",
    result: "Несоответствие ретранслятора подтверждено тремя источниками. Ни один источник не устанавливает отправителя, намерение или связь с Хаосом, ксеносами либо XI Легионом."
  },
  accidentTheory: {
    title: "Принять официальную версию промышленной аварии",
    description: "Можно закрыть дело как аварию, но эта версия плохо объясняет свидетельства и аномальные признаки. Решение будет отмечено как спорное.",
    requires: ["order117", "dockTracks"],
    flag: "acceptedAccidentTheory",
    status: "слабая / противоречивая версия",
    result: "Ты выбираешь не продолжать расследование. В досье останется отметка, что официальная версия не объясняет все найденные сведения."
  }
};

const INVESTIGATION_LINKS = [
  { id:"orderChain", title:"Цепочка приказа 117-Г", requires:["order117","hestSeal","kaneTestimony"], relation:"Взаимное подтверждение административной связи", detail:"Приказ, физическая печать и показания указывают на участие Техно-капеллы в закрытии сектора. Они не доказывают, что Хест знал о культе или действовал из еретических побуждений.", caution:"Ответственность за распоряжение не равна доказанной ереси." },
  { id:"workerRoute", title:"Маршрут пропавших рабочих", requires:["dockTracks","kaneTestimony","workerMark"], relation:"Сходящиеся сведения", detail:"Следы, свидетельство и надпись лучше согласуются с организованным перемещением людей, чем с обычной потерей группы.", caution:"Не установлены личности всех участников и судьба каждого пропавшего." },
  { id:"warpEvidence", title:"Наблюдения аномалии", requires:["artifactFragment","livingGlyphs","cultistStatement"], relation:"Несколько независимых признаков", detail:"Фрагмент, изменяющиеся символы и слова культиста позволяют обоснованно подозревать варп-аномалию и культовую деятельность.", caution:"Слова культиста могут быть ложью; точный механизм и природа фрагмента не установлены." },
  { id:"chronologyConflict", title:"Хронологическое противоречие", requires:["xiArchive","temporalRecords"], relation:"Несовместимые архивные признаки", detail:"Даты, почерк и состояние документов не складываются в обычную последовательность событий.", caution:"Само противоречие реально для расследования, но оно не доказывает конкретный варп-механизм и не раскрывает судьбу Кралла." },
  { id:"elevenHypothesis", title:"Повторение числа одиннадцать", requires:["elevenMarks","workerMark","cultistStatement"], relation:"Повторяющийся мотив / гипотеза", detail:"Число повторяется на стене, в надписи и в словах культиста. Это основание для поиска новых источников.", caution:"Эта связь не подтверждает историю или судьбу XI Легиона." },
  { id:"relayContradiction", title:"Несовпадение данных ретранслятора", requires:["relayChecksum","survivorStatement","sealFragment"], relation:"Техническое измерение + свидетельство + физическая улика", detail:"Три источника сходятся в том, что журнал передачи не согласован с резервной копией и состоянием корпуса.", caution:"Причина и источник сигнала не установлены. Не считать это доказательством ереси или конкретной фракции." },
  { id:"signalArchive", title:"Архивный пакет и одиннадцать маркеров", requires:["relayArchivePacket","relayChecksum"], relation:"Сравнение архива и контрольных сумм", detail:"Сопоставление подтверждает, что архив содержит повреждённый пакет с повторяющимися маркерами.", caution:"Повторение одиннадцати маркеров не доказывает связи с XI Легионом." }
];

function getInvestigationLinks(){
  const state = ensureInvestigationState();
  const found = new Set((state.evidence || []).map(e => e && e.id));
  return INVESTIGATION_LINKS.map(link => {
    const missing = link.requires.filter(id => !found.has(id));
    return { ...link, available: missing.length === 0, missing, found: link.requires.length - missing.length };
  });
}

function ensureInvestigationState(){
  if(!GAME.world || typeof GAME.world !== "object") GAME.world = {};
  const current = GAME.world.investigation;
  if(!current || typeof current !== "object" || Array.isArray(current)){
    GAME.world.investigation = { evidence: [], deductions: {}, history: [] };
  } else {
    if(!Array.isArray(current.evidence)) current.evidence = [];
    if(!current.deductions || typeof current.deductions !== "object" || Array.isArray(current.deductions)) current.deductions = {};
    if(!Array.isArray(current.history)) current.history = [];
  }
  return GAME.world.investigation;
}

function recordEvidence(ids, sourceScene){
  const state = ensureInvestigationState();
  const list = Array.isArray(ids) ? ids : [ids];
  const added = [];
  for(const id of list){
    if(!INVESTIGATION_EVIDENCE[id]) continue;
    if(state.evidence.some(entry => entry && entry.id === id)) continue;
    const entry = { id, day: GAME.world.day || 1, time: typeof timeString === "function" ? timeString() : "--:--", sourceScene: sourceScene || GAME.campaign?.sceneId || "unknown" };
    state.evidence.push(entry);
    added.push(INVESTIGATION_EVIDENCE[id].title);
    if(typeof jlog === "function") jlog("evidence", { evidenceId:id, title:INVESTIGATION_EVIDENCE[id].title });
    if(typeof Bus !== "undefined") Bus.emit("evidence_discovered", { id, title: INVESTIGATION_EVIDENCE[id].title });
  }
  return added;
}

function hasEvidence(id){
  return ensureInvestigationState().evidence.some(entry => entry && entry.id === id);
}

function getDeductionState(id){
  const state = ensureInvestigationState();
  const def = INVESTIGATION_DEDUCTIONS[id];
  if(!def) return { available:false, complete:false, missing:[] };
  const complete = Boolean(state.deductions[id]);
  const missing = def.requires.filter(evidenceId => !hasEvidence(evidenceId));
  return { available: missing.length === 0, complete, missing };
}

function makeInvestigationDeduction(id){
  const def = INVESTIGATION_DEDUCTIONS[id];
  if(!def) return { ok:false, message:"Такой вывод отсутствует в досье." };
  const state = ensureInvestigationState();
  const current = getDeductionState(id);
  if(current.complete) return { ok:false, message:"Этот вывод уже зафиксирован в досье." };
  if(!current.available){
    const missing = current.missing.map(e => INVESTIGATION_EVIDENCE[e]?.title || e).join(", ");
    return { ok:false, message:`Недостаточно данных. Не хватает: ${missing}.` };
  }
  state.deductions[id] = { day: GAME.world.day || 1, status: def.status, flag: def.flag };
  setFlag(def.flag, true);
  state.history.push({ type:"deduction", id, day:GAME.world.day || 1, status:def.status });
  if(typeof jlog === "function") jlog("deduction", { deductionId:id, title:def.title, status:def.status });
  if(typeof saveGameSilent === "function") saveGameSilent();
  return { ok:true, message:`${def.status.toUpperCase()}: ${def.result}` };
}

function getInvestigationAssessments(){
  const evidence = new Set((ensureInvestigationState().evidence || []).map(e => e && e.id));
  const interrogations = GAME.world?.continuity?.interrogations || {};
  const hestAlibi = interrogations["Магос Хест"]?.alibi;
  const hasHestChain = ["order117", "hestSeal", "kaneTestimony"].every(id => evidence.has(id));
  const hasWorkerRoute = ["dockTracks", "kaneTestimony", "workerMark"].every(id => evidence.has(id));
  const hasCultPattern = ["cultistStatement", "artifactFragment", "livingGlyphs"].every(id => evidence.has(id));
  const hasTimeline = evidence.has("xiArchive") && evidence.has("temporalRecords");
  return [
    {id:"hestAlibi", title:"Алиби Магоса Хеста", status:hestAlibi ? "ПОКАЗАНИЕ ЗАПИСАНО" : evidence.has("order117") || evidence.has("hestSeal") ? "МОЖНО ПРОВЕРИТЬ" : "НЕДОСТАТОЧНО ДАННЫХ", detail:hestAlibi ? "Хест дал ответ, но его точное местонахождение независимо не подтверждено." : "Печать и приказ устанавливают административную связь. Для полноценной проверки алиби нужно отдельно опросить Хеста; никакое найденное пока свидетельство не устанавливает его местонахождение." , caution:"Отсутствие подтверждённого алиби не является доказательством вины."},
    {id:"workers", title:"Показания Кейна и маршрут рабочих", status:hasWorkerRoute ? "СВЕДЕНИЯ СОПОСТАВЛЕНЫ" : "ЧАСТИЧНО ПРОВЕРЕНО", detail:hasWorkerRoute ? "Следы, свидетельство и надпись согласуются с версией о перемещении рабочих." : "Пока доступны не все независимые источники для сопоставления маршрута." , caution:"Часть сведений Кейна получена от подчинённых; личное наблюдение ограничено."},
    {id:"cultist", title:"Достоверность слов культиста", status:hasCultPattern ? "ЧАСТИЧНО ПОДТВЕРЖДЕНО" : "НЕ УСТАНОВЛЕНА", detail:hasCultPattern ? "Некоторые детали согласуются с наблюдениями, но сам свидетель заинтересован и может лгать." : "Слова культиста следует проверять по вещественным и независимым свидетельствам." , caution:"Совпадение отдельных деталей не делает все слова культиста достоверными."},
    {id:"timeline", title:"Архивная временная линия", status:hasTimeline ? "ПРОТИВОРЕЧИЕ ЗАФИКСИРОВАНО" : "ОЖИДАЕТ СВЕРКИ", detail:hasTimeline ? "Несовпадение дат установлено, однако причина противоречия не определена." : "Нужны архивная папка «Одиннадцатый» и записи с несовпадающими датами." , caution:"Не считать Варп, Кралла или XI Легион доказанной причиной без независимых сведений."}
  ];
}

function renderInvestigation(){
  const state = ensureInvestigationState();
  const evidenceEntries = state.evidence.filter(entry => entry && INVESTIGATION_EVIDENCE[entry.id]);
  const found = new Set(evidenceEntries.map(entry => entry.id));
  const evidenceCards = evidenceEntries.map(entry => {
    const ev = INVESTIGATION_EVIDENCE[entry.id];
    return `<article class="investigation-card"><div class="investigation-card-head"><span class="investigation-type">${esc(ev.type)}</span><span class="investigation-stamp">ЗАПИСЬ №${String(entry.day).padStart(2,"0")}</span></div><h3>${esc(ev.title)}</h3><p>${esc(ev.description)}</p><div class="investigation-meta"><b>Источник:</b> ${esc(ev.location)} · <b>Основание:</b> ${esc(ev.reliability)}</div><div class="investigation-caution">ОГОВОРКА: ${esc(ev.caution)}</div></article>`;
  }).join("");
  const assessments = getInvestigationAssessments().map(item => `<article class="deduction-card"><div class="deduction-head"><h3>${esc(item.title)}</h3><span>${esc(item.status)}</span></div><p>${esc(item.detail)}</p><div class="investigation-caution">ОГОВОРКА: ${esc(item.caution)}</div></article>`).join("");
  const links = getInvestigationLinks().map(link => `<article class="deduction-card ${link.available ? "deduction-ready" : "deduction-locked"}"><div class="deduction-head"><h3>${esc(link.title)}</h3><span>${link.available ? "СОПОСТАВЛЕНИЕ ДОСТУПНО" : `УЛИКИ ${link.found}/${link.requires.length}`}</span></div><p>${esc(link.relation)}</p><p>${esc(link.available ? link.detail : "Собери связанные материалы: " + link.missing.map(id => INVESTIGATION_EVIDENCE[id]?.title || id).join(", ") + ".")}</p><div class="investigation-caution">ОГОВОРКА: ${esc(link.caution)}</div></article>`).join("");
  const deductions = Object.entries(INVESTIGATION_DEDUCTIONS).map(([id, def]) => {
    const status = getDeductionState(id);
    const saved = state.deductions[id];
    const missingNames = status.missing.map(e => INVESTIGATION_EVIDENCE[e]?.title || e).join(", ");
    return `<article class="deduction-card ${saved ? "deduction-complete" : status.available ? "deduction-ready" : "deduction-locked"}"><div class="deduction-head"><h3>${esc(def.title)}</h3><span>${saved ? "ЗАФИКСИРОВАНО" : status.available ? "ДОСТУПНО" : "НЕДОСТАТОЧНО ДАННЫХ"}</span></div><p>${esc(def.description)}</p>${saved ? `<div class="deduction-result"><b>${esc(saved.status || def.status)}</b><p>${esc(def.result)}</p></div>` : `<div class="deduction-requirements">${status.available ? "Все необходимые улики собраны." : "Нужно найти: " + esc(missingNames)}</div>`}${!saved && status.available ? `<button class="danger-btn investigation-deduce" data-deduction="${esc(id)}">Зафиксировать вывод</button>` : ""}</article>`;
  }).join("");
  return `<section class="panel investigation-panel"><div class="panel-head"><span>ДОСЬЕ РАССЛЕДОВАНИЯ</span><span>${evidenceEntries.length} УЛИК</span></div><div class="panel-body"><div class="investigation-intro"><div class="investigation-seal">✠</div><div><h2>Дело: исчезновения в секторе IX</h2><p>Разделяй наблюдения, свидетельства и гипотезы. Улика подтверждает только то, что действительно позволяет установить; неизвестное остаётся неизвестным.</p></div></div><div class="investigation-stats"><div><b>${evidenceEntries.length}</b><span>собрано улик</span></div><div><b>${Object.keys(state.deductions).length}</b><span>зафиксировано выводов</span></div><div><b>${Object.keys(INVESTIGATION_EVIDENCE).length}</b><span>известно типов улик</span></div></div><h2 class="investigation-section-title">УЛИКИ И СВИДЕТЕЛЬСТВА</h2>${evidenceEntries.length ? `<div class="investigation-grid">${evidenceCards}</div>` : `<div class="empty">Досье пока пусто. Осматривай терминалы, следы, символы и вещественные находки; говори со свидетелями.</div>`}<h2 class="investigation-section-title">ПРОВЕРКА ПОКАЗАНИЙ И АЛИБИ</h2><p class="investigation-note">Неподтверждённое алиби — это пробел в данных, а не автоматическое доказательство вины.</p><div class="deduction-list">${assessments}</div><h2 class="investigation-section-title">СВЯЗИ УЛИК И ПРОТИВОРЕЧИЯ</h2><p class="investigation-note">Сопоставление показывает, какие материалы поддерживают одну версию. Оно не превращает косвенные признаки в доказательство мотива или происхождения.</p><div class="deduction-list">${links}</div><h2 class="investigation-section-title">АНАЛИТИЧЕСКИЕ ВЫВОДЫ</h2><p class="investigation-note">Выводы не появляются автоматически. Ты сам решаешь, какую версию зафиксировать; гипотезы не становятся каноническими фактами только потому, что внесены в досье.</p><div class="deduction-list">${deductions}</div><div class="footer-note">Досье хранится в локальном сохранении и переносится при экспорте кампании.</div></div></section>`;
}
