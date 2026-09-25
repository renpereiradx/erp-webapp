// ===========================================================================
// Búsqueda plana de unidades vendibles (granularity=variant,
// PLAN_BUSQUEDA_VARIANTES_PLANAS) para pickers de productos fuera del
// catálogo (presupuestos, requisiciones). Una fila por variante/fila base,
// con precio (variante-primero, herencia resuelta en backend) y stock
// propios, y matcheo por SKU/código de variante — mismo camino que /ventas.
// ===========================================================================

import { productService } from '@/services/productService'
import type { SearchableDropdownItem } from '@/components/ui/SearchableDropdown'

export interface SellableUnitOption extends SearchableDropdownItem {
  /** Producto padre; la unidad se identifica con variant_id (null = fila base). */
  id: string
  name: string
  variant_id?: string | null
  variant_name?: string | null
  sku?: string
  price: number
  stock: number
  base_unit: string
}

export function toSellableUnitOption(raw: Record<string, any>): SellableUnitOption {
  return {
    id: String(raw.id ?? raw.product_id ?? ''),
    name: String(raw.name ?? raw.product_name ?? ''),
    variant_id: raw.variant_id ?? null,
    variant_name: raw.variant_name ?? null,
    // La fila plana trae sku nullable; SearchableDropdownItem lo declara string.
    sku: raw.sku == null ? undefined : String(raw.sku),
    // current_price = variante-primero; los campos legacy (sale_price/price)
    // solo existen en filas del fallback por-producto.
    price: Number(raw.current_price ?? raw.sale_price ?? raw.price ?? 0) || 0,
    stock: Number(raw.stock_quantity ?? raw.stock ?? 0) || 0,
    base_unit: String(raw.base_unit ?? raw.unit ?? 'unit'),
  }
}

/**
 * Plana primero (granularity=variant); la cadena legacy por-producto queda
 * como fallback SOLO si el endpoint falla — una búsqueda vacía no degrada a
 * filas por-producto (mismo criterio que el breaker de useProductStore).
 */
export async function searchSellableUnitsFlat(
  term: string,
  pageSize = 15,
): Promise<SellableUnitOption[]> {
  const trimmed = term.trim()
  if (trimmed.length < 3) return []
  try {
    const response = await productService.searchAdvanced({
      search: trimmed,
      granularity: 'variant',
      page: 1,
      page_size: pageSize,
    })
    const raw = (response as any)?.products
    return (Array.isArray(raw) ? raw : [])
      .filter((p: Record<string, any>) => p.state !== false)
      .slice(0, pageSize)
      .map(toSellableUnitOption)
  } catch (err) {
    console.warn('Flat product search failed, falling back to legacy info search', err)
  }
  try {
    const legacy = await productService.searchInfo(trimmed)
    return (Array.isArray(legacy) ? legacy : [legacy])
      .filter(Boolean)
      .slice(0, pageSize)
      .map(toSellableUnitOption)
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}
