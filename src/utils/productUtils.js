/**
 * Utilidades para manejo de productos enriquecidos
 */

/**
 * Verifica si un producto tiene datos enriquecidos
 */
export const isEnrichedProduct = (product) => {
  if (!product) return false;
  
  // Detectar productos enriquecidos del nuevo backend
  if (product.has_unit_pricing !== undefined || product.stock_status || product.price_formatted || product._enriched) {
    return true;
  }
  
  // Detectar productos enriquecidos del sistema anterior
  return !!(product.stock || product.price || product.description || product.category);
};

/**
 * Extrae información de stock de un producto enriquecido
 */
export const getProductStock = (product) => {
  if (!product) return null;
  
  // Nueva estructura financiera - stock_quantity directo
  if (product.stock_quantity !== undefined) {
    return {
      quantity: product.stock_quantity,
      hasStock: product.stock_quantity > 0,
      status: product.stock_status || 'unknown',
      updatedAt: product.stock_updated_at,
      updatedBy: product.stock_updated_by
    };
  }
  
  // Si el producto tiene datos de stock enriquecidos (estructura anterior)
  if (product.stock && typeof product.stock === 'object') {
    return {
      quantity: product.stock.quantity || 0,
      effectiveDate: product.stock.effective_date,
      metadata: product.stock.metadata,
      hasStock: product.stock.quantity > 0
    };
  }
  
  return null;
};

/**
 * Extrae información de precio de un producto enriquecido
 */
export const getProductPrice = (product) => {
  if (!product) return null;
  
  // Nueva estructura financiera - unit_prices
  if (product.unit_prices && Array.isArray(product.unit_prices) && product.unit_prices.length > 0) {
    const unitPrice = product.unit_prices[0];
    return {
      purchasePrice: unitPrice.price_per_unit,
      effectiveDate: unitPrice.effective_date,
      unit: unitPrice.unit,
      formatted: formatPrice(unitPrice.price_per_unit)
    };
  }
  
  // Si el producto tiene datos de precio enriquecidos (estructura anterior)
  if (product.price && typeof product.price === 'object') {
    return {
      purchasePrice: product.price.purchase_price,
      effectiveDate: product.price.effective_date,
      metadata: product.price.metadata,
      formatted: formatPrice(product.price.purchase_price)
    };
  }
  
  // Fallback a campos básicos de precio
  if (product.purchase_price !== undefined) {
    return {
      purchasePrice: product.purchase_price,
      formatted: formatPrice(product.purchase_price)
    };
  }
  
  return null;
};

/**
 * Extrae información de descripción de un producto enriquecido
 */
export const getProductDescription = (product) => {
  if (!product) return null;
  
  // Si el producto tiene datos de descripción enriquecidos
  if (product.description && typeof product.description === 'object') {
    return {
      text: product.description.description,
      effectiveDate: product.description.effective_date,
      id: product.description.id
    };
  }
  
  // Fallback a campo básico de descripción
  if (typeof product.description === 'string') {
    return {
      text: product.description
    };
  }
  
  return null;
};

/**
 * Extrae información de categoría de un producto enriquecido
 */
export const getProductCategory = (product) => {
  if (!product) return null;
  
  // Si el producto tiene datos de categoría enriquecidos
  if (product.category && typeof product.category === 'object') {
    return {
      id: product.category.id,
      name: product.category.name,
      description: product.category.description
    };
  }
  
  // Fallback a campo básico de categoría
  return {
    id: product.category_id || product.id_category
  };
};

/**
 * Formatea un precio para mostrar
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return 'N/A';
  
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

/**
 * Obtiene el estado del stock como texto
 */
export const getStockStatus = (product) => {
  if (!product) return { text: 'Sin información', status: 'unknown', color: 'gray' };
  
  // Si el producto tiene el nuevo campo stock_status del backend
  if (product.stock_status) {
    switch (product.stock_status) {
      case 'out_of_stock':
        return { text: 'Sin stock', status: 'out', color: 'red' };
      case 'low_stock':
        return { text: 'Stock bajo', status: 'low', color: 'orange' };
      case 'medium_stock':
        return { text: 'Stock medio', status: 'medium', color: 'blue' };
      case 'in_stock':
        return { text: 'En stock', status: 'in-stock', color: 'green' };
      case 'available':
        return { text: 'Disponible', status: 'available', color: 'blue' };
      default:
        return { text: product.stock_status.replace('_', ' '), status: 'custom', color: 'blue' };
    }
  }
  
  // Fallback al sistema anterior
  const stock = getProductStock(product);
  
  if (!stock) return { text: 'Sin stock', status: 'unknown', color: 'gray' };
  
  const quantity = stock.quantity;
  
  if (quantity === 0) {
    return { text: 'Agotado', status: 'out', color: 'red' };
  } else if (quantity <= 5) {
    return { text: `Bajo (${quantity})`, status: 'low', color: 'orange' };
  } else if (quantity <= 20) {
    return { text: `Disponible (${quantity})`, status: 'available', color: 'blue' };
  } else {
    return { text: `En stock (${quantity})`, status: 'in-stock', color: 'green' };
  }
};

/**
 * Verifica si un producto está activo
 */
export const isProductActive = (product) => {
  // Check multiple possible active fields for better compatibility
  return product.state === true ||
         product.state === 'active' ||
         product.is_active === true ||
         product.active === true ||
         product.status === true;
};

/**
 * Crea un resumen de producto para cards
 */
export const createProductSummary = (product) => {
  if (!product) return null;
  
  const stock = getProductStock(product);
  const price = getProductPrice(product);
  const description = getProductDescription(product);
  const category = getProductCategory(product);
  const stockStatus = getStockStatus(product);
  
  return {
    id: product.product_id || product.id,
    name: product.product_name || product.name,
    isActive: isProductActive(product),
    isEnriched: isEnrichedProduct(product),
    
    // Datos financieros de la nueva estructura
    hasUnitPricing: product.unit_prices?.length > 0 || product.has_unit_pricing || false,
    hasValidPrice: product.has_valid_prices || product.unit_prices?.length > 0 || false,
    hasValidStock: product.has_valid_stock || product.stock_quantity !== undefined || false,
    priceFormatted: price?.formatted || product.price_formatted || null,
    
    // Datos enriquecidos procesados
    stock: stock,
    price: price ? price : (product.price_formatted ? { formatted: product.price_formatted } : null),
    description: description ? description : (product.description ? { text: product.description } : null),
    category: category ? category : (product.category ? product.category : { name: product.category_name }),
    stockStatus: stockStatus,
    
    // Datos básicos como fallback
    basicData: {
      categoryId: product.category_id || product.id_category,
      categoryName: product.category_name,
      userId: product.user_id,
      productType: product.product_type,
      purchasePrice: product.purchase_price,
      stockQuantity: product.stock_quantity
    }
  };
};
