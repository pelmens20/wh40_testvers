/* ============================================================
   CONTENT / ASSETS.JS — реестр всех изображений игры
   ------------------------------------------------------------
   Реестр включает канонические обозначения и элементы авторской кампании; локальные полки, персонажи и события не объявляются официальным каноном Warhammer 40,000.
   ============================================================ */

const ASSETS = {

  /* ---------- ПОРТРЕТЫ ПЕРСОНАЖЕЙ (300×400) ---------- */
  portraits: {
    "inquisitor-varro":  { file:null, optionalFile:"assets/portraits/inquisitor-varro.png",  caption:"Инквизитор Кассий Варро, Ордо Херетикус" },
    "inquisitor-mara":   { file:null, optionalFile:"assets/portraits/inquisitor-mara.png",   caption:"Инквизитор Мара Вейл, Ордо Херетикус" },
    "inquisitor-vorn":   { file:null, optionalFile:"assets/portraits/inquisitor-vorn.png",   caption:"Инквизитор Тал Ворн, Ордо Херетикус" },
    "guardsman-kane":    { file:null, optionalFile:"assets/portraits/guardsman-kane.png",    caption:"Сержант Элиас Варн, 2-я рота 14-го Хелдонского полка" },
    "guardsman-lyra":    { file:null, optionalFile:"assets/portraits/guardsman-lyra.png",    caption:"Рядовой Лира Вейл, 22-й резервный полк" },
    "guardsman-brek":    { file:null, optionalFile:"assets/portraits/guardsman-brek.png",    caption:"Капрал Ян Брек, 9-я осадная рота" },
    "marine-acheron":    { file:null, optionalFile:"assets/portraits/marine-acheron.png",    caption:"Брат Ахерон, Караул Смерти" },
    "marine-cato":       { file:null, optionalFile:"assets/portraits/marine-cato.png",       caption:"Брат Като, Караул Смерти" },
    "marine-draco":      { file:null, optionalFile:"assets/portraits/marine-draco.png",       caption:"Брат-сержант Кай, отделение Тёмный Клинок" },
    "marine-io":         { file:null, optionalFile:"assets/portraits/marine-io.png",         caption:"Брат Ио, библиарий-ученик Караула Смерти" }
  },

  /* ---------- ПОРТРЕТЫ КЛАССОВ (300×400) ---------- */
  classes: {
    "inquisitor":  { file:null, optionalFile:"assets/classes/inquisitor.png",  caption:"Инквизитор Ордо Херетикус" },
    "guardsman":   { file:null, optionalFile:"assets/classes/guardsman.png",   caption:"Гвардеец Астра Милитарум" },
    "spaceMarine": { file:null, optionalFile:"assets/classes/spaceMarine.png", caption:"Адептус Астартес, Караул Смерти" }
  },

  /* ---------- ЛОКАЛЬНЫЕ АУДИОТЕМЫ (галерея ресурсов; не предзагружать как изображения) ---------- */
  audio: {
    "cathedral-crypt": { file:null, optionalFile:"assets/audio/cathedral-crypt.ogg", caption:"Соборные крипты" },
    "combat-underscore": { file:null, optionalFile:"assets/audio/combat-underscore.ogg", caption:"Боевой эмбиент" },
    "hive-industrial": { file:null, optionalFile:"assets/audio/hive-industrial.ogg", caption:"Промышленный улей" },
    "imperial-archive": { file:null, optionalFile:"assets/audio/imperial-archive.ogg", caption:"Имперский архив" },
    "warp-disturbance": { file:null, optionalFile:"assets/audio/warp-disturbance.ogg", caption:"Варп-аномалия" }
  },

  /* ---------- АВАТАРЫ NPC (64×64) ---------- */
  npcAvatars: {
    "npc-kane": { file:null, optionalFile:"assets/avatars/npc/kane.png", caption:"Сержант Кейн, командир ПСО" },
    "npc-hest": { file:null, optionalFile:"assets/avatars/npc/hest.png", caption:"Магос Хест, техножрец Адептус Механикус" },
    "npc-lyra": { file:null, optionalFile:"assets/avatars/npc/lyra.png", caption:"Лира Доминик, свидетель" }
  },

  /* ---------- АВАТАРЫ ВРАГОВ (64×64) ---------- */
  enemyAvatars: {
    "enemy-cultist":        { file:null, optionalFile:"assets/avatars/enemy/cultist.png",        caption:"Культист Тзинча" },
    "enemy-cult-leader":    { file:null, optionalFile:"assets/avatars/enemy/cult-leader.png",    caption:"Культоводитель Тзинча" },
    "enemy-daemonette":     { file:null, optionalFile:"assets/avatars/enemy/daemonette.png",     caption:"Демонетка Слаанеш; архивная угроза, не обязательно встречается в кампании" },
    /* Пока нет картинок
    "enemy-horror_pink": { file:null, optionalFile:"assets/avatars/enemy/horror-pink.png", caption:"Розовый Ужас Тзинча" },
    "enemy-horror_blue": { file:null, optionalFile:"assets/avatars/enemy/horror-blue.png", caption:"Синий Ужас Тзинча" },
    "enemy-flamer":      { file:null, optionalFile:"assets/avatars/enemy/flamer.png",      caption:"Флеймер Тзинча" },
    "enemy-screamer":    { file:null, optionalFile:"assets/avatars/enemy/screamer.png",    caption:"Крикун Тзинча" },
*/
    "enemy-heretic-marine": { file:null, optionalFile:"assets/avatars/enemy/heretic-marine.png", caption:"Еретик-Астартес" },
    "enemy-renegade":       { file:null, optionalFile:"assets/avatars/enemy/renegade.png",       caption:"Ренегат PDF" },
    "enemy-pdf":            { file:null, optionalFile:"assets/avatars/enemy/pdf.png",            caption:"Солдат Планетарных Сил Обороны" },
    "enemy-servitor":       { file:null, optionalFile:"assets/avatars/enemy/servitor.png",       caption:"Боевой сервитор" },
    "enemy-ork":            { file:null, optionalFile:"assets/avatars/enemy/ork.png",            caption:"Орк-бойз" }
  },

  /* ---------- ЛЕГИОНЫ: ЛОЯЛЬНЫЕ ---------- */
  loyalistLegions: {
    "dark-angels":    { file:null, optionalFile:"assets/legions/loyalist/dark-angels.png",    caption:"I Легион - Темные Ангелы. Примарх: Лион Эль Джонсон" },
    "white-scars":    { file:null, optionalFile:"assets/legions/loyalist/white-scars.png",    caption:"V Легион - Белые Шрамы. Примарх: Джагатай Хан" },
    "space-wolves":   { file:null, optionalFile:"assets/legions/loyalist/space-wolves.png",   caption:"VI Легион - Космические Волки. Примарх: Леман Русс" },
    "imperial-fists": { file:null, optionalFile:"assets/legions/loyalist/imperial-fists.png", caption:"VII Легион - Имперские Кулаки. Примарх: Рогал Дорн" },
    "blood-angels":   { file:null, optionalFile:"assets/legions/loyalist/blood-angels.png",   caption:"IX Легион - Кровавые Ангелы. Примарх: Сангвиний" },
    "iron-hands":     { file:null, optionalFile:"assets/legions/loyalist/iron-hands.png",     caption:"X Легион - Железные Руки. Примарх: Феррус Манус" },
    "ultramarines":   { file:null, optionalFile:"assets/legions/loyalist/ultramarines.png",   caption:"XIII Легион - Ультрамарины. Примарх: Робаут Гиллиман" },
    "salamanders":    { file:null, optionalFile:"assets/legions/loyalist/salamanders.png",    caption:"XVIII Легион - Саламандры. Примарх: Вулкан" },
    "raven-guard":    { file:null, optionalFile:"assets/legions/loyalist/raven-guard.png",    caption:"XIX Легион - Гвардия Ворона. Примарх: Корвус Коракс" }
  },

  /* ---------- ЛЕГИОНЫ: ПРЕДАТЕЛИ ---------- */
  traitorLegions: {
    "emperors-children": { file:null, optionalFile:"assets/legions/traitor/emperors-children.png", caption:"III Легион - Дети Императора. Примарх: Фулгрим" },
    "iron-warriors":     { file:null, optionalFile:"assets/legions/traitor/iron-warriors.png",     caption:"IV Легион - Железные Воины. Примарх: Пертурабо" },
    "night-lords":       { file:null, optionalFile:"assets/legions/traitor/night-lords.png",       caption:"VIII Легион - Повелители Ночи. Примарх: Конрад Керз" },
    "world-eaters":      { file:null, optionalFile:"assets/legions/traitor/world-eaters.png",      caption:"XII Легион - Пожиратели Миров. Примарх: Ангрон" },
    "death-guard":       { file:null, optionalFile:"assets/legions/traitor/death-guard.png",       caption:"XIV Легион - Гвардия Смерти. Примарх: Мортарион" },
    "thousand-sons":     { file:null, optionalFile:"assets/legions/traitor/thousand-sons.png",     caption:"XV Легион - Тысяча Сынов. Примарх: Магнус Красный" },
    "sons-of-horus":     { file:null, optionalFile:"assets/legions/traitor/sons-of-horus.png",     caption:"XVI Легион - Сыны Хоруса. Примарх: Хорус Луперкаль" },
    "word-bearers":      { file:null, optionalFile:"assets/legions/traitor/word-bearers.png",      caption:"XVII Легион - Несущие Слово. Примарх: Лоргар Аврелиан" },
    "alpha-legion":      { file:null, optionalFile:"assets/legions/traitor/alpha-legion.png",      caption:"XX Легион - Альфа-Легион. Примарх: Альфарий и Омегон" }
  },

  /* ---------- ФРАКЦИИ (48×48) ---------- */
  factions: {
    Imperium:     { file:null, optionalFile:"assets/factions/imperium.png",     caption:"Империум Человечества" },
    Inquisition:  { file:null, optionalFile:"assets/factions/inquisition.png",  caption:"Инквизиция" },
    Militarum:    { file:null, optionalFile:"assets/factions/militarum.png",    caption:"Астра Милитарум" },
    Mechanicus:   { file:null, optionalFile:"assets/factions/mechanicus.png",   caption:"Адептус Механикус" },
    Ministorum:   { file:null, optionalFile:"assets/factions/ecclesiarchy.png", caption:"Адептус Министорум" },
    Arbites:      { file:null, optionalFile:"assets/factions/arbites.png",      caption:"Арбитрес" },
    Astartes:     { file:null, optionalFile:"assets/factions/astartes.png",     caption:"Адептус Астартес" },
    Chaos:        { file:null, optionalFile:"assets/factions/chaos.png",        caption:"Силы Хаоса" },
    Orks:         { file:null, optionalFile:"assets/factions/orks.png",         caption:"Орки" }
  },

  /* ---------- ОРДО ИНКВИЗИЦИИ (48×48) ---------- */
  inquisition: {
    "ordo-hereticus": { file:null, optionalFile:"assets/inquisition/ordo-hereticus.png", caption:"Ордо Херетикус - охота на ересь" },
    "ordo-malleus":   { file:null, optionalFile:"assets/inquisition/ordo-malleus.png",   caption:"Ордо Маллеус - охота на демонов" },
    "ordo-xenos":     { file:null, optionalFile:"assets/inquisition/ordo-xenos.png",     caption:"Ордо Ксенос - охота на ксеносов" }
  },

  /* ---------- БОГИ ХАОСА (64×64) ---------- */
  chaosGods: {
    khorne:   { file:null, optionalFile:"assets/chaos-gods/khorne.png",   caption:"Кхорн, Бог Крови" },
    tzeentch: { file:null, optionalFile:"assets/chaos-gods/tzeentch.png", caption:"Тзинч, Бог Перемен" },
    nurgle:   { file:null, optionalFile:"assets/chaos-gods/nurgle.png",   caption:"Нургл, Бог Разложения" },
    slaanesh: { file:null, optionalFile:"assets/chaos-gods/slaanesh.png", caption:"Слаанеш, Бог Излишеств" }
  },


  /* ---------- ПРЕДМЕТЫ (48×48) ---------- */
  items: {
    "Медикамент":            { file:null, optionalFile:"assets/items/medkit.png",   caption:"Медикамент" },
    "Ремкомплект":           { file:null, optionalFile:"assets/items/repair.png",   caption:"Ремкомплект" },
    "Печать допуска":        { file:null, optionalFile:"assets/items/seal.png",     caption:"Печать допуска" },
    "Таинственный фрагмент": { file:null, optionalFile:"assets/items/fragment.png", caption:"Таинственный фрагмент" },
    "Патроны":               { file:null, optionalFile:"assets/items/ammo.png",     caption:"Боеприпасы" },
    "Священный воск":        { file:null, optionalFile:"assets/items/wax.png",      caption:"Священный воск" },
    "Амулет веры":           { file:null, optionalFile:"assets/items/amulet.png",   caption:"Амулет веры" }
  },

  /* ---------- ОРУЖИЕ (48×48) ---------- */
  weapons: {
    laspistol:  { file:null, optionalFile:"assets/weapons/laspistol.png",  caption:"Лазпистолет" },
    lasgun:     { file:null, optionalFile:"assets/weapons/lasgun.png",     caption:"Лазган" },
    bolter:     { file:null, optionalFile:"assets/weapons/bolter.png",     caption:"Болтер" },
    plasma:     { file:null, optionalFile:"assets/weapons/plasma.png",     caption:"Плазмаган" },
    chainsword: { file:null, optionalFile:"assets/weapons/chainsword.png", caption:"Цепной меч" },
    improvised: { file:null, optionalFile:"assets/weapons/improvised.png", caption:"Импровизированное оружие" }
  },

  /* ---------- БРОНЯ (48×48) ---------- */
  armor: {
    "light-plate": { file:null, optionalFile:"assets/armor/light-plate.png", caption:"Легкий панцирь" },
    "flak-armor":  { file:null, optionalFile:"assets/armor/flak-armor.png",  caption:"Флак-броня" },
    "power-armor": { file:null, optionalFile:"assets/armor/power-armor.png", caption:"Силовая броня" },
    "carapace":    { file:null, optionalFile:"assets/armor/carapace.png",    caption:"Карапас" }
  },

  /* ---------- СОСТОЯНИЯ (32×32) ---------- */
  conditions: {
    "Заклинивание": { file:null, optionalFile:"assets/conditions/jam.png",        caption:"Заклинивание" },
    "Кровотечение": { file:null, optionalFile:"assets/conditions/bleed.png",      caption:"Кровотечение" },
    "Оглушение":    { file:null, optionalFile:"assets/conditions/stun.png",       caption:"Оглушение" },
    "Испуг":        { file:null, optionalFile:"assets/conditions/fear.png",       caption:"Испуг" },
    "Отравление":   { file:null, optionalFile:"assets/conditions/poison.png",     caption:"Отравление" },
    "Усталость":    { file:null, optionalFile:"assets/conditions/fatigue.png",    caption:"Усталость" },
    "Вдохновение":  { file:null, optionalFile:"assets/conditions/inspire.png",    caption:"Вдохновение" },
    "Прикрытие":    { file:null, optionalFile:"assets/conditions/cover.png",      caption:"Прикрытие" },
    "Порча":        { file:null, optionalFile:"assets/conditions/corruption.png", caption:"Порча" }
  },

  /* ---------- ИКОНКИ КЛАССОВ (48×48) ---------- */
  classIcons: {
    "inquisitor":  { file:null, optionalFile:"assets/classes-icons/inquisitor.png",  caption:"Инквизитор" },
    "guardsman":   { file:null, optionalFile:"assets/classes-icons/guardsman.png",   caption:"Гвардеец" },
    "spaceMarine": { file:null, optionalFile:"assets/classes-icons/spaceMarine.png", caption:"Космодесантник" }
  },

  /* ---------- БРЕНДИНГ ---------- */
  branding: {
    "logo": { file:null, optionalFile:"assets/branding/logo.png", caption:"Имперский орел (Аквила)" },
    "seal": { file:null, optionalFile:"assets/branding/seal.png", caption:"Роза Инквизиции" },
    "boot": { file:null, optionalFile:"assets/branding/boot.png", caption:"Загрузочный фон" }
  },
  /* ---------- ФОНЫ ЛОКАЦИЙ И ВИЗУАЛЬНЫЕ ВАРИАНТЫ ---------- */
  backgrounds: {
    "Доки":                { file:null, optionalFile:"assets/backgrounds/docks.png", fallbackFile:"assets/backgrounds/promzone.jpg", caption:"Грузовые доки; резервный индустриальный фон" },
    "Доки Навигатор":      { file:null, optionalFile:"assets/backgrounds/promzone.jpg", caption:"Грузовые доки Навигатор" },
    "Казармы":             { file:null, optionalFile:"assets/backgrounds/barracks.png", caption:"Казармы Планетарных Сил Обороны" },
    "Рынок":               { file:"assets/backgrounds/market-user.png", fallbackFile:"assets/backgrounds/market.jpg", caption:"Нижний рынок под тенью собора" },
    "Храм":                { file:"assets/backgrounds/temple-user.png", fallbackFile:"assets/backgrounds/temple.jpg", caption:"Имперский храм" },
    "Промзона":            { file:"assets/backgrounds/industrial-cathedral-user.png", fallbackFile:"assets/backgrounds/promzone.jpg", caption:"Промышленный сектор IX" },
    "Архив":               { file:null, optionalFile:"assets/backgrounds/archive.png", caption:"Имперский архив" },
    "Техно-капелла":       { file:null, optionalFile:"assets/backgrounds/techchapel.png", caption:"Техно-капелла Адептус Механикус" },
    "Запретная зона":      { file:null, optionalFile:"assets/backgrounds/forbidden.png", caption:"Запретная зона" },
    "Старый туннель":      { file:null, optionalFile:"assets/backgrounds/tunnel.png", caption:"Старый технический туннель" },
    "Морг":                { file:null, optionalFile:"assets/backgrounds/morgue.png", caption:"Городской морг" },
    "Технический узел":    { file:null, optionalFile:"assets/backgrounds/node.png", caption:"Технический узел связи" },
    "Старый лифт":         { file:null, optionalFile:"assets/backgrounds/lift.png", caption:"Старый грузовой лифт" },
    "Катакомбы":            { file:null, optionalFile:"assets/backgrounds/catacombs.png", fallbackFile:"assets/backgrounds/catacombs.jpg", caption:"Имперские катакомбы" },
    "Склад":               { file:null, optionalFile:"assets/backgrounds/warehouse.png", caption:"Склад снабжения" },
    "Сервиторная":         { file:null, optionalFile:"assets/backgrounds/servitorium.png", caption:"Сервиторная" },
    "Запечатанный сектор": { file:"assets/backgrounds/sealed-gates-user.png", fallbackFile:"assets/backgrounds/sealed.jpg", caption:"Запечатанные врата сектора IX" },
    "combat":              { file:null, optionalFile:"assets/backgrounds/combat.png", caption:"Поле боевого столкновения" },
    "Ритуальная камера":   { file:"assets/backgrounds/ritual-chamber-user.png", caption:"Подземный храм мрачного ритуала" },
    "Рынок — архивная панорама": { file:null, optionalFile:"assets/backgrounds/market.png", caption:"Архивная панорама рынка" },
    "Промзона — архивная панорама": { file:null, optionalFile:"assets/backgrounds/promzone.png", caption:"Архивная панорама промзоны" },
    "Запечатанные врата — архивная панорама": { file:null, optionalFile:"assets/backgrounds/sealed.png", caption:"Архивная панорама запечатанных врат" },
    "Храм — архивная панорама": { file:null, optionalFile:"assets/backgrounds/temple.png", caption:"Архивная панорама храма" },
    "Рынок — JPEG-архив": { file:"assets/backgrounds/market.jpg", caption:"Архивный кадр рынка" },
    "Промзона — JPEG-архив": { file:"assets/backgrounds/promzone.jpg", caption:"Архивный кадр промзоны" },
    "Храм — JPEG-архив": { file:"assets/backgrounds/temple.jpg", caption:"Архивный кадр храма" },
    "Запечатанная дверь — JPEG-архив": { file:"assets/backgrounds/sealed.jpg", caption:"Архивный кадр запечатанной двери" },
    "Катакомбы — JPEG-архив": { file:"assets/backgrounds/catacombs.jpg", caption:"Архивный кадр катакомб" }
  },

    /* ---------- ФОНЫ ГЛАВ (1600×900) ---------- */
  chapterBackgrounds: {
    "silentForge":       { file:"assets/backgrounds/industrial-cathedral-user.png", caption:"Тишина в IX секторе" },
    "sealedSector":      { file:"assets/backgrounds/sealed-gates-user.png", caption:"Запечатанный сектор" },
    "warpHeart":         { file:"assets/backgrounds/ritual-chamber-user.png", caption:"Сердце Варпа" },
    "ordoJudgment":      { file:"assets/backgrounds/temple-user.png", caption:"Суд Ордо" },
    "afterJudgment":     { file:"assets/backgrounds/temple.jpg", caption:"После Суда" },
    "newHive":           { file:"assets/backgrounds/market-user.png", caption:"Новый улей" },
    "ashProtocol":       { file:"assets/backgrounds/promzone.jpg", caption:"Пепельный протокол" },
    "resonanceArchive":  { file:null, optionalFile:"assets/backgrounds/archive.png", caption:"Архив резонанса" },
    "witnessLedger":     { file:"assets/backgrounds/market.jpg", caption:"Реестр свидетелей" },
    "silentRoute":       { file:null, optionalFile:"assets/backgrounds/promzone.png", caption:"Немой маршрут" },
    "priceOfEvidence":   { file:null, optionalFile:"assets/backgrounds/market.png", caption:"Цена доказательств" },
    "rightToMemory":     { file:"assets/backgrounds/sealed.jpg", caption:"Право на память" },
    "lastTransport":     { file:null, optionalFile:"assets/backgrounds/promzone.jpg", caption:"Последний транспорт" },
    "beyondHive":        { file:"assets/backgrounds/catacombs.jpg", caption:"След за пределами улья" },
    "verdictNameless":   { file:null, optionalFile:"assets/backgrounds/sealed.png", caption:"Вердикт без имени" }
  },


  /* ---------- ИЛЛЮСТРАЦИИ СЦЕН (1200×500) ---------- */
  scenes: {
    "cultist-meeting": { file:null, optionalFile:"assets/scenes/cultist-meeting.png", caption:"Встреча с культистом" },
    "sealed-door":     { file:null, optionalFile:"assets/scenes/sealed-door.png", caption:"Запечатанная дверь" },
    "eleven-marks":    { file:null, optionalFile:"assets/scenes/eleven-marks.png", caption:"Одиннадцать знаков" },
    "cult-truth":      { file:null, optionalFile:"assets/scenes/cult-truth.png", caption:"Слова культиста" }
  },

  /* ---------- ИКОНКИ ЛОКАЦИЙ (64×64) ---------- */
  locationIcons: {
    "Доки Навигатор":      { file:null, symbol:"⚓", caption:"Доки" },
    "Казармы":             { file:null, symbol:"⚔", caption:"Казармы" },
    "Рынок":               { file:null, symbol:"¤", caption:"Рынок" },
    "Храм":                { file:null, symbol:"✠", caption:"Храм" },
    "Промзона":            { file:null, symbol:"⚙", caption:"Промзона" },
    "Архив":               { file:null, symbol:"▤", caption:"Архив" },
    "Техно-капелла":       { file:null, symbol:"⚙", caption:"Капелла" },
    "Запретная зона":      { file:null, symbol:"⛔", caption:"Запретная зона" },
    "Старый туннель":      { file:null, symbol:"⌁", caption:"Туннель" },
    "Морг":                { file:null, symbol:"☠", caption:"Морг" },
    "Технический узел":    { file:null, symbol:"⌘", caption:"Узел" },
    "Старый лифт":         { file:null, symbol:"⇅", caption:"Лифт" },
    "Катакомбы":           { file:null, symbol:"♜", caption:"Катакомбы" },
    "Склад":               { file:null, symbol:"▣", caption:"Склад" },
    "Сервиторная":         { file:null, symbol:"⚙", caption:"Сервиторная" },
    "Запечатанный сектор": { file:null, symbol:"⛨", caption:"Запечатанный сектор" }
  }
};

// Пакет содержит пять пользовательских фонов и базовые фоновые JPEG.
// Все активные пути должны существовать в сборке. Не приложенные портреты и значки остаются optionalFile,
// чтобы браузер не создавал 404; для них используются оформленные резервные изображения/символы.
function isAssetPathAvailable(file){
  if(!file) return false;
  const manifest = (typeof window !== "undefined") ? window.ASSET_AVAILABLE_FILES : null;
  if(manifest && typeof manifest.has === "function") return manifest.has(file);
  if(Array.isArray(manifest)) return manifest.includes(file);
  // Unit tests and older offline contexts without the generated manifest retain legacy semantics.
  return true;
}
function getAsset(category, key){
  const a = ASSETS[category] ? ASSETS[category][key] : null;
  if(!a) return null;
  const candidates = [a.file, a.optionalFile, a.fallbackFile].filter(Boolean);
  return candidates.find(isAssetPathAvailable) || null;
}
function getAssetFilePath(category, key){
  const a = ASSETS[category] ? ASSETS[category][key] : null;
  return a ? (getAsset(category, key) || a.file || a.optionalFile || a.fallbackFile || null) : null;
}

function getCaption(category, key, fallback){
  const a = ASSETS[category] ? ASSETS[category][key] : null;
  return a ? a.caption : (fallback || "");
}

function hasAsset(category, key){
  return !!getAsset(category, key);
}

let _assetRefreshTimer = null;

/* ============================================================
   Предзагрузка всех ассетов
   ------------------------------------------------------------
   Пробуем загрузить каждую картинку из реестра.
   Успешные кэшируются как true, неуспешные как false.
   В интерфейсе показываем только те, что есть.
   ============================================================ */
function preloadAssets(){
  if(!GAME._assetCache) GAME._assetCache = {};

  const buckets = Object.keys(ASSETS);
  let total = 0;

  buckets.forEach(cat => {
    if(cat === "audio") return; // Audio is handled by the sound router/gallery, never by Image().
    const group = ASSETS[cat] || {};
    Object.keys(group).forEach(k => {
      const a = group[k];
      if(!a) return;
      const file = getAsset(cat, k);
      if(!file) return;
      if(GAME._assetCache[file] !== undefined) return; // уже проверяли
      total++;

      const img = new Image();
      img.onload = () => {
        GAME._assetCache[file] = true;
        // Картинки грузятся асинхронно. Если сцена уже отрисована, обновляем её
        // после пачки завершившихся загрузок, иначе останется заглушка до
        // следующего действия игрока. Debounce предотвращает сотни renderAll().
        if(GAME.started && typeof renderAll === "function" && typeof setTimeout === "function"){
          if(_assetRefreshTimer !== null && typeof clearTimeout === "function") clearTimeout(_assetRefreshTimer);
          _assetRefreshTimer = setTimeout(() => {
            _assetRefreshTimer = null;
            if(GAME.started && typeof renderAll === "function") renderAll();
          }, 80);
        }
      };
      img.onerror = () => { GAME._assetCache[file] = false; };
      img.src = file;
    });
  });

  if(total > 0){
    console.log(`[ASSETS] предзагрузка: ${total} файлов`);
  }
}

/* Проверка, загружен ли ассет */
function isAssetLoaded(file){
  if(!file) return false;
  if(!GAME._assetCache) return false;
  return GAME._assetCache[file] === true;
}
