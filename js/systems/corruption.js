/* ============================================================
   SYSTEMS / CORRUPTION.JS — Порча Варпа
   ------------------------------------------------------------
   Шкала 0–10. Растёт от контакта с Варпом, падает от молитв.
   Влияет на WIL, сны, диалоги, финал кампании.
   ============================================================ */

const CORRUPTION_STAGES = {
  0: { name:"ЧИСТ",           color:"#7cb078", desc:"Варп не коснулся тебя." },
  1: { name:"ЧИСТ",           color:"#7cb078", desc:"Варп не коснулся тебя." },
  2: { name:"ЧИСТ",           color:"#7cb078", desc:"Варп не коснулся тебя." },
  3: { name:"ТЕНИ",           color:"#d4a24a", desc:"Ты видишь то, чего не видят другие." },
  4: { name:"ТЕНИ",           color:"#d4a24a", desc:"Ты видишь то, чего не видят другие." },
  5: { name:"ТЕНИ",           color:"#d4a24a", desc:"Ты видишь то, чего не видят другие." },
  6: { name:"МЕТКИ",          color:"#9d88bf", desc:"Метки Тзинча проступают на твоей коже." },
  7: { name:"МЕТКИ",          color:"#9d88bf", desc:"Метки Тзинча проступают на твоей коже." },
  8: { name:"МЕТКИ",          color:"#9d88bf", desc:"Метки Тзинча проступают на твоей коже." },
  9: { name:"ВРАТА",          color:"#d63f32", desc:"Ты слышишь его голос. Он говорит с тобой." },
  10:{ name:"НИЗВЕРЖЕНИЕ",    color:"#8b1d1d", desc:"Ты — его. Навсегда." }
};

/* ---------- Инициализация ---------- */
function initCorruption(){
  const c = GAME.character;
  if(!c) return;
  if(typeof c.corruption !== "number") c.corruption = 0;
  if(!GAME.world.corruptionFlags) GAME.world.corruptionFlags = {};
}

/* ---------- Изменение Порчи ---------- */
function changeCorruption(delta, reason){
  const c = GAME.character;
  if(!c) return;

  // Защита от NaN: если corruption не число — инициализируем 0
  if(typeof c.corruption !== "number" || isNaN(c.corruption)){
    c.corruption = 0;
  }

  // Сглаживание: чем выше Порча, тем сложнее набрать
  // Сглаживание: чем выше Порча, тем сложнее набрать
  let actual = delta;
  if(delta > 0){
  if(c.corruption >= 9)      actual = 1;
  else if(c.corruption >= 7) actual = 1;
  else if(c.corruption >= 5) actual = Math.max(1, Math.floor(delta / 2));
  else if(c.corruption >= 3) actual = Math.max(1, Math.floor(delta * 0.66));
  else                        actual = delta;
}

  // A specialist Inquisitorial doctrine softens substantial Warp exposure, but does not make a character immune.
  const corruptionResistance = typeof getDoctrineCheckBonus === "function" ? getDoctrineCheckBonus("corruptionResistance") : 0;
  if(delta > 0 && actual > 1 && corruptionResistance > 0) actual = Math.max(1, actual - corruptionResistance);

  const before = c.corruption;
  c.corruption = Math.max(0, Math.min(10, c.corruption + actual));

  if(delta > 0){
    addSystem("ПОРЧА",
      `Ты чувствуешь, как что-то тёмное касается души.\nПорча: ${before} → ${c.corruption}\n${reason || ""}`);
    Bus.emit("corruption_gained", {delta, total: c.corruption, reason});
    if(typeof companionsReactCorruption === "function") companionsReactCorruption(c.corruption);
  } else if(delta < 0){
    addSystem("ОЧИЩЕНИЕ",
      `Тьма отступает на мгновение.\nПорча: ${before} → ${c.corruption}\n${reason || ""}`);
    Bus.emit("corruption_lost", {delta, total: c.corruption, reason});
  }

  // Ступени
  const oldStage = CORRUPTION_STAGES[before];
  const newStage = CORRUPTION_STAGES[c.corruption];
  if(oldStage && newStage && oldStage.name !== newStage.name){
    addSystem("СТАДИЯ ПОРЧИ", `${newStage.name}\n${newStage.desc}`);
  }

  // Финал
  if(c.corruption >= 10){
    triggerCorruptionEnding();
  }

  // Обновляем интерфейс (полоса Порчи, стадия)
  if(typeof renderAll === "function" && GAME.started){
    renderAll();
  }

  saveGameSilent();
}

/* ---------- Модификатор WIL от Порчи ---------- */
function corruptionWillPenalty(){
  const v = GAME.character?.corruption || 0;
  if(v <= 2) return 0;
  if(v <= 5) return -1;
  if(v <= 8) return -2;
  return -3;
}

/* ---------- Проверка WIL с учётом Порчи ---------- */
function checkWillAgainstCorruption(dc, label){
  const c = GAME.character;
  const r = checkStat("wil", dc, {label: label || "СОПРОТИВЛЕНИЕ ВАРПУ"});
  r.corruptionPenalty = corruptionWillPenalty();
  return r;
}

/* ---------- Сны и видения ---------- */
const DREAMS = [
  { min:3, text:"Тебе снится улей. Он дышит. Из стен выходят тени, и они называют тебя по имени." },
  { min:3, text:"Во сне ты видишь одиннадцать фигур. Они стоят в круге. Двенадцатая — ты." },
  { min:5, text:"Синий огонь во сне. Он не жжёт, но что-то берёт из тебя. Ты просыпаешься с холодом в груди." },
  { min:5, text:"Голос без слов говорит с тобой. Ты не понимаешь язык, но знаешь, что он хочет." },
  { min:7, text:"Ты видишь себя со стороны. Ты стоишь в круге. Ты сам читаешь молитву Тзинчу." },
  { min:9, text:"Он смеётся. Он говорит: «Скоро». Ты не знаешь, кто он, но ты знаешь, что он рядом." }
];

function triggerDreamIfNeeded(){
  const c = GAME.character;
  if(!c) return false;
  const v = c.corruption || 0;
  if(v < 3) return false;
  if(!RNG.chance(0.5)) return false; // 50% шанс на сон при отдыхе

  const available = DREAMS.filter(d => d.min <= v);
  if(!available.length) return false;
  const dream = RNG.pick(available);

  addSystem("СОН", `Тебе снится странное.\n\n${dream.text}`);

  // Иногда сон даёт зацепку
  if(RNG.chance(0.3)){
    GAME.world.clues++;
    Bus.emit("clue_gained", {delta:1, total:GAME.world.clues});
    addSystem("СОН", "Во сне ты видишь то, что видел раньше — но под другим углом. Ты понимаешь больше.");
  }

  return true;
}

/* ---------- Финал кампании ---------- */
function triggerCorruptionEnding(){
  GAME.mode = "corruption-end";
  const role = GAME.character?.classId === "guardsman" ? "солдат" : GAME.character?.classId === "spaceMarine" ? "Астартес" : "служитель Инквизиции";
  addSystem("НИЗВЕРЖЕНИЕ",
    `Голос, который ты связываешь с Тзинчем, заглушает собственные мысли. Ты теряешь контроль над собой; прежняя роль — ${role} — больше не защищает тебя от последствий. Источник голоса не подтверждён независимыми свидетельствами.\n\nКампания заканчивается здесь.`);
  renderAll();
  saveGameSilent();
}

/* ---------- Очищение ---------- */
function prayToEmperor(){
  const c = GAME.character;
  if(!c) return false;
  if(GAME.mode === "combat" || GAME.mode === "death" || GAME.mode === "dead" || GAME.mode === "corruption-end"){
    addSystem("МОЛИТВА", "Сейчас ты не можешь сосредоточиться на молитве. Вернись к ней вне боя и критического состояния.");
    return false;
  }
  if((c.corruption || 0) <= 0){
    addSystem("МОЛИТВА", "Ты не ощущаешь следов Порчи, которые можно было бы смыть.");
    return false;
  }
  const currentDay = Math.max(1, Math.floor(GAME.world?.day || 1));
  if(Number.isFinite(c.lastPrayerDay) && c.lastPrayerDay === currentDay){
    addSystem("МОЛИТВА", "Сегодня ты уже совершил молитву. Повтори обряд после наступления следующего игрового дня.");
    return false;
  }
  // Одна попытка в день: нельзя многократно нажимать кнопку до случайного успеха.
  c.lastPrayerDay = currentDay;
  const r = checkWillAgainstCorruption(10, "МОЛИТВА ИМПЕРАТОРУ");
  addRoll(formatRoll(r), rollClass(r.result));

  if(r.result === "success" || r.result === "critical"){
    changeCorruption(-1, "Твои слова возвращают дыханию ритм. Шёпот Варпа отступает, но память о нём остаётся.");
    saveGameSilent();
    return true;
  }
  addSystem("МОЛИТВА", "Ты молишься, но не находишь покоя. Порча не уменьшилась; следующая попытка — после наступления нового игрового дня.");
  saveGameSilent();
  return false;
}

/* ---------- Святая вода ---------- */
function useHolyWater(){
  if(!hasItem("Святая вода")){
    addSystem("ОЧИЩЕНИЕ", "Святой воды нет.");
    return;
  }
  removeItem("Святая вода", 1);
  changeCorruption(-2, "Святая вода Экклезиархии.");
}

/* ---------- События Порчи ---------- */
Bus.on("check_rolled", r => {
  if(GAME.character?.corruption < 6) return;
  // При Порче 6+ — периодические видения
  if(RNG.chance(0.15)){
    const visions = [
      "На мгновение ты видишь стены в синем свете.",
      "Кто-то шепчет на языке, которого ты не знаешь.",
      "Тени в углу двигаются не так, как должны."
    ];
    addSystem("ВИДЕНИЕ", RNG.pick(visions));
  }
});
