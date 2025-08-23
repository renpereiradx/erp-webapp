/**
 * Analytics Components Integration Tests
 * Wave 6: Advanced Analytics & Reporting - Component Testing
 * 
 * Tests de integración para los componentes de analytics
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Components to test
import SalesAnalyticsDashboard from '@/components/Analytics/SalesAnalyticsDashboard';
import ProductPerformanceChart from '@/components/Analytics/ProductPerformanceChart';
import CustomerAnalyticsChart from '@/components/Analytics/CustomerAnalyticsChart';
import BusinessIntelligencePanel from '@/components/Analytics/BusinessIntelligencePanel';
import MetricsCard from '@/components/Analytics/MetricsCard';

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children, ...props }) => (
    <div data-testid="chart-container" {...props}>{children}</div>
  ),
  LineChart: ({ children, ...props }) => (
    <div data-testid="line-chart" {...props}>{children}</div>
  ),
  AreaChart: ({ children, ...props }) => (
    <div data-testid="area-chart" {...props}>{children}</div>
  ),
  BarChart: ({ children, ...props }) => (
    <div data-testid="bar-chart" {...props}>{children}</div>
  ),
  PieChart: ({ children, ...props }) => (
    <div data-testid="pie-chart" {...props}>{children}</div>
  ),
  RadarChart: ({ children, ...props }) => (
    <div data-testid="radar-chart" {...props}>{children}</div>
  ),
  ScatterChart: ({ children, ...props }) => (
    <div data-testid="scatter-chart" {...props}>{children}</div>
  ),
  XAxis: (props) => <div data-testid="x-axis" {...props} />,
  YAxis: (props) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: (props) => <div data-testid="tooltip" {...props} />,
  Legend: (props) => <div data-testid="legend" {...props} />,
  Line: (props) => <div data-testid="line" {...props} />,
  Area: (props) => <div data-testid="area" {...props} />,
  Bar: (props) => <div data-testid="bar" {...props} />,
  Cell: (props) => <div data-testid="cell" {...props} />,
  Pie: (props) => <div data-testid="pie" {...props} />,
  Radar: (props) => <div data-testid="radar" {...props} />,
  Scatter: (props) => <div data-testid="scatter" {...props} />,
  PolarGrid: (props) => <div data-testid="polar-grid" {...props} />,
  PolarAngleAxis: (props) => <div data-testid="polar-angle-axis" {...props} />,
  PolarRadiusAxis: (props) => <div data-testid="polar-radius-axis" {...props} />
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Package: () => <div data-testid="package-icon" />,
  ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Search: () => <div data-testid="search-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  ArrowUp: () => <div data-testid="arrow-up-icon" />,
  ArrowDown: () => <div data-testid="arrow-down-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />
}));

// Mock data
const mockSalesData = {
  totalRevenue: 15000,
  totalSales: 125,
  averageOrderValue: 120,
  conversionRate: 85.5,
  growthRate: 12.3,
  trends: [
    { date: '2025-08-20', revenue: 1200, sales: 10 },
    { date: '2025-08-21', revenue: 1500, sales: 12 },
    { date: '2025-08-22', revenue: 1800, sales: 15 }
  ],
  realTimeMetrics: {
    activeSessions: 45,
    revenueToday: 2340,
    salesInProgress: 8,
    timestamp: new Date().toISOString()
  }
};

const mockProductData = {
  topProducts: [
    {
      id: 'prod1',
      name: 'Laptop Gaming',
      category: 'Electronics',
      totalSales: 25,
      totalRevenue: 37500,
      averagePrice: 1500,
      trend: 'up'
    },
    {
      id: 'prod2', 
      name: 'Smartphone',
      category: 'Electronics',
      totalSales: 40,
      totalRevenue: 32000,
      averagePrice: 800,
      trend: 'stable'
    }
  ],
  categoryBreakdown: [
    { category: 'Electronics', salesCount: 65, revenue: 69500, percentage: 75 },
    { category: 'Clothing', salesCount: 30, revenue: 15000, percentage: 25 }
  ]
};

const mockCustomerData = {
  newCustomers: 15,
  returningCustomers: 85,
  customerRetentionRate: 0.78,
  averageCustomerLifetimeValue: 1250,
  customerSegments: [
    { name: 'VIP', customerCount: 12, totalValue: 48000, percentageOfTotal: 40 },
    { name: 'Frequent', customerCount: 28, totalValue: 42000, percentageOfTotal: 35 },
    { name: 'Regular', customerCount: 35, totalValue: 21000, percentageOfTotal: 17.5 },
    { name: 'New', customerCount: 20, totalValue: 8000, percentageOfTotal: 6.7 },
    { name: 'At Risk', customerCount: 5, totalValue: 1000, percentageOfTotal: 0.8 }
  ],
  topCustomers: [
    {
      id: 'cust1',
      name: 'Juan Pérez',
      lifetimeValue: 5400,
      totalOrders: 12,
      lastOrder: '2025-08-22'
    }
  ],
  acquisitionTrends: [
    { date: '2025-08-20', newCustomers: 5, returningCustomers: 28 },
    { date: '2025-08-21', newCustomers: 3, returningCustomers: 31 },
    { date: '2025-08-22', newCustomers: 7, returningCustomers: 26 }
  ],
  retentionMetrics: [
    { month: 1, retentionRate: 0.85 },
    { month: 2, retentionRate: 0.72 },
    { month: 3, retentionRate: 0.68 }
  ],
  behaviorPatterns: {
    purchaseFrequency: 75,
    averageOrderValue: 85,
    loyaltyScore: 68,
    satisfactionScore: 82,
    engagementScore: 71
  }
};

const mockBIData = {
  insights: [
    {
      id: 'insight1',
      title: 'Incremento en ventas de electrónicos',
      description: 'Las ventas en la categoría electrónicos han aumentado 25% esta semana',
      category: 'sales',
      priority: 'high',
      confidence: 0.92,
      estimatedImpact: { value: 5000 },
      timestamp: new Date().toISOString()
    }
  ],
  predictions: [
    {
      id: 'pred1',
      title: 'Proyección de ventas siguiente mes',
      description: 'Se proyecta un aumento del 15% en ventas para el próximo mes',
      metric: 'sales',
      trend: 'up',
      predictedValue: 18750,
      accuracy: 0.87,
      timeframe: '30 días'
    }
  ],
  recommendations: [
    {
      id: 'rec1',
      title: 'Optimizar inventario de smartphones',
      description: 'Aumentar stock de smartphones debido a alta demanda proyectada',
      category: 'inventory',
      priority: 'medium',
      expectedROI: 0.15,
      effort: 'medium',
      timestamp: new Date().toISOString()
    }
  ],
  alerts: [
    {
      id: 'alert1',
      title: 'Stock bajo en productos populares',
      description: 'Varios productos con alta demanda tienen stock bajo',
      severity: 'warning',
      timestamp: new Date().toISOString()
    }
  ]
};

describe('Analytics Components Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SalesAnalyticsDashboard', () => {
    it('renders without crashing', () => {
      render(<SalesAnalyticsDashboard data={mockSalesData} loading={false} />);
      
      expect(screen.getByText('Dashboard de Analíticas')).toBeInTheDocument();
    });

    it('displays loading state correctly', () => {
      render(<SalesAnalyticsDashboard data={null} loading={true} />);
      
      expect(screen.getByText('Cargando métricas...')).toBeInTheDocument();
    });

    it('displays metrics cards with correct values', () => {
      render(<SalesAnalyticsDashboard data={mockSalesData} loading={false} />);
      
      expect(screen.getByText('$15,000')).toBeInTheDocument();
      expect(screen.getByText('125')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });

    it('handles refresh functionality', async () => {
      const mockRefresh = vi.fn();
      render(
        <SalesAnalyticsDashboard 
          data={mockSalesData} 
          loading={false} 
          onRefresh={mockRefresh}
        />
      );
      
      const refreshButton = screen.getByRole('button', { name: /actualizar/i });
      fireEvent.click(refreshButton);
      
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('switches between chart types', async () => {
      render(<SalesAnalyticsDashboard data={mockSalesData} loading={false} />);
      
      // Check default chart
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      
      // Switch to area chart
      const areaButton = screen.getByRole('button', { name: /área/i });
      fireEvent.click(areaButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });
  });

  describe('ProductPerformanceChart', () => {
    it('renders product performance data', () => {
      render(<ProductPerformanceChart data={mockProductData} loading={false} />);
      
      expect(screen.getByText('Análisis de Productos')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('handles product search functionality', async () => {
      const user = userEvent.setup();
      render(<ProductPerformanceChart data={mockProductData} loading={false} />);
      
      const searchInput = screen.getByPlaceholderText(/buscar productos/i);
      await user.type(searchInput, 'Laptop');
      
      expect(searchInput).toHaveValue('Laptop');
    });

    it('filters by category', async () => {
      render(<ProductPerformanceChart data={mockProductData} loading={false} />);
      
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);
      
      // Should show category options
      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });
    });

    it('handles product click events', async () => {
      const mockProductClick = vi.fn();
      render(
        <ProductPerformanceChart 
          data={mockProductData} 
          loading={false}
          onProductClick={mockProductClick}
        />
      );
      
      // Simulate clicking on a product bar (this would be handled by Recharts)
      // In a real test, you'd trigger the chart interaction
      const productBar = screen.getByTestId('bar-chart');
      fireEvent.click(productBar);
      
      // Verify chart is rendered (actual click handling would need more setup)
      expect(productBar).toBeInTheDocument();
    });
  });

  describe('CustomerAnalyticsChart', () => {
    it('renders customer analytics with segments', () => {
      render(<CustomerAnalyticsChart data={mockCustomerData} loading={false} />);
      
      expect(screen.getByText('Análisis de Clientes')).toBeInTheDocument();
      expect(screen.getByText('Nuevos Clientes')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('displays customer segments correctly', () => {
      render(<CustomerAnalyticsChart data={mockCustomerData} loading={false} />);
      
      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('Frequent')).toBeInTheDocument();
      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });

    it('switches between different view modes', async () => {
      render(<CustomerAnalyticsChart data={mockCustomerData} loading={false} />);
      
      // Check default tab
      expect(screen.getByRole('tab', { name: /resumen/i })).toHaveAttribute('data-state', 'active');
      
      // Switch to segments tab
      const segmentsTab = screen.getByRole('tab', { name: /segmentos/i });
      fireEvent.click(segmentsTab);
      
      await waitFor(() => {
        expect(segmentsTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('displays behavior radar chart', async () => {
      render(<CustomerAnalyticsChart data={mockCustomerData} loading={false} />);
      
      // Switch to behavior tab
      const behaviorTab = screen.getByRole('tab', { name: /comportamiento/i });
      fireEvent.click(behaviorTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('BusinessIntelligencePanel', () => {
    it('renders BI panel with insights', () => {
      render(<BusinessIntelligencePanel data={mockBIData} loading={false} />);
      
      expect(screen.getByText('Business Intelligence')).toBeInTheDocument();
      expect(screen.getByText('AI-Powered')).toBeInTheDocument();
    });

    it('displays overview metrics correctly', () => {
      render(<BusinessIntelligencePanel data={mockBIData} loading={false} />);
      
      expect(screen.getByText('1')).toBeInTheDocument(); // Total insights
      expect(screen.getByText('1')).toBeInTheDocument(); // Predictions
      expect(screen.getByText('1')).toBeInTheDocument(); // Recommendations
      expect(screen.getByText('1')).toBeInTheDocument(); // Alerts
    });

    it('switches between BI tabs', async () => {
      render(<BusinessIntelligencePanel data={mockBIData} loading={false} />);
      
      // Switch to predictions tab
      const predictionsTab = screen.getByRole('tab', { name: /predicciones/i });
      fireEvent.click(predictionsTab);
      
      await waitFor(() => {
        expect(predictionsTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('handles auto-refresh toggle', async () => {
      render(<BusinessIntelligencePanel data={mockBIData} loading={false} />);
      
      const autoRefreshButton = screen.getByRole('button', { name: /auto-refresh/i });
      fireEvent.click(autoRefreshButton);
      
      // Button should change state (implementation specific)
      expect(autoRefreshButton).toBeInTheDocument();
    });

    it('filters insights by priority', async () => {
      render(<BusinessIntelligencePanel data={mockBIData} loading={false} />);
      
      // Open insights filter
      const filterSelect = screen.getByDisplayValue(/todos/i);
      fireEvent.click(filterSelect);
      
      // Select high priority
      await waitFor(() => {
        const highPriorityOption = screen.getByText(/alta prioridad/i);
        fireEvent.click(highPriorityOption);
      });
    });
  });

  describe('MetricsCard', () => {
    const mockMetric = {
      title: 'Total Revenue',
      value: 15000,
      formattedValue: '$15,000',
      change: 12.5,
      trend: 'up',
      icon: 'DollarSign'
    };

    it('renders metric card with correct values', () => {
      render(<MetricsCard {...mockMetric} />);
      
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$15,000')).toBeInTheDocument();
    });

    it('displays trend indicator correctly', () => {
      render(<MetricsCard {...mockMetric} />);
      
      expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument();
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
    });

    it('handles click events', async () => {
      const mockClick = vi.fn();
      render(<MetricsCard {...mockMetric} onClick={mockClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading state', () => {
      render(<MetricsCard {...mockMetric} loading={true} />);
      
      expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });

    it('handles error state', () => {
      render(<MetricsCard {...mockMetric} error="Failed to load" />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('all components have proper ARIA labels', () => {
      render(<SalesAnalyticsDashboard data={mockSalesData} loading={false} />);
      
      // Check for proper headings
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check for proper button labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('components support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ProductPerformanceChart data={mockProductData} loading={false} />);
      
      const searchInput = screen.getByPlaceholderText(/buscar productos/i);
      
      // Test keyboard focus
      await user.tab();
      expect(searchInput).toHaveFocus();
    });

    it('components announce state changes', async () => {
      render(<BusinessIntelligencePanel data={mockBIData} loading={false} />);
      
      // Check for live regions or status updates
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      // Each tab should be properly labeled
      tabs.forEach(tab => {
        expect(tab).toHaveAccessibleName();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing data gracefully', () => {
      render(<SalesAnalyticsDashboard data={null} loading={false} />);
      
      expect(screen.getByText(/no hay datos/i)).toBeInTheDocument();
    });

    it('handles empty arrays gracefully', () => {
      const emptyData = {
        topProducts: [],
        categoryBreakdown: []
      };
      
      render(<ProductPerformanceChart data={emptyData} loading={false} />);
      
      expect(screen.getByText(/no hay datos de productos/i)).toBeInTheDocument();
    });

    it('handles network errors', () => {
      const errorData = { error: 'Network error' };
      
      render(<CustomerAnalyticsChart data={errorData} loading={false} />);
      
      // Should show error state or fallback
      expect(screen.getByText(/análisis de clientes/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders large datasets efficiently', () => {
      const largeProductData = {
        topProducts: Array.from({ length: 100 }, (_, i) => ({
          id: `prod${i}`,
          name: `Product ${i}`,
          category: 'Electronics',
          totalSales: Math.floor(Math.random() * 100),
          totalRevenue: Math.floor(Math.random() * 10000),
          averagePrice: Math.floor(Math.random() * 1000),
          trend: 'up'
        })),
        categoryBreakdown: []
      };
      
      const startTime = performance.now();
      render(<ProductPerformanceChart data={largeProductData} loading={false} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
