/* ============================================================
   REPUTATION.JS — личная репутация оперативника у фракций
   ============================================================ */
function changeRep(faction, delta){
  const c = GAME.character;
  if(!c || typeof faction !== "string" || !faction.trim()) return false;
  const amount = Number(delta);
  if(!Number.isFinite(amount) || amount === 0) return false;
  if(!c.reputation || typeof c.reputation !== "object" || Array.isArray(c.reputation)) c.reputation = {};
  const before = Number.isFinite(c.reputation[faction]) ? c.reputation[faction] : 0;
  const after = Math.max(-100, Math.min(100, before + amount));
  c.reputation[faction] = after;
  const applied = after - before;
  if(applied !== 0){
    Bus.emit("reputation_changed", {faction, delta:applied, requestedDelta:amount, total:after});
    if(typeof continuityRecordEvent === "function") continuityRecordEvent("personal-reputation", faction, `Репутация ${applied > 0 ? "+" : ""}${applied}; итог ${after}.`, {faction, delta:applied});
  }
  return applied !== 0;
}
function repLevel(value){
  if(value <= -10) return "ВРАЖДЕБНЫЙ";
  if(value <= -3) return "НЕДОВЕРЧИВЫЙ";
  if(value < 3) return "НЕЙТРАЛЬНЫЙ";
  if(value < 10) return "ДРУЖЕСТВЕННЫЙ";
  return "СОЮЗНИК";
}
