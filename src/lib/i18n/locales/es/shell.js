/**
 * Traducciones del shell de la aplicación
 * Incluye: navegación lateral (aside), header y selector de sucursales
 */

export const shell = {
  // Navegación lateral
  'nav.mainMenu': 'Menú Principal',
  // 404 (F2: /dashboard vuelve a existir; la salida es el dashboard BI)
  'notFound.title': 'Página no encontrada',
  'notFound.subtitle': 'La página que buscas no existe.',
  'notFound.message': 'Verifica la URL o regresa al dashboard.',
  'notFound.backToDashboard': 'Ir al Dashboard',
  // PLAN_VERSION_UI_FRONTEND: el tagline ya NO lleva versión — la muestra SystemVersionBadge.
  'nav.brandTagline': 'Sistema integral',
  // Marca del proveedor (docs/sales/GUIA_VENTAS.md §1) — nombre propio, sin traducción.
  'nav.brandName': 'Code Dynamic',
  'nav.newSale': 'Nueva Venta',
  'nav.budgets': 'Presupuestos',
  'nav.agendaReservations': 'Agenda y Reservas',
  'nav.classificationCatalogs': 'Clasificación y Catálogos',
  'nav.categoriesTaxes': 'Categorías e Impuestos',
  'nav.brands': 'Marcas',
  'nav.attributesTags': 'Atributos y Etiquetas',
  'nav.requisitions': 'Requisiciones',
  'nav.usersSecurity': 'Usuarios y Seguridad',
  'nav.usersManagement': 'Gestión de Usuarios',
  'nav.sessionControl': 'Control de Sesiones',
  'nav.myProfile': 'Mi Perfil',
  'nav.sifenNumberingGaps': 'Saltos de numeración SIFEN',
  'nav.sifenFiscalDashboard': 'Dashboard Fiscal SIFEN',
  'nav.sifenFiscalGroup': 'Fiscal (SIFEN)',
  // F2 — grupo BI re-activado con su primera pantalla (Dashboard).
  'nav.biGroup': 'Inteligencia de Negocios',
  'nav.dashboardGroup': 'Dashboard',
  'nav.dashboardHome': 'Resumen Ejecutivo',
  'nav.dashboardKpis': 'KPIs y Rendimiento',
  'nav.dashboardHeatmap': 'Análisis de Ventas',
  'nav.dashboardAlerts': 'Alertas de Negocio',
  'nav.dashboardTopProducts': 'Top de Productos',
  'nav.dashboardPayables': 'Cartera de CxP',
  // F3 — drill-downs relacionales (grupos Ventas/Compras del pack BI).
  'nav.salesAnalytics': 'Analítica de Ventas',
  'nav.purchaseAnalytics': 'Analítica de Compras',
  'nav.relationalBuyers': 'Compradores por Producto',
  'nav.relationalCustomerTop': 'Productos por Cliente',
  'nav.relationalSupplierTop': 'Productos Suministrados',
  'nav.relationalProductSuppliers': 'Comparar Proveedores',
  // F4 — Analítica de Ventas completa (6 pantallas del grupo).
  'nav.salesDashboard': 'Dashboard de Ventas',
  'nav.salesProductsCategories': 'Productos y Categorías',
  'nav.salesInsights': 'Clientes y Vendedores',
  'nav.salesTrendsVelocity': 'Tendencias y Velocidad',
  'nav.salesPeriodComparison': 'Comparativa de Períodos',
  'nav.salesDiscounts': 'Descuentos',
  // F5 — Analítica de Inventario completa (4 pantallas del grupo).
  'nav.inventoryAnalytics': 'Analítica de Inventario',
  'nav.inventoryDashboard': 'Dashboard de Inventario',
  'nav.inventoryTurnoverAbc': 'Rotación y ABC',
  'nav.inventoryStockLevels': 'Niveles de Stock',
  'nav.inventoryRisk': 'Riesgos y Stock Muerto',
  'nav.profitability': 'Rentabilidad',
  'nav.profitabilityDashboard': 'Dashboard de Rentabilidad',
  'nav.profitabilityProducts': 'Productos',
  'nav.profitabilityCustomers': 'Clientes',
  'nav.profitabilityCategories': 'Categorías',
  'nav.profitabilityTrends': 'Tendencias',
  'nav.profitabilitySellers': 'Vendedores',
  // F7 — Cuentas por Cobrar (4 hojas del grupo; detalle y ficha no van al sidebar).
  'nav.receivablesGroup': 'Cuentas por Cobrar',
  'nav.receivablesDashboard': 'Resumen de cartera',
  'nav.receivablesList': 'Lista de cuentas',
  'nav.receivablesOverdue': 'Cuentas vencidas',
  'nav.receivablesAging': 'Reporte de antigüedad',
  // F8 — Cuentas por Pagar (4 hojas; detalle y proveedor no van al sidebar).
  'nav.payablesGroup': 'Cuentas por Pagar',
  'nav.payablesDashboard': 'Resumen de CxP',
  'nav.payablesInvoices': 'Facturas por pagar',
  'nav.payablesCashFlow': 'Proyección de flujo de caja',
  'nav.payablesAging': 'Reporte de antigüedad',
  'nav.financeSummary': 'Resumen financiero',
  // F9 — Reportes Financieros (4 hojas; SIFEN sigue en su grupo Core).
  'nav.financialReportsGroup': 'Reportes Financieros',
  'nav.financePnl': 'Estado de Resultados',
  'nav.financeCashFlow': 'Flujo de caja',
  'nav.financeTax': 'Gestión de IVA',
  'nav.financeLegalBooks': 'Libros legales',

  'nav.collapseSidebar': 'Colapsar menú',
  'nav.expandSidebar': 'Expandir menú',
  'nav.openMenu': 'Abrir menú',
  'nav.globalSearchPlaceholder': 'Buscar páginas o comandos ({shortcut})...',
  'nav.profile': 'Perfil',
  'nav.viewProfile': 'Ver perfil',

  // Selector de sucursales (header)
  'branches.active': 'Sucursal Activa',
  'branches.all': 'Todas las Sucursales',
  'branches.select': 'Seleccionar Sucursal',
  'branches.globalAccess': 'Acceso Administrativo (Sin Filtro)',
  'branches.withId': 'Sucursal {{id}}',
  'branches.pointOfSale': 'Punto de Venta',
  'branches.location': 'Ubicación',
  'branches.operations': 'Sucursal de Operaciones',
  'branches.globalNotice': 'El cambio afecta a todos los módulos',
}
