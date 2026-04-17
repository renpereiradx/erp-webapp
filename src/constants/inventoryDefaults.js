/**
 * Valores por defecto para el sistema de inventarios
 * Basado en la documentación INVENTORY_ADJUST_API.md v2.2
 */

export const DEFAULT_REASONS = {
  // Ajustes Manuales
  MANUAL_ADJUSTMENT: {
    INVENTORY_COUNT: 'Ajuste por conteo físico',
    DAMAGE: 'Producto dañado o vencido',
    CORRECTION: 'Corrección de inventario',
    SYSTEM_ERROR: 'Corrección por error del sistema',
    THEFT: 'Pérdida por robo o extravío',
    SUPPLIER_ERROR: 'Error en entrega del proveedor',
    EXPIRY: 'Producto vencido',
    BREAKAGE: 'Producto roto o dañado',
    QUALITY_CONTROL: 'Rechazo por control de calidad',
    INITIAL_COUNT: 'Configuración de stock inicial',
    RECLASSIFICATION: 'Reclasificación de producto',
    OTHER: 'Otro motivo (especificar en metadata)',
  },


  // Transacciones de Stock
  STOCK_TRANSACTION: {
    PURCHASE: 'Entrada por compra',
    SALE: 'Salida por venta',
    TRANSFER_IN: 'Transferencia entrante',
    TRANSFER_OUT: 'Transferencia saliente',
    RETURN: 'Devolución de cliente',
    SUPPLIER_RETURN: 'Devolución a proveedor',
    PROMOTION: 'Salida por promoción',
    SAMPLE: 'Muestra gratuita',
    INTERNAL_USE: 'Uso interno',
    DESTRUCTION: 'Destrucción de producto',
  },
}

export const DEFAULT_METADATA_TEMPLATES = {
  // Conteo Físico
  INVENTORY_COUNT: {
    source: 'physical_count',
    adjustment_type: 'INVENTORY_COUNT',
    inventory_type: 'MONTHLY', // Default v4.2
    status: 'COMPLETED', // Default v4.2
    operator: '', // A completar por el usuario
    verification: 'single_check', // o "double_check"
    location: '', // ubicación del conteo
    counting_method: 'manual', // o "barcode_scanner"
    timestamp: () => new Date().toISOString(),
    system_version: '4.2.0-frontend',
  },

  // Producto Dañado
  DAMAGE: {
    source: 'manual_adjustment',
    adjustment_type: 'DAMAGE',
    damage_severity: 'total', // "partial", "total"
    disposal_method: '', // "discard", "return_supplier", "repair"
    operator: '',
    location: '',
    timestamp: () => new Date().toISOString(),
    system_version: '4.2.0-frontend',
  },

  // Producto Vencido
  EXPIRY: {
    source: 'manual_adjustment',
    adjustment_type: 'EXPIRY',
    expiry_date: '', // ISO date string
    operator: '',
    location: '',
    timestamp: () => new Date().toISOString(),
    system_version: '4.2.0-frontend',
  },

  // Robo o Extravío
  THEFT: {
    source: 'manual_adjustment',
    adjustment_type: 'THEFT',
    operator: '',
    location: '',
    timestamp: () => new Date().toISOString(),
    system_version: '4.2.0-frontend',
  },

  // Devolución
  RETURN: {
    source: 'manual_adjustment',
    adjustment_type: 'RETURN',
    reference_document: '',
    operator: '',
    location: '',
    timestamp: () => new Date().toISOString(),
    system_version: '4.2.0-frontend',
  },

  // Corrección
  CORRECTION: {
    source: 'system_correction',
    adjustment_type: 'CORRECTION',
    previous_stock: 0,
    new_stock: 0,
    stock_difference: 0,
    operator: '',
    location: '',
    timestamp: () => new Date().toISOString(),
    system_version: '4.2.0-frontend',
  },

  // Configuración Inicial
  INITIAL_COUNT: {
    source: 'initial_setup',
    adjustment_type: 'INITIAL_COUNT',
    operator: '',
    location: '',
    timestamp: () => new Date().toISOString(),
    system_version: '4.2.0-frontend',
  },

  // Genérico/Mínimo
  DEFAULT: {
    source: 'manual_adjustment',
    adjustment_type: 'CORRECTION',
    timestamp: () => new Date().toISOString(),
    operator: '',
    location: '',
    system_version: '4.2.0-frontend',
    notes: '',
  },
}

// Para dropdowns en el frontend - Alineado con adjustment_type enum v4.1
export const REASON_OPTIONS = [
  { value: 'INVENTORY_COUNT', label: 'Conteo físico', icon: '📊' },
  { value: 'DAMAGE', label: 'Producto dañado', icon: '❌' },
  { value: 'EXPIRY', label: 'Producto vencido', icon: '⏰' },
  { value: 'THEFT', label: 'Pérdida/Robo', icon: '🚫' },
  { value: 'RETURN', label: 'Devolución', icon: '📦' },
  { value: 'CORRECTION', label: 'Corrección de inventario', icon: '🔧' },
  { value: 'INITIAL_COUNT', label: 'Stock inicial', icon: '🏁' },
  { value: 'OTHER', label: 'Otro motivo', icon: '📝' },
]

// Plantillas de texto predeterminadas para cada categoría de motivo
export const REASON_DETAIL_TEMPLATES = {
  INVENTORY_COUNT:
    'Ajuste realizado tras conteo físico del inventario. Se encontró diferencia entre el stock registrado y el stock real en almacén.',
  DAMAGE:
    'Producto dañado durante almacenamiento/manipulación. Se procede a dar de baja del inventario.',
  EXPIRY:
    'Producto dado de baja por vencimiento de fecha de caducidad. No apto para venta.',
  THEFT:
    'Merma por pérdida o extravío de producto. Se registra faltante detectado sin causa identificable.',
  RETURN:
    'Reingreso de stock por devolución de producto en condiciones aptas para la venta.',
  CORRECTION:
    'Corrección de inventario por discrepancia detectada durante auditoría interna.',
  INITIAL_COUNT:
    'Configuración de stock inicial del producto. Primera carga de inventario en el sistema.',
  OTHER: '',
}

export const METADATA_TEMPLATES_OPTIONS = [
  { value: 'INVENTORY_COUNT', label: 'Conteo físico' },
  { value: 'DAMAGE', label: 'Producto dañado' },
  { value: 'EXPIRY', label: 'Vencimiento' },
  { value: 'THEFT', label: 'Robo/Pérdida' },
  { value: 'RETURN', label: 'Devolución' },
  { value: 'CORRECTION', label: 'Corrección' },
  { value: 'INITIAL_COUNT', label: 'Stock inicial' },
  { value: 'DEFAULT', label: 'Básico' },
]

export const INVENTORY_TYPES = [
  { value: 'ANNUAL', label: 'Anual' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'DAILY', label: 'Diario' },
  { value: 'SPOT_CHECK', label: 'Control puntual' },
  { value: 'RANDOM', label: 'Aleatorio' },
  { value: 'CYCLIC', label: 'Cíclico' },
]

export const INVENTORY_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'REJECTED', label: 'Rechazado' },
]

/**
 * Función helper para generar requests con valores por defecto
 * @param {string} productId - ID del producto
 * @param {number} newQuantity - Nueva cantidad
 * @param {string} reasonType - Tipo de razón (clave de DEFAULT_REASONS.MANUAL_ADJUSTMENT)
 * @param {string} [customReason] - Razón personalizada (opcional)
 * @param {string} [metadataTemplate] - Plantilla de metadata (opcional)
 * @param {object} [customMetadata] - Metadata personalizada (opcional)
 * @returns {object} Request estructurado para ManualAdjustment
 */
export function createAdjustmentRequest(
  productId,
  newQuantity,
  reasonType,
  customReason = null,
  metadataTemplate = 'DEFAULT',
  customMetadata = {}
) {
  const reason = customReason || DEFAULT_REASONS.MANUAL_ADJUSTMENT[reasonType]
  const template = metadataTemplate || 'DEFAULT'
  const baseMetadata = { ...DEFAULT_METADATA_TEMPLATES[template] }

  // Ejecutar funciones para valores dinámicos
  Object.keys(baseMetadata).forEach(key => {
    if (typeof baseMetadata[key] === 'function') {
      baseMetadata[key] = baseMetadata[key]()
    }
  })

  return {
    product_id: productId,
    new_quantity: newQuantity,
    reason: reason,
    metadata: {
      ...baseMetadata,
      reason_type: reasonType,
      ...customMetadata,
    },
  }
}

/**
 * Valida una razón de ajuste
 * @param {string} reason - Razón a validar
 * @returns {boolean} True si es válida
 */
export function validateReason(reason) {
  return reason && reason.length >= 5 && reason.length <= 200
}

/**
 * Sugiere una razón basada en el tipo
 * @param {string} reasonType - Tipo de razón
 * @returns {string} Razón sugerida
 */
export function suggestReason(reasonType) {
  return (
    DEFAULT_REASONS.MANUAL_ADJUSTMENT[reasonType] ||
    'Especificar motivo del ajuste'
  )
}

/**
 * Valida metadata según el tipo de razón
 * @param {object} metadata - Metadata a validar
 * @param {string} reasonType - Tipo de razón
 * @returns {boolean} True si es válida
 */
export function validateMetadata(metadata, reasonType) {
  const required = {
    source: true,
    timestamp: true,
  }

  // Validaciones específicas por tipo
  const typeValidations = {
    INVENTORY_COUNT: ['operator', 'location'],
    DAMAGE: ['damage_type', 'disposal_method'],
    SYSTEM_ERROR: ['error_type', 'detection_method'],
  }

  const requiredFields = typeValidations[reasonType] || []
  return requiredFields.every(field => metadata[field])
}
