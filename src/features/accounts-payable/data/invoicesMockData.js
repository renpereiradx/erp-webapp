/**
 * Mock data for Invoices Master List
 * Extracted from Stitch design description.
 */

export const invoicesMasterData = {
  invoices: [
    {
      id: "INV-2024-001",
      vendor: "Global Logistics Solutions S.A.",
      orderDate: "12/01/2024",
      dueDate: "12/02/2024",
      totalAmount: 1240000.00,
      pendingAmount: 215000.00,
      status: "Vencida",
      statusType: "danger",
      priority: "ALTA",
      priorityType: "danger",
      daysOverdue: 7
    },
    {
      id: "INV-2024-042",
      vendor: "Tech Solutions Services Inc.",
      orderDate: "05/01/2024",
      dueDate: "05/02/2024",
      totalAmount: 850000.00,
      pendingAmount: 0.00,
      status: "Pagada",
      statusType: "success",
      priority: "MEDIA",
      priorityType: "info",
      daysOverdue: 0
    },
    {
      id: "INV-2024-089",
      vendor: "Office Depot Corporativo",
      orderDate: "20/01/2024",
      dueDate: "20/02/2024",
      totalAmount: 420500.00,
      pendingAmount: 45000.00,
      status: "Parcial",
      statusType: "warning",
      priority: "ALTA",
      priorityType: "warning",
      daysOverdue: 0
    },
    {
      id: "INV-2024-092",
      vendor: "Prime Energy Power",
      orderDate: "22/01/2024",
      dueDate: "22/02/2024",
      totalAmount: 315000.00,
      pendingAmount: 315000.00,
      status: "Pendiente",
      statusType: "info",
      priority: "BAJA",
      priorityType: "neutral",
      daysOverdue: 0
    },
    {
      id: "INV-2024-101",
      vendor: "Marketing Masters S.A.",
      orderDate: "25/01/2024",
      dueDate: "25/02/2024",
      totalAmount: 185200.00,
      pendingAmount: 185200.00,
      status: "Pendiente",
      statusType: "info",
      priority: "BAJA",
      priorityType: "neutral",
      daysOverdue: 0
    }
  ]
};
