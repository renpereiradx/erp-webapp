/**
 * Mock data for Accounts Payable Dashboard
 * Extracted from Stitch design.
 */

export const accountsPayableData = {
  lastUpdate: "24 de Mayo, 2024 - 09:45 AM",
  kpis: [
    {
      id: "total-pending",
      title: "Total Pendiente",
      value: 4820150.00,
      currency: "USD",
      trend: "+12.5%",
      trendType: "success",
      icon: "account_balance_wallet",
      subtitle: "vs. mes anterior"
    },
    {
      id: "total-overdue",
      title: "Total Vencido",
      value: 842300.00,
      currency: "USD",
      trend: "18 facturas",
      trendType: "danger",
      icon: "priority_high",
      subtitle: "requieren atención inmediata",
      critical: true
    },
    {
      id: "weekly-payments",
      title: "Pagos esta Semana",
      value: 1250000.00,
      currency: "USD",
      icon: "calendar_today",
      subtitle: "Flujo de caja proyectado para 7 días"
    },
    {
      id: "compliance-rate",
      title: "Tasa de Cumplimiento",
      value: 94.2,
      isPercentage: true,
      icon: "speed",
      progress: 94.2
    }
  ],
  aging: [
    { label: "0 - 30 Días", amount: 2540000.00, percentage: 52, color: "bg-primary" },
    { label: "31 - 60 Días", amount: 1100000.00, percentage: 23, color: "bg-primary/70" },
    { label: "61 - 90 Días", amount: 750000.00, percentage: 15, color: "bg-fluent-warning" },
    { label: "Más de 90 Días", amount: 430150.00, percentage: 10, color: "bg-fluent-danger", critical: true }
  ],
  agingStats: {
    total: "$4.82M",
    onTime: "75%",
    critical: "10%",
    avgDays: "42 Días"
  },
  upcomingPayments: [
    {
      id: "p1",
      date: { month: "MAY", day: "25" },
      vendor: "AWS Cloud Services",
      invoice: "#INV-9021",
      amount: 12450.00,
      status: "Programado",
      statusType: "info"
    },
    {
      id: "p2",
      date: { month: "MAY", day: "26" },
      vendor: "Starlight Logistics",
      invoice: "#SL-4412",
      amount: 84000.00,
      status: "Urgente",
      statusType: "danger"
    },
    {
      id: "p3",
      date: { month: "MAY", day: "28" },
      vendor: "Office Furniture Co.",
      invoice: "#OF-882",
      amount: 5200.00,
      status: "Pendiente",
      statusType: "neutral"
    },
    {
      id: "p4",
      date: { month: "MAY", day: "28" },
      vendor: "SoftDev Partners",
      invoice: "#SDP-0012",
      amount: 340000.00,
      status: "Pendiente",
      statusType: "neutral"
    }
  ],
  topVendors: [
    {
      id: "v1",
      name: "Global Logistics Solutions S.A.",
      rfc: "GLS901230HB1",
      totalBalance: 1240000.00,
      overdueAmount: 215000.00,
      nextPayment: "25/05/2024",
      priority: "Crítico",
      priorityType: "danger"
    },
    {
      id: "v2",
      name: "Tech Solutions Services Inc.",
      rfc: "TSS050615K92",
      totalBalance: 850000.00,
      overdueAmount: 0.00,
      nextPayment: "28/05/2024",
      priority: "Media",
      priorityType: "info"
    },
    {
      id: "v3",
      name: "Office Depot Corporativo",
      rfc: "ODC121212882",
      totalBalance: 420500.00,
      overdueAmount: 45000.00,
      nextPayment: "01/06/2024",
      priority: "Alta",
      priorityType: "warning"
    },
    {
      id: "v4",
      name: "Prime Energy Power",
      rfc: "PEP990101XYZ",
      totalBalance: 315000.00,
      overdueAmount: 0.00,
      nextPayment: "05/06/2024",
      priority: "Baja",
      priorityType: "neutral"
    },
    {
      id: "v5",
      name: "Marketing Masters S.A.",
      rfc: "MMS0810103A1",
      totalBalance: 185200.00,
      overdueAmount: 0.00,
      nextPayment: "02/06/2024",
      priority: "Baja",
      priorityType: "neutral"
    }
  ]
};
