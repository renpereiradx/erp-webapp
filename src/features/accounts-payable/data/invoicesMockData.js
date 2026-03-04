/**
 * Mock data for Invoices Master List
 * Extracted from Stitch design description.
 */

export const invoicesMasterData = {
  invoices: [
    {
      id: "FAC-2024-089",
      vendor: "Logitech G - Latam",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCy5VNeQaRkwFuRves3CqziHUWVMQqPk3iT76ejmgkSg-h-ZQ6W0IwrK_RtxEjC6HrTMjsBZmANY7WcjAd1lllAvLQwf__fwm5VaXFA2iP09hpCIaqibP4bkCQy0YU1tW-L8dukiVIBIq_AHEVlMCUJvionQ5llPLxY6mFBiAy0GvNGMjTqwvhJHH9FQGnlrKZ4V_kHJ73AIb-V6htjK0dXUZD4FKDHT6_FKbhIE-IHgtunFT7nvV4Glp98E7PUgFwSWNSyRFOTSw",
      orderDate: "12 Oct, 2024",
      dueDate: "05 Nov, 2024",
      totalAmount: 12450.00,
      pendingAmount: 4120.00,
      status: "Vencido",
      daysOverdue: 12,
      statusType: "danger",
      priority: "ALTA",
      priorityType: "danger"
    },
    {
      id: "FAC-2024-092",
      vendor: "Amazon Web Services",
      initials: "AM",
      orderDate: "01 Nov, 2024",
      dueDate: "30 Nov, 2024",
      totalAmount: 3200.00,
      pendingAmount: 3200.00,
      status: "Pendiente",
      daysOverdue: 13,
      statusType: "info",
      priority: "MEDIA",
      priorityType: "info"
    },
    {
      id: "FAC-2024-095",
      vendor: "DHL Global Forwarding",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_Lq4VlxuakF5O8kmtJ2mUdsnySB9AlvnVQn-MsuxVRMtfulmSknXP-mYmarOtZOB0B0oTONhSMm6oqFimbh8Xe-4FIzY3aTOJToRaB96Jw2vaRzvBKnG50Vl5hxEtePO7XRYAYp1ymatGcxNoy2KgANWTJmcXprjEtDqQtCLZAldckvrPgIJEFO2D483-jqgrhZ0TRi8WHZAUkhKUlHinawPyClVpw_hqsn1UQi-WVp3MxS7ZPbRMlLEwwmCDuH0hF4sMM4UO4Q",
      orderDate: "14 Nov, 2024",
      dueDate: "14 Dic, 2024",
      totalAmount: 1840.50,
      pendingAmount: 840.50,
      status: "Parcial",
      daysOverdue: 27,
      statusType: "warning",
      priority: "BAJA",
      priorityType: "neutral"
    },
    {
      id: "FAC-2024-101",
      vendor: "Microsoft Azure",
      initials: "MS",
      orderDate: "16 Nov, 2024",
      dueDate: "16 Dic, 2024",
      totalAmount: 5400.00,
      pendingAmount: 5400.00,
      status: "Pendiente",
      daysOverdue: 29,
      statusType: "info",
      priority: "MEDIA",
      priorityType: "info"
    },
    {
      id: "FAC-2024-105",
      vendor: "Stripe Payments",
      initials: "ST",
      orderDate: "10 Nov, 2024",
      dueDate: "10 Dic, 2024",
      totalAmount: 450.00,
      pendingAmount: 450.00,
      status: "Pendiente",
      daysOverdue: 23,
      statusType: "info",
      priority: "BAJA",
      priorityType: "neutral"
    }
  ]
};
