/**
 * Demo data configuration for development without API
 * Provides realistic data for dashboard and other components
 */

// Supplier demo data
export const DEMO_SUPPLIER_DATA = [
  {
    id: 101,
    name: 'Distribuidora Nacional S.A.',
    contact: {
      email: 'ventas@disnacional.com.mx',
      phone: '+52-555-2100',
    },
    address: {
      street: 'Av. Insurgentes Sur 2345',
      city: 'CDMX',
      country: 'México',
    },
    tax_id: 'DISN850101ABC',
    metadata: {
      priority: 'high',
      notes: 'Proveedor principal de materias primas',
      category: 'manufacturing',
    },
    created_at: '2025-07-12T08:30:00Z',
    updated_at: '2025-08-28T16:45:00Z',
  },
  {
    id: 102,
    name: 'Tecnología Avanzada del Norte',
    contact: {
      email: 'contacto@tecnorte.mx',
      phone: '+52-555-3200',
    },
    address: {
      street: 'Blvd. Díaz Ordaz 1890',
      city: 'Monterrey',
      country: 'México',
    },
    tax_id: 'TECN901201DEF',
    metadata: {
      priority: 'medium',
      notes: 'Especialista en equipos tecnológicos',
      category: 'technology',
    },
    created_at: '2025-07-18T14:15:00Z',
    updated_at: '2025-08-25T11:20:00Z',
  },
  {
    id: 103,
    name: 'Suministros Industriales del Bajío',
    contact: {
      email: 'admin@sibajio.com',
      phone: '+52-555-4300',
    },
    address: {
      street: 'Carr. Panamericana Km 12.5',
      city: 'León',
      country: 'México',
    },
    tax_id: 'SUIN750315GHI',
    metadata: {
      priority: 'medium',
      notes: 'Suministros diversos para manufactura',
      category: 'industrial',
    },
    created_at: '2025-08-02T09:45:00Z',
    updated_at: '2025-08-22T13:30:00Z',
  },
  {
    id: 104,
    name: 'Logística Express del Pacifico',
    contact: {
      email: 'operaciones@logexpress.mx',
      phone: '+52-555-5400',
    },
    address: {
      street: 'Puerto Interior Km 15',
      city: 'Guadalajara',
      country: 'México',
    },
    tax_id: 'LOGI820720JKL',
    metadata: {
      priority: 'low',
      notes: 'Servicios de transporte y logística',
      category: 'logistics',
    },
    created_at: '2025-08-08T12:00:00Z',
    updated_at: '2025-08-20T15:45:00Z',
  },
  {
    id: 105,
    name: 'Materiales Especializados de Querétaro',
    contact: {
      email: 'ventas@matespec.qro.mx',
      phone: '+52-555-6500',
    },
    address: {
      street: 'Zona Industrial El Marqués Lote 45',
      city: 'Querétaro',
      country: 'México',
    },
    tax_id: 'MATE930428MNO',
    metadata: {
      priority: 'high',
      notes: 'Proveedor estratégico de materiales especiales',
      category: 'materials',
    },
    created_at: '2025-07-25T10:30:00Z',
    updated_at: '2025-08-26T14:15:00Z',
  },
]

export const DEMO_SUPPLIER_STATISTICS = {
  total_suppliers: 127,
  active_suppliers: 118,
  inactive_suppliers: 9,
  new_suppliers: 5,
  updated_suppliers: 12,
}

// Client demo data
// Product demo data
export const DEMO_PRODUCT_DATA = [
  {
    id: 'PROD_001',
    name: 'Laptop Dell Inspiron 15',
    description: 'Laptop para uso profesional con 16GB RAM',
    price: 15999.99,
    cost: 12000.0,
    category: 'electronics',
    subcategory: 'computers',
    type: 'physical', // physical, service, digital
    reservable: false,
    stock: 25,
    min_stock: 5,
    max_stock: 100,
    barcode: '7501234567890',
    sku: 'DELL-INS15-001',
    tags: ['laptop', 'dell', 'business'],
    supplier_id: 102,
    tax_rate: 0.16,
    status: 'active',
    metadata: {
      brand: 'Dell',
      model: 'Inspiron 15',
      warranty_months: 12,
      weight: '2.1kg',
      dimensions: '35.8 x 24.2 x 1.9 cm',
    },
    created_at: '2025-07-15T10:30:00Z',
    updated_at: '2025-08-25T14:20:00Z',
  },
  {
    id: 'SERV_001',
    name: 'Cancha de Tenis Premium',
    description: 'Cancha de tenis profesional con iluminación',
    price: 200.0,
    cost: 50.0,
    category: 'sports',
    subcategory: 'tennis',
    type: 'service',
    reservable: true,
    stock: 1, // Para servicios, representa disponibilidad
    min_stock: 1,
    max_stock: 1,
    barcode: null,
    sku: 'COURT-TENNIS-001',
    tags: ['tennis', 'premium', 'sports'],
    supplier_id: null,
    tax_rate: 0.16,
    status: 'active',
    metadata: {
      capacity: 4,
      duration_hours: 1,
      equipment_included: true,
      surface_type: 'clay',
    },
    created_at: '2025-07-01T08:00:00Z',
    updated_at: '2025-08-20T16:30:00Z',
  },
  {
    id: 'SERV_002',
    name: 'Consulta Médica General',
    description: 'Consulta con médico general',
    price: 800.0,
    cost: 200.0,
    category: 'medical',
    subcategory: 'consultation',
    type: 'service',
    reservable: true,
    stock: 20, // Slots disponibles por día
    min_stock: 5,
    max_stock: 30,
    barcode: null,
    sku: 'MED-CONSULT-001',
    tags: ['medical', 'consultation', 'health'],
    supplier_id: null,
    tax_rate: 0.0, // Servicios médicos exentos
    status: 'active',
    metadata: {
      duration_minutes: 30,
      specialty: 'general',
      requires_appointment: true,
    },
    created_at: '2025-07-10T09:15:00Z',
    updated_at: '2025-08-22T11:45:00Z',
  },
  {
    id: 'PROD_002',
    name: 'Mouse Inalámbrico Logitech',
    description: 'Mouse ergonómico inalámbrico con sensor óptico',
    price: 599.99,
    cost: 350.0,
    category: 'electronics',
    subcategory: 'accessories',
    type: 'physical',
    reservable: false,
    stock: 150,
    min_stock: 20,
    max_stock: 300,
    barcode: '7501234567891',
    sku: 'LOGI-MOUSE-001',
    tags: ['mouse', 'wireless', 'logitech'],
    supplier_id: 102,
    tax_rate: 0.16,
    status: 'active',
    metadata: {
      brand: 'Logitech',
      connectivity: 'wireless',
      battery_life: '18 months',
      color: 'black',
    },
    created_at: '2025-07-20T12:00:00Z',
    updated_at: '2025-08-15T10:30:00Z',
  },
  {
    id: 'PROD_003',
    name: 'Café Premium Orgánico 1kg',
    description: 'Café de especialidad tostado artesanal',
    price: 450.0,
    cost: 280.0,
    category: 'food',
    subcategory: 'beverages',
    type: 'physical',
    reservable: false,
    stock: 80,
    min_stock: 15,
    max_stock: 200,
    barcode: '7501234567892',
    sku: 'CAFE-ORG-001',
    tags: ['coffee', 'organic', 'premium'],
    supplier_id: 103,
    tax_rate: 0.16,
    status: 'active',
    metadata: {
      origin: 'Chiapas, México',
      roast_level: 'medium',
      weight: '1kg',
      organic_certified: true,
    },
    created_at: '2025-08-01T15:20:00Z',
    updated_at: '2025-08-28T09:10:00Z',
  },
  {
    id: 'SERV_003',
    name: 'Sala de Conferencias Ejecutiva',
    description: 'Sala equipada para 12 personas con proyector',
    price: 500.0,
    cost: 100.0,
    category: 'business',
    subcategory: 'meeting_rooms',
    type: 'service',
    reservable: true,
    stock: 3, // 3 salas disponibles
    min_stock: 1,
    max_stock: 3,
    barcode: null,
    sku: 'ROOM-EXEC-001',
    tags: ['meeting', 'business', 'conference'],
    supplier_id: null,
    tax_rate: 0.16,
    status: 'active',
    metadata: {
      capacity: 12,
      equipment: ['projector', 'wifi', 'whiteboard', 'coffee_station'],
      duration_hours: 2,
      location: 'Piso 3',
    },
    created_at: '2025-07-05T11:30:00Z',
    updated_at: '2025-08-18T14:15:00Z',
  },
]

export const DEMO_CLIENT_DATA = [
  {
    id: 201,
    name: 'Grupo Empresarial ABC Corp',
    contact: {
      email: 'contacto@abccorp.com.mx',
      phone: '+52-555-1234',
    },
    address: {
      street: 'Av. Insurgentes Sur 1234, Col. del Valle',
      city: 'CDMX',
      country: 'México',
    },
    tax_id: 'ABC850315GH7',
    metadata: {
      priority: 'high',
      type: 'corporate',
      notes:
        'Cliente premium con descuentos especiales del 15%. Contrato corporativo vigente hasta 2026.',
    },
    created_at: '2025-08-15T09:30:00Z',
    updated_at: '2025-08-28T14:20:00Z',
  },
  {
    id: 202,
    name: 'Tech Solutions México SA',
    contact: {
      email: 'ventas@techsolutions.mx',
      phone: '+52-555-5678',
    },
    address: {
      street: 'Blvd. Manuel Ávila Camacho 456, Zona Centro',
      city: 'Monterrey',
      country: 'México',
    },
    tax_id: 'TSM901201BC8',
    metadata: {
      priority: 'medium',
      type: 'corporate',
      notes:
        'Cliente frecuente en productos tecnológicos. Compras mensuales promedio de $50K.',
    },
    created_at: '2025-08-10T11:15:00Z',
    updated_at: '2025-08-25T16:45:00Z',
  },
  {
    id: 203,
    name: 'Distribuidora Regional del Oeste',
    contact: {
      email: 'compras@distregional.com',
      phone: '+52-555-9012',
    },
    address: {
      street: 'Av. López Mateos Sur 2500, Zona Industrial',
      city: 'Guadalajara',
      country: 'México',
    },
    tax_id: 'DRO750420JH9',
    metadata: {
      priority: 'medium',
      type: 'wholesale',
      notes:
        'Distribuidor mayorista con pagos a 30 días. Volúmenes altos, márgenes ajustados.',
    },
    created_at: '2025-08-05T08:00:00Z',
    updated_at: '2025-08-20T10:30:00Z',
  },
  {
    id: 204,
    name: 'Comercializadora del Norte',
    contact: {
      email: 'admin@comercialnorte.mx',
      phone: '+52-555-3456',
    },
    address: {
      street: 'Calle Morelos 789, Centro Histórico',
      city: 'Tijuana',
      country: 'México',
    },
    tax_id: 'CDN820810MN2',
    metadata: {
      priority: 'low',
      type: 'retail',
      notes:
        'Cliente ocasional con compras estacionales. Activo principalmente en temporadas altas.',
    },
    created_at: '2025-07-28T13:45:00Z',
    updated_at: '2025-08-18T09:15:00Z',
  },
  {
    id: 205,
    name: 'Servicios Empresariales Unidos',
    contact: {
      email: 'info@serunidos.com',
      phone: '+52-555-7890',
    },
    address: {
      street: 'Av. Chapultepec 321, Zona Rosa',
      city: 'CDMX',
      country: 'México',
    },
    tax_id: 'SEU930505PQ4',
    metadata: {
      priority: 'high',
      type: 'corporate',
      notes:
        'Cliente VIP con contrato anual. Servicios integrales y soporte prioritario 24/7.',
    },
    created_at: '2025-07-20T15:20:00Z',
    updated_at: '2025-08-22T11:00:00Z',
  },
  {
    id: 206,
    name: 'Retail Express Querétaro',
    contact: {
      email: 'gerencia@retailexpress.com.mx',
      phone: '+52-442-1122',
    },
    address: {
      street: 'Av. 5 de Febrero 150, Centro Sur',
      city: 'Querétaro',
      country: 'México',
    },
    tax_id: 'REQ840225RT5',
    metadata: {
      priority: 'medium',
      type: 'retail',
      notes:
        'Cadena de tiendas con 8 sucursales. Pedidos semanales constantes.',
    },
    created_at: '2025-08-01T10:30:00Z',
    updated_at: '2025-08-29T16:45:00Z',
  },
  {
    id: 207,
    name: 'Constructora del Bajío SA',
    contact: {
      email: 'compras@constbajio.mx',
      phone: '+52-477-3344',
    },
    address: {
      street: 'Blvd. Adolfo López Mateos 2890, Industrial',
      city: 'León',
      country: 'México',
    },
    tax_id: 'CDB770315CS2',
    metadata: {
      priority: 'medium',
      type: 'corporate',
      notes:
        'Especialistas en construcción industrial. Proyectos a gran escala.',
    },
    created_at: '2025-07-15T08:15:00Z',
    updated_at: '2025-08-20T12:30:00Z',
  },
  {
    id: 208,
    name: 'MiPyme Digital',
    contact: {
      email: 'contacto@mipymedigital.com',
      phone: '+52-555-9988',
    },
    address: {
      street: 'Calle Revolución 45, Centro',
      city: 'Puebla',
      country: 'México',
    },
    tax_id: 'MPD210810DG8',
    metadata: {
      priority: 'low',
      type: 'retail',
      notes: 'Startup emergente. Compras pequeñas pero frecuentes.',
    },
    created_at: '2025-08-12T14:20:00Z',
    updated_at: '2025-08-28T10:15:00Z',
  },
]

export const DEMO_CLIENT_STATISTICS = {
  total_clients: 250,
  active_clients: 238,
  inactive_clients: 12,
  new_clients: 11,
  updated_clients: 18,
}

// Dashboard demo data
export const DEMO_DASHBOARD_DATA = {
  clientStats: {
    total: 1247,
    active: 1108,
    inactive: 139,
    new_this_month: 23,
    growth_percentage: 8.5,
  },

  productStats: {
    total: 1253,
    active: 1184,
    lowStock: 12,
    outOfStock: 4,
    new_this_month: 18,
    top_selling: 45,
  },

  salesStats: {
    today: 147,
    thisWeek: 892,
    thisMonth: 3567,
    total: 125430,
    trend: 12.5,
    avgOrderValue: 89.5,
    topClient: 'Empresa ABC Corp',
    bestProduct: 'Producto Premium X',
  },
}

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
    { name: 'Dic', value: 40000 },
  ],

  categoryChart: [
    { name: 'Electrónicos', value: 35, count: 234 },
    { name: 'Ropa', value: 25, count: 167 },
    { name: 'Hogar', value: 20, count: 134 },
    { name: 'Deportes', value: 15, count: 89 },
    { name: 'Otros', value: 5, count: 45 },
  ],

  topProducts: [
    { id: 1, name: 'Laptop Pro X1', sales: 145, revenue: 145000 },
    { id: 2, name: 'Smartphone Z3', sales: 128, revenue: 89600 },
    { id: 3, name: 'Tablet Air 5', sales: 98, revenue: 58800 },
    { id: 4, name: 'Monitor 4K Ultra', sales: 87, revenue: 52200 },
    { id: 5, name: 'Auriculares Pro', sales: 76, revenue: 22800 },
  ],

  recentActivity: [
    {
      id: 1,
      type: 'sale',
      description: 'Nueva venta a Empresa XYZ',
      amount: 2500,
      time: '10:30',
    },
    {
      id: 2,
      type: 'client',
      description: 'Cliente registrado: Tech Solutions',
      amount: null,
      time: '09:45',
    },
    {
      id: 3,
      type: 'product',
      description: 'Stock bajo: Laptop Pro X1',
      amount: null,
      time: '09:15',
    },
    {
      id: 4,
      type: 'sale',
      description: 'Venta completada #1247',
      amount: 890,
      time: '08:50',
    },
    {
      id: 5,
      type: 'payment',
      description: 'Pago recibido de ABC Corp',
      amount: 15000,
      time: '08:20',
    },
  ],
}

// Demo configuration
export const DEMO_CONFIG_DASHBOARD = {
  enabled: true, // Enable/disable demo mode
  useRealAPI: false, // Toggle real API calls
  simulateDelay: true, // Simulate network delay
  delayMs: 800, // Delay in milliseconds
  showAPIStatus: true, // Show API status in UI
}

export const DEMO_CONFIG_CLIENTS = {
  enabled: false, // Disabled to integrate real API
  useRealAPI: true, // Force real API calls
  simulateDelay: true, // Simulate network delay
  delayMs: 600, // Delay in milliseconds
  pageSize: 10, // Items per page
}

export const DEMO_CONFIG_SUPPLIERS = {
  enabled: true, // Enable/disable demo mode
  useRealAPI: false, // Toggle real API calls
  simulateDelay: true, // Simulate network delay
  delayMs: 500, // Delay in milliseconds
  pageSize: 10, // Items per page
}

/**
 * Simulate API delay for realism
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise} - Promise that resolves after delay
 */
export const simulateDelay = (ms = DEMO_CONFIG_DASHBOARD.delayMs) => {
  if (!DEMO_CONFIG_DASHBOARD.simulateDelay) return Promise.resolve()
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get demo dashboard data with simulated delay
 * @returns {Promise<Object>} - Demo dashboard data
 */
export const getDemoDashboardData = async () => {
  await simulateDelay()

  return {
    success: true,
    data: DEMO_DASHBOARD_DATA,
    charts: DEMO_CHART_DATA,
    timestamp: new Date().toISOString(),
    source: 'demo',
  }
}

/**
 * Get demo client statistics
 * @returns {Promise<Object>} - Demo client stats
 */
export const getDemoClientStats = async () => {
  await simulateDelay(400)

  return {
    success: true,
    data: {
      client_statistics: DEMO_DASHBOARD_DATA.clientStats,
    },
    source: 'demo',
  }
}

/**
 * Get demo product statistics
 * @returns {Promise<Object>} - Demo product stats
 */
export const getDemoProductStats = async () => {
  await simulateDelay(600)

  return {
    success: true,
    data: {
      product_statistics: DEMO_DASHBOARD_DATA.productStats,
    },
    source: 'demo',
  }
}

/**
 * Get demo sales statistics
 * @returns {Promise<Object>} - Demo sales stats
 */
export const getDemoSalesStats = async () => {
  await simulateDelay(500)

  return {
    success: true,
    data: {
      sales_statistics: DEMO_DASHBOARD_DATA.salesStats,
    },
    source: 'demo',
  }
}

/**
 * Get demo clients list with pagination and search
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Demo clients data
 */
export const getDemoClients = async (params = {}) => {
  await simulateDelay(DEMO_CONFIG_CLIENTS.delayMs)

  const {
    page = 1,
    pageSize = DEMO_CONFIG_CLIENTS.pageSize,
    name = '',
  } = params

  // Filtrar por nombre si se proporciona
  let filteredClients = DEMO_CLIENT_DATA
  if (name) {
    filteredClients = DEMO_CLIENT_DATA.filter(client =>
      client.name.toLowerCase().includes(name.toLowerCase())
    )
  }

  // Paginación
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  return {
    success: true,
    data: {
      clients: paginatedClients,
      total: filteredClients.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
    source: 'demo',
  }
}

/**
 * Get demo client statistics
 * @returns {Promise<Object>} - Demo client statistics
 */
export const getDemoClientStatistics = async () => {
  await simulateDelay(400)

  return {
    success: true,
    data: {
      client_statistics: DEMO_CLIENT_STATISTICS,
    },
    source: 'demo',
  }
}

/**
 * Create demo client
 * @param {Object} clientData - Client data to create
 * @returns {Promise<Object>} - Demo creation result
 */
export const createDemoClient = async clientData => {
  await simulateDelay(800)

  // Simular validación
  if (!clientData.name || !clientData.contact?.email) {
    throw new Error('Validation failed: name and email are required')
  }

  // Simular ID único
  const newId = Math.max(...DEMO_CLIENT_DATA.map(c => c.id)) + 1

  const newClient = {
    id: newId,
    name: clientData.name,
    contact: {
      email: clientData.contact.email,
      phone: clientData.contact.phone || '',
    },
    address: clientData.address || {},
    tax_id: clientData.tax_id || '',
    metadata: clientData.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Agregar a datos demo (temporal)
  DEMO_CLIENT_DATA.push(newClient)

  return {
    success: true,
    client_id: newId,
    message: 'Cliente creado correctamente',
    source: 'demo',
  }
}

/**
 * Update demo client
 * @param {number} id - Client ID
 * @param {Object} clientData - Updated client data
 * @returns {Promise<Object>} - Demo update result
 */
export const updateDemoClient = async (id, clientData) => {
  await simulateDelay(700)

  const clientIndex = DEMO_CLIENT_DATA.findIndex(c => c.id === id)
  if (clientIndex === -1) {
    throw new Error(`Client with ID ${id} not found`)
  }

  // Actualizar datos
  DEMO_CLIENT_DATA[clientIndex] = {
    ...DEMO_CLIENT_DATA[clientIndex],
    ...clientData,
    updated_at: new Date().toISOString(),
  }

  return {
    success: true,
    client_id: id,
    message: 'Cliente actualizado correctamente',
    source: 'demo',
  }
}

/**
 * Delete demo client (logical delete)
 * @param {number} id - Client ID
 * @returns {Promise<Object>} - Demo deletion result
 */
export const deleteDemoClient = async id => {
  await simulateDelay(500)

  const clientIndex = DEMO_CLIENT_DATA.findIndex(c => c.id === id)
  if (clientIndex === -1) {
    throw new Error(`Client with ID ${id} not found`)
  }

  // Borrado lógico (marcar como inactivo)
  DEMO_CLIENT_DATA[clientIndex].metadata = {
    ...DEMO_CLIENT_DATA[clientIndex].metadata,
    status: 'inactive',
    deleted_at: new Date().toISOString(),
  }

  return {
    success: true,
    client_id: id,
    message: 'Cliente eliminado correctamente',
    source: 'demo',
  }
}

/**
 * Get demo suppliers list with pagination and search
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Demo suppliers data
 */
export const getDemoSuppliers = async (params = {}) => {
  await simulateDelay(DEMO_CONFIG_SUPPLIERS.delayMs)

  const {
    page = 1,
    pageSize = DEMO_CONFIG_SUPPLIERS.pageSize,
    name = '',
  } = params

  // Filtrar por nombre si se proporciona
  let filteredSuppliers = DEMO_SUPPLIER_DATA
  if (name) {
    filteredSuppliers = DEMO_SUPPLIER_DATA.filter(supplier =>
      supplier.name.toLowerCase().includes(name.toLowerCase())
    )
  }

  // Paginación
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex)

  return {
    success: true,
    data: {
      suppliers: paginatedSuppliers,
      total: filteredSuppliers.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
    source: 'demo',
  }
}

/**
 * Get demo supplier statistics
 * @returns {Promise<Object>} - Demo supplier statistics
 */
export const getDemoSupplierStatistics = async () => {
  await simulateDelay(400)

  return {
    success: true,
    data: {
      supplier_statistics: DEMO_SUPPLIER_STATISTICS,
    },
    source: 'demo',
  }
}

/**
 * Create demo supplier
 * @param {Object} supplierData - Supplier data to create
 * @returns {Promise<Object>} - Demo creation result
 */
export const createDemoSupplier = async supplierData => {
  await simulateDelay(800)

  // Simular validación
  if (!supplierData.name || !supplierData.contact?.email) {
    throw new Error('Validation failed: name and email are required')
  }

  // Simular ID único
  const newId = Math.max(...DEMO_SUPPLIER_DATA.map(s => s.id)) + 1

  const newSupplier = {
    id: newId,
    name: supplierData.name,
    contact: {
      email: supplierData.contact.email,
      phone: supplierData.contact.phone || '',
    },
    address: supplierData.address || {},
    tax_id: supplierData.tax_id || '',
    metadata: supplierData.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Agregar a datos demo (temporal)
  DEMO_SUPPLIER_DATA.push(newSupplier)

  return {
    success: true,
    supplier_id: newId,
    message: 'Proveedor creado correctamente',
    source: 'demo',
  }
}

/**
 * Update demo supplier
 * @param {number} id - Supplier ID
 * @param {Object} supplierData - Updated supplier data
 * @returns {Promise<Object>} - Demo update result
 */
export const updateDemoSupplier = async (id, supplierData) => {
  await simulateDelay(700)

  const supplierIndex = DEMO_SUPPLIER_DATA.findIndex(s => s.id === id)
  if (supplierIndex === -1) {
    throw new Error(`Supplier with ID ${id} not found`)
  }

  // Actualizar datos
  DEMO_SUPPLIER_DATA[supplierIndex] = {
    ...DEMO_SUPPLIER_DATA[supplierIndex],
    ...supplierData,
    updated_at: new Date().toISOString(),
  }

  return {
    success: true,
    supplier_id: id,
    message: 'Proveedor actualizado correctamente',
    source: 'demo',
  }
}

/**
 * Delete demo supplier (logical delete)
 * @param {number} id - Supplier ID
 * @returns {Promise<Object>} - Demo deletion result
 */
export const deleteDemoSupplier = async id => {
  await simulateDelay(500)

  const supplierIndex = DEMO_SUPPLIER_DATA.findIndex(s => s.id === id)
  if (supplierIndex === -1) {
    throw new Error(`Supplier with ID ${id} not found`)
  }

  // Borrado lógico (marcar como inactivo)
  DEMO_SUPPLIER_DATA[supplierIndex].metadata = {
    ...DEMO_SUPPLIER_DATA[supplierIndex].metadata,
    status: 'inactive',
    deleted_at: new Date().toISOString(),
  }

  return {
    success: true,
    supplier_id: id,
    message: 'Proveedor eliminado correctamente',
    source: 'demo',
  }
}

// === PRODUCTS DEMO CONFIGURATION ===
export const DEMO_CONFIG_PRODUCTS = {
  enabled: true, // Enable/disable demo mode
  useRealAPI: false, // Toggle real API calls
  simulateDelay: true, // Simulate network delay
  delayMs: 500, // Delay in milliseconds
  pageSize: 20, // Default page size
}

// === RESERVATIONS DEMO CONFIGURATION ===
export const DEMO_CONFIG_RESERVATIONS = {
  enabled: true, // Enable/disable demo mode
  useRealAPI: true, // CHANGED: Use real API instead of mock data
  simulateDelay: false, // DISABLED: No delay for real API
  delayMs: 600, // Delay in milliseconds
  pageSize: 10, // Items per page
}

// === SCHEDULES DEMO CONFIGURATION ===
export const DEMO_CONFIG_SCHEDULES = {
  enabled: true, // Enable/disable demo mode
  useRealAPI: false, // Toggle real API calls
  simulateDelay: true, // Simulate network delay
  delayMs: 500, // Delay in milliseconds
  pageSize: 20, // Items per page
}

export const DEMO_CONFIG_AVAILABLE_SLOTS = {
  enabled: true, // Enable/disable demo mode
  useRealAPI: false, // Toggle real API calls
  simulateDelay: true, // Simulate network delay
  delayMs: 450, // Delay in milliseconds
}

// Demo reservations data
export const DEMO_RESERVATIONS_DATA = [
  {
    id: 1,
    product_id: 'SERV_001',
    product_name: 'Cancha de Tenis Premium',
    product_description:
      'Cancha de tenis profesional con superficie de arcilla',
    client_id: 'CLI_001',
    client_name: 'María González',
    start_time: '2025-09-01T14:00:00Z',
    end_time: '2025-09-01T16:00:00Z',
    duration: 2,
    total_amount: 150.0,
    status: 'confirmed',
    user_id: 'USR_001',
    user_name: 'Admin User',
  },
  {
    id: 2,
    product_id: 'SERV_002',
    product_name: 'Sala de Conferencias Ejecutiva',
    product_description: 'Sala de conferencias con capacidad para 20 personas',
    client_id: 'CLI_002',
    client_name: 'Corporativo XYZ S.A.',
    start_time: '2025-09-02T09:00:00Z',
    end_time: '2025-09-02T12:00:00Z',
    duration: 3,
    total_amount: 450.0,
    status: 'pending',
    user_id: 'USR_001',
    user_name: 'Admin User',
  },
  {
    id: 3,
    product_id: 'SERV_003',
    product_name: 'Consulta Médica Especializada',
    product_description: 'Consulta con especialista cardiólogo',
    client_id: 'CLI_003',
    client_name: 'Juan Pérez Silva',
    start_time: '2025-09-03T11:30:00Z',
    end_time: '2025-09-03T12:30:00Z',
    duration: 1,
    total_amount: 800.0,
    status: 'confirmed',
    user_id: 'USR_001',
    user_name: 'Admin User',
  },
]

// Demo schedules data
export const DEMO_SCHEDULES_DATA = [
  {
    id: 1001,
    product_id: 'SERV_001',
    product_name: 'Cancha de Tenis Premium',
    start_time: '2025-09-01T09:00:00Z',
    end_time: '2025-09-01T10:00:00Z',
    is_available: true,
  },
  {
    id: 1002,
    product_id: 'SERV_001',
    product_name: 'Cancha de Tenis Premium',
    start_time: '2025-09-01T10:00:00Z',
    end_time: '2025-09-01T11:00:00Z',
    is_available: true,
  },
  {
    id: 1003,
    product_id: 'SERV_001',
    product_name: 'Cancha de Tenis Premium',
    start_time: '2025-09-01T14:00:00Z',
    end_time: '2025-09-01T16:00:00Z',
    is_available: false,
  },
  {
    id: 1004,
    product_id: 'SERV_002',
    product_name: 'Sala de Conferencias Ejecutiva',
    start_time: '2025-09-02T09:00:00Z',
    end_time: '2025-09-02T12:00:00Z',
    is_available: false,
  },
  {
    id: 1005,
    product_id: 'SERV_002',
    product_name: 'Sala de Conferencias Ejecutiva',
    start_time: '2025-09-02T14:00:00Z',
    end_time: '2025-09-02T17:00:00Z',
    is_available: true,
  },
]

const toISODate = value => {
  if (!value) return null
  try {
    return new Date(value).toISOString().split('T')[0]
  } catch (error) {
    return null
  }
}

const getSlotDurationMinutes = (start, end) => {
  if (!start || !end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diff = endDate - startDate
  return diff > 0 ? Math.round(diff / 60000) : 0
}

export const getDemoAvailableSlotsDefaultDate = () => {
  if (!Array.isArray(DEMO_SCHEDULES_DATA) || DEMO_SCHEDULES_DATA.length === 0) {
    return null
  }

  const sortedSchedules = [...DEMO_SCHEDULES_DATA]
    .filter(schedule => Boolean(schedule?.start_time))
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

  if (!sortedSchedules.length) {
    return null
  }

  try {
    return new Date(sortedSchedules[0].start_time).toISOString().split('T')[0]
  } catch (error) {
    return null
  }
}

export const getDemoAvailableSlotProducts = async () => {
  await simulateDelay(DEMO_CONFIG_AVAILABLE_SLOTS.delayMs)

  const reservableProducts = DEMO_PRODUCT_DATA.filter(
    product => product.reservable || product.type === 'service'
  )

  const data = reservableProducts.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    duration_minutes:
      product.metadata?.duration_minutes ||
      (product.metadata?.duration_hours
        ? product.metadata.duration_hours * 60
        : product.duration_minutes || 60),
    raw: product,
  }))

  return {
    success: true,
    data,
    total: data.length,
    source: 'demo',
  }
}

export const getDemoAvailableSlots = async (params = {}) => {
  await simulateDelay(DEMO_CONFIG_AVAILABLE_SLOTS.delayMs)

  const { productId, date, durationMinutes = 60 } = params
  const normalizedDate = date ? toISODate(date) : null

  const data = DEMO_SCHEDULES_DATA.filter(schedule => {
    if (!schedule.is_available) return false
    if (productId && schedule.product_id !== productId) return false

    if (normalizedDate) {
      const scheduleDate = toISODate(schedule.start_time)
      if (scheduleDate !== normalizedDate) return false
    }

    const slotDuration = getSlotDurationMinutes(
      schedule.start_time,
      schedule.end_time
    )

    return slotDuration >= durationMinutes
  }).map(schedule => ({
    id: schedule.id,
    product_id: schedule.product_id,
    product_name: schedule.product_name,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    duration_minutes: getSlotDurationMinutes(
      schedule.start_time,
      schedule.end_time
    ),
    is_available: schedule.is_available,
    source: 'demo',
  }))

  return {
    success: true,
    data,
    pagination: {
      total: data.length,
    },
    source: 'demo',
  }
}

/**
 * Get demo reservations with pagination and filtering
 * @param {Object} params - Query parameters (page, pageSize, etc.)
 * @returns {Promise<Object>} - Demo reservations result
 */
export const getDemoReservations = async (params = {}) => {
  await simulateDelay(DEMO_CONFIG_RESERVATIONS.delayMs)

  const {
    page = 1,
    pageSize = DEMO_CONFIG_RESERVATIONS.pageSize,
    client_id = '',
    product_id = '',
  } = params

  // Filtrar por cliente o producto si se proporciona
  let filteredReservations = DEMO_RESERVATIONS_DATA
  if (client_id) {
    filteredReservations = filteredReservations.filter(
      reservation => reservation.client_id === client_id
    )
  }
  if (product_id) {
    filteredReservations = filteredReservations.filter(
      reservation => reservation.product_id === product_id
    )
  }

  const total = filteredReservations.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredReservations.slice(startIndex, endIndex)

  return {
    success: true,
    data: paginatedData,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    source: 'demo',
  }
}

/**
 * Get demo schedules with filtering
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Demo schedules result
 */
export const getDemoSchedules = async (params = {}) => {
  await simulateDelay(DEMO_CONFIG_SCHEDULES.delayMs)

  const {
    page = 1,
    pageSize = DEMO_CONFIG_SCHEDULES.pageSize,
    product_id = '',
    startDate = '',
    endDate = '',
  } = params

  // Filtrar por producto y fechas si se proporciona
  let filteredSchedules = DEMO_SCHEDULES_DATA
  if (product_id) {
    filteredSchedules = filteredSchedules.filter(
      schedule => schedule.product_id === product_id
    )
  }

  if (startDate) {
    filteredSchedules = filteredSchedules.filter(
      schedule => new Date(schedule.start_time) >= new Date(startDate)
    )
  }

  if (endDate) {
    filteredSchedules = filteredSchedules.filter(
      schedule => new Date(schedule.start_time) <= new Date(endDate)
    )
  }

  const total = filteredSchedules.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredSchedules.slice(startIndex, endIndex)

  return {
    success: true,
    data: paginatedData,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    source: 'demo',
  }
}

/**
 * Create demo reservation
 * @param {Object} reservationData - Reservation data
 * @returns {Promise<Object>} - Demo creation result
 */
export const createDemoReservation = async reservationData => {
  await simulateDelay(800)

  // Generate new ID
  const newId = Math.max(...DEMO_RESERVATIONS_DATA.map(r => r.id)) + 1

  const newReservation = {
    id: newId,
    ...reservationData,
    user_id: 'USR_001',
    user_name: 'Admin User',
    status: 'pending',
  }

  // Add to demo data
  DEMO_RESERVATIONS_DATA.push(newReservation)

  return {
    success: true,
    data: newReservation,
    message: 'Reserva creada correctamente',
    source: 'demo',
  }
}

/**
 * Update demo reservation
 * @param {number} id - Reservation ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Demo update result
 */
export const updateDemoReservation = async (id, updateData) => {
  await simulateDelay(600)

  const reservationIndex = DEMO_RESERVATIONS_DATA.findIndex(r => r.id === id)
  if (reservationIndex === -1) {
    throw new Error(`Reservation with ID ${id} not found`)
  }

  DEMO_RESERVATIONS_DATA[reservationIndex] = {
    ...DEMO_RESERVATIONS_DATA[reservationIndex],
    ...updateData,
  }

  return {
    success: true,
    data: DEMO_RESERVATIONS_DATA[reservationIndex],
    message: 'Reserva actualizada correctamente',
    source: 'demo',
  }
}

/**
 * Delete demo reservation (cancel)
 * @param {number} id - Reservation ID
 * @returns {Promise<Object>} - Demo deletion result
 */
export const deleteDemoReservation = async id => {
  await simulateDelay(500)

  const reservationIndex = DEMO_RESERVATIONS_DATA.findIndex(r => r.id === id)
  if (reservationIndex === -1) {
    throw new Error(`Reservation with ID ${id} not found`)
  }

  // Cancel reservation instead of delete
  DEMO_RESERVATIONS_DATA[reservationIndex].status = 'cancelled'

  return {
    success: true,
    reservation_id: id,
    message: 'Reserva cancelada correctamente',
    source: 'demo',
  }
}

/**
 * Create demo schedule
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise<Object>} - Demo creation result
 */
export const createDemoSchedule = async scheduleData => {
  await simulateDelay(600)

  const newId = Math.max(...DEMO_SCHEDULES_DATA.map(s => s.id)) + 1

  const newSchedule = {
    id: newId,
    ...scheduleData,
    is_available: true,
  }

  DEMO_SCHEDULES_DATA.push(newSchedule)

  return {
    success: true,
    data: newSchedule,
    message: 'Horario creado correctamente',
    source: 'demo',
  }
}

/**
 * Update demo schedule
 * @param {number} id - Schedule ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Demo update result
 */
export const updateDemoSchedule = async (id, updateData) => {
  await simulateDelay(400)

  const scheduleIndex = DEMO_SCHEDULES_DATA.findIndex(s => s.id === id)
  if (scheduleIndex === -1) {
    throw new Error(`Schedule with ID ${id} not found`)
  }

  DEMO_SCHEDULES_DATA[scheduleIndex] = {
    ...DEMO_SCHEDULES_DATA[scheduleIndex],
    ...updateData,
  }

  return {
    success: true,
    data: DEMO_SCHEDULES_DATA[scheduleIndex],
    message: 'Horario actualizado correctamente',
    source: 'demo',
  }
}

/**
 * Delete demo schedule
 * @param {number} id - Schedule ID
 * @returns {Promise<Object>} - Demo deletion result
 */
export const deleteDemoSchedule = async id => {
  await simulateDelay(400)

  const scheduleIndex = DEMO_SCHEDULES_DATA.findIndex(s => s.id === id)
  if (scheduleIndex === -1) {
    throw new Error(`Schedule with ID ${id} not found`)
  }

  // Remove from demo data
  DEMO_SCHEDULES_DATA.splice(scheduleIndex, 1)

  return {
    success: true,
    schedule_id: id,
    message: 'Horario eliminado correctamente',
    source: 'demo',
  }
}

// ============ SALES DEMO DATA ============

// Sales configuration
export const DEMO_CONFIG_SALES = {
  enabled: true,
  delayMs: 600,
  pageSize: 10,
  simulateErrors: false,
  errorRate: 0.1,
}

// Demo sales data
export const DEMO_SALES_DATA = [
  {
    id: 1,
    client_id: 1,
    client_name: 'Empresa TechCorp S.A.',
    session_id: 'sess_20250831_001',
    sale_date: '2025-08-31T10:30:00Z',
    total_amount: 2450.0,
    subtotal_amount: 2112.07,
    tax_amount: 337.93,
    discount_amount: 0.0,
    payment_method: 'card',
    amount_paid: 2450.0,
    change_amount: 0.0,
    status: 'completed',
    pos_terminal_id: 'POS_001',
    notes: 'Compra de equipos de oficina',
  },
  {
    id: 2,
    client_id: 2,
    client_name: 'Distribuidora Norte',
    session_id: 'sess_20250831_002',
    sale_date: '2025-08-31T14:15:00Z',
    total_amount: 1850.0,
    subtotal_amount: 1594.83,
    tax_amount: 255.17,
    discount_amount: 0.0,
    payment_method: 'cash',
    amount_paid: 2000.0,
    change_amount: 150.0,
    status: 'completed',
    pos_terminal_id: 'POS_001',
    notes: 'Venta al contado',
  },
  {
    id: 3,
    client_id: 3,
    client_name: 'Consultoria ABC',
    session_id: 'sess_20250830_003',
    sale_date: '2025-08-30T16:45:00Z',
    total_amount: 3200.0,
    subtotal_amount: 2758.62,
    tax_amount: 441.38,
    discount_amount: 0.0,
    payment_method: 'transfer',
    amount_paid: 3200.0,
    change_amount: 0.0,
    status: 'completed',
    pos_terminal_id: 'POS_001',
    notes: 'Compra de servicios',
  },
  {
    id: 4,
    client_id: 1,
    client_name: 'Empresa TechCorp S.A.',
    session_id: 'sess_20250830_004',
    sale_date: '2025-08-30T09:20:00Z',
    total_amount: 750.0,
    subtotal_amount: 646.55,
    tax_amount: 103.45,
    discount_amount: 0.0,
    payment_method: 'cash',
    amount_paid: 800.0,
    change_amount: 50.0,
    status: 'completed',
    pos_terminal_id: 'POS_002',
    notes: 'Compra menor',
  },
  {
    id: 5,
    client_id: 4,
    client_name: 'Retail Solutions',
    session_id: 'sess_20250829_005',
    sale_date: '2025-08-29T13:30:00Z',
    total_amount: 5200.0,
    subtotal_amount: 4482.76,
    tax_amount: 717.24,
    discount_amount: 200.0,
    payment_method: 'card',
    amount_paid: 5200.0,
    change_amount: 0.0,
    status: 'completed',
    pos_terminal_id: 'POS_001',
    notes: 'Venta con descuento aplicado',
  },
]

// Demo sale items data
export const DEMO_SALE_ITEMS_DATA = [
  {
    id: 1,
    sale_id: 1,
    product_id: 1,
    product_name: 'Laptop Dell Inspiron',
    quantity: 2,
    unit_price: 1225.0,
    total_price: 2450.0,
  },
  {
    id: 2,
    sale_id: 2,
    product_id: 2,
    product_name: 'Mouse Inalámbrico',
    quantity: 5,
    unit_price: 350.0,
    total_price: 1750.0,
  },
  {
    id: 3,
    sale_id: 2,
    product_id: 3,
    product_name: 'Teclado Mecánico',
    quantity: 1,
    unit_price: 100.0,
    total_price: 100.0,
  },
  {
    id: 4,
    sale_id: 3,
    product_id: 4,
    product_name: 'Monitor 24"',
    quantity: 4,
    unit_price: 800.0,
    total_price: 3200.0,
  },
  {
    id: 5,
    sale_id: 4,
    product_id: 5,
    product_name: 'Auriculares',
    quantity: 3,
    unit_price: 250.0,
    total_price: 750.0,
  },
  {
    id: 6,
    sale_id: 5,
    product_id: 1,
    product_name: 'Laptop Dell Inspiron',
    quantity: 4,
    unit_price: 1225.0,
    total_price: 4900.0,
  },
  {
    id: 7,
    sale_id: 5,
    product_id: 6,
    product_name: 'Cable HDMI',
    quantity: 10,
    unit_price: 50.0,
    total_price: 500.0,
  },
]

// ============ PURCHASES DEMO DATA ============

// Purchases configuration
export const DEMO_CONFIG_PURCHASES = {
  enabled: true,
  delayMs: 700,
  pageSize: 10,
  simulateErrors: false,
  errorRate: 0.05,
}

// Demo purchase orders data
export const DEMO_PURCHASE_ORDERS_DATA = [
  {
    id: 1,
    supplier_id: 101,
    supplier_name: 'Distribuidora Nacional S.A.',
    order_date: '2025-08-31T08:00:00Z',
    expected_delivery: '2025-09-07T12:00:00Z',
    total_amount: 15000.0,
    status: 'pending',
    notes: 'Pedido urgente de materias primas',
  },
  {
    id: 2,
    supplier_id: 102,
    supplier_name: 'Tecnología Avanzada del Norte',
    order_date: '2025-08-30T14:30:00Z',
    expected_delivery: '2025-09-05T10:00:00Z',
    total_amount: 25000.0,
    status: 'completed',
    notes: 'Equipos tecnológicos para nueva sucursal',
  },
  {
    id: 3,
    supplier_id: 103,
    supplier_name: 'Suministros Industriales del Bajío',
    order_date: '2025-08-29T11:15:00Z',
    expected_delivery: '2025-09-03T14:00:00Z',
    total_amount: 8500.0,
    status: 'completed',
    notes: 'Suministros mensuales',
  },
  {
    id: 4,
    supplier_id: 104,
    supplier_name: 'Logística Express del Pacifico',
    order_date: '2025-08-28T16:45:00Z',
    expected_delivery: '2025-09-01T09:00:00Z',
    total_amount: 3200.0,
    status: 'cancelled',
    notes: 'Cancelado por falta de disponibilidad',
  },
  {
    id: 5,
    supplier_id: 105,
    supplier_name: 'Materiales Especializados de Querétaro',
    order_date: '2025-08-27T13:20:00Z',
    expected_delivery: '2025-09-02T11:30:00Z',
    total_amount: 18750.0,
    status: 'pending',
    notes: 'Materiales especiales para proyecto',
  },
]

// Demo purchase items data
export const DEMO_PURCHASE_ITEMS_DATA = [
  {
    id: 1,
    purchase_order_id: 1,
    product_id: 'MAT_001',
    product_name: 'Acero Inoxidable',
    quantity: 100,
    unit_price: 150.0,
    total_price: 15000.0,
    exp_date: '2026-08-31',
  },
  {
    id: 2,
    purchase_order_id: 2,
    product_id: 'TECH_001',
    product_name: 'Servidores Dell',
    quantity: 5,
    unit_price: 5000.0,
    total_price: 25000.0,
  },
  {
    id: 3,
    purchase_order_id: 3,
    product_id: 'IND_001',
    product_name: 'Herramientas Industriales',
    quantity: 50,
    unit_price: 170.0,
    total_price: 8500.0,
  },
  {
    id: 4,
    purchase_order_id: 4,
    product_id: 'LOG_001',
    product_name: 'Servicios de Transporte',
    quantity: 1,
    unit_price: 3200.0,
    total_price: 3200.0,
  },
  {
    id: 5,
    purchase_order_id: 5,
    product_id: 'ESP_001',
    product_name: 'Materiales Cerámicos',
    quantity: 25,
    unit_price: 750.0,
    total_price: 18750.0,
    exp_date: '2027-08-27',
  },
]

// Tax rates data
export const DEMO_TAX_RATES_DATA = [
  { id: 1, rate: 0.16, name: 'IVA 16%' },
  { id: 2, rate: 0.08, name: 'IVA Reducido 8%' },
  { id: 3, rate: 0.0, name: 'Exento' },
]

// ============ SALES DEMO FUNCTIONS ============

/**
 * Get demo sales with pagination and filtering
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Demo sales result
 */
export const getDemoSales = async (params = {}) => {
  await simulateDelay(DEMO_CONFIG_SALES.delayMs)

  const {
    page = 1,
    pageSize = DEMO_CONFIG_SALES.pageSize,
    client_id = '',
    status = '',
    date_from = '',
    date_to = '',
  } = params

  let filteredSales = [...DEMO_SALES_DATA]

  // Apply filters
  if (client_id) {
    filteredSales = filteredSales.filter(
      sale => sale.client_id === parseInt(client_id)
    )
  }
  if (status) {
    filteredSales = filteredSales.filter(sale => sale.status === status)
  }
  if (date_from) {
    filteredSales = filteredSales.filter(sale => sale.sale_date >= date_from)
  }
  if (date_to) {
    filteredSales = filteredSales.filter(sale => sale.sale_date <= date_to)
  }

  // Sort by date (newest first)
  filteredSales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))

  const total = filteredSales.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredSales.slice(startIndex, endIndex)

  return {
    success: true,
    data: paginatedData,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    source: 'demo',
  }
}

/**
 * Create demo sale
 * @param {Object} saleData - Sale data
 * @returns {Promise<Object>} - Demo creation result
 */
export const createDemoSale = async saleData => {
  await simulateDelay(800)

  const newId = Math.max(...DEMO_SALES_DATA.map(s => s.id)) + 1

  const newSale = {
    id: newId,
    session_id: `sess_${Date.now()}`,
    sale_date: new Date().toISOString(),
    status: 'completed',
    pos_terminal_id: 'POS_001',
    change_amount: Math.max(
      0,
      (saleData.amount_paid || saleData.total_amount) - saleData.total_amount
    ),
    ...saleData,
  }

  DEMO_SALES_DATA.unshift(newSale)

  return {
    success: true,
    data: newSale,
    sale_id: newId,
    message: 'Venta creada correctamente',
    source: 'demo',
  }
}

// ============ PURCHASES DEMO FUNCTIONS ============

/**
 * Get demo purchase orders with pagination and filtering
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Demo purchase orders result
 */
export const getDemoPurchaseOrders = async (params = {}) => {
  await simulateDelay(DEMO_CONFIG_PURCHASES.delayMs)

  const {
    page = 1,
    pageSize = DEMO_CONFIG_PURCHASES.pageSize,
    supplier_id = '',
    status = '',
  } = params

  let filteredOrders = [...DEMO_PURCHASE_ORDERS_DATA]

  if (supplier_id) {
    filteredOrders = filteredOrders.filter(
      order => order.supplier_id === parseInt(supplier_id)
    )
  }
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status)
  }

  filteredOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))

  const total = filteredOrders.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredOrders.slice(startIndex, endIndex)

  return {
    success: true,
    data: paginatedData,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    source: 'demo',
  }
}

/**
 * Create demo purchase order
 * @param {Object} purchaseData - Purchase order data
 * @returns {Promise<Object>} - Demo creation result
 */
export const createDemoPurchaseOrder = async purchaseData => {
  await simulateDelay(900)

  const newId = Math.max(...DEMO_PURCHASE_ORDERS_DATA.map(p => p.id)) + 1

  const newPurchaseOrder = {
    id: newId,
    order_date: new Date().toISOString(),
    status: 'pending',
    ...purchaseData,
  }

  DEMO_PURCHASE_ORDERS_DATA.unshift(newPurchaseOrder)

  return {
    success: true,
    data: newPurchaseOrder,
    purchase_order_id: newId,
    message: 'Orden de compra creada correctamente',
    source: 'demo',
  }
}

/**
 * Get demo tax rates
 * @returns {Promise<Object>} - Demo tax rates result
 */
export const getDemoTaxRates = async () => {
  await simulateDelay(300)

  return {
    success: true,
    data: DEMO_TAX_RATES_DATA,
    source: 'demo',
  }
}

// =============================================================================
// CURRENCIES DEMO DATA
// =============================================================================

export const DEMO_CONFIG_CURRENCIES = {
  enabled: false, // Disabled - use real API
  fallbackOnError: true, // Use demo data when API fails
  useRealAPI: true, // Toggle real API calls
  simulateDelay: false, // Simulate network delay
  delayMs: 400, // Delay in milliseconds
}

export const DEMO_CURRENCIES_DATA = [
  {
    id: 1,
    currency_code: 'PYG',
    currency_name: 'Guaraní Paraguayo',
    name: 'Guaraní Paraguayo',
    symbol: '₲',
    decimal_places: 0,
    is_base_currency: true,
    is_enabled: true,
    flag_emoji: '🇵🇾',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    currency_code: 'USD',
    currency_name: 'Dólar Estadounidense',
    name: 'Dólar Estadounidense',
    symbol: '$',
    decimal_places: 2,
    is_base_currency: false,
    is_enabled: true,
    flag_emoji: '🇺🇸',
    exchange_rate: 7350.0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-12-15T09:30:00Z',
  },
  {
    id: 3,
    currency_code: 'EUR',
    currency_name: 'Euro',
    name: 'Euro',
    symbol: '€',
    decimal_places: 2,
    is_base_currency: false,
    is_enabled: true,
    flag_emoji: '🇪🇺',
    exchange_rate: 7850.0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-12-15T09:30:00Z',
  },
  {
    id: 4,
    currency_code: 'BRL',
    currency_name: 'Real Brasileño',
    name: 'Real Brasileño',
    symbol: 'R$',
    decimal_places: 2,
    is_base_currency: false,
    is_enabled: true,
    flag_emoji: '🇧🇷',
    exchange_rate: 1450.0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-12-15T09:30:00Z',
  },
  {
    id: 5,
    currency_code: 'ARS',
    currency_name: 'Peso Argentino',
    name: 'Peso Argentino',
    symbol: '$',
    decimal_places: 2,
    is_base_currency: false,
    is_enabled: true,
    flag_emoji: '🇦🇷',
    exchange_rate: 7.2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-12-15T09:30:00Z',
  },
  {
    id: 6,
    currency_code: 'GBP',
    currency_name: 'Libra Esterlina',
    name: 'Libra Esterlina',
    symbol: '£',
    decimal_places: 2,
    is_base_currency: false,
    is_enabled: true,
    flag_emoji: '🇬🇧',
    exchange_rate: 9250.0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-12-15T09:30:00Z',
  },
  {
    id: 7,
    currency_code: 'JPY',
    currency_name: 'Yen Japonés',
    name: 'Yen Japonés',
    symbol: '¥',
    decimal_places: 0,
    is_base_currency: false,
    is_enabled: false,
    flag_emoji: '🇯🇵',
    exchange_rate: 48.5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-12-15T09:30:00Z',
  },
  {
    id: 8,
    currency_code: 'MXN',
    currency_name: 'Peso Mexicano',
    name: 'Peso Mexicano',
    symbol: '$',
    decimal_places: 2,
    is_base_currency: false,
    is_enabled: false,
    flag_emoji: '🇲🇽',
    exchange_rate: 420.0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-12-15T09:30:00Z',
  },
]

// In-memory currencies store for demo CRUD operations
let demoCurrenciesStore = [...DEMO_CURRENCIES_DATA]
let demoCurrencyIdCounter = DEMO_CURRENCIES_DATA.length + 1

/**
 * Get demo currencies
 * @returns {Array} - Demo currencies list
 */
export const getDemoCurrencies = () => {
  return [...demoCurrenciesStore]
}

/**
 * Create demo currency
 * @param {Object} currencyData - Currency data to create
 * @returns {Object} - Created currency
 */
export const createDemoCurrency = currencyData => {
  const newCurrency = {
    id: demoCurrencyIdCounter++,
    currency_code: currencyData.currency_code?.toUpperCase() || '',
    currency_name: currencyData.currency_name || currencyData.name || '',
    name: currencyData.currency_name || currencyData.name || '',
    symbol: currencyData.symbol || '',
    decimal_places: currencyData.decimal_places ?? 2,
    is_base_currency: false,
    is_enabled: currencyData.is_enabled ?? true,
    flag_emoji: currencyData.flag_emoji || '🏳️',
    exchange_rate: currencyData.exchange_rate || 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  demoCurrenciesStore.push(newCurrency)
  return newCurrency
}

/**
 * Update demo currency
 * @param {number} id - Currency ID
 * @param {Object} currencyData - Updated currency data
 * @returns {Object} - Updated currency
 */
export const updateDemoCurrency = (id, currencyData) => {
  const index = demoCurrenciesStore.findIndex(c => c.id === id)
  if (index === -1) {
    throw new Error('Moneda no encontrada')
  }

  const updated = {
    ...demoCurrenciesStore[index],
    ...currencyData,
    currency_code:
      currencyData.currency_code?.toUpperCase() ||
      demoCurrenciesStore[index].currency_code,
    updated_at: new Date().toISOString(),
  }

  // Sync name fields
  if (currencyData.currency_name) {
    updated.name = currencyData.currency_name
  } else if (currencyData.name) {
    updated.currency_name = currencyData.name
  }

  demoCurrenciesStore[index] = updated
  return updated
}

/**
 * Delete demo currency
 * @param {number} id - Currency ID
 * @returns {boolean} - Success status
 */
export const deleteDemoCurrency = id => {
  const index = demoCurrenciesStore.findIndex(c => c.id === id)
  if (index === -1) {
    throw new Error('Moneda no encontrada')
  }

  // Prevent deleting base currency
  if (demoCurrenciesStore[index].is_base_currency) {
    throw new Error('No se puede eliminar la moneda base del sistema')
  }

  demoCurrenciesStore.splice(index, 1)
  return true
}

/**
 * Reset demo currencies to initial state
 */
export const resetDemoCurrencies = () => {
  demoCurrenciesStore = [...DEMO_CURRENCIES_DATA]
  demoCurrencyIdCounter = DEMO_CURRENCIES_DATA.length + 1
}
