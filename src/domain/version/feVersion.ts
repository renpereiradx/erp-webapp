/**
 * Versión del build FE (PLAN_VERSION_UI_FRONTEND_2026-10-07): valor de
 * package.json inyectado por el `define` de Vite (vite.config.js). Es el único
 * literal de versión permitido fuera de tests: SystemVersionBadge lo muestra y
 * los payloads de auditoría (`system_version`) lo importan en vez de escribir
 * su propio número (había 4 módulos con versiones hardcodeadas distintas).
 *
 * Módulo puro, sin React ni side effects: la lectura del global es una
 * constante de build, no un efecto.
 */

export const FE_APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : ''
