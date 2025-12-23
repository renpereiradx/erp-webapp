/**
 * ARCHIVO DE COMPATIBILIDAD
 * ========================
 * Este archivo mantiene la compatibilidad con imports existentes.
 * El nuevo sistema modular está en: src/lib/i18n/
 *
 * Para nuevos desarrollos, considera importar directamente desde:
 * import { useI18n } from '@/lib/i18n'
 *
 * MIGRACIÓN COMPLETADA:
 * - Estructura modular por dominios (common, products, purchases, etc.)
 * - Validación de claves entre idiomas
 * - Mejor mantenibilidad y organización
 * - Documentación inline
 */

// Re-exportar todo desde el nuevo sistema modular
export * from './i18n/index.js'

// Mantener alias para compatibilidad total
export { useI18n as default } from './i18n/index.js'
