/**
 * Constantes y datos mock para el sistema de reservas y ventas
 * Centraliza todos los datos de prueba para facilitar el mantenimiento
 * En producción, estos datos vendrían de la API
 */

// Datos mock de clientes
export const MOCK_CLIENTS = [
  { id: 1, name: 'Ana García', email: 'ana.garcia@email.com', phone: '555-0101' },
  { id: 2, name: 'Carlos López', email: 'carlos.lopez@email.com', phone: '555-0102' },
  { id: 3, name: 'María Rodríguez', email: 'maria.rodriguez@email.com', phone: '555-0103' },
  { id: 4, name: 'Juan Martínez', email: 'juan.martinez@email.com', phone: '555-0104' },
  { id: 5, name: 'Laura Sánchez', email: 'laura.sanchez@email.com', phone: '555-0105' }
];

// Datos mock de servicios/productos para reservas
export const MOCK_SERVICES = [
  { 
    id: 1, 
    name: 'Consulta General', 
    price: 50.00, 
    duration: 30,
    category: 'consulta',
    description: 'Consulta médica general'
  },
  { 
    id: 2, 
    name: 'Limpieza Dental', 
    price: 80.00, 
    duration: 45,
    category: 'dental',
    description: 'Limpieza dental profesional'
  },
  { 
    id: 3, 
    name: 'Revisión Especializada', 
    price: 120.00, 
    duration: 60,
    category: 'especialidad',
    description: 'Consulta con especialista'
  },
  { 
    id: 4, 
    name: 'Terapia Física', 
    price: 90.00, 
    duration: 45,
    category: 'terapia',
    description: 'Sesión de fisioterapia'
  },
  { 
    id: 5, 
    name: 'Examen Preventivo', 
    price: 70.00, 
    duration: 30,
    category: 'preventivo',
    description: 'Examen médico preventivo'
  }
];

// Datos mock de productos para ventas
export const MOCK_PRODUCTS = [
  { 
    id: 1, 
    name: 'Paracetamol 500mg', 
    price: 15.50, 
    category: 'medicamentos',
    stock: 100,
    description: 'Analgésico y antipirético'
  },
  { 
    id: 2, 
    name: 'Vendas Elásticas', 
    price: 25.00, 
    category: 'material_medico',
    stock: 50,
    description: 'Vendas elásticas 10cm x 4.5m'
  },
  { 
    id: 3, 
    name: 'Termómetro Digital', 
    price: 120.00, 
    category: 'equipos',
    stock: 20,
    description: 'Termómetro digital infrarrojo'
  },
  { 
    id: 4, 
    name: 'Alcohol Isopropílico', 
    price: 18.75, 
    category: 'antisepticos',
    stock: 75,
    description: 'Alcohol isopropílico 70% - 250ml'
  },
  { 
    id: 5, 
    name: 'Mascarillas Quirúrgicas', 
    price: 35.00, 
    category: 'proteccion',
    stock: 200,
    description: 'Caja de 50 mascarillas quirúrgicas'
  },
  { 
    id: 6, 
    name: 'Ibuprofeno 400mg', 
    price: 22.50, 
    category: 'medicamentos',
    stock: 80,
    description: 'Antiinflamatorio no esteroideo'
  },
  { 
    id: 7, 
    name: 'Jeringas Desechables', 
    price: 28.00, 
    category: 'material_medico',
    stock: 150,
    description: 'Paquete de 100 jeringas 5ml'
  },
  { 
    id: 8, 
    name: 'Gel Antibacterial', 
    price: 45.00, 
    category: 'antisepticos',
    stock: 60,
    description: 'Gel antibacterial 500ml'
  }
];

// Categorías de servicios
export const SERVICE_CATEGORIES = [
  { id: 'consulta', name: 'Consultas', color: '#3b82f6' },
  { id: 'dental', name: 'Dental', color: '#10b981' },
  { id: 'especialidad', name: 'Especialidades', color: '#f59e0b' },
  { id: 'terapia', name: 'Terapias', color: '#8b5cf6' },
  { id: 'preventivo', name: 'Preventivo', color: '#06b6d4' }
];

// Categorías de productos
export const PRODUCT_CATEGORIES = [
  { id: 'medicamentos', name: 'Medicamentos', color: '#ef4444' },
  { id: 'material_medico', name: 'Material Médico', color: '#3b82f6' },
  { id: 'equipos', name: 'Equipos', color: '#f59e0b' },
  { id: 'antisepticos', name: 'Antisépticos', color: '#10b981' },
  { id: 'proteccion', name: 'Protección', color: '#8b5cf6' }
];

// Configuración de horarios de trabajo
export const BUSINESS_HOURS = {
  start: 8, // 8:00 AM
  end: 18,  // 6:00 PM
  interval: 30, // 30 minutos entre citas
  lunchBreak: {
    start: 13, // 1:00 PM
    end: 14    // 2:00 PM
  }
};

// Configuración de impuestos
export const TAX_CONFIG = {
  rate: 0.16, // IVA 16%
  name: 'IVA',
  included: false // Si está incluido en el precio o se suma
};

// Estados de reservas
export const RESERVATION_STATES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

// Estados de ventas
export const SALE_STATES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Métodos de pago
export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Efectivo', icon: '💵' },
  { id: 'card', name: 'Tarjeta', icon: '💳' },
  { id: 'transfer', name: 'Transferencia', icon: '🏦' },
  { id: 'credit', name: 'Crédito', icon: '📋' }
];

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'ERP WebApp',
  version: '1.0.0',
  company: 'Mi Empresa',
  currency: 'MXN',
  currencySymbol: '$',
  locale: 'es-MX',
  timeZone: 'America/Mexico_City'
};

// Mensajes del sistema
export const SYSTEM_MESSAGES = {
  SUCCESS: {
    RESERVATION_CREATED: 'Reserva creada exitosamente',
    SALE_COMPLETED: 'Venta completada exitosamente',
    DATA_SAVED: 'Datos guardados correctamente'
  },
  ERROR: {
    NETWORK_ERROR: 'Error de conexión. Inténtalo de nuevo.',
    VALIDATION_ERROR: 'Por favor completa todos los campos requeridos',
    SLOT_UNAVAILABLE: 'El horario seleccionado ya no está disponible',
    INSUFFICIENT_STOCK: 'Stock insuficiente para este producto'
  },
  WARNING: {
    UNSAVED_CHANGES: 'Tienes cambios sin guardar',
    SESSION_EXPIRING: 'Tu sesión está por expirar'
  }
};

// Exportar todo como objeto para importación selectiva
export default {
  MOCK_CLIENTS,
  MOCK_SERVICES,
  MOCK_PRODUCTS,
  SERVICE_CATEGORIES,
  PRODUCT_CATEGORIES,
  BUSINESS_HOURS,
  TAX_CONFIG,
  RESERVATION_STATES,
  SALE_STATES,
  PAYMENT_METHODS,
  APP_CONFIG,
  SYSTEM_MESSAGES
};
