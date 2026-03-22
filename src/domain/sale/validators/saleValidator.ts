import { SaleRequest, SaleOrderDetailRequest } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida una orden de venta según las reglas de negocio (v1.10).
 */
export const validateSaleOrder = (saleData: Partial<SaleRequest>): ValidationResult => {
  const errors: string[] = [];

  if (!saleData.client_id) {
    errors.push('Debe seleccionar un cliente');
  }

  const details = saleData.product_details;
  if (!saleData.reserve_id && (!details || details.length === 0)) {
    errors.push('Debe agregar al menos un producto o tener una reserva');
  }

  if (details) {
    details.forEach((item: SaleOrderDetailRequest, index: number) => {
      const productName = `Item ${index + 1}`;

      if (!item.product_id) {
        errors.push(`${productName}: ID de producto requerido`);
      }

      if (!item.quantity || item.quantity <= 0) {
        errors.push(`${productName}: Cantidad debe ser mayor a 0`);
      }

      // Reglas de modificación de precio (v1.10)
      if (item.sale_price !== undefined && !item.price_change_reason) {
        errors.push(`${productName}: Justificación requerida para cambio de precio`);
      }

      // Reglas de descuentos
      if (item.discount_amount !== undefined && item.discount_percent !== undefined) {
        errors.push(`${productName}: No se pueden aplicar descuento fijo y porcentual simultáneamente`);
      }

      if ((item.discount_amount !== undefined || item.discount_percent !== undefined) && !item.discount_reason) {
        errors.push(`${productName}: Justificación requerida para aplicar descuento`);
      }

      if (item.discount_percent !== undefined && (item.discount_percent < 0 || item.discount_percent > 100)) {
        errors.push(`${productName}: Porcentaje de descuento debe estar entre 0 y 100`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
