/* ============================================================
   CONTINUITY.JS — общий слой решений, отношений, мира и концовок
   Полностью локальная и детерминированная система.
   Существующие флаги остаются источником сюжетной истины;
   этот слой объясняет последствия и переносит их между главами.
   ============================================================ */

const CONTINUITY_DISTRICT_DEFS = {
  docks: { name: "Доки Навигатор", stability: 58, security: 42, warpRisk: 18, note: "Рабочий район и цепочка перемещения пропавших." },
  sectorIX: { name: "Сектор IX", stability: 35, security: 28, warpRisk: 48, note: "Запечатанный промышленный сектор и следы исчезновений." },
  techChapel: { name: "Техно-капелла", stability: 62, security: 54, warpRisk: 25, note: "Зона влияния Адептус Механикус." },
  archives: { name: "Архив Инквизиции", stability: 70, security: 60, warpRisk: 22, note: "Документы, хронология и запечатанное дело." },
  catacombs: { name: "Катакомбы", stability: 24, security: 18, warpRisk: 68, note: "Древние гробницы и следы аномалии." },
  newHive: { name: "Новый улей", stability: 50, security: 46, warpRisk: 38, note: "Следующая точка распространения угрозы." }
};

const CONTINUITY_FLAG_RULES = {
  // Расследование: улики меняют готовность ведомств и риски, но не доказывают мотив.
  deducedHestAuthorization: { label: "Установлена административная цепочка приказа 117-Г", districts: { sectorIX: { security: 3, stability: 2 } }, factions: { Inquisition: 2, Mechanicus: -1 }, memory: { "Магос Хест": "Доказательства связывают его печать с распоряжением; мотив не установлен." } },
  deducedWorkersTaken: { label: "Подтверждена версия организованного перемещения рабочих", districts: { docks: { stability: 4, security: 2 }, sectorIX: { security: 2 } }, factions: { Militarum: 2, PDF: 1 } },
  deducedCultNetwork: { label: "Собраны независимые признаки деятельности культа", districts: { sectorIX: { security: 4, warpRisk: 3 }, catacombs: { warpRisk: 2 } }, factions: { Inquisition: 2, Chaos: 2 } },
  hypothesisXIConnection: { label: "Зарегистрирована неподтверждённая гипотеза о числе одиннадцать", districts: { archives: { security: 1 } }, memory: { "Магос Хест": "В досье появилась гипотеза о повторяющемся числе одиннадцать; доказательств связи с XI Легионом недостаточно." } },
  acceptedAccidentTheory: { label: "Дело предварительно закрыто как авария", districts: { sectorIX: { security: -3, stability: -2, warpRisk: 2 } }, factions: { Inquisition: -1, Militarum: -1 } },
  deducedTemporalAnomaly: { label: "Зарегистрировано хронологическое противоречие", districts: { archives: { security: 3, warpRisk: 2 }, catacombs: { warpRisk: 2 } }, factions: { Inquisition: 3 } },
  presentedTemporalEvidence: { label: "Хронологические свидетельства переданы Инквизиции", districts: { archives: { security: 2 } }, factions: { Inquisition: 3 } },
  crosscheckedDossierAtLift: { label: "Цепочка документов сверена с инфраструктурой сектора", districts: { sectorIX: { security: 2 } }, factions: { Mechanicus: -1, Inquisition: 1 } },
  helpedWorker: { label: "Выжившему рабочему оказана помощь", districts: { sectorIX: { stability: 6, security: 1 } }, factions: { Militarum: 1, PDF: 2 } },
  workerGaveSeal: { label: "Печать допуска добавлена к доказательствам", districts: { sectorIX: { security: 2 } }, factions: { Inquisition: 1 } },
  killedCultist: { label: "Культист устранён; его свидетельство недоступно", districts: { sectorIX: { security: 2, warpRisk: 1 } }, factions: { Militarum: 1 } },
  readXIArchive: { label: "Архив «Одиннадцатый» изучен", districts: { archives: { security: 1 }, catacombs: { warpRisk: 1 } } },
  knowsKralTimeAnomaly: { label: "Отмечена несостыковка записей, связанных с Краллом", districts: { archives: { security: 1, warpRisk: 1 } }, factions: { Inquisition: 1 } },
  // Решения о Вратах: риск Варпа отделён от репутации героя.
  closedGateByFaith: { label: "Врата закрыты верой и ритуалом", districts: { catacombs: { warpRisk: -18, stability: 5 }, sectorIX: { warpRisk: -8, stability: 4 }, newHive: { warpRisk: -4 } }, factions: { Inquisition: 2, Militarum: 1, Chaos: -5 } },
  closedGateByKnowledge: { label: "Шов закрыт через техническое вмешательство; механизм требует наблюдения", districts: { catacombs: { warpRisk: -10, stability: -2, security: 2 }, sectorIX: { warpRisk: -5 }, newHive: { warpRisk: -2 } }, factions: { Mechanicus: 2, Inquisition: 1 } },
  closedGateByForce: { label: "Врата закрыты силой; последствия требуют проверки", districts: { catacombs: { warpRisk: -12, stability: -5 }, sectorIX: { warpRisk: -6, stability: -2 }, newHive: { warpRisk: -3 } }, factions: { Inquisition: 1, Militarum: 1, Chaos: -4 } },
  gateContained: { label: "Врата сдержаны, но не закрыты окончательно", districts: { catacombs: { warpRisk: -5, security: 4 }, sectorIX: { warpRisk: -2 } }, factions: { Inquisition: 1, Chaos: -1 } },
  gateUnclosed: { label: "Врата не закрыты окончательно; уровень риска зависит от того, удалось ли их сдержать" },
  gateAbandoned: { label: "Игрок покинул Врата, не закрыв их", districts: { catacombs: { warpRisk: 10, stability: -6 }, sectorIX: { warpRisk: 5, stability: -3 } }, factions: { Inquisition: -2, Chaos: 4 } },
  acceptedWarpHeart: { label: "Сердце Варпа принято; угроза становится личной", districts: { catacombs: { warpRisk: 20 }, sectorIX: { warpRisk: 12 }, newHive: { warpRisk: 10 } }, factions: { Chaos: 8, Inquisition: -5 } },
  destroyedArtifact: { label: "Артефакт уничтожен; сведения о нём могут быть утрачены", districts: { catacombs: { warpRisk: -3, stability: -1 } }, factions: { Inquisition: 1, Mechanicus: -1 } },
  tookArtifact: { label: "Артефакт изъят для дальнейшего изучения", districts: { catacombs: { security: 2, warpRisk: 2 }, techChapel: { warpRisk: 1 } }, factions: { Inquisition: 1, Mechanicus: 1 } },
  // Суд Ордо и отношения между ведомствами.
  ojToldTruth: { label: "На суде Ордо изложена правда", districts: { archives: { security: 2 } }, factions: { Inquisition: 3 }, memory: { "Сержант Кейн": "В официальном докладе сохранена открытая версия событий." } },
  ojToldLie: { label: "На суде Ордо сознательно изложена ложная версия", districts: { archives: { security: -2 } }, factions: { Inquisition: -4 } },
  ojToldSilence: { label: "На суде Ордо выбран отказ от показаний", districts: { archives: { security: -1 } }, factions: { Inquisition: -2 } },
  ojCooperated: { label: "Принято сотрудничество с Инквизицией", factions: { Inquisition: 2 } },
  ojRefused: { label: "Игрок отказался сотрудничать с Инквизицией", factions: { Inquisition: -3 } },
  lyraStaysFinal: { label: "Лира остаётся рядом после суда", factions: { Militarum: 1 }, memory: { "Лира Доминик": "Игрок сохранил её доверие к финалу суда." } },
  lyraLeaves: { label: "Лира покидает отряд", factions: { Militarum: -1 }, memory: { "Лира Доминик": "Лира решила уйти после событий суда." } },
  patrolSurvivorSaved: { label: "Выживший патрульный спасён", districts: { sectorIX: { stability: 4 } }, factions: { Militarum: 2, PDF: 1 } },
  patrolSurvivorAbandoned: { label: "Выживший патрульный оставлен в узле", districts: { sectorIX: { stability: -3 } }, factions: { Militarum: -2, PDF: -1 } },
  wh6FoundOrder: { label: "В новом улье найден приказ, требующий проверки", districts: { newHive: { security: 4 } }, factions: { Inquisition: 1, Mechanicus: -1 } },
  wh6KnowsRitual: { label: "В новом улье выявлены признаки ритуала", districts: { newHive: { warpRisk: 3, security: 3 } }, factions: { Inquisition: 2, Chaos: 1 } },
  wh6FoundPassage: { label: "Найден проход к следующему узлу угрозы", districts: { newHive: { security: 2, warpRisk: 2 } }, factions: { Inquisition: 1 } },
  campaignComplete: { label: "Зафиксировано завершение текущей части кампании" }
};

const CONTINUITY_INTERROGATIONS = {
  "Сержант Кейн": {
    workers: {
      label: "О пропавших рабочих",
      can: () => hasInvestigationEvidence("dockTracks") || hasInvestigationEvidence("kaneTestimony") || Boolean(GAME.world.flags.kaneSealedTruth),
      response: () => {
        const hasTracks = hasInvestigationEvidence("dockTracks");
        const hasTestimony = hasInvestigationEvidence("kaneTestimony");
        if(hasTracks && hasTestimony) return "Предъявленные следы совпадают с показаниями его людей. Кейн подтверждает маршрут в технический узел, но не утверждает, что видел конечный пункт лично.";
        return "Кейн подтверждает, что его отделение слышало о перемещении людей через технический узел. Без второй независимой зацепки маршрут остаётся неполным.";
      },
      attitude: 1,
      memory: "Обсуждён маршрут пропавших рабочих; личное наблюдение Кейна отделено от сведений подчинённых.",
      evidenceIds: ["dockTracks", "kaneTestimony", "workerMark"]
    }
  },
  "Магос Хест": {
    alibi: {
      label: "Проверить алиби во время закрытия сектора",
      can: () => hasInvestigationEvidence("order117") || hasInvestigationEvidence("hestSeal"),
      response: () => "Хест заявляет, что приказ оформлялся в рамках процедуры Техно-капеллы. В досье нет независимой записи, устанавливающей его точное местонахождение в момент исчезновений. Это зафиксированное заявление, а не подтверждённое алиби; административная связь не доказывает присутствия на месте событий или мотива.",
      attitude: -1,
      memory: "Хест изложил позицию о приказе 117-Г. Независимого подтверждения его точного местонахождения нет; показание не считается доказанным алиби.",
      evidenceIds: ["order117", "hestSeal"]
    },
    authorization: {
      label: "О приказе 117-Г и личной печати",
      can: () => hasInvestigationEvidence("order117") || hasInvestigationEvidence("hestSeal") || Boolean(GAME.world.flags.deducedHestAuthorization),
      response: () => {
        if(GAME.world.flags.deducedHestAuthorization) return "Хест подтверждает только административную сторону распоряжения. Он не признаёт связь с культом, а найденные документы не позволяют доказать его мотив.";
        if(hasInvestigationEvidence("order117") && hasInvestigationEvidence("hestSeal")) return "Хест признаёт, что печать относится к распоряжению Техно-капеллы, но оспаривает выводы о мотивах. Для обоснованного доклада требуется независимое свидетельство.";
        return "Хест требует предъявить полный документ и подтверждение происхождения печати. Он не даёт однозначного ответа без цепочки доказательств.";
      },
      attitude: -1,
      memory: "Обсуждён приказ 117-Г. Административная связь не приравнена к доказательству ереси.",
      evidenceIds: ["order117", "hestSeal", "kaneTestimony"]
    }
  },
  "Лира Доминик": {
    nightmares: {
      label: "О ночных кошмарах и промзоне",
      can: () => Boolean(GAME.world.flags.lyraNightmares || GAME.world.flags.lyraWitness || GAME.world.flags.lyraCompanion) || hasInvestigationEvidence("livingGlyphs"),
      response: () => hasInvestigationEvidence("livingGlyphs")
        ? "Лира сравнивает своё воспоминание с описанием изменяющихся знаков, но подчёркивает, что не может подтвердить их природу. Её свидетельство важно, однако остаётся субъективным."
        : "Лира описывает повторяющиеся кошмары и ощущение чужого присутствия. Она не может установить, были ли это реальные события, воздействие Варпа или последствия пережитого." ,
      attitude: 1,
      memory: "Обсуждены кошмары и воспоминания Лиры; субъективные переживания сохранены как свидетельство, не как доказательство механизма.",
      evidenceIds: ["livingGlyphs"]
    }
  }
};

function ensureContinuityState(){
  if(!GAME.world || typeof GAME.world !== "object") GAME.world = {};
  const raw = GAME.world.continuity;
  if(!raw || typeof raw !== "object" || Array.isArray(raw)) GAME.world.continuity = {};
  const s = GAME.world.continuity;
  s.version = 1;
  s.decisions = Array.isArray(s.decisions) ? s.decisions : [];
  s.events = Array.isArray(s.events) ? s.events : [];
  s.appliedFlags = s.appliedFlags && typeof s.appliedFlags === "object" && !Array.isArray(s.appliedFlags) ? s.appliedFlags : {};
  s.appliedEffects = s.appliedEffects && typeof s.appliedEffects === "object" && !Array.isArray(s.appliedEffects) ? s.appliedEffects : {};
  s.districts = s.districts && typeof s.districts === "object" && !Array.isArray(s.districts) ? s.districts : {};
  for(const [id, def] of Object.entries(CONTINUITY_DISTRICT_DEFS)){
    const current = s.districts[id] && typeof s.districts[id] === "object" ? s.districts[id] : {};
    s.districts[id] = { ...def, ...current };
    for(const key of ["stability", "security", "warpRisk"]) {
      const value = s.districts[id][key];
      s.districts[id][key] = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : def[key];
    }
  }
  s.factionStanding = s.factionStanding && typeof s.factionStanding === "object" && !Array.isArray(s.factionStanding) ? s.factionStanding : {};
  for(const faction of ["Inquisition", "Mechanicus", "Militarum", "PDF", "Chaos"]) {
    const value = s.factionStanding[faction];
    s.factionStanding[faction] = Number.isFinite(value) ? Math.max(-100, Math.min(100, value)) : 0;
  }
  s.relationships = s.relationships && typeof s.relationships === "object" && !Array.isArray(s.relationships) ? s.relationships : {};
  s.interrogations = s.interrogations && typeof s.interrogations === "object" && !Array.isArray(s.interrogations) ? s.interrogations : {};
  s.chapterOutcomes = Array.isArray(s.chapterOutcomes) ? s.chapterOutcomes : [];
  s.chapterNotesShown = s.chapterNotesShown && typeof s.chapterNotesShown === "object" && !Array.isArray(s.chapterNotesShown) ? s.chapterNotesShown : {};
  s.endingHistory = Array.isArray(s.endingHistory) ? s.endingHistory : [];
  s.startedAt = Number.isFinite(s.startedAt) ? s.startedAt : (GAME.meta && Number.isFinite(GAME.meta.startedAt) ? GAME.meta.startedAt : null);
  return s;
}

function initContinuity(options = {}){
  const s = ensureContinuityState();
  // Начальные показатели отношений синхронизируются с текущим отношением NPC,
  // но при загрузке или продолжении никогда не обнуляются.
  if(typeof GAME.npcs === "object" && GAME.npcs){
    for(const [name, npc] of Object.entries(GAME.npcs)){
      if(!s.relationships[name] || typeof s.relationships[name] !== "object"){
        s.relationships[name] = { trust: Number.isFinite(npc.attitude) ? npc.attitude : 0, respect: 0, fear: 0, memories: [], lastInterrogation: null, dialogueCount: 0 };
      } else {
        const rel = s.relationships[name];
        rel.trust = Number.isFinite(rel.trust) ? Math.max(-20, Math.min(20, rel.trust)) : (Number.isFinite(npc.attitude) ? npc.attitude : 0);
        rel.respect = Number.isFinite(rel.respect) ? Math.max(-20, Math.min(20, rel.respect)) : 0;
        rel.fear = Number.isFinite(rel.fear) ? Math.max(0, Math.min(20, rel.fear)) : 0;
        rel.memories = Array.isArray(rel.memories) ? rel.memories : [];
        rel.dialogueCount = Number.isFinite(rel.dialogueCount) ? Math.max(0, rel.dialogueCount) : 0;
      }
    }
  }
  if(options.rehydrateFlags){
    for(const [key, value] of Object.entries(GAME.world.flags || {})) if(value === true) applyContinuityFlag(key, true, { rehydrating:true });
  }
  return s;
}

function continuityRecordEvent(type, title, detail = "", extra = {}){
  const s = ensureContinuityState();
  const event = {
    id: `${type}:${Date.now()}:${s.events.length}`,
    type, title: String(title || type).slice(0, 180), detail: String(detail || "").slice(0, 900),
    day: Number.isFinite(GAME.world.day) ? GAME.world.day : 1,
    time: typeof timeString === "function" ? timeString() : "--:--",
    chapter: GAME.campaign?.scenarioId || null,
    sceneId: GAME.campaign?.sceneId || null,
    ...extra
  };
  s.events.push(event);
  if(s.events.length > 180) s.events.splice(0, s.events.length - 180);
  if(typeof jlog === "function") jlog("continuity", {eventType:type, title:event.title, detail:event.detail});
  return event;
}

function adjustDistrict(id, deltas = {}, reason = ""){
  const s = ensureContinuityState();
  const def = CONTINUITY_DISTRICT_DEFS[id];
  if(!def) return false;
  const district = s.districts[id];
  let changed = false;
  for(const key of ["stability", "security", "warpRisk"]){
    if(Number.isFinite(deltas[key])){
      const before = district[key];
      district[key] = Math.max(0, Math.min(100, Math.round(before + deltas[key])));
      changed ||= before !== district[key];
    }
  }
  if(changed){ district.lastChange = reason || "Изменение состояния"; continuityRecordEvent("district", def.name, reason || "Показатели района изменились.", {districtId:id, deltas:{...deltas}}); }
  return changed;
}

function adjustFactionStanding(faction, delta, reason = ""){
  const s = ensureContinuityState();
  if(!(faction in s.factionStanding) || !Number.isFinite(delta) || delta === 0) return false;
  const before = s.factionStanding[faction];
  s.factionStanding[faction] = Math.max(-100, Math.min(100, before + delta));
  if(before !== s.factionStanding[faction]) continuityRecordEvent("faction", faction, reason || `Изменение влияния: ${delta > 0 ? "+" : ""}${delta}.`, {faction, delta});
  return before !== s.factionStanding[faction];
}

function ensureContinuityRelationship(name){
  const s = ensureContinuityState();
  if(!s.relationships[name]){
    const n = GAME.npcs?.[name];
    s.relationships[name] = { trust: Number.isFinite(n?.attitude) ? n.attitude : 0, respect: 0, fear: 0, memories: [], lastInterrogation: null, dialogueCount: 0 };
  }
  const rel = s.relationships[name];
  if(!Array.isArray(rel.memories)) rel.memories = [];
  return rel;
}

function rememberNPC(name, memory, kind = "наблюдение", extra = {}){
  if(!name || !memory) return false;
  const rel = ensureContinuityRelationship(name);
  const text = String(memory).slice(0, 700);
  if(rel.memories.some(m => m && m.text === text && m.kind === kind)) return false;
  rel.memories.push({ text, kind, day: GAME.world.day || 1, sceneId: GAME.campaign?.sceneId || null, ...extra });
  if(rel.memories.length > 40) rel.memories.splice(0, rel.memories.length - 40);
  continuityRecordEvent("npc-memory", name, text, {kind});
  return true;
}

function recordContinuityRelationshipChange(name, delta, source = "разговор"){
  if(!Number.isFinite(delta) || delta === 0) return;
  const rel = ensureContinuityRelationship(name);
  rel.trust = Math.max(-20, Math.min(20, rel.trust + delta));
  continuityRecordEvent("relationship", name, `Доверие ${delta > 0 ? "+" : ""}${delta} (${source}).`, {delta, source});
}

function onContinuityFlagChanged(key, value, previous){
  if(value !== true || previous === true) return;
  applyContinuityFlag(key, value);
}

function applyContinuityFlag(key, value, options = {}){
  if(value !== true) return false;
  const s = ensureContinuityState();
  if(s.appliedFlags[key]) return false;
  const rule = CONTINUITY_FLAG_RULES[key];
  if(!rule){
    // Даже флаг без заранее заданного профиля остаётся в журнале решений.
    s.appliedFlags[key] = true;
    if(!options.rehydrating) continuityRecordEvent("flag", "Зафиксировано сюжетное состояние", `${key} = true`, {flag:key});
    return false;
  }
  s.appliedFlags[key] = true;
  for(const [district, deltas] of Object.entries(rule.districts || {})) adjustDistrict(district, deltas, rule.label);
  for(const [faction, delta] of Object.entries(rule.factions || {})) adjustFactionStanding(faction, delta, rule.label);
  for(const [name, memory] of Object.entries(rule.memory || {})) rememberNPC(name, memory, "сюжетное последствие", {flag:key});
  if(!options.rehydrating) continuityRecordEvent("consequence", rule.label, "Последствие сохранено в хронике мира.", {flag:key});
  return true;
}


function applyStructuredConsequence(definition){
  if(!definition || typeof definition !== "object") return {ok:false, message:"Некорректное описание последствия."};
  const s = ensureContinuityState();
  const id = String(definition.id || "").trim();
  if(!id) return {ok:false, message:"У последствия отсутствует стабильный ID."};
  if(s.appliedEffects[id]) return {ok:false, message:"Это последствие уже учтено."};
  s.appliedEffects[id] = true;
  for(const [district, deltas] of Object.entries(definition.districts || {})) adjustDistrict(district, deltas, definition.title || id);
  for(const [faction, delta] of Object.entries(definition.factions || {})) adjustFactionStanding(faction, delta, definition.title || id);
  for(const [name, value] of Object.entries(definition.relationships || {})){
    const delta = Number.isFinite(value) ? value : Number.isFinite(value?.trust) ? value.trust : 0;
    if(delta){
      if(typeof bumpNPC === "function") bumpNPC(name, delta);
      else recordContinuityRelationshipChange(name, delta, definition.title || id);
    }
    if(value && typeof value === "object" && Number.isFinite(value.fear)){
      const rel = ensureContinuityRelationship(name);
      rel.fear = Math.max(0, Math.min(20, rel.fear + value.fear));
    }
  }
  for(const [name, memory] of Object.entries(definition.memories || {})) rememberNPC(name, memory, "последствие", {consequenceId:id});
  continuityRecordEvent("consequence", definition.title || id, definition.summary || "Решение изменило состояние мира.", {consequenceId:id, category:definition.category || "сюжет"});
  return {ok:true, message:`Последствие зафиксировано: ${definition.title || id}.`};
}

function registerStoryDecision(sceneId, choice){
  if(!choice) return null;
  const s = ensureContinuityState();
  const label = String(choice.label || "Решение").slice(0, 240);
  const id = `${GAME.campaign?.scenarioId || "unknown"}:${sceneId || "unknown"}:${GAME.turn}:${s.decisions.length}`;
  const decision = {
    id, sceneId: sceneId || null, scenarioId: GAME.campaign?.scenarioId || null,
    label, day: GAME.world.day || 1, time: typeof timeString === "function" ? timeString() : "--:--",
    category: choice.consequence?.category || classifyDecisionLabel(label),
    consequenceId: choice.consequence?.id || null,
    tags: Array.isArray(choice.consequence?.tags) ? choice.consequence.tags.slice(0, 8) : []
  };
  s.decisions.push(decision);
  if(s.decisions.length > 240) s.decisions.splice(0, s.decisions.length - 240);
  continuityRecordEvent("decision", label, `Сцена: ${sceneId || "не указана"}. Категория: ${decision.category}.`, {decisionId:id, category:decision.category});
  return decision;
}

function classifyDecisionLabel(label){
  const value = String(label || "").toLowerCase();
  if(/убить|устранить|атаковать|силой|взломать/.test(value)) return "силовое решение";
  if(/допрос|спросить|предъявить|сверить|изучить|прочитать|осмотреть|проверить/.test(value)) return "расследование";
  if(/спасти|помочь|согласиться|довер|сотрудничать/.test(value)) return "поддержка / сотрудничество";
  if(/уйти|оставить|отказаться|молчать|скрыть|бросить/.test(value)) return "отказ / отступление";
  if(/закрыть|сдержать|ритуал|молитв/.test(value)) return "сдерживание угрозы";
  return "сюжетное решение";
}

function recordDialogueDecision(npcName, choice){
  if(!npcName || !choice) return;
  const rel = ensureContinuityRelationship(npcName);
  rel.dialogueCount = Math.min(999, rel.dialogueCount + 1);
  rememberNPC(npcName, `Игрок выбрал реплику: «${String(choice.label || "ответ").slice(0, 200)}».`, "диалог", {sceneId:GAME.campaign?.sceneId || null});
}

function hasInvestigationEvidence(id){
  return typeof hasEvidence === "function" ? hasEvidence(id) : Boolean(GAME.world?.investigation?.evidence?.some(e => e?.id === id));
}

function formalInterrogate(npcName, topicId){
  const topics = CONTINUITY_INTERROGATIONS[npcName];
  const topic = topics && topics[topicId];
  if(!topic) return {ok:false, message:"Такого формального допроса нет в реестре."};
  const npc = GAME.npcs?.[npcName];
  if(!npc || !npc.met) return {ok:false, message:`Сначала нужно встретить ${npcName}.`};
  if(!topic.can()) return {ok:false, message:"Недостаточно оснований для предметного допроса. Сначала собери связанные улики или поговори с персонажем в сюжете."};
  const s = ensureContinuityState();
  if(!s.interrogations[npcName] || typeof s.interrogations[npcName] !== "object") s.interrogations[npcName] = {};
  if(s.interrogations[npcName][topicId]) return {ok:false, message:"Этот вопрос уже обсуждался. Повторный допрос не создаёт новых сведений."};
  const response = topic.response();
  s.interrogations[npcName][topicId] = {
    day: GAME.world.day || 1, sceneId: GAME.campaign?.sceneId || null,
    evidence: (topic.evidenceIds || []).filter(id => hasInvestigationEvidence(id)),
    response, topic: topic.label
  };
  const rel = ensureContinuityRelationship(npcName);
  rel.lastInterrogation = topic.label;
  rel.lastInterrogationDay = GAME.world.day || 1;
  if(topic.attitude) {
    if(typeof bumpNPC === "function") bumpNPC(npcName, topic.attitude);
    else recordContinuityRelationshipChange(npcName, topic.attitude, "формальный допрос");
  }
  rememberNPC(npcName, topic.memory, "формальный допрос", {topic:topicId});
  continuityRecordEvent("interrogation", `Допрос: ${npcName}`, `${topic.label}. ${response}`, {npcName, topicId});
  if(typeof addSystem === "function") addSystem(`ДОПРОС · ${npcName.toUpperCase()}`, `${topic.label}\n\n${response}\n\nЗапись внесена в хронику. Повторный допрос не даст новых сведений без новых доказательств.`);
  if(typeof saveGameSilent === "function") saveGameSilent();
  return {ok:true, message:response};
}

function getRelationshipStatus(name){
  const rel = ensureContinuityRelationship(name);
  if(rel.trust <= -12) return "Враждебность";
  if(rel.trust <= -5) return "Недоверие";
  if(rel.trust < 5) return "Нейтралитет";
  if(rel.trust < 12) return "Расположение";
  return "Доверие";
}

function finalizeChapterOutcome(scenarioId, finalSceneId){
  if(!scenarioId) return null;
  const s = ensureContinuityState();
  const key = `${scenarioId}:${finalSceneId || "unknown"}`;
  const existing = s.chapterOutcomes.find(o => o && o.key === key);
  if(existing) return existing;
  const importantFlags = Object.keys(GAME.world.flags || {}).filter(k => GAME.world.flags[k] === true && /^(deduced|hypothesis|accepted|closedGate|gate|presented|oj|lyra|readXI|knowsKral|wh6|campaignComplete|killedCultist|helpedWorker|destroyedArtifact|tookArtifact)/.test(k)).slice(-70);
  const outcome = {
    key, scenarioId, finalSceneId: finalSceneId || null,
    day: GAME.world.day || 1, turn: GAME.turn || 1,
    evidenceCount: GAME.world.investigation?.evidence?.length || 0,
    deductionCount: Object.keys(GAME.world.investigation?.deductions || {}).length,
    importantFlags, characterName: GAME.character?.name || "Неизвестный агент",
    reputation: { ...(GAME.character?.reputation || {}) },
    districtSnapshot: Object.fromEntries(Object.entries(s.districts).map(([id,d]) => [id, {stability:d.stability, security:d.security, warpRisk:d.warpRisk}]))
  };
  s.chapterOutcomes.push(outcome);
  if(s.chapterOutcomes.length > 12) s.chapterOutcomes.splice(0, s.chapterOutcomes.length - 12);
  continuityRecordEvent("chapter-outcome", `Итог главы: ${scenarioId}`, `Последняя сцена: ${finalSceneId || "не определена"}. Улик: ${outcome.evidenceCount}; выводов: ${outcome.deductionCount}.`, {scenarioId, finalSceneId});
  return outcome;
}

function buildChapterTransitionNote(nextScenarioId){
  const s = ensureContinuityState();
  if(!s.chapterOutcomes.length || s.chapterNotesShown[nextScenarioId]) return "";
  const last = s.chapterOutcomes[s.chapterOutcomes.length - 1];
  const lines = [];
  if(last.evidenceCount) lines.push(`В досье перенесено улик: ${last.evidenceCount}; зафиксировано выводов: ${last.deductionCount}.`);
  const flags = GAME.world.flags || {};
  if(flags.deducedHestAuthorization) lines.push("Документальная цепочка связывает Хеста с приказом 117-Г, но его мотив остаётся неустановленным.");
  if(flags.deducedTemporalAnomaly || flags.knowsKralTimeAnomaly) lines.push("Хронологические несостыковки остаются предметом расследования; их причина не доказана.");
  if(flags.closedGateByFaith) lines.push("Врата были закрыты верой и ритуалом; последствия этой операции остаются частью официального дела.");
  else if(flags.closedGateByKnowledge) lines.push("Шов у Врат закрыт техническим вмешательством; точный механизм и устойчивость результата требуют наблюдения.");
  else if(flags.closedGateByForce) lines.push("Врата были закрыты силой; устойчивость результата требует наблюдения.");
  else if(flags.gateContained) lines.push("Врата лишь сдержаны. Угроза не считается окончательно устранённой.");
  else if(flags.gateUnclosed || flags.gateAbandoned) lines.push("Врата остались открытой угрозой; местные риски повышены.");
  if(flags.acceptedWarpHeart) lines.push("Зафиксировано принятие Сердца Варпа; дальнейшие решения будут рассматриваться с учётом этой перемены.");
  if(flags.lyraLeaves) lines.push("Лира покинула отряд; её участие нельзя считать доступным в последующих сценах.");
  else if(flags.lyraStaysFinal || flags.lyraCompanion) lines.push("Отношение Лиры и история совместных решений сохранены.");
  if(flags.ojToldLie) lines.push("В официальных показаниях есть сознательное сокрытие; доверие Инквизиции снижено.");
  if(!lines.length) lines.push("Сохранены решения и состояние мира предыдущей главы; новых подтверждённых выводов нет.");
  s.chapterNotesShown[nextScenarioId] = true;
  return `\n\nСВОДКА ПРЕДЫДУЩЕГО ДЕЛА\n${lines.map(x => "— " + x).join("\n")}`;
}

function getCampaignEndingProfile(game = GAME){
  const flags = game.world?.flags || {};
  const corruption = Number(game.character?.corruption || 0);
  if(flags.acceptedWarpHeart || corruption >= 9) return {id:"warp", title:"ПРЕОБРАЖЕНИЕ / СЛУЖЕНИЕ ВАРПУ", description:"Угроза не локализована; состояние героя и его дальнейшая лояльность требуют особого надзора."};
  if(flags.gateAbandoned || (flags.gateUnclosed && !flags.gateContained)) return {id:"breach", title:"НЕЗАКРЫТАЯ УГРОЗА", description:"Врата остаются открытым риском. Стабильность катакомб и нижних районов снижена."};
  if(flags.closedGateByFaith) return {id:"sealed-faith", title:"ЗАПЕЧАТАНО РИТУАЛОМ", description:"Врата закрыты; остаются вопросы о цене, памяти и природе аномалии."};
  if(flags.closedGateByKnowledge) return {id:"sealed-knowledge", title:"ШОВ ЗАКРЫТ ТЕХНИЧЕСКИМ ВМЕШАТЕЛЬСТВОМ", description:"Шов закрыт, но устойчивость и механизм требуют дальнейшего наблюдения."};
  if(flags.closedGateByForce) return {id:"sealed-force", title:"ЗАПЕЧАТАНО СИЛОЙ", description:"Врата закрыты, но последствия силового вмешательства требуют наблюдения."};
  if(flags.gateContained) return {id:"contained", title:"ВРЕМЕННОЕ СДЕРЖИВАНИЕ", description:"Опасность ослаблена, но не устранена окончательно."};
  if(flags.deducedHestAuthorization && flags.deducedTemporalAnomaly && flags.presentedTemporalEvidence) return {id:"evidence", title:"ДЕЛО ПОДТВЕРЖДЕНО ДОКУМЕНТАМИ", description:"Доказательства переданы Ордо, а не заменены догадками о мотивах."};
  return {id:"unresolved", title:"НЕПОЛНОЕ ДОСЬЕ", description:"Часть вопросов остаётся открытой; официальная версия не объясняет все следы."};
}

function recordCampaignEnding(id, title, summary){
  const s = ensureContinuityState();
  if(s.endingHistory.some(e => e && e.id === id)) return false;
  const ending = {id, title:title || id, summary:summary || "", day:GAME.world.day || 1, scenarioId:GAME.campaign?.scenarioId || null, profile:getCampaignEndingProfile()};
  s.endingHistory.push(ending);
  continuityRecordEvent("ending", ending.title, ending.summary || ending.profile.description, {endingId:id, profile:ending.profile.id});
  return true;
}

function renderContinuityPanel(){
  const s = ensureContinuityState();
  const districtMarkup = Object.entries(s.districts).map(([id,d]) => {
    const riskColor = d.warpRisk >= 65 ? "#b95e55" : d.warpRisk >= 40 ? "#c39c55" : "#779b75";
    return `<article class="list-item continuity-district"><div class="small-row"><b>${esc(d.name)}</b><span>РИСК ${d.warpRisk}/100</span></div><p>${esc(d.note)}</p><div class="small-row"><span>Стабильность</span><b>${d.stability}/100</b></div><div class="progress"><i style="width:${d.stability}%;"></i></div><div class="small-row"><span>Безопасность</span><b>${d.security}/100</b></div><div class="progress"><i style="width:${d.security}%;"></i></div><div class="small-row"><span>Риск аномалии</span><b style="color:${riskColor}">${d.warpRisk}/100</b></div><div class="progress"><i style="width:${d.warpRisk}%;background:${riskColor};"></i></div></article>`;
  }).join("");
  const factionNames = {Inquisition:"Инквизиция", Mechanicus:"Адептус Механикус", Militarum:"Астра Милитарум", PDF:"Планетарные силы обороны", Chaos:"Силы Хаоса"};
  const factionMarkup = Object.entries(s.factionStanding).map(([name,value]) => {
    const harmful = name === "Chaos" ? value > 0 : value < 0;
    const color = harmful ? "#bd706a" : value === 0 ? "var(--muted)" : "#8fb391";
    return `<div class="list-item"><div class="small-row"><b>${esc(factionNames[name] || name)}</b><strong style="color:${color}">${value > 0 ? "+" : ""}${value}</strong></div><div class="progress"><i style="width:${Math.min(100, Math.abs(value))}%;background:${color};"></i></div></div>`;
  }).join("");
  const npcMarkup = Object.entries(GAME.npcs || {}).map(([name,npc]) => {
    const rel = ensureContinuityRelationship(name);
    const topics = CONTINUITY_INTERROGATIONS[name] || {};
    const buttons = Object.entries(topics).map(([topicId,topic]) => {
      const completed = Boolean(s.interrogations[name]?.[topicId]);
      const available = Boolean(npc.met && topic.can() && !completed);
      return `<button class="secondary-btn" data-interrogate-name="${esc(name)}" data-interrogate-topic="${esc(topicId)}" ${available ? "" : "disabled"}>${completed ? "✓ " : ""}${esc(topic.label)}${!npc.met ? " · сначала встретить" : !topic.can() && !completed ? " · нужны улики" : ""}</button>`;
    }).join("");
    const memories = rel.memories.slice(-3).reverse().map(m => `<div class="continuity-memory"><small>${esc(m.kind || "запись")} · день ${esc(String(m.day || 1))}</small><p>${esc(m.text)}</p></div>`).join("");
    return `<article class="list-item continuity-npc"><div class="small-row"><b>${esc(name)}</b><span>${esc(getRelationshipStatus(name))}</span></div><p>${esc(npc.role || "")}</p><div class="small-row"><span>Отношение по сюжету</span><b>${Number.isFinite(npc.attitude) ? npc.attitude : 0}/20</b></div><div class="progress"><i style="width:${Math.max(0, Math.min(100, ((rel.trust + 20) / 40) * 100))}%;"></i></div>${rel.memories.length ? `<div class="continuity-memories"><b>Память NPC</b>${memories}</div>` : `<p class="footer-note">Важные разговоры и выводы будут сохранены здесь.</p>`}${buttons ? `<div class="continuity-actions">${buttons}</div>` : ""}</article>`;
  }).join("");
  const decisions = s.decisions.slice(-10).reverse().map(d => `<div class="list-item"><div class="small-row"><b>${esc(d.label)}</b><span>${esc(d.category)}</span></div><p>Глава: ${esc(d.scenarioId || "—")} · сцена: ${esc(d.sceneId || "—")} · день ${d.day}</p></div>`).join("");
  const recentEvents = s.events.slice(-12).reverse().map(e => `<div class="list-item"><div class="small-row"><b>${esc(e.title)}</b><small>день ${e.day} · ${esc(e.time || "--:--")}</small></div><p>${esc(e.detail || "")}</p></div>`).join("");
  const endings = s.endingHistory.slice().reverse().map(e => `<div class="list-item"><b>${esc(e.title)}</b><p>${esc(e.summary || e.profile?.description || "")}</p></div>`).join("");
  const profile = getCampaignEndingProfile();
  return `<section class="panel continuity-panel"><div class="panel-head"><span>ХРОНИКА ПОСЛЕДСТВИЙ</span><span>${s.decisions.length} РЕШЕНИЙ · ${s.events.length} СОБЫТИЙ</span></div><div class="panel-body"><div class="investigation-intro"><div class="investigation-seal">⚖</div><div><h2>Состояние мира и долговременная память</h2><p>Значения описывают игровое состояние, а не точное измерение физической безопасности. Гипотезы не превращаются в факты автоматически.</p></div></div><h2 class="investigation-section-title">СОСТОЯНИЕ РАЙОНОВ</h2><div class="continuity-district-grid">${districtMarkup}</div><h2 class="investigation-section-title">ПОЛИТИЧЕСКИЕ ПОСЛЕДСТВИЯ</h2><p class="investigation-note">Это отдельная шкала последствий для ведомств, не замена личной репутации. Для имперских организаций положительное значение означает поддержку; для Хаоса — рост враждебного влияния.</p><div class="list">${factionMarkup}</div><h2 class="investigation-section-title">NPC: ПАМЯТЬ, ДОВЕРИЕ И ДОПРОСЫ</h2><div class="list">${npcMarkup}</div><h2 class="investigation-section-title">ПОСЛЕДНИЕ РЕШЕНИЯ</h2><div class="list">${decisions || `<div class="empty">Решения появятся по мере прохождения сюжетных сцен.</div>`}</div><h2 class="investigation-section-title">ХРОНИКА ИЗМЕНЕНИЙ</h2><div class="list">${recentEvents || `<div class="empty">Значимых изменений пока нет.</div>`}</div><h2 class="investigation-section-title">ПАМЯТЬ МЕЖДУ ГЛАВАМИ</h2><div class="list">${s.chapterOutcomes.length ? s.chapterOutcomes.slice().reverse().map(o => `<div class="list-item"><b>${esc(o.scenarioId)} · день ${o.day}</b><p>Последняя сцена: ${esc(o.finalSceneId || "—")}; улик: ${o.evidenceCount}; выводов: ${o.deductionCount}.</p><p>Зафиксированных ключевых решений: ${o.importantFlags.length}.</p></div>`).join("") : `<div class="empty">Итоги появятся при переходах между главами.</div>`}</div><h2 class="investigation-section-title">ПРОФИЛЬ ВОЗМОЖНОГО ФИНАЛА</h2><div class="list-item"><b>${esc(profile.title)}</b><p>${esc(profile.description)}</p></div>${endings ? `<h2 class="investigation-section-title">ЗАПИСАННЫЕ КОНЦОВКИ</h2><div class="list">${endings}</div>` : ""}<div class="footer-note">Состояние сохраняется локально и переносится в файл экспорта. ИИ и внешние игровые API не используются; звук генерируется локально и отключается в настройках.</div></div></section>`;
}
