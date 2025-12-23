/**
 * Traducciones de inventario en español
 * Módulo: Gestión de inventario, ajustes, transacciones, conteos físicos
 */

export const inventory = {
  // Títulos y navegación
  'inventory.title': 'Gestión de Inventario',
  'inventory.subtitle': 'Control de stock, inventarios físicos y transacciones',

  // Acciones
  'inventory.action.create': 'Nuevo Inventario',
  'inventory.action.adjustment': 'Ajuste Manual',
  'inventory.action.transaction': 'Nueva Transacción',
  'inventory.action.validate': 'Validar Consistencia',

  // Estados vacíos
  'inventory.empty.title': 'Sin inventarios',
  'inventory.empty.message': 'No hay inventarios registrados',

  // Errores
  'inventory.error.title': 'Error al cargar',
  'inventory.error.generic': 'Error al procesar. Intente nuevamente.',

  // Búsqueda
  'inventory.search.placeholder': 'Buscar inventarios...',

  // Modales
  'inventory.modal.create': 'CREAR INVENTARIO',
  'inventory.modal.edit': 'EDITAR INVENTARIO',
  'inventory.modal.adjustment': 'AJUSTE MANUAL',
  'inventory.modal.transaction': 'NUEVA TRANSACCIÓN',
  'inventory.modal.details': 'DETALLES DEL INVENTARIO',

  // Campos del formulario
  'inventory.field.check_date': 'Fecha de Conteo',
  'inventory.field.product_id': 'Producto',
  'inventory.field.quantity_checked': 'Cantidad Contada',
  'inventory.field.new_quantity': 'Nueva Cantidad',
  'inventory.field.reason': 'Motivo',
  'inventory.field.transaction_type': 'Tipo de Transacción',
  'inventory.field.quantity_change': 'Cambio en Cantidad',
  'inventory.field.unit_price': 'Precio Unitario',

  // Estados
  'inventory.status.active': 'Activo',
  'inventory.status.invalid': 'Invalidado',

  // Tarjetas de información
  'inventory.card.id': 'ID:',
  'inventory.card.date': 'FECHA:',
  'inventory.card.user': 'USUARIO:',
  'inventory.card.status': 'ESTADO:',
  'inventory.card.items': 'PRODUCTOS:',
  'inventory.card.changes': 'CAMBIOS:',

  // Transacciones
  'inventory.transactions.title': 'Historial de Transacciones',
  'inventory.transactions.empty': 'Sin transacciones',
  'inventory.transactions.type.PURCHASE': 'Compra',
  'inventory.transactions.type.SALE': 'Venta',
  'inventory.transactions.type.ADJUSTMENT': 'Ajuste',
  'inventory.transactions.type.INVENTORY': 'Inventario',
  'inventory.transactions.type.INITIAL': 'Inicial',
  'inventory.transactions.type.LOSS': 'Pérdida',
  'inventory.transactions.type.FOUND': 'Hallazgo',

  // Validación de consistencia
  'inventory.consistency.title': 'Validación de Consistencia',
  'inventory.consistency.run': 'Ejecutar Validación',
  'inventory.consistency.total': 'Total de Productos:',
  'inventory.consistency.inconsistent': 'Inconsistentes:',
  'inventory.consistency.rate': 'Tasa de Consistencia:',
  'inventory.consistency.status.consistent': 'Consistente',
  'inventory.consistency.status.inconsistent': 'Inconsistente',

  // Botones
  'inventory.buttons.invalidate': 'Invalidar',
  'inventory.buttons.view_details': 'Ver Detalles',
  'inventory.buttons.add_item': 'Agregar Producto',
  'inventory.buttons.remove_item': 'Quitar',

  // Validaciones
  'inventory.validation.product_required': 'Producto es requerido',
  'inventory.validation.quantity_required': 'Cantidad es requerida',
  'inventory.validation.quantity_positive': 'Cantidad debe ser mayor a 0',
  'inventory.validation.reason_required': 'Motivo es requerido',
}
