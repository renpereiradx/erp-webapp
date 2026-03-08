/**
 * Mocks para el módulo de rentabilidad basados en la documentación de la API.
 */

export const profitabilityMocks = {
  // GET /profitability/overview
  overview: {
    generated_at: "2026-03-08T10:30:00Z",
    period: { start_date: "2026-03-01", end_date: "2026-03-31" },
    summary: {
      total_revenue: 500000000,
      total_cost: 350000000,
      gross_profit: 150000000,
      operating_expenses: 50000000,
      operating_profit: 100000000,
      net_profit: 100000000,
      total_transactions: 1500,
      total_units_sold: 5000,
      average_ticket: 333333,
      profit_per_unit: 30000
    },
    margins: {
      gross_margin_pct: 30.0,
      operating_margin_pct: 20.0,
      net_margin_pct: 20.0,
      average_markup: 42.86,
      roi: 42.86,
      contribution_margin: 150000000
    },
    comparison: {
      previous_period: { start_date: "2026-02-01", end_date: "2026-02-28" },
      revenue_change: 25000000,
      revenue_change_pct: 5.26,
      gross_profit_change: 15000000,
      gross_profit_change_pct: 11.11,
      net_profit_change: 10000000,
      net_profit_change_pct: 11.11,
      margin_change: 1.5
    }
  },

  // GET /profitability/products
  products: {
    summary: {
      total_products: 150,
      profitable_products: 130,
      unprofitable_products: 20,
      average_margin: 28.5,
      total_profit: 150000000,
      total_revenue: 500000000
    },
    products: [
      {
        product_id: "123",
        product_name: "Producto Premium A",
        sku: "SKU-001",
        category_name: "Electrónica",
        units_sold: 150,
        revenue: 15000000,
        cost: 9000000,
        gross_profit: 6000000,
        gross_margin_pct: 40.0,
        markup: 66.67,
        performance: "EXCELLENT"
      },
      {
        product_id: "124",
        product_name: "Accesorio B",
        sku: "SKU-002",
        category_name: "Accesorios",
        units_sold: 300,
        revenue: 3000000,
        cost: 2500000,
        gross_profit: 500000,
        gross_margin_pct: 16.67,
        markup: 20.0,
        performance: "AVERAGE"
      }
    ],
    pagination: { page: 1, page_size: 20, total_items: 150, total_pages: 8 }
  },

  // GET /profitability/customers
  customers: {
    summary: {
      total_customers: 500,
      active_customers: 350,
      profitable_customers: 480,
      average_customer_value: 300000,
      total_profit: 150000000,
      top_customers_pct: 80.0
    },
    customers: [
      {
        customer_id: "456",
        customer_name: "Corporación XYZ",
        customer_type: "MAYORISTA",
        total_purchases: 25,
        total_revenue: 50000000,
        total_cost: 35000000,
        gross_profit: 15000000,
        gross_margin_pct: 30.0,
        segment: "PLATINUM",
        rank: 1
      }
    ]
  },

  // GET /profitability/categories
  categories: {
    summary: {
      total_categories: 15,
      most_profitable_name: "Electrónica",
      least_profitable_name: "Papelería",
      average_margin: 25.5,
      total_profit: 150000000
    },
    categories: [
      {
        category_id: "1",
        category_name: "Electrónica",
        product_count: 50,
        units_sold: 1200,
        revenue: 180000000,
        gross_profit: 72000000,
        gross_margin_pct: 40.0,
        performance: "EXCELLENT"
      }
    ]
  },

  // GET /profitability/trends
  trends: {
    granularity: "daily",
    data_points: [
      { label: "01 Mar", revenue: 15000000, cost: 9000000, gross_profit: 6000000 },
      { label: "02 Mar", revenue: 12000000, cost: 8000000, gross_profit: 4000000 },
      { label: "03 Mar", revenue: 18000000, cost: 10000000, gross_profit: 8000000 }
    ],
    summary: {
      trend_direction: "UP",
      growth_rate: 15.5,
      average_margin: 30.0
    }
  },

  // GET /profitability/sellers
  sellers: {
    summary: { total_sellers: 10, top_seller_name: "Juan Pérez" },
    sellers: [
      {
        seller_name: "Juan Pérez",
        total_sales: 150,
        total_revenue: 75000000,
        gross_profit: 30000000,
        gross_margin_pct: 40.0,
        rank: 1
      }
    ]
  },

  // GET /profitability/dashboard (Consolidado)
  dashboard: {
    kpis: {
      total_revenue: 500000000,
      total_profit: 150000000,
      gross_margin_pct: 30.0,
      net_margin_pct: 20.0,
      roi: 42.86,
      profit_per_transaction: 100000,
      revenue_growth: 5.26,
      profit_growth: 11.11
    },
    break_even_status: {
      has_reached_break_even: true,
      performance_status: "ABOVE_BREAK_EVEN"
    },
    alerts: [
      { type: "PROFIT_GROWTH", severity: "LOW", message: "Excelente crecimiento de beneficios: +11.11%" }
    ]
  }
};
