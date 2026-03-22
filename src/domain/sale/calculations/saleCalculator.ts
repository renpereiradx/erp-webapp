/**
 * Cálculos matemáticos puros para el dominio de Ventas.
 */

export interface SaleTotals {
  subtotal: number;      // Bruto (con IVA si aplica)
  tax_amount: number;    // Total liquidación IVA
  discount_total: number;
  iva10: number;         // Liquidación específica 10%
  iva5: number;          // Liquidación específica 5%
  exento: number;        // Monto exento
  total: number;         // Total a pagar
  item_count: number;
}

export interface SaleItem {
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  discount_percent?: number;
  tax_rate?: number; // Ej: 0.10 para 10%
  price_includes_tax?: boolean; // Default true (Paraguay)
}

/**
 * Calcula los totales de una venta basándose en sus items con liquidación de IVA.
 * En Paraguay, los precios de venta usualmente YA incluyen IVA.
 */
export const calculateSaleTotals = (items: SaleItem[]): SaleTotals => {
  let subtotal = 0;
  let discount_total = 0;
  let iva10 = 0;
  let iva5 = 0;
  let exento = 0;
  let total_to_pay = 0;
  let total_qty = 0;

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
    if (item.discount_amount) {
      line_discount = qty * item.discount_amount;
    } else if (item.discount_percent) {
      line_discount = line_gross * (item.discount_percent / 100);
    }
    discount_total += line_discount;
    
    // 3. Monto neto de la línea (lo que efectivamente se cobra)
    const line_net_total = line_gross - line_discount;
    total_to_pay += line_net_total;
    total_qty += qty;

    // 4. Liquidación de IVA (Extracción o Adición)
    if (rate > 0) {
      let tax_for_line = 0;
      if (includesTax) {
        // Extracción: Precio ya tiene IVA (Total / 1.10 o 1.05)
        const net_value = line_net_total / (1 + rate);
        tax_for_line = line_net_total - net_value;
      } else {
        // Adición: Precio no tiene IVA (Neto * 0.10 o 0.05)
        tax_for_line = line_net_total * rate;
        // Ajustar total a pagar si el IVA no estaba incluido
        total_to_pay += tax_for_line;
      }

      // Clasificar por tasa
      if (Math.abs(rate - 0.10) < 0.001) {
        iva10 += tax_for_line;
      } else if (Math.abs(rate - 0.05) < 0.001) {
        iva5 += tax_for_line;
      }
    } else {
      exento += line_net_total;
    }
  });

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax_amount: Number((iva10 + iva5).toFixed(2)),
    discount_total: Number(discount_total.toFixed(2)),
    iva10: Number(iva10.toFixed(2)),
    iva5: Number(iva5.toFixed(2)),
    exento: Number(exento.toFixed(2)),
    total: Number(total_to_pay.toFixed(2)),
    item_count: total_qty
  };
};
