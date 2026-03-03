/**
 * Centralized Mock Data for Clients Module
 * Location: Paraguay (PYG)
 */

export const clientListData = [
  {
    id: 'client_001',
    name: 'Distribuidora San José S.A.',
    last_name: '',
    document_id: '80012345-6',
    status: true,
    contact: {
      email: 'contabilidad@sanjose.com.py',
      phone: '+595 981 123 456'
    },
    address: 'Avda. Eusebio Ayala 1234, Asunción',
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2023-12-20T14:30:00Z'
  },
  {
    id: 'client_002',
    name: 'Comercial El Sol',
    last_name: '',
    document_id: '80055443-2',
    status: true,
    contact: {
      email: 'ventas@elsol.com.py',
      phone: '+595 971 987 654'
    },
    address: 'Mcal. López 456, Fernando de la Mora',
    created_at: '2023-03-10T09:00:00Z',
    updated_at: '2024-01-05T11:20:00Z'
  },
  {
    id: 'client_003',
    name: 'Logística Paraguay S.R.L.',
    last_name: '',
    document_id: '80122334-1',
    status: true,
    contact: {
      email: 'logistica@py.com.py',
      phone: '+595 961 445 566'
    },
    address: 'Ruta 2 km 15, San Lorenzo',
    created_at: '2023-05-20T08:00:00Z',
    updated_at: '2024-02-15T16:45:00Z'
  },
  {
    id: 'client_004',
    name: 'Supermercados del Este',
    last_name: '',
    document_id: '80099887-0',
    status: true,
    contact: {
      email: 'compras@supereste.com.py',
      phone: '+595 983 112 233'
    },
    address: 'Avda. Perú, Ciudad del Este',
    created_at: '2023-06-01T10:00:00Z',
    updated_at: '2024-01-20T09:15:00Z'
  },
  {
    id: 'client_005',
    name: 'Industrias Fénix',
    last_name: '',
    document_id: '80144556-9',
    status: false,
    contact: {
      email: 'admin@fenix.com.py',
      phone: '+595 972 334 455'
    },
    address: 'Parque Industrial, Villeta',
    created_at: '2022-11-15T14:00:00Z',
    updated_at: '2023-11-20T10:00:00Z'
  },
  {
    id: 'client_006',
    name: 'Juan',
    last_name: 'Pérez',
    document_id: '4567890',
    status: true,
    contact: {
      email: 'juan.perez@gmail.com',
      phone: '+595 981 111 222'
    },
    address: 'Barrio Obrero, Asunción',
    created_at: '2023-08-12T11:30:00Z',
    updated_at: '2023-08-12T11:30:00Z'
  },
  {
    id: 'client_007',
    name: 'María',
    last_name: 'Gómez',
    document_id: '3456789',
    status: true,
    contact: {
      email: 'm.gomez@hotmail.com',
      phone: '+595 991 333 444'
    },
    address: 'Villa Morra, Asunción',
    created_at: '2023-10-05T15:20:00Z',
    updated_at: '2023-10-05T15:20:00Z'
  }
];

export const clientStatsData = {
  total_clients: 154,
  active_clients: 142,
  new_clients_month: 12,
  top_client_region: 'Central'
};
