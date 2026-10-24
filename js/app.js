/* ============================================================
   APP.JS — точка входа
   ============================================================ */

// Идентификатор поколения предотвращает устаревшие async-катсцены
// от смены сцены после того, как игрок начал другую кампанию/главу.
let _campaignGeneration = 0;

function beginNewCampaignFlow(){
  // First run: explain the setting before asking the player to choose a character.
  if(typeof lorePrimerWasSeen === "function" && !lorePrimerWasSeen() && typeof showLorePrimer === "function"){
    showLorePrimer(false, { onClose: () => openNewCampaign() });
    return;
  }
  openNewCampaign();
}

function bindUI(){
  document.querySelectorAll("[data-asset-category]").forEach(button => {
    button.onclick = () => { GAME._assetArchiveCategory = button.dataset.assetCategory || "all"; renderAll(); };
  });
  document.querySelectorAll("[data-asset-search-form]").forEach(form => {
    form.onsubmit = event => { event.preventDefault(); GAME._assetArchiveQuery = String(form.querySelector("[data-asset-search-input]")?.value || "").trim(); renderAll(); };
  });
  document.querySelectorAll("[data-asset-clear-search]").forEach(button => {
    button.onclick = () => { GAME._assetArchiveQuery = ""; renderAll(); };
  });
  document.querySelectorAll("img[data-asset-img]").forEach(img => {
    if(img.dataset.recoveryBound === "1") return;
    img.dataset.recoveryBound = "1";
    img.addEventListener("error", () => {
      const wrap = img.closest(".asset-card-media");
      if(!wrap) return;
      img.hidden = true;
      const fallback = wrap.querySelector(".asset-card-empty");
      if(fallback) fallback.hidden = false;
    }, {once:true});
  });
  document.querySelectorAll("img.scene-image, img.story-location-art-image, img.avatar-img, img.codex-card-img, img.location-icon-image").forEach(img => {
    if(img.dataset.recoveryBound === "1") return;
    img.dataset.recoveryBound = "1";
    img.addEventListener("error", () => {
      if(img.dataset.fallbackApplied === "1") return;
      img.dataset.fallbackApplied = "1";
      const card = img.closest(".scene-illustration");
      if(card){
        card.classList.add("scene-placeholder");
        const caption = card.querySelector("figcaption")?.textContent || img.alt || "Архивный кадр";
        card.innerHTML = `<div class="scene-placeholder-art" aria-hidden="true"><span class="scene-placeholder-ring"></span><span class="scene-placeholder-crosshair"></span>${typeof renderImperialCross === "function" ? renderImperialCross("placeholder-cross") : ""}</div><div class="scene-caption">${esc(caption)}</div><div class="scene-placeholder-note">ФАЙЛ НЕ ПРОЧИТАН · ТЕКСТ И СОСТОЯНИЕ КАМПАНИИ СОХРАНЕНЫ</div>`;
      } else if(img.classList.contains("story-location-art-image")) {
        img.closest(".story-location-art")?.classList.add("story-art-unavailable");
      } else if(img.classList.contains("avatar-img")) {
        const holder = img.closest(".avatar");
        if(holder){ holder.classList.add("avatar-art-fallback"); img.remove(); const inner=holder.querySelector(".avatar-inner"); if(inner && !inner.querySelector(".avatar-symbol")) inner.insertAdjacentHTML("beforeend", '<span class="avatar-symbol">✦</span>'); }
      } else if(img.classList.contains("codex-card-img")) {
        const fallback=document.createElement("div"); fallback.className="codex-card-icon"; fallback.textContent=(img.alt||"◆").trim().charAt(0)||"◆"; img.replaceWith(fallback);
      } else if(img.classList.contains("location-icon-image")) {
        const fallback=document.createElement("span"); fallback.className="location-symbol"; fallback.setAttribute("aria-hidden","true"); fallback.textContent="⛨"; img.replaceWith(fallback);
      }
    }, {once:true});
  });
  document.querySelectorAll("[data-toggle-panel]").forEach(b => b.onclick = () => {
    const panel = b.dataset.togglePanel;
    if(panel !== "right") return;
    const open = document.body.classList.toggle("show-right-panel");
    document.querySelectorAll('[data-toggle-panel="right"]').forEach(toggle => {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "× ЗАКРЫТЬ" : "☷ СОСТОЯНИЕ";
    });
  });
  document.querySelectorAll("[data-close-panel]").forEach(b => b.onclick = () => {
    document.body.classList.remove("show-right-panel");
    document.querySelectorAll('[data-toggle-panel="right"]').forEach(toggle => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☷ СОСТОЯНИЕ";
    });
  });
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => {
    GAME.view = b.dataset.view;
    GAME._portraitPulse = true;
    renderAll();
  });
    document.querySelectorAll("[data-goto-talents]").forEach(b => {
    b.onclick = () => {
      GAME.view = "abilities";
      GAME._portraitPulse = true;
      renderAll();
    };
  });
  // Управление игровыми действиями выполняется кнопками сцен и панелей.
  document.querySelectorAll("[data-zoom]").forEach(el => el.onclick = () => {
    openImageModal(el.dataset.zoom);
  });
  document.querySelectorAll("[data-dialogue]").forEach(b => b.onclick = () => {
    chooseDialogueOption(parseInt(b.dataset.dialogue, 10));
  });

  document.querySelectorAll("[data-deduction]").forEach(b => b.onclick = () => {
    const result = makeInvestigationDeduction(b.dataset.deduction);
    addSystem(result.ok ? "ВЫВОД ЗАФИКСИРОВАН" : "ДОСЬЕ", result.message);
    renderAll();
  });

  document.querySelectorAll("[data-interrogate-name]").forEach(b => b.onclick = () => {
    const result = formalInterrogate(b.dataset.interrogateName, b.dataset.interrogateTopic);
    if(!result.ok) addSystem("ДОПРОС НЕ СОСТОЯЛСЯ", result.message);
    renderAll();
  });

  // Независимый обработчик панели флагов: не должен зависеть от наличия диалога.
  const flagsHead = document.querySelector("[data-toggle-flags]");
  if(flagsHead){
    flagsHead.onclick = () => {
      const body = document.getElementById("flagsBody");
      const toggle = document.getElementById("flagsToggle");
      if(!body) return;
      const opening = body.style.display === "none";
      body.style.display = opening ? "block" : "none";
      if(toggle) toggle.classList.toggle("open", opening);
    };
  }

  document.querySelectorAll("[data-action]").forEach(b => b.onclick = () => {
    const a = b.dataset.action;
    if(a === "new")       beginNewCampaignFlow();
    if(a === "assets")    { GAME._assetArchiveStandalone = true; GAME._assetArchiveCategory = "all"; GAME._assetArchiveQuery = ""; renderAll(); }
    if(a === "archive-back"){ GAME._assetArchiveStandalone = false; renderStart(); }
    if(a === "lore")      showLorePrimer(true);
    if(a === "load"){
      if(loadGame()){
        GAME.started = true;
        renderAll();
        addSystem("ВОССТАНОВЛЕНИЕ АРХИВА","Основная запись операции восстановлена.");
        renderAll();
      } else {
        const status = document.getElementById("startStatus");
        if(status){
          status.textContent = "Запись отсутствует или повреждена. Инициируй новую операцию, открой архивные слоты или внеси файл сохранения.";
        } else {
          addSystem("ВОССТАНОВЛЕНИЕ АРХИВА", "Сохранение не найдено или повреждено.");
          renderAll();
        }
      }
    }
    if(a === "dialogue")  openDialoguePicker();
    if(a === "save")      saveGame();
    if(a === "slots")     openSaveSlotsModal();
    if(a === "export")    exportGame();
    if(a === "import")    document.getElementById("importFile").click();
    if(a === "help")      showHelp();
    if(a === "tutorial")  showTutorial(true);
    if(a === "pray") {
      if(typeof prayToEmperor === "function") prayToEmperor();
      renderAll();
      saveGameSilent();
    }
    if(a === "lastStand") lastStand();
  });


  document.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => handleCommand(b.dataset.quick));
  document.querySelectorAll("[data-item]").forEach(b => b.onclick = () => useItem(b.dataset.item));

  document.querySelectorAll("[data-combat]").forEach(b => b.onclick = () => {
    const x = b.dataset.combat;
    if(x === "attack")  combatAttack();
    if(x === "analyze") analyzeEnemy();
    if(x === "aim") combatAim();
    if(x === "cover") combatTakeCover();
    if(x === "defend")  combatDefend();
    if(x === "flee")    combatFlee();
    if(x === "med")     useItem("Медикамент");
    if(x === "repair")  useItem("Ремкомплект");
    if(x === "reload")  reloadWeapon();
  });

  document.querySelectorAll("[data-slot]").forEach(b => b.onclick = () => {
    switchWeaponSlot(b.dataset.slot);
  });

  document.querySelectorAll("[data-target]").forEach(b => b.onclick = () => {
    GAME.combat.targetIndex = parseInt(b.dataset.target, 10);
    renderAll();
  });

  document.querySelectorAll("[data-location]").forEach(b => b.onclick = () => {
  const n = b.dataset.location;
  if(n === GAME.character.location) return;

  // Можно перейти в соседнюю неизведанную локацию, но сюжетные запечатанные зоны остаются закрытыми.
  const neighbors = (typeof locationNeighbors === "function") ? locationNeighbors() : [];
  if(!neighbors.find(x => x.name === n)) return;
  if(typeof isLocationAccessible === "function" && !isLocationAccessible(n)){
    const gate=typeof getLocationGateReason === "function" ? getLocationGateReason(n) : "Маршрут пока закрыт сюжетом.";
    addSystem("МАРШРУТ ПЕРЕКРЫТ",gate); renderAll(); return;
  }

  moveTo(n);
  GAME._portraitPulse = true;
  renderAll();
});

  document.querySelectorAll("[data-choice]").forEach(b => b.onclick = () => {
    if(b.disabled) return;
    chooseSceneChoice(parseInt(b.dataset.choice, 10));
  });

  document.querySelectorAll("[data-talent]").forEach(b => b.onclick = () => {
  takeTalent(b.dataset.talent);
});

document.querySelectorAll("[data-active-talent]").forEach(b => b.onclick = () => {
  useActiveTalent(b.dataset.activeTalent);
});

  // Системы развития, отряда, побочных операций, снабжения и мастерской.
  document.querySelectorAll("[data-doctrine]").forEach(b => b.onclick = () => {
    const result = selectDoctrine(b.dataset.doctrine);
    if(!result.ok) addSystem("ПОЛЕВАЯ ПОДГОТОВКА", result.message);
    renderAll();
  });
  document.querySelectorAll("[data-operation-start]").forEach(b => b.onclick = () => startExpansionOperation(b.dataset.operationStart));
  document.querySelectorAll("[data-operation-choice]").forEach(b => b.onclick = () => {
    const [operationId, approachId] = String(b.dataset.operationChoice||"").split("|");
    const result = resolveExpansionOperation(operationId, approachId);
    if(!result.ok) addSystem("ПЛАНШЕТ ОПЕРАЦИЙ", result.message);
    renderAll();
  });
  document.querySelectorAll("[data-explore-action]").forEach(b => b.onclick = () => {
    const result = exploreCurrentLocation(b.dataset.exploreAction);
    if(!result.ok) addSystem("ПОЛЕВОЕ ИССЛЕДОВАНИЕ", result.message);
    renderAll();
  });
  document.querySelectorAll("[data-contact-action]").forEach(b => b.onclick = () => {
    const [contactId, actionId] = String(b.dataset.contactAction||"").split("|");
    const result = performContactAction(contactId, actionId);
    if(!result.ok) addSystem("КОНТАКТ", result.message);
    renderAll();
  });
  document.querySelectorAll("[data-personal-quest]").forEach(b => b.onclick = () => {
    const action=b.dataset.personalQuest;
    const result=action==="start" ? startLyraPersonalQuest() : resolveLyraPersonalQuest(action);
    if(!result.ok) addSystem("ЛИЧНОЕ ДЕЛО",result.message);
    renderAll();
  });
  document.querySelectorAll("[data-armory-buy]").forEach(b => b.onclick = () => {
    const result = purchaseArmoryItem(b.dataset.armoryBuy);
    if(!result.ok) addSystem("СНАБЖЕНИЕ", result.message);
    renderAll();
  });
  document.querySelectorAll("[data-cinematic-dismiss]").forEach(b => b.onclick = () => dismissExpansionCinematic());
  document.querySelectorAll("[data-editor-field]").forEach(el => el.addEventListener("input", () => updateExpansionEditorField(el.dataset.editorField, el.value)));
  document.querySelectorAll("[data-editor-action]").forEach(b => b.onclick = () => {
    const action=b.dataset.editorAction;
    if(action==="save") { const result=saveExpansionDraft(); if(!result.ok) addSystem("МАСТЕРСКАЯ",result.message); }
    else if(action==="validate") { const result=validateExpansionDrafts(); if(!result.ok) addSystem("ПРОВЕРКА ЧЕРНОВИКОВ",result.errors.join("\n")); }
    else if(action==="export") { const result=exportExpansionDrafts(); if(typeof result==="string" && result.startsWith("{")) { addSystem("МАСТЕРСКАЯ", "Экспорт недоступен в этой среде. JSON сформирован, но автоматическое скачивание не поддерживается."); } }
    renderAll();
  });
  document.querySelectorAll("[data-editor-delete]").forEach(b => b.onclick = () => deleteExpansionDraft(Number(b.dataset.editorDelete)));

  // Табы Кодекса
document.querySelectorAll("[data-codex-tab]").forEach(b => {
  b.onclick = () => {
    GAME._codexTab = b.dataset.codexTab;
    renderAll();
  };
});
  // Настройки
  document.querySelectorAll("[data-setting]").forEach(b => {
    b.onclick = () => {
      toggleSetting(b.dataset.setting);
    };
  });
  document.querySelectorAll("[data-audio-range]").forEach(el => {
    el.addEventListener("input", () => {
      const key = el.dataset.audioRange;
      const value = Math.max(0, Math.min(1, Number(el.value)));
      setSetting(key, value);
      const out = document.querySelector(`[data-audio-value="${key}"]`);
      if (out) out.textContent = `${Math.round(value * 100)}%`;
    });
  });
  document.querySelectorAll("[data-setting-reset]").forEach(b => {
    b.onclick = () => {
      if (confirm("Сбросить все настройки?")) {
        GAME_SETTINGS = { ...DEFAULT_SETTINGS };
        saveSettings();
        renderAll();
      }
    };
  });
  document.querySelectorAll("[data-chronicle-filter]").forEach(b => {
    b.onclick = () => {
      GAME._chronicleFilter = b.dataset.chronicleFilter;
      renderAll();
    };
  });
}

/* ============================================================
   Создание персонажа
   ============================================================ */
function createCharacter({name, classId, presetId, backstory = "", lore = "", hook = "", quote = "", role = "", organization = "", mission = "", relations = "", weakness = ""}){
  const cls = CLASSES[classId];
  const stats = {...cls.stats};
  return {
    presetId,
    name: name || "Безымянный",
    classId,
    className: cls.name,
    icon: cls.icon,
    backstory, lore, hook, quote,
    role, organization, mission, relations, weakness,
    level:1, xp:0, nextXp:100,
    hp: cls.hp, maxHp: cls.hp,
    ac: cls.ac,
    initiative: modifier(stats.dex),
    prof: cls.prof,
    fate:3, maxFate:3,
    credits:100,
    stats,
    weapon: cls.weapon,
    meleeWeapon: cls.name === "Космодесантник" ? "Цепной меч" : "Боевой нож",
    armor: cls.armor,
    ammo:{laspistol:12, lasgun:24, bolter:20, plasma:6, autogun:30, improvised:6},
    grenades:{
      "Осколочная граната": cls.name === "Гвардеец" ? 3 : 2,
      "Крак-граната":       cls.name === "Космодесантник" ? 2 : 1,
      "Дымовая граната":    1
    },
    conditions:[],
    inventory: cls.name === "Инквизитор"
  ? [{name:"Медикамент",qty:2},{name:"Печать допуска",qty:1},{name:getAmmoReserveName(cls.weapon),qty:24},{name:"Святая вода",qty:1}]
  : cls.name === "Гвардеец"
  ? [{name:"Медикамент",qty:2},{name:"Ремкомплект",qty:1},{name:getAmmoReserveName(cls.weapon),qty:36},{name:"Святая вода",qty:1}]
  : [{name:"Медикамент",qty:2},{name:"Таинственный фрагмент",qty:1},{name:getAmmoReserveName(cls.weapon),qty:20},{name:"Святая вода",qty:1}],
    abilities:[...cls.abilities],
    _pendingTalentLevels: [],
    talents:[],
    reputation: (() => {
      // Базовые значения по лору
      const base = {
        Imperium: 5,
        Inquisition: 0,
        Militarum: 0,
        Mechanicus: -5,
        Ministorum: 2,
        Chaos: -10,
        Orks: -10,
        Astartes: -3,
        Arbites: 1
      };
      // Классовые модификаторы
      if (classId === "inquisitor") {
        base.Inquisition = 5;
        base.Militarum = 3;
        base.Mechanicus = -3;
        base.Astartes = -3;
        base.Arbites = 3;
      } else if (classId === "guardsman") {
        base.Militarum = 5;
        base.Inquisition = 0;
        base.Mechanicus = -5;
        base.Astartes = -3;
        base.Arbites = 0;
      } else if (classId === "spaceMarine") {
        base.Astartes = 5;
        base.Inquisition = -3;
        base.Militarum = 0;
        base.Mechanicus = -5;
        base.Arbites = 0;
      }
      return base;
    })(),
    discovered: ["Доки Навигатор"],
    location: "Доки Навигатор"
  };
}

function startCampaign(character, custom = false){
  const campaignGeneration = ++_campaignGeneration;
  GAME.started = true;
  GAME.character = character;
  GAME.story = [];
  GAME.journal = [];
  GAME.mode = "explore";
  GAME.combat = null;
  GAME.turn = 1;
  GAME.round = 1;
  GAME.view = "story";
  GAME._portraitPulse = true;
  GAME._pendingTalentLevels = [];
  GAME._rollHistory = [];
  GAME._lastRoll = null;
  GAME._recentActions = {};
  GAME.dialogue = null;
  GAME.companions = [];
  GAME.dialogueEffectsApplied = {};
  GAME._portraitSrc = null;
  GAME._rolling = false;

  GAME.meta = GAME.meta || {};
  GAME.meta.seed = (Date.now() & 0xffffffff) >>> 0;
  RNG.setSeed(GAME.meta.seed);
  GAME.meta.startedAt = Date.now();

  resetWorld();
  initQuests();
  initNPCs();
  if(typeof initContinuity === "function") initContinuity();
  if(typeof initCampaignDirector === "function") initCampaignDirector();
  if(typeof initTriggers === "function") initTriggers();
  // Нормализуем стартовое открытие локаций: персонаж из старого/ручного
  // сохранения может не иметь массива discovered.
  if (GAME.character && !Array.isArray(GAME.character.discovered)) {
    GAME.character.discovered = [];
  }
  if (GAME.character && GAME.character.location &&
      !GAME.character.discovered.includes(GAME.character.location)) {
    GAME.character.discovered.push(GAME.character.location);
  }
  if(typeof initTalents === "function") initTalents();
  if(typeof initCorruption === "function") initCorruption();
  if(typeof initCompanions === "function") initCompanions();
  if(typeof initializeExpansionSystems === "function") initializeExpansionSystems();

  addSystem("ВОСХОЖДЕНИЕ В УЛЬЙ", "Сектор оживает под гулом генераторов.");
  // Приказ учитывает не только класс, но и биографию готового героя.
  const presetOrders = {
    "inquisitor-varro": "Ордо Херетикус поручает тебе восстановить дело Кралла и расследовать исчезновения в секторе IX.",
    "inquisitor-mara": "Твой приказ — выявить и пресечь возможную деятельность культа Тзинча в секторе IX.",
    "inquisitor-vorn": "Твой приказ — восстановить цепочку распоряжений, приведших к закрытию прежнего дела.",
    "guardsman-kane": "Гарнизон направляет сержанта Варна из 2-й роты 14-го Хелдонского полка проверить сектор IX.",
    "guardsman-lyra": "Тебе, рядовой Вейл из 22-го резервного полка, поручено усилить охрану и выяснить обстоятельства исчезновения патруля.",
    "guardsman-brek": "Капрал Брек из 9-й осадной роты получает приказ обследовать промышленный сектор и подтвердить угрозу до открытия огня.",
    "marine-acheron": "Караул Смерти направляет брата Ахерона проверить сигнал о пропавшем караване и необычной активности.",
    "marine-cato": "Брат Като должен обследовать закрытые проходы и установить причину исчезновения патрулей.",
    "marine-draco": "Брат-сержант Кай получает приказ установить природу угрозы в Хелдон-Прайм до принятия дальнейших мер.",
    "marine-io": "Брат Ио направлен сопровождать расследование аномального варп-эхо, не вступая в контакт без необходимости."
  };
  let orderText = presetOrders[character.presetId] || "Пропавшие рабочие сектора IX — твоя первая нить. Официальная версия говорит об аварии, но доклады противоречат друг другу.";
  if (!character.presetId && character.classId === "spaceMarine") {
    orderText = "Караул Смерти направил тебя в Хелдон-Прайм проверить необычную активность. Природа угрозы пока не установлена.";
  }
  addSystem("ПОЛУЧЕН ПРИКАЗ", custom
    ? "Ты сам определил, кем был до прибытия в улей. Приказ задаёт цель расследования, но не предрешает твои решения."
    : orderText
  );

// Запуск сцены по классу — вводная вместо sf_boot
const introScene = {
  "inquisitor":  "sf_intro_inquisitor",
  "guardsman":   "sf_intro_guardsman",
  "spaceMarine": "sf_intro_marine"
}[character.classId] || "sf_boot";

  const sc = CAMPAIGN_SCENARIOS.silentForge;
  GAME.campaign = {
    active: true,
    scenarioId: "silentForge",
    sceneId: introScene,
    stack: [introScene],
    pendingCombat: null
  };
  // Сохраняем сразу — до катсцены
  saveGameSilent();
  // Катсцена класса перед вводной сценой
  const classCutsceneKey = `class_${character.classId}`;
  if (typeof playChapterCutscene === "function" && typeof shouldShowCutscene === "function") {
    if (shouldShowCutscene(classCutsceneKey)) {
      playChapterCutscene(classCutsceneKey).then(() => {
        if (campaignGeneration !== _campaignGeneration) return;
        if (typeof markCutsceneSeen === "function") markCutsceneSeen(classCutsceneKey);
        enterScene(introScene);
        saveGameSilent();
        if(typeof maybeShowTutorial === "function") setTimeout(() => maybeShowTutorial(), 250);
      });
      return;
    }
  }

  enterScene(introScene);
  saveGameSilent();
  if(typeof maybeShowTutorial === "function") setTimeout(() => maybeShowTutorial(), 250);
}

/* ---------- Сохранения ---------- */
function saveGameSilent(){
  try {
    const previous = localStorage.getItem(SAVE_KEY);
    if(previous){
      try { prepareLoadedState(JSON.parse(previous)); localStorage.setItem(SAVE_BACKUP_KEY, previous); } catch (_) {}
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializeGame()));
    return true;
  } catch(e){
    console.warn("[Save] Автосохранение не удалось:", e);
    return false;
  }
}

const SAVE_VERSION = 13;
const SAVE_BACKUP_KEY = "wh40k_solo_rpg_save_backup_v1";

function serializeGame(){
  return {format:"wh40k-solo-rpg-save", version:SAVE_VERSION, exportedAt:new Date().toISOString(), state:JSON.parse(JSON.stringify(GAME))};
}

function migrateSave(saved){
  if(!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Некорректный формат сохранения.");
  if(saved.format && saved.format !== "wh40k-solo-rpg-save") throw new Error("Это не файл сохранения Warhammer 40,000 Solo RPG.");
  if(saved.version && (!Number.isFinite(saved.version) || saved.version > SAVE_VERSION)) throw new Error("Версия сохранения новее этой сборки.");
  let s = saved.state && typeof saved.state === "object" && !Array.isArray(saved.state) ? saved.state : saved;
  // Migration operates on the parsed save object. Keep defaults conservative;
  // complete shape validation is handled by prepareLoadedState below.
  s.world = s.world && typeof s.world === "object" && !Array.isArray(s.world) ? s.world : {};
  s.world.flags = s.world.flags && typeof s.world.flags === "object" && !Array.isArray(s.world.flags) ? s.world.flags : {};
  s.world.investigation = s.world.investigation && typeof s.world.investigation === "object" && !Array.isArray(s.world.investigation) ? s.world.investigation : {evidence:[], deductions:{}, history:[]};
  s.world.investigation.evidence = Array.isArray(s.world.investigation.evidence) ? s.world.investigation.evidence : [];
  s.world.investigation.deductions = s.world.investigation.deductions && typeof s.world.investigation.deductions === "object" && !Array.isArray(s.world.investigation.deductions) ? s.world.investigation.deductions : {};
  s.world.investigation.history = Array.isArray(s.world.investigation.history) ? s.world.investigation.history : [];
  s.character = s.character && typeof s.character === "object" && !Array.isArray(s.character) ? s.character : {};
  s.meta = s.meta && typeof s.meta === "object" && !Array.isArray(s.meta) ? s.meta : {};
  if(!saved.version || saved.version < 2){ s.journal ||= []; }
  if(!saved.version || saved.version < 3){ s.character.conditions ||= []; s.meta.version ||= 3; s.meta.seed ??= 1; s.meta.startedAt ??= null; }
  if(!saved.version || saved.version < 4){
    s.meta.version = 4;
    s._lastCommand = s._lastCommand || null;
    s.companions = s.companions || [];
  }
  if(!saved.version || saved.version < 5){
    s.dialogueEffectsApplied = s.dialogueEffectsApplied || {};
    s.companions = Array.isArray(s.companions) ? s.companions : [];
    s.npcs = s.npcs && typeof s.npcs === "object" && !Array.isArray(s.npcs) ? s.npcs : {};
    s.world.flags = s.world.flags || {};
  s.world.investigation = s.world.investigation && typeof s.world.investigation === "object" ? s.world.investigation : {evidence:[], deductions:{}, history:[]};
  s.world.investigation.evidence = Array.isArray(s.world.investigation.evidence) ? s.world.investigation.evidence : [];
  s.world.investigation.deductions = s.world.investigation.deductions && typeof s.world.investigation.deductions === "object" ? s.world.investigation.deductions : {};
  s.world.investigation.history = Array.isArray(s.world.investigation.history) ? s.world.investigation.history : [];
    s.meta.version = 5;
  }
  return s;
}

function prepareLoadedState(saved){
  if(!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Некорректный формат сохранения.");
  // Clone so migration/normalization never mutates the stored raw JSON object.
  const clone = JSON.parse(JSON.stringify(saved));
  const s = migrateSave(clone);
  const isRecord = value => value && typeof value === "object" && !Array.isArray(value);
  if(!isRecord(s.character) || !CLASSES[s.character.classId]){
    throw new Error("В сохранении отсутствует персонаж с известным классом.");
  }

  const rawCharacter = s.character;
  const defaults = createCharacter({
    name: typeof rawCharacter.name === "string" && rawCharacter.name.trim() ? rawCharacter.name : "Безымянный",
    classId: rawCharacter.classId,
    presetId: rawCharacter.presetId,
    backstory: rawCharacter.backstory || "", lore: rawCharacter.lore || "",
    hook: rawCharacter.hook || "", quote: rawCharacter.quote || "",
    role: rawCharacter.role || "", organization: rawCharacter.organization || "",
    mission: rawCharacter.mission || "", relations: rawCharacter.relations || "", weakness: rawCharacter.weakness || ""
  });
  const character = {...defaults, ...rawCharacter};
  character.stats = {...defaults.stats};
  if(isRecord(rawCharacter.stats)){
    for(const key of Object.keys(defaults.stats)){
      if(Number.isFinite(rawCharacter.stats[key])) character.stats[key] = Math.max(1, Math.min(30, rawCharacter.stats[key]));
    }
  }
  character.inventory = Array.isArray(rawCharacter.inventory)
    ? rawCharacter.inventory.filter(item => isRecord(item) && typeof item.name === "string" && Number.isInteger(item.qty) && item.qty > 0).map(item => ({...item}))
    : defaults.inventory.map(item => ({...item}));
  character.conditions = Array.isArray(rawCharacter.conditions) ? rawCharacter.conditions.filter(x => typeof x === "string") : [];
  character.abilities = Array.isArray(rawCharacter.abilities) ? rawCharacter.abilities.filter(x => typeof x === "string") : [...defaults.abilities];
  character.talents = Array.isArray(rawCharacter.talents) ? rawCharacter.talents : [];
  const locationKeyByDisplayName = Object.fromEntries(Object.entries(LOCATIONS).map(([key, loc]) => [loc.name, key]));
  character.discovered = Array.isArray(rawCharacter.discovered)
    ? [...new Set(rawCharacter.discovered.filter(x => typeof x === "string").map(x => LOCATIONS[x] ? x : locationKeyByDisplayName[x]).filter(x => typeof x === "string" && LOCATIONS[x]))]
    : [defaults.location];
  character.ammo = {...defaults.ammo};
  if(isRecord(rawCharacter.ammo)) for(const key of Object.keys(character.ammo)){
    if(Number.isFinite(rawCharacter.ammo[key])) character.ammo[key] = Math.max(0, Math.floor(rawCharacter.ammo[key]));
  }
  // Migration: retain old generic ammunition reserves for compatibility. New loot uses
  // typed reserve packs; old «Патроны» stacks are not discarded or silently retyped.
  character.grenades = {...defaults.grenades};
  if(isRecord(rawCharacter.grenades)) for(const key of Object.keys(character.grenades)){
    if(Number.isFinite(rawCharacter.grenades[key])) character.grenades[key] = Math.max(0, Math.floor(rawCharacter.grenades[key]));
  }
  character.reputation = {...defaults.reputation};
  if(isRecord(rawCharacter.reputation)) for(const key of Object.keys(character.reputation)){
    if(Number.isFinite(rawCharacter.reputation[key])) character.reputation[key] = Math.max(-100, Math.min(100, rawCharacter.reputation[key]));
  }
  for(const key of ["level","xp","nextXp","credits","ac","prof","initiative","corruption"]){
    if(!Number.isFinite(character[key])) character[key] = defaults[key] ?? (key === "corruption" ? 0 : 0);
  }
  character.level = Math.max(1, Math.floor(character.level));
  character.xp = Math.max(0, Math.floor(character.xp));
  character.nextXp = Math.max(1, Math.floor(character.nextXp));
  character.credits = Math.max(0, Math.floor(character.credits));
  character.corruption = Math.max(0, Math.min(10, Math.floor(character.corruption)));
  character.lastPrayerDay = Number.isFinite(character.lastPrayerDay) ? Math.max(0, Math.floor(character.lastPrayerDay)) : 0;
  character.maxHp = Number.isFinite(character.maxHp) && character.maxHp > 0 ? Math.max(1, Math.floor(character.maxHp)) : defaults.maxHp;
  character.hp = Number.isFinite(character.hp) ? Math.max(0, Math.min(character.maxHp, Math.floor(character.hp))) : Math.min(defaults.hp, character.maxHp);
  character.maxFate = Number.isFinite(character.maxFate) && character.maxFate >= 0 ? Math.floor(character.maxFate) : defaults.maxFate;
  character.fate = Number.isFinite(character.fate) ? Math.max(0, Math.min(character.maxFate, Math.floor(character.fate))) : defaults.fate;
  if(!LOCATIONS[character.location]) character.location = locationKeyByDisplayName[character.location] || defaults.location;
  if(!character.discovered.includes(character.location)) character.discovered.push(character.location);
  if(!RANGED_WEAPONS[character.weapon]) character.weapon = defaults.weapon;
  if(!MELEE_WEAPONS[character.meleeWeapon]) character.meleeWeapon = defaults.meleeWeapon;
  if(!ARMOR[character.armor]) character.armor = defaults.armor;
  character.className = defaults.className;
  character.icon = defaults.icon;
  s.character = character;

  const rawWorld = isRecord(s.world) ? s.world : {};
  const worldDefaults = {day:1,hour:7,minute:15,heat:0,clues:0,discovered:[character.location],current:character.location,events:[],factionTension:{Imperium:0,Chaos:0,Orks:0},flags:{},seenEnemies:{},appliedEffectIds:{}};
  const world = {...worldDefaults, ...rawWorld};
  for(const key of ["day","hour","minute","heat","clues"]) if(!Number.isFinite(world[key])) world[key] = worldDefaults[key];
  world.day = Math.max(1, Math.floor(world.day));
  world.hour = Math.max(0, Math.min(23, Math.floor(world.hour)));
  world.minute = Math.max(0, Math.min(59, Math.floor(world.minute)));
  world.heat = Math.max(0, Math.min(10, world.heat));
  world.clues = Math.max(0, Math.floor(world.clues));
  world.events = Array.isArray(world.events) ? world.events : [];
  world.flags = isRecord(world.flags) ? world.flags : {};
  world.seenEnemies = isRecord(world.seenEnemies) ? world.seenEnemies : {};
  world.appliedEffectIds = isRecord(world.appliedEffectIds) ? world.appliedEffectIds : {};
  world.factionTension = {...worldDefaults.factionTension, ...(isRecord(world.factionTension) ? world.factionTension : {})};
  for(const key of Object.keys(world.factionTension)) if(!Number.isFinite(world.factionTension[key])) world.factionTension[key] = worldDefaults.factionTension[key] || 0;
  world.discovered = Array.isArray(world.discovered) ? [...new Set(world.discovered.filter(x => typeof x === "string").map(x => LOCATIONS[x] ? x : locationKeyByDisplayName[x]).filter(x => typeof x === "string" && LOCATIONS[x]))] : [character.location];
  if(typeof world.current !== "string" || !LOCATIONS[world.current]) world.current = locationKeyByDisplayName[world.current] || character.location;
  if(!world.discovered.includes(world.current)) world.discovered.push(world.current);
  if(typeof normalizeCampaignDirectorState === "function") normalizeCampaignDirectorState(world);
  s.world = world;

  s.started = true;
  s.story = Array.isArray(s.story) ? s.story.filter(e => isRecord(e)) : [];
  s.journal = Array.isArray(s.journal) ? s.journal : [];
  // Rebuild known NPC entries with valid shapes; keep any additional custom
  // NPC records that older builds may have stored.
  const rawNpcs = isRecord(s.npcs) ? s.npcs : {};
  const normalizedNpcs = {};
  for(const [name, def] of Object.entries(NPC_DEFS)){
    const current = isRecord(rawNpcs[name]) ? rawNpcs[name] : {};
    const base = JSON.parse(JSON.stringify(def));
    const attitude = Number.isFinite(current.attitude) ? Math.max(-20, Math.min(20, current.attitude)) : def.attitude;
    const rumors = Array.isArray(current.rumors) && current.rumors.every(r => isRecord(r) && typeof r.text === "string" && Number.isFinite(r.trust))
      ? current.rumors : base.rumors;
    normalizedNpcs[name] = {
      ...base, ...current,
      name: def.name,
      role: typeof current.role === "string" ? current.role : def.role,
      avatar: typeof current.avatar === "string" ? current.avatar : def.avatar,
      attitude,
      tags: Array.isArray(current.tags) ? current.tags.filter(x => typeof x === "string") : [...def.tags],
      rumors,
      met: Boolean(current.met)
    };
  }
  for(const [name, current] of Object.entries(rawNpcs)){
    if(!normalizedNpcs[name] && isRecord(current)) normalizedNpcs[name] = current;
  }
  s.npcs = normalizedNpcs;

  // Merge missing quest definitions into old saves without resetting progress.
  const rawQuests = isRecord(s.quests) ? s.quests : {};
  const normalizedQuests = {};
  for(const [id, current] of Object.entries(rawQuests)){
    if(!isRecord(current)) continue;
    normalizedQuests[id] = current;
  }
  for(const def of QUEST_DEFS){
    const current = isRecord(rawQuests[def.id]) ? rawQuests[def.id] : {};
    const objectives = Array.isArray(current.objectives) && current.objectives.every(x => typeof x === "string") ? current.objectives : [...def.objectives];
    const progress = Number.isFinite(current.progress) ? Math.max(0, Math.min(objectives.length, Math.floor(current.progress))) : 0;
    const rewards = {...def.rewards, ...(isRecord(current.rewards) ? current.rewards : {})};
    for(const key of ["xp","credits"]) rewards[key] = Number.isFinite(rewards[key]) ? Math.max(0, Math.floor(rewards[key])) : def.rewards[key];
    if(!isRecord(rewards.reputation)) rewards.reputation = isRecord(def.rewards.reputation) ? {...def.rewards.reputation} : {};
    const validStatus = ["hidden","active","complete","failed"].includes(current.status);
    const status = validStatus ? current.status : (progress >= objectives.length && objectives.length > 0 ? "complete" : (def.id === "silentForge" ? "active" : "hidden"));
    const progressSources = isRecord(current.progressSources) ? current.progressSources : {};
    normalizedQuests[def.id] = {...def, ...current, objectives, rewards, progress, status, progressSources, rewardClaimed: current.rewardClaimed === true || status === "complete", failedReason: typeof current.failedReason === "string" ? current.failedReason : null};
  }
  s.quests = normalizedQuests;
  // Named quest objectives were added in 2.1. Migrate old counter-only saves
  // without resetting quest statuses, progress, rewards or failure reasons.
  if(typeof normalizeQuestCollection === "function") normalizeQuestCollection(s.quests);
  s.companions = Array.isArray(s.companions) ? s.companions : [];
  s.dialogueEffectsApplied = isRecord(s.dialogueEffectsApplied) ? s.dialogueEffectsApplied : {};
  s.meta = isRecord(s.meta) ? s.meta : {};
  s.meta.version = SAVE_VERSION;
  if(!Number.isFinite(s.meta.seed)) s.meta.seed = 1;
  if(s.meta.startedAt === undefined) s.meta.startedAt = null;
  s.turn = Number.isFinite(s.turn) ? Math.max(1, Math.floor(s.turn)) : 1;
  s.round = Number.isFinite(s.round) ? Math.max(1, Math.floor(s.round)) : 1;

  const rawCampaign = isRecord(s.campaign) ? s.campaign : {};
  const scenarioId = CAMPAIGN_SCENARIOS[rawCampaign.scenarioId] ? rawCampaign.scenarioId : "silentForge";
  const scenario = CAMPAIGN_SCENARIOS[scenarioId];
  const sceneId = scenario.scenes[rawCampaign.sceneId] ? rawCampaign.sceneId : scenario.startScene;
  const stack = Array.isArray(rawCampaign.stack) ? rawCampaign.stack.filter(id => scenario.scenes[id]) : [];
  if(!stack.length) stack.push(sceneId);
  if(stack[stack.length - 1] !== sceneId) stack.push(sceneId);
  s.campaign = {active:true, scenarioId, sceneId, stack, pendingCombat:isRecord(rawCampaign.pendingCombat) ? rawCampaign.pendingCombat : null};

  const modes = ["explore","combat","death","dead","corruption-end"];
  s.mode = modes.includes(s.mode) ? s.mode : "explore";
  s.combat = isRecord(s.combat) ? s.combat : null;
  if(s.mode === "combat"){
    const validEnemies = s.combat && Array.isArray(s.combat.enemies) ? s.combat.enemies.filter(e => isRecord(e) && typeof e.type === "string" && ENEMIES[e.type]) : [];
    if(!validEnemies.length){ s.mode = "explore"; s.combat = null; }
    else {
      s.combat.enemies = validEnemies.map(e => {
        const def = ENEMIES[e.type];
        const maxHp = Number.isFinite(e.maxHp) && e.maxHp > 0 ? e.maxHp : (def.maxHp || def.hp);
        const hp = Number.isFinite(e.hp) ? Math.max(0, Math.min(maxHp, e.hp)) : (def.hp || def.maxHp);
        return {...def, ...e,
          hp, maxHp,
          loot:Array.isArray(e.loot) ? e.loot : [...(def.loot || [])],
          weaknesses:Array.isArray(e.weaknesses) ? e.weaknesses : [...(def.weaknesses || [])],
          resistances:Array.isArray(e.resistances) ? e.resistances : [...(def.resistances || [])]
        };
      });
      if(!s.combat.enemies.some(e => e.hp > 0)){
        s.mode = "explore";
        s.combat = null;
      } else {
        s.combat.targetIndex = Number.isInteger(s.combat.targetIndex) && s.combat.targetIndex >= 0 && s.combat.targetIndex < s.combat.enemies.length ? s.combat.targetIndex : s.combat.enemies.findIndex(e => e.hp > 0);
        if(s.combat.targetIndex < 0) s.combat.targetIndex = 0;
        if(!["ranged","melee","grenade"].includes(s.combat.weaponSlot)) s.combat.weaponSlot = "ranged";
        if(!["player","enemy"].includes(s.combat.turn)) s.combat.turn = "player";
        s.combat.round = Number.isFinite(s.combat.round) ? Math.max(1, Math.floor(s.combat.round)) : 1;
        s.combat.defending = Boolean(s.combat.defending);
      }
    }
  } else {
    // Do not leave a stale combat object from the previous live session.
    s.combat = null;
  }

  // Old saves may not have stored a dialogue object at all. Explicitly clear
  // it so loading such a save cannot leave the previous session's dialogue open.
  if(!isRecord(s.dialogue) || !DIALOGUE_TREES[s.dialogue.npcName] || !DIALOGUE_TREES[s.dialogue.npcName].nodes[s.dialogue.nodeId]) s.dialogue = null;
  if(!["story","character","inventory","quests","investigation","continuity","map","reputation","abilities","journal","codex","development","squad","operations","armory","editor"].includes(s.view)) s.view = "story";
  s._rolling = false;
  s._lastCommand = typeof s._lastCommand === "string" ? s._lastCommand : null;
  s._lastRoll = isRecord(s._lastRoll) ? s._lastRoll : null;
  s._rollHistory = Array.isArray(s._rollHistory) ? s._rollHistory.slice(-50) : [];
  s._recentActions = isRecord(s._recentActions) ? s._recentActions : {};
  s._portraitSrc = typeof s._portraitSrc === "string" ? s._portraitSrc : null;
  if(typeof s._portraitPulse !== "boolean") s._portraitPulse = false;
  return s;
}

function saveGame(){
  if(!GAME.started || !GAME.character){
    alert("Нет активного дела. Начни операцию или восстанови архивную запись.");
    return false;
  }
  if(!saveGameSilent()){
    alert("Архивная запись не завершена. Проверь доступное место в хранилище браузера.");
    return false;
  }
  addSystem("СОСТОЯНИЕ ОПЕРАЦИИ ЗАФИКСИРОВАНО", "Основная запись обновлена. Для отдельной точки восстановления открой архивные слоты; для переноса используй выгрузку JSON.");
  renderAll();
  return true;
}

function loadGame(){
  const candidates = [
    {key:SAVE_KEY, label:"основной слот"},
    {key:SAVE_BACKUP_KEY, label:"резервная копия"}
  ].map(item => ({...item, raw:localStorage.getItem(item.key)})).filter(item => item.raw);
  if(!candidates.length) return false;
  let lastError = null;
  for(const candidate of candidates){
    try {
      const parsed = JSON.parse(candidate.raw);
      const state = prepareLoadedState(parsed);
      Object.assign(GAME, state);
      if(typeof normalizeNPCs === "function") normalizeNPCs();
      if(typeof initContinuity === "function") initContinuity({rehydrateFlags:true});
      if(typeof initCampaignDirector === "function") initCampaignDirector();
      if(typeof initCompanions === "function") initCompanions();
      if(typeof syncCompanionsFromFlags === "function") syncCompanionsFromFlags();
      if(typeof initializeExpansionSystems === "function") initializeExpansionSystems();
      if(GAME.meta?.seed) RNG.setSeed(GAME.meta.seed);
      if(candidate.key === SAVE_BACKUP_KEY){
        // Do not rotate the damaged primary slot into the backup. Repair the primary
        // from the successfully normalized in-memory state instead.
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(serializeGame())); }
        catch(e) { console.warn("[Save] Резервная копия загружена, но основной слот не удалось восстановить:", e); }
      } else {
        saveGameSilent();
      }
      if(candidate.key === SAVE_BACKUP_KEY) console.warn("[Save] Основной слот недоступен; восстановлена резервная копия.");
      return true;
    } catch(e){
      lastError = e;
      console.warn(`[Save] Не удалось загрузить ${candidate.label}:`, e);
    }
  }
  if(lastError) console.warn("[Save] Основной слот и резервная копия не могут быть загружены.");
  return false;
}

function downloadSaveJson(json, filename){
  let url = null;
  try {
    const blob = new Blob([json], {type:"application/json;charset=utf-8"});
    url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    if(typeof a.remove === "function") a.remove();
    else if(a.parentNode) a.parentNode.removeChild(a);
    // Some browsers need the object URL to survive the click task.
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 1500);
    return true;
  } catch(e){
    if(url) try { URL.revokeObjectURL(url); } catch (_) {}
    console.warn("[Save] Экспорт не удался:", e);
    alert("Браузер не смог скачать файл сохранения.");
    return false;
  }
}

function exportGame(){
  let serialized;
  if(GAME.started && GAME.character) serialized = JSON.stringify(serializeGame(), null, 2);
  else {
    serialized = localStorage.getItem(SAVE_KEY) || localStorage.getItem(SAVE_BACKUP_KEY);
    if(!serialized){ alert("В архиве нет записи. Сначала начни операцию, затем зафиксируй её состояние."); return false; }
    try { serialized = JSON.stringify(JSON.parse(serialized), null, 2); }
    catch (_) { alert("Локальное сохранение повреждено. Попробуй загрузить резервную копию."); return false; }
  }
  const name = GAME.character?.name || "campaign";
  const safeName = String(name).normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0,32) || "campaign";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const ok = downloadSaveJson(serialized, `warhammer40k_${safeName}_${stamp}.json`);
  if(ok && GAME.started){ addSystem("ВЫГРУЗКА АРХИВА", "Архивный файл операции передан браузеру для сохранения."); renderAll(); }
  return ok;
}

function importGame(file){
  if(!file) return;
  if(GAME.started && !confirm("Загрузить этот файл поверх текущей кампании? Текущий прогресс будет сохранён в резервную копию браузера.")) return;
  const reader = new FileReader();
  reader.onerror = () => alert("Не удалось прочитать файл сохранения.");
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      // Validate the entire import before modifying the live game state.
      const state = prepareLoadedState(parsed);
      const current = localStorage.getItem(SAVE_KEY);
      if(current) try { prepareLoadedState(JSON.parse(current)); localStorage.setItem(SAVE_BACKUP_KEY, current); } catch (_) {}
      // Persist the validated import before replacing the in-memory state. A storage
      // quota/security error therefore leaves the active campaign untouched.
      localStorage.setItem(SAVE_KEY, JSON.stringify({format:"wh40k-solo-rpg-save",version:SAVE_VERSION,exportedAt:new Date().toISOString(),state}));
      Object.assign(GAME, state);
      if(typeof normalizeNPCs === "function") normalizeNPCs();
      if(typeof initContinuity === "function") initContinuity({rehydrateFlags:true});
      if(typeof initCampaignDirector === "function") initCampaignDirector();
      if(typeof initCompanions === "function") initCompanions();
      if(typeof syncCompanionsFromFlags === "function") syncCompanionsFromFlags();
      if(typeof initializeExpansionSystems === "function") initializeExpansionSystems();
      if(GAME.meta?.seed) RNG.setSeed(GAME.meta.seed);
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(serializeGame())); } catch(e) { console.warn("[Save] Импорт загружен, но обновлённое автосохранение не записано:", e); }
      renderAll();
      addSystem("АРХИВНАЯ ЗАПИСЬ ВОССТАНОВЛЕНА", "Операция восстановлена из переданного архивного файла.");
      renderAll();
      if(typeof maybeShowTutorial === "function" && !tutorialWasSeen()) setTimeout(() => showTutorial(false), 250);
    } catch(e){
      console.warn("[Save] Импорт отклонён:", e);
      alert(`Файл сохранения повреждён или несовместим. Текущая кампания не заменена.\n${e.message || ""}`);
    }
  };
  reader.readAsText(file);
}

/* ---------- Движение ---------- */
function locationNeighbors(){
  const currentKey = GAME.character && GAME.character.location;
  const current = currentKey && LOCATIONS[currentKey];
  if(!current) return [];
  return Object.entries(LOCATIONS).filter(([key, loc]) =>
    key !== currentKey && Math.abs(loc.x - current.x) + Math.abs(loc.y - current.y) === 1
  ).map(([key, loc]) => ({...loc, key, displayName:loc.name, name:key}));
}

function revealLocation(name){
  if(!Array.isArray(GAME.character.discovered)) GAME.character.discovered=[];
  if(!GAME.character.discovered.includes(name)) GAME.character.discovered.push(name);
  if(GAME.world){
    if(!Array.isArray(GAME.world.discovered)) GAME.world.discovered=[];
    if(!GAME.world.discovered.includes(name)) GAME.world.discovered.push(name);
  }
}

function getLocationGateReason(key){
  const flags=GAME.world?.flags||{};
  const scenario=GAME.campaign?.scenarioId||"";
  const has=id=>typeof hasEvidence==="function" && hasEvidence(id);
  if(key==="Запретная зона" && !(flags.sawOrder117 || flags.workerSeal || flags.deducedHestAuthorization || has("order117") || has("hestSeal"))) return "Вход требует документального основания: найди приказ 117-Г, печать допуска или зафиксируй административную цепочку.";
  if(key==="Старый лифт" && !(flags.liftAccessGranted || flags.crosscheckedDossierAtLift || flags.wh6FoundPassage || has("xiArchive") || ["sealedSector","warpHeart","newHive"].includes(scenario))) return "Старый лифт опечатан. Сначала собери доступ, сверь досье у инфраструктурного узла или продвинься по основной сюжетной линии.";
  if(key==="Запечатанный сектор" && !(flags.sealedSectorAccess || flags.wh6FoundPassage || flags.gateContained || flags.gateAbandoned || flags.acceptedWarpHeart || ["sealedSector","warpHeart","newHive"].includes(scenario))) return "Печати и режим доступа не позволяют пройти без сюжетного разрешения или подтверждённого маршрута.";
  if(key==="Катакомбы" && !(flags.catacombAccessGranted || has("xiArchive") || flags.wh6FoundPassage || ["warpHeart","newHive"].includes(scenario))) return "Вход в катакомбы не нанесён в разрешённые маршруты. Нужна подтверждённая зацепка или доступ из основной истории.";
  return "";
}
function isLocationAccessible(key){ return !getLocationGateReason(key); }
function getLocationGateInfo(){
  return ["Запретная зона","Старый лифт","Запечатанный сектор","Катакомбы"].map(key=>({key,label:LOCATIONS[key]?.name||key,allowed:isLocationAccessible(key),reason:getLocationGateReason(key)}));
}

function moveTo(name){
  const loc = LOCATIONS[name];
  const cur = LOCATIONS[GAME.character.location];
  const currentRegion = typeof getCurrentMapRegion === "function" ? getCurrentMapRegion() : "heldon";
  const validRegionTarget = loc && cur && getLocationRegion(name) === currentRegion && getLocationRegion(GAME.character.location) === currentRegion;
  if(!loc || !cur || !validRegionTarget || (Math.abs(loc.x - cur.x) + Math.abs(loc.y - cur.y) > 1)){
    addSystem("ПЕРЕДВИЖЕНИЕ","Путь туда сейчас недоступен.");
    return;
  }
  if(!isLocationAccessible(name)){
    addSystem("МАРШРУТ ПЕРЕКРЫТ",getLocationGateReason(name));
    return;
  }

  // Закрываем активный диалог при перемещении
  if(GAME.dialogue){
    GAME.dialogue = null;
    addSystem("ДИАЛОГ", "Разговор прерван. Ты уходишь.");
  }

  const from = GAME.character.location;
  GAME.character.location = name;
  GAME.world.current = name;
  revealLocation(name);
  Bus.emit("location_changed", {from, to: name});
  advanceTime(12);
  addSystem(`ЛОКАЦИЯ: ${name}`, loc.desc);
  // Проверка сна при высоком уровне Порчи
  if(typeof triggerDreamIfNeeded === "function" && GAME.character.corruption >= 3){
  if(RNG.chance(0.3)) triggerDreamIfNeeded();
}
  // Триггер побочного квеста: торговец на Рынке
  if (name === "Рынок"
      && !GAME.world.flags.boughtRelic
      && !GAME.world.flags.seizedRelic
      && GAME.mode === "explore"
      && !GAME.dialogue
      && GAME.started
  ) {
    setTimeout(() => {
      if (GAME.campaign && GAME.campaign.active && !GAME.world.flags._relicIntroShown) {
        GAME.world.flags._relicIntroShown = true;
        enterScene("relic_market");
      }
    }, 600);
  }
    // Триггер побочного квеста: долг Лиры
  if (name === "Казармы"
      && GAME.world.flags.lyraCompanion
      && !GAME.world.flags.lyraDebtAccepted
      && !GAME.world.flags.lyraDebtRefused
      && GAME.mode === "explore"
      && !GAME.dialogue
      && GAME.started
      && !GAME.world.flags._lyraDebtIntroShown
  ) {
    setTimeout(() => {
      if (GAME.campaign && GAME.campaign.active) {
        GAME.world.flags._lyraDebtIntroShown = true;
        enterScene("lyra_debt_start");
      }
    }, 600);
  }
}

/* ---------- Главная команда ---------- */
async function handleCommand(raw){
  const text = raw.trim();
  if(!text) return;

  if(GAME._rolling){
    addSystem("ТЕРМИНАЛ","Кубик ещё крутится. Подожди немного.");
    return;
  }

  // Запоминаем последнее действие (кроме slash и повтора)
  if(!text.startsWith("/") && text.toLowerCase() !== "повтор" && !/^\/повтор/.test(text.toLowerCase())){
    GAME._lastCommand = text;
  }

  addPlayer(text);
  Bus.emit("player_action", {text});

  if(text.startsWith("/")) return handleSlash(text.toLowerCase());
  if(text.toLowerCase() === "повтор" || text.toLowerCase() === "ещё раз"){
    if(GAME._lastCommand) return handleCommand(GAME._lastCommand);
    addSystem("ПОВТОР", "Нет предыдущего действия для повтора.");
    renderAll();
    return;
  }

  // Если открыт диалог — обрабатываем как диалоговое действие
if(GAME.dialogue){
  const i = parseIntent(text);
  // Если это попытка заговорить — не начинаем новый диалог
  if(i.verb === "talk" && i.target && i.target !== GAME.dialogue.npcName){
    addSystem("ДИАЛОГ", "Сначала закончи текущий разговор.");
    renderAll();
    return;
  }
  // Иначе — передаём в резолвер, как обычно
}

  const lower = text.toLowerCase();

  if(/инвентар/.test(lower)){ GAME.view="inventory"; GAME._portraitPulse=true; renderAll(); return; }
  if(/^карта$/.test(lower)){ GAME.view="map"; GAME._portraitPulse=true; renderAll(); return; }
  if(/задан/.test(lower)){ GAME.view="quests"; GAME._portraitPulse=true; renderAll(); return; }
  if(/репута/.test(lower)){ GAME.view="reputation"; GAME._portraitPulse=true; renderAll(); return; }

  if(GAME.mode === "combat"){
    if(/атак|стреля|выстрел|бью|ударя|болтер|лазган|пистолет/.test(lower)) return combatAttack();
    if(/защищ|укрыт|оборон/.test(lower)) return combatDefend();
    if(/лекар|медика|аптеч/.test(lower)) return useItem("Медикамент");
    if(/бег|убег|отступ/.test(lower))    return combatFlee();
    if(/изучаю|анализ/.test(lower))      return analyzeEnemy();
    addSystem("БОЙ","Сейчас идёт бой.");
    return;
  }

  const intent = parseIntent(text);

  if(hasRecentAction(intent)){
    addSystem("ПОВТОР", "Ты уже делал это здесь недавно. Ничего нового не появилось.");
    renderAll();
    return;
  }

  const result = resolveIntent(intent);

  if(!result.allowed){
    addSystem("НЕВОЗМОЖНО", result.reason);
    advanceTime(2);
    renderAll();
    return;
  }

  if(result.check){
    const r = checkStat(result.check.stat, result.check.dc, {
      label: result.check.label,
      bonus: result.check.bonus || 0
    });

    await playRoll(r);
    rememberAction(intent);

  // addRoll(formatRoll(r), rollClass(r.result));  // дублирует кубик

    const success = r.result === "success" || r.result === "critical";
    const outcomeText = success
      ? (result.onSuccess ? result.onSuccess() : "")
      : (result.onFail    ? result.onFail()    : "");

    if(outcomeText) addSystem("РЕЗУЛЬТАТ", outcomeText);

    if(!success && result.failEffects)    applyEffects(result.failEffects);
    if(success  && result.successEffects) applyEffects(result.successEffects);

    advanceTime(5);
    if(typeof maybeTriggerCombat === "function") maybeTriggerCombat();
    saveGameSilent();
    renderAll();
    return;
  }

  if(result.outcome){
    const outcomeText = result.outcome();
    if(outcomeText) addSystem("ДЕЙСТВИЕ", outcomeText);
    rememberAction(intent);
    advanceTime(3);
    if(typeof maybeTriggerCombat === "function") maybeTriggerCombat();
    saveGameSilent();
    renderAll();
    return;
  }

  const suggestions = (typeof suggestActions === "function") ? suggestActions(text) : ["осматриваюсь", "/помощь"];
  addSystem("МИР", "Не удалось понять действие.\nПопробуй: " + suggestions.join(" · ") + "\nИли /помощь");
  renderAll();
}

async function handleSlash(cmd){
  const parts = cmd.split(/\s+/);
  switch(parts[0]){
    case "/статы":       GAME.view = "character";   GAME._portraitPulse = true; renderAll(); break;
    case "/инвентарь":   GAME.view = "inventory";   GAME._portraitPulse = true; renderAll(); break;
    case "/карта":       GAME.view = "map";         GAME._portraitPulse = true; renderAll(); break;
    case "/задания":     GAME.view = "quests";      GAME._portraitPulse = true; renderAll(); break;
    case "/репутация":   GAME.view = "reputation";  GAME._portraitPulse = true; renderAll(); break;
    case "/способности": GAME.view = "abilities";   GAME._portraitPulse = true; renderAll(); break;
    case "/журнал":      GAME.view = "journal";     GAME._portraitPulse = true; renderAll(); break;
    case "/осмотреться": await handleCommand("осматриваюсь"); break;
    case "/бросок":      if(typeof rerollLastCheck === "function") rerollLastCheck(); break;
    case "/сохранение":  saveGame(); break;
    case "/загрузить":
      if(loadGame()){ renderAll(); addSystem("ВОССТАНОВЛЕНИЕ АРХИВА","Запись операции восстановлена из локального архива."); renderAll(); }
      else addSystem("ВОССТАНОВЛЕНИЕ АРХИВА","Сохранение не найдено.");
      break;
    case "/помощь": showHelp(); break;
    case "/повтор":
      if(GAME._lastCommand) await handleCommand(GAME._lastCommand);
      else addSystem("ПОВТОР", "Нет предыдущего действия для повтора.");
      break;
    case "/подсказка":
      if(typeof getSceneHint === "function"){
        addSystem("ПОДСКАЗКА", getSceneHint());
      } else {
        addSystem("ПОДСКАЗКА", "Осмотрись, поговори с NPC, проверь терминалы. /помощь — полный список.");
      }
      renderAll();
      break;
    default: addSystem("НЕИЗВЕСТНАЯ КОМАНДА","/помощь — список команд.");
  }
}

function showHelp(){
  addSystem("ПАМЯТКА ИМПЕРСКОЙ СЛУЖБЫ", `Во имя Императора: сей протокол определяет порядок взаимодействия с архивом операции. Все решения принимаются через печати-действия в сценах, тактические панели и карту сектора. Свободный ввод приказов в этой редакции намеренно отключён: исполняются только явно предусмотренные действия.

ПОРЯДОК В СЦЕНАХ:
  Выбирай один из доступных приказов. Проверки характеристик, требования к предметам, последствия и доступность ветвей отображаются в материалах текущей сцены. Закрытый вариант не считается совершённым действием.

СЛУЖБА ВНЕ БОЯ:
  Левая панель содержит личное досье, снаряжение, карту, приказы, расследование, хронику последствий, ведомственные отношения, доктрины, журнал писца и Имперский архив.
  Правая панель показывает состояние оперативника, свиты и уровень Порчи. Молитва доступна вне боя один раз за игровой день; успешная проверка Воли снижает Порчу на единицу. Молитва не является доказательством божественного вмешательства.
  В «Хронике последствий» фиксируются состояние районов, отношение NPC, память о разговорах и доступные формальные допросы. Ответы не повторяются бесконечно: новые выводы требуют новых свидетельств. Показание, гипотеза и подтверждённый факт хранятся раздельно.
  Карта разрешает переход только в доступные соседние локации. Разговоры ведутся через доступные сюжетные варианты и условия текущего досье.

ТАКТИЧЕСКИЙ ПРОТОКОЛ:
  Используй приказы атаки, защиты, выбора цели, смены режима оружия, применения имущества и отступления. Укрытия, тип боеприпаса, профиль противника и доступность способностей влияют на исход. Вражеские тактические сведения раскрываются только после соответствующего анализа.

ГОРЯЧИЕ КЛАВИШИ:
  I — имущество, C — личное досье, M — карта сектора,
  Q — приказы, N — расследование, J — журнал писца, R — ведомственные отношения, H — хроника последствий.

СОХРАНЕНИЕ И АРХИВ:
  Автозапись хранится локально в текущем профиле браузера. «Архивные слоты» предоставляют три отдельные точки восстановления. «Выгрузить архивную копию» создаёт JSON-файл, а импорт проверяет его структуру до замены кампании. Для защиты прежняя корректная запись сохраняется как резерв. Хранилище браузера не заменяет отдельную копию файла.

ЛОКАЛЬНОСТЬ:
  Игра исполняется на этом устройстве; нейросети, игровые сетевые службы и внешние API не требуются. Атмосферный звук использует включённые локальные OGG-петли и синтезированные эффекты; всё отключается в «Параметрах службы». Да пребудет бдительность с теми, кто читает архивы.`);
  renderAll();
}

document.addEventListener("DOMContentLoaded", () => {
  const boot = document.getElementById("bootStart");
  if(boot) boot.onclick = () => { if (typeof initAudio === "function") initAudio(true); if (typeof setSoundContext === "function") setSoundContext("menu"); if (typeof playSound === "function") playSound("terminal_beep"); beginNewCampaignFlow(); };
  if (typeof initSettings === "function") initSettings();

  const importFile = document.getElementById("importFile");
  if(importFile){
    importFile.addEventListener("change", e => {
      const f = e.target.files[0];
      if(f) importGame(f);
      e.target.value = "";
    });
  }
  if (typeof initSounds === "function") initSounds();
  // Единый тихий клик интерфейса; звук не перехватывает действие кнопки.
  document.addEventListener("click", event => {
    const target = event.target;
    const button = target && typeof target.closest === "function" ? target.closest("button") : null;
    if (button && !button.disabled && typeof playSound === "function") playSound("ui");
  }, true);

  bindHotkeys();
  try { auditAll(); } catch(e){ console.warn("[AUDIT] Упал:", e); }

  if(typeof preloadAssets === "function") preloadAssets();
  renderStart();
});
