/**
 * Traducciones de licenciamiento (PLAN_BI_PACK_PREMIUM F3/F4).
 * Toast del gate de ruta, banner de vencimiento y card de Configuración.
 */

export const licensing = {
  'licensing.moduleNotLocked':
    'El módulo de Inteligencia de Negocios no está incluido en la licencia de esta instalación',

  // Banner global de vencimiento (ADR-4)
  'licensing.banner.expiring':
    'La licencia del pack BI vence en {days} días. Contacte a su proveedor para renovar.',
  'licensing.banner.grace':
    'La licencia del pack BI está vencida; período de gracia activo. Contacte a su proveedor para renovar.',
  'licensing.banner.expired':
    'La licencia del pack BI está vencida: el módulo de Inteligencia de Negocios quedó deshabilitado. Contacte a su proveedor para renovar.',

  // Card de licencia en Configuración (ADR-5)
  'licensing.card.title': 'Licencia',
  'licensing.card.description':
    'Edición y módulos contratados para esta instalación.',
  'licensing.card.edition': 'Edición',
  'licensing.card.customer': 'Cliente',
  'licensing.card.modules': 'Módulos',
  'licensing.card.expires': 'Vence',
  'licensing.card.never': 'No vence (perpetua)',
  'licensing.card.daysRemaining': 'Quedan {days} días',
  'licensing.card.enforced': 'Control de licencia activo',
  'licensing.card.notEnforced':
    'Control de licencia desactivado (desarrollo): todos los módulos disponibles.',
  'licensing.card.status.active': 'Activa',
  'licensing.card.status.grace': 'En gracia (vencida)',
  'licensing.card.status.expired': 'Vencida',
  'licensing.card.status.none': 'Sin licencia instalada',
  'licensing.card.status.invalid': 'Licencia inválida',
  'licensing.card.loadError': 'No se pudo cargar el estado de la licencia',
  'licensing.card.expiredDate': 'Vencida el {date}',

  // Estado de la instalación y trial (REQ_BIPACK v2.0)
  'licensing.card.mode': 'Estado de la instalación',
  'licensing.card.mode.licensed': 'Licenciada',
  'licensing.card.mode.trial': 'En evaluación',
  'licensing.card.mode.core': 'Licencia vencida (Core activo)',
  'licensing.card.mode.expired': 'Bloqueada',
  'licensing.card.trialEnds': 'Fin de la evaluación',

  // Banner de evaluación (REQ_BIPACK v2.0)
  'licensing.banner.trial':
    'Período de evaluación: quedan {days} días. Al finalizar se requiere cargar una licencia para seguir usando el sistema.',
  'licensing.banner.trialOver':
    'El período de evaluación finalizó: cargue una licencia para seguir usando el sistema. Contacte a su proveedor.',

  // Instalación de licencia desde la web (auditoría v2.0 Fix 5)
  'licensing.install.button': 'Instalar licencia…',
  'licensing.install.uploading': 'Verificando licencia…',
  'licensing.install.success': 'Licencia instalada: {edition}',
  'licensing.install.installed': 'Licencia activa.',
  'licensing.install.error': 'La licencia no pudo instalarse: {reason}',
  'licensing.install.hint':
    'Seleccione el archivo license.json entregado por su proveedor: la instalación aplica al momento.',

  // Gate full-screen de licencia requerida (REQ_BIPACK v2.0)
  'licensing.gate.title': 'Licencia requerida',
  'licensing.gate.description':
    'El período de evaluación de esta instalación finalizó y no hay licencia activa. Cargue el archivo de licencia entregado por su proveedor para volver a usar el sistema.',
  'licensing.gate.loading': 'Consultando estado de la licencia…',
  'licensing.gate.needLogin': 'Inicie sesión para cargar la licencia de la instalación.',
  'licensing.gate.login': 'Iniciar sesión',
  'licensing.gate.statusError': 'No se pudo consultar el estado de la licencia.',
  'licensing.gate.retry': 'Actualizar estado',
  'licensing.gate.statusTitle': 'Estado de la licencia',
  'licensing.gate.blocked': 'Sistema bloqueado',
  'licensing.gate.unblocked': 'Sistema activo',
  'licensing.gate.trialEnded': 'Evaluación finalizada',
  'licensing.gate.dateLabel': '{date} (UTC)',
  'licensing.gate.upload': 'Cargar licencia',
  'licensing.gate.uploading': 'Verificando licencia…',
  'licensing.gate.uploadHint': 'Seleccione el archivo license.json firmado por su proveedor.',
  'licensing.gate.invalid': 'La licencia no pudo instalarse: {reason}',
  'licensing.gate.invalidReason': 'archivo no válido',
}
