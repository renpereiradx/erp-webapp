/**
 * Traducciones del feature de impresoras de tickets (contexto documents
 * del backend — /api/v1/printers). Claves planas 'printers.*'.
 */
export const printers = {
  'printers.nav': 'Impresoras de tickets',
  'settings.printers.title': 'Impresoras de tickets',
  'settings.printers.desc': 'Impresoras térmicas de recibos por red (58/80 mm)',

  'printers.title': 'Impresoras de tickets',
  'printers.subtitle': 'Impresoras térmicas para tickets POS (red, puerto 9100)',
  'printers.list.count': '{count} impresora(s)',
  'printers.list.searchPlaceholder': 'Buscar por nombre o host…',
  'printers.list.noResults': 'Sin resultados para la búsqueda',

  'printers.empty.title': 'Sin impresoras configuradas',
  'printers.empty.description':
    'Registrá una impresora de red para imprimir tickets desde el POS',
  'printers.empty.action': 'Nueva impresora',

  'printers.col.name': 'Nombre',
  'printers.col.purpose': 'Destino',
  'printers.col.address': 'Dirección',
  'printers.col.width': 'Papel',
  'printers.col.status': 'Estado',

  'printers.purpose.RECEIPT': 'Recibos',
  'printers.purpose.KITCHEN': 'Cocina',
  'printers.purpose.BAR': 'Barra',

  'printers.width.58': '58 mm (32 col.)',
  'printers.width.80': '80 mm (48 col.)',

  'printers.status.active': 'Activa',
  'printers.status.inactive': 'Inactiva',

  'printers.form.newTitle': 'Nueva impresora',
  'printers.form.editTitle': 'Editar impresora',
  'printers.form.name': 'Nombre',
  'printers.form.namePlaceholder': 'Caja 1',
  'printers.form.nameRequired': 'El nombre es requerido',
  'printers.form.purpose': 'Destino',
  'printers.form.host': 'Host / IP',
  'printers.form.hostPlaceholder': '192.168.1.50',
  'printers.form.hostRequired': 'El host es requerido',
  'printers.form.port': 'Puerto',
  'printers.form.portInvalid': 'Puerto fuera de rango (1-65535)',
  'printers.form.width': 'Ancho de papel',
  'printers.form.widthInvalid': 'Ancho inválido: usar 58 u 80',
  'printers.form.codePage': 'Tabla de caracteres',
  'printers.form.branch': 'Sucursal',
  'printers.form.branchAny': 'Todas las sucursales',
  'printers.form.kickDrawer': 'Abrir cajón monedero al imprimir',
  'printers.form.isDefault': 'Predeterminada para recibos',
  'printers.form.isActive': 'Activa',
  'printers.form.test': 'Página de prueba',
  'printers.form.save': 'Guardar',
  'printers.form.saving': 'Guardando…',
  'printers.form.cancel': 'Cancelar',
  'printers.form.delete': 'Eliminar',

  'printers.delete.title': 'Eliminar impresora',
  'printers.delete.confirm':
    '¿Eliminar la impresora "{name}"? Esta acción no se puede deshacer.',

  'printers.toast.created': 'Impresora creada',
  'printers.toast.updated': 'Impresora actualizada',
  'printers.toast.deleted': 'Impresora eliminada',
  'printers.toast.testSent': 'Página de prueba enviada',
  'printers.toast.error': 'No se pudo completar la operación',
  'printers.error.load': 'No se pudieron cargar las impresoras',
}
