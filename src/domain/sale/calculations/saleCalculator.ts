/**
 * Cálculos matemáticos puros para el dominio de Ventas.
 */

export interface TaxBucket {
  /** Rate in PERCENT (e.g. 10 for 10%). */
  percent: number;
  /** Liquidated VAT amount for that rate. */
  amount: number;
}

export interface SaleTotals {
  subtotal: number;      // Bruto (con IVA si aplica)
  tax_amount: number;    // Total liquidación IVA (todas las tasas)
  discount_total: number;
  iva10: number;         // Derivado: liquidación 10% (compatibilidad)
  iva5: number;          // Derivado: liquidación 5% (compatibilidad)
  tax_buckets: TaxBucket[]; // Todas las tasas no cero, ordenadas desc
  exento: number;        // Monto exento
  total: number;         // Total a pagar
  item_count: number;
}

export interface SaleItem {
  quantity: number;
  unit_price: number;
  discount_amount?: number;   // Descuento por unidad
  discount_percent?: number;  // Descuento porcentual sobre el bruto de la línea
  discount_total?: number;    // Descuento absoluto de la línea (más preciso)
  tax_rate?: number; // Ej: 0.10 para 10%
  price_includes_tax?: boolean; // Default true (Paraguay)
}

const normalizeRateKey = (rate: number): number => Math.round(rate * 10000) / 10000;

/**
 * Prorratea un descuento general de venta entre las líneas, ANTES de
 * liquidar el IVA (semántica del backend: descuentos primero, IVA después).
 * El descuento de cada línea queda en `discount_total` (monto absoluto),
 * combinado con cualquier descuento por línea existente.
 */
export const applyGeneralDiscount = (
  items: SaleItem[],
  discountAmount: number,
): SaleItem[] => {
  if (!discountAmount || discountAmount <= 0) return items;

  const grossSum = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
    0,
  );
  if (grossSum <= 0) return items;

  const ratio = Math.min(1, discountAmount / grossSum);

  return items.map(item => {
    const qty = item.quantity || 0;
    const lineGross = qty * (item.unit_price || 0);
    if (lineGross <= 0) return item;

    const existing = item.discount_total
      ?? (qty * (item.discount_amount || 0)
        + lineGross * ((item.discount_percent || 0) / 100));
    const prorated = lineGross * ratio;

    return {
      ...item,
      discount_total: Number((existing + prorated).toFixed(2)),
    };
  });
};

/**
 * Calcula los totales de una venta basándose en sus items con liquidación de IVA.
 * En Paraguay, los precios de venta usualmente YA incluyen IVA.
 *
 * `tax_amount` = suma de TODAS las tasas (no solo 10%/5%); cualquier tasa no
 * estándar se agrupa en `tax_buckets` y cuenta para el total.
 */
export const calculateSaleTotals = (items: SaleItem[]): SaleTotals => {
  let subtotal = 0;
  let discount_total = 0;
  let exento = 0;
  let total_to_pay = 0;
  let total_qty = 0;
  const taxByRate = new Map<number, number>();

  items.forEach(item => {
    const qty = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    const includesTax = item.price_includes_tax !== false;
    const rate = item.tax_rate || 0;
    
    // 1. Calcular Subtotal de línea (antes de descuentos)
    const line_gross = qty * unitPrice;
    subtotal += line_gross;
    
    // 2. Calcular Descuento de línea
    let line_discount = 0;
    if (item.discount_total !== undefined && item.discount_total > 0) {
      line_discount = item.discount_total;
    } else if (item.discount_amount) {
      line_discount = qty * item.discount_amount;
    } else if (item.discount_percent) {
      line_discount = line_gross * (item.discount_percent / 100);
    }
    discount_total += line_discount;
    
    // 3. Monto neto de la línea (lo que efectivamente se cobra)
    const line_net_total = line_gross - line_discount;
    total_to_pay += line_net_total;
    total_qty += qty;

    // 4. Liquidación de IVA (Extracción o Adición) agrupada por tasa
    if (rate > 0) {
      let tax_for_line = 0;
      if (includesTax) {
        // Extracción: Precio ya tiene IVA (Total / (1 + rate))
        const net_value = line_net_total / (1 + rate);
        tax_for_line = line_net_total - net_value;
      } else {
        // Adición: Precio no tiene IVA (Neto * rate)
        tax_for_line = line_net_total * rate;
        // Ajustar total a pagar si el IVA no estaba incluido
        total_to_pay += tax_for_line;
      }

      const key = normalizeRateKey(rate);
      taxByRate.set(key, (taxByRate.get(key) || 0) + tax_for_line);
    } else {
      exento += line_net_total;
    }
  });

  const buckets: TaxBucket[] = Array.from(taxByRate.entries())
    .map(([fraction, amount]) => ({
      percent: Number((fraction * 100).toFixed(4)),
      amount: Number(amount.toFixed(2)),
    }))
    .filter(bucket => bucket.amount > 0)
    .sort((a, b) => b.percent - a.percent);

  const tax_amount = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const amountFor = (percent: number): number =>
    buckets.find(bucket => Math.abs(bucket.percent - percent) < 0.0001)?.amount || 0;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax_amount: Number(tax_amount.toFixed(2)),
    discount_total: Number(discount_total.toFixed(2)),
    iva10: amountFor(10),
    iva5: amountFor(5),
    tax_buckets: buckets,
    exento: Number(exento.toFixed(2)),
    total: Number(total_to_pay.toFixed(2)),
    item_count: total_qty
  };
};
