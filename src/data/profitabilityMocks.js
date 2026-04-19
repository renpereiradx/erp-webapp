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
      average_margin: 28.54445,
      total_profit: 150000000,
      total_revenue: 500000000,
      total_products_growth: 2.5,
      margin_growth: -1.2,
      profit_growth: 8.4
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
        gross_margin_pct: 16.66667,
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
      inactive_risk_customers: 12,
      average_customer_value: 300000,
      total_profit: 150000000,
      top_customers_pct: 80.4552,
      active_customers_growth: 5.2,
      avg_value_growth: 1.8,
      top_customers_variation: -0.5
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
      most_profitable_value: 72000000.45,
      most_profitable_growth: 12.5,
      least_profitable_name: "Papelería",
      least_profitable_margin: 8.445,
      average_margin: 25.5,
      total_profit: 150000000,
      total_profit_growth: 6.8
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
        revenue_contribution_pct: 36.0,
        performance: "EXCELLENT"
      },
      {
        category_id: "2",
        category_name: "Hogar",
        product_count: 85,
        units_sold: 2100,
        revenue: 120000000,
        gross_profit: 36000000,
        gross_margin_pct: 30.0,
        revenue_contribution_pct: 24.0,
        performance: "GOOD"
      },
      {
        category_id: "3",
        category_name: "Deportes",
        product_count: 42,
        units_sold: 850,
        revenue: 95000000,
        gross_profit: 19000000,
        gross_margin_pct: 20.0,
        revenue_contribution_pct: 19.0,
        performance: "AVERAGE"
      },
      {
        category_id: "4",
        category_name: "Papelería",
        product_count: 120,
        units_sold: 5000,
        revenue: 105000000,
        gross_profit: 8872500,
        gross_margin_pct: 8.45,
        revenue_contribution_pct: 21.0,
        performance: "POOR"
      }
    ]
  },

  // GET /profitability/sellers
  sellers: {
    summary: { 
      total_sellers: 10, 
      top_seller_name: "Juan Pérez",
      average_profit_per_seller: 15450000.75,
      profit_growth: 5.2,
      average_operating_margin: 32.445,
      margin_objective: 30.0
    },
    sellers: [
      {
        seller_name: "Juan Pérez",
        total_sales: 150,
        total_revenue: 75000000,
        gross_profit: 30000000.45,
        gross_margin_pct: 40.0,
        rank: 1
      },
      {
        seller_name: "María García",
        total_sales: 120,
        total_revenue: 60000000,
        gross_profit: 18000000.22,
        gross_margin_pct: 30.0,
        rank: 2
      },
      {
        seller_name: "Carlos López",
        total_sales: 95,
        total_revenue: 45000000,
        gross_profit: 9000000.11,
        gross_margin_pct: 20.0,
        rank: 3
      }
    ],
    contribution_share: [
      { label: "Juan Pérez", pct: 32 },
      { label: "María García", pct: 27 },
      { label: "Carlos López", pct: 23 },
      { label: "Otros", pct: 18 }
    ]
  },

  // GET /profitability/trends
  trends: {
    granularity: "daily",
    summary: {
      trend_direction: "UP",
      growth_rate: 15.545,
      previous_growth_rate: 11.3,
      peak_profit_date: "03 Marzo",
      peak_profit_value: 8000000.45,
      total_period_revenue: 450000000,
      average_gross_margin: 32.44,
      average_net_margin: 18.256,
      insights: [
        { type: "EFFICIENCY", title: "Eficiencia Operativa", message: "Incremento del 12% en rentabilidad por optimización logística." },
        { type: "WARNING", title: "Alerta de Margen", message: "Se detectó erosión del 2.4% en el segmento tecnológico." }
      ]
    },
    data_points: [
      { label: "01 Mar", revenue: 15000000, cost: 9000000, gross_profit: 6000000 },
      { label: "02 Mar", revenue: 12000000, cost: 8000000, gross_profit: 4000000 },
      { label: "03 Mar", revenue: 18000000, cost: 10000000, gross_profit: 8000000 },
      { label: "04 Mar", revenue: 14000000, cost: 9500000, gross_profit: 4500000 },
      { label: "05 Mar", revenue: 16000000, cost: 10000000, gross_profit: 6000000 }
    ]
  },

  // GET /profitability/dashboard (Consolidado)
  dashboard: {
    kpis: {
      total_revenue: 500000000,
      total_profit: 150000000,
      gross_margin_pct: 30.0,
      net_margin_pct: 20.0,
      roi: 42.864445,
      profit_per_transaction: 100000,
      revenue_growth: 5.26,
      profit_growth: 11.11,
      gross_margin_growth: 1.5,
      net_margin_growth: 0.5,
      roi_growth: 3.1,
      profit_per_tx_growth: 0.0
    },
    efficiency_trend: {
      data_points: [
        { label: "ENE", performance: 60, profit_pct: 24 },
        { label: "FEB", performance: 75, profit_pct: 30 },
        { label: "MAR", performance: 65, profit_pct: 26 },
        { label: "ABR", performance: 85, profit_pct: 34 },
        { label: "MAY", performance: 90, profit_pct: 36 },
        { label: "JUN", performance: 70, profit_pct: 28 },
        { label: "JUL", performance: 80, profit_pct: 32 },
        { label: "AGO", performance: 95, profit_pct: 38 }
      ]
    },
    break_even_status: {
      has_reached_break_even: true,
      performance_status: "ABOVE_BREAK_EVEN",
      coverage_required: 18.256,
      current_progress: 82.5
    },
    alerts: [
      { 
        type: "PROFIT_GROWTH", 
        severity: "LOW", 
        message: "Excelente crecimiento de beneficios: +11.11%",
        time_ago: "Hace 10 min"
      }
    ]
  }
};
