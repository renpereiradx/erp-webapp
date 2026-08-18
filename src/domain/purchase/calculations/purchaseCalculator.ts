/**
 * Cálculos matemáticos puros para el dominio de Compras.
 */

export interface TaxBucket {
  /** Rate in PERCENT (e.g. 10 for 10%). */
  percent: number;
  /** Liquidated VAT amount for that rate. */
  amount: number;
}

export interface PurchaseTotals {
  subtotal: number;      // Bruto (con IVA si aplica)
  tax: number;           // Total liquidación IVA (todas las tasas)
  iva10: number;         // Derivado: liquidación 10% (compatibilidad)
  iva5: number;          // Derivado: liquidación 5% (compatibilidad)
  tax_buckets: TaxBucket[]; // Todas las tasas no cero, ordenadas desc
  exento: number;        // Monto exento
  total: number;         // Total a pagar al proveedor
  itemCount: number;
}

export interface PurchaseItem {
  quantity: number;
  unit_price: number;
  tax_rate?: number; // Ej: 0.10 para 10%
  price_includes_tax?: boolean; // Default true (Paraguay)
}

const normalizeRateKey = (rate: number): number => Math.round(rate * 10000) / 10000;

/**
 * Calcula los totales de una compra basándose en sus items con liquidación de IVA.
 * En Paraguay, los precios de proveedores usualmente YA incluyen IVA.
 *
 * `tax` = suma de TODAS las tasas (no solo 10%/5%); cualquier tasa no estándar
 * se agrupa en `tax_buckets` y cuenta para el total.
 */
export const calculatePurchaseTotals = (
  items: PurchaseItem[],
  globalTaxRate: number = 0
): PurchaseTotals => {
  let subtotal = 0;
  let exento = 0;
  let total_to_pay = 0;
  let total_qty = 0;
  const taxByRate = new Map<number, number>();

  items.forEach(item => {
    const qty = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    // Priorizar tasa de item sobre la global si existe
    const rate = item.tax_rate !== undefined ? item.tax_rate : globalTaxRate;
    const includesTax = item.price_includes_tax !== false;

    const line_total_gross = qty * unitPrice;
    subtotal += line_total_gross;
    total_to_pay += line_total_gross;
    total_qty += qty;

    if (rate > 0) {
      let tax_for_line = 0;
      if (includesTax) {
        // Extracción
        const net_value = line_total_gross / (1 + rate);
        tax_for_line = line_total_gross - net_value;
      } else {
        // Adición
        tax_for_line = line_total_gross * rate;
        total_to_pay += tax_for_line;
      }

      const key = normalizeRateKey(rate);
      taxByRate.set(key, (taxByRate.get(key) || 0) + tax_for_line);
    } else {
      exento += line_total_gross;
    }
  });

  const buckets: TaxBucket[] = Array.from(taxByRate.entries())
    .map(([fraction, amount]) => ({
      percent: Number((fraction * 100).toFixed(4)),
      amount: Number(amount.toFixed(2)),
    }))
    .filter(bucket => bucket.amount > 0)
    .sort((a, b) => b.percent - a.percent);

  const tax = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const amountFor = (percent: number): number =>
    buckets.find(bucket => Math.abs(bucket.percent - percent) < 0.0001)?.amount || 0;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    iva10: amountFor(10),
    iva5: amountFor(5),
    tax_buckets: buckets,
    exento: Number(exento.toFixed(2)),
    total: Number(total_to_pay.toFixed(2)),
    itemCount: total_qty,
  };
};
