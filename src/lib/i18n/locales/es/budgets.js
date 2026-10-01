/**
 * Traducciones de presupuestos (cotizaciones) en español
 * Módulo: Gestión Comercial — /comercial/presupuestos
 */

export const budgets = {
  // Búsqueda de cliente (BudgetCreate)
  'budgets.client.searchPlaceholder': 'Escribe el nombre o RUC del cliente para buscar...',
  'budgets.client.empty': 'No se encontraron clientes',

  // Búsqueda de productos: usa claves compartidas products.search.* (helper
  // sellableUnitSearch compartido con requisiciones)

  // ─── Comprobante de presupuesto (BudgetPrintModal + botones detalle/fila) ───
  'budgets.print.title': 'Presupuesto aprobado',
  'budgets.print.subtitle': 'Presupuesto #{id}',
  'budgets.print.registered': 'El presupuesto quedó aprobado. ¿Querés entregar el comprobante?',
  'budgets.print.total': 'Total',
  'budgets.print.validUntil': 'Válido hasta',
  'budgets.print.printTicket': 'Imprimir ticket',
  'budgets.print.downloadPdf': 'Descargar PDF',
  'budgets.print.close': 'Listo',
  'budgets.print.printSent': 'Ticket enviado a {printer}',
  'budgets.print.printError': 'No se pudo imprimir el ticket',
  'budgets.print.pdfOk': 'PDF descargado',
  'budgets.print.pdfError': 'No se pudo descargar el PDF',
  'budgets.print.noPrinter': 'Sin impresora configurada: registrala en Configuración → Impresoras',
  'budgets.print.noPermission': 'Tu usuario no tiene permiso de comprobantes (documents).',
}
