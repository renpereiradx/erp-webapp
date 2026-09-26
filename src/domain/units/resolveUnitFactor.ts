/**
 * resolveUnitFactor — resuelve el multiplicador que convierte una cantidad
 * expresada en `fromUnit` a `toUnit`, con la MISMA precedencia que el backend
 * (products.convert_units_for_product en SQL y findConversionFactor en Go):
 * específico-directo → específico-inverso → global-directo → global-inverso.
 *
 * Se usa para derivar precios por unidad en el POS (precio_unidad =
 * precio_base × factor) replicando la fórmula del SQL, de modo que lo que se
 * ve en pantalla sea lo que el backend cobra al no enviar sale_price.
 *
 * Estructura compatible con las filas de GET /unit-conversions (snake_case):
 * el dominio define su propia interfaz para no importar de features/.
 */

export interface UnitConversionRow {
  from_unit: string;
  to_unit: string;
  factor: number | string;
  /** null/undefined = conversión global; id de producto = específica. */
  product_id?: string | null;
}

/**
 * Devuelve el factor (qty_from × factor = qty_to), 1 para fromUnit === toUnit,
 * o null si no hay conversión registrada aplicable al producto.
 */
export function resolveUnitFactor(
  conversions: readonly UnitConversionRow[] | null | undefined,
  productId: string | null | undefined,
  fromUnit: string,
  toUnit: string,
): number | null {
  if (!fromUnit || !toUnit) return null;
  if (fromUnit === toUnit) return 1;
  if (!conversions || conversions.length === 0) return null;

  let specificInverse = 0;
  let globalDirect = 0;
  let globalInverse = 0;
  let specificSet = false;
  let globalDirectSet = false;
  let globalInverseSet = false;

  for (const c of conversions) {
    const factor = Number(c.factor);
    if (!Number.isFinite(factor)) continue;
    const isSpecific = productId != null && c.product_id === productId;
    const isGlobal = c.product_id == null;
    // Una fila de OTRO producto no participa en ninguna precedencia.
    if (!isSpecific && !isGlobal) continue;

    if (c.from_unit === fromUnit && c.to_unit === toUnit) {
      if (isSpecific) return factor;
      if (!globalDirectSet) {
        globalDirect = factor;
        globalDirectSet = true;
      }
    }
    if (c.from_unit === toUnit && c.to_unit === fromUnit && factor !== 0) {
      if (isSpecific && !specificSet) {
        specificInverse = 1 / factor;
        specificSet = true;
      }
      if (isGlobal && !globalInverseSet) {
        globalInverse = 1 / factor;
        globalInverseSet = true;
      }
    }
  }

  if (specificSet) return specificInverse;
  if (globalDirectSet) return globalDirect;
  if (globalInverseSet) return globalInverse;
  return null;
}
