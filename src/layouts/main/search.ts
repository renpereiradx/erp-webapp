import { distinctSearchableRoutes } from '@/config/searchableRoutes'
import type { NavigationItem, SearchableItem, SearchableRouteInput, TFn } from './types'

/**
 * Normaliza texto para búsquedas: minúsculas y sin diacríticos
 * ("Analítica" → "analitica") para que el usuario no dependa de tildes.
 */
export const normalizeText = (text: unknown): string => {
  if (!text || typeof text !== 'string') return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Aplana el árbol de navegación a items buscables (nombre + sección padre). */
const flattenNavigation = (
  nodes: NavigationItem[],
  parentLabel: string,
  mainMenuLabel: string,
): SearchableItem[] =>
  nodes.flatMap((node) => {
    const items: SearchableItem[] =
      node.href && node.href !== '#'
        ? [{ name: node.name, href: node.href, icon: node.icon, parent: parentLabel, category: parentLabel || mainMenuLabel }]
        : []
    return node.children
      ? [...items, ...flattenNavigation(node.children, node.name, mainMenuLabel)]
      : items
  })

/**
 * Los módulos de BI son densos: en el buscador global se degradan salvo los
 * núcleos (Finanzas, Configuración, Reservas, Inventario, Caja, Comercial).
 */
const isDegradableBI = (item: SearchableItem): boolean => {
  const name = item.name.toLowerCase()
  const category = item.category.toLowerCase()
  const parent = (item.parent || '').toLowerCase()

  const isBI =
    name.includes('bi') ||
    category.includes('bi') ||
    parent.includes('bi') ||
    name.includes('analítica') ||
    category.includes('analítica') ||
    name.includes('pronóstico') ||
    category.includes('pronóstico') ||
    category.includes('inteligencia de negocios') ||
    parent.includes('inteligencia de negocios')

  const isCoreModule =
    category.includes('finanzas') ||
    category.includes('configuración') ||
    category.includes('reservas') ||
    category.includes('inventario') ||
    category.includes('caja') ||
    category.includes('comercial')

  return isBI && !isCoreModule
}

/** Índice de búsqueda: navegación plana + rutas extra sin duplicar hrefs. */
export const buildSearchableItems = (
  navigation: NavigationItem[],
  t: TFn,
  reservationsEnabled: boolean,
): SearchableItem[] => {
  const mainMenuLabel = t('nav.mainMenu', 'Menú Principal')
  const items = flattenNavigation(navigation, '', mainMenuLabel)

  const seen = new Set(items.map((item) => item.href))
  // Cast de borde: searchableRoutes es un módulo JS sin tipos
  for (const route of distinctSearchableRoutes as unknown as readonly SearchableRouteInput[]) {
    // Gates por módulo del negocio (ej. reservas desactivadas)
    if (route.requiredModule === 'reservations' && !reservationsEnabled) continue
    if (seen.has(route.href)) continue
    seen.add(route.href)
    items.push({
      name: route.name,
      href: route.href,
      icon: route.icon,
      parent: route.category,
      category: route.category,
    })
  }

  return items.filter((item) => !isDegradableBI(item))
}

/**
 * Haystack de búsqueda precomputado por item (nombre + sección, sin tildes).
 * WeakMap: se calcula una vez por objeto item y se libera con el índice cuando
 * la navegación cambia, en vez de renormalizar ~300 strings por tecla.
 */
const haystackCache = new WeakMap<SearchableItem, string>()

const getHaystack = (item: SearchableItem): string => {
  let haystack = haystackCache.get(item)
  if (!haystack) {
    haystack = `${normalizeText(item.name)} ${normalizeText(item.parent)}`
    haystackCache.set(item, haystack)
  }
  return haystack
}

/** Filtra por término contra el nombre y la sección padre (sin tildes). */
export const filterSearchResults = (items: SearchableItem[], term: string): SearchableItem[] => {
  const needle = normalizeText(term)
  if (!needle) return []
  return items.filter((item) => getHaystack(item).includes(needle))
}
