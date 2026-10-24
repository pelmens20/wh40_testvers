/* ============================================================
   DAMAGE.JS — урон, HP, смерть
   ============================================================ */

function rollDamage(die, bonus=0){
  return RNG.die(die) + bonus;
}

function dealDamageToPlayer(dmg){
  const c = GAME.character;
  c.hp = Math.max(0, c.hp - dmg);
  Bus.emit("player_damaged", {dmg, hp: c.hp});
  if(c.hp <= 0) Bus.emit("player_died", {});
  return dmg;
}

function healPlayer(amount){
  const c = GAME.character;
  const before = c.hp;
  c.hp = Math.min(c.maxHp, c.hp + amount);
  const healed = c.hp - before;
  Bus.emit("player_healed", {hp: c.hp, healed});
  return healed;
}

function dealDamageToEnemy(dmg){
  if(!GAME.combat) return 0;
  const e = GAME.combat.enemy;
  e.hp = Math.max(0, e.hp - dmg);
  Bus.emit("enemy_damaged", {dmg, hp: e.hp});
  if(e.hp <= 0) Bus.emit("enemy_killed", {enemy: GAME.combat.enemyType, xp: e.xp});
  return dmg;
}
