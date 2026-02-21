export const supplierData = {
  id: 'PRV-8820',
  name: 'Suministros Industriales S.A.',
  location: 'Ciudad de México, MX',
  email: 'contacto@suministros-ind.mx',
  logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDe2QTxzZ89a5V4fxyYTWP_qzjPwQtaLYHhcHwjZM4WYSbyo4x52veAY--gHLwyfYlZ-qCW1QYQ-i7-OncCXTcgW_M-lFG0i3GrFbWKUgyCnOhw22uVB42g09G2ABqSF-u-rUbt7beXYdCM4TexjMia9Lo1B4Sc9MncYvn9mVSsDMBuBR-fq6___KJ5OkYZNTbTU28XIrhedAG5X-v52tlttc8PCt_04Jm0oKg0Th62HZ7Z2FfVoFGSws_fBPYmYqzTq0sshGx_Sg',
  stats: {
    totalPending: 1248500.00,
    totalOverdue: 342100.00,
    dpo: 42,
    shareOfPayables: 18.4
  },
  rating: {
    score: 4.8,
    stars: 4.5,
    description: 'El proveedor mantiene una salud financiera sólida. A pesar de los retrasos actuales ($342k), el histórico de 24 meses muestra cumplimiento del 92% en términos pactados. Se recomienda mantener el límite de crédito actual.'
  },
  terms: {
    base: 'Net 30 / 60',
    oldestInvoice: 'F-99201 (45 días)',
    creditLimit: 2000000.00,
    availableCredit: 751500.00
  },
  invoices: [
    { id: 'FAC-2023-8812', date: '12 May 2024', originalAmount: 45000.00, pendingAmount: 45000.00, dueDate: 'Vencida (5 días)', status: 'Atrasado', isOverdue: true },
    { id: 'FAC-2023-8815', date: '20 May 2024', originalAmount: 128400.00, pendingAmount: 128400.00, dueDate: '19 Jun 2024', status: 'En Proceso', isOverdue: false },
    { id: 'FAC-2023-8818', date: '01 Jun 2024', originalAmount: 250000.00, pendingAmount: 150000.00, dueDate: '01 Jul 2024', status: 'Parcialmente Pagado', isOverdue: false },
    { id: 'FAC-2023-8822', date: '10 Jun 2024', originalAmount: 56000.00, pendingAmount: 56000.00, dueDate: '10 Jul 2024', status: 'Borrador', isOverdue: false }
  ],
  trend: [
    { month: 'Enero', total: 600000, overdue: 150000 },
    { month: 'Febrero', total: 825000, overdue: 75000 },
    { month: 'Marzo', total: 1275000, overdue: 225000, isCurrent: true },
    { month: 'Abril', total: 900000, overdue: 300000 },
    { month: 'Mayo', total: 1050000, overdue: 375000 },
    { month: 'Junio', total: 1350000, overdue: 525000 }
  ]
};
