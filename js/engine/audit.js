/* ============================================================
   AUDIT.JS — проверка кампаний
   ------------------------------------------------------------
   Ищет битые переходы, отсутствующие сцены и врагов.
   ============================================================ */

function auditScenario(scenarioId){
  const sc = CAMPAIGN_SCENARIOS[scenarioId];
  if(!sc) return [`Сценарий «${scenarioId}» не найден.`];

  const errors = [];
  const sceneIds = new Set(Object.keys(sc.scenes || {}));   // ← ЭТА СТРОКА ДОЛЖНА БЫТЬ
  const specialTargets = new Set(["__chapter2__", "__chapter3__", "__chapter4__", "__chapter5__", "__chapter6__", "__chapter7__", "__chapter8__", "__chapter9__", "__chapter10__", "__chapter11__", "__chapter12__", "__chapter13__", "__chapter14__", "__chapter15__", "__restart__", "__exit"]);
  if(!sc.startScene || !sceneIds.has(sc.startScene)){
    errors.push(`startScene «${sc.startScene || "(не задана)"}» не существует.`);
  }

  for(const [id, scene] of Object.entries(sc.scenes || {})){
    if(scene.onSuccess && !sceneIds.has(scene.onSuccess)){
      errors.push(`${id}: onSuccess → ${scene.onSuccess} не найден`);
    }
    if(scene.onFail && !sceneIds.has(scene.onFail)){
      errors.push(`${id}: onFail → ${scene.onFail} не найден`);
    }
    if(scene.skipTo && !sceneIds.has(scene.skipTo)){
      errors.push(`${id}: skipTo → ${scene.skipTo} не найден`);
    }
    if(scene.auto?.goto && !sceneIds.has(scene.auto.goto) && !specialTargets.has(scene.auto.goto)){
      errors.push(`${id}: auto.goto → ${scene.auto.goto} не найден`);
    }
    if(scene.combat && (!ENEMIES || !ENEMIES[scene.combat])){
      errors.push(`${id}: combat → враг «${scene.combat}» не найден`);
    }
    if(scene.returnScene && !sceneIds.has(scene.returnScene)){
      errors.push(`${id}: returnScene → ${scene.returnScene} не найден`);
    }
    for(const target of (scene.dynamicTargets || [])){ if(!sceneIds.has(target)) errors.push(`${id}: dynamicTargets → ${target} не найден`); }

    for(const [i, choice] of (scene.choices || []).entries()){
      if(choice.goto && !sceneIds.has(choice.goto) && !specialTargets.has(choice.goto)){
        errors.push(`${id}[${i}]: goto → ${choice.goto} не найден`);
      }
      if(choice.dialogue && (typeof DIALOGUE_TREES === "undefined" || !DIALOGUE_TREES[choice.dialogue])){
        errors.push(`${id}[${i}]: dialogue → дерево «${choice.dialogue}» не найдено`);
      }
      if(choice.onFail && !sceneIds.has(choice.onFail)){
        errors.push(`${id}[${i}]: onFail → ${choice.onFail} не найден`);
      }
      if(choice.requires?.flag){
        for(const key of Object.keys(choice.requires.flag)){
          if(typeof FLAG_REGISTRY === "undefined" || !FLAG_REGISTRY[key]){
            errors.push(`${id}[${i}]: requires неизвестный флаг «${key}»`);
          }
        }
      }
    }

    if(scene.effects?.flag){
      for(const key of Object.keys(scene.effects.flag)){
        if(typeof FLAG_REGISTRY === "undefined" || !FLAG_REGISTRY[key]){
          errors.push(`${id}: effects неизвестный флаг «${key}»`);
        }
      }
    }
    if(scene.victoryEffects?.flag){
      for(const key of Object.keys(scene.victoryEffects.flag)){
        if(typeof FLAG_REGISTRY === "undefined" || !FLAG_REGISTRY[key]){
          errors.push(`${id}: victoryEffects неизвестный флаг «${key}»`);
        }
      }
    }
    if(scene.skipIf?.flag){
      for(const key of Object.keys(scene.skipIf.flag)){
        if(typeof FLAG_REGISTRY === "undefined" || !FLAG_REGISTRY[key]){
          errors.push(`${id}: skipIf неизвестный флаг «${key}»`);
        }
      }
    }
  }

  return errors;
}

function auditAll(){
  const out = [];
  for(const id of Object.keys(CAMPAIGN_SCENARIOS)){
    const errs = auditScenario(id);
    if(errs.length){
      out.push(`=== ${id} ===`);
      errs.forEach(e => out.push("  " + e));
    }
  }
  if(out.length){
    console.warn("[AUDIT] Найдены проблемы:\n" + out.join("\n"));
  } else {
    console.log("[AUDIT] Все кампании валидны.");
  }
  return out;
}
