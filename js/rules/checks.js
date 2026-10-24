/* ============================================================
   RULES / CHECKS.JS — броски и проверки
   ============================================================ */

function modifier(score){
  if(score<=9) return -1;
  if(score<=11) return 0;
  if(score<=13) return 1;
  if(score<=15) return 2;
  if(score<=17) return 3;
  if(score<=19) return 4;
  return 5;
}

function rollCheck({statScore=10, prof=0, dc=10, label="Проверка", bonus=0}={}){
  const d20 = RNG.die(20);
  const mod = modifier(statScore);
  const total = d20 + mod + prof + bonus;
  let result = "fail";
  if(d20 === 20) result = "critical";
  else if(d20 === 1) result = "critical_fail";
  else if(total >= dc) result = "success";
  return {d20, mod, prof, bonus, total, dc, result, label};
}

function checkStat(stat, dc, opts = {}){
  const c = GAME.character;
  let bonus = opts.bonus || 0;
  const notes = [];

  if(hasCondition("Усталость")){
    bonus -= 1; notes.push("Усталость: -1");
  }
  if(hasCondition("Отравление")){
    bonus -= 1; notes.push("Отравление: -1");
  }
  if(hasCondition("Оглушение") && stat === "dex"){
    bonus -= 2; notes.push("Оглушение: -2 к DEX");
  }
  if(hasCondition("Испуг") && stat === "wil"){
    bonus -= 2; notes.push("Испуг: -2 к WIL");
  }
  if(hasCondition("Вдохновение")){
    bonus += 2;
    removeCondition("Вдохновение");
    notes.push("Вдохновение: +2");
  }
  // Порча влияет на WIL
  if(stat === "wil" && typeof corruptionWillPenalty === "function"){
    const pen = corruptionWillPenalty();
    if(pen){
    bonus += pen;
    notes.push(`Порча: ${pen}`);
 }
}
  // Полевые доктрины — постоянные бонусы выбранной специализации.
  if(typeof getDoctrineCheckBonus === "function"){
    const doctrineBonus = getDoctrineCheckBonus(stat);
    if(doctrineBonus){ bonus += doctrineBonus; notes.push(`Полевые доктрины: ${doctrineBonus > 0 ? "+" : ""}${doctrineBonus}`); }
  }

  // Контекстные преимущества классов и состояние операции.
  // Бонусы малы, ограничены тематическими проверками и видимы в расшифровке броска.
  if(typeof campaignDirectorCheckModifiers === "function"){
    const contextual = campaignDirectorCheckModifiers(stat, opts.label || "");
    if(contextual && Number.isFinite(contextual.bonus) && contextual.bonus){
      bonus += contextual.bonus;
      notes.push(...(Array.isArray(contextual.notes) ? contextual.notes : []));
    }
  }

  // Бонусы утилитарных спутников (сервочереп)
  if(typeof companionBonus === "function"){
    const intBonus = companionBonus("int");
    if(intBonus && stat === "int"){
      bonus += intBonus;
      notes.push(`Сервочереп: +${intBonus} к INT`);
    }
  }

  const r = rollCheck({
    statScore: c.stats[stat],
    prof: c.prof,
    dc,
    label: opts.label || "ПРОВЕРКА",
    bonus
  });
  r.notes = notes;
  Bus.emit("check_rolled", r);
  return r;
}

function resultText(r){
  return ({
    critical:"КРИТИЧЕСКИЙ УСПЕХ",
    critical_fail:"КРИТИЧЕСКИЙ ПРОВАЛ",
    success:"УСПЕХ",
    fail:"ПРОВАЛ"
  })[r];
}

function formatRoll(r){
  let text = `d20 = ${r.d20}\n`;
  text += `Модификатор = ${r.mod>=0?"+":""}${r.mod}\n`;
  text += `Мастерство = +${r.prof}\n`;
  if(r.bonus) text += `Ситуация = ${r.bonus>=0?"+":""}${r.bonus}\n`;
  if(r.notes && r.notes.length) text += r.notes.map(n => `• ${n}`).join("\n") + "\n";
  text += `Итог = ${r.total}\n`;
  text += `Сложность = ${r.dc}\n`;
  text += `→ ${resultText(r.result)}`;
  return text;
}

function rollClass(res){
  if(res === "critical" || res === "critical_fail") return "entry-critical";
  if(res === "success") return "entry-success";
  return "entry-fail";
}
