/**
 * English purchase payments translations
 */

export const purchasePaymentsMvp = {
  // Titles and subtitles
  'purchasePaymentsMvp.title': 'Purchase Payments',
  'purchasePaymentsMvp.subtitle': 'Monitor pending balances, partial and overdue payments of your purchase orders.',

  // Main actions
  'purchasePaymentsMvp.actions.refresh': 'Refresh',
  'purchasePaymentsMvp.actions.export': 'Download',
  'purchasePaymentsMvp.actions.registerPayment': 'Register Payment',

  // Filters
  'purchasePaymentsMvp.filters.search.placeholder': 'Search by order ID or supplier...',
  'purchasePaymentsMvp.filters.status.all': 'All statuses',
  
  // Statuses
  'purchasePaymentsMvp.status.pending': 'Pending',
  'purchasePaymentsMvp.status.partial': 'Partial Payment',
  'purchasePaymentsMvp.status.paid': 'Paid',
  'purchasePaymentsMvp.status.completed': 'Completed',
  'purchasePaymentsMvp.status.overdue': 'Overdue',
  'purchasePaymentsMvp.status.cancelled': 'Cancelled',

  // Errors
  'purchasePaymentsMvp.error.title': 'Operation Error',
  'purchasePaymentsMvp.data.error.title': 'Error loading payments',
  
  // Messages
  'purchasePaymentsMvp.messages.refreshing': 'Refreshing data...',
  'purchasePaymentsMvp.messages.paymentRegistered': 'Payment registered successfully',

  // ─── DESIGN.md alignment: purchase payments page ──────────────────────────
  'purchasePaymentsMvp.page.title': 'Supplier Payments',
  'purchasePaymentsMvp.page.subtitle': 'Manage balances and due dates of purchase invoices',
  'purchasePaymentsMvp.actions.report': 'Report',
  'purchasePaymentsMvp.actions.viewDetail': 'View detail',
  'purchasePaymentsMvp.actions.cancelOrder': 'Cancel order',
  'purchasePaymentsMvp.actions.back': 'Back',
  'purchasePaymentsMvp.filters.search.label': 'Search orders',
  'purchasePaymentsMvp.filters.status.label': 'Payment status',
  'purchasePaymentsMvp.filters.reset': 'Reset',
  'purchasePaymentsMvp.table.orderDate': 'Order / Date',
  'purchasePaymentsMvp.table.actions': 'Actions',
  'purchasePaymentsMvp.table.supplier': 'Supplier',
  'purchasePaymentsMvp.table.total': 'Total amount',
  'purchasePaymentsMvp.table.pending': 'Pending balance',
  'purchasePaymentsMvp.table.id': 'ID',
  'purchasePaymentsMvp.cancel.fallbackSupplier': 'the supplier',

  // Toasts and page errors
  'purchasePaymentsMvp.data.empty.title': 'No results',
  'purchasePaymentsMvp.data.empty.description': 'No purchase orders match the current filters.',
  'purchasePaymentsMvp.toast.loadError': 'Purchase payment orders could not be loaded',
  'purchasePaymentsMvp.toast.refreshing': 'Refreshing list...',
  'purchasePaymentsMvp.toast.refreshed': 'List updated',
  'purchasePaymentsMvp.toast.refreshError': 'Error refreshing the list',
  'purchasePaymentsMvp.toast.filtersReset': 'Filters reset',
  'purchasePaymentsMvp.toast.cancelSuccess': 'Purchase order cancelled successfully.',
  'purchasePaymentsMvp.toast.cancelError': 'The order could not be cancelled',
  'purchasePaymentsMvp.toast.paymentSuccess': 'Payment registered successfully',
  'purchasePaymentsMvp.toast.paymentError': 'The payment could not be processed',

  // Detail page
  'purchasePaymentsMvp.detail.title': 'Purchase Detail',
  'purchasePaymentsMvp.detail.loadError': 'The order could not be loaded.',
  'purchasePaymentsMvp.detail.supplierId': 'ID: #{id}',
  'purchasePaymentsMvp.detail.noAddress': 'No address',
  'purchasePaymentsMvp.detail.currency': 'Currency',
  'purchasePaymentsMvp.detail.orderTotal': 'Order Total',
  'purchasePaymentsMvp.detail.summary.title': 'Order Summary',
  'purchasePaymentsMvp.detail.summary.pending': 'Pending balance',
  'purchasePaymentsMvp.detail.summary.paid': 'Paid amount',
  'purchasePaymentsMvp.detail.summary.progress': 'Payment progress',
  'purchasePaymentsMvp.detail.products.title': 'Included Products',
  'purchasePaymentsMvp.detail.products.subtitle': 'Received goods detail',
  'purchasePaymentsMvp.detail.products.count': '{count} Items',
  'purchasePaymentsMvp.detail.products.empty': 'No products associated with this order.',
  'purchasePaymentsMvp.detail.products.labels.sku': 'Code: {code}',
  'purchasePaymentsMvp.detail.products.headers.description': 'Description',
  'purchasePaymentsMvp.detail.products.headers.quantity': 'Quantity',
  'purchasePaymentsMvp.detail.products.headers.priceWithoutTax': 'Price w/o VAT',
  'purchasePaymentsMvp.detail.products.headers.tax': 'VAT',
  'purchasePaymentsMvp.detail.products.headers.total': 'Total',
  'purchasePaymentsMvp.detail.history.title': 'Payment History',
  'purchasePaymentsMvp.detail.history.subtitle': 'Treasury records',
  'purchasePaymentsMvp.detail.history.entryTitle': 'Payment Made',
  'purchasePaymentsMvp.detail.history.empty': 'No payments registered yet.',

  // Register modal
  'purchasePaymentsMvp.registerModal.title': 'Register new payment',
  'purchasePaymentsMvp.registerModal.orderFallback': 'Select an order with a pending balance to register the payment.',
  'purchasePaymentsMvp.registerModal.panelTitle': 'Register Payment',
  'purchasePaymentsMvp.registerModal.panelSubtitle': 'Supplier',
  'purchasePaymentsMvp.registerModal.invoiceLabel': 'Invoice #{id}',
  'purchasePaymentsMvp.registerModal.percentCovered': '{pct}% covered',
  'purchasePaymentsMvp.registerModal.projectedBalance': 'Projected Balance',
  'purchasePaymentsMvp.registerModal.treasuryNote': '* Verify treasury data before confirming.',
  'purchasePaymentsMvp.registerModal.section.paymentInfo': 'Payment Information',
  'purchasePaymentsMvp.registerModal.section.accounting': 'Accounting Record',
  'purchasePaymentsMvp.registerModal.amount.label': 'Amount to register',
  'purchasePaymentsMvp.registerModal.amount.payFull': 'Pay Full Balance',
  'purchasePaymentsMvp.registerModal.amount.errorRequired': 'Enter a valid amount.',
  'purchasePaymentsMvp.registerModal.currency.label': 'Currency',
  'purchasePaymentsMvp.registerModal.method.label': 'Payment method',
  'purchasePaymentsMvp.registerModal.method.placeholder': 'Select a payment method',
  'purchasePaymentsMvp.registerModal.reference.label': 'Reference',
  'purchasePaymentsMvp.registerModal.reference.placeholder': 'E.g. transaction or receipt number',
  'purchasePaymentsMvp.registerModal.cashRegister.label': 'Cash register',
  'purchasePaymentsMvp.registerModal.cashRegister.placeholder': 'Select a cash register',
  'purchasePaymentsMvp.registerModal.notes.label': 'Notes',
  'purchasePaymentsMvp.registerModal.notes.placeholder': 'Additional remarks (optional)',
  'purchasePaymentsMvp.registerModal.exchangeRate.label': 'Exchange Rate',
  'purchasePaymentsMvp.registerModal.originalAmount.label': 'Original Amount ({currency})',
  'purchasePaymentsMvp.registerModal.originalAmount.placeholder': 'Amount in foreign currency',
  'purchasePaymentsMvp.registerModal.cancel': 'Cancel',
  'purchasePaymentsMvp.registerModal.confirm': 'Register Payment',
  'purchasePaymentsMvp.registerModal.loading': 'Registering payment...',
  'purchasePaymentsMvp.registerModal.submitError': 'The payment could not be registered. Please try again.',
}
