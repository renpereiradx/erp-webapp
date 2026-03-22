import { PurchaseOrderRequest, PurchaseOrderDetailRequest } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida los datos de una orden de compra según las reglas de negocio.
 * Esta es una función pura de dominio.
 */
export const validatePurchaseOrder = (purchaseData: Partial<PurchaseOrderRequest>): ValidationResult => {
  const errors: string[] = [];

  if (!purchaseData.supplier_id) {
    errors.push('Debe seleccionar un proveedor');
  }

  const items = purchaseData.order_details;
  if (!items || items.length === 0) {
    errors.push('Debe agregar al menos un producto');
  } else {
    items.forEach((item: PurchaseOrderDetailRequest, index: number) => {
      if (!item.product_id) {
        errors.push(`Producto ${index + 1}: ID requerido`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
      }
      
      if (!item.unit_price || item.unit_price <= 0) {
        errors.push(`Producto ${index + 1}: Precio debe ser mayor a 0`);
      }
      
      // La fecha de expiración es opcional pero si existe debe ser válida
      // Nota: Aquí se podría agregar lógica de fecha futura si fuera mandatorio por dominio
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
