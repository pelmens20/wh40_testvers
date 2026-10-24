/* ============================================================
   UI / PANELS.JS — боковые и центральные панели
   ============================================================ */

function renderSide(){
  const c = GAME.character;
  return `
    <div class="panel">
      <div class="panel-head"><span>ЛИЧНОЕ ДОСЬЕ ОПЕРАТИВНИКА</span><span>${esc(c.icon)}</span></div>
      <div class="panel-body">
              <div style="position:relative">
          ${renderPortraitFull(c.presetId, c.icon, GAME._portraitPulse, c.classId)}
          ${(c._pendingTalentLevels && c._pendingTalentLevels.length > 0) ? `
            <button class="level-up-badge" data-goto-talents title="Уровень ${c._pendingTalentLevels[0]} — выбери талант">
              ★
            </button>
          ` : ""}
        </div>
        <div class="name-line">${esc(c.name)}</div>
        <div class="class-line">${esc(c.className)} // УРОВЕНЬ ${c.level}</div>
        <div style="margin-top:14px">
          <div class="small-row"><span>ЗДОРОВЬЕ</span><strong>${c.hp}/${c.maxHp}</strong></div>
          <div class="progress"><i style="width:${pct(c.hp,c.maxHp)}%"></i></div>
          <div class="small-row"><span>ОПЫТ</span><strong>${c.xp}/${c.nextXp}</strong></div>
          <div class="progress xp"><i style="width:${pct(c.xp,c.nextXp)}%"></i></div>
        </div>
        <div class="kpi" style="margin-top:12px">
          <div class="box"><div class="label">ЗАЩИТА</div><div class="value">${c.ac}</div></div>
          <div class="box"><div class="label">СУДЬБА</div><div class="value">${"●".repeat(c.fate)}${"○".repeat(c.maxFate-c.fate)}</div></div>
        </div>
        <div class="stat-grid">
          ${Object.keys(STAT_NAMES).map(k => `
            <div class="stat">
              <b>${STAT_NAMES[k]}</b>
              <span>${c.stats[k]} <small>(${statMod(c,k)})</small></span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>

    <div class="nav-label">РАЗДЕЛЫ ОПЕРАЦИИ</div>
  <div class="nav-group">
    ${navBtn("story","Хроника операции","▤")}
    ${navBtn("character","Досье агента","✠")}
    ${navBtn("development","Доктрина и повышение","★")}
    ${navBtn("squad","Свита и свидетели","✦")}
    ${navBtn("inventory","Личное имущество","▣")}
    ${navBtn("armory","Арсенал и снабжение","⚒")}
    ${navBtn("quests","Приказы","☰")}
    ${navBtn("operations","Полевые операции","⚑")}
    ${navBtn("investigation","Досье расследования","⌕")}
    ${navBtn("continuity","Хроника последствий","⚖")}
    ${navBtn("map","Карта сектора","◇")}
    ${navBtn("reputation","Отношения ведомств","⚖")}
    ${navBtn("abilities","Боевые доктрины","✦")}
    ${navBtn("journal","Журнал писца","⌘")}
    ${navBtn("codex","Имперский архив","☷")}
    ${navBtn("editor","Архивный конструктор","✎")}
  </div>

    <div class="nav-label">КАНАЛ СЛУЖЕБНОГО ДОСТУПА</div>
    <button class="nav-btn" data-action="save">▣ Зафиксировать состояние</button>
    <button class="nav-btn" data-action="slots">✠ Архивные слоты</button>
    <button class="nav-btn" data-action="export">⇩ Выгрузить архивную копию</button>
    <button class="nav-btn" data-action="import">⇧ Импортировать архив</button>
    <button class="nav-btn" data-action="lore">✠ Введение во вселенную 40K</button>
    <button class="nav-btn" data-action="tutorial">✦ Брифинг оперативника</button>
    <button class="nav-btn" data-action="help">? Инструкция службы</button>
    <button class="nav-btn" data-action="dialogue">▤ Связаться с персонажем</button>
  `;
}

function navBtn(view, label, icon){
  return `<button class="nav-btn ${GAME.view === view ? "active" : ""}" data-view="${view}">${icon} &nbsp; ${label}</button>`;
}

function renderRight(){
  const c = GAME.character;
  const metNPCs = Object.values(GAME.npcs || {}).filter(n => n.met);
  const flags = Object.entries(GAME.world.flags || {});

  // Шкала Порчи
  const corruption = c.corruption || 0;
  const stage = (typeof CORRUPTION_STAGES !== "undefined" && CORRUPTION_STAGES[corruption]) || {
    name: "ЧИСТ", color: "#7cb078", desc: "Варп не коснулся тебя."
  };
  const corruptCls = corruption >= 9 ? "corruption-high"
                  : corruption >= 6 ? "corruption-mid"
                  : corruption >= 3 ? "corruption-low"
                  : "";

  return `
    <div class="panel-drawer-mobile-head"><span>СОСТОЯНИЕ ПОЛЕВОГО ДОСЬЕ</span><button class="secondary-btn" type="button" data-close-panel="right">ЗАКРЫТЬ ×</button></div>
    <div class="panel">
      <div class="panel-head"><span>СТАТУС ОПЕРАТИВНИКА</span><span>${GAME.mode.toUpperCase()}</span></div>
      <div class="panel-body">
        <div style="margin-top:4px">
          ${(c.conditions || []).length
            ? c.conditions.map(x => `
                <span class="tag red condition-tag">
                  ${renderConditionIcon(x, "•", 20)} ${esc(x)}
                </span>
              `).join("")
            : `<span class="tag green">НЕТ СОСТОЯНИЙ</span>`}
        </div>
      </div>
    </div>

        ${typeof renderCompanionsPanel === "function" ? renderCompanionsPanel() : ""}
    ${typeof renderCampaignDirectorPanel === "function" ? renderCampaignDirectorPanel() : ""}

    <div class="panel" style="margin-top:12px">
      <div class="panel-head">
        <span>ПОРЧА ВАРПА</span>
        <span>${corruption}/10</span>
      </div>
      <div class="panel-body">
        <div class="small-row">
          <span>СТАДИЯ</span>
          <strong style="color:${stage.color}">${stage.name}</strong>
        </div>
        <div class="progress corruption-bar ${corruptCls}">
          <i style="width:${corruption*10}%; background:linear-gradient(90deg, ${stage.color}, ${stage.color}aa);"></i>
        </div>
        <div class="footer-note" style="margin-top:8px;color:${stage.color};">
          ${stage.desc}
        </div>
        <button class="secondary-btn" data-action="pray" style="width:100%;margin-top:12px" ${GAME.mode === "combat" || GAME.mode === "death" || GAME.mode === "dead" || GAME.mode === "corruption-end" || corruption <= 0 || c.lastPrayerDay === GAME.world.day ? "disabled" : ""}>
          ☩ МОЛИТЬСЯ
        </button>
        <div class="footer-note" style="margin-top:6px">${corruption <= 0 ? "Порча отсутствует." : c.lastPrayerDay === GAME.world.day ? "Сегодня молитва уже совершена." : "Вне боя · 1 попытка за игровой день · успех снимает 1 Порчу."}</div>
      </div>
    </div>

    <div class="panel" style="margin-top:12px">
      <div class="panel-head"><span>НИТИ</span><span>${GAME.world.clues}</span></div>
      <div class="panel-body">
        <div class="list">
          <div class="list-item"><b>Пропавшие рабочие</b><p>Следы ведут к закрытому сектору.</p></div>
          <div class="list-item"><b>Тревога</b><p>${GAME.world.heat}/10</p></div>
          <div class="list-item"><b>Боеприпасы</b><p>${hasItem("Патроны") ? (c.inventory.find(i=>i.name==="Патроны").qty) : 0}</p></div>
        </div>
      </div>
    </div>

        ${flags.length ? `
      <div class="panel" style="margin-top:12px">
        <div class="panel-head flags-head" data-toggle-flags>
          <span>ФЛАГИ · ${flags.length}</span>
          <span class="flags-toggle" id="flagsToggle">▸</span>
        </div>
        <div class="panel-body flags-body" id="flagsBody" style="display:none">
          <div style="font-size:10px;color:var(--muted);margin-bottom:8px;letter-spacing:1px;">
            ПОСЛЕДНИЕ 6
          </div>
          <div class="flags-list scrollable" style="max-height:260px;overflow-y:auto;padding-right:4px;">
            ${flags.map(([k,v]) => `
              <div class="flag-row">
                <span class="flag-dot"></span>
                <span class="flag-name">${esc(FLAG_REGISTRY[k] || k)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    ` : ""}

    ${metNPCs.length ? `
      <div class="panel" style="margin-top:12px">
        <div class="panel-head"><span>УСТАНОВЛЕННЫЕ КОНТАКТЫ</span><span>${metNPCs.length}</span></div>
        <div class="panel-body">
          <div class="list">
            ${metNPCs.map(n => `
              <div class="list-item npc-row">
                ${renderNPCAvatar(n.name, "☉", 44)}
                <div class="npc-text">
                  <b>${esc(n.name)}</b>
                  <p>${esc(n.role)}</p>
                  <p class="npc-relationship">${esc(npcRelationshipLabel(n.attitude))} · отношение ${n.attitude > 0 ? "+" : ""}${n.attitude}</p>
                  ${(availableRumors(n.name) || []).length ? `<small class="npc-rumor">Сведения: ${esc(availableRumors(n.name)[0].text)}</small>` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    ` : ""}

    <div class="footer-note">
      Все расчёты выполняются локально. Внешних сервисов нет.
    </div>
  `;
}

function renderCharacterView(){
  const c = GAME.character;

  // Fallback-значения, если поля не заданы
  const role = c.role || c.className;
  const organization = c.organization || ({
    inquisitor: "Инквизиция",
    guardsman: "Астра Милитарум",
    spaceMarine: "Караул Смерти"
  }[c.classId] || "Неизвестно");
  const mission = c.mission || "Расследовать исчезновения в секторе IX.";
  const relations = c.relations || "Пока ни с кем не связан.";
  const weakness = c.weakness || "Не определена.";
  const lore = c.lore || "Твоя история начинается здесь.";
  const hook = c.hook || "Прибыл в улей Хелдон-Прайм по приказу.";
  const quote = c.quote || "«Император видит».";
  return `
    <section class="panel">
      <div class="panel-head"><span>ПОЛНОЕ ДОСЬЕ ОПЕРАТИВНИКА</span><span>УРОВЕНЬ ${c.level}</span></div>
      <div class="panel-body">
        <div class="section-title">ОБЩИЕ ДАННЫЕ</div>
        <div class="kpi">
          <div class="box"><div class="label">ИМЯ</div><div class="value" style="font-size:16px">${esc(c.name)}</div></div>
          <div class="box"><div class="label">КЛАСС</div><div class="value" style="font-size:16px">${esc(c.className)}</div></div>
          <div class="box"><div class="label">ЗДОРОВЬЕ</div><div class="value">${c.hp}/${c.maxHp}</div></div>
          <div class="box"><div class="label">ЗАЩИТА</div><div class="value">${c.ac}</div></div>
        </div>

        <div class="section-title">ХАРАКТЕРИСТИКИ</div>
        <div class="stat-grid">
          ${Object.keys(STAT_NAMES).map(k => `
            <div class="stat">
              <b>${STAT_NAMES[k]}</b>
              <span>${c.stats[k]} (${statMod(c,k)})</span>
            </div>
          `).join("")}
        </div>

        <div class="section-title">СНАРЯЖЕНИЕ</div>
        <div class="list">
          <div class="list-item item-row">
            ${renderWeaponIcon(c.weapon, "✦", 40)}
            <div class="item-text">
              <b>Стрелковое</b>
              <p>${esc(c.weapon)}</p>
            </div>
          </div>
          <div class="list-item item-row">
            ${renderWeaponIcon(c.meleeWeapon || "Боевой нож", "⚔", 40)}
            <div class="item-text">
              <b>Ближний бой</b>
              <p>${esc(c.meleeWeapon || "Боевой нож")}</p>
            </div>
          </div>
          <div class="list-item item-row">
            ${renderItemIcon("Осколочная граната", "✱", 40)}
            <div class="item-text">
              <b>Гранаты</b>
              <p>Осколочных: ${c.grenades?.["Осколочная граната"]||0}, Крак: ${c.grenades?.["Крак-граната"]||0}, Дымовых: ${c.grenades?.["Дымовая граната"]||0}</p>
            </div>
          </div>
          <div class="list-item item-row">
            ${renderArmorIcon(c.armor.toLowerCase().replace(/ /g,"-"), "▣", 40)}
            <div class="item-text">
              <b>Броня</b>
              <p>${esc(c.armor)} · ЗАЩИТА ${c.ac}</p>
            </div>
          </div>
          <div class="list-item"><b>Судьба</b><p>${"●".repeat(c.fate)}${"○".repeat(c.maxFate-c.fate)}</p></div>
          <div class="list-item"><b>Ресурсы</b><p>${c.credits} кредитов</p></div>
        </div>

        <div class="section-title">ПРЕДЫСТОРИЯ</div>
        <div class="code-block">${esc(c.backstory || "Не указана.")}</div>

        <div class="section-title">РОЛЬ</div>
<div class="code-block">${esc(role)}</div>

<div class="section-title">ОРГАНИЗАЦИЯ</div>
<div class="code-block">${esc(organization)}</div>

<div class="section-title">МИССИЯ</div>
<div class="code-block">${esc(mission)}</div>

<div class="section-title">ЛОР</div>
<div class="code-block">${esc(lore)}</div>

<div class="section-title">ОТНОШЕНИЯ</div>
<div class="code-block">${esc(relations)}</div>

<div class="section-title">СЛАБОСТЬ</div>
<div class="code-block">${esc(weakness)}</div>

<div class="section-title">ЛИЧНЫЙ КРЮЧОК</div>
<div class="code-block">${esc(hook)}</div>

<div class="section-title">ФРАЗА</div>
<div class="code-block" style="font-style:italic">${esc(quote)}</div>
      </div>
    </section>
  `;
}

function renderInventory(){
  const c = GAME.character;
  const itemsDB = (typeof ITEMS !== "undefined") ? ITEMS : {};
  if(!c || !c.inventory) return `<section class="panel"><div class="panel-body"><div class="empty">Данные недоступны.</div></div></section>`;

  return `
    <section class="panel">
      <div class="panel-head"><span>ИНВЕНТАРЬ</span><span>${c.credits} КРЕД.</span></div>
      <div class="panel-body">
        <div class="section-title">ОРУЖИЕ</div>
        <div class="list">
          <div class="list-item item-row">
            ${renderWeaponIcon(c.weapon, "✦", 44)}
            <div class="item-text">
              <b>${esc(c.weapon)}</b>
              <p>${c.ammo[WEAPONS[c.weapon]?.ammoType]||0} боеприпасов.</p>
            </div>
          </div>
          <div class="list-item item-row">
            ${renderWeaponIcon(c.meleeWeapon || "Боевой нож", "⚔", 44)}
            <div class="item-text">
              <b>${esc(c.meleeWeapon || "Боевой нож")}</b>
              <p>Ближний бой.</p>
            </div>
          </div>
          <div class="list-item item-row">
            ${renderItemIcon("Осколочная граната", "✱", 44)}
            <div class="item-text">
              <b>Гранаты</b>
              <p>Осколочные: ${c.grenades?.["Осколочная граната"]||0} · Крак: ${c.grenades?.["Крак-граната"]||0} · Дымовые: ${c.grenades?.["Дымовая граната"]||0}</p>
            </div>
          </div>
        </div>

        <div class="section-title">БРОНЯ</div>
        <div class="list">
          <div class="list-item item-row">
            ${renderArmorIcon(c.armor.toLowerCase().replace(/ /g,"-"), "▣", 44)}
            <div class="item-text">
              <b>${esc(c.armor)}</b>
              <p>ЗАЩИТА ${c.ac}</p>
            </div>
          </div>
        </div>

        <div class="section-title">ПРЕДМЕТЫ</div>
        <div class="list">
          ${c.inventory.length
            ? c.inventory.map(i => `
                <div class="list-item item-row">
                  ${renderItemIcon(i.name, "▣", 44)}
                  <div class="item-text">
                    <b>${esc(i.name)} ×${i.qty}</b>
                    <p>${esc(itemsDB[i.name]?.description || "Предмет кампании.")}</p>
                    ${i.name === "Медикамент"   ? `<button class="secondary-btn" data-item="Медикамент"   style="margin-top:8px">ИСПОЛЬЗОВАТЬ</button>` : ""}
                    ${i.name === "Ремкомплект" ? `<button class="secondary-btn" data-item="Ремкомплект" style="margin-top:8px">ИСПОЛЬЗОВАТЬ</button>` : ""}
                    ${i.name === "Святая вода" ? `<button class="secondary-btn" data-item="Святая вода" style="margin-top:8px">ИСПОЛЬЗОВАТЬ</button>` : ""}
                  </div>
                </div>
              `).join("")
            : `<div class="empty">Инвентарь пуст.</div>`}
        </div>

        <div class="section-title">СОСТОЯНИЯ</div>
        <div class="list">
          ${(c.conditions || []).length
            ? c.conditions.map(n => {
                const cd = (typeof CONDITIONS !== "undefined") ? CONDITIONS[n] : null;
                return `
                  <div class="list-item item-row">
                    ${renderConditionIcon(n, cd?.icon || "•", 36)}
                    <div class="item-text">
                      <b>${esc(n)}</b>
                      <p>${esc(cd?.desc || "")}</p>
                    </div>
                  </div>
                `;
              }).join("")
            : `<div class="empty">Нет активных состояний.</div>`}
        </div>
      </div>
    </section>
  `;
}

function renderQuests(){
  const all = Object.values(GAME.quests || {});
  const visible = all.filter(q => q.status !== "hidden");
  return `
    <section class="panel">
      <div class="panel-head"><span>ЖУРНАЛ ЗАДАНИЙ</span><span>ДЕНЬ ${GAME.world.day}</span></div>
      <div class="panel-body">
        ${visible.length ? visible.map(q => {
          const state = q.completedObjectives || {};
          const keys = Array.isArray(q.objectiveKeys) ? q.objectiveKeys : [];
          const statusLabel = q.status === "complete" ? "ВЫПОЛНЕНО" : q.status === "failed" ? "ПРОВАЛЕНО" : "АКТИВНО";
          const statusClass = q.status === "complete" ? "green" : q.status === "failed" ? "red" : "gold";
          return `
          <div class="list-item" style="margin-bottom:10px">
            <b>${esc(q.title)} <span class="tag ${statusClass}">${statusLabel}</span></b>
            <p>${esc(q.description)}</p>
            ${q.status === "failed" && q.failedReason ? `<p class="quest-failure-reason" style="color:#d57a72">Причина: ${esc(q.failedReason)}</p>` : ""}
            <div class="progress xp"><i style="width:${pct(q.progress, q.objectives.length)}%"></i></div>
            ${q.objectives.map((objective,i) => {
              const key = keys[i];
              const objectiveState = key ? state[key] : (i < q.progress ? true : undefined);
              const isSkipped = objectiveState === "skipped";
              const isDone = objectiveState === true;
              const color = isDone ? "#8bb28b" : isSkipped ? "#ad9c7b" : "#6a645c";
              const marker = isDone ? "☑" : isSkipped ? "↷" : "☐";
              const suffix = isSkipped ? " <small>(обходной путь / не проверено)</small>" : "";
              return `<div style="font-size:12px;color:${color};margin-top:4px">${marker} ${esc(objective)}${suffix}</div>`;
            }).join("")}
          </div>`;
        }).join("") : `<div class="empty">Нет активных заданий.</div>`}
      </div>
    </section>
  `;
}
function renderMap(){
  const cells = (typeof getCurrentMapLocationEntries === "function" ? getCurrentMapLocationEntries() : Object.entries(LOCATIONS).map(([key,loc])=>({...loc,key}))).sort((a,b) => a.y - b.y || a.x - b.x);
  const current = LOCATIONS[GAME.character.location] || cells.find(l => l.key === GAME.character.location) || {};
  const currentLoc = current;
  const neighbors = cells.filter(l => l && currentLoc &&
    Math.abs(l.x - currentLoc.x) + Math.abs(l.y - currentLoc.y) === 1);
  const neighborNames = neighbors.map(n => n.key);

  // Определяем тип локации по названию
  function locType(name){
    if(/платформ/i.test(name)) return "docks";
    if(/административн/i.test(name)) return "archive";
    if(/нижний ярус/i.test(name)) return "tunnel";
    if(/ретрансляц/i.test(name)) return "node";
    if(/архив передачи/i.test(name)) return "archive";
    if(/карантин/i.test(name)) return "sealed";
    if(/галерея техников/i.test(name)) return "tech";
    if(/доки/i.test(name))    return "docks";
    if(/казарм/i.test(name))  return "barracks";
    if(/рынок/i.test(name))   return "market";
    if(/храм|часовн/i.test(name)) return "temple";
    if(/промзона|промышл/i.test(name)) return "promzone";
    if(/архив/i.test(name))   return "archive";
    if(/техно/i.test(name))   return "tech";
    if(/запретн/i.test(name)) return "forbidden";
    if(/туннель/i.test(name)) return "tunnel";
    if(/морг/i.test(name))    return "morgue";
    if(/узел/i.test(name))    return "node";
    if(/лифт/i.test(name))    return "lift";
    if(/катакомб/i.test(name))return "catacombs";
    if(/склад/i.test(name))   return "warehouse";
    if(/сервитор/i.test(name))return "servitorium";
    if(/запечатан/i.test(name)) return "sealed";
    return "default";
  }

  // Соседи по направлениям
  function neighborDir(dx, dy){
  return neighbors.find(n => n && n.x === currentLoc.x + dx && n.y === currentLoc.y + dy);
}
  const north = neighborDir(0, -1);
  const south = neighborDir(0, 1);
  const west  = neighborDir(-1, 0);
  const east  = neighborDir(1, 0);
  const canTravel = n => Boolean(n && (typeof isLocationAccessible !== "function" || isLocationAccessible(n.key)));
  const directionButton = (n, direction, label) => {
    const allowed=canTravel(n), lockReason=n && !allowed && typeof getLocationGateReason === "function" ? getLocationGateReason(n.key) : "";
    return `<button class="dir-btn ${n&&allowed?"":"disabled"}" ${n&&allowed?`data-location="${esc(n.key)}"`:"disabled"}>${direction}<small>${n?esc(n.name):"—"}${lockReason?` · ${esc(lockReason)}`:""}</small></button>`;
  };

  return `
    <section class="panel">
      <div class="panel-head">
        <span>СХЕМА УЛЬЯ</span>
        <span>${cells.filter(l => GAME.character.discovered.includes(l.key)).length}/${cells.length} СЕКТОРОВ</span>
      </div>
      <div class="panel-body">
        <div class="map-info">
          <div class="map-current">
            <span class="map-label">ТЕКУЩАЯ ЛОКАЦИЯ</span>
            <strong>${esc(current.name || GAME.character.location)}</strong>
            <span class="map-desc">${esc(String(current.desc || "Региональный узел карты.").slice(0,120))}…</span>
          </div>
        </div>

        <div class="map-directions">
          ${directionButton(north,"↑ СЕВЕР","north")}
          <div class="dir-row">
            ${directionButton(west,"← ЗАПАД","west")}
            <div class="dir-center">${esc(GAME.character.location.slice(0,8))}</div>
            ${directionButton(east,"ВОСТОК →","east")}
          </div>
          ${directionButton(south,"↓ ЮГ","south")}
        </div>

        <div class="section-title" style="margin-top:16px">КАРТА СЕКТОРОВ</div>
        <div class="map">
          ${cells.map(l => {
            const rev = GAME.character.discovered.includes(l.key);
            const cur = GAME.character.location === l.key;
            const neighbor = neighborNames.includes(l.key);
            const canMove = neighbor && (typeof isLocationAccessible !== "function" || isLocationAccessible(l.key));

            let cls = "map-cell map-type-" + locType(l.name);
            if(rev) cls += " revealed";
            if(cur) cls += " current";
            if(canMove) cls += " reachable";

            return `
              <div class="${cls}" data-location="${esc(l.key)}" ${canMove ? "" : "style='cursor:default'"}>
                ${rev
                  ? `<div class="title">${esc(l.name)}${cur ? " ●" : ""}</div>
                     <div class="desc">${esc(l.desc).slice(0,80)}…</div>
                     ${canMove ? `<div class="map-action">→ ПЕРЕЙТИ</div>` : ""}`
                  : canMove ? `<div class="title">НЕИЗВЕДАННЫЙ РАЙОН</div><div class="desc">${esc(l.name)} · данные неполны</div><div class="map-action">→ РАЗВЕДАТЬ</div>`
                  : !isLocationAccessible(l.key) ? `<div class="hidden-cell">⛨</div><div class="desc">МАРШРУТ ЗАКРЫТ</div>` : `<div class="hidden-cell">?</div>`}
              </div>
            `;
          }).join("")}
        </div>
        <div class="footer-note">
          ● — текущая локация. Соседние неизведанные районы можно разведать переходом; запечатанные зоны требуют сюжетного основания. Кнопки сверху — быстрый переход по сторонам света.
          ${GAME.campaign?.sceneId ? `<br><br>Текущая сцена: <b>${esc(GAME.campaign.sceneId)}</b>. Сюжетные переходы — через Хронику.` : ""}
        </div>
      </div>
    </section>
    ${typeof renderExpansionExploration === "function" ? renderExpansionExploration() : ""}
  `;
}

function renderReputation(){
  const r = GAME.character.reputation;
  return `
    <section class="panel">
      <div class="panel-head"><span>РЕПУТАЦИЯ</span><span>ЛОКАЛЬНОЕ ПОКАЗАНИЕ</span></div>
      <div class="panel-body">
        <div class="list">
          ${Object.entries(r).map(([f,v]) => {
            const desc = (typeof FACTION_DESCRIPTIONS !== "undefined" && FACTION_DESCRIPTIONS[f]) || "";
            return `
              <div class="list-item faction-row">
                ${renderFactionIcon(f, "⚜", 40)}
                <div class="faction-text">
                  <b>${esc(FACTION_NAMES_RU[f] || f)}</b>
                  <p style="color:${v > 0 ? "#8fb391" : v < 0 ? "#bd706a" : "#aaa"}">
                    ${v > 0 ? "+" : ""}${v} · ${repLevel(v)}
                  </p>
                  ${desc ? `<small style="color:#6a645c;font-size:10px;line-height:1.5;display:block;margin-top:4px;">${esc(desc)}</small>` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderAbilities() {
  const c = GAME.character;
  const tree = TALENT_TREES[c.classId];
  if (!tree) {
    return `<section class="panel"><div class="panel-body"><div class="empty">Дерево талантов недоступно.</div></div></section>`;
  }

  const nextLevels = TALENT_LEVELS.filter(l => l > c.level);
  const nextLevel = nextLevels[0] || null;
  const available = getAvailableTalents();

  return `
    <section class="panel">
      <div class="panel-head">
        <span>ДЕРЕВО ТАЛАНТОВ</span>
        <span>УРОВЕНЬ ${c.level}</span>
      </div>
      <div class="panel-body">

        <div class="section-title">СПОСОБНОСТИ КЛАССА</div>
        <div class="list">
          ${c.abilities.map(a => `
            <div class="list-item">
              <b>✦ ${esc(a)}</b>
              <p>Особенность класса.</p>
            </div>
          `).join("")}
        </div>

        <div class="section-title">ВЕТКИ РАЗВИТИЯ</div>
        ${Object.entries(tree.branches).map(([key, branch]) => {
          const taken = c.branches[key] || 0;
          const hasSpec = taken >= 3;
          return `
            <div class="talent-branch">
              <div class="branch-head">
                <span class="branch-icon">${esc(branch.icon)}</span>
                <div class="branch-title">
                  <b>${esc(branch.name)}</b>
                  <small>${taken}/6 талантов${hasSpec ? " · СПЕЦИАЛИЗАЦИЯ" : ""}</small>
                </div>
              </div>
              <p class="branch-desc">${esc(branch.description)}</p>

              ${hasSpec ? `
                <div class="branch-spec">
                  <b>★ ${esc(branch.specialization.name)}</b>
                  <p>${esc(branch.specialization.desc)}</p>
                </div>
              ` : ""}

              <div class="branch-nodes">
                ${branch.nodes.map(node => {
                  const isTaken = c.talents.includes(node.id);
                  const canTake = isTalentAvailable(node);
                  const cls = isTaken ? "taken" : canTake ? "available" : "locked";
                  return `
                    <div class="talent-node ${cls}">
                      <div class="talent-node-head">
                        <b>${esc(node.name)}</b>
                        <span class="talent-level">Ур. ${node.level}</span>
                      </div>
                      <p>${esc(node.desc)}</p>
                      ${node.type === "active" ? `<span class="tag gold">АКТИВНЫЙ</span>` : `<span class="tag">ПАССИВНЫЙ</span>`}
                      ${canTake ? `<button class="secondary-btn" data-talent="${node.id}" style="margin-top:8px">ВЗЯТЬ</button>` : ""}
                      ${isTaken ? `<div class="talent-taken-mark">✓ ВЗЯТ</div>` : ""}
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          `;
        }).join("")}

        ${nextLevel ? `
          <div class="footer-note" style="margin-top:16px">
            Следующий выбор таланта — на уровне ${nextLevel}.
          </div>
        ` : `
          <div class="footer-note" style="margin-top:16px">
            Все таланты доступны на вашем уровне. Продолжайте развиваться.
          </div>
        `}
      </div>
    </section>
  `;
}

function renderJournal(){
  const j = GAME.journal || [];
  return `
    <section class="panel">
      <div class="panel-head"><span>ЖУРНАЛ ПОЛЕВОГО ПИСЦА</span><span>${j.length}</span></div>
      <div class="panel-body">
        <div class="list scrollable" style="max-height:70vh">
          ${j.length ? j.slice().reverse().map(e => `
            <div class="list-item">
              <b>${esc(String(e.kind).toUpperCase())} · день ${e.day}, ${esc(e.time)}</b>
              <p>${esc(journalLine(e))}</p>
            </div>
          `).join("") : `<div class="empty">Записи пока не внесены.</div>`}
        </div>
      </div>
    </section>
  `;
}

/* ============================================================
   ПАНЕЛЬ СПУТНИКОВ
   ============================================================ */
function renderCompanionsPanel(){
  const list = GAME.companions || [];
  if(!list.length) return "";

  return `
    <div class="panel" style="margin-top:12px">
      <div class="panel-head">
        <span>СВИТА И СОЮЗНИКИ</span>
        <span>${list.length}</span>
      </div>
      <div class="panel-body">
        <div class="list">
          ${list.map(c => {
            // Утилитарные спутники (сервочереп) — отдельная карточка
            if (c.utility) {
              return `
                <div class="list-item companion-card companion-utility">
                  <div class="companion-header">
                    <span class="companion-icon">${esc(c.icon)}</span>
                    <div class="companion-name">
                      <b>${esc(c.name)}</b>
                      <small>${esc(c.role)}</small>
                    </div>
                  </div>
                  <div class="companion-utility-bonus">
                    ${c.passiveBonus?.int ? `+${c.passiveBonus.int} INT` : ""}
                    ${c.passiveBonus?.ac ? ` · +${c.passiveBonus.ac} AC` : ""}
                  </div>
                  <p class="companion-utility-note">В бою не сражается. Ауспик непрерывно сканирует окружение.</p>
                </div>
              `;
            }
            // Боевые спутники (Лира)
            return `
              <div class="list-item companion-card ${c.wounded ? "companion-wounded" : ""}">
                <div class="companion-header">
                  <span class="companion-icon">${esc(c.icon)}</span>
                  <div class="companion-name">
                    <b>${esc(c.name)}</b>
                    <small>${esc(c.role)}</small>
                  </div>
                </div>
                ${c.wounded
                  ? `<p style="color:#d98076;">Ранена. Восстановление: ${c.recoveryTurns} сцен.</p>`
                  : `
                    <div class="small-row"><span>ЗДОРОВЬЕ</span><strong>${c.hp}/${c.maxHp}</strong></div>
                    <div class="progress"><i style="width:${Math.max(0, (c.hp/c.maxHp)*100)}%"></i></div>
                    <div class="small-row" style="margin-top:6px"><span>ЗАЩИТА</span><strong>${c.ac}</strong></div>
                  `
                }
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function journalLine(e){
  switch(e.kind){
    case "scene":  return `Сцена: ${e.title}`;
    case "roll":   return `${e.label}: d20=${e.d20} итог=${e.total} DC=${e.dc} → ${resultText(e.result)}`;
    case "combat": return `Бой: ${e.event}${e.enemy ? ` (${e.enemy})` : ""}`;
    case "item":   return `Предмет: ${e.event} ${e.name}`;
    case "quest":  return `Задание ${e.questId}: ${e.event || e.step}`;
    case "npc":    return `Контакт ${e.name}: ${e.event}`;
    case "move":   return `Переход: ${e.from} → ${e.to}`;
    case "flag":   return `Флаг ${e.key} = ${e.value}`;
    case "choice": return `Решение: ${e.label}`;
    case "clue":   return `Зацепка +${e.delta} (всего ${e.total})`;
    case "evidence": return `Улика внесена в досье: ${e.title || e.evidenceId}`;
    case "deduction": return `Вывод зафиксирован: ${e.title} (${e.status})`;
    default:       return JSON.stringify(e);
  }
}
/* ============================================================
   КОДЕКС — ЛЕТОПИСЬ ИНКВИЗИТОРА
   ------------------------------------------------------------
   Автоматическая хроника: сцены, броски, бои, находки, решения.
   Данные берутся из GAME.journal.
   ============================================================ */
function renderChronicle() {
  if (!GAME.journal || !Array.isArray(GAME.journal)) {
    return `<div class="empty">Летопись пуста.</div>`;
  }

  const filter = GAME._chronicleFilter || "all";

  // Расширенная таблица фильтров
  const typeMap = {
    all:      { label: "ВСЁ",       kinds: null },
    scenes:   { label: "СЦЕНЫ",     kinds: ["scene"] },
    combat:   { label: "БОИ",       kinds: ["combat", "enemy_killed"] },
    dialogue: { label: "ДИАЛОГИ",   kinds: ["npc_attitude", "choice"] },
    loot:     { label: "НАХОДКИ",   kinds: ["item", "clue", "quest"] },
    choices:  { label: "РЕШЕНИЯ",   kinds: ["choice"] }
  };

  const active = typeMap[filter] || typeMap.all;
  const kindsFilter = active.kinds;

  // Фильтруем
  let entries = [...GAME.journal].reverse();
  if (kindsFilter) {
    entries = entries.filter(e => kindsFilter.includes(e.kind));
  }

  // Ограничиваем 500 записями для производительности
  entries = entries.slice(0, 500);

  // Иконки и классы для каждого типа
  const typeStyle = (kind) => {
    switch (kind) {
      case "scene":          return { icon: "▤", cls: "chr-scene" };
      case "roll":           return { icon: "🎲", cls: "chr-roll" };
      case "combat":         return { icon: "⚔", cls: "chr-combat" };
      case "enemy_killed":   return { icon: "☠", cls: "chr-kill" };
      case "item":           return { icon: "▣", cls: "chr-item" };
      case "quest":          return { icon: "☰", cls: "chr-quest" };
      case "quest_progress": return { icon: "☰", cls: "chr-quest" };
      case "quest_completed":return { icon: "★", cls: "chr-quest-done" };
      case "npc":            return { icon: "☉", cls: "chr-npc" };
      case "move":           return { icon: "↦", cls: "chr-move" };
      case "clue":           return { icon: "✦", cls: "chr-clue" };
      case "flag":           return { icon: "⚑", cls: "chr-flag" };
      case "choice":         return { icon: "◆", cls: "chr-choice" };
      default:               return { icon: "·", cls: "chr-default" };
    }
  };

  // Красивая метка типа
  const typeLabel = (kind) => ({
    scene:           "СЦЕНА",
    roll:            "БРОСОК",
    combat:          "БОЙ",
    enemy_killed:    "УБИЙСТВО",
    item:            "ПРЕДМЕТ",
    quest:           "ЗАДАНИЕ",
    quest_progress:  "ЗАДАНИЕ",
    quest_completed: "ЗАДАНИЕ ВЫПОЛНЕНО",
    npc:             "ОТНОШЕНИЯ",
    move:            "ПЕРЕХОД",
    clue:            "ЗАЦЕПКА",
    flag:            "СОБЫТИЕ",
    choice:          "РЕШЕНИЕ"
  }[kind] || kind.toUpperCase());

  const total = GAME.journal.length;

  return `
    <div class="chronicle-progress">
      Всего записей: <b>${total}</b> · Показано: <b>${entries.length}</b>
    </div>

    <div class="chronicle-filters">
      ${Object.entries(typeMap).map(([key, val]) => `
        <button class="chronicle-filter ${filter === key ? "active" : ""}" data-chronicle-filter="${key}">
          ${esc(val.label)}
        </button>
      `).join("")}
    </div>

    ${entries.length ? `
      <div class="chronicle-list">
        ${entries.map(e => {
          const style = typeStyle(e.kind);
          const line = (typeof journalLine === "function") ? journalLine(e) : "";
          return `
            <div class="chronicle-entry ${style.cls}">
              <div class="chronicle-meta">
                <span class="chronicle-icon">${style.icon}</span>
                <span class="chronicle-day">День ${e.day}</span>
                <span class="chronicle-time">${esc(e.time)}</span>
                <span class="chronicle-kind">${esc(typeLabel(e.kind))}</span>
              </div>
              <div class="chronicle-text">${esc(line)}</div>
            </div>
          `;
        }).join("")}
      </div>
    ` : `<div class="empty">В этом разделе записей нет.</div>`}
  `;
}
/* ============================================================
   КОДЕКС — БЕСТИАРИЙ (характеристики врагов)
   ============================================================ */
function renderBestiary() {
  if (typeof ENEMIES === "undefined") {
    return `<div class="empty">Данные Бестиария недоступны.</div>`;
  }

  const seen = GAME.world?.seenEnemies || {};
  const allTypes = Object.keys(ENEMIES);

  const seenCount = allTypes.filter(t => seen[t]).length;
  const totalCount = allTypes.length;

  const renderEnemyRow = (type) => {
    const def = ENEMIES[type];
    const isSeen = !!seen[type];

    // Определяем «роль» врага по типу — для цветовой полосы
    const isDaemon = /horror|flamer|screamer|warpEcho|corruptedMarine/.test(type);
    const isMarine = /marine/.test(type);
    const isHuman  = /cultist|renegade|pdf|servo|ork/.test(type);

    const rowClass = isDaemon ? "bestiary-daemon"
                   : isMarine ? "bestiary-marine"
                   : isHuman  ? "bestiary-human"
                   : "bestiary-unknown";

    const threatLabel = isDaemon ? "ДЕМОН"
                      : isMarine ? "АСТАРТЕС"
                      : isHuman  ? "СМЕРТНЫЙ"
                      : "НЕИЗВЕСТНО";

    if (!isSeen) {
      return `
        <div class="bestiary-card ${rowClass} bestiary-locked">
          <div class="bestiary-head">
            <div class="bestiary-icon">?</div>
            <div class="bestiary-title">
              <b>НЕИЗВЕСТНАЯ УГРОЗА</b>
              <small>${threatLabel}</small>
            </div>
          </div>
          <div class="bestiary-locked-msg">Не встречался в бою. Данные отсутствуют.</div>
        </div>
      `;
    }

    const lootList = (def.loot || []).join(", ") || "—";
    const weaknesses = (def.weaknesses || []).join(", ") || "нет";
    const resistances = (def.resistances || []).join(", ") || "нет";

    return `
      <div class="bestiary-card ${rowClass}">
        <div class="bestiary-head">
          <div class="bestiary-icon">${renderEnemyAvatar(type, def.name.charAt(0), 52, false)}</div>
          <div class="bestiary-title">
            <b>${esc(def.name)}</b>
            <small>${threatLabel}</small>
          </div>
        </div>
        <div class="bestiary-stats">
          <div class="bestiary-stat"><span>ЗДОРОВЬЕ</span><b>${def.hp}</b></div>
          <div class="bestiary-stat"><span>ЗАЩИТА</span><b>${def.ac}</b></div>
          <div class="bestiary-stat"><span>АТАКА</span><b>+${def.attack}</b></div>
          <div class="bestiary-stat"><span>УРОН</span><b>${def.dmg}</b></div>
        </div>
        <div class="bestiary-meta">
          <div><span>Слабости:</span> ${esc(weaknesses)}</div>
          <div><span>Сопротивления:</span> ${esc(resistances)}</div>
          <div><span>Добыча:</span> ${esc(lootList)}</div>
          <div><span>ОПЫТ ЗА ПОБЕДУ:</span> ${def.xp}</div>
        </div>
        ${def.desc ? `<p class="bestiary-desc">${esc(def.desc)}</p>` : ""}
      </div>
    `;
  };

  // Группировка: сначала смертные, потом демоны/астартес
  const sortedTypes = [...allTypes].sort((a, b) => {
    const rank = (t) => {
      if (/cultist|renegade|pdf|ork/.test(t)) return 1;
      if (/servo/.test(t)) return 2;
      if (/horror|flamer|screamer|warpEcho/.test(t)) return 3;
      if (/marine|corruptedMarine/.test(t)) return 4;
      return 5;
    };
    return rank(a) - rank(b);
  });

  return `
    <div class="bestiary-progress">
      Изучено: <b>${seenCount}</b> из <b>${totalCount}</b> угроз
    </div>
    <div class="codex-grid">
      ${sortedTypes.map(t => renderEnemyRow(t)).join("")}
    </div>
  `;
}
function renderCodex() {
  if (typeof CODEX === "undefined") {
    return `<section class="panel"><div class="panel-body"><div class="empty">Кодекс недоступен.</div></div></section>`;
  }

  const tab = GAME._codexTab || "factions";

  // Динамические персонажи (без изменений из старой версии)
  const dynamicCharacters = () => {
    const list = [];
    if (GAME.character) {
      const c = GAME.character;
      list.push({
        icon: c.icon,
        name: c.name,
        role: c.className,
        desc: c.backstory || "Твой герой."
      });
    }
    if (GAME.npcs) {
      Object.values(GAME.npcs).forEach(n => {
        if (n.met) {
          list.push({
            icon: n.avatar ? "◆" : "☉",
            name: n.name,
            role: n.role,
            desc: n.secret || "Ты уже встречался с этим человеком."
          });
        }
      });
    }
    return list;
  };

  const sections = {
    factions:   { title: "ФРАКЦИИ",    data: CODEX.factions },
    terms:      { title: "ТЕРМИНЫ",    data: CODEX.terms },
    characters: { title: "ПЕРСОНАЖИ",  data: dynamicCharacters() },
    enemies:    { title: "ВРАГИ",      data: CODEX.enemies },
    bestiary:   { title: "БЕСТИАРИЙ",  custom: "bestiary" },
    chronicle:  { title: "ЛЕТОПИСЬ",   custom: "chronicle" },
    legions:    { title: "ЛЕГИОНЫ",    custom: "legions" },
    inquisition:{ title: "ОРДО ИНКВИЗИЦИИ", custom: "inquisition" },
    chaosGods:  { title: "БОГИ ХАОСА", custom: "chaosGods" },
    settings:   { title: "ПАРАМЕТРЫ СЛУЖБЫ",  custom: "settings" },
    assets:     { title: "АРХИВ ВИЗУАЛЬНЫХ РЕСУРСОВ", custom: "assets" }
  };

  const current = sections[tab] || sections.factions;

  return `
    <section class="panel">
      <div class="panel-head">
        <span>КОДЕКС</span>
        <span>${esc(current.title)}</span>
      </div>
      <div class="panel-body">
      <div class="codex-tabs">
          <button class="codex-tab ${tab === "factions"   ? "active" : ""}" data-codex-tab="factions">ФРАКЦИИ</button>
          <button class="codex-tab ${tab === "terms"      ? "active" : ""}" data-codex-tab="terms">ТЕРМИНЫ</button>
          <button class="codex-tab ${tab === "characters" ? "active" : ""}" data-codex-tab="characters">ПЕРСОНАЖИ</button>
          <button class="codex-tab ${tab === "enemies"    ? "active" : ""}" data-codex-tab="enemies">ВРАГИ</button>
                    <button class="codex-tab ${tab === "bestiary"   ? "active" : ""}" data-codex-tab="bestiary">БЕСТИАРИЙ</button>
          <button class="codex-tab ${tab === "chronicle"  ? "active" : ""}" data-codex-tab="chronicle">ЛЕТОПИСЬ</button>
          <button class="codex-tab ${tab === "legions"    ? "active" : ""}" data-codex-tab="legions">ЛЕГИОНЫ</button>
          <button class="codex-tab ${tab === "inquisition" ? "active" : ""}" data-codex-tab="inquisition">ОРДО ИНКВИЗИЦИИ</button>
          <button class="codex-tab ${tab === "chaosGods"  ? "active" : ""}" data-codex-tab="chaosGods">БОГИ ХАОСА</button>
          <button class="codex-tab ${tab === "settings"   ? "active" : ""}" data-codex-tab="settings">ПАРАМЕТРЫ СЛУЖБЫ</button>
          <button class="codex-tab ${tab === "assets"     ? "active" : ""}" data-codex-tab="assets">АРХИВ РЕСУРСОВ</button>
        </div>

        ${current.custom === "legions"   ? renderCodexLegions()   : ""}
        ${current.custom === "inquisition" ? renderCodexInquisition() : ""}
        ${current.custom === "chronicle" ? renderChronicle()      : ""}
        ${current.custom === "chaosGods" ? renderCodexChaosGods() : ""}
        ${current.custom === "bestiary"  ? renderBestiary()       : ""}
        ${current.custom === "settings"  ? renderSettings()       : ""}
        ${current.custom === "assets"    ? renderAssetArchive()   : ""}
        ${!current.custom ? `
          <div class="codex-list">
            ${current.data.map(entry => `
              <div class="codex-entry">
                <div class="codex-icon">${esc(entry.icon || "◆")}</div>
                <div class="codex-text">
                  <b>${esc(entry.name)}</b>
                  ${entry.role ? `<small>${esc(entry.role)}</small>` : ""}
                  <p>${esc(entry.desc)}</p>
                </div>
              </div>
            `).join("")}
          </div>
        ` : ""}
      </div>
    </section>
  `;
}
/* ============================================================
   АРХИВ РЕСУРСОВ — полный перечень известных пользовательских медиафайлов.
   Недоступные пути показываются как отсутствующие и не запрашиваются браузером.
   ============================================================ */
function renderAssetArchive(){
  const entries = Array.isArray(ASSET_INVENTORY) ? ASSET_INVENTORY : [];
  const category = GAME._assetArchiveCategory || "all";
  const query = String(GAME._assetArchiveQuery || "").trim().toLocaleLowerCase("ru");
  const available = (typeof window !== "undefined" && window.ASSET_AVAILABLE_FILES instanceof Set) ? window.ASSET_AVAILABLE_FILES : new Set();
  const names = {
    all:"Все ресурсы", armor:"Броня", audio:"Звук", backgrounds:"Фоны", branding:"Знаки и печати",
    "avatars/enemy":"Аватары врагов", "avatars/npc":"Аватары NPC", "chaos-gods":"Боги Хаоса",
    classes:"Классы", "classes-icons":"Иконки классов", conditions:"Состояния", factions:"Фракции",
    inquisition:"Ордо Инквизиции", "items":"Предметы", "legions/loyalist":"Лояльные легионы",
    "legions/traitor":"Легионы-предатели", portraits:"Портреты", scenes:"Сцены", weapons:"Оружие"
  };
  const stats = typeof assetInventoryStats === "function" ? assetInventoryStats() : {expected:entries.length,images:entries.filter(x=>x.type==="image").length,audio:entries.filter(x=>x.type==="audio").length,available:available.size,missing:0};
  const filtered = entries.filter(item => (category === "all" || item.category === category) && (!query || `${item.name} ${item.path} ${item.purpose} ${item.category}`.toLocaleLowerCase("ru").includes(query)));
  const categoryKeys = ["all", ...Array.from(new Set(entries.map(x=>x.category))).sort((a,b)=>(names[a]||a).localeCompare(names[b]||b,"ru"))];
  const cards = filtered.map(item => {
    const exists = available.has(item.path);
    const categoryName = names[item.category] || item.category;
    const media = item.type === "audio"
      ? (exists ? `<audio controls preload="none" src="${esc(item.path)}">Ваш браузер не поддерживает локальное аудио.</audio>` : `<div class="asset-card-empty">АУДИО НЕ ИМПОРТИРОВАНО</div>`)
      : (exists ? `<div class="asset-card-media"><img data-asset-img src="${esc(item.path)}" alt="${esc(item.name)}" loading="lazy" decoding="async"><div class="asset-card-empty" hidden>ФАЙЛ НЕ ПРОЧИТАН</div></div>` : `<div class="asset-card-empty"><span>⛨</span>РЕСУРС ОТСУТСТВУЕТ<br><small>Импортируйте папку assets</small></div>`);
    return `<article class="asset-record ${exists ? "asset-present" : "asset-missing"}" data-asset-record="${esc(item.path)}"><div class="asset-record-media">${media}</div><div class="asset-record-copy"><b>${esc(item.name)}</b><small>${esc(categoryName)} · ${exists ? "ДОСТУПЕН" : "ОЖИДАЕТ ИМПОРТА"}</small><p>${esc(item.purpose || "Локальный ресурс игры")}</p><code>${esc(item.path)}</code></div></article>`;
  }).join("");
  const importStatus = (typeof window !== "undefined" && window.ASSET_IMPORT_STATUS) || {};
  return `
    <section class="asset-archive">
      <div class="asset-archive-brief"><div><b>АРХИВ ИЗОБРАЖЕНИЙ И АУДИО</b><p>Единый реестр пользовательских ресурсов. Недоступные файлы не загружаются в фоне и не вызывают лишние 404.</p></div><div class="asset-archive-stats"><strong>${stats.available}/${stats.expected}</strong><small>ресурсов доступны</small><span>${stats.images} изображений · ${stats.audio} аудиотем</span></div></div>
      ${importStatus.source && importStatus.source !== "packaged-assets" ? `<div class="asset-archive-import-note">ИСТОЧНИК: ${esc(importStatus.source)} · СКОПИРОВАНО: ${Number(importStatus.copiedFromSource)||0} · ОЖИДАЕТ ФАЙЛОВ: ${Number(importStatus.missing)||0}</div>` : `<div class="asset-archive-import-note">Если часть файлов отсутствует, запустите IMPORT_ASSETS.bat или start_game.bat из каталога релиза на ПК с оригинальной папкой assets.</div>`}
      <form class="asset-archive-search" data-asset-search-form><label for="assetArchiveSearch">ПОИСК ПО ИМЕНИ, ПУТИ ИЛИ НАЗНАЧЕНИЮ</label><div><input id="assetArchiveSearch" data-asset-search-input value="${esc(GAME._assetArchiveQuery || "")}" placeholder="Например: портрет, храм, болтер…"><button class="secondary-btn" type="submit">НАЙТИ</button><button class="secondary-btn" type="button" data-asset-clear-search>СБРОСИТЬ</button></div></form>
      <div class="asset-archive-categories">${categoryKeys.map(key=>`<button type="button" class="codex-tab ${category===key?"active":""}" data-asset-category="${esc(key)}">${esc(names[key]||key)}</button>`).join("")}</div>
      <div class="asset-archive-result-count">ПОКАЗАНО: ${filtered.length} ИЗ ${entries.length}</div>
      ${filtered.length ? `<div class="asset-archive-grid">${cards}</div>` : `<div class="empty">По заданным условиям ресурсы не найдены.</div>`}
    </section>
  `;
}

/* ============================================================
   КОДЕКС — единая карточка для всех вкладок
   ============================================================ */
function renderCodexCard(entry) {
  const icon = entry.icon || "◆";
  const hasImage = !!entry.imageUrl;

  const iconHtml = hasImage
    ? `<img class="codex-card-img" src="${esc(entry.imageUrl)}" alt="${esc(entry.name)}" loading="lazy">`
    : `<div class="codex-card-icon">${esc(icon)}</div>`;

  return `
    <div class="codex-card">
      <div class="codex-card-head">
        ${iconHtml}
        <div class="codex-card-title">
          <b>${esc(entry.name)}</b>
          ${entry.role ? `<small>${esc(entry.role)}</small>` : ""}
          ${entry.status ? `<span class="codex-card-status">${esc(entry.status)}</span>` : ""}
        </div>
      </div>
      <p>${esc(entry.desc)}</p>
      ${entry.note ? `<div class="codex-card-note"><b>·</b> ${esc(entry.note)}</div>` : ""}
    </div>
  `;
}

/* ============================================================
   КОДЕКС — Легионы (карточки с картинками)
   ============================================================ */
function renderCodexLegions() {
  if (typeof CODEX_LEGIONS === "undefined") return `<div class="empty">Данные недоступны.</div>`;

  const renderLegion = (legion, category) => {
    const src = (typeof getAsset === "function") ? getAsset(category, legion.id) : null;
    const ok = !!src;

    const imgHtml = ok
      ? `<img class="codex-card-img" src="${esc(src)}" alt="${esc(legion.name)}" loading="lazy">`
      : `<div class="codex-card-icon">${esc(legion.number)}</div>`;

    const traitorCls = category === "traitorLegions" ? "traitor" : "loyalist";

    return `
      <div class="codex-card ${traitorCls}">
        <div class="codex-card-head">
          ${imgHtml}
          <div class="codex-card-title">
            <b>${esc(legion.name)}</b>
            <small>${esc(legion.number)} Легион · ${esc(legion.status)}</small>
          </div>
        </div>
        <div class="codex-card-meta">
          <div><span>Примарх:</span> ${esc(legion.primarch)}</div>
          <div><span>Родной мир:</span> ${esc(legion.homeworld)}</div>
        </div>
        <p>${esc(legion.desc)}</p>
        ${legion.secret ? `<div class="codex-card-note"><b>Тайна:</b> ${esc(legion.secret)}</div>` : ""}
      </div>
    `;
  };

  return `
    <div class="section-title">ЛОЯЛИСТЫ</div>
    <div class="codex-grid">
      ${CODEX_LEGIONS.loyalist.map(l => renderLegion(l, "loyalistLegions")).join("")}
    </div>

    <div class="section-title" style="margin-top:24px">ПРЕДАТЕЛИ</div>
    <div class="codex-grid">
      ${CODEX_LEGIONS.traitor.map(l => renderLegion(l, "traitorLegions")).join("")}
    </div>
  `;
}

/* ============================================================
   КОДЕКС — основные Ордо Инквизиции. Учебные справки; не утверждают,
   что каждое Ордо непосредственно участвует в авторской кампании.
   ============================================================ */
function renderCodexInquisition(){
  const entries = [
    {id:"ordo-hereticus", name:"Ордо Херетикус", title:"Ересь, мутации и угрозы Имперской вере", desc:"Расследует ереси, опасные культы и угрозы человеческому обществу внутри Империума.", note:"В рамках игры сведения свидетелей об ереси требуют проверки: подозрение не равно доказанной вине."},
    {id:"ordo-malleus", name:"Ордо Маллеус", title:"Демонические угрозы и варп-вторжения", desc:"Специализируется на угрозах, связанных с демонами и вторжениями из Варпа.", note:"Видение или необъяснимое событие само по себе не подтверждает, какой именно силе служит источник."},
    {id:"ordo-xenos", name:"Ордо Ксенос", title:"Ксеносы и нечеловеческие угрозы", desc:"Изучает и противодействует угрозам, исходящим от инопланетных видов и их технологий.", note:"Deathwatch — специализированная сила Астартес, действующая против ксеносов; это не синоним всех космодесантников."}
  ];
  return `<div class="codex-primer-note"><b>КАНОНИЧЕСКАЯ СПРАВКА</b><p>Это три наиболее известные крупные ветви Инквизиции. Их компетенции могут пересекаться; конкретные полномочия зависят от ситуации и полномочий действующего инквизитора.</p></div><div class="codex-grid">${entries.map(entry=>{
    const src = typeof getAsset === "function" ? getAsset("inquisition", entry.id) : null;
    return `<article class="codex-card inquisition-card"><div class="codex-card-head">${src ? `<img class="codex-card-img" src="${esc(src)}" alt="${esc(entry.name)}" loading="lazy" decoding="async">` : `<div class="codex-card-icon">⚖</div>`}<div class="codex-card-title"><b>${esc(entry.name)}</b><small>${esc(entry.title)}</small></div></div><p>${esc(entry.desc)}</p><div class="codex-card-note">${esc(entry.note)}</div></article>`;
  }).join("")}</div>`;
}

/* ============================================================
   КОДЕКС — Боги Хаоса (карточки с картинками)
   ============================================================ */
function renderCodexChaosGods() {
  if (typeof CODEX_CHAOS_GODS === "undefined") return `<div class="empty">Данные недоступны.</div>`;

  return `
    <div class="codex-grid">
      ${CODEX_CHAOS_GODS.map(god => {
        const src = (typeof getAsset === "function") ? getAsset("chaosGods", god.id) : null;
        const ok = !!src;

        const imgHtml = ok
          ? `<img class="codex-card-img" src="${esc(src)}" alt="${esc(god.name)}" loading="lazy">`
          : `<div class="codex-card-icon">${esc(god.name.charAt(0))}</div>`;

        return `
          <div class="codex-card god-${esc(god.id)}">
            <div class="codex-card-head">
              ${imgHtml}
              <div class="codex-card-title">
                <b>${esc(god.name)}</b>
                <small>${esc(god.title)}</small>
              </div>
            </div>
            <div class="codex-card-meta">
              <div><span>Домен:</span> ${esc(god.domain)}</div>
              <div><span>Последователи:</span> ${esc(god.followers)}</div>
            </div>
            <p>${esc(god.desc)}</p>
            ${god.note ? `<div class="codex-card-note">${esc(god.note)}</div>` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;
}
