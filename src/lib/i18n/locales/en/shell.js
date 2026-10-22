/**
 * Application shell translations
 * Includes: sidebar navigation (aside), header and branch switcher
 */

export const shell = {
  // Sidebar navigation
  'nav.mainMenu': 'Main Menu',
  // 404 (F2: /dashboard exists again; the exit is the BI dashboard)
  'notFound.title': 'Page not found',
  'notFound.subtitle': 'The page you are looking for does not exist.',
  'notFound.message': 'Check the URL or go back to the dashboard.',
  'notFound.backToDashboard': 'Go to Dashboard',
  // PLAN_VERSION_UI_FRONTEND: the tagline no longer carries a version — SystemVersionBadge shows it.
  'nav.brandTagline': 'Management system',
  // Vendor brand (docs/sales/GUIA_VENTAS.md §1) — proper name, not translated.
  'nav.brandName': 'Code Dynamic',
  'nav.newSale': 'New Sale',
  'nav.budgets': 'Budgets',
  'nav.agendaReservations': 'Agenda & Reservations',
  'nav.classificationCatalogs': 'Classification & Catalogs',
  'nav.categoriesTaxes': 'Categories & Taxes',
  'nav.brands': 'Brands',
  'nav.attributesTags': 'Attributes & Tags',
  'nav.requisitions': 'Requisitions',
  'nav.usersSecurity': 'Users & Security',
  'nav.usersManagement': 'User Management',
  'nav.sessionControl': 'Session Control',
  'nav.myProfile': 'My Profile',
  'nav.sifenNumberingGaps': 'SIFEN Numbering Gaps',
  'nav.sifenFiscalDashboard': 'SIFEN Fiscal Dashboard',
  'nav.sifenFiscalGroup': 'Fiscal (SIFEN)',
  // F2 — BI group re-activated with its first screen (Dashboard).
  'nav.biGroup': 'Business Intelligence',
  'nav.dashboardGroup': 'Dashboard',
  'nav.dashboardHome': 'Executive Summary',
  'nav.dashboardKpis': 'KPIs & Performance',
  'nav.dashboardHeatmap': 'Sales Analysis',
  'nav.dashboardAlerts': 'Business Alerts',
  'nav.dashboardTopProducts': 'Top Products',
  'nav.dashboardPayables': 'AP portfolio',
  // F3 — relational drill-downs (BI pack Sales/Purchases groups).
  'nav.salesAnalytics': 'Sales Analytics',
  'nav.purchaseAnalytics': 'Purchase Analytics',
  'nav.relationalBuyers': 'Buyers by Product',
  'nav.relationalCustomerTop': 'Products by Customer',
  'nav.relationalSupplierTop': 'Supplied Products',
  'nav.relationalProductSuppliers': 'Compare Suppliers',
  // PLAN_ANALITICA_COMPRAS — purchase aggregate group (5 screens).
  'nav.purchaseDashboard': 'Purchases Dashboard',
  'nav.purchaseProductsCategories': 'Products & Categories',
  'nav.purchaseInsights': 'Suppliers & Buyers',
  'nav.purchaseTrends': 'Trends',
  'nav.purchasePeriodComparison': 'Period Comparison',
  // F4 — full Sales Analytics group (6 screens).
  'nav.salesDashboard': 'Sales Dashboard',
  'nav.salesProductsCategories': 'Products & Categories',
  'nav.salesInsights': 'Customers & Sellers',
  'nav.salesTrendsVelocity': 'Trends & Velocity',
  'nav.salesPeriodComparison': 'Period Comparison',
  'nav.salesDiscounts': 'Discounts',
  // F5 — full Inventory Analytics group (4 screens).
  'nav.inventoryAnalytics': 'Inventory Analytics',
  'nav.inventoryDashboard': 'Inventory Dashboard',
  'nav.inventoryTurnoverAbc': 'Turnover & ABC',
  'nav.inventoryStockLevels': 'Stock Levels',
  'nav.inventoryRisk': 'Risk & Dead Stock',
  'nav.profitability': 'Profitability',
  'nav.profitabilityDashboard': 'Profitability Dashboard',
  'nav.profitabilityProducts': 'Products',
  'nav.profitabilityCustomers': 'Customers',
  'nav.profitabilityCategories': 'Categories',
  'nav.profitabilityTrends': 'Trends',
  'nav.profitabilitySellers': 'Sellers',
  // F7 — Accounts Receivable (4 group leaves; detail/profile stay off-sidebar).
  'nav.receivablesGroup': 'Accounts Receivable',
  'nav.receivablesDashboard': 'Portfolio summary',
  'nav.receivablesList': 'Account list',
  'nav.receivablesOverdue': 'Overdue accounts',
  'nav.receivablesAging': 'Aging report',
  // F8 — Accounts Payable (4 leaves; detail and supplier stay off-sidebar).
  'nav.payablesGroup': 'Accounts Payable',
  'nav.payablesDashboard': 'AP summary',
  'nav.payablesInvoices': 'Invoices payable',
  'nav.payablesCashFlow': 'Cash flow projection',
  'nav.payablesAging': 'Aging report',
  'nav.financeSummary': 'Financial summary',
  // F9 — Financial Reports (4 leaves; SIFEN stays in its Core group).
  'nav.financialReportsGroup': 'Financial Reports',
  'nav.financePnl': 'Income Statement',
  'nav.financeCashFlow': 'Cash flow',
  'nav.financeTax': 'VAT management',
  'nav.financeLegalBooks': 'Legal books',
  // F10 — Audit (2 leaves; event detail and user profile are not in the sidebar).
  'nav.auditGroup': 'Audit',
  'nav.auditDashboard': 'Audit dashboard',
  'nav.auditLogs': 'Event log',
  // F11 — Pronósticos (5 hojas; todas con analytics:read).
  'nav.forecastGroup': 'Forecasting',
  'nav.forecastDashboard': 'Forecast summary',
  'nav.forecastInventory': 'Inventory health',
  'nav.forecastSales': 'Sales forecast',
  'nav.forecastDemand': 'Demand forecast',
  'nav.forecastRevenue': 'Revenue forecast',

  'nav.collapseSidebar': 'Collapse menu',
  'nav.expandSidebar': 'Expand menu',
  'nav.openMenu': 'Open menu',
  'nav.globalSearchPlaceholder': 'Search pages or commands ({shortcut})...',
  'nav.profile': 'Profile',
  'nav.viewProfile': 'View profile',

  // Branch switcher (header)
  'branches.active': 'Active Branch',
  'branches.all': 'All Branches',
  'branches.select': 'Select Branch',
  'branches.withId': 'Branch {{id}}',
  'branches.pointOfSale': 'Point of Sale',
  'branches.typeHeadquarters': 'Headquarters',
  'branches.typeWarehouse': 'Warehouse',
  'branches.typeDistributionCenter': 'Distribution Center',
  'branches.operations': 'Operations Branch',
  'branches.globalNotice': 'The change affects all modules',
}
