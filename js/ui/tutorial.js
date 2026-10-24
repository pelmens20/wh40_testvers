/* UI / TUTORIAL.JS — пошаговый вводный брифинг и обучение. */
const TUTORIAL_SEEN_KEY = "wh40k_tutorial_seen_v3";
function tutorialWasSeen(){ try { return localStorage.getItem(TUTORIAL_SEEN_KEY) === "1"; } catch (_) { return false; } }
function closeTutorial(markSeen = true){ if(markSeen){try{localStorage.setItem(TUTORIAL_SEEN_KEY,"1");}catch(_){}} const root=document.getElementById("modalRoot"); if(root) root.innerHTML=""; }
function maybeShowTutorial(){
 if(typeof GAME === "undefined" || !GAME || !GAME.started) return;
 if(typeof lorePrimerWasSeen === "function" && !lorePrimerWasSeen() && typeof showLorePrimer === "function"){
   showLorePrimer(false, { onClose: () => { if(!tutorialWasSeen()) showTutorial(false); } });
   return;
 }
 if(!tutorialWasSeen()) showTutorial(false);
}
function showTutorial(force = true){
 if(!force && tutorialWasSeen()) return;
 let root=document.getElementById("modalRoot"); if(!root){root=document.createElement("div");root.id="modalRoot";(document.getElementById("app")||document.body).appendChild(root);}
 const steps=[
  {eyebrow:"ПРОЛОГ · СЛУЖЕБНОЕ СООБЩЕНИЕ",title:"Тишина в IX секторе",body:"В промышленном секторе перестали отвечать рабочие смены. Первые донесения противоречат друг другу: одни говорят об аварии, другие — о закрытых переходах и вооружённой охране. Надёжных выводов пока нет. Ваш приказ прост: установить, что произошло, сохранить доказательства и доложить о том, что действительно удалось подтвердить.",tip:"Не принимайте слух, видение или обвинение за установленный факт."},
  {eyebrow:"ШАГ 1 ИЗ 5 · ХРОНИКА",title:"Читайте донесения и последствия",body:"Левая панель содержит досье персонажа и основные разделы. Хроника — основной журнал кампании. Здесь появляются повествование, действия персонажа, результаты проверок, найденные улики и последствия решений. Более поздние записи не отменяют автоматически ранние сведения: при противоречиях сопоставляйте источник, дату и обстоятельства.",tip:"Текст хроники теперь занимает всю доступную ширину центральной панели."},
  {eyebrow:"ШАГ 2 ИЗ 5 · ДЕЙСТВИЯ",title:"Выбирайте способ, а не только результат",body:"Кнопки сцены показывают известные варианты действий. Проверки зависят от характеристик, навыков, снаряжения и обстоятельств. Не каждый провал закрывает путь: он может стоить времени, здоровья, доверия или открыть другой ход событий. Не выбирайте вариант, если его цена неприемлема.",tip:"После важного выбора проверьте хронику и журнал заданий."},
  {eyebrow:"ШАГ 3 ИЗ 5 · УЛИКИ И ПРИКАЗЫ",title:"Разделяйте факт и гипотезу",body:"В журнале расследования фиксируйте, где и кем получена информация. Вещественная улика, показания очевидца и вывод персонажа — разные категории. Побочные задания могут давать ресурсы и репутацию, но не обязаны быть безопасными и не всегда влияют на основной сюжет напрямую.",tip:"Если улики противоречат друг другу, ищите дополнительное подтверждение."},
  {eyebrow:"ШАГ 4 ИЗ 5 · ПЕРСОНАЖ",title:"Ваш класс меняет подход к ситуации",body:"Инквизитор опирается на полномочия, допросы и анализ; гвардеец — на выучку, товарищей и ограниченные ресурсы; космодесантник — на дисциплину и специализированные боевые возможности. Классовая сила не означает всеведения: персонаж знает только то, что мог узнать в ходе кампании.",tip:"Проверяйте здоровье, состояния, экипировку и доступные способности перед опасной сценой."},
  {eyebrow:"ШАГ 5 ИЗ 5 · СОХРАНЕНИЯ",title:"Фиксируйте ход операции",body:"Архивные слоты позволяют хранить несколько точек возврата. Используйте основное сохранение и архивные слоты перед рискованными решениями. Экспортируйте JSON-копию, если хотите хранить резерв вне браузера. Не редактируйте файл вручную без резервной копии. При переносе между компьютерами убедитесь, что импорт завершился успешно.",tip:"Задача операции — выяснить правду. Цена поспешного решения может оказаться выше задержки."}
 ];
 let index=0;
 function render(){const st=steps[index];root.innerHTML=`<div class="modal-backdrop open tutorial-backdrop" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle"><section class="modal modal-wide tutorial-modal tutorial-story-mode"><header class="modal-head"><div><div class="modal-title" id="tutorialTitle">${st.title}</div><div class="modal-subtitle">${st.eyebrow}</div></div><button class="secondary-btn" type="button" data-tutorial-skip aria-label="Пропустить обучение">×</button></header><div class="modal-body tutorial-step-body"><div class="tutorial-progress" aria-label="Шаг ${index+1} из ${steps.length}"><div class="tutorial-progress-track"><span style="width:${((index+1)/steps.length)*100}%"></span></div><div class="tutorial-progress-label">ДОПУСК ОПЕРАТИВА · ${String(index+1).padStart(2,'0')} / ${steps.length}</div></div><p class="tutorial-narrative">${st.body}</p><aside class="tutorial-field-note"><strong>ПАМЯТКА ОПЕРАТИВНИКУ</strong><p>${st.tip}</p></aside></div><footer class="tutorial-footer"><span class="footer-note">Можно открыть обучение повторно из служебного раздела.</span><div class="tutorial-actions"><button class="secondary-btn" type="button" data-tutorial-skip>ПРОПУСТИТЬ БРИФИНГ</button>${index>0?'<button class="secondary-btn" type="button" data-tutorial-prev>НАЗАД</button>':''}<button class="danger-btn" type="button" data-tutorial-next>${index===steps.length-1?'ПРИНЯТО К ИСПОЛНЕНИЮ':'ДАЛЕЕ →'}</button></div></footer></section></div>`;
 root.querySelectorAll('[data-tutorial-skip]').forEach(b=>b.onclick=()=>closeTutorial(true));const prev=root.querySelector('[data-tutorial-prev]');if(prev)prev.onclick=()=>{index=Math.max(0,index-1);render();};root.querySelector('[data-tutorial-next]').onclick=()=>{if(index<steps.length-1){index++;render();}else closeTutorial(true);};
 }
 render();
}
