/* ============================================================
   CAMPAIGN-DIRECTOR.JS — локальный слой состояния кампании
   Детерминированная система последствий без генеративного ИИ/сетевых API.
   ============================================================ */
const CAMPAIGN_DIRECTOR_DEFAULTS = Object.freeze({
  version: 1, threat: 22, order: 48, morale: 54, supplies: 68,
  choicesMade: 0, scenesVisited: 0, evidenceFound: 0, elapsedMinutes: 0,
  sceneVisits: {}, appliedSignals: {}, log: []
});

function normalizeCampaignDirectorState(world){
  if(!world || typeof world !== "object" || Array.isArray(world)) return null;
  let d = world.director;
  if(!d || typeof d !== "object" || Array.isArray(d)) d = {};
  const out = {...CAMPAIGN_DIRECTOR_DEFAULTS, ...d};
  for(const k of ["threat","order","morale","supplies"]) {
    const val = Number(out[k]);
    out[k] = Number.isFinite(val) ? Math.max(0, Math.min(100, Math.round(val))) : CAMPAIGN_DIRECTOR_DEFAULTS[k];
  }
  for(const k of ["choicesMade","scenesVisited","evidenceFound","elapsedMinutes"]) {
    const val = Number(out[k]);
    out[k] = Number.isFinite(val) ? Math.max(0, Math.floor(val)) : CAMPAIGN_DIRECTOR_DEFAULTS[k];
  }
  out.version = 1;
  out.sceneVisits = d.sceneVisits && typeof d.sceneVisits === "object" && !Array.isArray(d.sceneVisits) ? {...d.sceneVisits} : {};
  out.appliedSignals = d.appliedSignals && typeof d.appliedSignals === "object" && !Array.isArray(d.appliedSignals) ? {...d.appliedSignals} : {};
  const signalKeys = Object.keys(out.appliedSignals);
  if(signalKeys.length > 1500) for(const key of signalKeys.slice(0, signalKeys.length - 1500)) delete out.appliedSignals[key];
  out.log = Array.isArray(out.log) ? out.log.filter(e => e && typeof e === "object" && typeof e.text === "string").slice(-60) : [];
  world.director = out;
  return out;
}
function ensureCampaignDirectorState(){
  if(!GAME.world || typeof GAME.world !== "object") GAME.world = {};
  return normalizeCampaignDirectorState(GAME.world);
}
function campaignDirectorLog(text, type = "system", extra = {}){
  const d = ensureCampaignDirectorState();
  const item = {type:String(type || "system"), text:String(text || "").slice(0,320), day:GAME.world?.day || 1, time:typeof timeString === "function" ? timeString() : "--:--", chapter:GAME.campaign?.scenarioId || null, sceneId:GAME.campaign?.sceneId || null, ...extra};
  if(!item.text) return false;
  d.log.push(item); if(d.log.length > 60) d.log.splice(0, d.log.length - 60);
  return true;
}
function campaignDirectorAdjust(key, delta, reason, signalId = null){
  const d = ensureCampaignDirectorState();
  if(!["threat","order","morale","supplies"].includes(key)) return false;
  const n = Number(delta); if(!Number.isFinite(n) || n === 0) return false;
  if(signalId){
    const token = String(signalId).slice(0,240);
    if(d.appliedSignals[token]) return false;
    d.appliedSignals[token] = true;
  }
  const before = d[key]; d[key] = Math.max(0, Math.min(100, Math.round(before + n)));
  const actual = d[key] - before;
  if(actual !== 0){
    campaignDirectorLog(`${keyLabel(key)} ${actual > 0 ? "+" : ""}${actual}: ${String(reason || "событие операции")}`, "pressure", {key,delta:actual});
    if(typeof Bus !== "undefined") Bus.emit("campaign_pressure_changed", {key, delta:actual, value:d[key], reason:reason || "событие операции"});
  }
  return actual !== 0;
}
function keyLabel(key){return ({threat:"Угроза",order:"Контроль операции",morale:"Боевой дух",supplies:"Снабжение"})[key] || key;}
function campaignDirectorFirstSignal(token){
  const d=ensureCampaignDirectorState(); const k=String(token || "").slice(0,240);
  if(!k || d.appliedSignals[k]) return false; d.appliedSignals[k]=true; return true;
}
function campaignDirectorCheckModifiers(stat, label = ""){
  const d = ensureCampaignDirectorState();
  const c = GAME.character; const role = c?.classId; const text = String(label || "").toLowerCase();
  const notes=[]; let bonus=0;
  const investigation = /досье|архив|улика|расслед|документ|сопостав|приказ|след|осмотр/.test(text);
  const social = /допрос|убед|переговор|свидетел|авторитет|угроз|разговор|обман/.test(text);
  const physical = /бой|атака|противник|оруж|штурм|укрыт|патрул|выжив|сил|пролом|рукопаш|удар|стойк|боль|яд|страх|порч/.test(text);
  if(role === "inquisitor" && investigation && stat === "int") { bonus += 1; notes.push("Подготовка Инквизитора: +1 к анализу улик"); }
  if(role === "inquisitor" && social && (stat === "cha" || stat === "int")) { bonus += 1; notes.push("Полномочия Инквизиции: +1 к допросу/убеждению"); }
  if(role === "guardsman" && physical && ["dex","con","wil"].includes(stat)) { bonus += 1; notes.push("Полевая подготовка гвардейца: +1"); }
  if(role === "spaceMarine" && physical && ["str","con"].includes(stat)) { bonus += 2; notes.push("Физиология Астартес: +2 к физическому действию"); }
  if(d.threat >= 75 && physical) { bonus -= 1; notes.push("Критическая обстановка: −1"); }
  if(d.order >= 75 && investigation) { bonus += 1; notes.push("Подготовленная цепочка доказательств: +1"); }
  if(d.morale >= 75 && /вол|страх|псих|стойк|дисциплин|убежд/.test(text)) { bonus += 1; notes.push("Высокий боевой дух: +1"); }
  if(d.supplies <= 15 && physical) { bonus -= 1; notes.push("Недостаток снабжения: −1"); }
  bonus = Math.max(-2, Math.min(3, bonus));
  return {bonus, notes};
}
function getCampaignDirectorSummary(){
  const d=ensureCampaignDirectorState();
  const status = v => v >= 75 ? "КРИТИЧЕСКИЙ" : v >= 50 ? "ПОВЫШЕННЫЙ" : v >= 25 ? "УМЕРЕННЫЙ" : "НИЗКИЙ";
  return {
    threat:{value:d.threat,label:status(d.threat),description:d.threat>=75?"Враг действует смелее; проверки боя и выживания осложняются.":"Уровень враждебной активности пока управляем."},
    order:{value:d.order,label:status(d.order),description:d.order>=75?"Досье и координация дают преимущество при расследовании.":"Цепочка доказательств ещё не обеспечивает устойчивого контроля."},
    morale:{value:d.morale,label:status(d.morale),description:d.morale>=75?"Отряд уверен в действиях и устойчивее в критических ситуациях.":"Мораль отражает накопленный эффект потерь и успехов."},
    supplies:{value:d.supplies,label:status(d.supplies),description:d.supplies<=15?"Нехватка припасов осложняет полевые действия.":"Запасов достаточно для текущей операции."},
    choicesMade:d.choicesMade, scenesVisited:d.scenesVisited, evidenceFound:d.evidenceFound, log:d.log
  };
}
function renderCampaignDirectorPanel(){
  const s=getCampaignDirectorSummary();
  const rows=[
    ["threat","УГРОЗА СЕКТОРА",s.threat,"rgba(173,75,61,.95)"],
    ["order","КОНТРОЛЬ ОПЕРАЦИИ",s.order,"rgba(191,157,91,.95)"],
    ["morale","БОЕВОЙ ДУХ",s.morale,"rgba(106,151,103,.95)"],
    ["supplies","СНАБЖЕНИЕ",s.supplies,"rgba(102,143,169,.95)"]
  ];
  const bar=rows.map(([id,label,obj,color])=>`<div class="director-meter"><div class="small-row"><span>${label}</span><strong>${obj.value}/100 · ${obj.label}</strong></div><div class="progress"><i style="width:${obj.value}%;background:${color}"></i></div><p>${esc(obj.description)}</p></div>`).join("");
  const recent=s.log.slice(-4).reverse().map(e=>`<div class="director-log-line"><small>Д${esc(String(e.day))} · ${esc(e.time || "--:--")}</small><span>${esc(e.text)}</span></div>`).join("");
  return `<section class="panel campaign-director-panel"><div class="panel-head"><span>ОПЕРАТИВНАЯ ОБСТАНОВКА</span><span>${s.choicesMade} РЕШ.</span></div><div class="panel-body"><p class="director-intro">Состояние мира реагирует на улики, провалы, боевые столкновения и продвижение операции. Показатели — игровые абстракции, не абсолютный прогноз.</p>${bar}<div class="director-stats"><span>Сцены: <b>${s.scenesVisited}</b></span><span>Улики: <b>${s.evidenceFound}</b></span></div>${recent?`<div class="director-log"><b>ПОСЛЕДНИЕ ИЗМЕНЕНИЯ</b>${recent}</div>`:""}</div></section>`;
}
function initCampaignDirector(){
  const d=ensureCampaignDirectorState();
  if(!d.sceneVisits) d.sceneVisits={};
  return d;
}

let _campaignDirectorBusBound = false;
function bindCampaignDirectorEvents(){
  if(_campaignDirectorBusBound || typeof Bus === "undefined" || typeof Bus.on !== "function") return;
  _campaignDirectorBusBound = true;
  Bus.on("scene_entered", e => {
    const d=ensureCampaignDirectorState(); const key=`${GAME.campaign?.scenarioId || "?"}:${e.sceneId || "?"}`;
    d.scenesVisited++;
    d.sceneVisits[key]=(Number(d.sceneVisits[key]) || 0)+1;
    if(d.sceneVisits[key]===1) campaignDirectorLog(`Впервые посещена сцена: ${String(e.title || e.sceneId || "без названия")}`,"scene",{sceneKey:key});
  });
  Bus.on("choice_made", e => {
    const d=ensureCampaignDirectorState(); d.choicesMade++;
    campaignDirectorLog(`Решение: ${String(e.choice?.label || "выбор без подписи")}`,"decision",{choiceId:`${GAME.campaign?.scenarioId || "?"}:${e.sceneId || GAME.campaign?.sceneId || "?"}`});
  });
  Bus.on("heat_changed", e => {
    const delta=Number(e.delta); if(!Number.isFinite(delta) || !delta) return;
    campaignDirectorAdjust("threat", delta*2, delta>0?"тревога привлекла внимание врага":"тревога снижена");
    if(delta>=3) campaignDirectorAdjust("morale",-1,"напряжение давит на отряд");
  });
  Bus.on("clue_gained", e => {
    const n=Number(e.delta); if(Number.isFinite(n) && n>0) campaignDirectorAdjust("order",Math.min(3,n),"новые зацепки укрепляют расследование");
  });
  Bus.on("evidence_discovered", e => {
    const id=String(e.id || e.title || "unknown"); if(!campaignDirectorFirstSignal(`evidence:${id}`)) return;
    const d=ensureCampaignDirectorState(); d.evidenceFound++;
    campaignDirectorAdjust("order",1,"материал внесён в досье");
    campaignDirectorAdjust("threat",-1,"появилась возможность действовать на опережение");
    if(typeof _audioCtx !== "undefined" && _audioCtx && typeof playSound === "function") playSound("terminal_beep");
  });
  Bus.on("quest_completed", e => {
    campaignDirectorAdjust("order",2,"приказ выполнен");
    campaignDirectorAdjust("morale",1,"успешное завершение задачи");
    campaignDirectorAdjust("supplies",Math.min(2,Math.floor((Number(e.credits)||0)/100)),"вознаграждение поддерживает снабжение");
    if(typeof _audioCtx !== "undefined" && _audioCtx && typeof playSound === "function") playSound("victory");
  });
  Bus.on("combat_ended", e => {
    if(e.result === "victory"){
      campaignDirectorAdjust("threat",-3,"противник отброшен"); campaignDirectorAdjust("morale",2,"победа в столкновении");
      campaignDirectorAdjust("supplies",-1,"израсходованы боеприпасы и материалы");
    } else if(e.result === "flee") {
      campaignDirectorAdjust("threat",3,"противник сохраняет инициативу"); campaignDirectorAdjust("morale",-1,"отступление под давлением");
    }
  });
  Bus.on("location_changed", () => campaignDirectorAdjust("supplies",-1,"переход требует расхода полевых запасов"));
  Bus.on("time_advanced", e => {
    const d=ensureCampaignDirectorState(); d.elapsedMinutes+=Math.max(0,Math.floor(Number(e.minutes)||0));
    while(d.elapsedMinutes>=480){ d.elapsedMinutes-=480; campaignDirectorAdjust("supplies",-1,"длительная операция расходует запасы"); }
  });
  Bus.on("player_died", () => { campaignDirectorAdjust("threat",8,"оперативник выведен из строя"); campaignDirectorAdjust("morale",-8,"потеря оперативника"); });
  Bus.on("corruption_gained", e => { const n=Math.max(0,Math.floor(Number(e.delta)||0)); if(n) campaignDirectorAdjust("threat",Math.min(3,n),"варп-искажение усиливает нестабильность"); });
}
bindCampaignDirectorEvents();
