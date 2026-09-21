/**
 * Licensing translations (PLAN_BI_PACK_PREMIUM F3/F4).
 * Route-gate toast, expiry banner and the Settings license card.
 */

export const licensing = {
  'licensing.moduleNotLocked':
    'The Business Intelligence module is not included in this installation license',

  // Global expiry banner (ADR-4)
  'licensing.banner.expiring':
    'The BI pack license expires in {days} days. Contact your vendor to renew.',
  'licensing.banner.grace':
    'The BI pack license has expired; grace period active. Contact your vendor to renew.',
  'licensing.banner.expired':
    'The BI pack license has expired: the Business Intelligence module is now disabled. Contact your vendor to renew.',

  // License card in Settings (ADR-5)
  'licensing.card.title': 'License',
  'licensing.card.description': "Edition and modules licensed for this installation.",
  'licensing.card.edition': 'Edition',
  'licensing.card.customer': 'Customer',
  'licensing.card.modules': 'Modules',
  'licensing.card.expires': 'Expires',
  'licensing.card.never': 'Never (perpetual)',
  'licensing.card.daysRemaining': '{days} days left',
  'licensing.card.enforced': 'License enforcement active',
  'licensing.card.notEnforced':
    'License enforcement off (development): every module available.',
  'licensing.card.status.active': 'Active',
  'licensing.card.status.grace': 'In grace (expired)',
  'licensing.card.status.expired': 'Expired',
  'licensing.card.status.none': 'No license installed',
  'licensing.card.status.invalid': 'Invalid license',
  'licensing.card.loadError': 'Could not load the license status',
  'licensing.card.expiredDate': 'Expired on {date}',
}
