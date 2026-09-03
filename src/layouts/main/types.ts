import type { LucideIcon } from 'lucide-react'

/** Función de traducción (firma de `useI18n().t`) */
export type TFn = (key: string, defaultValue?: string, vars?: Record<string, unknown>) => string

/** Item del menú de navegación lateral */
export interface NavigationItem {
  name: string
  /** Los grupos puramente contenedores pueden no tener href */
  href?: string
  icon?: LucideIcon
  /** Gate simple: permiso único requerido */
  permission?: string
  /** Gate anyOf: basta uno de estos permisos */
  permissions?: string[]
  children?: NavigationItem[]
}

/** Item plano del buscador global */
export interface SearchableItem {
  name: string
  href: string
  icon?: LucideIcon
  /** Sección padre dentro del menú (o categoría para rutas extra) */
  parent: string
  category: string
}

/** Ruta buscable registrada en `@/config/searchableRoutes` */
export type SearchableRouteInput = SearchableItem & {
  /** Gate por módulo del negocio (ej. `reservations`) */
  requiredModule?: string
}
