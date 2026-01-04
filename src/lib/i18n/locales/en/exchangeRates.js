/**
 * Exchange Rates translations in English
 * Module: Financial Configuration > Exchange Rates
 */

export const exchangeRates = {
  // Titles and subtitles
  'exchangeRates.title': 'Exchange Rates',
  'exchangeRates.subtitle':
    'View and manage daily exchange rates and currency pairs.',

  // Actions
  'exchangeRates.action.create': 'New Rate',
  'exchangeRates.action.edit': 'Edit Rate',
  'exchangeRates.action.delete': 'Delete Rate',
  'exchangeRates.action.export': 'Export CSV',

  // Search and filters
  'exchangeRates.search.placeholder': 'Search currency (e.g. USD, EUR)',
  'exchangeRates.filter.from': 'From',
  'exchangeRates.filter.to': 'To',
  'exchangeRates.filter.fromCurrency': 'From Currency',
  'exchangeRates.filter.toCurrency': 'To Currency',
  'exchangeRates.filter.dateRange': 'Date Range',
  'exchangeRates.placeholder.source': 'Enter source (e.g. Central Bank)',

  // View modes
  'exchangeRates.view.latest': 'Latest',
  'exchangeRates.view.historical': 'Historical',

  // Table
  'exchangeRates.table.currencyPair': 'Currency Pair',
  'exchangeRates.table.rate': 'Rate',
  'exchangeRates.table.source': 'Source',
  'exchangeRates.table.createdAt': 'Created At',
  'exchangeRates.table.status': 'Status',
  'exchangeRates.table.actions': 'Actions',

  // Sources
  'exchangeRates.source.manual': 'Manual',
  'exchangeRates.source.centralBank': 'Central Bank',
  'exchangeRates.source.forexApi': 'Forex API',
  'exchangeRates.source.system': 'System',

  // States
  'exchangeRates.status.active': 'Active',
  'exchangeRates.status.inactive': 'Inactive',

  // Pagination
  'exchangeRates.pagination.rowsPerPage': 'Rows per page:',
  'exchangeRates.pagination.showing': '{start}-{end} of {total}',

  // Modal
  'exchangeRates.modal.create_title': 'New Exchange Rate',
  'exchangeRates.modal.edit_title': 'Edit Exchange Rate',
  'exchangeRates.modal.delete_title': 'Delete Exchange Rate',
  'exchangeRates.modal.delete_confirm':
    'Are you sure you want to delete this exchange rate? This action cannot be undone.',

  // Form fields
  'exchangeRates.field.currency': 'Currency',
  'exchangeRates.field.rate': 'Rate',
  'exchangeRates.field.effectiveDate': 'Effective Date',
  'exchangeRates.field.source': 'Source',

  // Validations
  'exchangeRates.validation.currency_required': 'Currency is required',
  'exchangeRates.validation.rate_required': 'Rate is required',
  'exchangeRates.validation.rate_positive': 'Rate must be greater than 0',

  // Empty states
  'exchangeRates.empty.title': 'No exchange rates',
  'exchangeRates.empty.message': 'No exchange rates registered',
  'exchangeRates.empty.search': 'No exchange rates found with that criteria',

  // Errors
  'exchangeRates.error.title': 'Error',
  'exchangeRates.error.load': 'Error loading exchange rates',
  'exchangeRates.error.save': 'Error saving exchange rate',
  'exchangeRates.error.delete': 'Error deleting exchange rate',

  // Navigation menu
  'nav.exchange_rates': 'Exchange Rates',
}
