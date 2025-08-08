/**
 * Constantes y datos mock para el sistema de compras
 * Centraliza todos los datos de prueba y configuraciones para compras
 * En producción, estos datos vendrían de la API
 */

// Estados de compras
export const PURCHASE_STATES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
  PARTIALLY_RECEIVED: 'partially_received'
};

// Estados con etiquetas en español
export const PURCHASE_STATE_LABELS = {
  [PURCHASE_STATES.DRAFT]: 'Borrador',
  [PURCHASE_STATES.PENDING]: 'Pendiente',
  [PURCHASE_STATES.CONFIRMED]: 'Confirmada',
  [PURCHASE_STATES.RECEIVED]: 'Recibida',
  [PURCHASE_STATES.CANCELLED]: 'Cancelada',
  [PURCHASE_STATES.PARTIALLY_RECEIVED]: 'Parcialmente Recibida'
};

// Colores para estados
export const PURCHASE_STATE_COLORS = {
  [PURCHASE_STATES.DRAFT]: 'gray',
  [PURCHASE_STATES.PENDING]: 'yellow',
  [PURCHASE_STATES.CONFIRMED]: 'blue',
  [PURCHASE_STATES.RECEIVED]: 'green',
  [PURCHASE_STATES.CANCELLED]: 'red',
  [PURCHASE_STATES.PARTIALLY_RECEIVED]: 'orange'
};

// Datos mock de proveedores (complementa supplierService)
export const MOCK_SUPPLIERS = [
  {
    id: 'supplier_001',
    name: 'Distribuidora Médica Norte',
    email: 'ventas@distmedica.com',
    phone: '+52-555-1234-567',
    contact_person: 'Dr. Roberto Sánchez',
    address: 'Av. Insurgentes Norte 1234, CDMX',
    is_active: true,
    notes: 'Proveedor principal de medicamentos'
  },
  {
    id: 'supplier_002',
    name: 'Equipos Hospitalarios SA',
    email: 'cotizaciones@equiphospital.com',
    phone: '+52-555-2345-678',
    contact_person: 'Ing. María López',
    address: 'Calle Reforma 567, Guadalajara',
    is_active: true,
    notes: 'Especialistas en equipos médicos'
  },
  {
    id: 'supplier_003',
    name: 'Insumos Clínicos del Bajío',
    email: 'compras@insumosclinicos.com',
    phone: '+52-555-3456-789',
    contact_person: 'Lic. Carlos Herrera',
    address: 'Blvd. Adolfo López Mateos 890, León',
    is_active: true,
    notes: 'Insumos clínicos y material desechable'
  },
  {
    id: 'supplier_004',
    name: 'Farmacéutica Regional',
    email: 'pedidos@farmaregional.com',
    phone: '+52-555-4567-890',
    contact_person: 'Q.F.B. Ana Ramírez',
    address: 'Zona Industrial Norte, Monterrey',
    is_active: true,
    notes: 'Medicamentos especializados'
  },
  {
    id: 'supplier_005',
    name: 'Tecnología Médica Avanzada',
    email: 'servicios@tecmedavanzada.com',
    phone: '+52-555-5678-901',
    contact_person: 'Ing. José Torres',
    address: 'Parque Tecnológico, Tijuana',
    is_active: false,
    notes: 'Proveedor inactivo - problemas de calidad'
  }
];

// Datos mock de productos para compras
export const MOCK_PURCHASE_PRODUCTS = [
  {
    id: 'prod_001',
    name: 'Paracetamol 500mg (Caja 100 tabletas)',
    category: 'Medicamentos',
    supplier_price: 85.00,
    min_order_quantity: 10,
    packaging: 'Caja',
    unit: 'caja',
    supplier_code: 'PAR-500-100'
  },
  {
    id: 'prod_002',
    name: 'Jeringas Desechables 5ml (Paquete 100)',
    category: 'Material Médico',
    supplier_price: 120.00,
    min_order_quantity: 5,
    packaging: 'Paquete',
    unit: 'paquete',
    supplier_code: 'JER-5ML-100'
  },
  {
    id: 'prod_003',
    name: 'Gasas Estériles 10x10cm (Paquete 50)',
    category: 'Material Médico',
    supplier_price: 75.50,
    min_order_quantity: 20,
    packaging: 'Paquete',
    unit: 'paquete',
    supplier_code: 'GAS-10X10-50'
  },
  {
    id: 'prod_004',
    name: 'Alcohol Isopropílico 70% (Galón)',
    category: 'Antisépticos',
    supplier_price: 180.00,
    min_order_quantity: 2,
    packaging: 'Galón',
    unit: 'galón',
    supplier_code: 'ALC-ISO-70-GAL'
  },
  {
    id: 'prod_005',
    name: 'Termómetro Digital Infrarrojo',
    category: 'Equipos',
    supplier_price: 450.00,
    min_order_quantity: 1,
    packaging: 'Unidad',
    unit: 'pieza',
    supplier_code: 'TERM-DIG-IR'
  },
  {
    id: 'prod_006',
    name: 'Mascarillas N95 (Caja 20)',
    category: 'Protección',
    supplier_price: 350.00,
    min_order_quantity: 5,
    packaging: 'Caja',
    unit: 'caja',
    supplier_code: 'MASK-N95-20'
  }
];

// Datos mock de compras
export const MOCK_PURCHASES = [
  {
    id: 'purchase_001',
    purchase_number: 'COM-2025-0001',
    supplier_id: 'supplier_001',
    supplier_name: 'Distribuidora Médica Norte',
    purchase_date: '2025-08-01',
    expected_delivery: '2025-08-08',
    status: PURCHASE_STATES.CONFIRMED,
    items: [
      {
        product_id: 'prod_001',
        product_name: 'Paracetamol 500mg (Caja 100 tabletas)',
        quantity: 50,
        unit_price: 85.00,
        total_price: 4250.00
      },
      {
        product_id: 'prod_003',
        product_name: 'Gasas Estériles 10x10cm (Paquete 50)',
        quantity: 100,
        unit_price: 75.50,
        total_price: 7550.00
      }
    ],
    subtotal: 11800.00,
    tax: 1888.00,
    total_amount: 13688.00,
    notes: 'Pedido urgente para reposición de stock',
    created_by: 'admin',
    created_at: '2025-08-01T09:00:00Z'
  },
  {
    id: 'purchase_002',
    purchase_number: 'COM-2025-0002',
    supplier_id: 'supplier_002',
    supplier_name: 'Equipos Hospitalarios SA',
    purchase_date: '2025-08-03',
    expected_delivery: '2025-08-15',
    status: PURCHASE_STATES.PENDING,
    items: [
      {
        product_id: 'prod_005',
        product_name: 'Termómetro Digital Infrarrojo',
        quantity: 10,
        unit_price: 450.00,
        total_price: 4500.00
      }
    ],
    subtotal: 4500.00,
    tax: 720.00,
    total_amount: 5220.00,
    notes: 'Actualización de equipos de diagnóstico',
    created_by: 'manager',
    created_at: '2025-08-03T14:30:00Z'
  }
];

// Configuración de impuestos para compras
export const PURCHASE_TAX_CONFIG = {
  rate: 0.16, // IVA 16%
  name: 'IVA',
  included: false,
  applies_to: 'all' // all, selected, none
};

// Términos de pago
export const PAYMENT_TERMS = [
  { id: 'immediate', name: 'Inmediato', days: 0 },
  { id: 'net_15', name: 'Neto 15 días', days: 15 },
  { id: 'net_30', name: 'Neto 30 días', days: 30 },
  { id: 'net_45', name: 'Neto 45 días', days: 45 },
  { id: 'net_60', name: 'Neto 60 días', days: 60 }
];

// Métodos de entrega
export const DELIVERY_METHODS = [
  { id: 'pickup', name: 'Recoger en almacén', cost: 0 },
  { id: 'standard', name: 'Entrega estándar', cost: 150 },
  { id: 'express', name: 'Entrega express', cost: 300 },
  { id: 'urgent', name: 'Entrega urgente', cost: 500 }
];

// Configuración de la página de compras
export const PURCHASE_PAGE_CONFIG = {
  itemsPerPage: 20,
  maxItemsPerPurchase: 50,
  autoSaveInterval: 30000, // 30 segundos
  searchDebounceTime: 500, // 500ms
  defaultCurrency: 'MXN',
  currencySymbol: '$'
};

// Mensajes específicos para compras
export const PURCHASE_MESSAGES = {
  SUCCESS: {
    CREATED: 'Compra creada exitosamente',
    UPDATED: 'Compra actualizada correctamente',
    CANCELLED: 'Compra cancelada exitosamente',
    ITEM_ADDED: 'Producto agregado al pedido',
    ITEM_REMOVED: 'Producto removido del pedido'
  },
  ERROR: {
    CREATE_FAILED: 'Error al crear la compra',
    UPDATE_FAILED: 'Error al actualizar la compra',
    CANCEL_FAILED: 'Error al cancelar la compra',
    LOAD_FAILED: 'Error al cargar las compras',
    SUPPLIER_REQUIRED: 'Debe seleccionar un proveedor',
    ITEMS_REQUIRED: 'Debe agregar al menos un producto',
    QUANTITY_INVALID: 'La cantidad debe ser mayor a 0',
    PRICE_INVALID: 'El precio debe ser mayor a 0'
  },
  WARNING: {
    UNSAVED_CHANGES: 'Tiene cambios sin guardar en la compra',
    MIN_QUANTITY: 'La cantidad es menor al mínimo requerido',
    HIGH_TOTAL: 'El total de la compra es superior al promedio',
    SUPPLIER_INACTIVE: 'El proveedor seleccionado está inactivo'
  }
};

// Validaciones
export const PURCHASE_VALIDATION_RULES = {
  supplier: {
    required: true,
    message: PURCHASE_MESSAGES.ERROR.SUPPLIER_REQUIRED
  },
  items: {
    minItems: 1,
    maxItems: PURCHASE_PAGE_CONFIG.maxItemsPerPurchase,
    message: PURCHASE_MESSAGES.ERROR.ITEMS_REQUIRED
  },
  quantity: {
    min: 1,
    max: 10000,
    message: PURCHASE_MESSAGES.ERROR.QUANTITY_INVALID
  },
  unitPrice: {
    min: 0.01,
    max: 999999.99,
    message: PURCHASE_MESSAGES.ERROR.PRICE_INVALID
  }
};

// Exportar todo como objeto para importación selectiva
export default {
  PURCHASE_STATES,
  PURCHASE_STATE_LABELS,
  PURCHASE_STATE_COLORS,
  MOCK_SUPPLIERS,
  MOCK_PURCHASE_PRODUCTS,
  MOCK_PURCHASES,
  PURCHASE_TAX_CONFIG,
  PAYMENT_TERMS,
  DELIVERY_METHODS,
  PURCHASE_PAGE_CONFIG,
  PURCHASE_MESSAGES,
  PURCHASE_VALIDATION_RULES
};
