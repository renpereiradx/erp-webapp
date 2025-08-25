/**
 * Business Metrics Panel Tests - Simplified
 * Wave 7: Observability & Monitoring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock all dependencies
vi.mock('../../store/useMonitoringStore', () => ({
  useMonitoringStore: vi.fn(() => ({
    businessMetrics: {},
    performanceData: [],
    alertsData: [],
    refreshBusinessMetrics: vi.fn()
  }))
}));

vi.mock('../../store/useSalesStore', () => ({
  useSalesStore: vi.fn(() => ({
    sales: []
  }))
}));

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }) => <div data-testid="card-description" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <div data-testid="card-title" {...props}>{children}</div>
}));

vi.mock('../../components/ui/tabs', () => ({
  Tabs: ({ children, ...props }) => <div data-testid="tabs" {...props}>{children}</div>,
  TabsContent: ({ children, ...props }) => <div data-testid="tabs-content" {...props}>{children}</div>,
  TabsList: ({ children, ...props }) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }) => <button data-testid="tabs-trigger" {...props}>{children}</button>
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  ComposedChart: ({ children }) => <div data-testid="composed-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  ScatterChart: ({ children }) => <div data-testid="scatter-chart">{children}</div>,
  FunnelChart: ({ children }) => <div data-testid="funnel-chart">{children}</div>,
  Funnel: () => <div data-testid="funnel" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Area: () => <div data-testid="area" />,
  Scatter: () => <div data-testid="scatter" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LabelList: () => <div data-testid="label-list" />
}));

vi.mock('date-fns', () => ({
  format: vi.fn(() => '24/08/2025 10:00:00'),
  subDays: vi.fn(() => new Date()),
  startOfDay: vi.fn((date) => date),
  endOfDay: vi.fn((date) => date)
}));

vi.mock('date-fns/locale', () => ({
  es: {}
}));

vi.mock('lucide-react', () => {
  const createIcon = (name) => {
    const IconComponent = (props) => <div data-testid={`icon-${name.toLowerCase()}`} {...props} />;
    IconComponent.displayName = name;
    return IconComponent;
  };

  return {
    TrendingUp: createIcon('TrendingUp'),
    TrendingDown: createIcon('TrendingDown'),
    DollarSign: createIcon('DollarSign'),
    Users: createIcon('Users'),
    ShoppingCart: createIcon('ShoppingCart'),
    CreditCard: createIcon('CreditCard'),
    Target: createIcon('Target'),
    Clock: createIcon('Clock'),
    MapPin: createIcon('MapPin'),
    Eye: createIcon('Eye'),
    MousePointer: createIcon('MousePointer'),
    Zap: createIcon('Zap'),
    AlertTriangle: createIcon('AlertTriangle'),
    CheckCircle: createIcon('CheckCircle'),
    Activity: createIcon('Activity'),
    Calendar: createIcon('Calendar'),
    Filter: createIcon('Filter'),
    Download: createIcon('Download'),
    RefreshCw: createIcon('RefreshCw')
  };
});

import BusinessMetricsPanel from '../../components/Observability/BusinessMetricsPanel';

describe('BusinessMetricsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<BusinessMetricsPanel />);
      }).not.toThrow();
    });

    it('should render the main title', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getByText('Panel de Métricas de Negocio')).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getByText(/Análisis profundo del rendimiento empresarial/)).toBeInTheDocument();
    });

    it('should render control buttons', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getByRole('button', { name: /Actualizar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Exportar/i })).toBeInTheDocument();
    });

    it('should render tab navigation', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });

    it('should render chart containers', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getAllByTestId('chart-container').length).toBeGreaterThan(0);
    });
  });

  describe('Basic Functionality', () => {
    it('should have proper component structure with cards', () => {
      render(<BusinessMetricsPanel />);
      
      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should render KPI metrics', () => {
      render(<BusinessMetricsPanel />);
      
      expect(screen.getByText('Ventas Totales')).toBeInTheDocument();
      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Valor Promedio')).toBeInTheDocument();
      expect(screen.getByText('Tasa Conversión')).toBeInTheDocument();
    });

    it('should render timestamp', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getByText(/Última actualización:/)).toBeInTheDocument();
    });
  });

  describe('Chart Components', () => {
    it('should render bar charts', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    });

    it('should render composed charts', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getAllByTestId('composed-chart').length).toBeGreaterThan(0);
    });
  });

  describe('Icons', () => {
    it('should render refresh icon', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getByTestId('icon-refreshcw')).toBeInTheDocument();
    });

    it('should render download icon', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getByTestId('icon-download')).toBeInTheDocument();
    });

    it('should render trend icons', () => {
      render(<BusinessMetricsPanel />);
      expect(screen.getAllByTestId('icon-trendingup').length).toBeGreaterThan(0);
    });
  });
});
