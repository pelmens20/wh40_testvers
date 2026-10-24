/* ============================================================
   ENGINE / TRIGGERS.JS — реактивный мир
   ============================================================ */

const TRIGGERS = [
  {
    id: "kane_notices_heat",
    on: "heat_changed",
    when: p => p.heat >= 5,
    once: true,
    do: [
      {npcAttitude:{"Сержант Кейн": -2}},
      {flag:{kaneSuspicious:true}},
      {system:{title:"ПОДОЗРЕНИЕ", text:"Кейн смотрит на тебя иначе. Он что-то знает."}}
    ]
  },
  {
    id: "clue_overflow",
    on: "clue_gained",
    when: p => p.total >= 8,
    once: true,
    do: [
      {system:{title:"СЛЕД", text:"Зацепок становится слишком много. Ты начинаешь видеть картину целиком."}},
      {xp: 20}
    ]
  }
];

let _triggersBound = false;

function initTriggers(){
  if(_triggersBound) return;
  _triggersBound = true;

  TRIGGERS.forEach(t => {
    Bus.on(t.on, payload => {
      if(t._fired && t.once) return;
      if(!t.when(payload)) return;
      t._fired = true;
      (t.do || []).forEach(effect => {
        if(effect.system){
          addSystem(effect.system.title, effect.system.text);
        }
        if(effect.xp){
          addXP(effect.xp);
        }
        // остальные ключи пробрасываем в applyEffects
        const {system, xp, ...rest} = effect;
        if(Object.keys(rest).length){
          applyEffects(rest);
        }
      });
    });
  });
}
