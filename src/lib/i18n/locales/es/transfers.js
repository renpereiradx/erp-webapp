/**
 * Traducciones del módulo de transferencias entre sucursales
 * (F.4/F.5 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
 */

export const transfers = {
  // Nav
  'nav.transfers': 'Transferencias',

  // Bandeja
  'transfers.title': 'Transferencias',
  'transfers.subtitle': 'Movimientos de stock entre sucursales con aprobación, envío y recepción.',
  'transfers.filterLabel': 'Filtrar por estado',
  'transfers.filterAll': 'Todas',
  'transfers.new': 'Nueva Transferencia',
  'transfers.empty': 'Sin transferencias',
  'transfers.emptyHint': 'Las transferencias entre sucursales aparecerán acá.',
  'transfers.col.code': 'Código',
  'transfers.col.route': 'Ruta',
  'transfers.col.status': 'Estado',
  'transfers.col.date': 'Fecha',
  'transfers.view': 'Ver',
  'transfers.pagination': 'Paginación',
  'transfers.prevPage': 'Anterior',
  'transfers.nextPage': 'Siguiente',

  // Creación
  'transfers.createTitle': 'Nueva Transferencia',
  'transfers.createDescription': 'El stock sale de la sucursal activa y se recibe en la sucursal destino.',
  'transfers.source': 'Sucursal de origen',
  'transfers.noSource': 'Sin sucursal activa',
  'transfers.destination': 'Sucursal de destino',
  'transfers.pickDestination': 'Seleccionar destino...',
  'transfers.addProduct': 'Agregar producto',
  'transfers.searchPlaceholder': 'Buscar por nombre o código...',
  'transfers.searching': 'Buscando...',
  'transfers.noResults': 'Sin resultados',
  'transfers.items': 'Ítems ({count})',
  'transfers.emptyItems': 'Agregá al menos un producto para transferir.',
  'transfers.quantity': 'Cantidad de {name}',
  'transfers.removeItem': 'Quitar {name}',
  'transfers.notes': 'Notas',
  'transfers.notesPlaceholder': 'Opcional',
  'transfers.submit': 'Crear transferencia',
  'transfers.createSuccess': 'Transferencia creada',
  'transfers.createError': 'Error al crear la transferencia',

  // Detalle / workflow
  'transfers.detailTitle': 'Transferencia {code}',
  'transfers.statusUpdated': 'Transferencia actualizada',
  'transfers.statusError': 'Error al actualizar la transferencia',
  'transfers.requestedQty': '{qty} u.',
  'transfers.noItems': 'Sin ítems',
  'transfers.sourcePurchase': 'Compra de origen',
  'transfers.sourcePurchaseAria': 'Ver la compra de origen #{id} en el historial de compras',
  'transfers.approve': 'Aprobar',
  'transfers.reject': 'Rechazar',
  'transfers.ship': 'Despachar',
  'transfers.markInTransit': 'Marcar en tránsito',
  'transfers.receive': 'Recibir',
  'transfers.confirm': 'Confirmar',
  'transfers.rejectionReason': 'Motivo del rechazo',
  'transfers.trackingNumber': 'Número de seguimiento',
  'transfers.flowHint': 'PENDING → APPROVED → SHIPPED → IN_TRANSIT → RECEIVED',
}
