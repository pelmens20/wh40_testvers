/* ============================================================
   UI / SETTINGS.JS — настройки игры
   ------------------------------------------------------------
   Сохраняются в localStorage. Влияют на звук, визуал, кубик.
   ============================================================ */

const SETTINGS_KEY = "wh40k_settings_v1";
const AUDIO_SETTINGS_MIGRATION_KEY = "wh40k_audio_settings_migrated_v1_1";

const DEFAULT_SETTINGS = {
  soundMaster: true,
  soundMasterVolume: 0.65,
  soundMusic: true,
  soundMusicVolume: 0.18,
  soundEffects: true,
  soundEffectsVolume: 0.42,
  soundDice: true,
  soundCritical: true,
  soundHit: true,
  soundCrit: true,
  soundLevel: true,
  soundCutscene: true,
  soundUI: true,
  soundInMenu: true,
  soundInStory: true,
  soundInCombat: true,
  soundInCutscenes: true,
  muteMusicInCutscenes: false,
  muteMusicInCombat: false,
  visualCrit: true,          // вспышка при крите
  visualDamage: true,        // вспышка при уроне
  visualLevel: true,         // вспышка при повышении уровня
  visualPulse: true          // пульсация кнопок
};

let GAME_SETTINGS = null;

/* ---------- Загрузка ---------- */
function initSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      GAME_SETTINGS = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } else {
      GAME_SETTINGS = { ...DEFAULT_SETTINGS };
    }
    // В предыдущей версии звук был программно отключён и soundMaster=false
    // записывался как дефолт без доступного пользовательского переключателя.
    // Однократно переносим только звуковые параметры на новые значения 1.1,
    // сохраняя визуальные настройки пользователя.
    if (localStorage.getItem(AUDIO_SETTINGS_MIGRATION_KEY) !== "1.1") {
      const audioKeys = ["soundMaster","soundMasterVolume","soundMusic","soundMusicVolume","soundEffects","soundEffectsVolume","soundDice","soundCritical","soundHit","soundCrit","soundLevel","soundCutscene","soundUI","soundInMenu","soundInStory","soundInCombat","soundInCutscenes","muteMusicInCutscenes","muteMusicInCombat"];
      for (const key of audioKeys) GAME_SETTINGS[key] = DEFAULT_SETTINGS[key];
      localStorage.setItem(AUDIO_SETTINGS_MIGRATION_KEY, "1.1");
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(GAME_SETTINGS)); } catch (_) {}
    }
  } catch (e) {
    GAME_SETTINGS = { ...DEFAULT_SETTINGS };
  }
  applySettingsToBody();
  if (typeof updateSoundSettings === "function") updateSoundSettings();
  return GAME_SETTINGS;
}

/* ---------- Сохранение ---------- */
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(GAME_SETTINGS));
  } catch (e) {
    console.warn("[Settings] Не удалось сохранить:", e);
  }
  applySettingsToBody();
  if (typeof updateSoundSettings === "function") updateSoundSettings();
}

/* ---------- Получить настройку ---------- */
function getSetting(key) {
  if (!GAME_SETTINGS) initSettings();
  return GAME_SETTINGS[key];
}

/* ---------- Установить настройку ---------- */
function setSetting(key, value) {
  if (!GAME_SETTINGS) initSettings();
  GAME_SETTINGS[key] = value;
  saveSettings();
}

/* ---------- Переключить ---------- */
function toggleSetting(key) {
  if (!GAME_SETTINGS) initSettings();
  GAME_SETTINGS[key] = !GAME_SETTINGS[key];
  saveSettings();
  renderAll();
}

/* ---------- Применить к body ---------- */
function applySettingsToBody() {
  if (typeof document === "undefined" || !document.body) return;
  document.body.classList.toggle("no-visual-pulse", !getSetting("visualPulse"));
}

/* ---------- Проверка: звук намеренно отключён ---------- */
function shouldPlaySound() { return !!getSetting("soundMaster") && !!getSetting("soundEffects"); }

/* ============================================================
   РЕНДЕР ВКЛАДКИ НАСТРОЕК
   ============================================================ */
function renderSettings() {
  if (!GAME_SETTINGS) initSettings();

  const s = GAME_SETTINGS;

  const toggleRow = (label, desc, key) => `
    <div class="settings-row">
      <div class="settings-label">
        <b>${esc(label)}</b>
        <small>${esc(desc)}</small>
      </div>
      <button class="settings-toggle ${s[key] ? "on" : "off"}" data-setting="${esc(key)}">
        ${s[key] ? "ВКЛ" : "ВЫКЛ"}
      </button>
    </div>
  `;

  const rangeRow = (label, desc, key, step="0.01") => `
    <div class="settings-row audio-range-row">
      <div class="settings-label"><b>${esc(label)}</b><small>${esc(desc)}</small></div>
      <div class="audio-range-control"><input type="range" min="0" max="1" step="${step}" value="${Number(s[key] ?? 0)}" data-audio-range="${esc(key)}" aria-label="${esc(label)}"><output data-audio-value="${esc(key)}">${Math.round(Number(s[key] ?? 0)*100)}%</output></div>
    </div>`;

  return `
    <section class="panel">
      <div class="panel-head">
        <span>ПАРАМЕТРЫ СЛУЖБЫ</span>
        <span>ЗАПИСЬ ПАРАМЕТРОВ АВТОМАТИЧЕСКАЯ</span>
      </div>
      <div class="panel-body">

        <div class="settings-hint">Звуковое сопровождение синтезируется локально средствами браузера: индустриальный гул, сигналы терминалов и короткие боевые акценты. Подключение к сети и внешние аудиофайлы не требуются. Звук активируется после первого действия оператора.</div>

        <div class="section-title">АУДИОКАНАЛЫ АРХИВА</div>
        ${toggleRow("Общий звук", "Мгновенно отключить музыку и эффекты", "soundMaster")}
        ${rangeRow("Общая громкость", "Уровень всех звуков", "soundMasterVolume")}
        ${toggleRow("Фоновая музыка", "Низкий индустриальный эмбиент", "soundMusic")}
        ${rangeRow("Громкость музыки", "Отдельная громкость фонового эмбиента", "soundMusicVolume")}
        ${toggleRow("Звуковые эффекты", "Кнопки, терминалы, бой и события", "soundEffects")}
        ${rangeRow("Громкость эффектов", "Отдельная громкость коротких звуков", "soundEffectsVolume")}
        ${toggleRow("Кубик и проверки", "Звук броска и критического результата", "soundDice")}
        ${toggleRow("Критические события", "Отдельный акцент на критическом успехе/провале", "soundCritical")}
        ${toggleRow("Интерфейс", "Короткие звуки кнопок и терминалов", "soundUI")}
        ${toggleRow("Катсцены", "Печатная машинка и сигналы заставок", "soundCutscene")}
        ${toggleRow("Звук в главном меню", "Можно отключить отдельно от игры", "soundInMenu")}
        ${toggleRow("Звук в сюжетных сценах", "Диалоги, улики и переходы", "soundInStory")}
        ${toggleRow("Звук в бою", "Боевые акценты", "soundInCombat")}
        ${toggleRow("Звук в катсценах", "Отдельный переключатель заставок", "soundInCutscenes")}
        ${toggleRow("Приглушать музыку в катсценах", "Эмбиент затихает на время заставки", "muteMusicInCutscenes")}
        ${toggleRow("Приглушать музыку в бою", "Эмбиент затихает во время боя", "muteMusicInCombat")}


        <div class="section-title">ВИЗУАЛЬНЫЕ ПРОТОКОЛЫ</div>
        ${toggleRow("Вспышка при крите", "Золотая вспышка экрана при d20 = 20", "visualCrit")}
        ${toggleRow("Вспышка при уроне", "Красная вспышка экрана при получении урона", "visualDamage")}
        ${toggleRow("Вспышка при уровне", "Золотая вспышка при повышении уровня", "visualLevel")}
        ${toggleRow("Пульсация кнопок", "Мягкая пульсация важных кнопок", "visualPulse")}

        <div class="section-title">ВОЗВРАТ К УСТАНОВКАМ ПО УМОЛЧАНИЮ</div>
        <div class="settings-row">
          <div class="settings-label">
            <b>Сбросить параметры службы</b>
            <small>Восстановить исходные параметры интерфейса</small>
          </div>
          <button class="danger-btn" data-setting-reset>
            ВОЗВРАТ К УСТАНОВКАМ ПО УМОЛЧАНИЮИТЬ
          </button>
        </div>

      </div>
    </section>
  `;
}
