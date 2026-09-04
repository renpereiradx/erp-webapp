/**
 * Traducciones del control de sesiones (admin) en español
 * Módulo: Control Global de Sesiones (/configuracion/sesiones)
 */

export const sessions = {
  // Encabezado
  'sessions.title': 'Control Global de Sesiones',
  'sessions.subtitle':
    'Monitoreo y gestión en tiempo real de sesiones activas en todo el ecosistema ERP.',

  // Métricas
  'sessions.metrics.active': 'Sesiones activas',
  'sessions.metrics.idle': 'Inactivas',
  'sessions.metrics.revoked': 'Revocadas',
  'sessions.metrics.anomalies': 'Anomalías',

  // Toolbar
  'sessions.searchPlaceholder': 'Buscar por usuario, IP o dispositivo…',
  'sessions.status.label': 'Estado',
  'sessions.status.all': 'Todas',
  'sessions.status.active': 'Activas',
  'sessions.status.idle': 'Inactivas',
  'sessions.status.revoked': 'Revocadas',
  'sessions.revokeAll': 'Revocar todas',
  'sessions.revokeAllTitle': 'Revocar todas las sesiones',
  'sessions.revokeAllDescription':
    'Se cerrarán todas las sesiones activas del sistema. Los usuarios tendrán que iniciar sesión nuevamente.',
  'sessions.revokeAllConfirm': 'Revocar todas',

  // Tabla
  'sessions.table.user': 'Usuario',
  'sessions.table.ip': 'Dirección IP',
  'sessions.table.device': 'Dispositivo / Navegador',
  'sessions.table.location': 'Ubicación',
  'sessions.table.lastActivity': 'Última Actividad',
  'sessions.table.status': 'Estado',
  'sessions.table.actions': 'Acciones',
  'sessions.table.expires': 'Expira',
  'sessions.revoke': 'Revocar',

  // Estados y valores
  'sessions.status.badge.active': 'Activa',
  'sessions.status.badge.idle': 'Inactiva',
  'sessions.status.badge.revoked': 'Revocada',
  'sessions.status.badge.anomaly': 'Anomalía',
  'sessions.device.desktop': 'Escritorio',
  'sessions.device.mobile': 'Móvil',
  'sessions.device.tablet': 'Tablet',
  'sessions.device.unknown': 'Desconocido',
  'sessions.ip.unknown': 'Desconocida',
  'sessions.location.unknown': 'Ubicación desconocida',
  'sessions.activity.recently': 'Recientemente',

  // Estados de datos (§6.7)
  'sessions.empty.title': 'Sin sesiones',
  'sessions.empty.description': 'No hay sesiones que coincidan con la búsqueda o el filtro.',
  'sessions.error.title': 'Error al cargar sesiones',
  'sessions.error.forbidden.title': 'Acceso denegado',
  'sessions.error.forbidden.description':
    'Tu usuario no cuenta con los permisos necesarios para gestionar sesiones globales.',
  'sessions.error.forbidden.toast':
    'No tienes permisos para ver esta información administrativa',
  'sessions.back': 'Volver',

  // Insights (derivados de datos reales)
  'sessions.insights.activity': 'Actividad de sesiones por horario',
  'sessions.insights.activityEmpty': 'Sin actividad registrada todavía.',
  'sessions.insights.locations': 'Distribución por ubicación',
  'sessions.insights.locationsEmpty': 'Sin datos de ubicación.',
  'sessions.insights.locationUnknown': 'Desconocida',
}
