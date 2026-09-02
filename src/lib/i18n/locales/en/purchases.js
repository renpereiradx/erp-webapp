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
  'purchases.empty.description': 'Select a supplier and start adding products to create a new purchase order.',
  'purchases.empty.action': 'Select Supplier',

  'purchases.create': 'Create Purchase',
  'purchases.saving': 'Creating Purchase...',

  // Placeholder message (temporary)
  'purchases.placeholder.message': 'This section will be available soon.',

  // Instant payment post-creation
  'purchases.paymentDecision.title': 'Purchase Order Created',
  'purchases.paymentDecision.description': 'Order #{orderId} created for {amount}.',
  'purchases.paymentDecision.question': 'Register payment now?',
  'purchases.paymentDecision.amountLabel': 'Amount to pay',
  'purchases.paymentDecision.methodLabel': 'Payment method',
  'purchases.paymentDecision.notesLabel': 'Notes (optional)',
  'purchases.paymentDecision.notesPlaceholder': 'Payment notes...',
  'purchases.paymentDecision.payNow': 'Confirm Payment',
  'purchases.paymentDecision.leavePending': 'Leave Pending',
  'purchases.paymentDecision.processing': 'Processing...',
  'purchases.paymentDecision.paymentSuccess': 'Payment registered for order #{orderId}',
  'purchases.paymentDecision.paymentError': 'Error registering payment. The order was created successfully.',
  'purchases.errors.cashRegisterRequired': 'You need an open cash register to pay. Open a register and try again.',

  // VAT breakdown in totals
  'purchases.totals.vatRate': 'VAT {pct}%',
  'purchases.totals.exempt': 'Exempt',

  // ─── DESIGN.md alignment: purchases page ──────────────────────────────────
  'purchases.management.title': 'Purchase Management',
  'purchases.management.subtitle': 'Supply and purchase orders to suppliers',

  // Order cart
  'purchases.cart.title': 'Products in the Order',
  'purchases.cart.subtitle': 'Items to be added to inventory',
  'purchases.cart.add_item': 'Add Item',
  'purchases.cart.id_sku': 'ID / SKU',
  'purchases.cart.product': 'Product',
  'purchases.cart.empty_hint': 'Click "Add Item" to get started',
  'purchases.cart.unit': 'Unit',
  'purchases.cart.remove_item': 'Remove item from order',

  // Order totals
  'purchases.totals.items': 'Total Items',
  'purchases.totals.total': 'Purchase Total',
  'purchases.totals.vatIncluded': 'VAT Breakdown (Included)',
  'purchases.totals.expected_sale': 'Expected Sale',
  'purchases.totals.projected_profit': 'Projected Profit',
  'purchases.totals.buy': 'Buy (F12)',
  'purchases.totals.processing': 'Processing...',
  'purchases.totals.clear_all': 'Clear All',
  'purchases.totals.clear_confirm': 'Clear the entire order?',

  // Purchase history
  'purchases.history.search': 'Search',
  'purchases.history.order_date': 'Order Date',
  'purchases.history.total_amount': 'Total Amount',
  'purchases.history.branch': 'Branch',
  'purchases.history.payment': 'Payment',
  'purchases.history.pending_balance': 'Pending Balance',
  'purchases.history.paid': 'Paid',
  'purchases.history.view_detail': 'View Detail',
  'purchases.history.cancel_order': 'Cancel Order',

  // Cancel modal
  'purchases.cancel.title': 'Cancel this order?',
  'purchases.cancel.confirm': 'Yes, Cancel It',
  'purchases.cancel.body': 'This action will affect balances with {supplier}.',
  'purchases.cancel.impact_title': 'Impact of cancellation:',
  'purchases.cancel.impact_payments': '{count} payments will be reversed.',
  'purchases.cancel.impact_stock': 'Stock will be adjusted for {count} items.',
  'purchases.cancel.impact_total': 'Total to reverse: {amount}',

  // Post-purchase confirmation modal
  'purchases.confirmation.title': 'Purchase Registered',
  'purchases.confirmation.subtitle': 'Purchase order #{id} saved successfully.',
  'purchases.confirmation.total': 'Total Amount',
  'purchases.confirmation.branch': 'Assigned Branch',
  'purchases.confirmation.branch_value': 'Branch #{id}',
  'purchases.confirmation.warnings': 'Warnings',
  'purchases.confirmation.warning.price': '{product}: {reason}',
  'purchases.confirmation.warning.no_price_reason': 'Price could not be derived',
  'purchases.confirmation.warning.tax_rate': '{product}: Observed rate of {rate}% differs from the expected one.',
  'purchases.confirmation.fallback_product': 'Product',
  'purchases.confirmation.fiscal_title': 'Per-Item Tax Breakdown',
  'purchases.confirmation.col_product': 'Product',
  'purchases.confirmation.col_qty': 'Qty',
  'purchases.confirmation.col_iva': 'VAT',
  'purchases.confirmation.col_source': 'Source',
  'purchases.confirmation.actions.history': 'View in History',
  'purchases.confirmation.actions.close': 'Close',

  // Add/edit item modal
  'purchases.product_modal.title_edit': 'Edit Item',
  'purchases.product_modal.title_add': 'Add Purchase Item',
  'purchases.product_modal.subtitle': 'Select a product, then set quantity, cost and pricing strategy',
  'purchases.product_modal.search_label': 'Search Product',
  'purchases.product_modal.search_placeholder': 'Search by SKU, EAN or Name...',
  'purchases.product_modal.variants_badge': 'Variants',
  'purchases.product_modal.stock_label': 'Stock:',
  'purchases.product_modal.last_cost': 'Last Cost',
  'purchases.product_modal.sale_price': 'Sale Price',
  'purchases.product_modal.unit_label': 'Unit',
  'purchases.product_modal.select_variant': 'Select Variant',
  'purchases.product_modal.clear': 'Clear',
  'purchases.product_modal.loading_variants': 'Loading variants...',
  'purchases.product_modal.no_variants': 'This product has no active variants',
  'purchases.product_modal.add_base': 'Add main product without variant',
  'purchases.product_modal.select_placeholder': 'Select a product',
  'purchases.product_modal.quantity': 'Quantity',
  'purchases.product_modal.quantity_hint': 'Units to purchase',
  'purchases.product_modal.unit_placeholder': 'E.g. kg, box, unit',
  'purchases.product_modal.unit_hint': 'Purchase measure',
  'purchases.product_modal.cost': 'Unit Cost',
  'purchases.product_modal.cost_hint': 'Price per unit',
  'purchases.product_modal.tax_source_product': 'Product-specific tax',
  'purchases.product_modal.tax_source_category': 'Category-suggested tax {category}',
  'purchases.product_modal.tax_source_custom': 'Manually customized tax',
  'purchases.product_modal.pricing_strategy': 'Sale Price Strategy',
  'purchases.product_modal.mode_margin': 'By Margin %',
  'purchases.product_modal.mode_fixed': 'Fixed Price',
  'purchases.product_modal.margin_label_margin': 'Profit Margin',
  'purchases.product_modal.margin_label_calc': 'Calculated Margin',
  'purchases.product_modal.margin_hint_margin': 'Set the desired profit percentage',
  'purchases.product_modal.margin_hint_calc': 'Percentage resulting from the fixed price',
  'purchases.product_modal.price_label_fixed': 'Sale Price',
  'purchases.product_modal.price_label_suggested': 'Suggested Price',
  'purchases.product_modal.price_hint_fixed': 'Final retail price',
  'purchases.product_modal.price_hint_suggested': 'Calculated from margin',
  'purchases.product_modal.unit_cost': 'Unit Cost',
  'purchases.product_modal.unit_sale_price': 'Unit Sale Price',
  'purchases.product_modal.projection': 'Financial Projection',
  'purchases.product_modal.line_subtotal': 'Line Subtotal',
  'purchases.product_modal.expected_profit': 'Expected Profit',
  'purchases.product_modal.select_generic': 'Select Generic Product',
  'purchases.product_modal.save': 'Save Changes',
  'purchases.product_modal.add_to_order': 'Add to Order',

  // Wizard: alignment extras
  'purchases.checkoutWizard.title': 'Complete Purchase',
  'purchases.checkoutWizard.subtitle': 'Register the order and the supplier payment',
  'purchases.checkoutWizard.cart': 'Order',
  'purchases.checkoutWizard.cartEmpty': 'No items in the order',
  'purchases.checkoutWizard.subtotal': 'Subtotal',
  'purchases.checkoutWizard.tax': 'Taxes',
  'purchases.checkoutWizard.total': 'Purchase Total',
  'purchases.checkoutWizard.items': 'Items',
  'purchases.checkoutWizard.taxSummary': 'VAT Breakdown',
  'purchases.checkoutWizard.step.supplier': 'Supplier',
  'purchases.checkoutWizard.step.payment': 'Payment',
  'purchases.checkoutWizard.step.collection': 'Collection',
  'purchases.checkoutWizard.action.next': 'Next',
  'purchases.checkoutWizard.action.back': 'Back',
  'purchases.checkoutWizard.action.confirm': 'Confirm Purchase',
  'purchases.checkoutWizard.action.leavePending': 'Save order only',
  'purchases.checkoutWizard.action.processing': 'Processing...',
  'purchases.checkoutWizard.supplier.placeholder': 'Search supplier by name or RUC... (F3)',
  'purchases.checkoutWizard.supplier.empty': 'No suppliers found',
  'purchases.checkoutWizard.payment.method': 'Payment method',
  'purchases.checkoutWizard.payment.currency': 'Currency',
  'purchases.checkoutWizard.payment.notes': 'Purchase notes',
  'purchases.checkoutWizard.payment.notesPlaceholder': 'E.g.: Urgent supply order...',
  'purchases.checkoutWizard.collection.cashRegister': 'Payment register',
  'purchases.checkoutWizard.collection.noCashRegister': 'No register assigned',
  'purchases.checkoutWizard.collection.loadingRegisters': 'Loading registers...',
  'purchases.checkoutWizard.collection.registersError': 'Registers could not be loaded. Check your session and try again.',
  'purchases.checkoutWizard.collection.amountPaid': 'Amount to pay',
  'purchases.checkoutWizard.collection.exact': 'Exact',
  'purchases.checkoutWizard.collection.notes': 'Payment notes (optional)',
  'purchases.checkoutWizard.collection.notesPlaceholder': 'Payment notes...',
  'purchases.checkoutWizard.stepsAria': 'Checkout steps',
  'purchases.checkoutWizard.supplier.clear': 'Remove supplier',
  'purchases.checkoutWizard.hints.confirm': 'Confirm',
  'purchases.checkoutWizard.hints.next': 'Next',
  'purchases.checkoutWizard.hints.enterKey': 'Enter',
  'purchases.checkoutWizard.hints.advance': 'Advance',
  'purchases.checkoutWizard.hints.back': 'Back',
  'purchases.checkoutWizard.hints.focus': 'Focus',
  'purchases.checkoutWizard.hints.searchSupplier': 'Search supplier',
  'purchases.checkoutWizard.hints.navigate': 'Navigate',
  'purchases.checkoutWizard.hints.exactAmount': 'Exact amount',
}
