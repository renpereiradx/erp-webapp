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
    issueDate: "2023-09-15",
    dueDate: "2023-10-15",
    amount: "$45,200.00",
    status: "Overdue"
  },
  {
    id: "INV-2023-089",
    clientName: "Fabrikam, Inc.",
    issueDate: "2023-10-01",
    dueDate: "2023-10-31",
    amount: "$21,050.50",
    status: "Overdue"
  },
  {
    id: "INV-2023-102",
    clientName: "Litware Systems",
    issueDate: "2023-10-10",
    dueDate: "2023-11-10",
    amount: "$12,400.00",
    status: "Pending"
  },
  {
    id: "INV-2023-145",
    clientName: "Contoso Pharmaceuticals",
    issueDate: "2023-10-15",
    dueDate: "2023-11-15",
    amount: "$8,900.00",
    status: "Pending"
  },
  {
    id: "INV-2023-156",
    clientName: "Adventure Works",
    issueDate: "2023-10-20",
    dueDate: "2023-11-20",
    amount: "$3,250.00",
    status: "Paid"
  }
];

export const detailData = {
  id: "INV-2023-001",
  client: {
    id: 1,
    name: "Northwind Traders",
    contact: "Maria Anders",
    email: "maria@northwind.com",
    phone: "+1 555-0100"
  },
  transaction: {
    issueDate: "2023-09-15",
    dueDate: "2023-10-15",
    amount: 45200.00,
    currency: "USD",
    status: "Overdue",
    description: "Consulting Services - Q3",
    items: [
      { id: 1, desc: "Strategic Assessment", qty: 1, price: 15000 },
      { id: 2, desc: "Process Optimization", qty: 200, price: 151 }
    ]
  },
  paymentHistory: [
    { date: "2023-09-20", amount: 5000, type: "Bank Transfer", ref: "TRX-9988" }
  ],
  auditLog: [
    { date: "2023-10-16", action: "Automated Reminder Sent", user: "System" },
    { date: "2023-09-15", action: "Invoice Created", user: "Admin" }
  ]
};

export const overdueData = [
  {
    id: 1,
    client: "Northwind Traders",
    totalDue: "$52,000",
    daysOverdue: 92,
    priority: "High",
    lastContact: "2 days ago",
    nextAction: "Call CFO",
    riskScore: 85
  },
  {
    id: 2,
    client: "Fabrikam, Inc.",
    totalDue: "$21,050",
    daysOverdue: 65,
    priority: "Medium",
    lastContact: "1 week ago",
    nextAction: "Send Email",
    riskScore: 60
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
