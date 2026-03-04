/**
 * Demo data for Purchase Payments
 */
import API_CONFIG from '@/config/api.config';

export const DEMO_PURCHASE_ORDERS = [
  {
    id: 1001,
    purchase_order_id: 1001,
    supplier_id: 1,
    supplier_name: 'Proveedor Global S.A.',
    supplier_contact: 'Juan Alvarenga',
    supplier_email: 'ventas@global.com',
    supplier_phone: '+595 21 555 001',
    order_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    total_amount: 5000000,
    amount_paid: 2000000,
    remaining_amount: 3000000,
    currency: 'PYG',
    status: 'partial',
    priority: 'high',
    notes: 'Pedido urgente de insumos básicos',
    payments: [
      {
        id: 501,
        amount: 2000000,
        registered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        recorded_by: 'admin@erp.com',
        status: 'completed',
        notes: 'Entrega inicial'
      }
    ],
    products: [
      { id: 1, product_name: 'Resma Papel A4', quantity: 100, unit_price: 35000, total_price: 3500000 },
      { id: 2, product_name: 'Tóner HP 85A', quantity: 5, unit_price: 300000, total_price: 1500000 }
    ]
  },
  {
    id: 1002,
    purchase_order_id: 1002,
    supplier_id: 2,
    supplier_name: 'TecnoWorld Import',
    supplier_contact: 'María Luz',
    order_date: new Date(Date.now() - 86400000 * 10).toISOString(),
    total_amount: 12500000,
    amount_paid: 12500000,
    remaining_amount: 0,
    currency: 'PYG',
    status: 'completed',
    priority: 'medium',
    payments: [
      {
        id: 502,
        amount: 12500000,
        registered_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        recorded_by: 'vendedor@erp.com',
        status: 'completed'
      }
    ],
    products: [
      { id: 3, product_name: 'Laptop Dell Latitude', quantity: 2, unit_price: 6250000, total_price: 12500000 }
    ]
  },
  {
    id: 1003,
    purchase_order_id: 1003,
    supplier_id: 3,
    supplier_name: 'Distribuidora del Este',
    order_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    total_amount: 850000,
    amount_paid: 0,
    remaining_amount: 850000,
    currency: 'PYG',
    status: 'pending',
    priority: 'low',
    products: [
      { id: 4, product_name: 'Café en granos 1kg', quantity: 10, unit_price: 85000, total_price: 850000 }
    ]
  }
];

export const IS_DEMO_MODE = API_CONFIG.useDemo;
