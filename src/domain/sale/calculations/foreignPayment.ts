/**
 * foreignPayment — cálculos puros para el cobro en divisa.
 *
 * Política: el documento de venta se emite en la moneda base (PYG); la divisa
 * entra solo por la pata de cobro. Estos helpers convierten entre el total en
 * base y lo que el operador recibe en la divisa de cobro, usando la tasa
 * confirmada por el operador (multiplicador divisa → base).
 *
 * Sin React, sin side effects. Consumido por SaleCheckoutWizard/CollectionStep.
 */

/** Redondeo a 2 decimales estándar (medio arriba). */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Monto a cobrar en la divisa, a partir del total en moneda base y la tasa
 * (divisa → base). Con tasa ausente o no positiva devuelve 0: el caller debe
 * tratar ese caso como "tasa pendiente", no como total cero.
 */
export function computeForeignDue(totalBase: number, rate: number): number {
  if (!totalBase || !rate || rate <= 0) return 0;
  return round2(totalBase / rate);
}

/**
 * Equivalente en moneda base de un monto recibido en la divisa de cobro.
 * Es el valor que viaja como `amount_received` al backend.
 */
export function computeBaseFromForeign(foreignAmount: number, rate: number): number {
  if (!foreignAmount || !rate || rate <= 0) return 0;
  return round2(foreignAmount * rate);
}

/** Vuelto en la divisa de cobro (nunca negativo). */
export function computeForeignChange(foreignReceived: number, foreignDue: number): number {
  return round2(Math.max(0, (foreignReceived || 0) - (foreignDue || 0)));
}

/**
 * Vuelto en moneda base: lo que efectivamente se entrega en mano cuando el
 * cobro fue en divisa (política: el vuelto se da en guaraníes). Convierte lo
 * recibido a base y resta el total del documento; nunca negativo.
 */
export function computeBaseChange(foreignReceived: number, rate: number, totalBase: number): number {
  if (!rate || rate <= 0) return 0;
  const baseReceived = computeBaseFromForeign(foreignReceived, rate);
  return round2(Math.max(0, baseReceived - (totalBase || 0)));
}
