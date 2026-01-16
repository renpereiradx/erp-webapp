/**
 * Sistema de Internacionalización (i18n)
 * Versión modular y mejorada
 *
 * Características:
 * - Estructura modular organizada por dominios
 * - Interpolación de variables
 * - Validación de claves
 * - Fácil mantenimiento
 *
 * @example
 * import { useI18n } from '@/lib/i18n'
 *
 * function MyComponent() {
 *   const { t, lang, setLang } = useI18n()
 *   return <div>{t('products.title')}</div>
 * }
 */

import { useState, useCallback } from 'react'
import { es } from './locales/es/index.js'
import { en } from './locales/en/index.js'

/**
 * Diccionario completo de traducciones
 * Importado desde archivos modulares
 */
const DICTIONARY = Object.freeze({
  es,
  en,
})

/**
 * Idioma actual del sistema
 * Inicia en español por defecto
 */
let currentLang = 'es'

/**
 * Establece el idioma actual del sistema
 * @param {string} lang - Código de idioma ('es' | 'en')
 */
export const setI18nLang = (lang) => {
  if (DICTIONARY[lang]) {
    currentLang = lang
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('i18n_lang', lang)
    }
  } else {
    console.warn(`[i18n] Idioma no soportado: ${lang}`)
  }
}

/**
 * Obtiene una traducción sin React hooks (uso en utilidades)
 * @param {string} key - Clave de traducción
 * @param {Object} vars - Variables para interpolación (opcional)
 * @returns {string} - Texto traducido
 */
export const tRaw = (key, defaultValue, vars) => {
  // Manejar caso donde no se pasa defaultValue
  if (typeof defaultValue === 'object') {
    vars = defaultValue
    defaultValue = key
  }
  
  const dict = DICTIONARY[currentLang]
  
  // 1. Intentar acceso directo
  let template = (dict && dict[key])

  // 2. Intentar acceso anidado
  if (!template && key.includes('.')) {
    template = key.split('.').reduce((obj, i) => (obj ? obj[i] : null), dict)
  }

  // 3. Fallback
  template = template || defaultValue || key

  // Interpolación de variables ({var} o {{var}})
  if (vars && typeof vars === 'object') {
    const patterns = [/\{(\w+)\}/g, /\{\{(\w+)\}\}/g];
    patterns.forEach(pattern => {
      template = String(template).replace(pattern, (_, varKey) =>
        Object.prototype.hasOwnProperty.call(vars, varKey)
          ? String(vars[varKey])
          : `{${varKey}}`
      )
    });
  }

  return template
}

/**
 * Hook de React para usar i18n
 * @returns {{t: Function, lang: string, setLang: Function}}
 *
 * @example
 * const { t, lang, setLang } = useI18n()
 * console.log(t('products.title')) // "Gestión de Productos"
 * console.log(t('products.no_results_for', { term: 'Nike' })) // "No hay productos que coincidan con Nike"
 */
export function useI18n() {
  try {
    // Intenta inicializar desde localStorage
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('i18n_lang')
      if (savedLang && DICTIONARY[savedLang] && savedLang !== currentLang) {
        currentLang = savedLang
      }
    }

    const [lang, setLangState] = useState(currentLang)

    // Función para cambiar el idioma
    const setLang = useCallback((newLang) => {
      if (DICTIONARY[newLang]) {
        currentLang = newLang
        setLangState(newLang)
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('i18n_lang', newLang)
        }
      } else {
        console.warn(`[i18n] Idioma no soportado: ${newLang}`)
      }
    }, [])

    // Función de traducción
    const t = useCallback(
      (key, defaultValue, vars) => {
        // Manejar caso donde no se pasa defaultValue
        if (typeof defaultValue === 'object') {
          vars = defaultValue
          defaultValue = key
        }

        const dict = DICTIONARY[lang]
        
        // 1. Intentar acceso directo
        let template = (dict && dict[key])

        // 2. Intentar acceso anidado
        if (!template && key.includes('.')) {
          template = key.split('.').reduce((obj, i) => (obj ? obj[i] : null), dict)
        }

        // 3. Fallback
        template = template || defaultValue || key

        // Warning en desarrollo
        if (template === key && process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Traducción no encontrada: "${key}" (idioma: ${lang})`)
        }

        // Interpolación de variables ({var} o {{var}})
        if (vars && typeof vars === 'object') {
          const patterns = [/\{(\w+)\}/g, /\{\{(\w+)\}\}/g];
          patterns.forEach(pattern => {
            template = String(template).replace(pattern, (_, varKey) =>
              Object.prototype.hasOwnProperty.call(vars, varKey)
                ? String(vars[varKey])
                : `{${varKey}}`
            )
          });
        }

        return template
      },
      [lang]
    )

    return { t, lang, setLang }
  } catch (error) {
    // Fallback para compatibilidad con React 19
    console.warn('[i18n] Usando fallback por error en hooks:', error)

    const lang = currentLang
    const setLang = (newLang) => {
      if (DICTIONARY[newLang]) {
        currentLang = newLang
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('i18n_lang', newLang)
        }
      }
    }

    const t = (key, vars) => tRaw(key, vars)

    return { t, lang, setLang }
  }
}

/**
 * Obtiene la lista de idiomas soportados
 * @returns {Array<string>}
 */
export const getSupportedLanguages = () => Object.keys(DICTIONARY)

/**
 * Verifica si un idioma está soportado
 * @param {string} lang - Código de idioma
 * @returns {boolean}
 */
export const isLanguageSupported = (lang) => lang in DICTIONARY

/**
 * Obtiene el idioma actual
 * @returns {string}
 */
export const getCurrentLanguage = () => currentLang

// Exportar diccionario para testing y debugging
export { DICTIONARY }
