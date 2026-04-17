/**
 * Script de validación de traducciones i18n
 * Verifica que todas las claves existen en todos los idiomas
 *
 * Uso: node src/lib/i18n/validate.js
 */

import { es } from './locales/es/index'
import { en } from './locales/en/index'

/**
 * Colores para la consola
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

/**
 * Encuentra claves faltantes entre dos diccionarios
 * @param {Object} source - Diccionario fuente
 * @param {Object} target - Diccionario objetivo
 * @returns {Array<string>} - Claves que existen en source pero no en target
 */
function findMissingKeys(source, target) {
  const sourceKeys = Object.keys(source)
  const targetKeys = new Set(Object.keys(target))

  return sourceKeys.filter(key => !targetKeys.has(key))
}

/**
 * Encuentra claves duplicadas (con diferentes valores)
 * @param {Object} dict - Diccionario a analizar
 * @returns {Array<{key: string, occurrences: number}>}
 */
function findDuplicateKeys(dict) {
  const keys = Object.keys(dict)
  const seen = new Map()

  keys.forEach(key => {
    seen.set(key, (seen.get(key) || 0) + 1)
  })

  return Array.from(seen.entries())
    .filter(([_, count]) => count > 1)
    .map(([key, count]) => ({ key, occurrences: count }))
}

/**
 * Obtiene estadísticas de un diccionario
 * @param {Object} dict - Diccionario
 * @returns {Object} - Estadísticas
 */
function getStats(dict) {
  const keys = Object.keys(dict)
  const modules = {}

  // Agrupar por módulo (prefijo antes del primer punto)
  keys.forEach(key => {
    const module = key.split('.')[0]
    modules[module] = (modules[module] || 0) + 1
  })

  return {
    totalKeys: keys.length,
    modules,
  }
}

/**
 * Ejecuta la validación completa
 */
function validate() {
  console.log(`\n${colors.cyan}=== Validación de Traducciones i18n ===${colors.reset}\n`)

  // 1. Estadísticas generales
  console.log(`${colors.blue}📊 Estadísticas:${colors.reset}`)
  const esStats = getStats(es)
  const enStats = getStats(en)

  console.log(`  Español (es): ${esStats.totalKeys} claves`)
  console.log(`  Inglés  (en): ${enStats.totalKeys} claves\n`)

  console.log(`${colors.blue}📦 Módulos en Español:${colors.reset}`)
  Object.entries(esStats.modules)
    .sort(([, a], [, b]) => b - a)
    .forEach(([module, count]) => {
      console.log(`  ${module.padEnd(20)} ${count} claves`)
    })
  console.log()

  // 2. Buscar claves faltantes
  console.log(`${colors.blue}🔍 Verificando consistencia entre idiomas...${colors.reset}\n`)

  const missingInEn = findMissingKeys(es, en)
  const missingInEs = findMissingKeys(en, es)

  let hasErrors = false

  if (missingInEn.length > 0) {
    hasErrors = true
    console.log(`${colors.red}❌ Claves faltantes en Inglés (${missingInEn.length}):${colors.reset}`)
    missingInEn.slice(0, 10).forEach(key => {
      console.log(`  - ${key}`)
    })
    if (missingInEn.length > 10) {
      console.log(`  ... y ${missingInEn.length - 10} más`)
    }
    console.log()
  }

  if (missingInEs.length > 0) {
    hasErrors = true
    console.log(`${colors.red}❌ Claves faltantes en Español (${missingInEs.length}):${colors.reset}`)
    missingInEs.slice(0, 10).forEach(key => {
      console.log(`  - ${key}`)
    })
    if (missingInEs.length > 10) {
      console.log(`  ... y ${missingInEs.length - 10} más`)
    }
    console.log()
  }

  // 3. Buscar duplicados
  const duplicatesEs = findDuplicateKeys(es)
  const duplicatesEn = findDuplicateKeys(en)

  if (duplicatesEs.length > 0) {
    hasErrors = true
    console.log(`${colors.yellow}⚠️  Claves duplicadas en Español (${duplicatesEs.length}):${colors.reset}`)
    duplicatesEs.forEach(({ key, occurrences }) => {
      console.log(`  - ${key} (${occurrences} veces)`)
    })
    console.log()
  }

  if (duplicatesEn.length > 0) {
    hasErrors = true
    console.log(`${colors.yellow}⚠️  Claves duplicadas en Inglés (${duplicatesEn.length}):${colors.reset}`)
    duplicatesEn.forEach(({ key, occurrences }) => {
      console.log(`  - ${key} (${occurrences} veces)`)
    })
    console.log()
  }

  // 4. Resultado final
  if (!hasErrors) {
    console.log(`${colors.green}✅ ¡Validación exitosa! Todas las traducciones están sincronizadas.${colors.reset}\n`)
    return 0
  } else {
    console.log(`${colors.red}❌ Se encontraron ${missingInEn.length + missingInEs.length} claves faltantes y ${duplicatesEs.length + duplicatesEn.length} duplicados.${colors.reset}`)
    console.log(`${colors.yellow}💡 Por favor, corrige los errores antes de continuar.${colors.reset}\n`)
    return 1
  }
}

// Ejecutar validación si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = validate()
  process.exit(exitCode)
}

export { validate, findMissingKeys, findDuplicateKeys, getStats }
