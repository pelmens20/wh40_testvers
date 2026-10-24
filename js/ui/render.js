/* ============================================================
   UI / RENDER.JS — корневой рендер и хроника
   ============================================================ */

function esc(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function renderImperialCross(className = "imperial-aquila"){
  // Abstract heraldic double-headed eagle: a setting-appropriate Aquila motif, not a claim to reproduce a specific official chapter badge.
  return `<svg class="imperial-cross imperial-aquila ${esc(className)}" viewBox="0 0 100 100" role="img" aria-label="Стилизованная имперская Аквила" focusable="false"><path d="M48 39 39 26 25 18 8 16 19 31 8 36 27 43 14 51 34 53 41 64 36 86 48 78 50 59 52 78 64 86 59 64 66 53 86 51 73 43 92 36 81 31 92 16 75 18 61 26 52 39Z"/><path d="M39 25 34 12 26 8 29 21 39 30ZM61 25 66 12 74 8 71 21 61 30ZM43 37 50 31 57 37 54 47 50 52 46 47Z"/><path d="M41 64 31 69 20 65 29 78 39 78M59 64 69 69 80 65 71 78 61 78" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}
function statMod(c,key){ const m = modifier(c.stats[key]); return m >= 0 ? `+${m}` : String(m); }
function pct(a,b){ return b <= 0 ? 0 : Math.max(0, Math.min(100, (a/b) * 100)); }

function renderApp(){
  if(!GAME.started){ if(GAME._assetArchiveStandalone){ renderAssetArchiveStandalone(); return; } renderStart(); return; }
  const c = GAME.character;
  // Class-specific visual treatment: the operative's role changes the interface accent,
  // not the meaning of faction insignia. This is a UI theme, not a claim of official heraldry.
  if(document.body && c && c.classId) document.body.dataset.operativeClass = c.classId;
  // Recalculate level-gated class doctrine points on every render, including immediately after XP.
  if(typeof initializeExpansionSystems === "function") initializeExpansionSystems();
  // Живой фон по тревоге
  if(typeof GAME.world.heat === "number"){
  const body = document.body;
  body.classList.remove("heat-low","heat-mid","heat-high");
  if(GAME.world.heat >= 7)      body.classList.add("heat-high");
  else if(GAME.world.heat >= 4) body.classList.add("heat-mid");
  else                          body.classList.add("heat-low");
  const corruption = Math.max(0, Math.min(10, Number(c.corruption) || 0));
  body.classList.remove("corruption-stage-low","corruption-stage-mid","corruption-stage-high");
  if(corruption >= 7) body.classList.add("corruption-stage-high");
  else if(corruption >= 4) body.classList.add("corruption-stage-mid");
  else body.classList.add("corruption-stage-low");
}
  document.getElementById("app").innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">${renderImperialCross("brand-cross")}</div>
          <div>
            <div class="brand-title">WARHAMMER 40,000 · АРХИВ ИНКВИЗИЦИИ</div>
            <div class="brand-sub">КАНЦЕЛЯРИЯ ИМПЕРСКОЙ ОПЕРАЦИИ</div>
          </div>
        </div>
        <div class="top-meta">
          <span>ЛОКАЦИЯ: <strong>${esc(c.location)}</strong></span>
          <span>СТАНДАРТНЫЙ ДЕНЬ: <strong>${GAME.world.day}</strong></span>
          <span>ХРОНОМЕТР: <strong>${timeString()}</strong></span>
          <span>УРОВЕНЬ УГРОЗЫ: <strong>${GAME.world.heat < 4 ? "НИЗКАЯ" : GAME.world.heat < 8 ? "СРЕДНЯЯ" : "ВЫСОКАЯ"}</strong></span>
        </div>
        <button class="secondary-btn panel-toggle-btn" type="button" data-toggle-panel="right" aria-controls="rightPanel" aria-expanded="${document.body.classList.contains("show-right-panel") ? "true" : "false"}">☷ СВОДКА ОПЕРАЦИИ</button>
      </header>

      <div class="layout">
        <aside class="side scrollable">${renderSide()}</aside>
        <main class="main scrollable">${renderMain()}</main>
        <aside class="right scrollable" id="rightPanel" aria-label="Сводка о состоянии оперативника">${renderRight()}</aside>
      </div>
    </div>
    <div id="modalRoot"></div>
  `;
  bindUI();
  if(typeof bindDiceRoll === "function") bindDiceRoll();
}

function renderAll(){
  // Сохраняем позицию скролла всех трёх колонок
  const sideEl = document.querySelector(".side");
  const mainEl = document.querySelector(".main");
  const rightEl = document.querySelector(".right");
  const storyEl = document.getElementById("storyBox");

  const scrollPositions = {
    side:   sideEl  ? sideEl.scrollTop  : 0,
    main:   mainEl  ? mainEl.scrollTop  : 0,
    right:  rightEl ? rightEl.scrollTop : 0,
    story:  storyEl ? storyEl.scrollTop : 0
  };

  renderApp();
  if(GAME._portraitPulse) GAME._portraitPulse = false;

  // Восстанавливаем позиции
  setTimeout(() => {
    const newSide  = document.querySelector(".side");
    const newMain  = document.querySelector(".main");
    const newRight = document.querySelector(".right");
    const newStory = document.getElementById("storyBox");

    // Боковые панели — всегда восстанавливаем
    if(newSide)  newSide.scrollTop  = scrollPositions.side;
    if(newMain)  newMain.scrollTop  = scrollPositions.main;
    if(newRight) newRight.scrollTop = scrollPositions.right;

    // Хронику прокручиваем вниз — но только если мы на вкладке "story"
    // и это не бой (там своё поведение)
    if(newStory){
      if(GAME.view === "story" && GAME.mode !== "combat"){
        newStory.scrollTop = newStory.scrollHeight;
      } else {
        newStory.scrollTop = scrollPositions.story;
      }
    }
  }, 0);
    // Визуальные эффекты — после рендера
  setTimeout(() => {
    applyVisualEffects();
  }, 0);
}

/* ============================================================
   Ассеты
   ============================================================ */
function renderAvatar(category, key, fallbackSymbol = "✦", size = 64, cssClass = ""){
  const src = (typeof getAsset === "function") ? getAsset(category, key) : null;
  const caption = (typeof getCaption === "function") ? getCaption(category, key, key) : key;
  const title = ` title="${esc(caption)}" alt="${esc(caption)}"`;

  const ok = !!src;
  const fallbackArt = category === "weapons" || category === "armor" ? "assets/backgrounds/industrial-cathedral-user.png"
    : category === "factions" || category === "classes" || category === "inquisition" ? "assets/backgrounds/temple-user.png"
    : category === "enemies" || category === "chaosGods" || category === "legions" ? "assets/backgrounds/ritual-chamber-user.png"
    : category === "items" || category === "conditions" ? "assets/backgrounds/sealed-gates-user.png"
    : "assets/backgrounds/market-user.png";
  const inner = ok
    ? `<img class="avatar-img" src="${esc(src)}"${title} width="${size}" height="${size}" loading="lazy" decoding="async">`
    : `<span class="avatar-symbol">${esc(fallbackSymbol)}</span>`;

  return `
    <span class="avatar ${ok ? "" : "avatar-art-fallback"} ${cssClass}" style="width:${size}px;height:${size}px;--avatar-backdrop:url('../${esc(fallbackArt)}')">
      <span class="avatar-ripple"></span>
      <span class="avatar-inner">${inner}</span>
      <span class="avatar-corner tl"></span>
      <span class="avatar-corner tr"></span>
      <span class="avatar-corner bl"></span>
      <span class="avatar-corner br"></span>
    </span>
  `;
}

function renderPortraitFull(presetId, fallbackIcon, pulse = false, classId = null){
  const get = (typeof getAsset === "function") ? getAsset : (() => null);
  let src = get("portraits", presetId);
  if(!src) src = get("classes", classId);

  const ok = !!src;

  if(!ok){
    const backdropKey = classId === "inquisitor" ? "Храм"
      : classId === "guardsman" ? "Промзона"
      : classId === "spaceMarine" ? "Запечатанный сектор" : "Архив";
    const backdrop = get("backgrounds", backdropKey) || "assets/backgrounds/temple.jpg";
    return `
      <div class="portrait portrait-art-fallback ${pulse ? "pulse" : ""}" style="--portrait-backdrop:url('../${esc(backdrop)}')">
        <span class="portrait-ripple"></span>
        <span class="portrait-corner tl"></span>
        <span class="portrait-corner tr"></span>
        <span class="portrait-corner bl"></span>
        <span class="portrait-corner br"></span>
        <div class="portrait-symbol">${esc(fallbackIcon)}</div>
        <span class="portrait-fallback-label">АРХИВНЫЙ ОБРАЗ</span>
      </div>
    `;
  }

  const sameSrc = GAME._portraitSrc === src;
  GAME._portraitSrc = src;
  const appearClass = sameSrc ? "" : "portrait-appear";

  return `
    <div class="portrait ${appearClass} ${pulse ? "pulse" : ""}">
      <span class="portrait-ripple"></span>
      <span class="portrait-corner tl"></span>
      <span class="portrait-corner tr"></span>
      <span class="portrait-corner bl"></span>
      <span class="portrait-corner br"></span>
      <img class="portrait-img" src="${esc(src)}" alt="${esc(presetId || '')}">
    </div>
  `;
}

function renderItemIcon(name, fallbackSymbol = "▣", size = 40){
  const raw = String(name || "").trim();
  const lower = raw.toLowerCase().replace(/ё/g,"е");
  const aliases = {
    "медикамент":"Медикамент", "аптечка":"Медикамент", "медицинский набор":"Медикамент",
    "ремкомплект":"Ремкомплект", "набор ремонта":"Ремкомплект",
    "печать инквизиции":"Печать допуска", "печать допуска":"Печать допуска",
    "осколок врат":"Таинственный фрагмент", "таинственный фрагмент":"Таинственный фрагмент",
    "патроны":"Патроны", "боеприпасы":"Патроны", "энергоячейки":"Патроны", "болты":"Патроны", "плазменные ячейки":"Патроны"
  };
  return renderAvatar("items", aliases[lower] || raw, fallbackSymbol, size);
}
function renderWeaponIcon(weaponKey, fallbackSymbol = "✦", size = 40){
  const raw = String(weaponKey || "").trim();
  const lower = raw.toLowerCase();
  const aliases = {
    "лазпистолет":"laspistol", "лазган":"lasgun", "болтер":"bolter", "плазмаган":"plasma",
    "цепной меч":"chainsword", "цепной-меч":"chainsword", "боевой нож":"improvised", "кулак":"improvised",
    "импровизированное оружие":"improvised"
  };
  const resolved = aliases[lower] || raw;
  return renderAvatar("weapons", resolved, fallbackSymbol, size);
}
function renderArmorIcon(armorKey, fallbackSymbol = "▣", size = 40){
  const raw = String(armorKey || "").trim().toLowerCase().replace(/ё/g,"е");
  const aliases = {
    "легкий-панцирь":"light-plate", "легкий панцирь":"light-plate", "лёгкий-панцирь":"light-plate",
    "флак-броня":"flak-armor", "усиленная-флак-броня":"flak-armor", "силовая-броня":"power-armor",
    "карапасная-броня":"carapace", "карапас":"carapace"
  };
  return renderAvatar("armor", aliases[raw] || raw, fallbackSymbol, size);
}
function renderConditionIcon(name, fallbackSymbol = "•", size = 28){
  const raw = String(name || "").trim();
  const lower = raw.toLowerCase().replace(/ё/g,"е").replace(/_/g,"-");
  const aliases = {bleed:"Кровотечение", bleeding:"Кровотечение", stun:"Оглушение", stunned:"Оглушение", fear:"Испуг", frightened:"Испуг", poison:"Отравление", poisoned:"Отравление", fatigue:"Усталость", exhausted:"Усталость", inspire:"Вдохновение", inspired:"Вдохновение", cover:"Прикрытие", corruption:"Порча", jam:"Заклинивание", weapon_jam:"Заклинивание"};
  const key = aliases[lower] || raw;
  return renderAvatar("conditions", key, fallbackSymbol, size);
}
function renderFactionIcon(faction, fallbackSymbol = "⚜", size = 36){
  const raw = String(faction || "").trim();
  const aliases = {imperium:"Imperium",inquisition:"Inquisition",militarum:"Militarum",mechanicus:"Mechanicus",ecclesiarchy:"Ministorum",ministorum:"Ministorum",arbites:"Arbites",astartes:"Astartes",chaos:"Chaos",orks:"Orks",ork:"Orks"};
  return renderAvatar("factions", aliases[raw.toLowerCase()] || raw, fallbackSymbol, size);
}
function renderClassIcon(classId, fallbackSymbol = "✦", size = 32){ return renderAvatar("classIcons", classId, fallbackSymbol, size); }
function renderEnemyAvatar(enemyType, fallbackSymbol = "☠", size = 64, blurred = false){
  const normalized = String(enemyType || "unknown").toLowerCase().replace(/_/g, "-");
  return renderAvatar("enemyAvatars", "enemy-" + normalized, fallbackSymbol, size, blurred ? "enemy-blur" : "");
}
function renderNPCAvatar(npcName, fallbackSymbol = "☉", size = 44){
  const n = GAME.npcs?.[npcName];
  const key = n?.avatar || null;
  if(key) return renderAvatar("npcAvatars", key, fallbackSymbol, size);
  const slug = npcName.toLowerCase().split(" ").pop();
  return renderAvatar("npcAvatars", "npc-" + slug, fallbackSymbol, size);
}

/* ============================================================
   Главная зона
   ============================================================ */
function renderMain(){
  let content;
  if(GAME.mode === "corruption-end") content = renderCorruptionEnd();
  else if(GAME.mode === "death" || GAME.mode === "dead") content = renderDeath();
  else if(GAME.mode === "combat") content = renderCombat();
  else if(GAME.dialogue && typeof renderDialoguePanel === "function") content = renderDialoguePanel();
  else {
    switch(GAME.view){
      case "character":  content = renderCharacterView(); break;
      case "inventory":  content = renderInventory(); break;
      case "quests":     content = renderQuests(); break;
      case "investigation": content = typeof renderInvestigation === "function" ? renderInvestigation() : `<section class="panel"><div class="panel-body">Досье расследования недоступно.</div></section>`; break;
      case "continuity": content = typeof renderContinuityPanel === "function" ? renderContinuityPanel() : `<section class="panel"><div class="panel-body">Хроника последствий недоступна.</div></section>`; break;
      case "map":        content = renderMap(); break;
      case "reputation": content = renderReputation(); break;
      case "abilities":  content = renderAbilities(); break;
      case "journal":    content = renderJournal(); break;
      case "codex":      content = renderCodex(); break;
      case "development": content = typeof renderDevelopmentPanel === "function" ? renderDevelopmentPanel() : ""; break;
      case "squad":       content = typeof renderSquadPanel === "function" ? renderSquadPanel() : ""; break;
      case "operations":  content = typeof renderOperationsPanel === "function" ? renderOperationsPanel() : ""; break;
      case "armory":      content = typeof renderArmoryPanel === "function" ? renderArmoryPanel() : ""; break;
      case "editor":      content = typeof renderCampaignWorkshop === "function" ? renderCampaignWorkshop() : ""; break;
      default:            content = renderStory();
    }
  }
  // В этой версии все игровые действия выбираются через кнопки сцен и панелей.
  return `${content || ""}`;
}

/* ============================================================
   Хроника
   ============================================================ */
function renderStory(){
  const scenarioId = GAME.campaign?.scenarioId || "silentForge";
  const chapterBgSrc = (typeof getAsset === "function") ? getAsset("chapterBackgrounds", scenarioId) : null;
  const loc = GAME.character.location;
  const locBgSrc = (typeof getAsset === "function") ? getAsset("backgrounds", loc) : null;
  // Do not gate visible art on asynchronous Image-cache state: valid local paths can render immediately.
  const finalBgSrc = chapterBgSrc || locBgSrc || "assets/backgrounds/temple.jpg";
  const finalBgCaption = chapterBgSrc
    ? getCaption("chapterBackgrounds", scenarioId, "Иллюстрация главы")
    : getCaption("backgrounds", loc, "Фоновая иллюстрация локации");
  const bgStyle = finalBgSrc
    ? `background-image:linear-gradient(rgba(8,8,10,.42), rgba(8,8,10,.66)), url('${esc(finalBgSrc)}');background-size:cover;background-position:center;background-color:#08090a;`
    : "";
  const sceneBanner = finalBgSrc
    ? `<figure class="story-location-art"><img class="story-location-art-image" src="${esc(finalBgSrc)}" alt="${esc(finalBgCaption)}" loading="eager" decoding="async"><figcaption><span>АРХИВНАЯ ВИЗУАЛИЗАЦИЯ</span><strong>${esc(finalBgCaption)}</strong></figcaption></figure>`
    : "";

  const locIconSrc = (typeof getAsset === "function") ? getAsset("locationIcons", loc) : null;
  const locIconOk = !!locIconSrc;
  const locIconMeta = (ASSETS.locationIcons || {})[loc];
  // Иконки локаций опциональны: если пользовательские PNG отсутствуют,
  // показываем встроенный символ и не создаём сетевых запросов к несуществующим файлам.
  const locIconTag = locIconOk
    ? `<img class="location-icon-image" src="${esc(locIconSrc)}" alt="" loading="lazy" decoding="async" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:6px;">`
    : (locIconMeta && locIconMeta.symbol
      ? `<span class="location-symbol" aria-hidden="true">${esc(locIconMeta.symbol)}</span>`
      : "");

  return `
    ${typeof renderDiceArea === "function" ? renderDiceArea() : ""}
    ${typeof renderExpansionCinematic === "function" ? renderExpansionCinematic() : ""}

    <section class="panel" style="flex:1;display:flex;flex-direction:column;min-height:0">
      <div class="panel-head">
        <span>ХРОНИКА</span>
        <span>${locIconTag}${esc(loc)}</span>
      </div>
      <div class="story scrollable" id="storyBox" style="${bgStyle}">
        ${sceneBanner}
        ${GAME.story.map(e => {
          if(e.type === "image"){
            return `<div class="story-image">${renderSceneIllustration(e.imageKey)}</div>`;
          }
          return `
            <div class="story-entry ${e.type === "player" ? "entry-player" : ""} ${e.fresh ? "fresh" : ""}">
              <div class="entry-meta">${esc(e.title)} // ${esc(e.time)}</div>
              <div class="entry-text ${e.type === "system" ? "entry-system" : ""}">${esc(e.text)}</div>
            </div>
          `;
        }).join("")}
      </div>
    </section>

    ${renderChoices()}

    <section class="panel">
      <div class="panel-head"><span>ДЕЙСТВИЯ</span><span>ВЫБЕРИ</span></div>
      <div class="panel-body">
        <div class="quick-actions">
          <button class="secondary-btn" data-quick="осматриваюсь вокруг">ОСМОТРЕТЬСЯ</button>
          <button class="secondary-btn" data-quick="иду в Архив">АРХИВ</button>
          <button class="secondary-btn" data-quick="разговариваю с сержантом">ДИАЛОГ</button>
          <button class="secondary-btn" data-quick="/инвентарь">ИНВЕНТАРЬ</button>
        </div>
      </div>
    </section>
  `;
}

function renderChoices(){
  const list = currentSceneChoices();
  if(!list.length) return "";
  const sc = CAMPAIGN_SCENARIOS[GAME.campaign.scenarioId];
  return `
    <section class="panel">
      <div class="panel-head">
        <span>ВАРИАНТЫ ДЕЙСТВИЙ</span>
        <span>${esc(sc.title)}</span>
      </div>
      <div class="panel-body">
        <div class="list">
          ${list.map(c => {
            const locked = c.requires && !sceneRequirementsMet(c.requires);
            return `<button class="nav-btn" data-choice="${c._idx}" ${locked ? "disabled" : ""}>
              ▸ ${esc(c.label)}
              ${c.check ? `<span class="tag gold">${esc(c.check.label)}</span>` : ""}
              ${locked ? `<span class="tag red">закрыто</span>${c.requiresFailText ? `<small class="choice-lock-reason">${esc(c.requiresFailText)}</small>` : ""}` : ""}
            </button>`;
          }).join("")}
        </div>
      </div>
    </section>
  `;
}

/* ============================================================
   Бой — мульти-враги
   ============================================================ */
function renderCombat(){
  const co = GAME.combat, c = GAME.character;
  const w = getCurrentWeapon(co.weaponSlot);

  // Активные таланты, доступные в этом бою
  const actives = (typeof getActiveTalents === "function") ? getActiveTalents() : [];
  const usableActives = actives.filter(a => !c._activeUsed?.[a.activeId]);
  const activesHtml = usableActives.length
    ? `<div class="combat-buttons" style="margin-top:6px">
        ${usableActives.map(a => `
          <button class="secondary-btn talent-active-btn" data-active-talent="${a.activeId}">
            ★ ${esc(a.name.toUpperCase())}
          </button>
        `).join("")}
      </div>`
    : "";

  return `
    ${typeof renderDiceArea === "function" ? renderDiceArea() : ""}
    ${typeof renderExpansionCinematic === "function" ? renderExpansionCinematic() : ""}

    <section class="panel">
      <div class="panel-head">
        <span>⚔ БОЕВОЙ КОНТУР</span>
        <span>РАУНД ${co.round} · ${WEAPON_CATEGORIES[co.weaponSlot]}</span>
      </div>
      <div class="panel-body">
        <div class="combat-player">
          <div class="combat-header">
            ${renderClassIcon(c.classId, c.icon, 48)}
            <div class="combat-name">${esc(c.name)}</div>
          </div>
          <div class="small-row"><span>ЗДОРОВЬЕ</span><strong>${c.hp}/${c.maxHp}</strong></div>
          <div class="progress"><i style="width:${pct(c.hp,c.maxHp)}%"></i></div>
          <div style="margin-top:8px;font-size:12px;color:var(--muted)">
            РЕЖИМ: <strong style="color:var(--gold3)">${WEAPON_CATEGORIES[co.weaponSlot]}</strong>
            ${w ? ` · ${w.name || c.weapon}` : ""}
          </div>
        </div>

        <div class="combat-enemies">
          ${co.enemies.map((e, i) => {
            const dead = e.hp <= 0;
            const blurred = !e.identified && !e.nameRevealed;
            const active = i === co.targetIndex;
            return `
              <div class="enemy-card ${dead ? "dead" : ""} ${active ? "active" : ""}" data-target="${i}">
                <div class="combat-header">
                  ${renderEnemyAvatar(e.type, "☠", 48, blurred)}
                  <div class="combat-name ${blurred ? "enemy-unknown" : ""}">
                    ${dead ? "УСТРАНЁН" : (blurred ? "НЕИЗВЕСТНАЯ УГРОЗА" : esc(e.name))}
                  </div>
                </div>
                ${!dead ? `
                  <div class="small-row">
                    <span>СОСТОЯНИЕ</span>
                    <strong>${e.identified || e.nameRevealed ? `${Math.max(0,e.hp)}/${e.maxHp}` : "???"}</strong>
                  </div>
                  <div class="progress"><i style="width:${e.identified ? pct(e.hp,e.maxHp) : 35}%"></i></div>
                  <div style="margin-top:6px;font-size:11px">
                    ЗАЩИТА: <strong>${e.identified ? e.ac : "???"}</strong>
                  </div>
                  ${e.identified && e.weaknesses.length ? `
                    <div style="margin-top:6px;font-size:11px;color:#93c78f">
                      Слабости: ${e.weaknesses.join(", ")}
                    </div>` : ""}
                  ${e.identified && e.tactics ? `
                    <div class="enemy-tactics"><b>ТАКТИКА: ${esc(e.tactics.title)}</b><span>${esc(e.tactics.description)}</span></div>` : ""}
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>

        <div class="combat-buttons">
  <button class="danger-btn"    data-combat="attack">${co.weaponSlot === "ranged" && hasCondition("Перегрев") && c.weapon === "Плазмаган" ? "ОХЛАДИТЬ ПЛАЗМАГАН" : co.weaponSlot === "ranged" && hasCondition("Заклинивание") ? "УСТРАНИТЬ ЗАКЛИНИВАНИЕ" : "АТАКОВАТЬ"}</button>
  <button class="secondary-btn" data-combat="analyze">ИЗУЧИТЬ</button>
  <button class="secondary-btn" data-combat="aim">ПРИЦЕЛИТЬСЯ</button>
  <button class="secondary-btn" data-combat="cover">ЗАНЯТЬ УКРЫТИЕ</button>
  <button class="secondary-btn" data-combat="defend">ЗАЩИЩАТЬСЯ</button>
  <button class="secondary-btn" data-combat="flee">ОТСТУПИТЬ</button>
</div>
<div class="combat-buttons" style="margin-top:6px">
<button class="secondary-btn" data-combat="reload"
  ${((GAME.character.inventory.find(i=>i.name===getAmmoReserveName(GAME.character.weapon))||{}).qty || (GAME.character.inventory.find(i=>i.name==="Патроны")||{}).qty || 0) > 0 ? "" : "disabled"}>
  ПЕРЕЗАРЯДКА (${esc(getAmmoReserveName(GAME.character.weapon))} ×${(GAME.character.inventory.find(i=>i.name===getAmmoReserveName(GAME.character.weapon))||GAME.character.inventory.find(i=>i.name==="Патроны")||{}).qty||0})
</button>
  <button class="secondary-btn" data-combat="med"
    ${hasItem("Медикамент") ? "" : "disabled"}>
    ЛЕЧИТЬСЯ (Медикамент ×${(GAME.character.inventory.find(i=>i.name==="Медикамент")||{}).qty||0})
  </button>
  
  <button class="secondary-btn ${co.weaponSlot === "ranged" ? "slot-active" : ""}" data-slot="ranged">СТРЕЛКОВОЕ</button>
  <button class="secondary-btn ${co.weaponSlot === "melee"  ? "slot-active" : ""}" data-slot="melee">БЛИЖНИЙ БОЙ</button>    <button class="secondary-btn ${co.weaponSlot === "grenade" ? "slot-active" : ""}" data-slot="grenade">ГРАНАТЫ</button>
</div>

        ${activesHtml}

    </section>
    <section class="panel" style="flex:1;min-height:280px;display:flex;flex-direction:column;min-height:0">
      <div class="panel-head"><span>БОЕВАЯ ХРОНИКА</span><span>ПОСЛЕДНИЕ 15 ЗАПИСЕЙ</span></div>
      <div class="story scrollable" id="storyBox">
        ${GAME.story.slice(-15).map(e => `
          <div class="story-entry ${e.type==="player"?"entry-player":""}">
            <div class="entry-meta">${esc(e.title)} // ${esc(e.time)}</div>
            <div class="entry-text">${esc(e.text)}</div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}  
function renderDeath(){
  return `
    <section class="panel" style="display:flex;align-items:center;justify-content:center;padding:24px">
      <div class="panel-body" style="text-align:center;max-width:700px">
        <div style="font-size:80px;color:var(--danger);text-shadow:0 0 40px rgba(209,75,66,.5)">☠</div>
        <h2 style="font-family:'Consolas',monospace;letter-spacing:4px;color:var(--gold3);margin-top:14px">
          КРИТИЧЕСКОЕ СОСТОЯНИЕ
        </h2>
        <p style="color:#aaa;line-height:1.7;margin:18px 0 28px;font-size:14px">
          Механика Судьбы позволяет последнюю попытку выживания.
        </p>
        ${GAME.mode === "death"
          ? `<button class="danger-btn" data-action="lastStand">ПОТРАТИТЬ 1 СУДЬБУ</button>`
          : `<button class="secondary-btn" data-action="new">СОЗДАТЬ НОВОГО ПЕРСОНАЖА</button>`}
      </div>
    </section>
  `;
}

/* ---------- Хроника ---------- */
function addStory(text, type = "system", title = "ТЕРМИНАЛ"){
  GAME.story.push({
    text, type, title,
    time: timeString(),
    fresh: true   // ← новое
  });
  if(GAME.story.length > 200) GAME.story.shift();

  // Снимаем маркер «fresh» через 1 секунду
  setTimeout(() => {
    const last = GAME.story[GAME.story.length - 1];
    if(last) last.fresh = false;
  }, 1000);
}
function addSystem(title, text){ addStory(text, "system", title); }
function addPlayer(text){ addStory(text, "player", "ИГРОК"); }
function addRoll(text, cls = "entry-roll"){ addStory(text, cls, "🎲 БРОСОК"); }
/* ============================================================
   Стартовый экран
   ============================================================ */
function renderStart(){
  document.body.classList.remove("view-story", "show-right-panel");
  const bootArt = (typeof getAsset === "function" && getAsset("branding", "boot")) || (typeof getAsset === "function" && getAsset("backgrounds", "Храм")) || "assets/backgrounds/temple-user.png";
  const logoArt = typeof getAsset === "function" ? getAsset("branding", "logo") : null;
  const sealArt = typeof getAsset === "function" ? getAsset("branding", "seal") : null;
  GAME._assetArchiveStandalone = false;
  document.getElementById("app").innerHTML = `
    <main class="boot-screen boot-screen-menu" style="--boot-art:url('../${esc(bootArt)}')">
      ${logoArt ? `<img class="boot-brand-watermark" src="${esc(logoArt)}" alt="" aria-hidden="true">` : ""}
      <div class="boot-sigil-frame" aria-label="Имперская печать">${renderImperialCross("boot-sigil")}</div>
      <div class="boot-title">КАНЦЕЛЯРИЯ ИМПЕРСКОЙ ОПЕРАЦИИ</div>
      <div class="boot-sub">ИМПЕРСКИЙ АРХИВ // СЕКТОР IX // 41-е ТЫСЯЧЕЛЕТИЕ</div>
      <div class="boot-line"></div>
      <div class="boot-hint">
        Локальная сюжетная кампания во мрачном далёком будущем. Приказы определяют ход расследования; архив сохраняет решения, улики, состояние отряда и последствия действий. Игра работает локально и не требует нейросети или подключения к игровой службе.
      </div>
      <nav class="boot-actions" aria-label="Главное меню">
        <button class="danger-btn" data-action="new">НАЧАТЬ КАМПАНИЮ</button>
        <button class="secondary-btn" data-action="load">ВОССТАНОВИТЬ ЗАПИСЬ</button>
        <button class="secondary-btn" data-action="import">ИМПОРТИРОВАТЬ АРХИВ</button>
        <button class="secondary-btn" data-action="export">ЭКСПОРТ АРХИВА</button>
        <button class="secondary-btn" data-action="lore">ВВЕДЕНИЕ В WARHAMMER 40,000</button>
        <button class="secondary-btn" data-action="assets">АРХИВ ИЗОБРАЖЕНИЙ И ЗВУКА</button>
        <button class="secondary-btn" data-action="slots">СЛОТЫ СОХРАНЕНИЯ</button>
      </nav>
      <div id="startStatus" class="boot-status" role="status" aria-live="polite"></div>
      <div class="boot-disclaimer">${sealArt ? `<img class="boot-footer-seal" src="${esc(sealArt)}" alt="" aria-hidden="true">` : ""}Неофициальный фанатский проект по мотивам вымышленной вселенной Warhammer 40,000. Не связан с Games Workshop.</div>
    </main>
  `;
  bindUI();
}
function renderAssetArchiveStandalone(){
  document.body.classList.remove("view-story", "show-right-panel");
  const bootArt = (typeof getAsset === "function" && getAsset("branding", "boot")) || (typeof getAsset === "function" && getAsset("backgrounds", "Храм")) || "assets/backgrounds/temple-user.png";
  document.getElementById("app").innerHTML = `
    <main class="asset-archive-screen" style="--boot-art:url('../${esc(bootArt)}')">
      <header class="asset-archive-standalone-head">
        <div><div class="brand-title">КАНЦЕЛЯРИЯ ИМПЕРСКОЙ ОПЕРАЦИИ</div><div class="brand-sub">АРХИВ ИЗОБРАЖЕНИЙ И ЗВУКА · ОФЛАЙН-КАТАЛОГ</div></div>
        <button class="secondary-btn" data-action="archive-back">← ВЕРНУТЬСЯ В КАНЦЕЛЯРИЮ</button>
      </header>
      <section class="panel asset-archive-standalone-panel"><div class="panel-body">${typeof renderAssetArchive === "function" ? renderAssetArchive() : `<div class="empty">Каталог ресурсов не загружен.</div>`}</div></section>
      <footer class="asset-archive-standalone-foot">Ресурсы загружаются только из локальной папки assets. Недоступные файлы не запрашиваются.</footer>
    </main>`;
  bindUI();
}

/* ============================================================
   Крупная иллюстрация сцены
   ------------------------------------------------------------
   Использует реестр ASSETS.scenes.
   Если картинки нет — показывает атмосферную локальную заглушку, не скрывая сюжет.
   ============================================================ */
function renderSceneIllustration(key){
  const src = (typeof getAsset === "function") ? getAsset("scenes", key) : null;
  const cap = (typeof getCaption === "function") ? getCaption("scenes", key, "") : "";
  if(!src) return `
    <section class="panel scene-illustration scene-placeholder" data-scene-key="${esc(key || "unknown")}" aria-label="Архивная визуализация: ${esc(cap || key || "сцена")}">
      <div class="scene-placeholder-art" aria-hidden="true"><span class="scene-placeholder-sigil">${renderImperialCross("placeholder-cross")}</span><span class="scene-placeholder-ring"></span><span class="scene-placeholder-crosshair"></span></div>
      <div class="scene-caption">${esc(cap || "АРХИВНЫЙ КАДР")}</div>
      <div class="scene-placeholder-note">ИЛЛЮСТРАЦИЯ НЕ ВХОДИТ В ЭТОТ ПАКЕТ · ПОВЕСТВОВАНИЕ СОХРАНЕНО</div>
    </section>
  `;
  return `
    <figure class="panel scene-illustration">
      <img class="scene-image" data-zoom="${esc(src)}" src="${esc(src)}" alt="${esc(cap || key || "Иллюстрация сцены")}" loading="lazy" decoding="async">
      ${cap ? `<figcaption class="scene-caption">${esc(cap)}</figcaption>` : ""}
    </figure>
  `;
}
function renderCorruptionEnd(){
  return `
    <section class="panel" style="display:flex;align-items:center;justify-content:center;padding:24px">
      <div class="panel-body" style="text-align:center;max-width:700px">
        <div style="font-size:80px;color:var(--red3);text-shadow:0 0 40px rgba(214,63,50,.6)">☠</div>
        <h2 style="font-family:'Cinzel',serif;letter-spacing:4px;color:var(--red2);margin-top:14px">
          АКТ ПАДЕНИЯ
        </h2>
        <p style="color:#aaa;line-height:1.7;margin:18px 0 28px;font-size:14px">
          Голос, который ты связываешь с Тзинчем, заглушает собственные мысли. Ты теряешь контроль над собой, а прежняя роль — служитель Инквизиции, солдат или Астартес — больше не защищает тебя от последствий.
          <br><br>
          Это переживание не раскрывает окончательно источник голоса. Кампания заканчивается здесь. Начало — в следующей.
        </p>
        <button class="danger-btn" data-action="new">ИНИЦИИРОВАТЬ НОВУЮ ОПЕРАЦИЮ</button>
      </div>
    </section>
  `;
}
function renderCodex(){
  if(typeof CODEX === "undefined"){
    return `<section class="panel"><div class="panel-body"><div class="empty">Кодекс недоступен.</div></div></section>`;
  }

  const tab = GAME._codexTab || "factions";

  // Динамические персонажи
  const dynamicCharacters = () => {
    const list = [];

    // 1. Твой герой
    if(GAME.character){
      const c = GAME.character;
      list.push({
        icon: c.icon,
        name: c.name,
        role: c.className,
        desc: c.backstory || "Твой герой."
      });
    }

    // 2. Встреченные NPC
    if(GAME.npcs){
      Object.values(GAME.npcs).forEach(n => {
        if(n.met){
          const tree = (typeof DIALOGUE_TREES !== "undefined") ? DIALOGUE_TREES[n.name] : null;
          list.push({
            icon: n.avatar ? "◆" : "☉",
            name: n.name,
            role: n.role,
            desc: n.secret || "Ты уже встречался с этим человеком."
          });
        }
      });
    }

    // 3. Известные NPC из пресетов — если игрок за другого
    if(typeof CHARACTER_PRESETS !== "undefined"){
      Object.values(CHARACTER_PRESETS).forEach(p => {
        if(GAME.character && p.name === GAME.character.name) return; // уже добавлен
        // Добавляем только тех, кого игрок мог встретить
        if(GAME.world.flags.kaneSuspicious || GAME.world.flags.kaneSealedTruth){
          if(p.name === "Инквизитор Кассий Варро" && GAME.character.classId !== "inquisitor"){
            list.push({
              icon: p.icon,
              name: p.name,
              role: "Инквизитор Ордо Херетикус",
              desc: "Инквизитор, чьё дело Кралла связано с твоим собственным."
            });
          }
        }
      });
    }

    return list;
  };

  const sections = {
    factions:   { title: "ФРАКЦИИ",   data: CODEX.factions },
    terms:      { title: "ТЕРМИНЫ",   data: CODEX.terms },
    characters: { title: "ПЕРСОНАЖИ", data: dynamicCharacters() },
    enemies:    { title: "ВРАГИ",     data: CODEX.enemies }
  };

  const current = sections[tab] || sections.factions;

  return `
    <section class="panel">
      <div class="panel-head">
        <span>КОДЕКС</span>
        <span>${esc(current.title)}</span>
      </div>
      <div class="panel-body">
        <div class="codex-tabs">
          <button class="codex-tab ${tab === "factions" ? "active" : ""}" data-codex-tab="factions">ФРАКЦИИ</button>
          <button class="codex-tab ${tab === "terms" ? "active" : ""}" data-codex-tab="terms">ТЕРМИНЫ</button>
          <button class="codex-tab ${tab === "characters" ? "active" : ""}" data-codex-tab="characters">ПЕРСОНАЖИ</button>
          <button class="codex-tab ${tab === "enemies" ? "active" : ""}" data-codex-tab="enemies">ВРАГИ</button>
        </div>

        <div class="codex-list">
          ${current.data.map(entry => `
            <div class="codex-entry">
              <div class="codex-icon">${esc(entry.icon || "◆")}</div>
              <div class="codex-text">
                <b>${esc(entry.name)}</b>
                ${entry.role ? `<small>${esc(entry.role)}</small>` : ""}
                <p>${esc(entry.desc)}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}
/* ============================================================
   ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
   ============================================================ */
function applyVisualEffects() {
  const body = document.body;
  if (!body) return;

  const lastStory = GAME.story[GAME.story.length - 1];
  if (!lastStory) return;

  const canCrit   = (typeof getSetting !== "function") || getSetting("visualCrit");
  const canDamage = (typeof getSetting !== "function") || getSetting("visualDamage");
  const canLevel  = (typeof getSetting !== "function") || getSetting("visualLevel");

  if (canCrit && lastStory.type === "entry-critical") {
    body.classList.add("crit-flash");
    setTimeout(() => body.classList.remove("crit-flash"), 700);
  }

  if (canDamage && lastStory.title && lastStory.title.includes("ПОЛУЧЕН УРОН")) {
    body.classList.add("damage-flash");
    setTimeout(() => body.classList.remove("damage-flash"), 800);
  }

  if (canLevel && lastStory.title && lastStory.title.includes("ПОВЫШЕНИЕ")) {
    body.classList.add("level-up-flash");
    setTimeout(() => body.classList.remove("level-up-flash"), 1300);
  }

  // Подсветка низкого HP
  const hpBar = document.querySelector(".progress i");
  if (hpBar && GAME.character) {
    const hpPercent = (GAME.character.hp / GAME.character.maxHp) * 100;
    if (hpPercent <= 25) {
      const hpLabel = document.querySelector(".small-row strong");
      if (hpLabel) hpLabel.classList.add("low-hp");
    }
  }
}
/* ============================================================
   КАТСЦЕНА (переход между главами)
   ============================================================ */
function playCutscene() {
  if (typeof playSound === "function") playSound("cutscene");
  // Удаляем старую катсцену, если есть
  const existing = document.getElementById("cutsceneOverlay");
  if (existing) existing.remove();

  // Создаём overlay
  const overlay = document.createElement("div");
  overlay.id = "cutsceneOverlay";
  overlay.className = "cutscene-overlay";

  const title = document.createElement("div");
  title.className = "cutscene-text";
  title.textContent = "ЛОРЕС-СЕКУНДУС";

  const sub = document.createElement("div");
  sub.className = "cutscene-sub";
  sub.textContent = "СУБСЕКТОР ГЕЛДОН · ВТОРАЯ ЧАСТЬ";

  overlay.appendChild(title);
  overlay.appendChild(sub);
  document.body.appendChild(overlay);

  // Активируем анимацию
  setTimeout(() => overlay.classList.add("active"), 50);

  // Удаляем через 3.5 секунды
  setTimeout(() => {
    overlay.classList.remove("active");
    setTimeout(() => overlay.remove(), 500);
  }, 3500);
}
