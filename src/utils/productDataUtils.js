/**
 * Utilidades para optimizar las llamadas a la API evitando solicitudes innecesarias
 */

/**
 * Verifica si un producto ya tiene todos los datos enriquecidos necesarios
 * @param {Object} product - El objeto producto
 * @returns {Object} Información sobre qué datos están disponibles
 */
export const analyzeProductData = (product) => {
  if (!product) {
    return {
      hasAllData: false,
      missingData: ['product'],
      availableData: []
    };
  }

  const dataAnalysis = {
    // Datos básicos
    hasId: !!product.id,
    hasName: !!product.name,
    
    // Datos de enriquecimiento
    isEnriched: product._enriched === true,
    hasEnrichmentIndicators: product.has_unit_pricing !== undefined ||
                             product.stock_status !== undefined ||
                             product.price_formatted !== undefined ||
                             product.has_valid_price !== undefined,
    
    // Descripción
    hasDescriptionField: product.hasOwnProperty('description'),
    hasDescriptionValue: !!product.description,
    
    // Precios
    hasPriceField: product.hasOwnProperty('price'),
    hasPurchasePriceField: product.hasOwnProperty('purchase_price'),
    hasPriceValue: product.price !== undefined && product.price !== null,
    hasPurchasePriceValue: product.purchase_price !== undefined && product.purchase_price !== null,
    hasPriceFormatted: !!product.price_formatted,
    hasUnitPrices: Array.isArray(product.unit_prices) && product.unit_prices.length > 0,
    
    // Stock
    hasStockField: product.hasOwnProperty('stock_quantity'),
    hasStockValue: product.stock_quantity !== undefined && product.stock_quantity !== null,
    hasStockStatus: !!product.stock_status,
    
    // Categoría
    hasCategoryField: product.hasOwnProperty('category'),
    hasCategoryValue: !!product.category,
    hasCategoryId: product.category_id !== undefined,
    hasCategoryName: !!product.category_name
  };

  // Determinar qué datos están disponibles y cuáles faltan
  const availableData = [];
  const missingData = [];

  // Descripción
  if (dataAnalysis.hasDescriptionField) {
    availableData.push('description');
  } else {
    missingData.push('description');
  }

  // Precios
  if (dataAnalysis.hasPriceField || dataAnalysis.hasPurchasePriceField || dataAnalysis.hasPriceFormatted) {
    availableData.push('prices');
  } else {
    missingData.push('prices');
  }

  // Stock
  if (dataAnalysis.hasStockField || dataAnalysis.hasStockStatus) {
    availableData.push('stock');
  } else {
    missingData.push('stock');
  }

  // Categoría
  if (dataAnalysis.hasCategoryField || dataAnalysis.hasCategoryId) {
    availableData.push('category');
  } else {
    missingData.push('category');
  }

  return {
    ...dataAnalysis,
    hasAllData: missingData.length === 0,
    availableData,
    missingData,
    
    // Recomendaciones
    needsDescriptionAPI: !dataAnalysis.hasDescriptionField,
    needsStockAPI: !dataAnalysis.hasStockField && !dataAnalysis.hasStockStatus,
    needsPriceAPI: !dataAnalysis.hasPriceField && !dataAnalysis.hasPurchasePriceField && !dataAnalysis.hasPriceFormatted,
    
    // Resumen
    completenessPercentage: Math.round((availableData.length / 4) * 100)
  };
};

/**
 * Registra en consola el análisis de datos del producto
 * @param {Object} product - El objeto producto
 * @param {string} context - Contexto donde se hace el análisis
 */
export const logProductDataAnalysis = (product, context = '') => {
  const analysis = analyzeProductData(product);
  
  console.group(`📊 Análisis de datos del producto ${context ? `(${context})` : ''}`);
  console.log('🆔 Producto:', product?.id || 'Sin ID');
  console.log('📈 Completitud:', `${analysis.completenessPercentage}%`);
  console.log('✅ Datos disponibles:', analysis.availableData);
  console.log('❌ Datos faltantes:', analysis.missingData);
  
  if (analysis.needsDescriptionAPI) {
    console.warn('⚠️ Necesita API call para descripción');
  }
  if (analysis.needsStockAPI) {
    console.warn('⚠️ Necesita API call para stock');
  }
  if (analysis.needsPriceAPI) {
    console.warn('⚠️ Necesita API call para precios');
  }
  
  if (analysis.hasAllData) {
    console.log('🎉 Producto completo - No necesita API calls adicionales');
  }
  
  console.groupEnd();
  
  return analysis;
};

/**
 * Extrae datos seguros del producto evitando valores undefined
 * @param {Object} product - El objeto producto
 * @returns {Object} Datos seguros del producto
 */
export const extractSafeProductData = (product) => {
  if (!product) {
    return {
      description: 'Sin descripción disponible',
      priceData: { cost_price: '', sale_price: '', tax: '' },
      stockData: { current: 0, minimum: 0, maximum: 0, reserved: 0 }
    };
  }

  return {
    description: product.hasOwnProperty('description') 
      ? (product.description || 'Sin descripción disponible')
      : null, // null indica que necesita API call
    
    priceData: {
      cost_price: product.purchase_price || '',
      sale_price: product.price || product.purchase_price || '',
      tax: product.tax || ''
    },
    
    stockData: {
      current: product.hasOwnProperty('stock_quantity') 
        ? (product.stock_quantity || 0)
        : null, // null indica que necesita API call
      minimum: 0,
      maximum: 0,
      reserved: 0
    }
  };
};

export default {
  analyzeProductData,
  logProductDataAnalysis,
  extractSafeProductData
};
