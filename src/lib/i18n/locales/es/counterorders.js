/**
 * Pedidos de mostrador (PLAN_PEDIDOS_MOSTRADOR_VENDEDOR_CAJA — FASE 2).
 * Carrito del vendedor → cobro en caja con el wizard existente.
 */
export const counterorders = {
  // Nav + página
  'nav.counterorders': 'Pedidos',
  'counterorders.title': 'Pedidos',
  'counterorders.subtitle':
    'Pedidos de mostrador: el vendedor arma el carrito, la caja lo cobra.',

  // Estados
  'counterorders.status.OPEN': 'Abierto',
  'counterorders.status.CLAIMED': 'En caja',
  'counterorders.status.CONVERTED': 'Procesado',
  'counterorders.status.CANCELLED': 'Cancelado',
  'counterorders.status.EXPIRED': 'Vencido',
  'counterorders.filter.all': 'Todos',

  // Bandeja
  'counterorders.board.search_placeholder': 'Buscar por código o cliente…',
  'counterorders.board.new_order': 'Nuevo pedido',
  'counterorders.board.all_branches': 'Ver todas las sucursales',
  'counterorders.board.error_title': 'No se pudieron cargar los pedidos',
  'counterorders.board.error_message': 'Revisá la conexión e intentá de nuevo.',
  'counterorders.board.empty_title': 'Sin pedidos',
  'counterorders.board.empty_message':
    'Cuando el vendedor guarde un pedido, va a aparecer acá para procesarlo en caja.',
  'counterorders.board.created_by': 'Creado por {name} · {ago}',
  'counterorders.board.claimed_by': 'en caja con {name}',
  'counterorders.board.has_notes': 'El pedido tiene nota del vendedor',
  'counterorders.board.items_total': '{count} ítems',
  'counterorders.board.view': 'Ver detalle',
  'counterorders.board.edit': 'Editar',
  'counterorders.board.cancel': 'Cancelar',
  'counterorders.board.process': 'Procesar en caja',
  'counterorders.board.release': 'Liberar',
  'counterorders.board.page_info': 'Página {page} de {total}',

  // Builder (carrito del vendedor)
  'counterorders.builder.new_title': 'Nuevo pedido',
  'counterorders.builder.edit_title': 'Editar pedido {code}',
  'counterorders.builder.products': 'Productos',
  'counterorders.builder.cart': 'Carrito',
  'counterorders.builder.search_placeholder': 'Buscar producto por nombre o código…',
  'counterorders.builder.barcode_placeholder': 'Escanear código de barras…',
  'counterorders.builder.scan': 'Escanear',
  'counterorders.builder.barcode_not_found': 'No se encontró el producto escaneado',
  'counterorders.builder.searching': 'Buscando productos…',
  'counterorders.builder.no_products': 'Sin resultados para "{term}".',
  'counterorders.builder.stock': 'Stock',
  'counterorders.builder.out_of_stock': 'Sin stock',
  'counterorders.builder.add': 'Agregar',
  'counterorders.builder.base_product': 'Producto base',
  'counterorders.builder.pick_variant': 'Elegir variante',
  'counterorders.builder.hide_variants': 'Ocultar variantes',
  'counterorders.builder.no_variants': 'Sin variantes activas.',
  'counterorders.builder.client': 'Cliente (obligatorio)',
  'counterorders.builder.client_placeholder': 'Buscar cliente por nombre…',
  'counterorders.builder.quick_client': 'Alta rápida',
  'counterorders.builder.empty_cart': 'Agregá productos con la búsqueda o el escáner.',
  'counterorders.builder.remove': 'Quitar',
  'counterorders.builder.decrease': 'Restar',
  'counterorders.builder.increase': 'Sumar',
  'counterorders.builder.quantity': 'Cantidad',
  'counterorders.builder.order_notes': 'Nota para la caja (opcional)',
  'counterorders.builder.order_notes_placeholder': 'Ej.: facturar a razón social…',
  'counterorders.builder.units': '{count} unidades',
  'counterorders.builder.save': 'Guardar pedido',
  'counterorders.builder.saving': 'Guardando…',
  'counterorders.builder.discard_title': '¿Descartar el carrito?',
  'counterorders.builder.discard_message':
    'Hay productos sin guardar en el carrito. Si salís, se pierden.',
  'counterorders.builder.discard_keep': 'Seguir editando',
  'counterorders.builder.discard_confirm': 'Descartar',

  // Detalle
  'counterorders.detail.title': 'Pedido {code}',
  'counterorders.detail.loading': 'Resolviendo precios vigentes…',
  'counterorders.detail.created_by': 'por {name}',
  'counterorders.detail.claimed_by': 'en caja con {name}',
  'counterorders.detail.stock_warning': 'Stock disponible: {stock}',
  'counterorders.detail.total': 'Total estimado (precios de hoy)',
  'counterorders.detail.total_with_warnings': 'Total estimado (excluye ítems con advertencia)',
  'counterorders.detail.sale_link': 'Procesado como venta {saleId}',
  'counterorders.detail.cancel_reason': 'Cancelado: {reason}',

  // Cancelación
  'counterorders.cancel.title': 'Cancelar pedido {code}',
  'counterorders.cancel.message':
    'El pedido queda fuera del flujo de caja. Esta acción no se puede deshacer.',
  'counterorders.cancel.reason_label': 'Motivo (obligatorio)',
  'counterorders.cancel.reason_placeholder': 'Ej.: el cliente se fue sin comprar',
  'counterorders.cancel.confirm': 'Cancelar pedido',
  'counterorders.cancel.success': 'Pedido cancelado',

  // Wizard de caja (FASE 3)
  'counterorders.checkout.loaded': 'Pedido {code} cargado ({count} ítems)',
  'counterorders.checkout.claim_error': 'No se pudo abrir el pedido en caja',
  'counterorders.checkout.convert_failed':
    'La venta se cobró, pero el pedido {code} quedó sin marcar como procesado.',
  'counterorders.checkout.convert_mark': 'Marcar como procesado',
  'counterorders.checkout.convert_retry_failed':
    'No se pudo marcar el pedido como procesado. Intentá de nuevo desde /pedidos.',
  'counterorders.checkout.preload_gone': 'El pedido {code} ya no está disponible en caja.',
  'counterorders.checkout.preload_error': 'No se pudo abrir el pedido en caja',
}
