/* ============================================================
   CONDITIONS.JS — состояния персонажа
   ============================================================ */

const CONDITIONS = {
  "Заклинивание": {icon:"⚙", kind:"weapon", desc:"Стрелковое оружие заклинило; потрать действие на устранение неисправности."},
  "Перегрев":      {icon:"♨", kind:"weapon", desc:"Плазмаган перегрет; следующее действие со стрельбой будет потрачено на охлаждение."},
  "Кровотечение": {icon:"✚", kind:"wound",  desc:"-2 HP в начале хода."},
  "Оглушение":    {icon:"✷", kind:"mental", desc:"-2 к проверке DEX."},
  "Испуг":        {icon:"☠", kind:"mental", desc:"-2 к проверке WIL."},
  "Отравление":   {icon:"☣", kind:"wound",  desc:"-3 HP в начале хода (3 хода)."},
  "Усталость":    {icon:"◌", kind:"body",   desc:"-1 ко всем проверкам."},
  "Вдохновение":  {icon:"✦", kind:"boon",   desc:"+2 к следующей проверке."},
  "Прикрытие":    {icon:"▣", kind:"boon",   desc:"+2 к AC до конца хода."}
};

function addCondition(name){
  const c = GAME.character;
  if(!c || !CONDITIONS[name]) return;
  if(!c.conditions.includes(name)) c.conditions.push(name);
  Bus.emit("condition_added", {name});
}

function removeCondition(name){
  const c = GAME.character;
  if(!c) return;
  const before = c.conditions.length;
  c.conditions = c.conditions.filter(x => x !== name);
  if(before !== c.conditions.length) Bus.emit("condition_removed", {name});
}

function hasCondition(name){
  return !!GAME.character && GAME.character.conditions.includes(name);
}

function clearConditionsBy(kind){
  const c = GAME.character;
  if(!c) return;
  c.conditions = c.conditions.filter(n => CONDITIONS[n]?.kind !== kind);
}
