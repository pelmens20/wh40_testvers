/* ============================================================
   UI / HOTKEYS.JS — горячие клавиши
   ============================================================ */

function bindHotkeys(){
  document.addEventListener("keydown", e => {
    const tag = e.target.tagName;
    if(tag === "INPUT" || tag === "TEXTAREA") return;

    if(GAME.mode === "combat"){
      if(e.key === "1"){ combatAttack(); e.preventDefault(); }
      if(e.key === "2"){ combatDefend(); e.preventDefault(); }
      if(e.key === "3"){ combatFlee(); e.preventDefault(); }
      if(e.key === "4"){ useItem("Медикамент"); e.preventDefault(); }
      return;
    }

    switch(e.key.toLowerCase()){
      case "i": GAME.view = "inventory";  renderAll(); break;
      case "c": GAME.view = "character";  renderAll(); break;
      case "m": GAME.view = "map";        renderAll(); break;
      case "q": GAME.view = "quests";     renderAll(); break;
      case "n": GAME.view = "investigation"; renderAll(); break;
      case "j": GAME.view = "journal";    renderAll(); break;
      case "r": GAME.view = "reputation"; renderAll(); break;
      case "h": GAME.view = "story";      renderAll(); break;
      case "escape": {
        const root = document.getElementById("modalRoot");
        if(root) root.innerHTML = "";
        break;
      }
    }
  });
}
