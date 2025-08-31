/**
 * Demo data configuration for development without API
 * Provides realistic data for dashboard and other components
 */

// Client demo data
export const DEMO_CLIENT_DATA = [
  {
    id: 201,
    name: "Empresa ABC Corp",
    contact: {
      email: "contacto@abccorp.com",
      phone: "+52-555-1234"
    },
    address: {
      street: "Av. Insurgentes 1234",
      city: "CDMX",
      country: "México"
    },
    tax_id: "RFC123456789",
    metadata: {
      priority: "high",
      notes: "Cliente premium con descuentos especiales"
    },
    created_at: "2025-08-15T09:30:00Z",
    updated_at: "2025-08-28T14:20:00Z"
  },
  {
    id: 202,
    name: "Tech Solutions SA",
    contact: {
      email: "ventas@techsolutions.mx",
      phone: "+52-555-5678"
    },
    address: {
      street: "Blvd. Manuel Ávila Camacho 456",
      city: "Monterrey",
      country: "México"
    },
    tax_id: "RFC987654321",
    metadata: {
      priority: "medium",
      notes: "Cliente frecuente en productos tecnológicos"
    },
    created_at: "2025-08-10T11:15:00Z",
    updated_at: "2025-08-25T16:45:00Z"
  },
  {
    id: 203,
    name: "Distribuidora Regional Ltda",
    contact: {
      email: "compras@distregional.com",
      phone: "+52-555-9012"
    },
    address: {
      street: "Carretera Nacional Km 25",
      city: "Guadalajara",
      country: "México"
    },
    tax_id: "RFC456789123",
    metadata: {
      priority: "medium",
      notes: "Distribuidor mayorista con pagos a 30 días"
    },
    created_at: "2025-08-05T08:00:00Z",
    updated_at: "2025-08-20T10:30:00Z"
  },
  {
    id: 204,
    name: "Comercial del Norte",
    contact: {
      email: "admin@comercialnorte.mx",
      phone: "+52-555-3456"
    },
    address: {
      street: "Calle Morelos 789",
      city: "Tijuana",
      country: "México"
    },
    tax_id: "RFC789123456",
    metadata: {
      priority: "low",
      notes: "Cliente ocasional"
    },
    created_at: "2025-07-28T13:45:00Z",
    updated_at: "2025-08-18T09:15:00Z"
  },
  {
    id: 205,
    name: "Servicios Empresariales Unidos",
    contact: {
      email: "info@serunidos.com",
      phone: "+52-555-7890"
    },
    address: {
      street: "Av. Chapultepec 321",
      city: "CDMX",
      country: "México"
    },
    tax_id: "RFC321654987",
    metadata: {
      priority: "high",
      notes: "Cliente VIP con contrato anual"
    },
    created_at: "2025-07-20T15:20:00Z",
    updated_at: "2025-08-22T11:00:00Z"
  }
];

export const DEMO_CLIENT_STATISTICS = {
  total_clients: 247,
  active_clients: 235,
  inactive_clients: 12,
  new_clients: 8,
  updated_clients: 15
};

// Dashboard demo data
export const DEMO_DASHBOARD_DATA = {
  clientStats: {
    total: 1247,
    active: 1108,
    inactive: 139,
    new_this_month: 23,
    growth_percentage: 8.5
  },
  
  productStats: {
    total: 1253,
    active: 1184,
    lowStock: 12,
    outOfStock: 4,
    new_this_month: 18,
    top_selling: 45
  },
  
  salesStats: {
    today: 147,
    thisWeek: 892,
    thisMonth: 3567,
    total: 125430,
    trend: 12.5,
    avgOrderValue: 89.50,
    topClient: "Empresa ABC Corp",
    bestProduct: "Producto Premium X"
  }
};

// Chart data for dashboard
export const DEMO_CHART_DATA = {
  salesChart: [
    { name: 'Ene', value: 12000 },
    { name: 'Feb', value: 15000 },
    { name: 'Mar', value: 18000 },
    { name: 'Abr', value: 22000 },
    { name: 'May', value: 19000 },
    { name: 'Jun', value: 25000 },
    { name: 'Jul', value: 28000 },
    { name: 'Ago', value: 24000 },
    { name: 'Sep', value: 31000 },
    { name: 'Oct', value: 29000 },
    { name: 'Nov', value: 35000 },
    { name: 'Dic', value: 40000 }
  ],
  
  categoryChart: [
    { name: 'Electrónicos', value: 35, count: 234 },
    { name: 'Ropa', value: 25, count: 167 },
    { name: 'Hogar', value: 20, count: 134 },
    { name: 'Deportes', value: 15, count: 89 },
    { name: 'Otros', value: 5, count: 45 }
  ],
  
  topProducts: [
    { id: 1, name: 'Laptop Pro X1', sales: 145, revenue: 145000 },
    { id: 2, name: 'Smartphone Z3', sales: 128, revenue: 89600 },
    { id: 3, name: 'Tablet Air 5', sales: 98, revenue: 58800 },
    { id: 4, name: 'Monitor 4K Ultra', sales: 87, revenue: 52200 },
    { id: 5, name: 'Auriculares Pro', sales: 76, revenue: 22800 }
  ],
  
  recentActivity: [
    { id: 1, type: 'sale', description: 'Nueva venta a Empresa XYZ', amount: 2500, time: '10:30' },
    { id: 2, type: 'client', description: 'Cliente registrado: Tech Solutions', amount: null, time: '09:45' },
    { id: 3, type: 'product', description: 'Stock bajo: Laptop Pro X1', amount: null, time: '09:15' },
    { id: 4, type: 'sale', description: 'Venta completada #1247', amount: 890, time: '08:50' },
    { id: 5, type: 'payment', description: 'Pago recibido de ABC Corp', amount: 15000, time: '08:20' }
  ]
};

// Demo configuration
export const DEMO_CONFIG_DASHBOARD = {
  enabled: true, // Enable/disable demo mode
  useRealAPI: false, // Toggle real API calls
  simulateDelay: true, // Simulate network delay
  delayMs: 800, // Delay in milliseconds
  showAPIStatus: true, // Show API status in UI
};

export const DEMO_CONFIG_CLIENTS = {
  enabled: true, // Enable/disable demo mode
  useRealAPI: false, // Toggle real API calls
  simulateDelay: true, // Simulate network delay
  delayMs: 600, // Delay in milliseconds
  pageSize: 10 // Items per page
};

/**
 * Simulate API delay for realism
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise} - Promise that resolves after delay
 */
export const simulateDelay = (ms = DEMO_CONFIG_DASHBOARD.delayMs) => {
  if (!DEMO_CONFIG_DASHBOARD.simulateDelay) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Get demo dashboard data with simulated delay
 * @returns {Promise<Object>} - Demo dashboard data
 */
export const getDemoDashboardData = async () => {
  await simulateDelay();
  
  return {
    success: true,
    data: DEMO_DASHBOARD_DATA,
    charts: DEMO_CHART_DATA,
    timestamp: new Date().toISOString(),
    source: 'demo'
  };
};

/**
 * Get demo client statistics
 * @returns {Promise<Object>} - Demo client stats
 */
export const getDemoClientStats = async () => {
  await simulateDelay(400);
  
  return {
    success: true,
    data: {
      client_statistics: DEMO_DASHBOARD_DATA.clientStats
    },
    source: 'demo'
  };
};

/**
 * Get demo product statistics  
 * @returns {Promise<Object>} - Demo product stats
 */
export const getDemoProductStats = async () => {
  await simulateDelay(600);
  
  return {
    success: true,
    data: {
      product_statistics: DEMO_DASHBOARD_DATA.productStats
    },
    source: 'demo'
  };
};

/**
 * Get demo sales statistics
 * @returns {Promise<Object>} - Demo sales stats
 */
export const getDemoSalesStats = async () => {
  await simulateDelay(500);
  
  return {
    success: true, 
    data: {
      sales_statistics: DEMO_DASHBOARD_DATA.salesStats
    },
    source: 'demo'
  };
};

/**
 * Get demo clients list with pagination and search
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Demo clients data
 */
export const getDemoClients = async (params = {}) => {
  await simulateDelay(DEMO_CONFIG_CLIENTS.delayMs);
  
  const { page = 1, pageSize = DEMO_CONFIG_CLIENTS.pageSize, name = '' } = params;
  
  // Filtrar por nombre si se proporciona
  let filteredClients = DEMO_CLIENT_DATA;
  if (name) {
    filteredClients = DEMO_CLIENT_DATA.filter(client =>
      client.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  // Paginación
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);
  
  return {
    success: true,
    data: {
      clients: paginatedClients,
      total: filteredClients.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    },
    source: 'demo'
  };
};

/**
 * Get demo client statistics
 * @returns {Promise<Object>} - Demo client statistics
 */
export const getDemoClientStatistics = async () => {
  await simulateDelay(400);
  
  return {
    success: true,
    data: {
      client_statistics: DEMO_CLIENT_STATISTICS
    },
    source: 'demo'
  };
};

/**
 * Create demo client
 * @param {Object} clientData - Client data to create
 * @returns {Promise<Object>} - Demo creation result
 */
export const createDemoClient = async (clientData) => {
  await simulateDelay(800);
  
  // Simular validación
  if (!clientData.name || !clientData.contact?.email) {
    throw new Error('Validation failed: name and email are required');
  }
  
  // Simular ID único
  const newId = Math.max(...DEMO_CLIENT_DATA.map(c => c.id)) + 1;
  
  const newClient = {
    id: newId,
    name: clientData.name,
    contact: {
      email: clientData.contact.email,
      phone: clientData.contact.phone || ''
    },
    address: clientData.address || {},
    tax_id: clientData.tax_id || '',
    metadata: clientData.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Agregar a datos demo (temporal)
  DEMO_CLIENT_DATA.push(newClient);
  
  return {
    success: true,
    client_id: newId,
    message: 'Cliente creado correctamente',
    source: 'demo'
  };
};

/**
 * Update demo client
 * @param {number} id - Client ID
 * @param {Object} clientData - Updated client data
 * @returns {Promise<Object>} - Demo update result
 */
export const updateDemoClient = async (id, clientData) => {
  await simulateDelay(700);
  
  const clientIndex = DEMO_CLIENT_DATA.findIndex(c => c.id === id);
  if (clientIndex === -1) {
    throw new Error(`Client with ID ${id} not found`);
  }
  
  // Actualizar datos
  DEMO_CLIENT_DATA[clientIndex] = {
    ...DEMO_CLIENT_DATA[clientIndex],
    ...clientData,
    updated_at: new Date().toISOString()
  };
  
  return {
    success: true,
    client_id: id,
    message: 'Cliente actualizado correctamente',
    source: 'demo'
  };
};

/**
 * Delete demo client (logical delete)
 * @param {number} id - Client ID
 * @returns {Promise<Object>} - Demo deletion result
 */
export const deleteDemoClient = async (id) => {
  await simulateDelay(500);
  
  const clientIndex = DEMO_CLIENT_DATA.findIndex(c => c.id === id);
  if (clientIndex === -1) {
    throw new Error(`Client with ID ${id} not found`);
  }
  
  // Borrado lógico (marcar como inactivo)
  DEMO_CLIENT_DATA[clientIndex].metadata = {
    ...DEMO_CLIENT_DATA[clientIndex].metadata,
    status: 'inactive',
    deleted_at: new Date().toISOString()
  };
  
  return {
    success: true,
    client_id: id,
    message: 'Cliente eliminado correctamente',
    source: 'demo'
  };
};