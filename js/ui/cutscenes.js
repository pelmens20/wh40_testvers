/* ============================================================
   UI / CUTSCENES.JS — катсцены перед главами v2
   ------------------------------------------------------------
   Typewriter посимвольно, кнопка «Пропустить», прогресс-бар,
   разные фоны/символы/звуки для глав.
   ============================================================ */

const CHAPTER_CUTSCENES = {
    priceOfEvidence: { title:"ГЛАВА XI", subtitle:"ЦЕНА ДОКАЗАТЕЛЬСТВ", symbol:"⚖", bg:"judgment", sound:"hum_judgment", lines:["Досье пережило первый кризис.","Теперь за него борются ведомства.","Доказательство не становится истиной только потому, что его передали сильному человеку.","Тебе предстоит решить, кто получит доступ к материалам."] },
  rightToMemory: { title:"ГЛАВА XII", subtitle:"ПРАВО НА ПАМЯТЬ", symbol:"⚙", bg:"archive", sound:"hum_catacombs", lines:["Журналы можно сохранить.","Их смысл ещё предстоит установить.","Стирание данных уничтожит возможность перепроверки.","Но раскрытие имён тоже имеет цену."] },
  lastTransport: { title:"ГЛАВА XIII", subtitle:"ПОСЛЕДНИЙ ТРАНСПОРТ", symbol:"✦", bg:"docks", sound:"hum_docks", lines:["Транспорт ждёт.","Мест не хватит на всё.","Каждая задержка несёт риск.","Выбери приоритет и не скрывай его цену."] },
  beyondHive: { title:"ГЛАВА XIV", subtitle:"СЛЕД ЗА ПРЕДЕЛАМИ УЛЬЯ", symbol:"☠", bg:"smog", sound:"hum_warp", lines:["След ведёт за пределы привычных районов.","Новая локация — часть авторской кампании.","Ни один знак сам по себе не доказывает ксеновмешательство.","Сначала — факты."] },
  verdictNameless: { title:"ГЛАВА XV", subtitle:"ВЕРДИКТ БЕЗ ИМЕНИ", symbol:"✠", bg:"judgment", sound:"hum_judgment", lines:["Досье собрано.","Вопросы остались.","Ты можешь вынести осторожный вердикт, но не можешь превратить неизвестное в доказанный факт.","Последнее решение определит, что останется после расследования."] },
  class_inquisitor: {
    title: "ИНКВИЗИЦИЯ",
    subtitle: "ОРДО ХЕРЕТИКУС",
    symbol: "⚖",
    bg: "inquisitor",
    sound: "hum_docks",
    lines: [
      "Ты — Инквизитор Ордо Херетикус.",
      "Твоя розетта даёт огромные полномочия, но ошибка Инквизитора тоже имеет цену.",
      "В этом улье есть тревожные признаки, но подозрение ещё не доказательство. ",
      "Твоя задача — сопоставить свидетельства и отделить факт от домысла.",
      "Начинай."
    ]
  },
  class_guardsman: {
    title: "АСТРА МИЛИТАРУМ",
    subtitle: "СОЛДАТ ИМПЕРИУМА",
    symbol: "✦",
    bg: "guardsman",
    sound: "hum_catacombs",
    lines: [
      "Ты — гвардеец Астра Милитарум.",
      "Один из бесчисленных солдат Империума. Твой полк и прошлое зависят от выбранной предыстории.",
      "Но это задание — не обычное.",
      "Приказ неполон, а сведения противоречивы.",
      "Теперь — твой черёд выяснить, что произошло."
    ]
  },
  class_spaceMarine: {
    title: "КАРАУЛ СМЕРТИ",
    subtitle: "СЕРАЯ КЛЯТВА",
    symbol: "☠",
    bg: "marine",
    sound: "hum_warp",
    lines: [
      "Ты — Адептус Астартес. Караул Смерти.",
      "Ты — генетически усиленный ветеран, но не неуязвим; подготовка и товарищи по-прежнему важны.",
      "Ордо Ксенос направило тебя как специалиста по ксеноугрозам.",
      "Но источник происходящего пока не установлен.",
      "Сначала отличи подтверждённую угрозу от подозрения."
    ]
  },
  silentForge: {
    title: "ГЛАВА I",
    subtitle: "ТИШИНА В IX СЕКТОРЕ",
    symbol: "✠",
    bg: "smog",
    sound: "hum_docks",
    lines: [
      "Улей Хелдон-Прайм.",
      "Сорок первый день после последнего корабля.",
      "Одиннадцать дней назад промышленный сектор IX перестал выходить на связь.",
      "Официальная версия — авария.",
      "Но журналы противоречат друг другу; причина пока не установлена."
    ]
  },
  sealedSector: {
    title: "ГЛАВА II",
    subtitle: "ЗАПЕЧАТАННЫЙ СЕКТОР",
    symbol: "☠",
    bg: "catacombs",
    sound: "hum_catacombs",
    lines: [
      "Под ульем — то, что не должно было открыться.",
      "В старом деле указано, что сектор закрыли сто двадцать лет назад.",
      "В записи числятся двадцать погибших инквизиторов; происхождение документа ещё предстоит проверить.",
      "Теперь появились новые несоответствия.",
      "Ты спускаешься, не зная всей картины."
    ]
  },
  warpHeart: {
    title: "ГЛАВА III",
    subtitle: "СЕРДЦЕ ВАРПА",
    symbol: "👁",
    bg: "warp",
    sound: "hum_warp",
    lines: [
      "Врата открыты.",
      "Голоса зовут, но их источник нельзя проверить по одному лишь восприятию.",
      "Последний след Кралла ведёт сюда.",
      "Некоторые записи называют Тзинча; это имя пока не подтверждает источник голосов.",
      "Решение остаётся за тобой: действовать, сдерживать угрозу или отступить."
    ]
  },
  ordoJudgment: {
    title: "ГЛАВА IV",
    subtitle: "СУД ОРДО",
    symbol: "⚖",
    bg: "judgment",
    sound: "hum_judgment",
    lines: [
      "Инквизиция хочет знать.",
      "Что ты видел.",
      "Что ты сделал.",
      "Что ты скрыл.",
      "Ответ будет дан. Но не тот, что ты ждёшь."
    ]
  },
  afterJudgment: {
    title: "ГЛАВА V",
    subtitle: "ПОСЛЕ СУДА",
    symbol: "⚜",
    bg: "gray",
    sound: "hum_gray",
    lines: [
      "Суд окончен.",
      "Решение принято на основании доступных материалов.",
      "Его цена станет ясна не сразу.",
      "Некоторые вопросы остаются без ответа.",
      "Это не конец. Это — пауза."
    ]
  },
  newHive: {
    title: "ГЛАВА VI",
    subtitle: "НОВЫЙ УЛЕЙ",
    symbol: "?",
    bg: "new_hive",
    sound: "hum_new_hive",
    lines: [
      "Улей Лорес-Секундус. Субсектор Гелдон.",
      "В отчётах числятся двести пропавших; полный список ещё требует сверки.",
      "На нескольких поверхностях повторяются одиннадцать отметок.",
      "Их сходство — зацепка для расследования, но не объяснение."
    ]
  },
  ashProtocol: {
    title: "ГЛАВА VII",
    subtitle: "ПРОТОКОЛ ПЕПЛА",
    symbol: "⌘",
    bg: "archive",
    sound: "hum_catacombs",
    lens: "archive",
    lines: [
      "Три источника говорят о разных сторонах одного события.",
      "Контрольная сумма подтверждает несоответствие, но не называет виновного.",
      "Свидетельства требуют независимой проверки.",
      "Сохрани происхождение каждого документа — и границы того, что он доказывает."
    ]
  },
  resonanceArchive: {
    title: "ГЛАВА VIII",
    subtitle: "АРХИВ БЕЗ ИМЕНИ",
    symbol: "§",
    bg: "archive",
    sound: "hum_judgment",
    lens: "archive",
    lines: [
      "Повреждённый пакет пережил передачу.",
      "Заголовок не совпадает с содержимым; источник сигнала не указан.",
      "Повторяющиеся маркеры — повод продолжить сверку, а не готовый ответ.",
      "Зафиксируй то, что известно. Не заполняй пробелы догадкой."
    ]
  },
  witnessLedger: {
    title: "ГЛАВА IX — РЕЕСТР СВИДЕТЕЛЕЙ",
    subtitle: "Факты отдельно от выводов",
    symbol: "§",
    bg: "archive",
    lines: ["Архив сохранён, но его происхождение ещё проверяется.", "Свидетельства и журналы расходятся в нескольких точках.", "Ни один отчёт пока не называет источник сигнала."]
  },
  silentRoute: {
    title: "ГЛАВА X — НЕМОЙ МАРШРУТ",
    subtitle: "Независимая проверка",
    symbol: "⌁",
    bg: "node",
    lines: ["Резервный пакет обнаружен на местном служебном ретрансляторе.", "Совпадение данных подтверждает копирование, а не личность отправителя.", "Следующий приказ определит, какие сведения будут сохранены."]
  }
};

/* ---------- Классовая перспектива катсцен ---------- */
const CUTSCENE_CLASS_PERSPECTIVES = {
  inquisitor: {
    label: "ВЗГЛЯД ИНКВИЗИЦИИ", symbol: "⚖", theme: "inquisitor",
    lenses: {
      archive: "Ты оцениваешь цепочку хранения документов: кто имел доступ, что подтверждено и где остаются пробелы.",
      judgment: "Полномочия позволяют требовать ответы, но не превращают предположение в доказательство.",
      combat: "Сначала установи угрозу и цену ошибки; приказ о зачистке не заменяет анализа обстановки.",
      warp: "Варп искажает восприятие. Ни голос, ни видение сами по себе не устанавливают источник.",
      transit: "Маршрут, полномочия и последствия для свидетелей должны быть зафиксированы раздельно.",
      general: "Ты ищешь проверяемую связь между фактами, а не удобную версию событий."
    }
  },
  guardsman: {
    label: "ВЗГЛЯД ГВАРДЕЙЦА", symbol: "✦", theme: "guardsman",
    lenses: {
      archive: "Ты думаешь о людях за сухими строками отчёта и о том, кто отвечал за смену и снабжение.",
      judgment: "Приказ может быть законным и всё же неполным. Ты помнишь, кто понесёт последствия на земле.",
      combat: "Укрытие, боеприпасы, сектор огня и путь отхода важнее красивого доклада.",
      warp: "Страх не доказывает природу угрозы. Ты держишься за наблюдаемое и проверяешь товарищей.",
      transit: "Места, время и возможность эвакуации ограничены. Любой приоритет должен иметь ясную цену.",
      general: "Ты сверяешь приказ с тем, что реально видел на месте, и помнишь цену ошибки для обычных людей."
    }
  },
  spaceMarine: {
    label: "ВЗГЛЯД КАРАУЛА СМЕРТИ", symbol: "☠", theme: "marine",
    lenses: {
      archive: "Ты ищешь несоответствия в последовательности событий, но техническая аномалия ещё не указывает на ксеносов.",
      judgment: "Отчёт должен разделять подтверждённую угрозу, вероятную угрозу и неизвестное.",
      combat: "Ты оцениваешь линии огня, угрозы группе и возможность удержать цель живой для допроса.",
      warp: "Не смешивай признаки Варпа с ксеноугрозой без подтверждения: это разные категории риска.",
      transit: "Ты рассчитываешь маршрут и защиту сопровождаемых, не теряя из виду задачу операции.",
      general: "Ты проверяешь тактическую картину и природу угрозы, не объявляя её ксеносской без оснований."
    }
  }
};

function getCutsceneLensKey(chapterId, cutscene) {
  if (cutscene && cutscene.lens) return cutscene.lens;
  if (/archive|Ledger|Memory|witness/i.test(chapterId)) return "archive";
  if (/Judgment|verdict|Evidence|ordo/i.test(chapterId)) return "judgment";
  if (/warp|Heart|sealedSector|beyondHive/i.test(chapterId)) return "warp";
  if (/Transport|silentRoute|docks/i.test(chapterId)) return "transit";
  if (/combat|battle/i.test(chapterId)) return "combat";
  return "general";
}

/* Pure presentation builder: also used by automated tests. */
function buildCutscenePresentation(chapterId, classId) {
  const base = CHAPTER_CUTSCENES[chapterId];
  if (!base) return null;
  const result = {...base, lines: Array.isArray(base.lines) ? base.lines.slice() : []};
  const role = CUTSCENE_CLASS_PERSPECTIVES[classId];
  result.classId = CUTSCENE_CLASS_PERSPECTIVES[classId] ? classId : "inquisitor";
  result.roleLabel = role ? role.label : "ЗАПИСЬ ОПЕРАЦИИ";
  result.roleSymbol = role ? role.symbol : base.symbol;
  result.roleTheme = role ? role.theme : "inquisitor";
  result.lensText = "";
  // Class-introduction cutscenes are already fully written for their class.
  // Other chapter cutscenes receive a short subjective lens, never a new canon fact.
  if (!String(chapterId).startsWith("class_") && role) {
    const lensKey = getCutsceneLensKey(chapterId, base);
    result.lensText = role.lenses[lensKey] || role.lenses.general;
  }
  return result;
}

/* ---------- Показать катсцену ---------- */
let activeCutsceneCleanup = null;
function playChapterCutscene(chapterId) {
  if (typeof setSoundContext === "function") setSoundContext("cutscene");
  return new Promise((resolve) => {
    const classId = typeof GAME !== "undefined" && GAME.character ? GAME.character.classId : "inquisitor";
    const cutscene = buildCutscenePresentation(chapterId, classId);
    if (!cutscene) {
      if (typeof setSoundContext === "function") setSoundContext("story");
      resolve();
      return;
    }

    // Replacing an active cutscene must settle its promise and release all timers/listeners.
    if (typeof activeCutsceneCleanup === "function") activeCutsceneCleanup("replaced");
    if (typeof playSound === "function") {
      playSound("terminal_beep");
      playSound(cutscene.sound || "chapter_hum");
    }

    const existing = document.getElementById("chapterCutscene");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    const overlay = document.createElement("div");
    overlay.id = "chapterCutscene";
    overlay.className = `chapter-cutscene cutscene-bg-${cutscene.bg} cutscene-role-${cutscene.roleTheme}`;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", `${cutscene.title}: ${cutscene.subtitle}`);
    overlay.tabIndex = -1;

    const symbol = document.createElement("div");
    symbol.className = "cutscene-symbol";
    symbol.textContent = cutscene.symbol;
    symbol.setAttribute("aria-hidden", "true");

    const title = document.createElement("div");
    title.className = "cutscene-title";
    title.textContent = cutscene.title;

    const subtitle = document.createElement("div");
    subtitle.className = "cutscene-subtitle";
    subtitle.textContent = cutscene.subtitle;

    const roleStamp = document.createElement("div");
    roleStamp.className = "cutscene-role-stamp";
    roleStamp.textContent = `${cutscene.roleSymbol}  ${cutscene.roleLabel}`;

    const divider = document.createElement("div");
    divider.className = "cutscene-divider";

    const linesContainer = document.createElement("div");
    linesContainer.className = "cutscene-lines";
    if (cutscene.lensText) {
      const lens = document.createElement("div");
      lens.className = "cutscene-class-lens";
      const lensLabel = document.createElement("span");
      lensLabel.className = "cutscene-class-lens-label";
      lensLabel.textContent = "ТАКТИЧЕСКАЯ / СЛУЖЕБНАЯ ОЦЕНКА";
      const lensBody = document.createElement("p");
      lensBody.textContent = cutscene.lensText;
      lens.appendChild(lensLabel);
      lens.appendChild(lensBody);
      linesContainer.appendChild(lens);
    }

    const skipBtn = document.createElement("button");
    skipBtn.className = "cutscene-skip";
    skipBtn.type = "button";
    skipBtn.textContent = "ПРОПУСТИТЬ ▸▸";
    skipBtn.setAttribute("aria-label", "Пропустить катсцену");

    const progressBar = document.createElement("div");
    progressBar.className = "cutscene-progress";
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-label", "Прогресс катсцены");
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    progressBar.setAttribute("aria-valuenow", "0");
    const progressFill = document.createElement("div");
    progressFill.className = "cutscene-progress-fill";
    progressBar.appendChild(progressFill);

    overlay.appendChild(symbol);
    overlay.appendChild(title);
    overlay.appendChild(subtitle);
    overlay.appendChild(roleStamp);
    overlay.appendChild(divider);
    overlay.appendChild(linesContainer);
    overlay.appendChild(skipBtn);
    overlay.appendChild(progressBar);
    document.body.appendChild(overlay);

    let settled = false;
    let cancelled = false;
    let keyHandler = null;
    const timers = [];
    const startTime = Date.now();
    let progressInterval = null;
    const reducedMotion = !!(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const typeSpeed = reducedMotion ? 0 : 26;
    const lineGap = reducedMotion ? 80 : 350;
    const fadeDuration = reducedMotion ? 0 : 260;
    const lines = cutscene.lines;
    const lineDurations = lines.map(line => Math.max(0, Array.from(String(line)).length * typeSpeed) + lineGap);
    const totalDuration = Math.max(1500, (reducedMotion ? 0 : 350) + lineDurations.reduce((sum, n) => sum + n, 0) + 1000);

    function clearTimers() {
      for (const timer of timers) {
        if (timer.type === "interval") clearInterval(timer.id);
        else clearTimeout(timer.id);
      }
      timers.length = 0;
      if (progressInterval !== null) clearInterval(progressInterval);
      progressInterval = null;
    }
    function detach() {
      if (keyHandler) document.removeEventListener("keydown", keyHandler);
      skipBtn.onclick = null;
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (activeCutsceneCleanup === cleanup) activeCutsceneCleanup = null;
      if (typeof setSoundContext === "function") setSoundContext("story");
    }
    function cleanup(reason) {
      if (settled) return;
      settled = true;
      cancelled = true;
      clearTimers();
      detach();
      resolve(reason || "closed");
    }
    activeCutsceneCleanup = cleanup;

    function finish() {
      if (settled) return;
      cancelled = true;
      clearTimers();
      overlay.classList.add("fade-out");
      const timer = setTimeout(() => cleanup("finished"), fadeDuration);
      timers.push({type:"timeout", id:timer});
    }
    function skipCutscene() {
      if (settled) return;
      cancelled = true;
      clearTimers();
      if (typeof playSound === "function") playSound("ui_click");
      overlay.classList.add("fade-out");
      const timer = setTimeout(() => cleanup("skipped"), fadeDuration);
      timers.push({type:"timeout", id:timer});
    }
    function typewriter(el, text, callback) {
      if (typeSpeed === 0) {
        el.textContent = text;
        if (callback) callback();
        return;
      }
      const chars = Array.from(String(text));
      let i = 0;
      const interval = setInterval(() => {
        if (cancelled || settled) { clearInterval(interval); return; }
        if (i < chars.length) {
          el.textContent += chars[i++];
          if (i % 5 === 0 && typeof playSound === "function") playSound("typewriter");
        } else {
          clearInterval(interval);
          if (callback) callback();
        }
      }, typeSpeed);
      timers.push({type:"interval", id:interval});
    }

    let cursor = reducedMotion ? 0 : 350;
    lines.forEach((line, index) => {
      const lineEl = document.createElement("div");
      lineEl.className = "cutscene-line";
      if (index === lines.length - 1) lineEl.classList.add("cutscene-line-final");
      linesContainer.appendChild(lineEl);
      const timer = setTimeout(() => {
        if (cancelled || settled) return;
        lineEl.classList.add("visible");
        if (typeof playSound === "function") playSound("line_appear");
        typewriter(lineEl, line);
      }, cursor);
      timers.push({type:"timeout", id:timer});
      cursor += lineDurations[index];
    });

    progressInterval = setInterval(() => {
      if (cancelled || settled) return;
      const percent = Math.min(100, Math.round(((Date.now() - startTime) / totalDuration) * 100));
      progressFill.style.width = `${percent}%`;
      progressBar.setAttribute("aria-valuenow", String(percent));
      if (percent >= 100) { clearInterval(progressInterval); progressInterval = null; }
    }, 80);

    const closeTimer = setTimeout(finish, Math.max(totalDuration, cursor + 1000));
    timers.push({type:"timeout", id:closeTimer});
    skipBtn.onclick = skipCutscene;
    keyHandler = (event) => {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        skipCutscene();
      }
    };
    if (!settled) {
      document.addEventListener("keydown", keyHandler);
      if (typeof overlay.focus === "function") overlay.focus();
    } else {
      skipBtn.onclick = null;
    }
    const activateTimer = setTimeout(() => { if (!settled) overlay.classList.add("active"); }, reducedMotion ? 0 : 20);
    if (!settled) timers.push({type:"timeout", id:activateTimer});
  });
}

/* ---------- Проверка, показывать ли катсцену ---------- */
function shouldShowCutscene(chapterId) {
  const flags = GAME.world.flags || {};
  return !flags[`_cutsceneSeen_${chapterId}`];
}

/* ---------- Отметить катсцену как показанную ---------- */
function markCutsceneSeen(chapterId) {
  if (!GAME.world.flags) GAME.world.flags = {};
  GAME.world.flags[`_cutsceneSeen_${chapterId}`] = true;
}
