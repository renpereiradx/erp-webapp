/**
 * Purchase translations in English
 * Module: Purchase order management, suppliers, payments
 */

export const purchases = {
  // Main titles
  'purchases.title': 'Purchases',
  'purchases.subtitle': 'Manage supplier purchases, control inventory and purchase orders',

  // Navigation tabs
  'purchases.tab.new': 'New Purchase',
  'purchases.tab.history': 'Purchase History',
  'purchases.tab.list': 'Purchase List',

  // Search and filters
  'purchases.search.placeholder': 'Search by supplier or ID...',
  'purchases.search.type': 'Search type',
  'purchases.search.by_supplier': 'Supplier',
  'purchases.search.by_date': 'Date',
  'purchases.search.type_aria': 'Select search type',
  'purchases.search.supplier_placeholder': 'Search supplier by name, tax ID or contact...',
  'purchases.search.start_date': 'Start date',
  'purchases.search.end_date': 'End date',

  // Purchase table (history)
  'purchases.table.id': 'Purchase ID',
  'purchases.table.date': 'Date',
  'purchases.table.supplier': 'Supplier',
  'purchases.table.total': 'Total',
  'purchases.table.delivery': 'Delivery',
  'purchases.table.status': 'Status',
  'purchases.table.product_id': 'Product ID',
  'purchases.table.margin': 'Margin (%)',
  'purchases.table.actions': 'Actions',
  'purchases.table.actions_aria': 'Open actions menu',

  // Order statuses
  'purchases.status.completed': 'Completed',
  'purchases.status.pending': 'Pending',
  'purchases.status.cancelled': 'Cancelled',
  'purchases.status.received': 'Received',

  // Actions
  'purchases.action.create': 'Create new order',

  // Empty messages
  'purchases.empty.title': 'No purchase orders',
  'purchases.empty.message': 'There are no registered purchase orders',
  'purchases.filter.empty': 'No results found for your search',

  // Errors
  'purchases.error.title': 'Error loading purchases',

  // === NEW PURCHASE FORM ===

  // Products section
  'purchases.form.products': 'Selected Products',
  'purchases.form.search_products': 'Search products...',
  'purchases.form.add_product': 'Add Product',
  'purchases.form.product': 'Product',
  'purchases.form.quantity': 'Quantity',
  'purchases.form.unit_price': 'Unit Price',
  'purchases.form.total': 'Total',
  'purchases.form.actions': 'Actions',
  'purchases.form.no_products': 'No products added yet. Search and add products to the purchase order.',
  'purchases.form.remove_item': 'Remove',
  'purchases.form.profit_margin': 'Profit Margin (%)',

  // Purchase summary
  'purchases.form.summary': 'Summary',
  'purchases.form.items': 'Items',
  'purchases.form.subtotal': 'Subtotal',
  'purchases.form.taxes': 'Taxes (0%)',
  'purchases.form.save': 'Save Purchase',
  'purchases.form.cancel': 'Cancel',

  // Supplier information
  'purchases.form.supplier_info': 'Supplier Information',
  'purchases.form.select_supplier': 'Select supplier...',
  'purchases.form.supplier_name': 'Supplier',
  'purchases.form.contact': 'Contact',
  'purchases.form.phone': 'Phone',
  'purchases.form.email': 'Email',
  'purchases.form.search_supplier': 'Search supplier by name...',
  'purchases.form.searching_suppliers': 'Searching suppliers...',
  'purchases.form.clear_supplier': 'Clear supplier',
  'purchases.form.select_from_results': 'Select from results',
  'purchases.form.choose_supplier': 'Choose supplier...',
  'purchases.form.no_results': 'Search to see results...',

  // Payment details
  'purchases.form.payment_details': 'Payment Details',
  'purchases.form.payment_method': 'Payment Method',
  'purchases.form.select_payment_method': 'Select payment method...',
  'purchases.form.payment.cash': 'Cash',
  'purchases.form.payment.transfer': 'Bank Transfer',
  'purchases.form.payment.check': 'Check',
  'purchases.form.payment.credit': 'Credit',
  'purchases.form.payment_currency': 'Payment Currency',
  'purchases.form.currency.pyg': 'Guaraníes (PYG)',
  'purchases.form.currency.usd': 'Dollars (USD)',
  'purchases.form.currency.brl': 'Reais (BRL)',
  'purchases.form.currency.ars': 'Argentine Pesos (ARS)',
  'purchases.form.loading_methods': 'Loading methods...',
  'purchases.form.loading_currencies': 'Loading currencies...',

  // Purchase details
  'purchases.form.purchase_details': 'Purchase Details',
  'purchases.form.purchase_date': 'Purchase Date',
  'purchases.form.delivery_date': 'Expected Delivery',
  'purchases.form.notes': 'Notes',
  'purchases.form.notes_placeholder': 'Additional notes...',

  // Form errors
  'purchases.form.errors.supplier_required': 'Must select a supplier',
  'purchases.form.errors.products_required': 'Must add at least one product',
  'purchases.form.errors.duplicate_product': 'This product has already been added. Double-click to edit.',

  // Success/error messages
  'purchases.form.success': 'Purchase order created successfully',
  'purchases.form.error': 'Error creating purchase order',

  // === ADD PRODUCT MODAL ===

  'purchases.modal.title': 'Add product to purchase',
  'purchases.modal.edit_title': 'Edit product in purchase',
  'purchases.modal.subtitle': 'Select an item from the catalog, adjust quantity and configure profit margin before adding to the order.',
  'purchases.modal.selected_product': 'Selected product',
  'purchases.modal.select_product': 'Select a product',
  'purchases.modal.product_placeholder': 'Search product...',
  'purchases.modal.product_note': 'Enter product name or code',
  'purchases.modal.quantity_placeholder': 'E.g.: 10',
  'purchases.modal.quantity_note': 'Number of units to purchase',
  'purchases.modal.unit_price_placeholder': 'E.g.: 15000',
  'purchases.modal.unit_price_note': 'Purchase price of product',
  'purchases.modal.profit_note': 'Profit percentage over cost',
  'purchases.modal.subtotal': 'Subtotal (cost x qty.)',
  'purchases.modal.line_total': 'Sale total (qty. x sale price)',
  'purchases.modal.search_min_chars': 'Type at least 2 characters to search',
  'purchases.modal.no_results': 'No products found',

  // Pricing method in modal
  'purchases.modal.pricing_mode': 'Pricing Method',
  'purchases.modal.pricing_mode.margin': 'By profit margin',
  'purchases.modal.pricing_mode.final_price': 'By sale price',
  'purchases.modal.sale_price': 'Final Sale Price',
  'purchases.modal.sale_price_note': 'Margin will be calculated automatically',
  'purchases.modal.calculated_margin': 'Calculated margin',
  'purchases.modal.calculated_sale_price': 'Calculated sale price',

  // === PURCHASE CONFIGURATION ===

  'purchases.config.title': 'Purchase Configuration',
  'purchases.config.expected_delivery': 'Expected Delivery Date',
  'purchases.config.payment_terms': 'Payment Terms',
  'purchases.config.delivery_method': 'Delivery Method',
  'purchases.config.notes': 'Notes',
  'purchases.config.notes.placeholder': 'Additional notes about the purchase...',

  // === OTHER ===

  'purchases.supplier.info': 'Supplier Information',
  'purchases.products.title': 'Products',
  'purchases.items.title': 'Order Items ({count})',
  'purchases.actions.save': 'Create Purchase',
  'purchases.actions.saving': 'Creating Purchase...',
  'purchases.clear': 'Clear All',

  // TODO list
  'purchases.todo.title': 'To complete:',
  'purchases.todo.supplier': 'Select supplier',
  'purchases.todo.items': 'Add products',
  'purchases.todo.valid_items': 'Verify quantities',

  // Initial empty state
  'purchases.empty.title': 'Start a purchase',
  'purchases.empty.description': 'Select a supplier and start adding products to create a new purchase order.',
  'purchases.empty.action': 'Select Supplier',

  'purchases.create': 'Create Purchase',
  'purchases.saving': 'Creating Purchase...',

  // Placeholder message (temporary)
  'purchases.placeholder.message': 'This section will be available soon.',
}
