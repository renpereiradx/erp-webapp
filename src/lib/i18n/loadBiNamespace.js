/**
 * Carga diferida del namespace BI (locales es/en). Llamar una vez al boot
 * (fire-and-forget): las páginas BI son lazy y todas sus llamadas
 * t(key, fallback) cubren el primer render antes de que resuelva.
 * PLAN_ALINEACION_BI_FRONTEND F5 — presupuesto de bundle.
 */
export function loadBiNamespace() {
  return Promise.all([import('./locales/es/bi'), import('./locales/en/bi')]).then(([es, en]) => {
    // registerTranslations se importa aquí para no crear ciclo con el core
    return Promise.all([import('./index')]).then(([i18n]) => {
      i18n.registerTranslations('es', es.bi)
      i18n.registerTranslations('en', en.bi)
    })
  })
}
