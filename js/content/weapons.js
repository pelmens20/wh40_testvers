/* ============================================================
   CONTENT / WEAPONS.JS — оружие: стрелковое, ближний бой, гранаты
   ============================================================ */

const WEAPON_CATEGORIES = {
  ranged:  "СТРЕЛКОВОЕ",
  melee:   "БЛИЖНИЙ БОЙ",
  grenade: "ГРАНАТЫ"
};

/* ---------- Стрелковое ---------- */
const RANGED_WEAPONS = {
  "Лазпистолет":         { die:8,  bonus:0, range:"Средняя", ammoMax:12, ammoType:"laspistol", traits:"Надёжный" },
  "Лазган":              { die:10, bonus:0, range:"Средняя", ammoMax:24, ammoType:"lasgun",    traits:"Стандартный" },
  "Болтер":              { die:12, bonus:1, range:"Средняя", ammoMax:20, ammoType:"bolter",    traits:"Мощный" },
  "Плазмаган":           { die:14, bonus:0, range:"Длинная", ammoMax:6,  ammoType:"plasma",    traits:"Перегрев" },
  "Штурмовая винтовка":  { die:11, bonus:0, range:"Длинная", ammoMax:30, ammoType:"autogun",   traits:"Очередь" }
};

/* ---------- Ближний бой ---------- */
const MELEE_WEAPONS = {
  "Боевой нож":   { name:"Боевой нож",   die:6,  bonus:0, range:"Касание", traits:"Быстрое" },
  "Цепной меч":   { name:"Цепной меч",   die:10, bonus:1, range:"Касание", traits:"Рвущее" },
  "Силовой меч":  { name:"Силовой меч",  die:12, bonus:2, range:"Касание", traits:"Энергетическое" },
  "Кулак":        { name:"Кулак",        die:4,  bonus:0, range:"Касание", traits:"Импровизация" }
};

/* ---------- Гранаты ---------- */
const GRENADE_WEAPONS = {
  "Осколочная граната": { name:"Осколочная граната", die:10, bonus:0, qtyMax:3, radius:"Группа",   traits:"По площади" },
  "Крак-граната":       { name:"Крак-граната",       die:12, bonus:1, qtyMax:2, radius:"Одиночная", traits:"Бронебойная" },
  "Дымовая граната":    { name:"Дымовая граната",    die:0,  bonus:0, qtyMax:2, radius:"Группа",   traits:"Только укрытие" }
};

/* Общий индекс для поиска по имени */
const WEAPONS = {
  ...RANGED_WEAPONS,
  ...MELEE_WEAPONS,
  ...GRENADE_WEAPONS
};


/* ---------- Типы запасных боеприпасов ---------- */
function getAmmoReserveName(weaponName){
  const weapon = RANGED_WEAPONS[weaponName];
  if(!weapon) return "Патроны";
  return ({laspistol:"Энергоячейки", lasgun:"Энергоячейки", bolter:"Болты", plasma:"Плазменные ячейки", autogun:"Картриджи"})[weapon.ammoType] || "Патроны";
}
function getAmmoReserveAliases(weaponName){
  const typed = getAmmoReserveName(weaponName);
  return typed === "Патроны" ? ["Патроны"] : [typed, "Патроны"];
}
