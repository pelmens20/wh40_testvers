/* ============================================================
   SAVE SLOTS — архивные копии оперативной кампании
   Локальное хранилище, без сетевых служб и внешних библиотек.
   ============================================================ */
const SAVE_SLOT_COUNT = 3;
const SAVE_SLOT_PREFIX = "wh40k_solo_rpg_manual_slot_v1_";
const SAVE_SLOT_BACKUP_PREFIX = "wh40k_solo_rpg_manual_slot_backup_v1_";
let saveSlotsKeyHandler = null;
let saveSlotsOpener = null;

function closeSaveSlotsModal(restoreFocus = true){
  if(saveSlotsKeyHandler){ document.removeEventListener("keydown", saveSlotsKeyHandler); saveSlotsKeyHandler = null; }
  const root = document.getElementById("modalRoot");
  if(root) root.innerHTML = "";
  if(restoreFocus && saveSlotsOpener && typeof saveSlotsOpener.focus === "function" && document.contains(saveSlotsOpener)) saveSlotsOpener.focus();
  saveSlotsOpener = null;
}

function saveSlotKey(index){
  const n = Number(index);
  if(!Number.isInteger(n) || n < 1 || n > SAVE_SLOT_COUNT) throw new Error("Недопустимый номер архивного слота.");
  return SAVE_SLOT_PREFIX + n;
}
function saveSlotBackupKey(index){
  const n = Number(index);
  if(!Number.isInteger(n) || n < 1 || n > SAVE_SLOT_COUNT) throw new Error("Недопустимый номер архивного слота.");
  return SAVE_SLOT_BACKUP_PREFIX + n;
}
function inspectSaveSlot(index){
  const key = saveSlotKey(index);
  let raw = null, backupRaw = null;
  try {
    raw = localStorage.getItem(key);
    backupRaw = localStorage.getItem(saveSlotBackupKey(index));
  } catch(error){ return {index:Number(index),exists:false,corrupt:true,error:"Хранилище браузера недоступно."}; }

  const parseCandidate = candidate => {
    if(!candidate) return null;
    try {
      const parsed = JSON.parse(candidate);
      // Validate payload with the same normalizer used by the actual load path.
      if(typeof prepareLoadedState === "function") prepareLoadedState(parsed);
      const state = parsed?.state && typeof parsed.state === "object" ? parsed.state : parsed;
      const character = state?.character && typeof state.character === "object" ? state.character : {};
      return {
        raw:candidate,
        name: typeof character.name === "string" && character.name.trim() ? character.name.trim().slice(0,80) : "Безымянный агент",
        className: typeof character.className === "string" ? character.className.slice(0,80) : (typeof character.classId === "string" ? character.classId : "Класс не определён"),
        level: Number.isFinite(character.level) ? Math.max(1,Math.floor(character.level)) : 1,
        scenarioId: String(state?.campaign?.scenarioId || "не определена").slice(0,80),
        date: parsed?.exportedAt || state?.meta?.lastSavedAt || null,
        version: Number.isFinite(parsed?.version) ? parsed.version : null
      };
    } catch(error){ return null; }
  };

  const primary = parseCandidate(raw);
  if(primary) return {index:Number(index),exists:true,corrupt:false,recoverable:false,source:"primary",...primary};
  const backup = parseCandidate(backupRaw);
  if(backup) return {index:Number(index),exists:true,corrupt:true,recoverable:true,source:"backup",error:"Основная запись повреждена; доступна проверенная резервная копия.",...backup};
  if(raw || backupRaw) return {index:Number(index),exists:true,corrupt:true,recoverable:false,error:"Основной архив и резерв не прошли проверку целостности."};
  return {index:Number(index),exists:false,corrupt:false,recoverable:false};
}
function formatSaveSlotDate(value){
  if(!value) return "дата не записана";
  const d = new Date(value);
  if(!Number.isFinite(d.getTime())) return "дата неизвестна";
  try { return d.toLocaleString("ru-RU", {dateStyle:"medium",timeStyle:"short"}); }
  catch(_) { return d.toISOString().slice(0,16).replace("T"," "); }
}
function getSlotModalRoot(){
  let root = document.getElementById("modalRoot");
  if(!root){
    root = document.createElement("div");
    root.id = "modalRoot";
    (document.getElementById("app") || document.body).appendChild(root);
  }
  return root;
}
function openSaveSlotsModal(message = ""){
  if(saveSlotsKeyHandler){ document.removeEventListener("keydown", saveSlotsKeyHandler); saveSlotsKeyHandler = null; }
  const root = getSlotModalRoot();
  if(!root.querySelector(".save-slots-modal")) saveSlotsOpener = document.activeElement;
  const slots = Array.from({length:SAVE_SLOT_COUNT}, (_,i) => inspectSaveSlot(i+1));
  root.innerHTML = `
    <div class="modal-backdrop open save-slots-backdrop" role="dialog" aria-modal="true" aria-labelledby="saveSlotsTitle">
      <section class="modal modal-wide save-slots-modal">
        <header class="modal-head">
          <div>
            <div class="modal-title" id="saveSlotsTitle">АРХИВ ОПЕРАТИВНЫХ КАМПАНИЙ</div>
            <div class="modal-subtitle">ТРИ ПЕЧАТИ СОХРАНЕНИЯ · ЛОКАЛЬНЫЙ АРХИВ · БЕЗ СЕТЕВОГО ДОСТУПА</div>
          </div>
          <button class="secondary-btn" type="button" data-slots-close aria-label="Закрыть архив">ЗАКРЫТЬ</button>
        </header>
        <div class="modal-body">
          ${message ? `<div class="save-slot-message" role="status">${esc(message)}</div>` : ""}
          <p class="save-slots-warning">Каждая печать закрепляет отдельную точку кампании. Восстановление заменит состояние текущей операции только после подтверждения. Основная автозапись и её резерв хранятся отдельно.</p>
          <div class="save-slots-grid">
            ${slots.map(slot => `
              <article class="save-slot-card ${slot.corrupt ? "save-slot-corrupt" : slot.exists ? "save-slot-filled" : "save-slot-empty"}">
                <div class="save-slot-head"><span class="save-slot-index">АРХИВ № ${String(slot.index).padStart(2,"0")}</span><span class="save-slot-seal">${slot.recoverable ? "↺" : slot.corrupt ? "⚠" : slot.exists ? "✠" : "○"}</span></div>
                ${slot.recoverable ? `
                  <h3>РЕЗЕРВНЫЙ АРХИВ ДОСТУПЕН</h3>
                  <p class="save-slot-class">${esc(slot.name)} · ${esc(slot.className)} · УРОВЕНЬ ${slot.level}</p>
                  <p class="save-slot-chapter">Операция: ${esc(slot.scenarioId)}</p>
                  <p class="save-slot-date">${esc(slot.error)} Последняя проверенная запись: ${esc(formatSaveSlotDate(slot.date))}</p>
                ` : slot.exists && !slot.corrupt ? `
                  <h3>${esc(slot.name)}</h3>
                  <p class="save-slot-class">${esc(slot.className)} · УРОВЕНЬ ${slot.level}</p>
                  <p class="save-slot-chapter">Операция: ${esc(slot.scenarioId)}</p>
                  <p class="save-slot-date">${esc(formatSaveSlotDate(slot.date))}</p>
                ` : slot.corrupt ? `
                  <h3>НАРУШЕНА ЦЕЛОСТНОСТЬ</h3><p class="save-slot-class">${esc(slot.error || "Архив не прошёл первичную проверку.")}</p><p class="save-slot-date">Загрузка отклонена до восстановления целостности.</p>
                ` : `
                  <h3>ПЕЧАТЬ НЕ ЗАДЕЙСТВОВАНА</h3><p class="save-slot-class">Здесь можно закрепить отдельный рубеж кампании.</p><p class="save-slot-date">Архивная запись отсутствует.</p>
                `}
                <div class="save-slot-actions">
                  <button class="danger-btn" type="button" data-slot-save="${slot.index}">${slot.exists ? "ПЕРЕЗАПИСАТЬ" : "ЗАКРЕПИТЬ РУБЕЖ"}</button>
                  <button class="secondary-btn" type="button" data-slot-load="${slot.index}" ${!slot.exists || (slot.corrupt && !slot.recoverable) ? "disabled" : ""}>ВОССТАНОВИТЬ РУБЕЖ</button>
                  <button class="secondary-btn" type="button" data-slot-delete="${slot.index}" ${!slot.exists ? "disabled" : ""}>УДАЛИТЬ АРХИВ</button>
                </div>
              </article>
            `).join("")}
          </div>
          <p class="footer-note">Для переноса между браузерами используй «Выгрузить архивную копию» и «Импортировать архив». Ручные слоты привязаны к этому браузерному профилю.</p>
        </div>
      </section>
    </div>`;

  root.querySelectorAll("[data-slots-close]").forEach(button => button.onclick = () => closeSaveSlotsModal());
  const backdrop = root.querySelector(".save-slots-backdrop");
  if(backdrop) backdrop.addEventListener("click", event => { if(event.target === backdrop) closeSaveSlotsModal(); });
  saveSlotsKeyHandler = event => { if(event.key === "Escape"){ event.preventDefault(); closeSaveSlotsModal(); } };
  document.addEventListener("keydown", saveSlotsKeyHandler);
  root.querySelectorAll("[data-slot-save]").forEach(button => button.onclick = () => {
    const index = Number(button.dataset.slotSave);
    const existing = inspectSaveSlot(index);
    if(!GAME?.started || !GAME?.character){
      showSaveSlotMessage("Нет активной кампании. Сначала начни или восстанови операцию.");
      return;
    }
    if(existing.exists && typeof confirm === "function" && !confirm(`Перезаписать архив № ${index}? Предыдущая запись этого слота останется в локальном резерве, если она была корректна.`)) return;
    try {
      const payload = JSON.stringify(serializeGame());
      // Validate the exact serialized payload before touching the target slot.
      prepareLoadedState(JSON.parse(payload));
      const key = saveSlotKey(index);
      const previous = localStorage.getItem(key);
      if(previous){
        try {
          prepareLoadedState(JSON.parse(previous));
          localStorage.setItem(saveSlotBackupKey(index), previous);
        } catch(_) { /* Never rotate an invalid target into the backup. */ }
      }
      localStorage.setItem(key, payload);
      if(typeof addSystem === "function") addSystem("АРХИВНАЯ ЗАПИСЬ ЗАВЕРШЕНА", `Состояние операции закреплено в ручном слоте № ${index}.`);
      saveGameSilent();
      openSaveSlotsModal(`Архив № ${index}: запись подтверждена.`);
    } catch(error){
      console.warn("[SaveSlots] Не удалось записать слот:", error);
      showSaveSlotMessage(`Запись отклонена. Активная кампания не изменена. ${error?.message || "Хранилище недоступно."}`);
    }
  });
  root.querySelectorAll("[data-slot-load]").forEach(button => button.onclick = () => {
    const index = Number(button.dataset.slotLoad);
    const slot = inspectSaveSlot(index);
    if(!slot.exists || (slot.corrupt && !slot.recoverable)) { showSaveSlotMessage("Этот архив нельзя восстановить: запись отсутствует или повреждена."); return; }
    if(GAME?.started && typeof confirm === "function" && !confirm(`Восстановить архив № ${index}? Несохранённые изменения текущей операции в активной памяти будут заменены.`)) return;
    try {
      const state = prepareLoadedState(JSON.parse(slot.raw));
      const current = localStorage.getItem(SAVE_KEY);
      if(current){
        try { prepareLoadedState(JSON.parse(current)); localStorage.setItem(SAVE_BACKUP_KEY, current); }
        catch(_) { /* Keep a damaged main slot out of the known-good backup. */ }
      }
      Object.assign(GAME, state);
      // Repair the slot's primary record from the validated payload, including when
      // the payload had to be read from that slot's backup.
      try { localStorage.setItem(saveSlotKey(index), JSON.stringify(serializeGame())); }
      catch(error) { console.warn("[SaveSlots] Кампания восстановлена, но слот не удалось переписать:", error); }
      if(typeof normalizeNPCs === "function") normalizeNPCs();
      if(typeof initContinuity === "function") initContinuity({rehydrateFlags:true});
      if(typeof initCompanions === "function") initCompanions();
      if(typeof syncCompanionsFromFlags === "function") syncCompanionsFromFlags();
      if(typeof initializeExpansionSystems === "function") initializeExpansionSystems();
      if(GAME.meta?.seed && typeof RNG !== "undefined") RNG.setSeed(GAME.meta.seed);
      closeSaveSlotsModal(false);
      if(typeof addSystem === "function") addSystem("АРХИВ ВОССТАНОВЛЕН", `Операция восстановлена из ручного слота № ${index}.`);
      saveGameSilent();
      if(typeof renderAll === "function") renderAll();
    } catch(error){
      console.warn("[SaveSlots] Восстановление отклонено:", error);
      showSaveSlotMessage(`Архив не восстановлен. Активное состояние не заменено. ${error?.message || "Проверка не пройдена."}`);
    }
  });
  root.querySelectorAll("[data-slot-delete]").forEach(button => button.onclick = () => {
    const index = Number(button.dataset.slotDelete);
    if(typeof confirm === "function" && !confirm(`Удалить ручной архив № ${index} и его резерв? Это действие нельзя отменить.`)) return;
    try {
      localStorage.removeItem(saveSlotKey(index));
      localStorage.removeItem(saveSlotBackupKey(index));
      openSaveSlotsModal(`Архив № ${index} и его резервная копия удалены.`);
    } catch(error){ showSaveSlotMessage(`Не удалось удалить архив: ${error?.message || "хранилище недоступно"}`); }
  });
  const dialog = root.querySelector(".save-slots-modal");
  if(dialog && typeof dialog.focus === "function") dialog.focus();
}
function showSaveSlotMessage(message){
  const root = getSlotModalRoot();
  const previous = root.querySelector(".save-slots-backdrop") ? root.querySelector(".save-slots-modal") : null;
  if(previous) openSaveSlotsModal(message);
  else openSaveSlotsModal(message);
}
