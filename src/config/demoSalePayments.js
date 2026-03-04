/**
 * Demo data for Sale Payments
 */
import API_CONFIG from '@/config/api.config';

export const DEMO_SALES_PAYMENTS = [
  {
    id: 2001,
    client: {
      id: 1,
      name: 'Empresa Constructora S.A.',
      document_id: '80012345-6',
      contact: 'Carlos Méndez'
    },
    total_amount: 15000000,
    amount_paid: 5000000,
    balance_due: 10000000,
    currency: 'PYG',
    payment_status: 'partial',
    payment_progress: 33.33,
    issue_date: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'completed',
    items: [
      { id: 1, name: 'Cemento Portland', quantity: 100, unit_price: 65000, total: 6500000 },
      { id: 2, name: 'Varillas de Hierro 12mm', quantity: 200, unit_price: 42500, total: 8500000 }
    ],
    payments: [
      {
        id: 801,
        amount: 5000000,
        registered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        recorded_by: 'cajero1',
        status: 'completed',
        reference: 'TRF-00123',
        cash_register_id: 1
      }
    ]
  },
  {
    id: 2002,
    client: {
      id: 2,
      name: 'María González',
      document_id: '4567890',
      contact: '0981-123-456'
    },
    total_amount: 3500000,
    amount_paid: 3500000,
    balance_due: 0,
    currency: 'PYG',
    payment_status: 'paid',
    payment_progress: 100,
    issue_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'completed',
    items: [
      { id: 3, name: 'Pintura Blanca 20L', quantity: 5, unit_price: 700000, total: 3500000 }
    ],
    payments: [
      {
        id: 802,
        amount: 3500000,
        registered_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        recorded_by: 'cajero2',
        status: 'completed',
        reference: 'EFE-0045',
        cash_register_id: 2
      }
    ]
  },
  {
    id: 2003,
    client: {
      id: 3,
      name: 'Ferretería El Maestro',
      document_id: '80055544-1',
      contact: 'Pedro Giménez'
    },
    total_amount: 8200000,
    amount_paid: 0,
    balance_due: 8200000,
    currency: 'PYG',
    payment_status: 'pending',
    payment_progress: 0,
    issue_date: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'completed',
    items: [
      { id: 4, name: 'Herramientas Varias', quantity: 1, unit_price: 8200000, total: 8200000 }
    ],
    payments: []
  }
];

export const DEMO_SALES_RESPONSE = {
  data: DEMO_SALES_PAYMENTS,
  pagination: {
    page: 1,
    page_size: 10,
    total_records: DEMO_SALES_PAYMENTS.length,
    total_pages: 1
  }
};

export const IS_DEMO_MODE = API_CONFIG.useDemo;
