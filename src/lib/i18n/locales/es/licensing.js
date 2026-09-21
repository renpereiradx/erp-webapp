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
}
