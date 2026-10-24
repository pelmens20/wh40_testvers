/* ============================================================
   CHAPTER EXPANSIONS — обязательная вступительная боевая сцена
   Каждая глава открывается коротким сюжетно мотивированным столкновением.
   После боя игрок возвращается к исходной вступительной сцене.
   ============================================================ */
(function(){
  if(typeof CAMPAIGN_SCENARIOS === "undefined") return;
  const enemies = {
    silentForge:"cultist", sealedSector:"cultist", warpHeart:"cultist",
    ordoJudgment:"renegade", afterJudgment:"cultist", newHive:"renegade",
    ashProtocol:"cultist", resonanceArchive:"cult_leader", witnessLedger:"renegade",
    silentRoute:"renegade", priceOfEvidence:"cultist", rightToMemory:"cultist",
    lastTransport:"renegade", beyondHive:"cult_leader", verdictNameless:"cult_leader"
  };
  const intros = {
    silentForge:"ch1_opening_assault", sealedSector:"ch2_opening_assault", warpHeart:"ch3_opening_assault",
    ordoJudgment:"ch4_opening_assault", afterJudgment:"ch5_opening_assault", newHive:"ch6_opening_assault",
    ashProtocol:"ch7_opening_assault", resonanceArchive:"ch8_opening_assault", witnessLedger:"ch9_opening_assault",
    silentRoute:"ch10_opening_assault", priceOfEvidence:"ch11_opening_assault", rightToMemory:"ch12_opening_assault",
    lastTransport:"ch13_opening_assault", beyondHive:"ch14_opening_assault", verdictNameless:"ch15_opening_assault"
  };
  const chapterHooks = {
    silentForge:"Среди остановленных прессов раздаётся огонь: кто-то пытается уничтожить сменные ведомости прежде, чем их увидит следственная группа.",
    sealedSector:"За гермодверью просыпается охранный сервитор; его приказ устарел, но оружейные контуры всё ещё активны.",
    warpHeart:"Из аварийного коридора вырываются вооружённые фанатики. Их присутствие не доказывает природу аномалии — только непосредственную угрозу.",
    ordoJudgment:"Переговоры прерывает попытка вооружённого задержания. Сначала необходимо обезопасить зал, затем выяснять, кто отдал приказ.",
    afterJudgment:"На маршруте конвоя устроена засада. Нападавшие стремятся задержать доставку, а не оставляют понятного знака принадлежности.",
    newHive:"В узком переходе между жилыми ярусами начинается перестрелка; гражданские укрываются за грузовыми тележками.",
    ashProtocol:"Патруль сталкивается с ренегатами у аварийного шлюза. Разрушение оборудования может оказаться опаснее самого противника.",
    resonanceArchive:"Охрана архива открывает огонь после сбоя идентификации. До выяснения причин нельзя считать всех защитников предателями.",
    witnessLedger:"Группа вооружённых налётчиков пытается добраться до реестра свидетелей. Сохранить записи и защитить людей одинаково важно.",
    silentRoute:"В транспортном тоннеле противник перекрывает путь огнём. Положение укрытий и ограниченный обзор важнее поспешного преследования.",
    priceOfEvidence:"Перед совещанием неизвестные пытаются похитить опечатанный пакет доказательств. Содержимое пакета ещё не раскрывает личность заказчика.",
    rightToMemory:"У хранилища данных срабатывает автономная оборона. Носители и журналы доступа должны пережить столкновение.",
    lastTransport:"Погрузка превращается в бой у рампы; приоритет — удержать проход и не повредить транспорт с эвакуируемыми.",
    beyondHive:"На внешнем перевалочном пункте начинается короткое столкновение. Следы противника следует зафиксировать, не приписывая им неизвестную фракцию.",
    verdictNameless:"Последняя попытка сорвать передачу отчёта вынуждает группу занять оборону. После боя решение должно опираться на собранные факты."
  };
  Object.keys(CAMPAIGN_SCENARIOS).forEach((id, index)=>{
    const sc=CAMPAIGN_SCENARIOS[id];
    if(!sc || !sc.scenes || !sc.startScene) return;
    const originalStart=sc.startScene;
    const combatId=intros[id] || ("chapter_opening_assault_"+id);
    const enemy=enemies[id] || "cultist";
    const chapterNumber=(id.match(/(?:ch)?(\d+)/i)||[])[1] || (index+1);
    const originalScene=sc.scenes[originalStart];
    if(!originalScene || originalScene.__openingAssaultInstalled) return;
    // Keep the legacy opening intact. The chapter-specific encounter is an explicit
    // playable route from the opening, so existing saves, story flags and class-gated
    // choices remain stable while every chapter gains a documented combat encounter.
    const continuationId=originalStart+"__after_opening_assault";
    const continuation={...originalScene};
    continuation.title=(originalScene.title || "СЦЕНА")+" — ПОСЛЕ СТОЛКНОВЕНИЯ";
    continuation.text=(g)=>{
      const originalText=typeof originalScene.text === "function" ? originalScene.text(g) : (originalScene.text || "");
      return `Столкновение завершено. Проверь боезапас, состояние отряда и найденные следы. Победа сама по себе не доказывает принадлежность нападавших.\n\n${originalText}`;
    };
    continuation.choices=(Array.isArray(originalScene.choices) ? originalScene.choices : []).filter(c=>c && c.goto!==combatId).map(c=>({...c}));
    delete continuation.combat;
    delete continuation.returnScene;
    delete continuation.victoryEffects;
    // The original opening has already applied its entry effects. Never replay them
    // merely because the player chose the optional encounter and returned afterward.
    delete continuation.effects;
    delete continuation.onEnter;
    delete continuation.check;
    delete continuation.auto;
    delete continuation.skipIf;
    delete continuation.skipTo;
    sc.scenes[continuationId]=continuation;
    const roleText=(g)=>g.character?.classId==="inquisitor"
      ? "Полномочия Инквизиции позволяют потребовать подчинения, но каждое обвинение должно опираться на факты."
      : g.character?.classId==="guardsman"
        ? "Дисциплина, укрытия и контроль боезапаса важнее героических жестов."
        : g.character?.classId==="spaceMarine"
          ? "Подготовка Астартес даёт тактическое преимущество, но не отменяет угрозу окружения и перекрёстного огня."
          : "Оцени обстановку, укрытия и возможный ущерб до того, как выбирать следующий шаг.";
    const hook=chapterHooks[id] || "Вооружённая группа перекрывает путь, используя обломки оборудования и тесноту помещения. Её принадлежность ещё предстоит установить.";
    sc.scenes[combatId]={
      title:"КОНТАКТ С ПРОТИВНИКОМ",
      text:(g)=>`Глава ${chapterNumber}. ${hook}\n\n${roleText(g)}\n\nЭто столкновение является частью авторской кампании. Победа влияет на ход операции, но сама по себе не доказывает происхождение сигнала или принадлежность нападавших.`,
      combat:enemy,
      returnScene:continuationId,
      victoryEffects:{xp:15}
    };
    const originalChoices=Array.isArray(originalScene.choices) ? originalScene.choices : [];
    originalScene.choices=[...originalChoices,{label:"Перехватить вооружённую группу и зачистить проход",goto:combatId}];
    originalScene.__openingAssaultInstalled=true;
  });
})();
