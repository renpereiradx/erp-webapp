
/**
 * Configuración centralizada de unidades de medida
 * Basado en docs/api/PRODUCT_UNIT.md
 */

export const UNIT_CONFIGS = {
  // Básicas (sin decimales)
  unit: { value: 'unit', label: 'Unidad', category: 'basic', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '10'] },
  pair: { value: 'pair', label: 'Par', category: 'basic', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '5'] },
  set: { value: 'set', label: 'Conjunto/Set', category: 'basic', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '3'] },

  // Peso (con decimales)
  kg: { value: 'kg', label: 'Kilogramo (kg)', category: 'weight', allow_decimals: true, step: 0.01, min: 0.01, examples: ['0.5', '1.25', '2.75'] },
  g: { value: 'g', label: 'Gramo (g)', category: 'weight', allow_decimals: true, step: 0.1, min: 0.1, examples: ['10.5', '250.0'] },
  lb: { value: 'lb', label: 'Libra (lb)', category: 'weight', allow_decimals: true, step: 0.01, min: 0.01, examples: ['0.5', '1.5', '2.25'] },
  oz: { value: 'oz', label: 'Onza (oz)', category: 'weight', allow_decimals: true, step: 0.1, min: 0.1, examples: ['8.5', '16.0'] },
  ton: { value: 'ton', label: 'Tonelada (t)', category: 'weight', allow_decimals: true, step: 0.001, min: 0.001, examples: ['0.5', '1.0', '2.5'] },

  // Volumen (con decimales)
  l: { value: 'l', label: 'Litro (l)', category: 'volume', allow_decimals: true, step: 0.01, min: 0.01, examples: ['0.5', '1.0', '1.5'] },
  ml: { value: 'ml', label: 'Mililitro (ml)', category: 'volume', allow_decimals: true, step: 1, min: 1, examples: ['250', '500'] },
  gal: { value: 'gal', label: 'Galón (gal)', category: 'volume', allow_decimals: true, step: 0.1, min: 0.1, examples: ['1.0', '2.5', '5.0'] },

  // Empaque (sin decimales)
  box: { value: 'box', label: 'Caja', category: 'packing', allow_decimals: false, step: 1, min: 1, examples: ['1', '5', '10'] },
  pack: { value: 'pack', label: 'Paquete', category: 'packing', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '6'] },
  bag: { value: 'bag', label: 'Bolsa', category: 'packing', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '5'] },
  case: { value: 'case', label: 'Cajón/Cartón', category: 'packing', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '3'] },
  dozen: { value: 'dozen', label: 'Docena', category: 'packing', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '5'] },
  bundle: { value: 'bundle', label: 'Atado', category: 'packing', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '3'] },

  // Longitud/Área (con decimales, excepto roll)
  meter: { value: 'meter', label: 'Metro (m)', category: 'length', allow_decimals: true, step: 0.01, min: 0.01, examples: ['1.5', '2.75', '10.0'] },
  cm: { value: 'cm', label: 'Centímetro (cm)', category: 'length', allow_decimals: true, step: 0.1, min: 0.1, examples: ['10.5', '25.0', '50.5'] },
  sqm: { value: 'sqm', label: 'Metro cuadrado (m²)', category: 'area', allow_decimals: true, step: 0.01, min: 0.01, examples: ['1.5', '2.25', '10.0'] },
  roll: { value: 'roll', label: 'Rollo', category: 'length', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '5'] },

  // Servicios
  hour: { value: 'hour', label: 'Hora', category: 'service', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '8'] },
  day: { value: 'day', label: 'Día', category: 'service', allow_decimals: false, step: 1, min: 1, examples: ['1', '7', '15'] },
  month: { value: 'month', label: 'Mes', category: 'service', allow_decimals: true, step: 0.5, min: 0.5, examples: ['1.0', '1.5', '6.0'] },

  // Supermercado (sin decimales)
  tray: { value: 'tray', label: 'Bandeja', category: 'grocery', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '5'] },
  bottle: { value: 'bottle', label: 'Botella', category: 'grocery', allow_decimals: false, step: 1, min: 1, examples: ['1', '6', '12'] },
  can: { value: 'can', label: 'Lata', category: 'grocery', allow_decimals: false, step: 1, min: 1, examples: ['1', '6', '12', '24'] },
  jar: { value: 'jar', label: 'Frasco', category: 'grocery', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '6'] },
  carton: { value: 'carton', label: 'Tetrapack', category: 'grocery', allow_decimals: false, step: 1, min: 1, examples: ['1', '6', '12'] },
  stick: { value: 'stick', label: 'Barra', category: 'grocery', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '5'] },
  slice: { value: 'slice', label: 'Rodaja/Rebanada', category: 'grocery', allow_decimals: false, step: 1, min: 1, examples: ['1', '5', '10'] },
  portion: { value: 'portion', label: 'Porción', category: 'grocery', allow_decimals: false, step: 1, min: 1, examples: ['1', '2', '5'] },
};

// Categorías para agrupar en selectores
export const UNIT_CATEGORIES = {
  basic: 'Básicas',
  weight: 'Peso',
  volume: 'Volumen',
  packing: 'Empaque',
  length: 'Longitud',
  area: 'Área',
  service: 'Servicios',
  grocery: 'Supermercado'
};

/**
 * Obtiene la configuración de una unidad
 * @param {string} unit - Código de la unidad
 * @returns {object} Configuración de la unidad o configuración default (unit)
 */
export const getUnitConfig = (unit) => {
  return UNIT_CONFIGS[unit] || UNIT_CONFIGS.unit;
};

/**
 * Obtiene la etiqueta legible de una unidad
 * @param {string} unit - Código de la unidad
 * @returns {string} Etiqueta de la unidad
 */
export const getUnitLabel = (unit) => {
  return getUnitConfig(unit).label;
};

/**
 * Verifica si una unidad permite decimales
 * @param {string} unit - Código de la unidad
 * @returns {boolean}
 */
export const isDecimalUnit = (unit) => {
  return getUnitConfig(unit).allow_decimals;
};

/**
 * Valida si una cantidad es válida para una unidad específica
 * @param {number|string} quantity - Cantidad a validar
 * @param {string} unit - Código de la unidad
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validateQuantity = (quantity, unit) => {
  const config = getUnitConfig(unit);
  const num = parseFloat(quantity);

  if (isNaN(num)) {
    return { valid: false, error: 'Debe ser un número válido' };
  }

  if (num < config.min) {
    return { valid: false, error: `El valor mínimo es ${config.min}` };
  }

  if (!config.allow_decimals && !Number.isInteger(num)) {
    return { valid: false, error: `La unidad "${config.label}" no permite decimales` };
  }

  return { valid: true, error: null };
};

/**
 * Obtiene una lista de opciones agrupadas para un elemento <select>
 * @returns {Array} Array de grupos con opciones
 */
export const getGroupedUnitOptions = () => {
  const groups = {};
  
  Object.values(UNIT_CONFIGS).forEach(unit => {
    if (!groups[unit.category]) {
      groups[unit.category] = {
        label: UNIT_CATEGORIES[unit.category] || unit.category,
        options: []
      };
    }
    groups[unit.category].options.push(unit);
  });

  return Object.values(groups);
};
