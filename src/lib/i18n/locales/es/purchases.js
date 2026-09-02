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
  'purchases.table.tax_rate': 'Impuesto',
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
  'purchases.filter.empty_date': 'No se encontraron compras en el rango de fechas seleccionado',

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
  'purchases.modal.quantity_placeholder': 'Ej: 10',
  'purchases.modal.quantity_note': 'Cantidad de unidades a comprar',
  'purchases.modal.unit_price_placeholder': 'Ej: 15000',
  'purchases.modal.unit_price_note': 'Precio de compra del producto',
  'purchases.modal.profit_note': 'Porcentaje de ganancia sobre el costo',
  'purchases.modal.subtotal': 'Subtotal (costo x cant.)',
  'purchases.modal.line_total': 'Total venta (cant. x precio venta)',
  'purchases.modal.search_min_chars': 'Escribe al menos 2 caracteres para buscar',
  'purchases.modal.no_results': 'No se encontraron productos',
  'purchases.modal.product_results': 'Resultados de productos',

  // Método de pricing en modal
  'purchases.modal.pricing_mode': 'Método de Precio',
  'purchases.modal.pricing_mode.margin': 'Por margen de ganancia',
  'purchases.modal.pricing_mode.final_price': 'Por precio de venta',
  'purchases.modal.sale_price': 'Precio de Venta Final',
  'purchases.modal.sale_price_note': 'El margen se calculará automáticamente',
  'purchases.modal.calculated_margin': 'Margen calculado',
  'purchases.modal.margin_result': 'Margen',
  'purchases.modal.calculated_sale_price': 'Precio de venta calculado',
  'purchases.modal.sale_price_result': 'Precio venta',

  // Tasa de impuesto en modal
  'purchases.modal.tax_rate': 'Tasa de Impuesto',
  'purchases.modal.no_tax': 'Sin impuesto',
  'purchases.modal.tax_rate_note': 'Selecciona la tasa de impuesto aplicable al producto',

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
  'purchases.empty.description': 'Selecciona un proveedor y comienza a agregar productos para crear una nueva orden de compra.',
  'purchases.empty.action': 'Seleccionar Proveedor',

  'purchases.create': 'Crear Compra',
  'purchases.saving': 'Creando Compra...',

  // Mensaje placeholder (temporal)
  'purchases.placeholder.message': 'Esta sección estará disponible pronto.',

  // Pago instantáneo post-creación
  'purchases.paymentDecision.title': 'Orden de Compra Creada',
  'purchases.paymentDecision.description': 'Orden #{orderId} creada por {amount}.',
  'purchases.paymentDecision.question': '¿Registrar el pago ahora?',
  'purchases.paymentDecision.amountLabel': 'Monto a pagar',
  'purchases.paymentDecision.methodLabel': 'Método de pago',
  'purchases.paymentDecision.notesLabel': 'Notas (opcional)',
  'purchases.paymentDecision.notesPlaceholder': 'Notas del pago...',
  'purchases.paymentDecision.payNow': 'Confirmar Pago',
  'purchases.paymentDecision.leavePending': 'Dejar Pendiente',
  'purchases.paymentDecision.processing': 'Procesando...',
  'purchases.paymentDecision.paymentSuccess': 'Pago registrado para orden #{orderId}',
  'purchases.paymentDecision.paymentError': 'Error al registrar pago. La orden fue creada correctamente.',
  'purchases.errors.cashRegisterRequired': 'Necesitás una caja abierta para pagar. Abrí una caja e intentá de nuevo.',

  // ─── PurchaseCheckoutWizard (stepper de concrección de compra) ────────────
  'purchases.checkoutWizard.title': 'Concretar Compra',
  'purchases.checkoutWizard.subtitle': 'Registrá la orden y el pago al proveedor',
  'purchases.checkoutWizard.cart': 'Orden',
  'purchases.checkoutWizard.cartEmpty': 'No hay ítems en la orden',
  'purchases.checkoutWizard.subtotal': 'Subtotal',
  'purchases.checkoutWizard.tax': 'Impuestos',
  'purchases.checkoutWizard.total': 'Total Compra',
  'purchases.checkoutWizard.items': 'Artículos',
  'purchases.checkoutWizard.taxSummary': 'Liquidación IVA',
  'purchases.checkoutWizard.step.supplier': 'Proveedor',
  'purchases.checkoutWizard.step.payment': 'Pago',
  'purchases.checkoutWizard.step.collection': 'Cobro',
  'purchases.checkoutWizard.action.next': 'Avanzar',
  'purchases.checkoutWizard.action.back': 'Volver',
  'purchases.checkoutWizard.action.confirm': 'Confirmar Compra',
  'purchases.checkoutWizard.action.leavePending': 'Solo guardar orden',
  'purchases.checkoutWizard.action.processing': 'Procesando...',
  'purchases.checkoutWizard.supplier.placeholder': 'Buscar proveedor por nombre o RUC... (F3)',
  'purchases.checkoutWizard.supplier.empty': 'No se encontraron proveedores',
  'purchases.checkoutWizard.payment.method': 'Método de pago',
  'purchases.checkoutWizard.payment.currency': 'Moneda',
  'purchases.checkoutWizard.payment.notes': 'Notas de la compra',
  'purchases.checkoutWizard.payment.notesPlaceholder': 'Ej: Pedido urgente de insumos...',
  'purchases.checkoutWizard.collection.cashRegister': 'Caja de pago',
  'purchases.checkoutWizard.collection.noCashRegister': 'Sin caja asignada',
  'purchases.checkoutWizard.collection.loadingRegisters': 'Cargando cajas...',
  'purchases.checkoutWizard.collection.registersError': 'No se pudieron cargar las cajas. Verificá tu sesión e intentá de nuevo.',
  'purchases.checkoutWizard.collection.amountPaid': 'Monto a pagar',
  'purchases.checkoutWizard.collection.exact': 'Exacto',
  'purchases.checkoutWizard.collection.notes': 'Notas del pago (opcional)',
  'purchases.checkoutWizard.collection.notesPlaceholder': 'Notas del pago...',

  // Desglose de IVA en totales
  'purchases.totals.vatRate': 'IVA {pct}%',
  'purchases.totals.exempt': 'Exento',

  // ─── Alineación DESIGN.md: página de compras ──────────────────────────────
  'purchases.management.title': 'Gestión de Compras',
  'purchases.management.subtitle': 'Abastecimiento y órdenes de compra a proveedores',

  // Carrito de la orden
  'purchases.cart.title': 'Productos en la Orden',
  'purchases.cart.subtitle': 'Artículos a ingresar al inventario',
  'purchases.cart.add_item': 'Agregar Artículo',
  'purchases.cart.id_sku': 'ID / SKU',
  'purchases.cart.product': 'Producto',
  'purchases.cart.empty_hint': 'Haz clic en "Agregar Artículo" para comenzar',
  'purchases.cart.unit': 'Unidad',
  'purchases.cart.remove_item': 'Quitar artículo de la orden',

  // Totales de la orden
  'purchases.totals.items': 'Artículos Totales',
  'purchases.totals.total': 'Total Compra',
  'purchases.totals.vatIncluded': 'Liquidación IVA (Incluido)',
  'purchases.totals.expected_sale': 'Venta Esperada',
  'purchases.totals.projected_profit': 'Ganancia Proyectada',
  'purchases.totals.buy': 'Comprar (F12)',
  'purchases.totals.processing': 'Procesando...',
  'purchases.totals.clear_all': 'Cancelar Todo',
  'purchases.totals.clear_confirm': '¿Borrar toda la orden?',

  // Historial de compras
  'purchases.history.search': 'Buscar',
  'purchases.history.order_date': 'Fecha Pedido',
  'purchases.history.total_amount': 'Monto Total',
  'purchases.history.branch': 'Sucursal',
  'purchases.history.payment': 'Pago',
  'purchases.history.pending_balance': 'Saldo Pendiente',
  'purchases.history.paid': 'Pagado',
  'purchases.history.view_detail': 'Ver Detalle',
  'purchases.history.cancel_order': 'Anular Orden',

  // Modal de anulación
  'purchases.cancel.title': '¿Anular esta orden?',
  'purchases.cancel.confirm': 'Sí, Anular',
  'purchases.cancel.body': 'Esta acción afectará los saldos con {supplier}.',
  'purchases.cancel.impact_title': 'Impacto de la anulación:',
  'purchases.cancel.impact_payments': 'Se reversarán {count} pagos.',
  'purchases.cancel.impact_stock': 'Se ajustará el stock de {count} items.',
  'purchases.cancel.impact_total': 'Total a reversar: {amount}',

  // Modal de confirmación post-compra
  'purchases.confirmation.title': 'Compra Registrada',
  'purchases.confirmation.subtitle': 'Orden de compra #{id} guardada con éxito.',
  'purchases.confirmation.total': 'Monto Total',
  'purchases.confirmation.branch': 'Sucursal Asignada',
  'purchases.confirmation.branch_value': 'Sucursal #{id}',
  'purchases.confirmation.warnings': 'Advertencias',
  'purchases.confirmation.warning.price': '{product}: {reason}',
  'purchases.confirmation.warning.no_price_reason': 'No se pudo derivar precio',
  'purchases.confirmation.warning.tax_rate': '{product}: Tasa observada del {rate}% difiere de la esperada.',
  'purchases.confirmation.fallback_product': 'Producto',
  'purchases.confirmation.fiscal_title': 'Liquidación Fiscal por Ítem',
  'purchases.confirmation.col_product': 'Producto',
  'purchases.confirmation.col_qty': 'Cant.',
  'purchases.confirmation.col_iva': 'IVA',
  'purchases.confirmation.col_source': 'Fuente',
  'purchases.confirmation.actions.history': 'Ver en Historial',
  'purchases.confirmation.actions.close': 'Cerrar',

  // Modal de agregar/editar artículo
  'purchases.product_modal.title_edit': 'Editar Artículo',
  'purchases.product_modal.title_add': 'Agregar Artículo de Compra',
  'purchases.product_modal.subtitle': 'Seleccione un producto, configure cantidad, costo y estrategia de precio',
  'purchases.product_modal.search_label': 'Buscar Producto',
  'purchases.product_modal.search_placeholder': 'Buscar por SKU, EAN o Nombre...',
  'purchases.product_modal.variants_badge': 'Variantes',
  'purchases.product_modal.stock_label': 'Stock:',
  'purchases.product_modal.last_cost': 'Últ. Costo',
  'purchases.product_modal.sale_price': 'Precio Venta',
  'purchases.product_modal.unit_label': 'Unidad',
  'purchases.product_modal.select_variant': 'Seleccionar Variante',
  'purchases.product_modal.clear': 'Limpiar',
  'purchases.product_modal.loading_variants': 'Cargando variantes...',
  'purchases.product_modal.no_variants': 'Este producto no tiene variantes activas',
  'purchases.product_modal.add_base': 'Añadir producto principal sin variante',
  'purchases.product_modal.select_placeholder': 'Selecciona un producto',
  'purchases.product_modal.quantity': 'Cantidad',
  'purchases.product_modal.quantity_hint': 'Unidades a comprar',
  'purchases.product_modal.unit_placeholder': 'Ej. kg, box, unit',
  'purchases.product_modal.unit_hint': 'Medida de compra',
  'purchases.product_modal.cost': 'Costo Unit.',
  'purchases.product_modal.cost_hint': 'Precio por unidad',
  'purchases.product_modal.tax_source_product': 'Impuesto específico del producto',
  'purchases.product_modal.tax_source_category': 'Impuesto sugerido por categoría {category}',
  'purchases.product_modal.tax_source_custom': 'Impuesto personalizado manualmente',
  'purchases.product_modal.pricing_strategy': 'Estrategia de Precio de Venta',
  'purchases.product_modal.mode_margin': 'Por Margen %',
  'purchases.product_modal.mode_fixed': 'Precio Fijo',
  'purchases.product_modal.margin_label_margin': 'Margen de Ganancia',
  'purchases.product_modal.margin_label_calc': 'Margen Calculado',
  'purchases.product_modal.margin_hint_margin': 'Define el % de ganancia deseado',
  'purchases.product_modal.margin_hint_calc': 'Porcentaje resultante del precio fijo',
  'purchases.product_modal.price_label_fixed': 'Precio de Venta',
  'purchases.product_modal.price_label_suggested': 'Precio Sugerido',
  'purchases.product_modal.price_hint_fixed': 'Precio final al público',
  'purchases.product_modal.price_hint_suggested': 'Calculado según margen',
  'purchases.product_modal.unit_cost': 'Costo Unitario',
  'purchases.product_modal.unit_sale_price': 'Precio Venta Unitario',
  'purchases.product_modal.projection': 'Proyección Financiera',
  'purchases.product_modal.line_subtotal': 'Subtotal Línea',
  'purchases.product_modal.expected_profit': 'Ganancia Esperada',
  'purchases.product_modal.select_generic': 'Seleccionar Producto Genérico',
  'purchases.product_modal.save': 'Guardar Cambios',
  'purchases.product_modal.add_to_order': 'Agregar a la Orden',

  // Wizard: extras de alineación
  'purchases.checkoutWizard.stepsAria': 'Pasos del checkout',
  'purchases.checkoutWizard.supplier.clear': 'Quitar proveedor',
  'purchases.checkoutWizard.hints.confirm': 'Confirmar',
  'purchases.checkoutWizard.hints.next': 'Avanzar',
  'purchases.checkoutWizard.hints.enterKey': 'Enter',
  'purchases.checkoutWizard.hints.advance': 'Avanzar',
  'purchases.checkoutWizard.hints.back': 'Volver',
  'purchases.checkoutWizard.hints.focus': 'Foco',
  'purchases.checkoutWizard.hints.searchSupplier': 'Buscar proveedor',
  'purchases.checkoutWizard.hints.navigate': 'Navegar',
  'purchases.checkoutWizard.hints.exactAmount': 'Monto exacto',
}
