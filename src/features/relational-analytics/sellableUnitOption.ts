// ===========================================================================
// Mapper SellableUnitOption → EntityOption para los pickers de producto de
// los drill-downs (búsqueda plana granularity=variant, mismo camino que
// /ventas). Incluye la dedupe de display: cuando el nombre de la variante ya
// embebe el nombre del producto ("CAMISETA ADIDAS - COLOR X"), no se repite
// como "Producto · Variante".
// ===========================================================================

import type { EntityOption } from './components/EntitySearchSelect';
import type { SellableUnitOption } from '@/features/catalog/sellableUnitSearch';

export function sellableUnitToEntityOption(u: SellableUnitOption): EntityOption {
  const variantName = u.variant_name ?? null;
  const composed =
    variantName && !variantName.toLowerCase().startsWith(u.name.toLowerCase())
      ? `${u.name} · ${variantName}`
      : variantName ?? u.name;
  return {
    id: u.id,
    label: composed,
    sku: u.sku,
    price: u.price,
    stock: u.stock,
    baseUnit: u.base_unit,
    variantId: u.variant_id ?? null,
    variantName,
  };
}
