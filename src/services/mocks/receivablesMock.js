/**
 * Centralized Mock Data for Receivables Module
 * Currency: PYG (Guaraníes)
 * Updated with redundant naming for total compatibility.
 */

export const summaryData = {
  total_pending: 450000000,
  total_overdue: 200000000,
  total_count: 52,
  overdue_count: 12,
  average_days_to_collect: 32.5,
  collection_rate: 76.8,
  currency: 'PYG',
  aging_summary: {
    current: { amount: 250000000, count: 35, percentage: 55.56 },
    days_30_60: { amount: 100000000, count: 8, percentage: 22.22 },
    days_60_90: { amount: 60000000, count: 6, percentage: 13.33 },
    over_90_days: { amount: 40000000, count: 3, percentage: 8.89 },
  },
}

export const agingData = [
  { label: '0-30 Días', amount: '250M', value: 250000000, color: 'bg-emerald-500', height: '60%' },
  { label: '31-60 Días', amount: '100M', value: 100000000, color: 'bg-yellow-400', height: '35%' },
  { label: '61-90 Días', amount: '60M', value: 60000000, color: 'bg-orange-500', height: '20%' },
  { label: '90+ Días', amount: '40M', value: 40000000, color: 'bg-red-500', height: '15%' },
]

export const debtorsData = [
  {
    client_id: 'client_001',
    client_name: 'Distribuidora San José S.A.',
    total_pending: 120000000,
    total_overdue: 85000000,
    pending_count: 12,
    payment_behavior: 'POOR',
    last_payment_date: '2023-12-15'
  },
  {
    client_id: 'client_002',
    client_name: 'Comercial El Sol',
    total_pending: 85000000,
    total_overdue: 15000000,
    pending_count: 5,
    payment_behavior: 'REGULAR',
    last_payment_date: '2024-01-10'
  }
]

export const forecastData = [180000000, 120000000, 95000000, 45000000]

export const masterListData = [
  {
    id: 'FAC-001-2024',
    client_id: 'client_001',
    client_name: 'Distribuidora San José S.A.',
    clientName: 'Distribuidora San José S.A.', // Redundant for safety
    sale_date: '2023-11-15T10:00:00Z',
    due_date: '2023-12-15T10:00:00Z',
    original_amount: 45000000,
    pending_amount: 45000000,
    status: 'OVERDUE',
    days_overdue: 82
  },
  {
    id: 'FAC-045-2024',
    client_id: 'client_002',
    client_name: 'Comercial El Sol',
    clientName: 'Comercial El Sol', // Redundant for safety
    sale_date: '2024-01-01T10:00:00Z',
    due_date: '2024-01-31T10:00:00Z',
    original_amount: 25000000,
    pending_amount: 15000000,
    status: 'PARTIAL',
    days_overdue: 35
  },
  {
    id: 'FAC-102-2024',
    client_id: 'client_003',
    client_name: 'Logística Paraguay S.R.L.',
    clientName: 'Logística Paraguay S.R.L.',
    sale_date: '2024-02-10T10:00:00Z',
    due_date: '2024-03-10T10:00:00Z',
    original_amount: 30000000,
    pending_amount: 30000000,
    status: 'PENDING',
    days_overdue: 0
  },
  {
    id: 'FAC-156-2024',
    client_id: 'client_004',
    client_name: 'Supermercados del Este',
    clientName: 'Supermercados del Este',
    sale_date: '2024-01-15T10:00:00Z',
    due_date: '2024-02-15T10:00:00Z',
    original_amount: 12000000,
    pending_amount: 0,
    status: 'PAID',
    days_overdue: 0
  }
]

export const detailData = {
  id: 'FAC-001-2024',
  sale_order_id: 'VTA-8821',
  client_id: 'client_001',
  client_name: 'Distribuidora San José S.A.',
  client_phone: '+595 981 123 456',
  client_email: 'contabilidad@sanjose.com.py',
  client_address: 'Avda. Eusebio Ayala 1234, Asunción',
  tax_id: '80012345-6',
  sale_date: '2023-11-15T10:00:00Z',
  due_date: '2023-12-15T10:00:00Z',
  original_amount: 45000000,
  paid_amount: 0,
  pending_amount: 45000000,
  days_overdue: 82,
  status: 'OVERDUE',
  currency: 'PYG',
  payment_history: [],
}

export const clientProfileData = {
  client: {
    name: 'Distribuidora San José S.A.',
    id: '8821',
    status: 'Cuenta Activa',
    address: 'Avda. Eusebio Ayala 1234, Asunción, Paraguay',
    contact: 'Lic. Jorge Benítez (Gerente Financiero)',
    phone: '+595 981 123 456',
    rep: 'Michael Ross',
    taxId: '80012345-6'
  },
  risk: {
    score: 35,
    level: 'Riesgo Alto',
    recommendation: 'Suspender crédito temporalmente. Se requiere pago del 50% de la deuda vencida antes de nuevos despachos.'
  },
  metrics: {
    outstanding: '120.000.000',
    limit: '150.000.000',
    avgDays: '58 Días',
    lastPayment: '5.000.000',
    utilization: 80
  },
  aging: [
    { label: 'Corriente', amount: '35M', width: '29%', colorClass: 'aging-bar__segment--current', title: 'Corriente: 35.000.000' },
    { label: '31-60 Días', amount: '45M', width: '37%', colorClass: 'aging-bar__segment--31-60', title: '31-60 Días: 45.000.000' },
    { label: '>90 Días', amount: '40M', width: '34%', colorClass: 'aging-bar__segment--90', title: '>90 Días: 40.000.000' }
  ],
  invoices: [
    { id: 'FAC-001-2024', date: '15 Nov, 2023', due: '15 Dic, 2023', amount: '45.000.000', balance: '45.000.000', status: 'Vencido >60' },
    { id: 'FAC-088-2024', date: '01 Ene, 2024', due: '01 Feb, 2024', amount: '40.000.000', balance: '40.000.000', status: 'Vencido 30-60' },
    { id: 'FAC-105-2024', date: '15 Feb, 2024', due: '15 Mar, 2024', amount: '35.000.000', balance: '35.000.000', status: 'Corriente' }
  ]
};

export const agingReportData = [
  { range: '0-30 Días', amount: 250000000, count: 45, percentage: 55.56 },
  { range: '31-60 Días', amount: 100000000, count: 12, percentage: 22.22 },
  { range: '61-90 Días', amount: 60000000, count: 8, percentage: 13.33 },
  { range: '90+ Días', amount: 40000000, count: 5, percentage: 8.89 },
];

export const overdueData = {
  items: [
    {
      id: 'FAC-001-2024',
      client_name: 'Distribuidora San José S.A.',
      pending_amount: 45000000,
      days_overdue: 82,
      status: 'CRITICAL'
    },
    {
      id: 'FAC-045-2024',
      client_name: 'Comercial El Sol',
      pending_amount: 15000000,
      days_overdue: 35,
      status: 'WARNING'
    }
  ],
  pagination: { page: 1, page_size: 10, total_items: 2, total_pages: 1 }
};
