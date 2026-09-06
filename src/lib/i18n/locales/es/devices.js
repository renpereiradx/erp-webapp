/**
 * Traducciones del módulo de terminales registradas
 * (FASE E — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
 */

export const devices = {
  // Nav / Settings
  'settings.devices.title': 'Terminales',
  'settings.devices.desc': 'Registro de terminales POS emparejadas a sucursal',

  // Página
  'devices.title': 'Terminales',
  'devices.subtitle': 'Terminales POS emparejadas a una sucursal vía código',
  'devices.empty.action': 'Nueva terminal',
  'devices.empty.title': 'Sin terminales registradas',
  'devices.empty.description': 'Registrá una terminal y emparejala con su código desde Configuración → Terminal',
  'devices.error.load': 'No se pudieron cargar las terminales',

  // Listado
  'devices.list.searchPlaceholder': 'Buscar por nombre o código…',
  'devices.list.count': '{count} terminales',
  'devices.list.noResults': 'Sin resultados para la búsqueda',
  'devices.list.copied': 'Código copiado',
  'devices.list.neverSeen': 'Nunca',
  'devices.list.copyCode': 'Copiar código de {name}',
  'devices.col.name': 'Nombre',
  'devices.col.branch': 'Sucursal',
  'devices.col.code': 'Código',
  'devices.col.lastSeen': 'Última actividad',
  'devices.col.status': 'Estado',
  'devices.status.active': 'Activa',
  'devices.status.inactive': 'Inactiva',

  // Formulario
  'devices.form.newTitle': 'Nueva terminal',
  'devices.form.editTitle': 'Editar terminal',
  'devices.form.name': 'Nombre',
  'devices.form.namePlaceholder': 'Caja 1',
  'devices.form.nameRequired': 'El nombre de la terminal es requerido',
  'devices.form.branch': 'Sucursal de la terminal',
  'devices.form.branchPlaceholder': 'Seleccionar sucursal…',
  'devices.form.branchRequired': 'La sucursal de la terminal es requerida',
  'devices.form.branchHint': 'Quienes operen esta terminal sin branches:switch entran directo a esta sucursal.',
  'devices.form.pairingCode': 'Código de emparejamiento',
  'devices.form.regenerateCode': 'Rotar código al guardar',
  'devices.form.isActive': 'Activa',
  'devices.form.delete': 'Eliminar',
  'devices.form.cancel': 'Cancelar',
  'devices.form.save': 'Guardar',
  'devices.form.saving': 'Guardando…',
  'devices.delete.title': 'Eliminar terminal',
  'devices.delete.confirm': '¿Eliminar la terminal "{name}"? Esta acción no se puede deshacer.',

  // Toasts
  'devices.toast.error': 'No se pudo completar la operación',
  'devices.toast.created': 'Terminal registrada',
  'devices.toast.updated': 'Terminal actualizada',
  'devices.toast.deleted': 'Terminal eliminada',
}
