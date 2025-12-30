/**
 * Product translations in English
 * Module: Product management, inventory, search
 */

export const products = {
  // Titles and navigation
  'products.title': 'Product Management',
  'products.new': 'New Product',
  'products.create_first': 'Create First Product',

  // Loading states
  'products.loading': 'Loading products...',
  'products.error.loading': 'Load error',
  'products.retry': 'Retry',

  // Search
  'products.search': 'Search',
  'products.search.db': 'Search in Database',
  'products.search.placeholder': 'Search by name or ID...',
  'products.search.placeholder_id': 'Search by product ID...',
  'products.search.help1': 'You can search by name (e.g. "Puma") or by full ID (e.g. "bcYdWdKNR")',
  'products.search.help2': 'Auto-search: minimum {minChars} characters. Shortcut: "/" to focus.',
  'products.search.by_name_sku': 'Search products by name or SKU',

  // Actions
  'products.clear': 'Clear',
  'products.bulk.activate': 'Activate',
  'products.bulk.deactivate': 'Deactivate',
  'products.bulk.clear': 'Clear',
  'products.inline.save': 'Save',
  'products.inline.cancel': 'Cancel',
  'products.action.filter': 'Filter',
  'products.action.export': 'Export',
  'products.action.new_product': 'New Product',
  'products.action.refresh': 'Refresh',

  // Empty messages
  'products.no_products_loaded': 'No products loaded',
  'products.no_results': 'No products found',
  'products.no_results_for': 'No products matched "{term}"',
  'products.empty.title': 'No products',
  'products.empty.message': 'No products registered in the system',
  'products.empty.description': 'Create your first product to get started',
  'products.empty.no_results': 'No products found',
  'products.error.title': 'Error loading products',

  // Pagination
  'products.page_size_label': 'Products per page:',
  'products.pagination.showing': 'Showing {start} to {end} of {total} results',
  'products.pagination.page_of': '{current} / {total}',

  // Filters
  'products.filter.category': 'Category',
  'products.filter.all_categories': 'All categories',
  'products.filter.status': 'Status',
  'products.filter.all_statuses': 'All',
  'products.filter.apply': 'Apply',
  'products.filter.clear': 'Clear',

  // View modes
  'products.mode.search': 'Search mode',
  'products.mode.paginated': 'Showing recent products',

  // Table headers
  'products.table.product_name': 'Product Name',
  'products.table.category': 'Category',
  'products.table.stock': 'Stock',
  'products.table.state': 'State',
  'products.table.financial_health': 'Financial Health',
  'products.table.created_at': 'Created',
  'products.table.updated_at': 'Updated',
  'products.table.actions': 'Actions',

  // States
  'products.state.active': 'Active',
  'products.state.inactive': 'Inactive',

  // Page
  'products.page.title': 'Product Management',
  'products.page.subtitle': 'Manage, filter and view all products in the system.',

  // Statistics
  'products.stats.products': 'Products',
  'products.stats.quantity': 'Quantity',
  'products.stats.subtotal': 'Subtotal',
  'products.stats.total': 'Total',
}
