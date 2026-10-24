/* ============================================================
   CONTENT / CODEX.JS — Кодекс (сборка из codex-lore.js)
   ------------------------------------------------------------
   Все данные — в codex-lore.js. Здесь только агрегатор.
   ============================================================ */

const CODEX = {
  factions:   typeof CODEX_FACTIONS  !== "undefined" ? CODEX_FACTIONS  : [],
  terms:      typeof CODEX_TERMS     !== "undefined" ? CODEX_TERMS     : [],
  enemies:    typeof CODEX_ENEMIES   !== "undefined" ? CODEX_ENEMIES   : [],
  legions:    typeof CODEX_LEGIONS   !== "undefined" ? CODEX_LEGIONS   : { loyalist: [], traitor: [] },
  chaosGods:  typeof CODEX_CHAOS_GODS !== "undefined" ? CODEX_CHAOS_GODS : []
};

function codexGet(section, id){
  const data = CODEX[section];
  if(Array.isArray(data)) return data.find(e => e.id === id);
  if(data && data.loyalist && data.traitor){
    return [...data.loyalist, ...data.traitor].find(e => e.id === id);
  }
  return null;
}
