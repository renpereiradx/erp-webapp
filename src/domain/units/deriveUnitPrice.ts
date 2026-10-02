/**
 * deriveUnitPrice — precio/costo canónico por unidad, espejo de la derivación
 * del backend: precio_unidad = precio_base × convert(1, unidad_elegida, base)
 * (process_sale_with_reserve / process_complete_purchase_order derivan
 * MULTIPLICANDO por el factor de la unidad elegida A la base; ver fix
 * auditoría UOM 2026-09-26: "1 docena a 5.000/u vale 60.000, no 417").
 *
 * Precedencia: precio/costo registrado para la unidad elegida → ese; si no,
 * base × factor con la cascada de resolveUnitFactor (específico-directo →
 * específico-inverso → global-directo → global-inverso); sin NI precio NI
 * conversión → precio base con matchesUnit=false (el backend rechazará la
 * línea con NO_CONVERSION si la unidad difiere de la base: mostrar hint).
 *
 * Sirve tanto para PRECIOS de venta (unit_prices) como para COSTOS de compra
 * (unit_costs): la matemática es idéntica, cambia la fuente de datos.
 */

import { resolveUnitFactor, type UnitConversionRow } from './resolveUnitFactor';

export interface UnitPriceResolution {
  /** Precio/costo resuelto para la unidad elegida. */
  price: number;
  /**
   * true: lo resolvió un precio registrado o una conversión.
   * false: sin precio registrado y sin conversión hacia la unidad elegida.
   */
  matchesUnit: boolean;
}

export interface DeriveUnitPriceParams {
  /** Unidad elegida (venta o compra). Vacía = unidad base. */
  chosenUnit: string;
  /** Unidad base del producto. */
  baseUnit: string;
  /** Precio/costo de la unidad base (registrado o de la ficha). */
  basePrice: number;
  /** Precio/costo registrado para la unidad elegida, si existe. */
  registeredPrice?: number | null;
  /** Conversiones registradas (globales + específicas). null = no disponibles. */
  conversions?: readonly UnitConversionRow[] | null;
  /** Id del producto (alcance de conversiones específicas). */
  productId?: string | null;
}

export function deriveUnitPrice({
  chosenUnit,
  baseUnit,
  basePrice,
  registeredPrice,
  conversions,
  productId,
}: DeriveUnitPriceParams): UnitPriceResolution {
  const chosen = chosenUnit || baseUnit;
  if (chosen === baseUnit) {
    return { price: basePrice, matchesUnit: true };
  }
  if (registeredPrice != null) {
    return { price: registeredPrice, matchesUnit: true };
  }
  // Dirección canónica: factor de la unidad ELEGIDA hacia la base
  // (1 caja × 20 = 20 kg → precio de la caja = precio_kg × 20).
  const factor = resolveUnitFactor(conversions, productId, chosen, baseUnit);
  if (factor != null && factor > 0) {
    return { price: Number((basePrice * factor).toFixed(2)), matchesUnit: true };
  }
  return { price: basePrice, matchesUnit: false };
}
