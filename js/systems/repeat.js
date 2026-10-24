/* ============================================================
   SYSTEMS / REPEAT.JS — защита от спама однотипных действий
   ============================================================ */

const SOFT_VERBS = ["inspect", "search", "listen", "read", "check"];

function actionKey(intent){
  if(!intent || !intent.verb) return null;
  if(!SOFT_VERBS.includes(intent.verb)) return null;
  return `${intent.verb}:${intent.target || "_"}:${GAME.character.location}`;
}

function hasRecentAction(intent){
  const key = actionKey(intent);
  if(!key) return false;
  if(!GAME._recentActions) GAME._recentActions = {};
  const lastTurn = GAME._recentActions[key];
  if(!lastTurn) return false;
  return (GAME.turn - lastTurn) < 4;
}

function rememberAction(intent){
  const key = actionKey(intent);
  if(!key) return;
  if(!GAME._recentActions) GAME._recentActions = {};
  GAME._recentActions[key] = GAME.turn;
}

function clearActionHistory(){
  GAME._recentActions = {};
}
