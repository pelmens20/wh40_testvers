/* ============================================================
   UI / MODALS.JS — модальные окна
   ============================================================ */

function openNewCampaign(){
  const app = document.getElementById("app");
  let root = document.getElementById("modalRoot");
  if(!root){
    root = document.createElement("div");
    root.id = "modalRoot";
    app.appendChild(root);
  }
  root.innerHTML = `
    <div class="modal-backdrop open">
      <div class="modal modal-wide">
        <div class="modal-head">
          <div>
            <div class="modal-title">ИНИЦИАЦИЯ ОПЕРАЦИИ</div>
            <div class="modal-subtitle">НАЗНАЧЬ ОПЕРАТИВНИКА</div>
          </div>
          <button class="secondary-btn" data-close>×</button>
        </div>
        <div class="modal-body">
          <div class="creation-tabs">
            <button class="creation-tab active" data-tab="presets">ПОДГОТОВЛЕННЫЕ ДОСЬЕ</button>
            <button class="creation-tab" data-tab="custom">СОСТАВИТЬ ДОСЬЕ</button>
          </div>

          <div id="presetPanel">
            <div class="creation-hint">
              Выбери оперативника из утверждённых досье. Профиль, служебная принадлежность и предыстория уже подготовлены.
            </div>
            <div class="preset-grid">
              ${Object.entries(CHARACTER_PRESETS).map(([id, p]) => {
                const cls = CLASSES[p.classId];
                const presetArt = (typeof getAsset === "function" && getAsset("portraits", id)) || (typeof getAsset === "function" && getAsset("classes", p.classId));
                return `<button class="preset-card" data-preset="${id}">
                  <div class="preset-icon">${presetArt ? `<img class="preset-art" src="${esc(presetArt)}" alt="" loading="lazy" decoding="async">` : `<span>${esc(p.icon)}</span>`}</div>
                  <div class="preset-main">
                    <div class="preset-name">${esc(p.name)}</div>
                    <div class="preset-class">${esc(cls.name)} // ${esc(p.note)}</div>
                    <p>${esc(p.backstory)}</p>
                    <div class="mini">
                      ЗДОРОВЬЕ ${cls.hp} · ЗАЩИТА ${cls.ac} · СИЛА ${cls.stats.str} · ЛОВКОСТЬ ${cls.stats.dex} ·
                      ИНТЕЛЛЕКТ ${cls.stats.int} · ВОЛЯ ${cls.stats.wil}
                    </div>
                  </div>
                  <div class="preset-arrow">›</div>
                </button>`;
              }).join("")}
            </div>
          </div>

          <div id="customPanel" style="display:none">
            <div class="form-row"><label>Позывной / имя</label><input id="charName" value="Безымянный"></div>

            <div class="section-title">СЛУЖЕБНАЯ РОЛЬ</div>
            <div class="class-select">
              ${CLASS_ORDER.map(id => {
                const c = CLASSES[id];
                const classArt = typeof getAsset === "function" ? getAsset("classes", id) : null;
                return `<button class="class-card" data-class="${id}">
                  ${classArt ? `<img class="class-card-art" src="${esc(classArt)}" alt="" loading="lazy" decoding="async">` : ""}
                  <h3>${c.icon} ${c.name}</h3>
                  <p>${esc(c.description)}</p>
                  <div class="mini">
                    ЗДОРОВЬЕ ${c.hp} · ЗАЩИТА ${c.ac} · СИЛА ${c.stats.str} · ЛОВКОСТЬ ${c.stats.dex} ·
                    ИНТЕЛЛЕКТ ${c.stats.int} · ВОЛЯ ${c.stats.wil}
                  </div>
                </button>`;
              }).join("")}
            </div>

            <div class="section-title">СЛУЖЕБНОЕ ДЕЛО И ПРОИСХОЖДЕНИЕ</div>
            <textarea id="backstory" class="command-input" style="min-height:110px;width:100%" placeholder="Необязательная запись для личного досье…"></textarea>

            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
              <button class="secondary-btn" data-close>ОТКЛОНИТЬ НАЗНАЧЕНИЕ</button>
              <button class="danger-btn" id="createCharacter">УТВЕРДИТЬ ОПЕРАТИВНИКА</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  root.querySelectorAll("[data-close]").forEach(b => b.onclick = () => root.innerHTML = "");

  const tabs = root.querySelectorAll("[data-tab]");
  tabs.forEach(tab => tab.onclick = () => {
    tabs.forEach(x => x.classList.remove("active"));
    tab.classList.add("active");
    const presets = tab.dataset.tab === "presets";
    root.querySelector("#presetPanel").style.display = presets ? "block" : "none";
    root.querySelector("#customPanel").style.display = presets ? "none" : "block";
  });

  root.querySelectorAll("[data-preset]").forEach(card => card.onclick = () => {
  const p = CHARACTER_PRESETS[card.dataset.preset];
  const character = createCharacter({
    presetId: card.dataset.preset,
    name: p.name,
    classId: p.classId,
    backstory: p.backstory,
    lore: p.lore,
    hook: p.hook,
    quote: p.quote,
    role: p.role,
    organization: p.organization,
    mission: p.mission,
    relations: p.relations,
    weakness: p.weakness
  });
  startCampaign(character, false);
  root.innerHTML = "";
  renderAll();
});

  let selected = "guardsman";
  const cards = root.querySelectorAll("[data-class]");
  cards.forEach(card => card.addEventListener("click", () => {
    cards.forEach(x => x.classList.remove("selected"));
    card.classList.add("selected");
    selected = card.dataset.class;
  }));
  if(cards[1]) cards[1].classList.add("selected");

  root.querySelector("#createCharacter").onclick = () => {
    const name = root.querySelector("#charName").value.trim() || "Безымянный";
    const backstory = root.querySelector("#backstory").value.trim();
    startCampaign(createCharacter({name, classId: selected, backstory}), true);
    root.innerHTML = "";
    renderAll();
  };
}
function openImageModal(src){
  let root = document.getElementById("modalRoot");
  if(!root){
    root = document.createElement("div");
    root.id = "modalRoot";
    document.getElementById("app").appendChild(root);
  }
  root.innerHTML = `
    <div class="modal-backdrop open" data-close>
      <div class="modal-image-view" onclick="event.stopPropagation()">
        <img src="${esc(src)}" alt="">
        <button class="secondary-btn" data-close style="margin-top:12px">ЗАКРЫТЬ</button>
      </div>
    </div>
  `;
  root.querySelectorAll("[data-close]").forEach(el => el.onclick = () => root.innerHTML = "");
}
/* ============================================================
   Выбор NPC для диалога
   ============================================================ */
function openDialoguePicker(){
  let root = document.getElementById("modalRoot");
  if(!root){
    root = document.createElement("div");
    root.id = "modalRoot";
    document.getElementById("app").appendChild(root);
  }

  // Собираем список NPC
  const npcs = Object.values(GAME.npcs || {}).map(n => {
    const tree = (typeof DIALOGUE_TREES !== "undefined") ? DIALOGUE_TREES[n.name] : null;
    return {
      name: n.name,
      role: n.role,
      avatar: n.avatar || null,
      met: n.met || false,
      hasDialogue: !!tree,
      attitude: n.attitude || 0
    };
  });

  if(!npcs.length){
    root.innerHTML = `
      <div class="modal-backdrop open">
        <div class="modal">
          <div class="modal-head">
            <div class="modal-title">КАНАЛ ДОПРОСА / КОНТАКТА</div>
            <button class="secondary-btn" data-close>×</button>
          </div>
          <div class="modal-body">
            <div class="empty">Здесь не с кем говорить.</div>
          </div>
        </div>
      </div>
    `;
    root.querySelector("[data-close]").onclick = () => root.innerHTML = "";
    return;
  }

  root.innerHTML = `
    <div class="modal-backdrop open">
      <div class="modal modal-wide">
        <div class="modal-head">
          <div>
            <div class="modal-title">КАНАЛ ДОПРОСА / КОНТАКТА</div>
            <div class="modal-subtitle">ВЫБЕРИ ЛИЦО ДЛЯ КОНТАКТА</div>
          </div>
          <button class="secondary-btn" data-close>×</button>
        </div>
        <div class="modal-body">
          <div class="preset-grid">
            ${npcs.map(n => `
              <button class="preset-card" data-dialogue-npc="${esc(n.name)}">
                <div class="preset-icon">
                  ${renderNPCAvatar(n.name, "☉", 56)}
                </div>
                <div class="preset-main">
                  <div class="preset-name">${esc(n.name)}</div>
                  <div class="preset-class">${esc(n.role)}</div>
                  <p>${n.hasDialogue
                    ? "Доступен для опроса."
                    : "Не хочет говорить — или тебе пока нечего сказать."}</p>
                  <div class="mini">
                    ${n.met ? "Контакт установлен" : "Контакт не подтверждён"} ·
                    ${esc(npcRelationshipLabel(n.attitude))} · ${n.attitude > 0 ? "+" : ""}${n.attitude}
                  </div>
                </div>
                <div class="preset-arrow">›</div>
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  // Закрытие
  root.querySelectorAll("[data-close]").forEach(b => b.onclick = () => root.innerHTML = "");

  // Выбор NPC
  root.querySelectorAll("[data-dialogue-npc]").forEach(btn => {
    btn.onclick = () => {
      const npcName = btn.dataset.dialogueNpc;
      root.innerHTML = "";
      // Закрываем текущий диалог, если был
      if(typeof endDialogue === "function" && GAME.dialogue){
        GAME.dialogue = null;
      }
      // Запускаем диалог
      if(typeof startDialogue === "function"){
        startDialogue(npcName);
      }
    };
  });
}
