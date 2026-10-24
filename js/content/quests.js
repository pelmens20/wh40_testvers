/* ============================================================
   CONTENT / QUESTS.JS — задания (основные + побочные)
   ============================================================ */

const QUEST_DEFS = [

  /* ---------- ОСНОВНОЙ СЮЖЕТ ---------- */
  {
    id: "silentForge",
    objectiveKeys: ["enteredSector", "checkedIndustrialTrail", "foundDisappearanceTrace"],
    title: "Тишина в IX секторе",
    description: "Рабочие промышленного сектора перестали выходить на связь.",
    objectives: [
      "Добраться до промышленного сектора",
      "Проверить первые следы",
      "Найти след исчезнувших"
    ],
    rewards: { xp: 120, credits: 80 }
  },
  {
    id: "sealedSector",
    objectiveKeys: ["foundCatacombEntrance", "investigatedAnomaly", "openedSealedSector"],
    title: "Запечатанный сектор",
    description: "Под ульем открылось то, что не должно было открываться.",
    objectives: [
      "Найти вход в катакомбы",
      "Встретить Тень",
      "Открыть Запечатанный сектор"
    ],
    rewards: { xp: 200, credits: 150 }
  },
  {
    id: "warpHeart",
    objectiveKeys: ["foundGate", "engagedVoice", "resolvedRift"],
    title: "Сердце Варпа",
    description: "Врата внизу. Их нужно закрыть. Или открыть. Выбор за тобой.",
    objectives: [
      "Найти врата",
      "Поговорить с Голосом",
      "Закрыть или открыть шов"
    ],
    rewards: { xp: 300, credits: 200 }
  },
  {
    id: "ordoJudgment",
    objectiveKeys: ["reachedHeadquarters", "submittedTestimony", "receivedVerdict"],
    title: "Суд Ордо",
    description: "Инквизиция хочет знать, что ты сделал внизу.",
    objectives: [
      "Добраться до штаб-квартиры",
      "Дать показания",
      "Принять приговор"
    ],
    rewards: { xp: 300, credits: 0 }
  },

  /* ---------- ПОБОЧНЫЕ КВЕСТЫ ---------- */
  {
    id: "lostPatrol",
    objectiveKeys: ["askedAboutPatrol", "foundPatrolTrace", "resolvedSurvivorFate"],
    title: "Пропавший патруль",
    description: "Двое бойцов Кейна ушли в Технический узел и не вернулись.",
    objectives: [
      "Расспросить Кейна о бойцах",
      "Найти след в Техническом узле",
      "Решить судьбу выживших"
    ],
    rewards: { xp: 80, credits: 60, reputation: { Militarum: 2 } }
  },
  {
    id: "servoSkull",
    objectiveKeys: ["spokeWithHest", "searchedServitorium", "resolvedSkull"],
    title: "Сервочереп Магоса",
    description: "Магос Хест потерял сервочереп в Сервиторной. Он хочет его вернуть.",
    objectives: [
      "Поговорить с Хестом",
      "Обыскать Сервиторную",
      "Вернуть сервочереп (или не вернуть)"
    ],
    rewards: { xp: 60, credits: 100, reputation: { Mechanicus: 3 } }
  },
  {
    id: "falseRelic",
    objectiveKeys: ["foundMerchant", "examinedFragment", "decidedArtifactFate"],
    title: "Поддельный артефакт",
    description: "На рынке торговец продаёт «осколок XI Легиона». Что-то здесь не так.",
    objectives: [
      "Найти торговца на Рынке",
      "Осмотреть артефакт",
      "Вынести решение"
    ],
    rewards: { xp: 70, credits: 0, reputation: { Inquisition: 1 } }
  },
  {
    id: "lyraDebt",
    objectiveKeys: ["spokeWithLyra", "reachedBodies", "resolvedBurial"],
    title: "Долг Лиры",
    description: "Лира хочет вернуться к телам своего отделения. Это её долг.",
    objectives: [
      "Поговорить с Лирой",
      "Дойти до места гибели отделения",
      "Решить, что делать с телами"
    ],
    rewards: { xp: 100, credits: 0, reputation: {} }
  }
];
