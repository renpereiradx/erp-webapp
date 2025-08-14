// Simple i18n utility (extensible)
// Usage: const { t, lang, setLang } = useI18n(); t('products.title')
import { useState, useCallback } from 'react';

const DICTIONARY = {
  es: {
    'products.title': 'Gestión de Productos',
    'products.new': 'Nuevo Producto',
    'products.loading': 'Cargando productos...',
    'products.error.loading': 'Error al cargar',
    'products.retry': 'Reintentar',
    'products.search.db': 'Buscar en Base de Datos',
    'products.search.placeholder': 'Buscar por nombre o ID...',
    'products.search': 'Buscar',
    'products.clear': 'Limpiar',
    'products.bulk.activate': 'Activar',
    'products.bulk.deactivate': 'Desactivar',
    'products.bulk.clear': 'Limpiar',
    'products.inline.save': 'Guardar',
    'products.inline.cancel': 'Cancelar',
    'products.create_first': 'Crear Primer Producto',
    'products.no_products_loaded': 'No hay productos cargados',
    'products.no_results': 'No se encontraron productos',
    'products.no_results_for': 'No hay productos que coincidan con "{term}"',
    'products.search.help1': 'Puedes buscar por nombre (ej: "Puma") o por ID completo (ej: "bcYdWdKNR")',
    'products.search.help2': 'Búsqueda automática: mínimo {minChars} caracteres. Atajo: "/" para enfocar.',
    'products.page_size_label': 'Productos por página:'
  },
  en: {
    'products.title': 'Product Management',
    'products.new': 'New Product',
    'products.loading': 'Loading products...',
    'products.error.loading': 'Load error',
    'products.retry': 'Retry',
    'products.search.db': 'Search in Database',
    'products.search.placeholder': 'Search by name or ID...',
    'products.search': 'Search',
    'products.clear': 'Clear',
    'products.bulk.activate': 'Activate',
    'products.bulk.deactivate': 'Deactivate',
    'products.bulk.clear': 'Clear',
    'products.inline.save': 'Save',
    'products.inline.cancel': 'Cancel',
    'products.create_first': 'Create First Product',
    'products.no_products_loaded': 'No products loaded',
    'products.no_results': 'No products found',
    'products.no_results_for': 'No products matched "{term}"',
    'products.search.help1': 'You can search by name (e.g. "Puma") or by full ID (e.g. "bcYdWdKNR")',
    'products.search.help2': 'Auto-search: minimum {minChars} characters. Shortcut: "/" to focus.',
    'products.page_size_label': 'Products per page:'
  }
};

let currentLang = 'es';
export const setI18nLang = (l) => { if (DICTIONARY[l]) currentLang = l; };
export const tRaw = (key) => DICTIONARY[currentLang][key] || key;

export function useI18n() {
  const [lang, setLangState] = useState(currentLang);
  const setLang = useCallback((l) => { if (DICTIONARY[l]) { currentLang = l; setLangState(l); } }, []);
  const t = useCallback((key) => DICTIONARY[lang][key] || key, [lang]);
  return { t, lang, setLang };
}
