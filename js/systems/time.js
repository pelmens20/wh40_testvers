/* ============================================================
   TIME.JS — безопасный расчёт игрового времени и смены суток
   ============================================================ */
function advanceTime(min = 5){
  if(!GAME.world || typeof GAME.world !== "object") return false;
  const minutes = Number(min);
  if(!Number.isFinite(minutes) || minutes <= 0) return false;
  const amount = Math.min(1000000, Math.floor(minutes));
  const before = {day:GAME.world.day, hour:GAME.world.hour, minute:GAME.world.minute};
  const total = Math.max(0, (Math.max(1, Math.floor(Number(GAME.world.day)||1)) - 1) * 1440
    + Math.max(0, Math.min(23, Math.floor(Number(GAME.world.hour)||0))) * 60
    + Math.max(0, Math.min(59, Math.floor(Number(GAME.world.minute)||0))) + amount);
  GAME.world.day = Math.floor(total / 1440) + 1;
  const withinDay = total % 1440;
  GAME.world.hour = Math.floor(withinDay / 60);
  GAME.world.minute = withinDay % 60;
  GAME.turn = Math.max(1, Math.floor(Number(GAME.turn)||1)) + 1;
  const daysElapsed = Math.max(0, GAME.world.day - before.day);
  Bus.emit("time_advanced", {minutes:amount, day:GAME.world.day, hour:GAME.world.hour, minute:GAME.world.minute, daysElapsed, previous:before});
  return true;
}
function timeString(){
  return `${String(GAME.world?.hour ?? 0).padStart(2,"0")}:${String(GAME.world?.minute ?? 0).padStart(2,"0")}`;
}
