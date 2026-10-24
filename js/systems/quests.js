/* ============================================================
   QUESTS.JS — квестовый реестр, именованные цели и защита наград
   ============================================================ */

function questObjectiveKeys(q){
  if(!q || !Array.isArray(q.objectives)) return [];
  if(!Array.isArray(q.objectiveKeys) || q.objectiveKeys.length !== q.objectives.length || new Set(q.objectiveKeys).size !== q.objectiveKeys.length){
    q.objectiveKeys = q.objectives.map((_, i) => `objective${i + 1}`);
  }
  return q.objectiveKeys;
}

function normalizeQuestObjectives(q){
  const keys = questObjectiveKeys(q);
  if(!q.completedObjectives || typeof q.completedObjectives !== "object" || Array.isArray(q.completedObjectives)) q.completedObjectives = {};
  if(!q.objectiveSources || typeof q.objectiveSources !== "object" || Array.isArray(q.objectiveSources)) q.objectiveSources = {};
  // Migrate legacy saves: preserve the ordered progress already earned.
  const legacyProgress = Number.isFinite(q.progress) ? Math.max(0, Math.min(keys.length, Math.floor(q.progress))) : 0;
  for(let i=0;i<legacyProgress;i++) if(q.completedObjectives[keys[i]] === undefined) q.completedObjectives[keys[i]] = true;
  for(const key of keys){
    const value = q.completedObjectives[key];
    if(value !== true && value !== "skipped") delete q.completedObjectives[key];
  }
  refreshQuestProgress(q);
  return q;
}

function refreshQuestProgress(q){
  const keys = questObjectiveKeys(q);
  const state = q.completedObjectives || {};
  let prefix = 0;
  while(prefix < keys.length && (state[keys[prefix]] === true || state[keys[prefix]] === "skipped")) prefix++;
  q.progress = prefix;
  return prefix;
}

function initQuests(){
  GAME.quests = {};
  for(const def of QUEST_DEFS){
    const q = {
      ...def,
      objectiveKeys: Array.isArray(def.objectiveKeys) ? [...def.objectiveKeys] : def.objectives.map((_,i)=>`objective${i+1}`),
      progress:0,
      progressSources: {},
      completedObjectives: {},
      objectiveSources: {},
      rewardClaimed:false,
      failedReason:null,
      status: "hidden"
    };
    GAME.quests[q.id] = q;
  }
  if (GAME.quests.silentForge) GAME.quests.silentForge.status = "active";
}

function activateQuestIfHidden(q){
  if(q && q.status === "hidden"){
    q.status = "active";
    addSystem("ЗАДАНИЕ", `Новое задание: ${q.title}\n${q.description}`);
  }
}

function markQuestObjective(id, objectiveKey, sourceKey = null){
  const q = GAME.quests?.[id];
  if(!q || q.status === "complete" || q.status === "failed" || q.rewardClaimed === true) return false;
  const keys = questObjectiveKeys(q);
  normalizeQuestObjectives(q);
  if(!keys.includes(objectiveKey)){
    console.warn(`[Quest] Unknown objective '${objectiveKey}' for '${id}'.`);
    return false;
  }
  if(sourceKey !== null && sourceKey !== undefined && String(sourceKey).length){
    const source = String(sourceKey).slice(0,240);
    if(q.objectiveSources[source]) return false;
    q.objectiveSources[source] = true;
  }
  if(q.completedObjectives[objectiveKey] === true || q.completedObjectives[objectiveKey] === "skipped") return false;
  activateQuestIfHidden(q);
  if(q.status !== "active") return false;
  q.completedObjectives[objectiveKey] = true;
  const progress = refreshQuestProgress(q);
  const step = keys.indexOf(objectiveKey) + 1;
  Bus.emit("quest_progressed", {questId:id, step:progress, total:keys.length, objectiveKey, objectiveIndex:step-1, objectiveTitle:q.objectives[step-1]});
  if(typeof saveGameSilent === "function") saveGameSilent();
  return true;
}

// Legacy counter API kept for compatibility with old content and imported saves.
// New campaign content should prefer markQuestObjective(id, key, sourceKey).
function updateQuest(id, delta = 1, sourceKey = null){
  const q = GAME.quests?.[id];
  if(!q || q.status === "complete" || q.status === "failed" || q.rewardClaimed === true) return false;
  const amount = Number(delta);
  if(!Number.isFinite(amount) || amount <= 0) return false;
  const steps = Math.max(1, Math.floor(amount));
  normalizeQuestObjectives(q);
  if(sourceKey !== null && sourceKey !== undefined && String(sourceKey).length){
    const source = String(sourceKey).slice(0,240);
    if(q.progressSources[source]) return false;
    q.progressSources[source] = true;
  }
  activateQuestIfHidden(q);
  if(q.status !== "active") return false;
  const keys = questObjectiveKeys(q);
  const before = q.progress;
  let changed = false;
  for(let i=0; i<steps; i++){
    const next = keys.find(key => q.completedObjectives[key] !== true && q.completedObjectives[key] !== "skipped");
    if(!next) break;
    q.completedObjectives[next] = true;
    changed = true;
  }
  const progress = refreshQuestProgress(q);
  if(!changed || progress === before) return false;
  Bus.emit("quest_progressed", {questId:id, step:progress, total:keys.length});
  if(progress >= keys.length) completeQuest(id);
  if(typeof saveGameSilent === "function") saveGameSilent();
  return true;
}

function completeQuest(id, options = {}){
  const q = GAME.quests?.[id];
  if(!q || q.status === "complete" || q.status === "failed" || q.rewardClaimed === true) return false;
  const keys = questObjectiveKeys(q);
  if(!keys.length) return false;
  normalizeQuestObjectives(q);
  if(options.force === true){
    for(const key of keys) if(q.completedObjectives[key] !== true && q.completedObjectives[key] !== "skipped") q.completedObjectives[key] = "skipped";
    refreshQuestProgress(q);
  }
  if(q.progress < keys.length) return false;
  // Claim lock is set before external reward functions to make completion idempotent.
  q.rewardClaimed = true;
  q.status = "complete";
  q.completedAt = { day: GAME.world?.day || 1, scenarioId: GAME.campaign?.scenarioId || null, sceneId: GAME.campaign?.sceneId || null };
  const xp = Number.isFinite(q.rewards?.xp) ? Math.max(0, Math.floor(q.rewards.xp)) : 0;
  const credits = Number.isFinite(q.rewards?.credits) ? Math.max(0, Math.floor(q.rewards.credits)) : 0;
  if(GAME.character){
    GAME.character.credits = Math.max(0, (Number(GAME.character.credits) || 0) + credits);
  }
  const ev = typeof addXP === "function" ? (addXP(xp) || []) : [];
  const repSummary = [];
  for(const [faction, rawDelta] of Object.entries(q.rewards?.reputation || {})){
    const delta = Number(rawDelta);
    if(Number.isFinite(delta) && delta !== 0 && typeof changeRep === "function"){
      changeRep(faction, delta);
      repSummary.push(`${faction} ${delta > 0 ? "+" : ""}${delta}`);
    }
  }
  const rewardParts = [`${xp} XP`, `${credits} кредитов`];
  if(repSummary.length) rewardParts.push(`репутация: ${repSummary.join(", ")}`);
  const skipped = keys.filter(key => q.completedObjectives[key] === "skipped").length;
  const note = skipped ? `\nЧасть этапов завершена обходным путём или осталась неустановленной (${skipped}); пробелы отмечены в журнале.` : "";
  addSystem("ЗАДАНИЕ ВЫПОЛНЕНО", `${q.title}\nНаграда: ${rewardParts.join("; ")}.${note}`);
  ev.forEach(x => addSystem("ПОВЫШЕНИЕ", x));
  Bus.emit("quest_completed", {questId:id, xp, credits, reputation: q.rewards?.reputation || {}, skippedObjectives: skipped});
  if(typeof saveGameSilent === "function") saveGameSilent();
  return true;
}

function failQuest(id, reason = "Приказ сорван."){
  const q = GAME.quests?.[id];
  if(!q || q.status === "complete" || q.status === "failed" || q.rewardClaimed === true) return false;
  q.status = "failed";
  q.failedReason = String(reason || "Приказ сорван.").slice(0, 500);
  q.failedAt = { day: GAME.world?.day || 1, scenarioId: GAME.campaign?.scenarioId || null, sceneId: GAME.campaign?.sceneId || null };
  addSystem("ПРИКАЗ НЕ ВЫПОЛНЕН", `${q.title}\n${q.failedReason}\nНаграда не выдана.`);
  Bus.emit("quest_failed", {questId:id, reason:q.failedReason});
  if(typeof saveGameSilent === "function") saveGameSilent();
  return true;
}

function normalizeQuestCollection(quests){
  if(!quests || typeof quests !== "object" || Array.isArray(quests)) return quests;
  for(const def of QUEST_DEFS){
    const q = quests[def.id];
    if(!q || typeof q !== "object") continue;
    q.objectives = Array.isArray(q.objectives) ? q.objectives : [...def.objectives];
    q.objectiveKeys = Array.isArray(def.objectiveKeys) ? [...def.objectiveKeys] : def.objectives.map((_,i)=>`objective${i+1}`);
    normalizeQuestObjectives(q);
    q.progressSources = q.progressSources && typeof q.progressSources === "object" && !Array.isArray(q.progressSources) ? q.progressSources : {};
    q.rewardClaimed = q.rewardClaimed === true || q.status === "complete";
    if(!["hidden","active","complete","failed"].includes(q.status)) q.status = q.id === "silentForge" ? "active" : "hidden";
  }
  return quests;
}
