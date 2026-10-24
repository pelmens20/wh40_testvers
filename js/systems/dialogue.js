/* ============================================================
   SYSTEMS / DIALOGUE.JS — движок диалогов
   ------------------------------------------------------------
   Диалог — это цепочка нодов. Каждый нод:
     text       — что говорит NPC
     choices    — массив вариантов ответа
     effects    — эффекты при входе в нод
     onEnd      — что происходит при завершении диалога
   ============================================================ */

/* ---------- Глобальное состояние диалога ---------- */
GAME.dialogue = null;

// Эти два дерева — не обычные NPC и не должны появляться в общем списке
// собеседников. Они запускаются только из конкретных сцен главы III.
function canStartCampaignDialogue(npcName){
  const campaign = GAME.campaign;
  if(!campaign || !campaign.active || campaign.scenarioId !== "warpHeart") return false;
  if(npcName === "Голос из Врат") return campaign.sceneId === "wh_gate_approach";
  if(npcName === "Тень Кралла") {
    return campaign.sceneId === "wh_shadow_dialogue"
      && GAME.character?.name === "Инквизитор Кассий Варро"
      && GAME.character?.classId === "inquisitor";
  }
  return false;
}

function startDialogue(npcName){
  const npc = GAME.npcs && GAME.npcs[npcName];
  const tree = DIALOGUE_TREES[npcName];
  const storyOnly = !npc && !!tree && canStartCampaignDialogue(npcName);
  if(!npc && !storyOnly){
    addSystem("ДИАЛОГ", `Здесь нет никого с именем «${npcName}».`);
    renderAll(); return;
  }
  if(npc) markMet(npcName);

  if(!tree){
    // Если дерева нет — базовый диалог
    addSystem("ДИАЛОГ", `Ты заговариваешь с ${npcName}. ${npc.role}.`);
    bumpNPC(npcName, +1);
    addSystem(npcName.toUpperCase(),
      "— Чего тебе? У меня и без тебя дел хватает.");
    renderAll();
    return;
  }

  GAME.dialogue = {
    npcName,
    nodeId: tree.root,
    history: [],
    enteredNodes: {}
  };
  enterDialogueNode(tree.root);
}

function enterDialogueNode(nodeId){
  const d = GAME.dialogue;
  if(!d){ return; }
  const tree = DIALOGUE_TREES[d.npcName];
  const node = tree.nodes[nodeId];
  if(!node){
    endDialogue();
    return;
  }
  d.nodeId = nodeId;
  d.history.push({node: nodeId, turn: GAME.turn});

  // Dialogue node rewards/consequences are one-time, so revisiting a topic
  // cannot farm clues, quest progress, corruption, or relationship changes.
  const applied = GAME.dialogueEffectsApplied || (GAME.dialogueEffectsApplied = {});
  const nodeEffectKey = `${d.npcName}::${nodeId}::enter`;
  if(node.effects && !applied[nodeEffectKey]){
    const evs = applyEffects(node.effects);
    (evs||[]).forEach(e => e && addSystem("ЭФФЕКТ", e));
    applied[nodeEffectKey] = true;
  }

  // Existing class-specific greetings were authored as onEnter callbacks,
  // but the dialogue engine previously never executed them. Run once per
  // node per conversation to avoid repeating them when returning to the root.
  if(typeof node.onEnter === "function" && !d.enteredNodes[nodeId]){
    d.enteredNodes[nodeId] = true;
    try { node.onEnter(); } catch(e) { console.error(e); }
  }

  addSystem(d.npcName.toUpperCase(), node.text || "");

  if(node.choices && node.choices.length){
    // Диалог продолжится через выборы
    renderAll();
    return;
  }

  // Если выбора нет — завершаем
  endDialogue();
}

function chooseDialogueOption(idx){
  const d = GAME.dialogue;
  if(!d) return;
  const tree = DIALOGUE_TREES[d.npcName];
  const node = tree.nodes[d.nodeId];
  if(!node || !node.choices) return;
  const choice = node.choices[idx];
  if(!choice) return;

  // Проверка requires
  if(choice.requires && !sceneRequirementsMet(choice.requires)){
    addSystem("НЕДОСТУПНО", choice.requiresFailText || "Этот вариант сейчас недоступен.");
    renderAll();
    return;
  }

  addPlayer("▸ " + choice.label);
  d.history.push({choice: idx, label: choice.label, turn: GAME.turn});
  if(typeof registerStoryDecision === "function") registerStoryDecision(`dialogue:${d.npcName}:${d.nodeId}`, choice);
  if(typeof recordDialogueDecision === "function") recordDialogueDecision(d.npcName, choice);

  if(choice.effects){
    const applied = GAME.dialogueEffectsApplied || (GAME.dialogueEffectsApplied = {});
    const effectKey = `${d.npcName}::${d.nodeId}::choice::${idx}`;
    if(!applied[effectKey]){
      const evs = applyEffects(choice.effects);
      (evs||[]).forEach(e => e && addSystem("ЭФФЕКТ", e));
      applied[effectKey] = true;
    }
  }

  if(choice.check){
    const r = checkStat(choice.check.stat, choice.check.dc, {
      label: choice.check.label,
      bonus: choice.check.bonus || 0
    });
    addRoll(formatRoll(r), rollClass(r.result));
    const success = r.result === "success" || r.result === "critical";
    const next = success ? choice.goto : (choice.onFail || d.nodeId);
    setTimeout(() => enterDialogueNode(next), 150);
    return;
  }

  if(choice.goto === "__exit"){
    endDialogue();
    return;
  }

  enterDialogueNode(choice.goto);
}

function endDialogue(){
  if(!GAME.dialogue) return;
  const npc = GAME.dialogue.npcName;
  GAME.dialogue = null;
  addSystem("ДИАЛОГ", `Ты заканчиваешь разговор с ${npc}.`);
  saveGameSilent();
  renderAll();
}

/* ---------- Рендер панели диалога ---------- */
function renderDialoguePanel(){
  if(!GAME.dialogue) return "";
  const d = GAME.dialogue;
  const tree = DIALOGUE_TREES[d.npcName];
  const node = tree.nodes[d.nodeId];
  if(!node) return "";

  const npc = GAME.npcs[d.npcName];
  const avatar = npc && typeof renderNPCAvatar === "function"
    ? renderNPCAvatar(d.npcName, "☉", 56)
    : "";

  return `
    <section class="panel dialogue-panel">
      <div class="panel-head">
        <span>ДИАЛОГ · ${esc(d.npcName)}</span>
        <span>${esc(tree.title || "")}</span>
      </div>
      <div class="panel-body">
        <div class="dialogue-header">
          ${avatar}
          <div class="dialogue-text">${esc(node.text || "")}</div>
        </div>
        <div class="list" style="margin-top:12px">
          ${(node.choices || []).map((c, i) => {
            const locked = c.requires && !sceneRequirementsMet(c.requires);
            return `
              <button class="nav-btn" data-dialogue="${i}" ${locked ? "disabled" : ""}>
                ▸ ${esc(c.label)}
                ${c.check ? `<span class="tag gold">${esc(c.check.label)}</span>` : ""}
                ${locked ? `<span class="tag red">закрыто</span>${c.requiresFailText ? `<small class="choice-lock-reason">${esc(c.requiresFailText)}</small>` : ""}` : ""}
              </button>
            `;
          }).join("")}
        </div>
        <div class="footer-note" style="margin-top:10px">
          Свободные игровые действия можно вводить в поле внизу. Для сюжетных ответов выбери вариант выше.
        </div>
      </div>
    </section>
  `;
}
