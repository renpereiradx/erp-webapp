export const agingData = {
  summary: {
    totalDebt: 4285120.45,
    lastUpdate: '24 de Mayo, 2024',
    distribution: [
      { label: 'Corriente (0-30 d)', amount: 2356816.25, percentage: 55, color: 'bg-green-500' },
      { label: 'Vencido (31-60 d)', amount: 857024.09, percentage: 20, color: 'bg-amber-400' },
      { label: 'Vencido (61-90 d)', amount: 642768.07, percentage: 15, color: 'bg-orange-500' },
      { label: 'Crítico (+90 d)', amount: 428512.04, percentage: 10, color: 'bg-red-500' }
    ]
  },
  kpis: {
    dpo: { value: 42, trend: 2.4, previous: 41 },
    overduePercentage: { value: 15.4, trend: 1.2, target: 10 },
    criticalRisk: { value: 450000, trend: -12000, providersCount: 8 }
  },
  providers: [
    {
      name: 'Global Tech Solutions S.A.',
      corriente: 142500.00,
      v31_60: 0,
      v61_90: 0,
      v91plus: 0,
      total: 142500.00,
      risk: 'Mínimo'
    },
    {
      name: 'Constructora del Norte & Cía',
      corriente: 85200.00,
      v31_60: 124000.00,
      v61_90: 0,
      v91plus: 0,
      total: 209200.00,
      risk: 'Moderado'
    },
    {
      name: 'Insumos Industriales MX',
      corriente: 12000.00,
      v31_60: 15400.00,
      v61_90: 88900.00,
      v91plus: 310000.00,
      total: 426300.00,
      risk: 'Crítico'
    },
    {
      name: 'Logística Express Internacional',
      corriente: 320000.00,
      v31_60: 0,
      v61_90: 0,
      v91plus: 0,
      total: 320000.00,
      risk: 'Mínimo'
    },
    {
      name: 'Servicios Energéticos del Sur',
      corriente: 45000.00,
      v31_60: 18000.00,
      v61_90: 0,
      v91plus: 0,
      total: 63000.00,
      risk: 'Moderado'
    }
  ],
  trend: {
    total: [100, 80, 90, 60, 40, 70, 50, 65], // Simplified values for points
    overdue: [200, 190, 210, 180, 170, 190, 160, 180]
  }
};
