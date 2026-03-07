/**
 * Mock data for Sales Analytics matching the API documentation
 */

export const MOCK_DASHBOARD = {
  success: true,
  data: {
    generated_at: "2026-03-07T10:00:00Z",
    period: {
      start_date: "2026-03-01T00:00:00Z",
      end_date: "2026-03-31T23:59:59Z"
    },
    kpis: {
      total_sales: 15000000,
      sales_growth_pct: 15.4,
      total_transactions: 450,
      transactions_growth_pct: 12.5,
      average_ticket: 33333.33,
      ticket_growth_pct: 2.5,
      gross_margin_pct: 30.0,
      margin_growth_pct: 0.5,
      unique_customers: 180,
      customers_growth_pct: 9.1,
      sales_per_employee: 3000000
    },
    trends: [
      { timestamp: "2026-03-01T00:00:00Z", label: "01 Mar", sales: 500000, transactions: 15, units: 45, average_ticket: 33333.33 },
      { timestamp: "2026-03-02T00:00:00Z", label: "02 Mar", sales: 450000, transactions: 12, units: 38, average_ticket: 37500.00 },
      { timestamp: "2026-03-03T00:00:00Z", label: "03 Mar", sales: 600000, transactions: 18, units: 52, average_ticket: 33333.33 },
      { timestamp: "2026-03-04T00:00:00Z", label: "04 Mar", sales: 550000, transactions: 16, units: 48, average_ticket: 34375.00 },
      { timestamp: "2026-03-05T00:00:00Z", label: "05 Mar", sales: 700000, transactions: 20, units: 60, average_ticket: 35000.00 },
      { timestamp: "2026-03-06T00:00:00Z", label: "06 Mar", sales: 850000, transactions: 25, units: 75, average_ticket: 34000.00 },
      { timestamp: "2026-03-07T00:00:00Z", label: "07 Mar", sales: 950000, transactions: 28, units: 84, average_ticket: 33928.57 }
    ],
    top_products: [
      { product_id: "1", product_name: "Smartphone XYZ", sales: 1200000, units_sold: 24 },
      { product_id: "2", product_name: "Laptop Pro 15", sales: 950000, units_sold: 10 },
      { product_id: "3", product_name: "Wireless Earbuds", sales: 450000, units_sold: 45 }
    ],
    top_categories: [
      { category_name: "Electrónicos", sales: 5000000, percentage: 33.3 },
      { category_name: "Computación", sales: 3500000, percentage: 23.3 },
      { category_name: "Accesorios", sales: 2500000, percentage: 16.7 }
    ],
    payment_mix: [
      { method: "cash", display_name: "Efectivo", sales: 8000000, percentage: 53.3 },
      { method: "credit_card", display_name: "Tarjeta de Crédito", sales: 4500000, percentage: 30.0 },
      { method: "debit_card", display_name: "Tarjeta de Débito", sales: 2500000, percentage: 16.7 }
    ],
    alerts: [
      { type: "POSITIVE", category: "SALES", message: "Las ventas aumentaron un 15.4% respecto al período anterior", value: 15.4, severity: "HIGH" },
      { type: "WARNING", category: "PRODUCT", message: "Stock bajo en 5 productos del Top 10", value: 5, severity: "MEDIUM" }
    ]
  }
};

export const MOCK_BY_CATEGORY = {
  success: true,
  data: {
    categories: [
      {
        category_id: "1",
        category_name: "Electrónicos",
        sales: 5000000,
        percentage: 33.3,
        transactions: 150,
        units_sold: 200,
        average_price: 25000,
        gross_margin: 1500000,
        gross_margin_pct: 30.0,
        growth_pct: 10.5,
        top_product: "Smartphone XYZ"
      },
      {
        category_id: "2",
        category_name: "Computación",
        sales: 3500000,
        percentage: 23.3,
        transactions: 80,
        units_sold: 120,
        average_price: 29166,
        gross_margin: 875000,
        gross_margin_pct: 25.0,
        growth_pct: 8.2,
        top_product: "Laptop Pro 15"
      },
      {
        category_id: "3",
        category_name: "Hogar",
        sales: 2500000,
        percentage: 16.7,
        transactions: 120,
        units_sold: 300,
        average_price: 8333,
        gross_margin: 1000000,
        gross_margin_pct: 40.0,
        growth_pct: -2.5,
        top_product: "Cafetera Express"
      }
    ],
    total_sales: 15000000
  }
};

export const MOCK_BY_CUSTOMER = {
  success: true,
  data: {
    customers: [
      { customer_id: "1", customer_name: "Juan Pérez", customer_ruc: "1234567-8", total_purchases: 2500000, transaction_count: 12, segment: "PREMIUM", frequency: "REGULAR", last_purchase: "2026-03-05T14:00:00Z" },
      { customer_id: "2", customer_name: "Corporación ABC", customer_ruc: "8888888-9", total_purchases: 5000000, transaction_count: 5, segment: "VIP", frequency: "FREQUENT", last_purchase: "2026-03-07T10:00:00Z" },
      { customer_id: "3", customer_name: "María López", customer_ruc: "4444444-4", total_purchases: 150000, transaction_count: 2, segment: "STANDARD", frequency: "OCCASIONAL", last_purchase: "2026-02-15T11:00:00Z" }
    ],
    summary: {
      total_customers: 180,
      new_customers: 25,
      returning_customers: 155,
      average_lifetime_value: 850000,
      customer_retention_rate: 86.1
    }
  }
};

export const MOCK_BY_SELLER = {
  success: true,
  data: {
    sellers: [
      { seller_id: "1", seller_name: "María García", total_sales: 3500000, transaction_count: 85, units_sold: 220, target_progress: 87.5, rank: 1, conversion_rate: 15.2 },
      { seller_id: "2", seller_name: "Carlos Ruiz", total_sales: 2800000, transaction_count: 70, units_sold: 180, target_progress: 70.0, rank: 2, conversion_rate: 12.5 },
      { seller_id: "3", seller_name: "Ana Belén", total_sales: 2100000, transaction_count: 60, units_sold: 150, target_progress: 52.5, rank: 3, conversion_rate: 10.8 }
    ]
  }
};

export const MOCK_VELOCITY = {
  success: true,
  data: {
    overall: {
      sales_per_day: 500000,
      sales_per_hour: 20833.33,
      transactions_per_day: 15,
      units_per_day: 40,
      avg_minutes_between_sales: 96
    },
    by_product: [
      { product_id: "1", product_name: "Smartphone XYZ", units_per_day: 2.5, current_stock: 50, days_to_sellout: 20, velocity: "FAST" },
      { product_id: "2", product_name: "Laptop Pro 15", units_per_day: 0.5, current_stock: 15, days_to_sellout: 30, velocity: "MEDIUM" }
    ]
  }
};

export const MOCK_COMPARE = {
  success: true,
  data: {
    period_1: { total_sales: 15000000, total_transactions: 450, total_units: 1200, average_ticket: 33333.33, unique_customers: 180, gross_margin: 4500000 },
    period_2: { total_sales: 13000000, total_transactions: 400, total_units: 1050, average_ticket: 32500.00, unique_customers: 165, gross_margin: 3900000 },
    differences: {
      sales_change: 2000000, sales_change_pct: 15.38,
      transactions_change: 50, transactions_change_pct: 12.5,
      units_change: 150, units_change_pct: 14.29,
      ticket_change: 833.33, ticket_change_pct: 2.56,
      customers_change: 15, customers_change_pct: 9.09,
      margin_change: 600000, margin_change_pct: 15.38
    }
  }
};

export const MOCK_HEATMAP = {
  success: true,
  data: {
    period: {
      start_date: "2026-03-01T00:00:00Z",
      end_date: "2026-03-31T23:59:59Z"
    },
    data: Array.from({ length: 7 }, () => 
      Array.from({ length: 24 }, () => Math.floor(Math.random() * 1000000))
    ),
    labels: {
      days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
      hours: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
    },
    summary: {
      peak_day: "Sábado",
      peak_hour: 12,
      peak_value: 450000,
      quiet_day: "Domingo",
      quiet_hour: 5,
      quiet_value: 0
    }
  }
};

export const MOCK_BY_PRODUCT = {
  success: true,
  data: {
    period: {
      start_date: "2026-03-01T00:00:00Z",
      end_date: "2026-03-31T23:59:59Z"
    },
    products: [
      { product_id: "1", product_name: "Smartphone XYZ", sku: "PHONE-001", category_name: "Electrónicos", sales: 1200000, units_sold: 24, average_price: 50000, cost: 840000, gross_profit: 360000, gross_margin_pct: 30.0, transactions: 20, rank: 1, growth_pct: 8.5 },
      { product_id: "2", product_name: "Laptop Pro 15", sku: "COMP-001", category_name: "Computación", sales: 950000, units_sold: 10, average_price: 95000, cost: 712500, gross_profit: 237500, gross_margin_pct: 25.0, transactions: 8, rank: 2, growth_pct: 12.2 },
      { product_id: "3", product_name: "Wireless Earbuds", sku: "ACC-001", category_name: "Accesorios", sales: 450000, units_sold: 45, average_price: 10000, cost: 315000, gross_profit: 135000, gross_margin_pct: 30.0, transactions: 35, rank: 3, growth_pct: -2.4 },
      { product_id: "4", product_name: "Monitor 4K", sku: "COMP-002", category_name: "Computación", sales: 800000, units_sold: 4, average_price: 200000, cost: 600000, gross_profit: 200000, gross_margin_pct: 25.0, transactions: 4, rank: 4, growth_pct: 5.1 },
      { product_id: "5", product_name: "Smartwatch Elite", sku: "PHONE-002", category_name: "Electrónicos", sales: 600000, units_sold: 12, average_price: 50000, cost: 420000, gross_profit: 180000, gross_margin_pct: 30.0, transactions: 10, rank: 5, growth_pct: 15.8 }
    ],
    pagination: {
      page: 1,
      page_size: 10,
      total_items: 5,
      total_pages: 1
    }
  }
};

export const MOCK_TRENDS_DAILY = {
  success: true,
  data: {
    period: { start_date: "2026-03-01T00:00:00Z", end_date: "2026-03-31T23:59:59Z" },
    granularity: "daily",
    data_points: [
      { timestamp: "2026-03-01T00:00:00Z", label: "01 Mar", sales: 500000, transactions: 15, units: 45 },
      { timestamp: "2026-03-02T00:00:00Z", label: "02 Mar", sales: 450000, transactions: 12, units: 38 },
      { timestamp: "2026-03-03T00:00:00Z", label: "03 Mar", sales: 600000, transactions: 18, units: 52 },
      { timestamp: "2026-03-04T00:00:00Z", label: "04 Mar", sales: 550000, transactions: 16, units: 48 },
      { timestamp: "2026-03-05T00:00:00Z", label: "05 Mar", sales: 700000, transactions: 20, units: 60 },
      { timestamp: "2026-03-06T00:00:00Z", label: "06 Mar", sales: 850000, transactions: 25, units: 75 },
      { timestamp: "2026-03-07T00:00:00Z", label: "07 Mar", sales: 950000, transactions: 28, units: 84 }
    ]
  }
};

export const MOCK_TRENDS_HOURLY = {
  success: true,
  data: {
    period: { start_date: "2026-03-07T00:00:00Z", end_date: "2026-03-07T23:59:59Z" },
    granularity: "hourly",
    data_points: [
      { label: "00:00", sales: 5000 },
      { label: "04:00", sales: 2000 },
      { label: "08:00", sales: 15000 },
      { label: "12:00", sales: 45000 },
      { label: "14:00", sales: 65000 },
      { label: "16:00", sales: 55000 },
      { label: "20:00", sales: 30000 },
      { label: "23:59", sales: 10000 }
    ]
  }
};

export const MOCK_PAYMENT_METHODS = {
  success: true,
  data: {
    period: { start_date: "2026-03-01T00:00:00Z", end_date: "2026-03-31T23:59:59Z" },
    payment_methods: [
      { method: "cash", display_name: "Efectivo", sales: 8000000, percentage: 53.3, transaction_count: 280, average_ticket: 28571.43, growth_pct: 5.2 },
      { method: "credit_card", display_name: "Tarjeta de Crédito", sales: 4500000, percentage: 30.0, transaction_count: 100, average_ticket: 45000, growth_pct: 12.8 },
      { method: "debit_card", display_name: "Tarjeta de Débito", sales: 2500000, percentage: 16.7, transaction_count: 70, average_ticket: 35714.29, growth_pct: -2.1 }
    ],
    total_sales: 15000000
  }
};

export const MOCK_PERFORMANCE = {
  success: true,
  data: {
    period: { start_date: "2026-03-01T00:00:00Z", end_date: "2026-03-31T23:59:59Z" },
    total_sales: 15000000,
    total_transactions: 450,
    average_ticket: 33333.33,
    total_units: 1200,
    unique_customers: 180,
    gross_margin: 4500000,
    gross_margin_pct: 30.0,
    returns: { total_returns: 150000, return_count: 5, return_rate: 1.0 },
    comparison: {
      sales_change: 2000000,
      sales_change_pct: 15.4,
      transactions_change: 50,
      transactions_change_pct: 12.5,
      ticket_change: 1500,
      ticket_change_pct: 4.7
    }
  }
};
