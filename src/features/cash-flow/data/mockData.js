export const chartData = [
  { date: '01 Oct', inflows: 400000, outflows: 240000, net: 160000 },
  { date: '05 Oct', inflows: 300000, outflows: 139800, net: 160200 },
  { date: '10 Oct', inflows: 200000, outflows: 980000, net: -780000 },
  { date: '15 Oct', inflows: 278000, outflows: 390800, net: -112800 },
  { date: '20 Oct', inflows: 189000, outflows: 480000, net: -291000 },
  { date: '25 Oct', inflows: 239000, outflows: 380000, net: -141000 },
  { date: '30 Oct', inflows: 349000, outflows: 430000, net: -81000 },
];

export const miniBarData = [
  { value: 40 }, { value: 60 }, { value: 30 }, { value: 80 }, { value: 50 }, { value: 70 }
];

export const pendingPayments = [
  {
    date: 'Lunes, 14 de Octubre',
    isToday: true,
    subtotal: 85420.00,
    items: [
      { id: 1, name: 'Amazon Web Services', code: 'AM', category: 'Tecnología / SaaS', amount: 12450.00, priority: 'PRIORIDAD ALTA', description: 'Factura #AWS-2023-9921' },
      { id: 2, name: 'Microsoft Azure Business', code: 'MS', category: 'Infraestructura', amount: 72970.00, priority: 'OPERATIVO', description: 'Factura #MS-102-ABB' }
    ]
  },
  {
    date: 'Mañana, Martes 15 de Octubre',
    isToday: false,
    subtotal: 12100.00,
    items: [
      { id: 3, name: 'Endesa S.A.', code: 'EN', category: 'Servicios Básicos', amount: 12100.00, priority: 'RECURRENTE', description: 'Suministros Oficina Central' }
    ]
  }
];

export const bankPositions = [
  { name: 'Santander Corporate', account: 'CUENTA *8829', amount: '$1.2M' },
  { name: 'BBVA Operativa', account: 'CUENTA *4412', amount: '$450.8k' },
  { name: 'HSBC Internacional', account: 'CUENTA *0091', amount: '$210.0k' }
];
