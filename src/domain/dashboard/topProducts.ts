/**
 * Pure helpers for `/dashboard/top-products`.
 *
 * El ordenamiento es server-side (`sort_by=revenue|quantity|profit`); acá vive
 * solo el filtrado de texto y la normalización de la tendencia para que la
 * tabla no muestre flotantes crudos ("-63.017946325668184%").
 */

import type { TopProduct } from '@/types/bi'
import { roundPercentage } from './trends'

/** Búsqueda por nombre, categoría, marca, variante o SKU. */
export const filterTopProducts = (
  products: TopProduct[] | null | undefined,
  search: string,
): TopProduct[] => {
  if (!products) return []
  const query = search.trim().toLowerCase()
  if (!query) return products

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.category,
      product.brand_name,
      product.variant_name,
      product.variant_sku,
      ...(product.tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
}

/** Dirección de tendencia válida para el icono/label de la tabla. */
export const getTrendKey = (trend: string | null | undefined): 'up' | 'down' | 'stable' => {
  const normalized = trend?.toLowerCase()
  return normalized === 'up' || normalized === 'down' ? normalized : 'stable'
}

/** Porcentaje de tendencia con 1 decimal (redondeo de presentación). */
export const getTrendPercentage = (product: TopProduct): number =>
  roundPercentage(product.trend_percentage, 1)

export type MarginTone = 'success' | 'destructive' | 'secondary'

/** Semántica del margen para el badge: positivo / negativo / neutro. */
export const getMarginTone = (marginPercentage: number | null | undefined): MarginTone => {
  const value = Number(marginPercentage)
  if (!Number.isFinite(value) || value === 0) return 'secondary'
  return value > 0 ? 'success' : 'destructive'
}
