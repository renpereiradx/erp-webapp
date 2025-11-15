/**
 * Traducciones de compras en español
 * Módulo: Gestión de órdenes de compra, proveedores, pagos
 */

export const purchases = {
  // Títulos principales
  'purchases.title': 'Compras',
  'purchases.subtitle': 'Administra compras a proveedores, controla inventario y órdenes de compra',

  // Tabs de navegación
  'purchases.tab.new': 'Nueva Compra',
  'purchases.tab.history': 'Historial de Compras',
  'purchases.tab.list': 'Lista de Compras',

  // Búsqueda y filtros
  'purchases.search.placeholder': 'Buscar por proveedor o ID...',
  'purchases.search.type': 'Tipo de búsqueda',
  'purchases.search.by_supplier': 'Proveedor',
  'purchases.search.by_date': 'Fecha',
  'purchases.search.type_aria': 'Seleccionar tipo de búsqueda',
  'purchases.search.supplier_placeholder': 'Buscar proveedor por nombre, RUC o contacto...',
  'purchases.search.start_date': 'Fecha inicio',
  'purchases.search.end_date': 'Fecha fin',

  // Tabla de compras (historial)
  'purchases.table.id': 'ID Compra',
  'purchases.table.date': 'Fecha',
  'purchases.table.supplier': 'Proveedor',
  'purchases.table.total': 'Total',
  'purchases.table.delivery': 'Entrega',
  'purchases.table.status': 'Estado',
  'purchases.table.product_id': 'ID Producto',
  'purchases.table.margin': 'Margen (%)',
  'purchases.table.actions': 'Acciones',
  'purchases.table.actions_aria': 'Abrir menú de acciones',

  // Estados de orden
  'purchases.status.completed': 'Completada',
  'purchases.status.pending': 'Pendiente',
  'purchases.status.cancelled': 'Cancelada',
  'purchases.status.received': 'Recibida',

  // Acciones
  'purchases.action.create': 'Crear nueva orden',

  // Mensajes vacíos
  'purchases.empty.title': 'Sin órdenes de compra',
  'purchases.empty.message': 'No hay órdenes de compra registradas',
  'purchases.filter.empty': 'No se encontraron resultados para tu búsqueda',

  // Errores
  'purchases.error.title': 'Error al cargar compras',

  // === FORMULARIO DE NUEVA COMPRA ===

  // Sección de productos
  'purchases.form.products': 'Productos Seleccionados',
  'purchases.form.search_products': 'Buscar productos...',
  'purchases.form.add_product': 'Agregar Producto',
  'purchases.form.product': 'Producto',
  'purchases.form.quantity': 'Cantidad',
  'purchases.form.unit_price': 'Precio Unitario',
  'purchases.form.total': 'Total',
  'purchases.form.actions': 'Acciones',
  'purchases.form.no_products': 'No hay productos agregados aún. Busca y agrega productos a la orden de compra.',
  'purchases.form.remove_item': 'Eliminar',
  'purchases.form.profit_margin': 'Margen de Ganancia (%)',

  // Resumen de compra
  'purchases.form.summary': 'Resumen',
  'purchases.form.items': 'Artículos',
  'purchases.form.subtotal': 'Subtotal',
  'purchases.form.taxes': 'Impuestos (0%)',
  'purchases.form.save': 'Guardar Compra',
  'purchases.form.cancel': 'Cancelar',

  // Información del proveedor
  'purchases.form.supplier_info': 'Información del Proveedor',
  'purchases.form.select_supplier': 'Seleccionar proveedor...',
  'purchases.form.supplier_name': 'Proveedor',
  'purchases.form.contact': 'Contacto',
  'purchases.form.phone': 'Teléfono',
  'purchases.form.email': 'Email',
  'purchases.form.search_supplier': 'Buscar proveedor por nombre...',
  'purchases.form.searching_suppliers': 'Buscando proveedores...',
  'purchases.form.clear_supplier': 'Limpiar proveedor',
  'purchases.form.select_from_results': 'Seleccionar de resultados',
  'purchases.form.choose_supplier': 'Elegir proveedor...',
  'purchases.form.no_results': 'Busca para ver resultados...',

  // Detalles de pago
  'purchases.form.payment_details': 'Detalles de Pago',
  'purchases.form.payment_method': 'Método de Pago',
  'purchases.form.select_payment_method': 'Seleccionar método de pago...',
  'purchases.form.payment.cash': 'Efectivo',
  'purchases.form.payment.transfer': 'Transferencia Bancaria',
  'purchases.form.payment.check': 'Cheque',
  'purchases.form.payment.credit': 'Crédito',
  'purchases.form.payment_currency': 'Moneda de Pago',
  'purchases.form.currency.pyg': 'Guaraníes (PYG)',
  'purchases.form.currency.usd': 'Dólares (USD)',
  'purchases.form.currency.brl': 'Reales (BRL)',
  'purchases.form.currency.ars': 'Pesos Argentinos (ARS)',
  'purchases.form.loading_methods': 'Cargando métodos...',
  'purchases.form.loading_currencies': 'Cargando monedas...',

  // Detalles de la compra
  'purchases.form.purchase_details': 'Detalles de la Compra',
  'purchases.form.purchase_date': 'Fecha de Compra',
  'purchases.form.delivery_date': 'Fecha de Entrega Estimada',
  'purchases.form.notes': 'Notas',
  'purchases.form.notes_placeholder': 'Notas adicionales...',

  // Errores del formulario
  'purchases.form.errors.supplier_required': 'Debe seleccionar un proveedor',
  'purchases.form.errors.products_required': 'Debe agregar al menos un producto',
  'purchases.form.errors.duplicate_product': 'Este producto ya ha sido agregado. Use doble click para editar.',

  // Mensajes de éxito/error
  'purchases.form.success': 'Orden de compra creada exitosamente',
  'purchases.form.error': 'Error al crear orden de compra',

  // === MODAL DE AGREGAR PRODUCTO ===

  'purchases.modal.title': 'Agregar producto a la compra',
  'purchases.modal.edit_title': 'Editar producto en la compra',
  'purchases.modal.subtitle': 'Seleccione un artículo del catálogo, ajuste la cantidad y configure el margen de ganancia antes de añadirlo a la orden.',
  'purchases.modal.selected_product': 'Producto seleccionado',
  'purchases.modal.select_product': 'Selecciona un producto',
  'purchases.modal.product_placeholder': 'Buscar producto...',
  'purchases.modal.product_note': 'Escribe el nombre o código del producto',
  'purchases.modal.quantity_note': 'Cantidad de unidades a comprar',
  'purchases.modal.unit_price_note': 'Precio de compra del producto',
  'purchases.modal.profit_note': 'Porcentaje de ganancia sobre el costo',
  'purchases.modal.subtotal': 'Subtotal (costo x cant.)',
  'purchases.modal.line_total': 'Total venta (cant. x precio venta)',
  'purchases.modal.search_min_chars': 'Escribe al menos 2 caracteres para buscar',
  'purchases.modal.no_results': 'No se encontraron productos',

  // Método de pricing en modal
  'purchases.modal.pricing_mode': 'Método de Precio',
  'purchases.modal.pricing_mode.margin': 'Por margen de ganancia',
  'purchases.modal.pricing_mode.final_price': 'Por precio de venta',
  'purchases.modal.sale_price': 'Precio de Venta Final',
  'purchases.modal.sale_price_note': 'El margen se calculará automáticamente',
  'purchases.modal.calculated_margin': 'Margen calculado',
  'purchases.modal.calculated_sale_price': 'Precio de venta calculado',

  // === CONFIGURACIÓN DE COMPRA ===

  'purchases.config.title': 'Configuración de Compra',
  'purchases.config.expected_delivery': 'Fecha de Entrega Esperada',
  'purchases.config.payment_terms': 'Términos de Pago',
  'purchases.config.delivery_method': 'Método de Entrega',
  'purchases.config.notes': 'Notas',
  'purchases.config.notes.placeholder': 'Notas adicionales sobre la compra...',

  // === OTROS ===

  'purchases.supplier.info': 'Información del Proveedor',
  'purchases.products.title': 'Productos',
  'purchases.items.title': 'Items del Pedido ({count})',
  'purchases.actions.save': 'Crear Compra',
  'purchases.actions.saving': 'Creando Compra...',
  'purchases.clear': 'Limpiar Todo',

  // Lista de tareas (TODO)
  'purchases.todo.title': 'Por completar:',
  'purchases.todo.supplier': 'Seleccionar proveedor',
  'purchases.todo.items': 'Agregar productos',
  'purchases.todo.valid_items': 'Verificar cantidades',

  // Estado vacío inicial
  'purchases.empty.title': 'Comienza una compra',
  'purchases.empty.description': 'Selecciona un proveedor y comienza a agregar productos para crear una nueva orden de compra.',
  'purchases.empty.action': 'Seleccionar Proveedor',

  'purchases.create': 'Crear Compra',
  'purchases.saving': 'Creando Compra...',

  // Mensaje placeholder (temporal)
  'purchases.placeholder.message': 'Esta sección estará disponible pronto.',
}
