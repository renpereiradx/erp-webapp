/**
 * Traducciones para la página de Ajustes de Inventario
 */

export const inventoryAdjustments = {
  'inventory_adjustments.title': 'Ajustes de Inventario',
  'inventory_adjustments.subtitle': 'Seleccione el tipo de ajuste que desea realizar',
  'inventory_adjustments.unit.title': 'Ajuste Unitario',
  'inventory_adjustments.unit.description':
    'Ajustar el stock de un producto específico de forma manual.',
  'inventory_adjustments.unit.button': 'Ajuste Unitario',
  'inventory_adjustments.bulk.title': 'Ajuste Masivo',
  'inventory_adjustments.bulk.description':
    'Ajustar el stock de múltiples productos simultáneamente.',
  'inventory_adjustments.bulk.button': 'Ajuste Masivo',

  // Manual Adjustment Page
  'inventory_adjustments.manual.title': 'Ajuste Manual de Stock',
  'inventory_adjustments.manual.search_product': 'Buscar Producto',
  'inventory_adjustments.manual.back': 'Volver',

  // Selected Product
  'inventory_adjustments.manual.selected_product': 'Producto Seleccionado',
  'inventory_adjustments.manual.no_product_selected': 'No hay producto seleccionado. Haz clic en "Buscar Producto" para seleccionar uno.',
  'inventory_adjustments.manual.current_stock': 'Stock Actual',
  'inventory_adjustments.manual.units': 'Unidades',

  // Adjustment Form
  'inventory_adjustments.manual.new_adjustment': 'Nuevo Ajuste',
  'inventory_adjustments.manual.quantity_to_adjust': 'Cantidad a Ajustar',
  'inventory_adjustments.manual.quantity_placeholder': 'Ej: -10 o 25',
  'inventory_adjustments.manual.quantity_zero_error': 'La cantidad no puede ser cero',
  'inventory_adjustments.manual.quantity_negative_result_error': 'La cantidad resultante no puede ser negativa',
  'inventory_adjustments.manual.reason_category': 'Categoría del Motivo',
  'inventory_adjustments.manual.operator': 'Operador',
  'inventory_adjustments.manual.operator_placeholder': 'Nombre del operador',
  'inventory_adjustments.manual.operator_required': 'El operador es obligatorio',
  'inventory_adjustments.manual.location': 'Ubicación',
  'inventory_adjustments.manual.location_placeholder': 'Ubicación del conteo',
  'inventory_adjustments.manual.location_required': 'La ubicación es obligatoria',
  'inventory_adjustments.manual.details': 'Detalles / Justificación',
  'inventory_adjustments.manual.details_placeholder': 'Añadir un comentario detallado...',
  'inventory_adjustments.manual.details_required': 'Los detalles deben tener al menos 10 caracteres',
  'inventory_adjustments.manual.approval_level': 'Nivel de Aprobación',
  'inventory_adjustments.manual.approval_level_1': 'Nivel 1 - Operador',
  'inventory_adjustments.manual.approval_level_2': 'Nivel 2 - Supervisor',
  'inventory_adjustments.manual.approval_level_3': 'Nivel 3 - Manager',
  'inventory_adjustments.manual.approval_level_4': 'Nivel 4 - Admin',
  'inventory_adjustments.manual.source': 'Fuente',
  'inventory_adjustments.manual.source_manual': 'Manual',
  'inventory_adjustments.manual.date_time': 'Fecha/Hora',
  'inventory_adjustments.manual.not_specified': 'No especificado',
  'inventory_adjustments.manual.submit': 'Enviar Ajuste',
  'inventory_adjustments.manual.submitting': 'Enviando...',
  'inventory_adjustments.manual.clear': 'Limpiar',
  'inventory_adjustments.manual.success': 'Ajuste creado exitosamente',
  'inventory_adjustments.manual.error': 'Error al crear ajuste',
  'inventory_adjustments.manual.product_required': 'Debe seleccionar un producto',

  // History
  'inventory_adjustments.manual.history': 'Historial de Ajustes',
  'inventory_adjustments.manual.history_filter_placeholder': 'Filtrar por operador, motivo...',
  'inventory_adjustments.manual.history_loading': 'Cargando historial...',
  'inventory_adjustments.manual.history_no_results': 'No se encontraron resultados',
  'inventory_adjustments.manual.history_no_adjustments': 'No hay ajustes registrados para este producto',
  'inventory_adjustments.manual.history_select_product': 'Selecciona un producto para ver su historial',
  'inventory_adjustments.manual.history_date': 'Fecha',
  'inventory_adjustments.manual.history_operator': 'Operador',
  'inventory_adjustments.manual.history_quantity': 'Cantidad',
  'inventory_adjustments.manual.history_reason': 'Motivo',
  'inventory_adjustments.manual.history_approval': 'Aprobación',
  'inventory_adjustments.manual.history_not_available': 'N/A',

  // Product Search Modal
  'inventory_adjustments.manual.search_modal.title': 'Buscar Producto',
  'inventory_adjustments.manual.search_modal.placeholder': 'Buscar por nombre, SKU o ID...',
  'inventory_adjustments.manual.search_modal.no_results': 'No se encontraron productos',
  'inventory_adjustments.manual.search_modal.stock': 'Stock',

  // Reason Options
  'inventory_adjustments.reason.physical_count': 'Conteo físico',
  'inventory_adjustments.reason.damaged_goods': 'Producto dañado',
  'inventory_adjustments.reason.inventory_correction': 'Corrección de inventario',
  'inventory_adjustments.reason.system_error': 'Error del sistema',
  'inventory_adjustments.reason.theft_loss': 'Pérdida/Robo',
  'inventory_adjustments.reason.supplier_error': 'Error del proveedor',
  'inventory_adjustments.reason.expiration': 'Producto vencido',
  'inventory_adjustments.reason.breakage': 'Producto roto',
  'inventory_adjustments.reason.quality_control': 'Control de calidad',
  'inventory_adjustments.reason.initial_stock': 'Stock inicial',
  'inventory_adjustments.reason.other': 'Otro motivo',
}
