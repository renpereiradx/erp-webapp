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
  // F3 — relational drill-downs (BI pack Sales/Purchases groups).
  'nav.salesAnalytics': 'Sales Analytics',
  'nav.purchaseAnalytics': 'Purchase Analytics',
  'nav.relationalBuyers': 'Buyers by Product',
  'nav.relationalCustomerTop': 'Products by Customer',
  'nav.relationalSupplierTop': 'Supplied Products',
  'nav.relationalProductSuppliers': 'Compare Suppliers',
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
  'branches.globalAccess': 'Administrative Access (No Filter)',
  'branches.withId': 'Branch {{id}}',
  'branches.pointOfSale': 'Point of Sale',
  'branches.location': 'Location',
  'branches.operations': 'Operations Branch',
  'branches.globalNotice': 'The change affects all modules',
}
