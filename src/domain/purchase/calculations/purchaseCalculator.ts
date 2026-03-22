/**
 * Cálculos matemáticos puros para el dominio de Compras.
 */

export interface PurchaseTotals {
  subtotal: number;      // Bruto (con IVA si aplica)
  tax: number;           // Total liquidación IVA
  iva10: number;         // Liquidación específica 10%
  iva5: number;          // Liquidación específica 5%
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

/**
 * Calcula los totales de una compra basándose en sus items con liquidación de IVA.
 * En Paraguay, los precios de proveedores usualmente YA incluyen IVA.
 */
export const calculatePurchaseTotals = (
  items: PurchaseItem[],
  globalTaxRate: number = 0
): PurchaseTotals => {
  let subtotal = 0;
  let iva10 = 0;
  let iva5 = 0;
  let exento = 0;
  let total_to_pay = 0;
  let total_qty = 0;

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

      // Clasificar
      if (Math.abs(rate - 0.10) < 0.001) {
        iva10 += tax_for_line;
      } else if (Math.abs(rate - 0.05) < 0.001) {
        iva5 += tax_for_line;
      }
    } else {
      exento += line_total_gross;
    }
  });

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number((iva10 + iva5).toFixed(2)),
    iva10: Number(iva10.toFixed(2)),
    iva5: Number(iva5.toFixed(2)),
    exento: Number(exento.toFixed(2)),
    total: Number(total_to_pay.toFixed(2)),
    itemCount: total_qty,
  };
};
