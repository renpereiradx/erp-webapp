/**
 * Currency Translations in English
 * Module: Financial Settings > Currencies
 */

export const currencies = {
  // Titles and subtitles
  'currencies.page.title': 'Currencies',
  'currencies.page.subtitle':
    'Manage the system base currency and the currency catalog for transactions.',

  // Actions
  'currencies.action.create': 'Add New Currency',
  'currencies.action.edit': 'Edit Currency',
  'currencies.action.delete': 'Delete Currency',
  'currencies.action.export': 'Export',
  'currencies.action.refresh': 'Refresh Data',

  // Search and filters
  'currencies.search.placeholder': 'Search by ISO code or name...',
  'currencies.search.label': 'Search currencies',
  'currencies.filter.all': 'All',
  'currencies.filter.enabled': 'Enabled',
  'currencies.filter.disabled': 'Disabled',

  // Table
  'currencies.table.code': 'ISO CODE',
  'currencies.table.name': 'NAME',
  'currencies.table.symbol': 'SYMBOL',
  'currencies.table.status': 'STATUS',
  'currencies.table.actions': 'ACTIONS',
  'currencies.table.exchange_rate': 'EXCHANGE RATE',
  'currencies.table.last_updated': 'LAST UPDATED',

  // Status
  'currencies.status.enabled': 'Enabled',
  'currencies.status.disabled': 'Disabled',
  'currencies.status.active': 'Active',
  'currencies.status.inactive': 'Inactive',
  'currencies.badge.base': 'BASE',

  // Base currency widget
  'currencies.widget.base_currency': 'BASE CURRENCY',
  'currencies.widget.change': 'Change',

  // Tabs
  'currencies.tabs.currencies': 'Currencies',

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

  // Payment Methods Tab
  'currencies.payment_methods.table.type': 'TYPE',
  'currencies.payment_methods.type.simple': 'Simple',
  'currencies.payment_methods.type.complex': 'Complex (Extra info)',

  // Payment Methods Page
  'paymentMethods.page.title': 'Payment Methods',
  'paymentMethods.page.subtitle': 'Manage the payment methods available in the system.',
  'paymentMethods.action.create': 'New Method',
  'paymentMethods.action.edit': 'Edit Method',
  'paymentMethods.search.placeholder': 'Search by code or description...',
  'paymentMethods.empty.title': 'No payment methods',
  'paymentMethods.empty.description': 'Create your first payment method to enable collections and payments.',
  'paymentMethods.error.load': 'Error loading payment methods',
  'paymentMethods.form.code': 'Method Code',
  'paymentMethods.form.code_placeholder': 'CASH, CARD, etc.',
  'paymentMethods.form.description': 'Description',
  'paymentMethods.form.description_placeholder': 'e.g. Cash Payment',
  'paymentMethods.form.active': 'Active Method',
  'paymentMethods.form.create_title': 'New Payment Method',
  'paymentMethods.form.edit_title': 'Edit Payment Method',
}
