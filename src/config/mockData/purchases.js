/**
 * Modular Mock Data for Purchases
 * Factory-generated purchase orders and related data
 * No hardcoded values - all configurable
 */

// Purchase-specific configuration
export const PURCHASES_CONFIG = {
  enabled: true,
  delayMs: 600,
  pageSize: 10,
  retryAttempts: 3,
  cacheTimeout: 300000, // 5 minutes
  
  generation: {
    ordersCount: 25,
    itemsPerOrderRange: [1, 8],
    priceRange: [10, 500],
    taxRate: 0.16 // IVA 16%
  }
};

// Purchase order statuses
export const PURCHASE_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED', 
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED'
};

export const PURCHASE_STATUS_LABELS = {
  [PURCHASE_STATUSES.PENDING]: 'Pendiente',
  [PURCHASE_STATUSES.CONFIRMED]: 'Confirmada',
  [PURCHASE_STATUSES.RECEIVED]: 'Recibida',
  [PURCHASE_STATUSES.CANCELLED]: 'Cancelada',
  [PURCHASE_STATUSES.PARTIALLY_RECEIVED]: 'Parcialmente Recibida'
};

// Tax rates configuration
export const TAX_RATES = {
  DEFAULT: { id: null, rate: 0, name: 'Sin impuesto' },
  IVA_16: { id: 1, rate: 0.16, name: 'IVA 16%' },
  IVA_8: { id: 2, rate: 0.08, name: 'IVA 8%' },
  EXENTO: { id: 3, rate: 0, name: 'Exento' }
};

// Suppliers data
const DEMO_SUPPLIERS = [
  { id: 1, name: 'Distribuidora Médica Central', contact: 'Carlos Mendez', phone: '+52-55-1234-5678' },
  { id: 2, name: 'Equipos Tecnológicos del Norte', contact: 'Ana García', phone: '+52-81-8765-4321' },
  { id: 3, name: 'Alimentos Orgánicos Premium', contact: 'Luis Rodríguez', phone: '+52-33-2468-1357' },
  { id: 4, name: 'Suministros de Oficina Global', contact: 'María Fernández', phone: '+52-55-9876-5432' },
  { id: 5, name: 'Importadora de Electrónicos', contact: 'José Torres', phone: '+52-81-1357-2468' }
];

// Products for purchase orders
const DEMO_PURCHASE_PRODUCTS = [
  { id: 'PROD_001', name: 'Laptop Dell Inspiron 15', category: 'electronics', basePrice: 15000 },
  { id: 'PROD_002', name: 'Mouse Inalámbrico Logitech', category: 'electronics', basePrice: 450 },
  { id: 'PROD_003', name: 'Café Orgánico Premium 1kg', category: 'food', basePrice: 280 },
  { id: 'PROD_004', name: 'Papel Bond Tamaño Carta', category: 'office', basePrice: 120 },
  { id: 'PROD_005', name: 'Monitor Samsung 24"', category: 'electronics', basePrice: 3500 },
  { id: 'PROD_006', name: 'Sillas Ergonómicas', category: 'office', basePrice: 2800 },
  { id: 'PROD_007', name: 'Impresora HP LaserJet', category: 'electronics', basePrice: 4200 },
  { id: 'PROD_008', name: 'Té Verde Matcha Premium', category: 'food', basePrice: 350 }
];

// Factory function to create purchase order data
export const createPurchaseOrdersData = (options = {}) => {
  const {
    count = PURCHASES_CONFIG.generation.ordersCount,
    seed = 1000,
    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    endDate = new Date()
  } = options;

  // Seeded random function for consistent data
  let seedValue = seed;
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };

  const orders = [];
  const statuses = Object.values(PURCHASE_STATUSES);

  for (let i = 0; i < count; i++) {
    const supplier = DEMO_SUPPLIERS[Math.floor(seededRandom() * DEMO_SUPPLIERS.length)];
    const orderDate = new Date(startDate.getTime() + seededRandom() * (endDate.getTime() - startDate.getTime()));
    const status = statuses[Math.floor(seededRandom() * statuses.length)];
    
    // Generate delivery date (7-30 days from order)
    const deliveryDays = Math.floor(seededRandom() * 23) + 7; // 7-30 days
    const expectedDelivery = new Date(orderDate.getTime() + deliveryDays * 24 * 60 * 60 * 1000);

    // Generate items for this order
    const itemsCount = Math.floor(seededRandom() * PURCHASES_CONFIG.generation.itemsPerOrderRange[1]) + PURCHASES_CONFIG.generation.itemsPerOrderRange[0];
    const items = [];
    let subtotalAmount = 0;

    for (let j = 0; j < itemsCount; j++) {
      const product = DEMO_PURCHASE_PRODUCTS[Math.floor(seededRandom() * DEMO_PURCHASE_PRODUCTS.length)];
      const quantity = Math.floor(seededRandom() * 10) + 1; // 1-10
      const unitPrice = product.basePrice + (seededRandom() - 0.5) * product.basePrice * 0.3; // ±30% variation
      const totalPrice = quantity * unitPrice;
      
      items.push({
        id: `ITEM_${i + 1}_${j + 1}`,
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: Number(unitPrice.toFixed(2)),
        total_price: Number(totalPrice.toFixed(2)),
        tax_rate_id: 1, // IVA 16%
        exp_date: null
      });
      
      subtotalAmount += totalPrice;
    }

    const taxAmount = subtotalAmount * PURCHASES_CONFIG.generation.taxRate;
    const totalAmount = subtotalAmount + taxAmount;

    orders.push({
      id: i + 1,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_contact: supplier.contact,
      supplier_phone: supplier.phone,
      order_date: orderDate.toISOString().split('T')[0],
      expected_delivery: expectedDelivery.toISOString().split('T')[0],
      status,
      subtotal_amount: Number(subtotalAmount.toFixed(2)),
      tax_amount: Number(taxAmount.toFixed(2)),
      total_amount: Number(totalAmount.toFixed(2)),
      items_count: itemsCount,
      notes: seededRandom() > 0.7 ? `Orden especial #${i + 1} - Entrega prioritaria` : '',
      created_at: orderDate.toISOString(),
      updated_at: orderDate.toISOString(),
      items
    });
  }

  return orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
};

// Factory function for tax rates
export const createTaxRatesData = () => {
  return Object.values(TAX_RATES);
};

// Generated data using factory
export const DEMO_PURCHASE_ORDERS_DATA = createPurchaseOrdersData();
export const DEMO_TAX_RATES_DATA = createTaxRatesData();

// Service functions for mock data operations
export const getDemoPurchaseOrders = async (params = {}) => {
  const {
    page = 1,
    pageSize = PURCHASES_CONFIG.pageSize,
    supplier_id = '',
    status = '',
    search = ''
  } = params;

  let filteredOrders = [...DEMO_PURCHASE_ORDERS_DATA];

  // Apply filters
  if (supplier_id) {
    filteredOrders = filteredOrders.filter(order => 
      order.supplier_id === parseInt(supplier_id)
    );
  }

  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredOrders = filteredOrders.filter(order =>
      order.supplier_name.toLowerCase().includes(searchLower) ||
      order.id.toString().includes(searchLower) ||
      order.notes.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  return {
    success: true,
    data: paginatedOrders,
    pagination: {
      total: filteredOrders.length,
      totalPages,
      currentPage: page,
      pageSize,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    },
    source: 'mock'
  };
};

export const createDemoPurchaseOrder = async (orderData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, PURCHASES_CONFIG.delayMs));

  const newId = Math.max(...DEMO_PURCHASE_ORDERS_DATA.map(o => o.id)) + 1;
  const supplier = DEMO_SUPPLIERS.find(s => s.id === orderData.supplier_id) || DEMO_SUPPLIERS[0];
  
  const newOrder = {
    id: newId,
    supplier_id: orderData.supplier_id,
    supplier_name: orderData.supplier_name || supplier.name,
    supplier_contact: supplier.contact,
    supplier_phone: supplier.phone,
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery: orderData.expected_delivery,
    status: 'PENDING',
    subtotal_amount: Number((orderData.total_amount / 1.16).toFixed(2)), // Remove tax
    tax_amount: Number((orderData.total_amount * 0.16 / 1.16).toFixed(2)),
    total_amount: orderData.total_amount,
    items_count: orderData.items?.length || 0,
    notes: orderData.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: orderData.items || []
  };

  // Add to demo data (in memory)
  DEMO_PURCHASE_ORDERS_DATA.unshift(newOrder);

  return {
    success: true,
    data: newOrder,
    message: 'Orden de compra creada exitosamente (demo)',
    source: 'mock'
  };
};

export const getDemoTaxRates = async () => {
  await new Promise(resolve => setTimeout(resolve, PURCHASES_CONFIG.delayMs / 2));
  
  return {
    success: true,
    data: DEMO_TAX_RATES_DATA,
    source: 'mock'
  };
};

// Development logging
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  console.log('🛒 Mock Purchase Data loaded:', {
    orders: DEMO_PURCHASE_ORDERS_DATA.length,
    suppliers: DEMO_SUPPLIERS.length,
    taxRates: DEMO_TAX_RATES_DATA.length,
    products: DEMO_PURCHASE_PRODUCTS.length
  });
}