/**
 * Currency Translations in English
 * Module: Financial Settings > Currencies
 */

export const currencies = {
  // Titles and subtitles
  'currencies.title': 'Currency Management',
  'currencies.subtitle':
    'Manage the catalog of currencies enabled for ERP system transactions.',

  // Actions
  'currencies.action.create': 'New Currency',
  'currencies.action.edit': 'Edit Currency',
  'currencies.action.delete': 'Delete Currency',
  'currencies.action.export': 'Export',

  // Search and filters
  'currencies.search.placeholder': 'Search by ISO code or name...',
  'currencies.search.label': 'Search currencies',
  'currencies.filter.all': 'All',
  'currencies.filter.enabled': 'Enabled',
  'currencies.filter.disabled': 'Disabled',

  // Table
  'currencies.table.code': 'ISO Code',
  'currencies.table.name': 'Name',
  'currencies.table.symbol': 'Symbol',
  'currencies.table.status': 'Status',
  'currencies.table.actions': 'Actions',
  'currencies.table.exchange_rate': 'Exchange Rate',

  // Status
  'currencies.status.enabled': 'Enabled',
  'currencies.status.disabled': 'Disabled',
  'currencies.badge.base': 'Base',

  // Form fields
  'currencies.field.code': 'ISO Code',
  'currencies.field.name': 'Name',
  'currencies.field.symbol': 'Symbol',
  'currencies.field.decimals': 'Decimal Places',
  'currencies.field.flag': 'Flag (emoji)',
  'currencies.field.exchange_rate': 'Exchange Rate',
  'currencies.field.enabled': 'Currency enabled for transactions',

  // Placeholders
  'currencies.placeholder.name': 'US Dollar',

  // Hints
  'currencies.hint.exchange_rate': 'Equivalent in base currency',

  // Validations
  'currencies.validation.code_required': 'ISO code is required',
  'currencies.validation.code_length': 'Code must be 3 characters',
  'currencies.validation.name_required': 'Name is required',
  'currencies.validation.symbol_required': 'Symbol is required',

  // Modal
  'currencies.modal.create_title': 'New Currency',
  'currencies.modal.edit_title': 'Edit Currency',
  'currencies.modal.delete_title': 'Delete Currency',
  'currencies.modal.delete_confirm':
    'Are you sure you want to delete the currency "{name}"? This action cannot be undone.',

  // Warnings
  'currencies.warning.base_currency':
    'This is the base currency of the system. Some fields cannot be modified.',

  // Empty states
  'currencies.empty.message': 'No currencies configured',
  'currencies.empty.search': 'No currencies found matching that criteria',

  // Errors
  'currencies.error.title': 'Error',
  'currencies.error.load': 'Error loading currencies',
  'currencies.error.save': 'Error saving currency',
  'currencies.error.delete': 'Error deleting currency',
  'currencies.error.generic': 'An unexpected error occurred',

  // Results
  'currencies.results': 'Showing {count} of {total} results',

  // Navigation menu
  'nav.financial_config': 'Financial Settings',
  'nav.currencies': 'Currencies',
  'nav.payment_methods': 'Payment Methods',
}
