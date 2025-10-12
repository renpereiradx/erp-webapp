/**
 * Mock data for Sales - Modular and configurable
 * Separated from main demoData.js for better organization
 */

// Sales data factory
export const createSalesData = (options = {}) => {
  const {
    count = 10,
    dateRange = { days: 30 }, // Last 30 days
    clientIds = [201, 202, 203, 204, 205],
    productIds = ['PROD_001', 'PROD_002', 'SERV_001', 'SERV_002'],
    seed = 1000
  } = options;

  const sales = [];
  const statusOptions = ['completed', 'pending', 'cancelled'];
  const paymentMethods = ['cash', 'card', 'transfer'];

  for (let i = 0; i < count; i++) {
    const id = seed + i;
    const daysAgo = Math.floor(Math.random() * dateRange.days);
    const saleDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    // Generate items for this sale
    const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
    const items = [];
    let totalAmount = 0;

    for (let j = 0; j < itemCount; j++) {
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = Math.floor(Math.random() * 500) + 100; // 100-600
      const subtotal = quantity * unitPrice;
      
      items.push({
        id: `${id}_${j}`,
        order_id: `ORD_${id}`,
        product_id: productId,
        product_name: `Product ${productId}`,
        quantity,
        base_price: unitPrice,
        unit_price: unitPrice,
        subtotal,
        tax_amount: subtotal * 0.16,
        total_with_tax: subtotal * 1.16,
        price_modified: false,
        reserve_id: null,
        tax_rate_id: 1,
        tax_rate: 0.16
      });
      
      totalAmount += subtotal * 1.16;
    }

    sales.push({
      id,
      order_id: `ORD_${id}`,
      client_id: clientIds[Math.floor(Math.random() * clientIds.length)],
      client_name: `Cliente ${Math.floor(Math.random() * 100) + 1}`,
      sale_date: saleDate.toISOString(),
      total_amount: Math.round(totalAmount * 100) / 100,
      subtotal_amount: Math.round(totalAmount / 1.16 * 100) / 100,
      tax_amount: Math.round((totalAmount - totalAmount / 1.16) * 100) / 100,
      status,
      user_id: 'USR_001',
      user_name: 'Usuario Demo',
      payment_method_id: Math.floor(Math.random() * 3) + 1,
      payment_method: paymentMethod,
      currency_id: 1,
      currency: 'MXN',
      session_id: `sess_${Date.now()}_${i}`,
      notes: Math.random() > 0.7 ? 'Venta con descuento especial' : null,
      created_at: saleDate.toISOString(),
      updated_at: saleDate.toISOString(),
      details: items
    });
  }

  return sales;
};

// Sale items factory
export const createSaleItemsData = (salesData) => {
  const items = [];
  
  salesData.forEach(sale => {
    if (sale.details) {
      items.push(...sale.details);
    }
  });
  
  return items;
};

// Configuration
export const SALES_CONFIG = {
  enabled: true,
  useRealAPI: false,
  simulateDelay: true,
  delayMs: 600,
  pageSize: 20,
  statuses: ['completed', 'pending', 'cancelled', 'refunded'],
  paymentMethods: ['cash', 'card', 'transfer']
};

// Generate demo data
const generatedSales = createSalesData({ count: 15 });

export const DEMO_SALES_DATA = generatedSales;
export const DEMO_SALE_ITEMS_DATA = createSaleItemsData(generatedSales);
