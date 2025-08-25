/**
 * Report Templates Components
 * Wave 6: Advanced Analytics & Reporting - Phase 3
 * 
 * Pre-built report templates for common business scenarios
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Line, 
  PieChart, 
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  Clock,
  Target,
  Percent
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatting';

// Sales Summary Template
export const SalesSummaryTemplate = ({ data, config }) => {
  const {
    totalSales = 0,
    salesGrowth = 0,
    orderCount = 0,
    averageOrderValue = 0,
    topProducts = [],
    salesByMonth = [],
    paymentMethods = []
  } = data;

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales Summary Report</h1>
        <p className="text-gray-600 mt-2">
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
                <div className="flex items-center mt-1">
                  {salesGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(Math.abs(salesGrowth))}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders</p>
                <p className="text-2xl font-bold">{formatNumber(orderCount)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Products Sold</p>
                <p className="text-2xl font-bold">{formatNumber(topProducts.length)}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product</th>
                  <th className="text-right p-3">Sales</th>
                  <th className="text-right p-3">Units Sold</th>
                  <th className="text-right p-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.slice(0, 10).map((product, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </td>
                    <td className="text-right p-3">{formatNumber(product.salesCount)}</td>
                    <td className="text-right p-3">{formatNumber(product.unitsSold)}</td>
                    <td className="text-right p-3 font-medium">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: method.color }} />
                  <span className="font-medium">{method.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(method.amount)}</p>
                  <p className="text-sm text-gray-600">{formatPercent(method.percentage)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Product Performance Template
export const ProductPerformanceTemplate = ({ data, config }) => {
  const {
    products = [],
    categories = [],
    stockLevels = [],
    topPerformers = [],
    underPerformers = []
  } = data;

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Performance Report</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive analysis of product sales and inventory
        </p>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">{category.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">{formatCurrency(category.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Units Sold:</span>
                    <span className="font-medium">{formatNumber(category.unitsSold)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Products:</span>
                    <span className="font-medium">{category.productCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top and Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-700">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-gray-600">{formatNumber(product.unitsSold)} units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {underPerformers.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-700">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-gray-600">{formatNumber(product.unitsSold)} units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Status */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product</th>
                  <th className="text-right p-3">Current Stock</th>
                  <th className="text-right p-3">Reserved</th>
                  <th className="text-right p-3">Available</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">{item.sku}</p>
                      </div>
                    </td>
                    <td className="text-right p-3">{formatNumber(item.currentStock)}</td>
                    <td className="text-right p-3">{formatNumber(item.reserved)}</td>
                    <td className="text-right p-3">{formatNumber(item.available)}</td>
                    <td className="text-center p-3">
                      <Badge 
                        variant={
                          item.status === 'low' ? 'destructive' :
                          item.status === 'medium' ? 'default' : 'secondary'
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Customer Analysis Template
export const CustomerAnalysisTemplate = ({ data, config }) => {
  const {
    totalCustomers = 0,
    newCustomers = 0,
    repeatCustomers = 0,
    customerSegments = [],
    topCustomers = [],
    customerLifetimeValue = 0,
    churnRate = 0
  } = data;

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customer Analysis Report</h1>
        <p className="text-gray-600 mt-2">
          Deep insights into customer behavior and segmentation
        </p>
      </div>

      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{formatNumber(totalCustomers)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Customers</p>
                <p className="text-2xl font-bold">{formatNumber(newCustomers)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Lifetime Value</p>
                <p className="text-2xl font-bold">{formatCurrency(customerLifetimeValue)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold">{formatPercent(churnRate)}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customerSegments.map((segment, index) => (
              <div key={index} className="p-6 border rounded-lg">
                <h3 className="font-semibold text-lg mb-4">{segment.name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customers:</span>
                    <span className="font-medium">{formatNumber(segment.count)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Order Value:</span>
                    <span className="font-medium">{formatCurrency(segment.avgOrderValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-medium">{formatCurrency(segment.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchase Frequency:</span>
                    <span className="font-medium">{segment.frequency}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(segment.count / totalCustomers) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatPercent((segment.count / totalCustomers) * 100)} of total customers
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Customer</th>
                  <th className="text-right p-3">Total Orders</th>
                  <th className="text-right p-3">Total Revenue</th>
                  <th className="text-right p-3">Avg Order Value</th>
                  <th className="text-center p-3">Segment</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                    </td>
                    <td className="text-right p-3">{formatNumber(customer.totalOrders)}</td>
                    <td className="text-right p-3 font-medium">
                      {formatCurrency(customer.totalRevenue)}
                    </td>
                    <td className="text-right p-3">{formatCurrency(customer.avgOrderValue)}</td>
                    <td className="text-center p-3">
                      <Badge variant="outline">{customer.segment}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Payment Methods Analysis Template
export const PaymentMethodsTemplate = ({ data, config }) => {
  const {
    paymentMethods = [],
    transactionVolume = 0,
    averageTransactionValue = 0,
    processingFees = 0,
    failureRates = [],
    monthlyTrends = []
  } = data;

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Methods Analysis</h1>
        <p className="text-gray-600 mt-2">
          Complete overview of payment processing and performance
        </p>
      </div>

      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transaction Volume</p>
                <p className="text-2xl font-bold">{formatNumber(transactionVolume)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <BarChart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold">{formatCurrency(averageTransactionValue)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Fees</p>
                <p className="text-2xl font-bold">{formatCurrency(processingFees)}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Percent className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {paymentMethods.map((method, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{method.name}</h3>
                  <Badge variant={method.status === 'active' ? 'default' : 'secondary'}>
                    {method.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-xl font-bold">{formatNumber(method.transactionCount)}</p>
                    <p className="text-xs text-gray-500">
                      {formatPercent(method.percentage)} of total
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-xl font-bold">{formatCurrency(method.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(method.avgAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatPercent(method.successRate)}
                    </p>
                  </div>
                </div>
                
                {method.fees && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Processing Costs</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Fixed Fee</p>
                        <p className="font-medium">{formatCurrency(method.fees.fixed)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Percentage Fee</p>
                        <p className="font-medium">{formatPercent(method.fees.percentage)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Fees</p>
                        <p className="font-medium">{formatCurrency(method.fees.total)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Template renderer utility
export const renderReportTemplate = (templateType, data, config = {}) => {
  switch (templateType) {
    case 'sales-summary':
      return <SalesSummaryTemplate data={data} config={config} />;
    case 'product-performance':
      return <ProductPerformanceTemplate data={data} config={config} />;
    case 'customer-analysis':
      return <CustomerAnalysisTemplate data={data} config={config} />;
    case 'payment-methods':
      return <PaymentMethodsTemplate data={data} config={config} />;
    default:
      return <div className="p-6 text-center text-gray-500">Template not found</div>;
  }
};
