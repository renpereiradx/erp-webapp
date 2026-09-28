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

  // Installation state and trial (REQ_BIPACK v2.0)
  'licensing.card.mode': 'Installation state',
  'licensing.card.mode.licensed': 'Licensed',
  'licensing.card.mode.trial': 'Evaluating',
  'licensing.card.mode.expired': 'Locked',
  'licensing.card.trialEnds': 'Evaluation ends',

  // Evaluation banner (REQ_BIPACK v2.0)
  'licensing.banner.trial':
    'Evaluation period: {days} days remaining. A license must be loaded to keep using the system after it ends.',

  // Full-screen license-required gate (REQ_BIPACK v2.0)
  'licensing.gate.title': 'License required',
  'licensing.gate.description':
    'The evaluation period for this installation has ended and there is no active license. Load the license file provided by your vendor to resume using the system.',
  'licensing.gate.loading': 'Checking license status…',
  'licensing.gate.needLogin': 'Sign in to load this installation license.',
  'licensing.gate.login': 'Sign in',
  'licensing.gate.statusError': 'Could not check the license status.',
  'licensing.gate.retry': 'Refresh status',
  'licensing.gate.statusTitle': 'License status',
  'licensing.gate.blocked': 'System locked',
  'licensing.gate.trialEnded': 'Evaluation ended',
  'licensing.gate.dateLabel': '{date} (UTC)',
  'licensing.gate.upload': 'Load license',
  'licensing.gate.uploading': 'Verifying license…',
  'licensing.gate.uploadHint': 'Select the license.json file signed by your vendor.',
  'licensing.gate.invalid': 'The license could not be installed: {reason}',
  'licensing.gate.invalidReason': 'invalid file',
}
