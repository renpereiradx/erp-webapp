export const summaryData = {
  totalReceivables: {
    amount: "$1,240,500",
    trend: 4.2,
    trendLabel: "vs last month",
    isPositive: true
  },
  overdueAmount: {
    amount: "$145,200",
    percentage: 12,
    label: "Critical Increase",
    isCritical: true
  },
  creditsReturns: {
    amount: "$12,400",
    percentage: 0.5,
    label: "Stable",
    isStable: true
  },
  lastSync: {
    status: "Success",
    time: "Just now"
  }
};

export const agingData = [
  { label: "0-30 Days", amount: "$650k", value: 650000, color: "bg-[#107c10]", height: "60%" },
  { label: "31-60 Days", amount: "$280k", value: 280000, color: "bg-[#ffb900]", height: "35%" },
  { label: "61-90 Days", amount: "$120k", value: 120000, color: "bg-[#d83b01]", height: "20%" },
  { label: "90+ Days", amount: "$85k", value: 85000, color: "bg-[#a80000]", height: "15%" }
];

export const debtorsData = [
  {
    id: 1,
    client: "Northwind Traders",
    invoiceId: "#INV-2023-001",
    balance: "$45,200.00",
    daysOverdue: 92,
    status: "At Risk",
    statusColor: "red"
  },
  {
    id: 2,
    client: "Fabrikam, Inc.",
    invoiceId: "#INV-2023-089",
    balance: "$21,050.50",
    daysOverdue: 65,
    status: "Warning",
    statusColor: "orange"
  },
  {
    id: 3,
    client: "Litware Systems",
    invoiceId: "#INV-2023-102",
    balance: "$12,400.00",
    daysOverdue: 45,
    status: "Late",
    statusColor: "yellow"
  },
  {
    id: 4,
    client: "Contoso Pharmaceuticals",
    invoiceId: "#INV-2023-145",
    balance: "$8,900.00",
    daysOverdue: 15,
    status: "Normal",
    statusColor: "green"
  },
  {
    id: 5,
    client: "Adventure Works",
    invoiceId: "#INV-2023-156",
    balance: "$3,250.00",
    daysOverdue: 5,
    status: "Normal",
    statusColor: "green"
  }
];

export const forecastData = [150, 80, 50, 20]; // Mock points for the graph

export const masterListData = [
  {
    id: "INV-2023-001",
    clientName: "Northwind Traders",
    clientInitial: "N",
    clientColor: "#dbeafe",
    issueDate: "2023-09-15",
    dueDate: "2023-10-15",
    originalAmt: 45200000,
    pendingAmt: 45200000,
    status: "Overdue",
    statusColor: "red"
  },
  {
    id: "INV-2023-089",
    clientName: "Fabrikam, Inc.",
    clientInitial: "F",
    clientColor: "#fef3c7",
    issueDate: "2023-10-01",
    dueDate: "2023-10-31",
    originalAmt: 21050000,
    pendingAmt: 21050000,
    status: "Overdue",
    statusColor: "red"
  },
  {
    id: "INV-2023-102",
    clientName: "Litware Systems",
    clientInitial: "L",
    clientColor: "#e0e7ff",
    issueDate: "2023-10-10",
    dueDate: "2023-11-10",
    originalAmt: 12400000,
    pendingAmt: 12400000,
    status: "Pending",
    statusColor: "yellow"
  },
  {
    id: "INV-2023-145",
    clientName: "Contoso Pharmaceuticals",
    clientInitial: "C",
    clientColor: "#dcfce7",
    issueDate: "2023-10-15",
    dueDate: "2023-11-15",
    originalAmt: 8900000,
    pendingAmt: 5000000,
    status: "Partial",
    statusColor: "blue"
  },
  {
    id: "INV-2023-156",
    clientName: "Adventure Works",
    clientInitial: "A",
    clientColor: "#f3e8ff",
    issueDate: "2023-10-20",
    dueDate: "2023-11-20",
    originalAmt: 3250000,
    pendingAmt: 0,
    status: "Paid",
    statusColor: "green"
  },
  {
    id: "INV-2023-201",
    clientName: "Tailspin Toys",
    clientInitial: "T",
    clientColor: "#fce7f3",
    issueDate: "2023-11-01",
    dueDate: "2023-12-01",
    originalAmt: 15600000,
    pendingAmt: 15600000,
    status: "Pending",
    statusColor: "yellow"
  },
  {
    id: "INV-2023-245",
    clientName: "Wide World Importers",
    clientInitial: "W",
    clientColor: "#fef2f2",
    issueDate: "2023-08-22",
    dueDate: "2023-09-22",
    originalAmt: 67800000,
    pendingAmt: 67800000,
    status: "Overdue",
    statusColor: "red"
  },
  {
    id: "INV-2023-312",
    clientName: "Proseware Inc.",
    clientInitial: "P",
    clientColor: "#ecfdf5",
    issueDate: "2023-11-05",
    dueDate: "2023-12-05",
    originalAmt: 9200000,
    pendingAmt: 4500000,
    status: "Partial",
    statusColor: "blue"
  }
];

export const detailData = {
  id: "INV-2023-001",
  sale_order_id: "INV-2023-001",
  client_id: "client_001",
  client_name: "Northwind Traders",
  client_phone: "+595 981 234 567",
  client_email: "maria@northwind.com",
  client_address: "Avda. Mcal. López 3456, Asunción",
  sale_date: "2023-09-15T10:00:00Z",
  due_date: "2023-10-15T10:00:00Z",
  original_amount: 45200000,
  paid_amount: 33900000,
  pending_amount: 11300000,
  days_overdue: 45,
  status: "OVERDUE",
  currency: "PYG",
  payment_history: [
    { id: "pay_001", amount: 15000000, payment_date: "2023-09-20T14:30:00Z", payment_method: "Transferencia", reference: "TRF-9988", processed_by: "María García" },
    { id: "pay_002", amount: 10000000, payment_date: "2023-09-28T11:00:00Z", payment_method: "Efectivo", reference: "", processed_by: "Carlos López" },
    { id: "pay_003", amount: 8900000, payment_date: "2023-10-05T09:15:00Z", payment_method: "Cheque", reference: "CHQ-4455", processed_by: "María García" },
  ]
};

export const overdueData = [
  {
    id: 1,
    client: "Northwind Traders",
    amount: 52000000, // PYG amount (numeric)
    totalDue: 52000000, // For backward compatibility
    daysOverdue: 92,
    priority: "High",
    lastContact: "2 days ago",
    nextAction: "Call CFO",
    riskScore: 85,
    code: "NT",
    bgColor: "#dbeafe",
    days: "92 días",
    contactVia: "Llamada telefónica"
  },
  {
    id: 2,
    client: "Fabrikam, Inc.",
    amount: 21050000, // PYG amount (numeric)
    totalDue: 21050000, // For backward compatibility
    daysOverdue: 65,
    priority: "Medium",
    lastContact: "1 week ago",
    nextAction: "Send Email",
    riskScore: 60,
    code: "FB",
    bgColor: "#fef3c7",
    days: "65 días",
    contactVia: "Email"
  }
];

export const clientProfileData = {
  id: 1,
  name: "Northwind Traders",
  creditLimit: "$100,000",
  availableCredit: "$48,000",
  riskLevel: "High",
  paymentTerms: "Net 60",
  outstandingDebts: [
    { id: "INV-001", amount: "$45,200", status: "Overdue", due: "2023-10-15" },
    { id: "INV-022", amount: "$6,800", status: "Current", due: "2023-11-20" }
  ],
  paymentBehavior: {
    averageDays: 72,
    onTimePercentage: 45
  }
};

export const agingReportData = [
  { range: "0-30 Days", amount: 650000, count: 45, percentage: 52 },
  { range: "31-60 Days", amount: 280000, count: 12, percentage: 22 },
  { range: "61-90 Days", amount: 120000, count: 8, percentage: 10 },
  { range: "90+ Days", amount: 85000, count: 5, percentage: 16 }
];
