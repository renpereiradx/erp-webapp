/**
 * Datos de ejemplo para el perfil de crédito del cliente.
 * Traducidos al español para consistencia con el requerimiento.
 */

export const clientProfileMock = {
  client: {
    name: 'Acme Corp Logistics',
    id: '8821',
    status: 'Cuenta Activa',
    address: '1200 Logistics Blvd, Suite 400, San Diego, CA 92101, USA',
    contact: 'Sarah Jenkins (CFO)',
    phone: '+1 (619) 555-0123',
    rep: 'Michael Ross',
    taxId: 'US-99-882145'
  },
  risk: {
    score: 72,
    level: 'Riesgo Medio',
    recommendation: 'Monitorear de cerca. Solicitar pago parcial antes de liberar el próximo envío debido a retrasos en pagos en el Q3.'
  },
  metrics: {
    outstanding: '$124,500',
    limit: '$150,000',
    avgDays: '45 Días',
    lastPayment: '$15,200',
    utilization: 83
  },
  aging: [
    { label: 'Corriente', amount: '$68k', width: '55%', colorClass: 'aging-bar__segment--current', title: 'Corriente: $68,475' },
    { label: '1-30 Días', amount: '$31k', width: '25%', colorClass: 'aging-bar__segment--1-30', title: '1-30 Días: $31,125' },
    { label: '31-60 Días', amount: '$14k', width: '12%', colorClass: 'aging-bar__segment--31-60', title: '31-60 Días: $14,940' },
    { label: '>90 Días', amount: '$10k', width: '8%', colorClass: 'aging-bar__segment--90', title: '>90 Días: $10,000' }
  ],
  invoices: [
    { id: 'INV-2023-001', date: '12 Oct, 2023', due: '12 Nov, 2023', amount: '$10,000.00', balance: '$10,000.00', status: 'Vencido >90' },
    { id: 'INV-2023-045', date: '01 Dic, 2023', due: '01 Ene, 2024', amount: '$14,940.00', balance: '$14,940.00', status: 'Vencido 30-60' },
    { id: 'INV-2024-002', date: '15 Ene, 2024', due: '15 Feb, 2024', amount: '$45,000.00', balance: '$31,125.00', status: 'Vencido 1-30' },
    { id: 'INV-2024-012', date: '10 Feb, 2024', due: '10 Mar, 2024', amount: '$68,475.00', balance: '$68,475.00', status: 'Corriente' }
  ]
};
