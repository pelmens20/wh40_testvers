/* ============================================================
   CONTENT / CAMPAIGNS / REGISTRY.JS
   ------------------------------------------------------------
   Собирает все главы в единый CAMPAIGN_SCENARIOS.
   Подключается ПОСЛЕДНИМ из блока campaigns.
   ============================================================ */

const CAMPAIGN_SCENARIOS = Object.assign(
  {},
  typeof CAMPAIGN_CH1 !== "undefined" ? CAMPAIGN_CH1 : {},
  typeof CAMPAIGN_CH2 !== "undefined" ? CAMPAIGN_CH2 : {},
  typeof CAMPAIGN_CH3 !== "undefined" ? CAMPAIGN_CH3 : {},
  typeof CAMPAIGN_CH4 !== "undefined" ? CAMPAIGN_CH4 : {},
  typeof CAMPAIGN_CH5 !== "undefined" ? CAMPAIGN_CH5 : {},
  typeof CAMPAIGN_CH6 !== "undefined" ? CAMPAIGN_CH6 : {},
  typeof CAMPAIGN_CH7 !== "undefined" ? CAMPAIGN_CH7 : {},
  typeof CAMPAIGN_CH8 !== "undefined" ? CAMPAIGN_CH8 : {},
  typeof CAMPAIGN_CH9 !== "undefined" ? CAMPAIGN_CH9 : {},
  typeof CAMPAIGN_CH10 !== "undefined" ? CAMPAIGN_CH10 : {},
  typeof CAMPAIGN_CH11 !== "undefined" ? CAMPAIGN_CH11 : {},
  typeof CAMPAIGN_CH12 !== "undefined" ? CAMPAIGN_CH12 : {},
  typeof CAMPAIGN_CH13 !== "undefined" ? CAMPAIGN_CH13 : {},
  typeof CAMPAIGN_CH14 !== "undefined" ? CAMPAIGN_CH14 : {},
  typeof CAMPAIGN_CH15 !== "undefined" ? CAMPAIGN_CH15 : {}
);
