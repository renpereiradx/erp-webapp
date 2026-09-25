// ===========================================================================
// Mapper SellableUnitOption → EntityOption para los pickers de producto de
// los drill-downs (búsqueda plana granularity=variant, mismo camino que
// /ventas). Ítems en contexto de analítica: nombre de variante con dedupe
// (cuando ya embebe el nombre del producto) + SKU — sin precio/stock, que
// son datos operativos de venta fuera de contexto aquí.
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
    sub: u.sku ? `SKU: ${u.sku}` : undefined,
    variantId: u.variant_id ?? null,
  };
}
