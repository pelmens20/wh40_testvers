/* ============================================================
   EFFECTS.JS — применение эффектов сцен/выборов
   ------------------------------------------------------------
   Единственный источник правды о том, что может эффект.
   ============================================================ */

function applyEffects(effects, onceId = null){
  if(!effects) return [];
  const out = [];
  const effectKey = onceId || effects.onceId || null;
  if(effectKey && typeof GAME !== "undefined" && GAME.world){
    if(!GAME.world.appliedEffectIds || typeof GAME.world.appliedEffectIds !== "object" || Array.isArray(GAME.world.appliedEffectIds)) GAME.world.appliedEffectIds = {};
    if(GAME.world.appliedEffectIds[effectKey]) return [];
  }

  if(effects.consequence && typeof applyStructuredConsequence === "function"){
    const result = applyStructuredConsequence(effects.consequence);
    if(result && result.message) out.push(result.message);
  }
  if(effects.ending && typeof recordCampaignEnding === "function"){
    recordCampaignEnding(effects.ending.id, effects.ending.title, effects.ending.summary);
    out.push(`Концовка зафиксирована: ${effects.ending.title || effects.ending.id}`);
  }
  if(effects.endingFromProfile && typeof recordCampaignEnding === "function" && typeof getCampaignEndingProfile === "function"){
    const profile = getCampaignEndingProfile();
    recordCampaignEnding(`final-${profile.id}`, profile.title, profile.description);
    out.push(`Исход кампании зафиксирован: ${profile.title}`);
  }

  if(effects.evidence){
    const evidenceAdded = typeof recordEvidence === "function" ? recordEvidence(effects.evidence, GAME.campaign?.sceneId) : [];
    evidenceAdded.forEach(title => out.push(`Улика внесена в досье: ${title}`));
  }

  if(effects.clue){
    GAME.world.clues += effects.clue;
    Bus.emit("clue_gained", {delta: effects.clue, total: GAME.world.clues});
    out.push(`Зацепки: +${effects.clue}`);
  }
  if(effects.heat){
    GAME.world.heat = Math.max(0, GAME.world.heat + effects.heat);
    Bus.emit("heat_changed", {delta: effects.heat, heat: GAME.world.heat});
    out.push(`Тревога: ${effects.heat>0?"+":""}${effects.heat}`);
  }
  if(effects.xp){
    const lvls = addXP(effects.xp);
    lvls.forEach(l => out.push(l));
  }
  if(effects.credits){
    GAME.character.credits = Math.max(0, GAME.character.credits + effects.credits);
    out.push(`Кредиты: ${effects.credits>0?"+":""}${effects.credits}`);
  }
  if(effects.hp){
    if(effects.hp > 0) healPlayer(effects.hp);
    else dealDamageToPlayer(-effects.hp);
  }
  if(effects.item){
    addItem(effects.item, effects.qty || 1);
  }
  if(effects.removeItem){
    removeItem(effects.removeItem, effects.qty || 1);
  }
  if(effects.condition){
    addCondition(effects.condition);
  }
  if(effects.removeCondition){
    removeCondition(effects.removeCondition);
  }
  if(effects.reputation){
    for(const [f,v] of Object.entries(effects.reputation)) changeRep(f, v);
  }
  if(effects.questFail){
    const failures = Array.isArray(effects.questFail) ? effects.questFail : [effects.questFail];
    for(const item of failures){
      const questId = typeof item === "string" ? item : item?.id;
      const reason = typeof item === "object" && item ? item.reason : "Ты отказался от выполнения приказа.";
      if(questId && typeof failQuest === "function" && failQuest(questId, reason)) out.push(`Приказ провален: ${GAME.quests?.[questId]?.title || questId}`);
    }
  }
  if(effects.questObjective){
    const objectives = Array.isArray(effects.questObjective) ? effects.questObjective : [effects.questObjective];
    for(const item of objectives){
      if(!item || typeof item !== "object" || typeof item.id !== "string" || typeof item.key !== "string") continue;
      const source = effectKey ? `${effectKey}:objective:${item.id}:${item.key}` : null;
      if(typeof markQuestObjective === "function" && markQuestObjective(item.id, item.key, source)){
        out.push(`Этап задания отмечен: ${GAME.quests?.[item.id]?.objectives?.[(GAME.quests[item.id].objectiveKeys || []).indexOf(item.key)] || item.key}`);
      }
    }
  }
  if(effects.questProgress){
    // Include the effect identity so the same authored scene/choice cannot advance
    // the same quest twice after a reload, repeated visit, or back-stack replay.
    const progressSource = effectKey ? `${effectKey}:quest:${effects.questProgress}` : null;
    updateQuest(effects.questProgress, effects.questProgressDelta || 1, progressSource);
  }
  if(effects.questComplete){
    const completions = Array.isArray(effects.questComplete) ? effects.questComplete : [effects.questComplete];
    for(const questId of completions) if(typeof questId === "string") completeQuest(questId, {force:true, sourceId:effectKey});
  }
  if(effects.flag){
    for(const [k,v] of Object.entries(effects.flag)) setFlag(k, v);
  }
  if(effects.moveTo){
    GAME.character.location = effects.moveTo;
    GAME.world.current = effects.moveTo;
    revealLocation(effects.moveTo);
    out.push(`Перемещение: ${effects.moveTo}`);
  }
  if(effects.reveal){
    const arr = Array.isArray(effects.reveal) ? effects.reveal : [effects.reveal];
    arr.forEach(revealLocation);
  }
  if(effects.npcAttitude){
    for(const [n,v] of Object.entries(effects.npcAttitude)) bumpNPC(n, v);
  }
  if(effects.corruption){
  if(typeof changeCorruption === "function"){
    changeCorruption(effects.corruption, "Событие сцены");
  }
  // out.push(`Порча: ${effects.corruption>0?"+":""}${effects.corruption}`);
}
  if(effects.addCompanion){
    if(typeof addCompanion === "function"){
    addCompanion(effects.addCompanion);
      out.push(`Спутник: ${effects.addCompanion}`);
    }
  }
  if(effects.removeCompanion){
    if(typeof dismissCompanion === "function"){
      dismissCompanion(effects.removeCompanion);
    }
  }
    /* ---------- Время ---------- */
  if(effects.advanceTime){
    if(typeof advanceTime === "function") advanceTime(effects.advanceTime);
    out.push(`Время: +${effects.advanceTime} мин`);
  }

  /* ---------- Боеприпасы ---------- */
  if(effects.ammo_lasgun){
    GAME.character.ammo.lasgun = (GAME.character.ammo.lasgun||0) + effects.ammo_lasgun;
  }
  if(effects.ammo_laspistol){
    GAME.character.ammo.laspistol = (GAME.character.ammo.laspistol||0) + effects.ammo_laspistol;
  }
  if(effects.ammo_bolter){
    GAME.character.ammo.bolter = (GAME.character.ammo.bolter||0) + effects.ammo_bolter;
  }
  if(effects.ammo_plasma){
    GAME.character.ammo.plasma = (GAME.character.ammo.plasma||0) + effects.ammo_plasma;
  }

  // Idempotency protects rewards, clue counts, HP and reputation from being farmed
  // by re-entering the same scene/choice after loading or using the back stack.
  if(effectKey && typeof GAME !== "undefined" && GAME.world){
    if(!GAME.world.appliedEffectIds || typeof GAME.world.appliedEffectIds !== "object" || Array.isArray(GAME.world.appliedEffectIds)) GAME.world.appliedEffectIds = {};
    GAME.world.appliedEffectIds[effectKey] = true;
    // Bound save-file growth during long campaigns while retaining a generous
    // recent replay-protection window. Quest progressSources keep their own locks.
    const appliedKeys = Object.keys(GAME.world.appliedEffectIds);
    if(appliedKeys.length > 3000){
      for(const staleKey of appliedKeys.slice(0, appliedKeys.length - 3000)) delete GAME.world.appliedEffectIds[staleKey];
    }
  }
  return out;
}
