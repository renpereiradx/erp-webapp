/**
 * Valores por defecto para el sistema de inventarios
 * Basado en la documentación INVENTORY_ADJUST_API.md v2.2
 */

export const DEFAULT_REASONS = {
  // Ajustes Manuales
  MANUAL_ADJUSTMENT: {
    PHYSICAL_COUNT: 'Ajuste por conteo físico',
    DAMAGED_GOODS: 'Producto dañado o vencido',
    INVENTORY_CORRECTION: 'Corrección de inventario',
    SYSTEM_ERROR: 'Corrección por error del sistema',
    THEFT_LOSS: 'Pérdida por robo o extravío',
    SUPPLIER_ERROR: 'Error en entrega del proveedor',
    EXPIRATION: 'Producto vencido',
    BREAKAGE: 'Producto roto o dañado',
    QUALITY_CONTROL: 'Rechazo por control de calidad',
    INITIAL_STOCK: 'Configuración de stock inicial',
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
  PHYSICAL_COUNT: {
    source: 'physical_count',
    operator: '', // A completar por el usuario
    verification: 'single_check', // o "double_check"
    location: '', // ubicación del conteo
    counting_method: 'manual', // o "scanner"
    timestamp: () => new Date().toISOString(),
  },

  // Producto Dañado
  DAMAGED_GOODS: {
    source: 'quality_control',
    damage_type: '', // "expired", "broken", "contaminated", etc.
    damage_severity: 'total', // "partial", "total"
    disposal_method: '', // "discard", "return_supplier", "repair"
    photos_taken: false,
    insurance_claim: false,
  },

  // Error del Sistema
  SYSTEM_ERROR: {
    source: 'system_correction',
    error_type: '', // "sync_error", "calculation_error", etc.
    original_transaction: '', // ID de transacción original
    detection_method: 'audit', // "audit", "user_report", "automatic"
    corrected_by: '', // ID del usuario que corrige
    approval_required: false,
  },

  // Configuración Inicial
  INITIAL_STOCK: {
    source: 'initial_setup',
    migration_date: () => new Date().toISOString(),
    data_source: '', // "manual", "import", "system_migration"
    verified_by: '', // Usuario que verificó
    cost_basis: '', // Base del costo
    notes: '',
  },

  // Transferencia
  TRANSFER: {
    source: 'transfer',
    from_location: '',
    to_location: '',
    transfer_type: 'internal', // "internal", "external"
    shipping_method: '',
    tracking_number: '',
    expected_delivery: '',
    carrier: '',
  },

  // Genérico/Mínimo
  DEFAULT: {
    source: 'manual_entry',
    timestamp: () => new Date().toISOString(),
    notes: '',
  },
}

// Para dropdowns en el frontend
export const REASON_OPTIONS = [
  { value: 'PHYSICAL_COUNT', label: 'Conteo físico', icon: '📊' },
  { value: 'DAMAGED_GOODS', label: 'Producto dañado', icon: '❌' },
  {
    value: 'INVENTORY_CORRECTION',
    label: 'Corrección de inventario',
    icon: '🔧',
  },
  { value: 'SYSTEM_ERROR', label: 'Error del sistema', icon: '⚠️' },
  { value: 'THEFT_LOSS', label: 'Pérdida/Robo', icon: '🚫' },
  { value: 'SUPPLIER_ERROR', label: 'Error del proveedor', icon: '📦' },
  { value: 'EXPIRATION', label: 'Producto vencido', icon: '⏰' },
  { value: 'BREAKAGE', label: 'Producto roto', icon: '💥' },
  { value: 'QUALITY_CONTROL', label: 'Control de calidad', icon: '🔍' },
  { value: 'INITIAL_STOCK', label: 'Stock inicial', icon: '🏁' },
  { value: 'OTHER', label: 'Otro motivo', icon: '📝' },
]

// Plantillas de texto predeterminadas para cada categoría de motivo
export const REASON_DETAIL_TEMPLATES = {
  PHYSICAL_COUNT:
    'Ajuste realizado tras conteo físico del inventario. Se encontró diferencia entre el stock registrado y el stock real en almacén.',
  DAMAGED_GOODS:
    'Producto dañado durante almacenamiento/manipulación. Se procede a dar de baja del inventario por no cumplir condiciones de venta.',
  INVENTORY_CORRECTION:
    'Corrección de inventario por discrepancia detectada durante auditoría interna. Se ajusta cantidad para reflejar existencias reales.',
  SYSTEM_ERROR:
    'Corrección por error detectado en el sistema. La cantidad registrada no corresponde con el movimiento real de mercancía.',
  THEFT_LOSS:
    'Merma por pérdida o extravío de producto. Se registra faltante detectado sin causa identificable.',
  SUPPLIER_ERROR:
    'Ajuste por diferencia en entrega del proveedor. La cantidad recibida no coincide con la facturada.',
  EXPIRATION:
    'Producto dado de baja por vencimiento de fecha de caducidad. No apto para venta según políticas de calidad.',
  BREAKAGE:
    'Producto roto/deteriorado. Se retira del inventario disponible para venta.',
  QUALITY_CONTROL:
    'Rechazo por no superar control de calidad. Producto no cumple estándares requeridos para comercialización.',
  INITIAL_STOCK:
    'Configuración de stock inicial del producto. Primera carga de inventario en el sistema.',
  OTHER: '',
}

export const METADATA_TEMPLATES_OPTIONS = [
  { value: 'PHYSICAL_COUNT', label: 'Conteo físico' },
  { value: 'DAMAGED_GOODS', label: 'Producto dañado' },
  { value: 'SYSTEM_ERROR', label: 'Error del sistema' },
  { value: 'INITIAL_STOCK', label: 'Stock inicial' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'DEFAULT', label: 'Básico' },
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
    PHYSICAL_COUNT: ['operator', 'location'],
    DAMAGED_GOODS: ['damage_type', 'disposal_method'],
    SYSTEM_ERROR: ['error_type', 'detection_method'],
  }

  const requiredFields = typeValidations[reasonType] || []
  return requiredFields.every(field => metadata[field])
}
