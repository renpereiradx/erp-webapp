// Mappers de productos API -> dominio y helpers
// Mantener aislado para facilitar cambios futuros de la API

/**
 * Normaliza un producto proveniente de la API a un modelo de dominio estable.
 * @param {any} apiProduct
 * @returns {import('../types').DomainProduct}
 */
export function mapApiProduct(apiProduct) {
  if (!apiProduct || typeof apiProduct !== 'object') return apiProduct;
  return {
    id: apiProduct.id,
    code: apiProduct.code || apiProduct.product_code || null,
    name: apiProduct.name || apiProduct.title || 'Sin nombre',
    categoryId: apiProduct.category_id ?? apiProduct.categoryId ?? null,
    category: apiProduct.category || null,
    isActive: apiProduct.is_active ?? apiProduct.active ?? true,
    stockQuantity: apiProduct.stock_quantity ?? apiProduct.quantity ?? null,
    price: apiProduct.price ?? apiProduct.price_value ?? null,
    priceFormatted: apiProduct.price_formatted || null,
    hasUnitPricing: !!apiProduct.has_unit_pricing,
    unitPrices: apiProduct.unit_prices || null,
    description: apiProduct.description || apiProduct.short_description || null,
    raw: apiProduct,
  };
}

/**
 * Aplica mapApiProduct de forma segura sobre un array.
 * @param {any[]} arr
 * @returns {import('../types').DomainProduct[]}
 */
export function mapApiProducts(arr = []) {
  return Array.isArray(arr) ? arr.map(mapApiProduct) : [];
}

export default { mapApiProduct, mapApiProducts };
