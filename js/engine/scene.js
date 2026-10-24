/* ============================================================
   SCENE.JS — движок сцен
   ============================================================ */

function startScenario(scenarioId){
  // Validate the destination before mutating or finalizing the active campaign.
  // A typo in a transition must never finalize the previous chapter by accident.
  const sc = CAMPAIGN_SCENARIOS[scenarioId];
  if(!sc || !sc.scenes || !sc.startScene || !sc.scenes[sc.startScene]){
    console.error(`[Scene] Сценарий или его стартовая сцена «${scenarioId}» отсутствует в CAMPAIGN_SCENARIOS.`);
    addSystem("ОШИБКА", `Сценарий «${scenarioId}» не найден или не имеет корректной стартовой сцены. Текущая операция сохранена.`);
    renderAll();
    return;
  }
  const scenarioGeneration = typeof _campaignGeneration === "number"
    ? ++_campaignGeneration
    : 0;
  const previousScenarioId = GAME.campaign?.scenarioId;
  const previousSceneId = GAME.campaign?.sceneId;
  if(previousScenarioId && previousScenarioId !== scenarioId && typeof finalizeChapterOutcome === "function"){
    finalizeChapterOutcome(previousScenarioId, previousSceneId);
  }
  GAME.campaign = {
    active:true,
    scenarioId,
    sceneId: sc.startScene,
    stack:[sc.startScene],
    pendingCombat: null
  };

  // Показываем катсцену перед первой сценой (если ещё не видели)
  if (typeof shouldShowCutscene === "function" && typeof playChapterCutscene === "function") {
    if (shouldShowCutscene(scenarioId)) {
      // Катсцена — асинхронная. Ждём, потом входим в сцену.
      playChapterCutscene(scenarioId).then(() => {
        if (typeof _campaignGeneration === "number" && scenarioGeneration !== _campaignGeneration) return;
        if (GAME.campaign?.scenarioId !== scenarioId) return;
        if (typeof markCutsceneSeen === "function") markCutsceneSeen(scenarioId);
        enterScene(sc.startScene);
      });
      return;
    }
  }

  enterScene(sc.startScene);
}

function enterScene(sceneId, _depth){
  // Defensive routing: chapter tokens are transition commands, never local scene IDs.
  // This also protects older saves or UI callbacks that call enterScene directly.
  const chapterTargets = {
    "__chapter1__":"silentForge", "__chapter2__":"sealedSector", "__chapter3__":"warpHeart",
    "__chapter4__":"ordoJudgment", "__chapter5__":"afterJudgment", "__chapter6__":"newHive",
    "__chapter7__":"ashProtocol", "__chapter8__":"resonanceArchive", "__chapter9__":"witnessLedger",
    "__chapter10__":"silentRoute", "__chapter11__":"priceOfEvidence", "__chapter12__":"rightToMemory",
    "__chapter13__":"lastTransport", "__chapter14__":"beyondHive", "__chapter15__":"verdictNameless"
  };
  if (chapterTargets[sceneId]) {
    if (typeof startScenario === "function") startScenario(chapterTargets[sceneId]);
    return;
  }
  if (sceneId === "__restart__") { if (typeof openNewCampaign === "function") openNewCampaign(); return; }
  if (typeof setSoundContext === "function") setSoundContext("story");
  // Счётчик глубины — защита от рекурсии
  const depth = _depth || 0;
  if(depth > 10){
    console.error(`[Scene] Рекурсия > 10. Последняя сцена: ${sceneId}`);
    addSystem("ОШИБКА", "Слишком много пропусков сцен. Проверь skipIf и skipTo.");
    return;
  }

  const scenarioId = GAME.campaign && GAME.campaign.scenarioId;
  const sc = scenarioId ? CAMPAIGN_SCENARIOS[scenarioId] : null;
  if(!sc){
    console.error(`[Scene] Реестр не содержит сценарий «${scenarioId || "(не задан)"}».`);
    addSystem("ОШИБКА", "Не удалось определить активную кампанию. Начни новую кампанию или загрузи корректное сохранение.");
    if(GAME.campaign) GAME.campaign.active = false;
    renderAll();
    return;
  }

  const scene = sc.scenes && sc.scenes[sceneId];
  if(!scene){
    console.error(`[Scene] Сцена «${sceneId}» не найдена в «${scenarioId}».`);
    addSystem("ОШИБКА", `Сцена «${sceneId}» не найдена в кампании «${sc.title || scenarioId}».`);
    if(sc.startScene && sc.startScene !== sceneId && sc.scenes && sc.scenes[sc.startScene]){
      return enterScene(sc.startScene, depth + 1);
    }
    if(GAME.campaign) GAME.campaign.active = false;
    renderAll();
    return;
  }

  // Пропуск сцены, если выполнено условие
  if(scene.skipIf && sceneRequirementsMet(scene.skipIf)){
    const next = scene.skipTo || sc.startScene;
    if(scene.skipMessage){
      addSystem("ПОВТОР", scene.skipMessage);
    }
    return enterScene(next, depth + 1);
}

  GAME.campaign.sceneId = sceneId;
  // Раскрываем текущую локацию
if(typeof revealLocation === "function"){
  revealLocation(GAME.character.location);
}
  // Тратим время на сцену (диалог, осмотр, сюжет)
  // Бой — отдельно (endCombat тратит 8 минут)
  // Переход — отдельно (moveTo тратит 12 минут)
  if (typeof advanceTime === "function") {
    const isCombat = !!scene.combat;
    const isDialogue = !!GAME.dialogue;
    // Если это чисто сюжетная сцена — 2 минуты
    // Если диалог — 5 минут
    // Если сцена с явным auto — 0 (переход, уже учтён)
    let sceneTime = 2;
    if (isDialogue) sceneTime = 5;
    if (isCombat) sceneTime = 0;
    if (scene.auto && scene.auto.goto) sceneTime = 0;
    if (sceneTime > 0) advanceTime(sceneTime);
  }
  // Закрываем диалог при смене сцены
  if(GAME.dialogue && typeof endDialogue === "function") endDialogue();
  if(typeof tickCompanionRecovery === "function") tickCompanionRecovery();
  Bus.emit("scene_entered", {sceneId, title: scene.title});

  if(typeof scene.onEnter === "function"){
    try { scene.onEnter(); } catch(e){ console.error(e); }
  }

  const evs = applyEffects(scene.effects, `scene:${scenarioId}:${sceneId}`);
  (evs||[]).forEach(e => e && addSystem("ЭФФЕКТ", e));

  // Функциональный текст позволяет одной сцене оставаться общей для разных героев.
  let resolvedSceneText = typeof scene.text === "function" ? scene.text(GAME) : scene.text;
  if(sceneId === sc.startScene && typeof buildChapterTransitionNote === "function"){
    const transitionNote = buildChapterTransitionNote(scenarioId);
    if(transitionNote) resolvedSceneText += transitionNote;
  }
  addSystem(scene.title, resolvedSceneText);

// Если у сцены есть поле image — вставляем иллюстрацию в хронику
  if(scene.image && typeof getAsset === "function" && getAsset("scenes", scene.image)){
    GAME.story.push({
      type: "image",
     imageKey: scene.image,
     title: scene.title,
     time: timeString()
   });
}

if(scene.auto && scene.auto.goto){
  const next = scene.auto.goto;
  const defaultDelay = next === "__chapter2__" ? 800 : 400;
  followSceneTarget(next, scene.auto.delay || defaultDelay);
  return;
}

  if(scene.check){
    const r = checkStat(scene.check.stat, scene.check.dc, {label: scene.check.label});
    addRoll(formatRoll(r), rollClass(r.result));
    const next = (r.result === "success" || r.result === "critical")
      ? scene.onSuccess
      : scene.onFail;
    setTimeout(() => enterScene(next), 150);
    return renderAll();
  }

  if(scene.combat){
    GAME.campaign.pendingCombat = {
      enemy: scene.combat,
      returnScene: scene.returnScene || null,
      victoryEffects: scene.victoryEffects || null
    };
    startCombat(scene.combat);
    return;
  }

  saveGameSilent();
  renderAll();
}

function followSceneTarget(target, delay){
  const defaultDelay = target === "__chapter2__" ? 800 : target === "__restart__" ? 400 : 0;
  const wait = Number.isFinite(delay) ? Math.max(0, delay) : defaultDelay;
  const transition = () => {
    if(target === "__chapter2__"){
      if(typeof startScenario === "function") startScenario("sealedSector");
      return;
    }
    if(target === "__chapter3__"){
      if(typeof startScenario === "function") startScenario("warpHeart");
      return;
    }
    if(target === "__chapter4__"){ // ← ДОБАВЛЕНО
      if(typeof startScenario === "function") startScenario("ordoJudgment");
      return;
    }
        if(target === "__chapter5__"){
      if(typeof startScenario === "function") startScenario("afterJudgment");
      return;
    }
        if(target === "__chapter6__"){
      if(typeof startScenario === "function") startScenario("newHive");
      return;
    }
    if(target === "__chapter7__"){
      if(typeof startScenario === "function") startScenario("ashProtocol");
      return;
    }
    if(target === "__chapter8__"){
      if(typeof startScenario === "function") startScenario("resonanceArchive");
      return;
    }
    if(target === "__chapter9__"){
      if(typeof startScenario === "function") startScenario("witnessLedger");
      return;
    }
    if(target === "__chapter10__"){
      if(typeof startScenario === "function") startScenario("silentRoute");
      return;
    }
    if(target === "__chapter11__"){ if(typeof startScenario === "function") startScenario("priceOfEvidence"); return; }
    if(target === "__chapter12__"){ if(typeof startScenario === "function") startScenario("rightToMemory"); return; }
    if(target === "__chapter13__"){ if(typeof startScenario === "function") startScenario("lastTransport"); return; }
    if(target === "__chapter14__"){ if(typeof startScenario === "function") startScenario("beyondHive"); return; }
    if(target === "__chapter15__"){ if(typeof startScenario === "function") startScenario("verdictNameless"); return; }
    if(target === "__restart__"){
      if(typeof openNewCampaign === "function") openNewCampaign();
      return;
    }
    if(target === "__exit"){
      if(GAME.campaign) GAME.campaign.active = false;
      GAME.started = false;
      GAME.dialogue = null;
      GAME.combat = null;
      GAME.mode = "explore";
      renderStart();
      return;
    }
    enterScene(target);
  };
  if(wait > 0){
    setTimeout(transition, wait);
    renderAll();
    return;
  }
  transition();
}

function chooseSceneChoice(idx){
  const sc = CAMPAIGN_SCENARIOS[GAME.campaign && GAME.campaign.scenarioId];
  const scene = sc && sc.scenes && sc.scenes[GAME.campaign.sceneId];
  if(!scene || !scene.choices) return;
  const choice = scene.choices[idx];
  if(!choice) return;

  if(choice.requires && !sceneRequirementsMet(choice.requires)){
    addSystem("НЕДОСТУПНО", choice.requiresFailText || "Этот вариант сейчас недоступен.");
    renderAll();
    return;
  }

  addPlayer("▸ " + choice.label);
  Bus.emit("choice_made", {sceneId: GAME.campaign.sceneId, choice});

  if(choice.effects){
    const evs = applyEffects(choice.effects, `choice:${GAME.campaign.scenarioId}:${GAME.campaign.sceneId}:${idx}`);
    (evs||[]).forEach(e => e && addSystem("ЭФФЕКТ", e));
  }

  // Некоторые существующие варианты открывают разговор, не покидая сцену.
  // Это позволяет использовать сюжетные деревья без регистрации Варпа/Тени
  // в общем списке обычных NPC.
  if(choice.dialogue){
    if(typeof startDialogue === "function") startDialogue(choice.dialogue);
    else addSystem("ДИАЛОГ", "Система диалогов недоступна.");
    return;
  }

  if(choice.check){
    const r = checkStat(choice.check.stat, choice.check.dc, {
      label: choice.check.label,
      bonus: choice.check.bonus || 0
    });
    addRoll(formatRoll(r), rollClass(r.result));
    const next = (r.result === "success" || r.result === "critical")
      ? choice.goto
      : (choice.onFail || GAME.campaign.sceneId);
    followSceneTarget(next, next === "__chapter2__" || next === "__restart__" || next === "__exit" ? undefined : 150);
    return;
  }

  followSceneTarget(choice.goto);
}

function currentSceneChoices(){
  if(!GAME.campaign?.active) return [];
  const sc = CAMPAIGN_SCENARIOS[GAME.campaign.scenarioId];
  const scene = sc && sc.scenes && sc.scenes[GAME.campaign.sceneId];
  if(!scene || !scene.choices) return [];
  return scene.choices.map((c,i) => ({...c, _idx:i}));
}

/* ============================================================
   Условия сцен / выборов
   ============================================================ */
function sceneRequirementsMet(req){
  if(!req) return true;
  const c = GAME.character;
  const flags = GAME.world?.flags || {};
  if(req.flag){
    for(const [k,v] of Object.entries(req.flag)) if(flags[k] !== v) return false;
  }
  if(req.notFlag){
    const denied = Array.isArray(req.notFlag) ? req.notFlag : Object.keys(req.notFlag);
    for(const key of denied) if(flags[key] === true) return false;
  }
  if(req.characterName && (!c || c.name !== req.characterName)) return false;
  if(req.classId && (!c || c.classId !== req.classId)) return false;
  if(req.hasItem && !hasItem(req.hasItem)) return false;
  if(req.quest){
    const qr = typeof req.quest === "string" ? {id:req.quest, status:req.questStatus || "active"} : req.quest;
    const q = qr && typeof qr.id === "string" ? GAME.quests?.[qr.id] : null;
    if(!q || q.status !== (qr.status || req.questStatus || "active")) return false;
  }
  if(req.reputation){
    for(const [f,v] of Object.entries(req.reputation)){
      if(!c || !Number.isFinite(Number(v)) || (Number(c.reputation?.[f]) || 0) < Number(v)) return false;
    }
  }
  if(req.evidence){
    const wanted = Array.isArray(req.evidence) ? req.evidence : [req.evidence];
    if(wanted.some(id => typeof hasEvidence !== "function" || !hasEvidence(id))) return false;
  }
  if(typeof req.minHeat === "number" && (Number(GAME.world?.heat) || 0) < req.minHeat) return false;
  if(typeof req.maxHeat === "number" && (Number(GAME.world?.heat) || 0) > req.maxHeat) return false;
  // Optional context gates for authored choices. All thresholds are descriptive,
  // deterministic state checks; they do not expose secret enemy stats.
  if(req.director){
    const d = typeof ensureCampaignDirectorState === "function" ? ensureCampaignDirectorState() : (GAME.world?.director || {});
    for(const [metric, range] of Object.entries(req.director)){
      if(!["threat","order","morale","supplies"].includes(metric)) return false;
      const actual = Number(d[metric]);
      if(!Number.isFinite(actual)) return false;
      if(typeof range === "number" && actual !== range) return false;
      if(range && typeof range === "object"){
        if(Number.isFinite(range.min) && actual < range.min) return false;
        if(Number.isFinite(range.max) && actual > range.max) return false;
      }
    }
  }
  if(req.district){
    const continuity = typeof ensureContinuityState === "function" ? ensureContinuityState() : GAME.world?.continuity;
    for(const [districtId, metrics] of Object.entries(req.district)){
      const district = continuity?.districts?.[districtId];
      if(!district || !metrics || typeof metrics !== "object") return false;
      for(const [metric, range] of Object.entries(metrics)){
        if(!["stability","security","warpRisk"].includes(metric)) return false;
        const actual = Number(district[metric]);
        if(!Number.isFinite(actual)) return false;
        if(typeof range === "number" && actual !== range) return false;
        if(range && typeof range === "object"){
          if(Number.isFinite(range.min) && actual < range.min) return false;
          if(Number.isFinite(range.max) && actual > range.max) return false;
        }
      }
    }
  }
  if(req.relationship){
    for(const [name, thresholds] of Object.entries(req.relationship)){
      const rel = typeof ensureContinuityRelationship === "function" ? ensureContinuityRelationship(name) : GAME.world?.continuity?.relationships?.[name];
      if(!rel || !thresholds || typeof thresholds !== "object") return false;
      for(const [metric, limits] of Object.entries(thresholds)){
        const key = ({minTrust:"trust",maxTrust:"trust",minRespect:"respect",maxRespect:"respect",minFear:"fear",maxFear:"fear"})[metric];
        if(!key) return false;
        const actual = Number(rel[key]) || 0;
        if(metric.startsWith("min") && actual < limits) return false;
        if(metric.startsWith("max") && actual > limits) return false;
      }
    }
  }
  return true;
}
/** Простая подсказка по текущей сцене */
function getSceneHint(){
  if(!GAME.campaign?.active) return "Начни новую кампанию, чтобы получить подсказки.";
  const sc = CAMPAIGN_SCENARIOS[GAME.campaign.scenarioId];
  const scene = sc?.scenes?.[GAME.campaign.sceneId];
  if(!scene) return "Осмотрись и проверь доступные направления.";

  const choices = (scene.choices || []).filter(c => sceneRequirementsMet(c.requires || {}));
  if(choices.length){
    const labels = choices.slice(0, 3).map(c => `${c.label}`).join(", ");
    return `Доступные варианты: ${labels}. Выбери действие кнопкой; если нужного варианта нет, изучи другие доступные сцены и улики.`;
  }
  if(scene.combat) return "Здесь опасно. Готовься к бою или найди другой путь.";
  return "Осмотрись, поговори с присутствующими и проверь доступные терминалы, двери и улики. Действия выполняются кнопками сцены.";
}
