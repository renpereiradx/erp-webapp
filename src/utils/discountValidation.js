/**
 * Validaciones para descuentos según SALE_WITH_DISCOUNT_API.md
 * Centraliza toda la lógica de validación para descuentos y modificaciones de precio
 */

/**
 * Valida un producto con descuentos antes de enviar al servidor
 * @param {Object} product - Producto con datos de descuento
 * @param {number} originalPrice - Precio original del producto
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateDiscount = (product, originalPrice) => {
  const errors = [];

  // 1. Si hay descuento, debe haber razón
  if ((product.discount_amount || product.discount_percent) && !product.discount_reason) {
    errors.push('Se requiere justificación para el descuento');
  }

  // 2. Validar descuento por monto
  if (product.discount_amount !== null && product.discount_amount !== undefined) {
    if (product.discount_amount < 0) {
      errors.push('El descuento no puede ser negativo');
    }
    if (product.discount_amount > originalPrice) {
      errors.push('El descuento no puede ser mayor al precio original');
    }
  }

  // 3. Validar descuento por porcentaje
  if (product.discount_percent !== null && product.discount_percent !== undefined) {
    if (product.discount_percent < 0 || product.discount_percent > 100) {
      errors.push('El porcentaje debe estar entre 0 y 100');
    }
  }

  // 4. No se pueden combinar ambos tipos de descuento
  if (product.discount_amount && product.discount_percent) {
    errors.push('No se puede usar descuento fijo y porcentaje simultáneamente');
  }

  // 5. Si hay modificación de precio, debe haber justificación
  if (product.sale_price !== null && product.sale_price !== undefined &&
      Math.abs(product.sale_price - originalPrice) > 0.01 && !product.price_change_reason) {
    errors.push('Se requiere justificación para modificación de precio');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calcula el precio final después de aplicar descuentos
 * @param {number} originalPrice - Precio original
 * @param {Object} product - Producto con datos de descuento
 * @returns {Object} - { finalPrice, discountAmount, percentage }
 */
export const calculateFinalPrice = (originalPrice, product) => {
  let finalPrice = originalPrice;
  let discountAmount = 0;
  let percentage = 0;

  // Aplicar modificación de precio si existe
  if (product.sale_price !== null && product.sale_price !== undefined) {
    finalPrice = product.sale_price;
  }

  // Aplicar descuento
  if (product.discount_amount !== null && product.discount_amount !== undefined) {
    discountAmount = Math.min(product.discount_amount, finalPrice);
    finalPrice -= discountAmount;
    percentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;
  } else if (product.discount_percent !== null && product.discount_percent !== undefined) {
    discountAmount = finalPrice * (product.discount_percent / 100);
    finalPrice -= discountAmount;
    percentage = product.discount_percent;
  }

  return {
    finalPrice: Math.max(0, finalPrice),
    discountAmount: Math.max(0, discountAmount),
    percentage: Math.max(0, percentage)
  };
};

/**
 * Valida todo el array de productos antes de crear la venta
 * @param {Array} productDetails - Array de productos con descuentos
 * @param {Object} originalPrices - Objeto con precios originales por product_id
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateSaleProducts = (productDetails, originalPrices) => {
  const errors = {};
  let isValid = true;

  productDetails.forEach((product, index) => {
    const originalPrice = originalPrices[product.product_id] || 0;
    const validation = validateDiscount(product, originalPrice);

    if (!validation.isValid) {
      errors[`product_${index}`] = validation.errors;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Valida una reserva antes de integrarla con la venta
 * @param {Object} reserve - Datos de la reserva
 * @param {string} clientId - ID del cliente de la venta
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateReserve = (reserve, clientId) => {
  const errors = [];

  if (!reserve) {
    return { isValid: true, errors: [] }; // Las reservas son opcionales
  }

  // Validar estado de la reserva
  if (reserve.status !== 'CONFIRMED') {
    errors.push('La reserva debe estar confirmada');
  }

  // Validar que pertenezca al cliente correcto
  if (reserve.client_id !== clientId) {
    errors.push('La reserva no pertenece al cliente seleccionado');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida todos los datos de la venta antes del envío
 * @param {Object} saleData - Datos completos de la venta
 * @param {Object} originalPrices - Precios originales de los productos
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateCompleteSale = (saleData, originalPrices) => {
  const errors = {};
  let isValid = true;

  // Validar datos básicos
  if (!saleData.client_id) {
    errors.client = ['Se requiere seleccionar un cliente'];
    isValid = false;
  }

  if (!saleData.product_details || saleData.product_details.length === 0) {
    errors.products = ['Se requiere al menos un producto'];
    isValid = false;
  }

  // Validar productos
  if (saleData.product_details && saleData.product_details.length > 0) {
    const productValidation = validateSaleProducts(saleData.product_details, originalPrices);
    if (!productValidation.isValid) {
      errors.productDetails = productValidation.errors;
      isValid = false;
    }
  }

  // Validar reserva si existe
  if (saleData.reserve_id) {
    // Nota: Esta validación requiere datos de la reserva que deberían obtenerse por separado
    errors.info = ['Validación de reserva debe realizarse por separado'];
  }

  return { isValid, errors };
};

/**
 * Constantes para los límites de descuentos
 */
export const DISCOUNT_LIMITS = {
  MAX_PERCENTAGE: 100,
  MIN_PERCENTAGE: 0,
  MIN_AMOUNT: 0,
  // Estos límites podrían venir de configuración del servidor
  MAX_AMOUNT_WITHOUT_AUTH: 50000, // Ejemplo: descuentos de más de 50k requieren autorización
  MAX_PERCENTAGE_WITHOUT_AUTH: 20  // Ejemplo: descuentos de más del 20% requieren autorización
};

/**
 * Verifica si un descuento requiere autorización especial
 * @param {Object} product - Producto con descuento
 * @param {number} originalPrice - Precio original
 * @returns {boolean} - true si requiere autorización
 */
export const requiresAuthorization = (product, originalPrice) => {
  if (product.discount_amount && product.discount_amount > DISCOUNT_LIMITS.MAX_AMOUNT_WITHOUT_AUTH) {
    return true;
  }

  if (product.discount_percent && product.discount_percent > DISCOUNT_LIMITS.MAX_PERCENTAGE_WITHOUT_AUTH) {
    return true;
  }

  return false;
};