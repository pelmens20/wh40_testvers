/* ============================================================
   INVENTORY.JS — предметы, добавление, удаление, использование
   ============================================================ */

function hasItem(name, qty = 1){
  const it = GAME.character.inventory.find(i => i.name === name);
  return (it?.qty || 0) >= qty;
}

function addItem(name, qty = 1){
  const inv = GAME.character.inventory;
  const existing = inv.find(i => i.name === name);
  if(existing) existing.qty += qty;
  else inv.push({name, qty});
  Bus.emit("item_gained", {name, qty});
}

function removeItem(name, qty = 1){
  if(!Number.isInteger(qty) || qty <= 0) return false;
  const inv = GAME.character && Array.isArray(GAME.character.inventory) ? GAME.character.inventory : null;
  if(!inv) return false;
  const idx = inv.findIndex(i => i.name === name);
  if(idx < 0 || !Number.isFinite(inv[idx].qty) || inv[idx].qty < qty) return false;
  inv[idx].qty -= qty;
  if(inv[idx].qty === 0) inv.splice(idx, 1);
  return true;
}

function useItem(name){
  if(!hasItem(name)){
    addSystem("ИНВЕНТАРЬ", `Предмета «${name}» нет.`);
    renderAll(); return;
  }
  if(name === "Медикамент"){
    removeItem(name, 1);
    const doctrineBonus = typeof getDoctrineHealingBonus === "function" ? getDoctrineHealingBonus() : 0;
    const heal = RNG.die(8) + 2 + doctrineBonus;
    const healed = healPlayer(heal);
    removeCondition("Кровотечение");
    addSystem("МЕДИКАМЕНТ", `Восстановлено ${healed} HP.${doctrineBonus ? ` Полевая медицинская доктрина дала +${doctrineBonus} к лечению до ограничения максимальным HP.` : ""}`);
    
        } else if(name === "Святая вода"){
  removeItem(name, 1);
  if(typeof changeCorruption === "function"){
    changeCorruption(-5, "Святая вода Экклезиархии смывает скверну.");
  }
}

 else if(name === "Ремкомплект"){
    const jammed = hasCondition("Заклинивание");
    const overheated = hasCondition("Перегрев");
    if(!jammed && !overheated){
      addSystem("РЕМОНТ", "Оружие исправно. Ремкомплект сохранён.");
      renderAll();
      return;
    }
    removeItem(name, 1);
    removeCondition("Заклинивание");
    removeCondition("Перегрев");
    addSystem("РЕМОНТ", "Неисправность устранена; оружие снова готово к работе.");
  } else {
    addSystem("ПРЕДМЕТ", "Этот предмет пока не имеет активного применения.");
  }
  Bus.emit("item_used", {name});
   if(GAME.mode === "combat" && typeof runEnemyTurns === "function"){
    runEnemyTurns();
  }
  renderAll();
  saveGameSilent();
}
