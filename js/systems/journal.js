/* ============================================================
   JOURNAL.JS — журнал действий
   ============================================================ */

function jlog(kind, data){
  GAME.journal = GAME.journal || [];
  GAME.journal.push({
    turn: GAME.turn,
    day: GAME.world.day,
    time: timeString(),
    kind,
    ...data
  });
  if(GAME.journal.length > 500) GAME.journal.shift();
}

/* Подписки на Bus — журналируем всё важное */
Bus.on("scene_entered",  p => jlog("scene",  {sceneId:p.sceneId, title:p.title}));
Bus.on("check_rolled",   p => jlog("roll",   {label:p.label, d20:p.d20, total:p.total, dc:p.dc, result:p.result}));
Bus.on("combat_started", p => jlog("combat", {event:"start", enemy:p.enemy}));
Bus.on("combat_ended",   p => jlog("combat", {event:p.result}));
Bus.on("enemy_killed",   p => jlog("combat", {event:"kill", enemy:p.enemy, xp:p.xp}));
Bus.on("item_gained",    p => jlog("item",   {event:"gain", name:p.name, qty:p.qty}));
Bus.on("item_used",      p => jlog("item",   {event:"use", name:p.name}));
Bus.on("quest_progressed", p => jlog("quest", {questId:p.questId, step:p.step}));
Bus.on("quest_completed",  p => jlog("quest", {questId:p.questId, event:"complete"}));
Bus.on("npc_attitude",   p => jlog("npc",    {name:p.name, event:`attitude ${p.delta}`}));
Bus.on("location_changed", p => jlog("move", {from:p.from, to:p.to}));
Bus.on("flag_set",       p => jlog("flag",   {key:p.key, value:p.value}));
Bus.on("clue_gained",    p => jlog("clue",   {delta:p.delta, total:p.total}));
Bus.on("choice_made", p => jlog("choice", {sceneId: p.sceneId, label: p.choice?.label || "Выбор"}));
