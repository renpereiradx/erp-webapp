/**
 * Traducciones de pagos de compras MVP en español
 * Módulo: Gestión de pagos de órdenes de compra, seguimiento de saldos
 */

export const purchasePaymentsMvp = {
  // Títulos y subtítulos
  'purchasePaymentsMvp.title': 'Pagos Compras (MVP)',
  'purchasePaymentsMvp.subtitle':
    'Supervisa saldos pendientes, pagos parciales y vencidos de tus órdenes de compra.',

  // Acciones principales
  'purchasePaymentsMvp.actions.refresh': 'Actualizar',
  'purchasePaymentsMvp.actions.export': 'Descargar',
  'purchasePaymentsMvp.actions.registerPayment': 'Registrar pago',

  // Filtros
  'purchasePaymentsMvp.filters.refresh': 'Refrescar',
  'purchasePaymentsMvp.filters.sectionLabel':
    'Opciones de filtrado para pagos de compras',
  'purchasePaymentsMvp.filters.title': 'Filtros',
  'purchasePaymentsMvp.filters.search.label': 'Buscar órdenes',
  'purchasePaymentsMvp.filters.search.placeholder':
    'Buscar por ID de orden o proveedor...',
  'purchasePaymentsMvp.filters.supplier.label': 'Proveedor',
  'purchasePaymentsMvp.filters.supplier.placeholder': 'Selecciona un proveedor',
  'purchasePaymentsMvp.filters.supplier.all': 'Todos los proveedores',
  'purchasePaymentsMvp.filters.status.label': 'Estado de pago',
  'purchasePaymentsMvp.filters.status.placeholder': 'Selecciona un estado',
  'purchasePaymentsMvp.filters.status.all': 'Todos los estados',
  'purchasePaymentsMvp.filters.dateFrom.label': 'Desde',
  'purchasePaymentsMvp.filters.dateTo.label': 'Hasta',
  'purchasePaymentsMvp.filters.dateRange.label': 'Rango de fechas',
  'purchasePaymentsMvp.filters.pendingOnly': 'Solo con saldo pendiente',
  'purchasePaymentsMvp.filters.apply': 'Aplicar filtros',
  'purchasePaymentsMvp.filters.reset': 'Restablecer',

  // Prioridades
  'purchasePaymentsMvp.priority.high': 'Prioridad alta',
  'purchasePaymentsMvp.priority.medium': 'Prioridad media',
  'purchasePaymentsMvp.priority.low': 'Prioridad baja',
  'purchasePaymentsMvp.priority.critical': 'Prioridad crítica',

  // Estados
  'purchasePaymentsMvp.status.pending': 'Pendiente',
  'purchasePaymentsMvp.status.partial': 'Pago parcial',
  'purchasePaymentsMvp.status.paid': 'Pagado',
  'purchasePaymentsMvp.status.overdue': 'Vencido',
  'purchasePaymentsMvp.status.cancelled': 'Cancelado',
  'purchasePaymentsMvp.status.overdueLabel': 'Pago vencido',

  // Estados con mayúscula (variante de nomenclatura)
  'PurchasePaymentsMvp.Status.Pending': 'Pendiente',
  'PurchasePaymentsMvp.Status.Partial': 'Pago parcial',
  'PurchasePaymentsMvp.Status.Paid': 'Pagado',
  'PurchasePaymentsMvp.Status.Completed': 'Completado',
  'PurchasePaymentsMvp.Status.Overdue': 'Vencido',
  'PurchasePaymentsMvp.Status.Cancelled': 'Cancelado',

  // Errores y estados vacíos
  'purchasePaymentsMvp.data.error.title': 'Error al cargar pagos',
  'purchasePaymentsMvp.data.error.description':
    'No pudimos obtener las órdenes seleccionadas. Intenta nuevamente.',
  'purchasePaymentsMvp.data.empty.title': 'Sin resultados',
  'purchasePaymentsMvp.data.empty.description':
    'No hay órdenes de compra que coincidan con los filtros.',

  // Tabla
  'purchasePaymentsMvp.table.order': 'Orden de compra',
  'purchasePaymentsMvp.table.supplier': 'Proveedor',
  'purchasePaymentsMvp.table.issueDate': 'Fecha de emisión',
  'purchasePaymentsMvp.table.dueDate': 'Fecha de vencimiento',
  'purchasePaymentsMvp.table.status': 'Estado',
  'purchasePaymentsMvp.table.total': 'Importe total',
  'purchasePaymentsMvp.table.pending': 'Saldo pendiente',
  'purchasePaymentsMvp.table.lastPayment': 'Último pago',
  'purchasePaymentsMvp.table.lastPayment.none': 'Sin pagos registrados',
  'purchasePaymentsMvp.table.emptyMessage':
    'No se encontraron compras para los filtros aplicados.',

  // Resumen
  'purchasePaymentsMvp.summary.sectionLabel': 'Resumen de pagos de compras',
  'purchasePaymentsMvp.metrics.pendingOrders': 'Órdenes con saldo pendiente',
  'purchasePaymentsMvp.metrics.pendingAmount': 'Saldo pendiente total',
  'purchasePaymentsMvp.metrics.totalResults': 'Resultados totales',
  'purchasePaymentsMvp.summary.pendingDetail':
    '{{count}} órdenes necesitan atención para mantenerse al día.',
  'purchasePaymentsMvp.summary.currency': 'Moneda base: {{currency}}',
  'purchasePaymentsMvp.summary.resultsHelper':
    '{{total}} registros cargados en esta vista.',

  // Resultados
  'purchasePaymentsMvp.results.sectionLabel': 'Resultados de pagos de compras',

  // Paginación
  'purchasePaymentsMvp.pagination.range':
    'Mostrando {from}-{to} de {total} órdenes',
  'purchasePaymentsMvp.pagination.results':
    'Mostrando {count} de {total} resultados',
  'purchasePaymentsMvp.pagination.empty': 'No hay órdenes para paginar',
  'purchasePaymentsMvp.pagination.previous': 'Anterior',
  'purchasePaymentsMvp.pagination.pageOf': 'Página {page} de {totalPages}',
  'purchasePaymentsMvp.pagination.next': 'Siguiente',

  // Selección
  'purchasePaymentsMvp.selection.all': 'Seleccionar todas las órdenes',
  'purchasePaymentsMvp.selection.row': 'Seleccionar orden {id}',
  'purchasePaymentsMvp.selection.count': '{count} órdenes seleccionadas',

  // Detalle de orden
  'purchasePaymentsMvp.detail.back': 'Volver a Pagos Compras (MVP)',
  'purchasePaymentsMvp.detail.heading': 'Orden de compra {orderId}',
  'purchasePaymentsMvp.detail.description':
    'Revisá el estado, pagos registrados y productos asociados a la orden.',
  'purchasePaymentsMvp.detail.registerPayment': 'Registrar nuevo pago',

  // Resumen de orden
  'purchasePaymentsMvp.detail.summary.title': 'Resumen de la orden',
  'purchasePaymentsMvp.detail.summary.progress': 'Progreso del pago',
  'purchasePaymentsMvp.detail.summary.total': 'Monto total',
  'purchasePaymentsMvp.detail.summary.paid': 'Monto abonado',
  'purchasePaymentsMvp.detail.summary.pending': 'Saldo pendiente',
  'purchasePaymentsMvp.detail.summary.issueDate': 'Fecha de emisión',
  'purchasePaymentsMvp.detail.summary.dueDate': 'Fecha de vencimiento',
  'purchasePaymentsMvp.detail.summary.owner': 'Responsable',
  'purchasePaymentsMvp.detail.summary.overdueLabel': 'Pago vencido',
  'purchasePaymentsMvp.detail.summary.onTimeLabel': 'Al día',

  // Historial de pagos
  'purchasePaymentsMvp.detail.history.title': 'Historial de pagos',
  'purchasePaymentsMvp.detail.history.empty':
    'No hay pagos registrados todavía.',
  'purchasePaymentsMvp.detail.history.columns.date': 'Fecha',
  'purchasePaymentsMvp.detail.history.columns.user': 'Usuario',
  'purchasePaymentsMvp.detail.history.columns.amount': 'Monto',
  'purchasePaymentsMvp.detail.history.columns.status': 'Estado',
  'purchasePaymentsMvp.detail.history.status.approved': 'Aprobado',
  'purchasePaymentsMvp.detail.history.status.delayed': 'Con retraso',

  // Modal de registro de pagos
  'purchasePaymentsMvp.registerModal.title': 'Registrar nuevo pago',
  'purchasePaymentsMvp.registerModal.orderLabel':
    'Pago para la orden {orderId}',
  'purchasePaymentsMvp.registerModal.orderFallback':
    'Seleccioná una orden con saldo pendiente para registrar el pago.',
  'purchasePaymentsMvp.registerModal.amount.label': 'Monto a registrar',
  'purchasePaymentsMvp.registerModal.amount.pending':
    'Saldo pendiente: {amount}',
  'purchasePaymentsMvp.registerModal.amount.errorRequired':
    'Ingresá un monto válido.',
  'purchasePaymentsMvp.registerModal.amount.errorExceeded':
    'El monto no puede superar el saldo pendiente.',
  'purchasePaymentsMvp.registerModal.method.label': 'Método de pago',
  'purchasePaymentsMvp.registerModal.method.transfer': 'Transferencia bancaria',
  'purchasePaymentsMvp.registerModal.method.cash': 'Efectivo',
  'purchasePaymentsMvp.registerModal.currency.label': 'Moneda',
  'purchasePaymentsMvp.registerModal.reference.label': 'Referencia',
  'purchasePaymentsMvp.registerModal.reference.placeholder':
    'Ej. número de transacción o comprobante',
  'purchasePaymentsMvp.registerModal.cashRegister.label': 'Caja',
  'purchasePaymentsMvp.registerModal.cashRegister.placeholder':
    'Seleccioná una caja',
  'purchasePaymentsMvp.registerModal.cashRegister.main': 'Caja principal',
  'purchasePaymentsMvp.registerModal.cashRegister.secondary': 'Caja secundaria',
  'purchasePaymentsMvp.registerModal.notes.label': 'Notas',
  'purchasePaymentsMvp.registerModal.notes.placeholder':
    'Observaciones adicionales (opcional)',
  'purchasePaymentsMvp.registerModal.cancel': 'Cancelar',
  'purchasePaymentsMvp.registerModal.confirm': 'Registrar pago',
  'purchasePaymentsMvp.registerModal.loading': 'Registrando pago...',
  'purchasePaymentsMvp.registerModal.submitError':
    'No se pudo registrar el pago. Intentá nuevamente.',
  'purchasePaymentsMvp.registerModal.feedback.success':
    'Pago registrado correctamente para la orden {orderId}.',
  'purchasePaymentsMvp.registerModal.feedback.error':
    'Ocurrió un error al registrar el pago.',
  'purchasePaymentsMvp.registerModal.feedback.selectOrder':
    'Seleccioná una orden con saldo pendiente para registrar el pago.',
  'purchasePaymentsMvp.registerModal.feedback.singleOrder':
    'Seleccioná solo una orden para registrar un pago.',
  'purchasePaymentsMvp.registerModal.feedback.missingOrder':
    'No encontramos la orden seleccionada. Actualizá la lista.',
  'purchasePaymentsMvp.registerModal.feedback.noPending':
    'La orden {orderId} no tiene saldo pendiente.',

  // Proveedor
  'purchasePaymentsMvp.detail.supplier.title': 'Proveedor',
  'purchasePaymentsMvp.detail.supplier.contact': 'Contacto',
  'purchasePaymentsMvp.detail.supplier.email': 'Email',
  'purchasePaymentsMvp.detail.supplier.phone': 'Teléfono',
  'purchasePaymentsMvp.detail.supplier.taxId': 'RUC / Tax ID',
  'purchasePaymentsMvp.detail.supplier.address': 'Dirección',

  // Productos
  'purchasePaymentsMvp.detail.products.title': 'Productos incluidos',
  'purchasePaymentsMvp.detail.products.empty':
    'No hay productos asociados a esta orden.',
  'purchasePaymentsMvp.detail.products.headers.product': 'Producto',
  'purchasePaymentsMvp.detail.products.headers.quantity': 'Cantidad',
  'purchasePaymentsMvp.detail.products.headers.total': 'Total',

  // Badges de estado
  'purchasePaymentsMvp.detail.statusBadge.overdue': 'Pago vencido',
  'purchasePaymentsMvp.detail.statusBadge.onTrack': 'Sin retrasos',

  // Metadata
  'purchasePaymentsMvp.detail.meta.paymentsRecorded': 'Pagos registrados',
  'purchasePaymentsMvp.detail.meta.lastPayment': 'Último pago',
  'purchasePaymentsMvp.detail.meta.none': 'Sin registros',
}
