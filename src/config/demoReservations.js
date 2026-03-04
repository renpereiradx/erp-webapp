/**
 * Demo data for Reservations and Schedules
 */
import API_CONFIG from '@/config/api.config';

export const DEMO_RESERVATIONS = [
  {
    id: 1,
    reserve_id: 1,
    product_id: 1,
    product_name: 'Cancha de Pádel 1',
    client_id: 1,
    client_name: 'Juan Pérez',
    user_email: 'admin@erp.com',
    start_time: new Date().toISOString(),
    reserve_date: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    duration: 1,
    status: 'CONFIRMED',
    total_amount: 150000,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    reserve_id: 2,
    product_id: 2,
    product_name: 'Cancha de Pádel 2',
    client_id: 2,
    client_name: 'María García',
    user_email: 'vendedor@erp.com',
    start_time: new Date(Date.now() + 7200000).toISOString(),
    reserve_date: new Date(Date.now() + 7200000).toISOString(),
    end_time: new Date(Date.now() + 10800000).toISOString(),
    duration: 1,
    status: 'PENDING',
    total_amount: 120000,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    reserve_id: 3,
    product_id: 1,
    product_name: 'Cancha de Pádel 1',
    client_id: 3,
    client_name: 'Carlos Rodríguez',
    user_email: 'admin@erp.com',
    start_time: new Date(Date.now() + 86400000).toISOString(),
    reserve_date: new Date(Date.now() + 86400000).toISOString(),
    end_time: new Date(Date.now() + 93600000).toISOString(),
    duration: 2,
    status: 'CANCELLED',
    total_amount: 250000,
    created_at: new Date().toISOString()
  }
];

export const DEMO_SCHEDULES = [
  {
    id: 101,
    product_id: 1,
    product_name: 'Cancha de Pádel 1',
    start_time: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    is_available: true
  },
  {
    id: 102,
    product_id: 1,
    product_name: 'Cancha de Pádel 1',
    start_time: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    is_available: false,
    user_name: 'Juan Pérez'
  },
  {
    id: 103,
    product_id: 2,
    product_name: 'Cancha de Pádel 2',
    start_time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
    is_available: true
  }
];

export const IS_DEMO_MODE = API_CONFIG.useDemo;
