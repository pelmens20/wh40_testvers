/* ============================================================
   EVENTS-BUS.JS — глобальная шина событий
   ------------------------------------------------------------
   Все системы общаются через события, а не через прямые вызовы.
   ============================================================ */

const Bus = {
  _handlers: {},

  on(event, fn){
    (this._handlers[event] ||= []).push(fn);
    return () => this.off(event, fn);
  },

  off(event, fn){
    if(!this._handlers[event]) return;
    this._handlers[event] = this._handlers[event].filter(h => h !== fn);
  },

  emit(event, payload){
    const list = this._handlers[event] || [];
    list.forEach(fn => {
      try { fn(payload || {}); }
      catch(e){ console.error(`[Bus] handler for "${event}" failed:`, e); }
    });
    // wildcard-подписка
    (this._handlers["*"] || []).forEach(fn => {
      try { fn({event, payload}); }
      catch(e){ console.error("[Bus] wildcard failed:", e); }
    });
  },

  clear(){ this._handlers = {}; }
};

/* Список стандартных событий — для справки:
   scene_entered     {sceneId, title}
   choice_made       {sceneId, choice}
   check_rolled      {label, d20, total, dc, result}
   combat_started    {enemy}
   combat_ended      {result}
   enemy_killed      {enemy, xp}
   player_damaged    {dmg, hp}
   player_healed     {hp}
   player_died       {}
   item_gained       {name, qty}
   item_used         {name}
   quest_progressed  {questId, step}
   quest_completed   {questId}
   npc_talked        {name}
   npc_attitude      {name, delta}
   location_changed  {from, to}
   time_advanced     {minutes, day, hour}
   flag_set          {key, value}
   heat_changed      {heat, delta}
   clue_gained       {clues, delta}
*/
