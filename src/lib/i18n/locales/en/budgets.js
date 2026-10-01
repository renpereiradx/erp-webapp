/**
 * English translations for budgets (quotes)
 * Module: Commercial Management — /comercial/presupuestos
 */

export const budgets = {
  // Client search (BudgetCreate)
  'budgets.client.searchPlaceholder': 'Type the client name or RUC to search...',
  'budgets.client.empty': 'No clients found',

  // Product search uses shared products.search.* keys (sellableUnitSearch
  // helper shared with requisitions)

  // ─── Budget receipt (BudgetPrintModal + detail/row buttons) ───
  'budgets.print.title': 'Budget approved',
  'budgets.print.subtitle': 'Budget #{id}',
  'budgets.print.registered': 'The budget was approved. Do you want to hand over the receipt?',
  'budgets.print.total': 'Total',
  'budgets.print.validUntil': 'Valid until',
  'budgets.print.printTicket': 'Print ticket',
  'budgets.print.downloadPdf': 'Download PDF',
  'budgets.print.close': 'Done',
  'budgets.print.printSent': 'Ticket sent to {printer}',
  'budgets.print.printError': 'Ticket could not be printed',
  'budgets.print.pdfOk': 'PDF downloaded',
  'budgets.print.pdfError': 'PDF could not be downloaded',
  'budgets.print.noPrinter': 'No printer configured: register it in Settings → Printers',
  'budgets.print.noPermission': 'Your user does not have documents permission.',
}
