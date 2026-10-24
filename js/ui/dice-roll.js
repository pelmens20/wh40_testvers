/* ============================================================
   UI / DICE-ROLL.JS — кубик d20 с анимацией
   ============================================================ */

let _diceRolling = false;

function renderDiceArea(){
  const fate = GAME.character?.fate ?? 0;
  const canReroll = GAME._lastRoll && fate > 0;

  // Подставляем результат последнего броска, если он был
  let lastD20 = "—";
  let lastTag = "результат";
  let lastCrit = false;
  let lastFail = false;

  if(GAME._lastRoll){
    const r = GAME._lastRoll;
    lastD20 = r.d20;
    if(r.d20 === 20){ lastTag = "КРИТ. УСПЕХ"; lastCrit = true; }
    else if(r.d20 === 1){ lastTag = "КРИТ. ПРОВАЛ"; lastFail = true; }
    else if(r.result === "success") lastTag = "УСПЕХ";
    else if(r.result === "fail")    lastTag = "ПРОВАЛ";
  }

  const resultClass = lastCrit ? "crit" : lastFail ? "fail" : "";
  const infoTitle   = GAME._lastRoll
    ? `${GAME._lastRoll.label}: d20=${GAME._lastRoll.d20} + ${GAME._lastRoll.mod} мод + ${GAME._lastRoll.prof} проф${GAME._lastRoll.bonus?` + ${GAME._lastRoll.bonus} сит`:""}`
    : "ОЖИДАНИЕ БРОСКА";
  const infoText = GAME._lastRoll
    ? `Итог: ${GAME._lastRoll.total}  vs  DC ${GAME._lastRoll.dc}  →  ${lastTag}`
    : "Соверши действие — движок бросит за тебя.";

  return `
    <section class="panel">
      <div class="panel-head">
        <span>🎲 КУБИК СУДЬБЫ</span>
        <span>d20</span>
      </div>
      <div class="panel-body">
        <div class="dice-area">

          <div class="dice-cube-wrap">
            <div class="d20-cube" id="d20Cube">
              <svg class="d20-svg" viewBox="0 0 100 100">
                <polygon class="d20-face" points="50,4 91,27 91,73 50,96 9,73 9,27"/>
                <polygon class="d20-face inner" points="50,30 79,64 21,64"/>
                <line class="d20-edge" x1="50" y1="4"  x2="50" y2="30"/>
                <line class="d20-edge" x1="91" y1="27" x2="79" y2="64"/>
                <line class="d20-edge" x1="91" y1="73" x2="79" y2="64"/>
                <line class="d20-edge" x1="50" y1="96" x2="79" y2="64"/>
                <line class="d20-edge" x1="9"  y1="73" x2="21" y2="64"/>
                <line class="d20-edge" x1="9"  y1="27" x2="21" y2="64"/>
                <line class="d20-edge" x1="50" y1="96" x2="50" y2="30"/>
              </svg>
              <div class="d20-number" id="d20Number">${GAME._lastRoll ? GAME._lastRoll.d20 : "?"}</div>
            </div>
          </div>

          <div class="dice-result ${resultClass}" id="diceResult">
            <div class="roll-value" id="diceResultValue">${lastD20}</div>
            <div class="roll-tag"  id="diceResultTag">${lastTag}</div>
          </div>

          <div class="dice-info">
            <strong id="diceInfoTitle">${infoTitle}</strong>
            <span id="diceInfoText">${infoText}</span>
          </div>

          <button class="dice-btn" id="diceRollBtn" data-dice-reroll ${canReroll ? "" : "disabled"}>
            <span class="ico">↻</span>
            <span>ПЕРЕБРОС (1 СУДЬБА)</span>
          </button>

        </div>
      </div>
    </section>
  `;
}

function bindDiceRoll(){
  const btn = document.getElementById("diceRollBtn");
  if(btn) btn.onclick = rerollLastCheck;
}

function playRoll(r){
  return new Promise(resolve => {
    if(_diceRolling){ resolve(); return; }
    _diceRolling = true;
    GAME._rolling = true;
        // Звук броска (если включён)
// До броска
if (typeof playSound === "function") playSound("dice", false);
// После броска, если крит
if (r.d20 === 20 || r.d20 === 1) {
  if (typeof playSound === "function") playSound("dice", true);
}

    const cube   = document.getElementById("d20Cube");
    const number = document.getElementById("d20Number");
    const resBox = document.getElementById("diceResult");
    const resVal = document.getElementById("diceResultValue");
    const resTag = document.getElementById("diceResultTag");
    const infoT  = document.getElementById("diceInfoTitle");
    const infoX  = document.getElementById("diceInfoText");

    if(cube)   cube.classList.add("rolling");
    if(resBox) resBox.classList.remove("crit","fail");
    if(resVal) resVal.textContent = "…";
    if(resTag) resTag.textContent = "бросаем";
    if(infoT)  infoT.textContent = r.label || "БРОСОК";
    if(infoX)  infoX.textContent = "Кубик судьбы решает…";

    const spin = setInterval(() => {
      if(number) number.textContent = 1 + Math.floor(Math.random() * 20);
    }, 60);

    setTimeout(() => {
      clearInterval(spin);
      if(cube)   cube.classList.remove("rolling");
      if(number) number.textContent = r.d20;

      if(resBox) resBox.classList.remove("crit","fail");
      if(r.d20 === 20 && resBox) resBox.classList.add("crit");
      else if(r.d20 === 1 && resBox) resBox.classList.add("fail");

      if(resVal) resVal.textContent = r.d20;

      let tag = "—";
      if(r.d20 === 20) tag = "КРИТ. УСПЕХ";
      else if(r.d20 === 1) tag = "КРИТ. ПРОВАЛ";
      else if(r.result === "success") tag = "УСПЕХ";
      else if(r.result === "fail")    tag = "ПРОВАЛ";
      if(resTag) resTag.textContent = tag;

      if(infoT) infoT.textContent = `${r.label}:  d20=${r.d20} + ${r.mod} мод + ${r.prof} проф${r.bonus?` + ${r.bonus} сит`:""}`;
      if(infoX) infoX.textContent = `Итог: ${r.total}  vs  DC ${r.dc}  →  ${tag}`;

      GAME._lastRoll = r;
      _diceRolling = false;
      GAME._rolling = false;
      updateRerollButton();
      resolve();
    }, 1300);
  });
}

function rerollLastCheck(){
  if(_diceRolling) return;
  const last = GAME._lastRoll;
  if(!last){ addSystem("ПЕРЕБРОС", "Перебрасывать нечего."); return; }
  if(GAME.character.fate <= 0){ addSystem("ПЕРЕБРОС", "У тебя не осталось Судьбы."); return; }

  GAME.character.fate--;

  addSystem("СУДЬБА",
    `Ты тратишь 1 очко Судьбы, чтобы изменить исход проверки «${last.label}».`);

  const d20 = RNG.die(20);
  const total = d20 + last.mod + last.prof + (last.bonus || 0);
  let result = "fail";
  if(d20 === 20) result = "critical";
  else if(d20 === 1) result = "critical_fail";
  else if(total >= last.dc) result = "success";

  const r2 = {
    d20, mod: last.mod, prof: last.prof, bonus: last.bonus,
    total, dc: last.dc, result, label: last.label + " (переброс)"
  };

  playRoll(r2).then(() => {
    addRoll(formatRoll(r2), rollClass(r2.result));
    saveGameSilent();
    renderAll();
  });
}

function updateRerollButton(){
  const btn = document.getElementById("diceRollBtn");
  if(!btn) return;
  btn.disabled = !(GAME._lastRoll && GAME.character.fate > 0);
}
