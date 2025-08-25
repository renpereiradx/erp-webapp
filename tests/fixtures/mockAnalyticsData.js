/**
 * Mock Analytics Data for Testing
 * 
 * Creates comprehensive mock data for analytics testing
 */

export const createMockAnalyticsData = () => ({
  // Sales data
  sales: {
    totalSales: 250000,
    salesGrowth: 0.15,
    orderCount: 1250,
    averageOrderValue: 200,
    topProducts: [
      {
        id: '1',
        name: 'Premium Widget A',
        category: 'Electronics',
        salesCount: 150,
        unitsSold: 300,
        revenue: 45000
      },
      {
        id: '2',
        name: 'Standard Widget B',
        category: 'Electronics',
        salesCount: 125,
        unitsSold: 250,
        revenue: 37500
      },
      {
        id: '3',
        name: 'Deluxe Widget C',
        category: 'Home & Garden',
        salesCount: 100,
        unitsSold: 200,
        revenue: 30000
      }
    ],
    salesByMonth: [
      { month: 'Jan', sales: 20000, orders: 100 },
      { month: 'Feb', sales: 22000, orders: 110 },
      { month: 'Mar', sales: 25000, orders: 125 },
      { month: 'Apr', sales: 23000, orders: 115 },
      { month: 'May', sales: 27000, orders: 135 },
      { month: 'Jun', sales: 30000, orders: 150 }
    ],
    paymentMethods: [
      {
        name: 'Credit Card',
        amount: 150000,
        percentage: 0.6,
        color: '#3B82F6',
        transactionCount: 750,
        avgAmount: 200,
        successRate: 0.98,
        fees: {
          fixed: 0.30,
          percentage: 0.029,
          total: 4500
        }
      },
      {
        name: 'PayPal',
        amount: 62500,
        percentage: 0.25,
        color: '#10B981',
        transactionCount: 312,
        avgAmount: 200,
        successRate: 0.96,
        fees: {
          fixed: 0.30,
          percentage: 0.034,
          total: 2200
        }
      },
      {
        name: 'Bank Transfer',
        amount: 25000,
        percentage: 0.1,
        color: '#F59E0B',
        transactionCount: 125,
        avgAmount: 200,
        successRate: 0.99,
        fees: {
          fixed: 1.00,
          percentage: 0.01,
          total: 375
        }
      },
      {
        name: 'Cash',
        amount: 12500,
        percentage: 0.05,
        color: '#8B5CF6',
        transactionCount: 63,
        avgAmount: 200,
        successRate: 1.0,
        fees: {
          fixed: 0,
          percentage: 0,
          total: 0
        }
      }
    ]
  },

  // Products data
  products: {
    totalProducts: 150,
    activeProducts: 135,
    categories: [
      {
        name: 'Electronics',
        revenue: 120000,
        unitsSold: 800,
        productCount: 45,
        growthRate: 0.12
      },
      {
        name: 'Home & Garden',
        revenue: 80000,
        unitsSold: 600,
        productCount: 35,
        growthRate: 0.08
      },
      {
        name: 'Clothing',
        revenue: 50000,
        unitsSold: 400,
        productCount: 70,
        growthRate: 0.05
      }
    ],
    topPerformers: [
      {
        id: '1',
        name: 'Premium Widget A',
        category: 'Electronics',
        revenue: 45000,
        unitsSold: 300,
        margin: 0.35
      },
      {
        id: '2',
        name: 'Standard Widget B',
        category: 'Electronics',
        revenue: 37500,
        unitsSold: 250,
        margin: 0.30
      },
      {
        id: '3',
        name: 'Deluxe Widget C',
        category: 'Home & Garden',
        revenue: 30000,
        unitsSold: 200,
        margin: 0.40
      }
    ],
    underPerformers: [
      {
        id: '10',
        name: 'Basic Widget D',
        category: 'Electronics',
        revenue: 5000,
        unitsSold: 50,
        margin: 0.15
      },
      {
        id: '11',
        name: 'Simple Widget E',
        category: 'Clothing',
        revenue: 3000,
        unitsSold: 30,
        margin: 0.10
      }
    ],
    stockLevels: [
      {
        productId: '1',
        productName: 'Premium Widget A',
        sku: 'PWA-001',
        currentStock: 150,
        reserved: 25,
        available: 125,
        status: 'good'
      },
      {
        productId: '2',
        productName: 'Standard Widget B',
        sku: 'SWB-002',
        currentStock: 45,
        reserved: 15,
        available: 30,
        status: 'low'
      },
      {
        productId: '3',
        productName: 'Deluxe Widget C',
        sku: 'DWC-003',
        currentStock: 80,
        reserved: 10,
        available: 70,
        status: 'medium'
      }
    ]
  },

  // Customers data
  customers: {
    totalCustomers: 2500,
    newCustomers: 150,
    repeatCustomers: 1200,
    customerLifetimeValue: 320,
    churnRate: 0.05,
    customerSegments: [
      {
        name: 'VIP Customers',
        count: 250,
        avgOrderValue: 500,
        revenue: 125000,
        frequency: 'Weekly',
        characteristics: ['High value', 'Frequent purchases', 'Premium products']
      },
      {
        name: 'Regular Customers',
        count: 1500,
        avgOrderValue: 150,
        revenue: 225000,
        frequency: 'Monthly',
        characteristics: ['Moderate value', 'Regular purchases', 'Mixed products']
      },
      {
        name: 'Occasional Customers',
        count: 750,
        avgOrderValue: 80,
        revenue: 60000,
        frequency: 'Quarterly',
        characteristics: ['Lower value', 'Infrequent purchases', 'Price-sensitive']
      }
    ],
    topCustomers: [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        totalOrders: 25,
        totalRevenue: 12500,
        avgOrderValue: 500,
        segment: 'VIP'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        totalOrders: 18,
        totalRevenue: 8100,
        avgOrderValue: 450,
        segment: 'VIP'
      },
      {
        id: '3',
        name: 'Mike Davis',
        email: 'mike.davis@email.com',
        totalOrders: 15,
        totalRevenue: 6750,
        avgOrderValue: 450,
        segment: 'VIP'
      }
    ],
    acquisitionChannels: [
      { name: 'Organic Search', customers: 800, cost: 50 },
      { name: 'Social Media', customers: 600, cost: 75 },
      { name: 'Email Marketing', customers: 500, cost: 25 },
      { name: 'Paid Advertising', customers: 400, cost: 150 },
      { name: 'Referrals', customers: 200, cost: 10 }
    ]
  },

  // Business Intelligence data
  businessIntelligence: {
    insights: [
      {
        id: '1',
        type: 'opportunity',
        title: 'Electronics category showing strong growth',
        description: 'Electronics products have shown 12% growth this quarter, representing the highest growth rate across all categories.',
        impact: 'high',
        actionable: true,
        recommendations: ['Increase inventory for top electronics products', 'Launch targeted marketing campaign']
      },
      {
        id: '2',
        type: 'warning',
        title: 'Clothing category underperforming',
        description: 'Clothing sales have declined 5% compared to last quarter. Consider reviewing pricing strategy.',
        impact: 'medium',
        actionable: true,
        recommendations: ['Review pricing strategy', 'Analyze competitor pricing', 'Consider seasonal promotions']
      },
      {
        id: '3',
        type: 'success',
        title: 'Customer retention improving',
        description: 'Customer retention rate has improved to 95%, the highest in company history.',
        impact: 'high',
        actionable: false,
        recommendations: ['Continue current customer service strategies', 'Document best practices']
      }
    ],
    predictions: [
      {
        metric: 'Revenue',
        currentValue: 250000,
        predictedValue: 287500,
        confidence: 0.85,
        timeframe: '30 days',
        trend: 'up'
      },
      {
        metric: 'Orders',
        currentValue: 1250,
        predictedValue: 1375,
        confidence: 0.78,
        timeframe: '30 days',
        trend: 'up'
      },
      {
        metric: 'Customer Acquisition',
        currentValue: 150,
        predictedValue: 165,
        confidence: 0.72,
        timeframe: '30 days',
        trend: 'up'
      }
    ],
    anomalies: [
      {
        id: '1',
        type: 'spike',
        metric: 'Orders',
        value: 85,
        expectedValue: 42,
        date: '2024-01-15',
        severity: 'medium',
        explanation: 'Flash sale event drove higher than expected orders'
      },
      {
        id: '2',
        type: 'drop',
        metric: 'Revenue',
        value: 15000,
        expectedValue: 20000,
        date: '2024-01-20',
        severity: 'low',
        explanation: 'Weekend sales typically lower than weekday averages'
      }
    ]
  },

  // Time-based data for trends
  trends: {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 10000) + 5000,
      orders: Math.floor(Math.random() * 50) + 25,
      customers: Math.floor(Math.random() * 20) + 10
    })),
    
    weekly: Array.from({ length: 12 }, (_, i) => ({
      week: `Week ${52 - i}`,
      revenue: Math.floor(Math.random() * 50000) + 25000,
      orders: Math.floor(Math.random() * 250) + 125,
      customers: Math.floor(Math.random() * 100) + 50
    })),
    
    monthly: [
      { month: 'Jan', revenue: 200000, orders: 1000, customers: 2000 },
      { month: 'Feb', revenue: 220000, orders: 1100, customers: 2100 },
      { month: 'Mar', revenue: 250000, orders: 1250, customers: 2200 },
      { month: 'Apr', revenue: 230000, orders: 1150, customers: 2250 },
      { month: 'May', revenue: 270000, orders: 1350, customers: 2400 },
      { month: 'Jun', revenue: 300000, orders: 1500, customers: 2500 }
    ]
  },

  // Metadata
  metadata: {
    generatedAt: new Date().toISOString(),
    source: 'mock-data',
    version: '1.0.0',
    currency: 'USD',
    timezone: 'UTC'
  }
});

export const createMockReportData = (templateType = 'sales-summary') => {
  const baseData = createMockAnalyticsData();
  
  switch (templateType) {
    case 'sales-summary':
      return {
        ...baseData.sales,
        metadata: baseData.metadata
      };
      
    case 'product-performance':
      return {
        ...baseData.products,
        metadata: baseData.metadata
      };
      
    case 'customer-analysis':
      return {
        ...baseData.customers,
        metadata: baseData.metadata
      };
      
    case 'payment-methods':
      return {
        paymentMethods: baseData.sales.paymentMethods,
        transactionVolume: 1250,
        averageTransactionValue: 200,
        processingFees: 7075,
        metadata: baseData.metadata
      };
      
    default:
      return baseData;
  }
};

export default { createMockAnalyticsData, createMockReportData };
