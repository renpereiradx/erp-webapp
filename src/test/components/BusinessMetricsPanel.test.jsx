/**
 * Business Metrics Panel Tests
 * Wave 7: Observability & Monitoring
 * 
 * Comprehensive test suite for the advanced business metrics panel
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BusinessMetricsPanel from '../../components/Observability/BusinessMetricsPanel';
import { useMonitoringStore } from '../../store/useMonitoringStore';
import { useSalesStore } from '../../store/useSalesStore';

// Mock the stores
vi.mock('../../store/useMonitoringStore');
vi.mock('../../store/useSalesStore');

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  ComposedChart: ({ children }) => <div data-testid="composed-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  ScatterChart: ({ children }) => <div data-testid="scatter-chart">{children}</div>,
  FunnelChart: ({ children }) => <div data-testid="funnel-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Area: () => <div data-testid="area" />,
  Scatter: () => <div data-testid="scatter" />,
  Funnel: () => <div data-testid="funnel" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LabelList: () => <div data-testid="label-list" />
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => '24/08/2025'),
  subDays: vi.fn((date, days) => new Date()),
  startOfDay: vi.fn((date) => date),
  endOfDay: vi.fn((date) => date)
}));

vi.mock('date-fns/locale', () => ({
  es: {}
}));

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('BusinessMetricsPanel', () => {
  const mockMonitoringStore = {
    businessMetrics: {
      totalSales: 1250,
      totalRevenue: 45000,
      conversionRate: 12.6,
      averageOrderValue: 36.0
    },
    performanceData: [],
    alertsData: [],
    refreshBusinessMetrics: vi.fn()
  };

  const mockSalesStore = {
    sales: [
      { id: 1, total: 150, status: 'completed' },
      { id: 2, total: 250, status: 'completed' },
      { id: 3, total: 180, status: 'completed' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    useMonitoringStore.mockReturnValue(mockMonitoringStore);
    useSalesStore.mockReturnValue(mockSalesStore);
  });

  describe('Component Rendering', () => {
    it('should render the main panel title and description', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText('Panel de Métricas de Negocio')).toBeInTheDocument();
      expect(screen.getByText(/Análisis profundo del rendimiento empresarial/)).toBeInTheDocument();
    });

    it('should render all control elements', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Actualizar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Exportar/i })).toBeInTheDocument();
    });

    it('should render all KPI metric cards', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText('Ventas Totales')).toBeInTheDocument();
      expect(screen.getByText('Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Valor Promedio')).toBeInTheDocument();
      expect(screen.getByText('Tasa Conversión')).toBeInTheDocument();
    });

    it('should render all tab triggers', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByRole('tab', { name: 'Conversión' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Heat Maps' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Rendimiento' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Segmentos' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Optimización' })).toBeInTheDocument();
    });
  });

  describe('KPI Calculations', () => {
    it('should calculate total sales correctly', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 sales total
    });

    it('should calculate total revenue correctly', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText('$580')).toBeInTheDocument(); // 150 + 250 + 180
    });

    it('should calculate average order value correctly', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText('$193.33')).toBeInTheDocument(); // 580 / 3
    });

    it('should handle empty sales data gracefully', () => {
      const emptyStore = { ...mockSalesStore, sales: [] };
      useSalesStore.mockReturnValue(emptyStore);
      
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  describe('Time Range Selection', () => {
    it('should change time range when selection changes', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const timeRangeSelect = screen.getByRole('combobox');
      fireEvent.click(timeRangeSelect);
      
      const option30d = screen.getByText('Últimos 30 días');
      fireEvent.click(option30d);
      
      await waitFor(() => {
        expect(timeRangeSelect).toHaveValue('30d');
      });
    });

    it('should have default time range of 7 days', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const timeRangeSelect = screen.getByRole('combobox');
      expect(timeRangeSelect).toHaveValue('7d');
    });
  });

  describe('Refresh Functionality', () => {
    it('should call refreshBusinessMetrics when refresh button is clicked', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const refreshButton = screen.getByRole('button', { name: /Actualizar/i });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(mockMonitoringStore.refreshBusinessMetrics).toHaveBeenCalledTimes(1);
      });
    });

    it('should update last refresh timestamp', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const refreshButton = screen.getByRole('button', { name: /Actualizar/i });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Última actualización:/)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should show conversion content by default', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText('Embudo de Conversión')).toBeInTheDocument();
      expect(screen.getByText('Análisis de Métodos de Pago')).toBeInTheDocument();
    });

    it('should switch to heatmap tab when clicked', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const heatmapTab = screen.getByRole('tab', { name: 'Heat Maps' });
      fireEvent.click(heatmapTab);
      
      await waitFor(() => {
        expect(screen.getByText('Mapa de Calor - User Journey')).toBeInTheDocument();
      });
    });

    it('should switch to performance tab when clicked', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const performanceTab = screen.getByRole('tab', { name: 'Rendimiento' });
      fireEvent.click(performanceTab);
      
      await waitFor(() => {
        expect(screen.getByText('Indicadores de Rendimiento')).toBeInTheDocument();
      });
    });

    it('should switch to segments tab when clicked', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const segmentsTab = screen.getByRole('tab', { name: 'Segmentos' });
      fireEvent.click(segmentsTab);
      
      await waitFor(() => {
        expect(screen.getByText('Segmentación de Clientes')).toBeInTheDocument();
      });
    });

    it('should switch to optimization tab when clicked', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const optimizationTab = screen.getByRole('tab', { name: 'Optimización' });
      fireEvent.click(optimizationTab);
      
      await waitFor(() => {
        expect(screen.getByText('Oportunidades de Mejora')).toBeInTheDocument();
      });
    });
  });

  describe('Chart Components', () => {
    it('should render conversion funnel chart', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render payment methods chart', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getAllByTestId('chart-container')).toHaveLength(3); // Multiple charts
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    it('should render sales performance trends', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText('Tendencias de Ventas y Conversión')).toBeInTheDocument();
      expect(screen.getAllByTestId('composed-chart')).toHaveLength(2);
    });
  });

  describe('Heatmap Visualization', () => {
    it('should render heatmap controls', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const heatmapTab = screen.getByRole('tab', { name: 'Heat Maps' });
      fireEvent.click(heatmapTab);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Vista por Hora')).toBeInTheDocument();
      });
    });

    it('should change heatmap view when selection changes', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const heatmapTab = screen.getByRole('tab', { name: 'Heat Maps' });
      fireEvent.click(heatmapTab);
      
      await waitFor(() => {
        const heatmapSelect = screen.getByDisplayValue('Vista por Hora');
        fireEvent.change(heatmapSelect, { target: { value: 'daily' } });
        
        expect(heatmapSelect).toHaveValue('daily');
      });
    });

    it('should render heatmap sections', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const heatmapTab = screen.getByRole('tab', { name: 'Heat Maps' });
      fireEvent.click(heatmapTab);
      
      await waitFor(() => {
        expect(screen.getByText('Interacciones por Hora')).toBeInTheDocument();
        expect(screen.getByText('Conversiones por Hora')).toBeInTheDocument();
        expect(screen.getByText('Tiempo Promedio (seg)')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should render Core Web Vitals indicators', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const performanceTab = screen.getByRole('tab', { name: 'Rendimiento' });
      fireEvent.click(performanceTab);
      
      await waitFor(() => {
        expect(screen.getByText('First Contentful Paint')).toBeInTheDocument();
        expect(screen.getByText('Largest Contentful Paint')).toBeInTheDocument();
        expect(screen.getByText('Cumulative Layout Shift')).toBeInTheDocument();
        expect(screen.getByText('First Input Delay')).toBeInTheDocument();
      });
    });

    it('should show performance values with appropriate styling', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const performanceTab = screen.getByRole('tab', { name: 'Rendimiento' });
      fireEvent.click(performanceTab);
      
      await waitFor(() => {
        expect(screen.getByText('1.2s')).toBeInTheDocument();
        expect(screen.getByText('2.1s')).toBeInTheDocument();
        expect(screen.getByText('0.05')).toBeInTheDocument();
        expect(screen.getByText('45ms')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Segmentation', () => {
    it('should render customer segment charts', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const segmentsTab = screen.getByRole('tab', { name: 'Segmentos' });
      fireEvent.click(segmentsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByText('Valor por Segmento')).toBeInTheDocument();
      });
    });
  });

  describe('Optimization Insights', () => {
    it('should render optimization opportunities', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const optimizationTab = screen.getByRole('tab', { name: 'Optimización' });
      fireEvent.click(optimizationTab);
      
      await waitFor(() => {
        expect(screen.getByText('Oportunidades de Mejora')).toBeInTheDocument();
        expect(screen.getByText('Acciones Recomendadas')).toBeInTheDocument();
        expect(screen.getByText('Impacto Estimado')).toBeInTheDocument();
      });
    });

    it('should show specific optimization recommendations', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const optimizationTab = screen.getByRole('tab', { name: 'Optimización' });
      fireEvent.click(optimizationTab);
      
      await waitFor(() => {
        expect(screen.getByText('Carrito Abandonado')).toBeInTheDocument();
        expect(screen.getByText('Tiempo de Carga')).toBeInTheDocument();
        expect(screen.getByText('Conversión Móvil')).toBeInTheDocument();
      });
    });

    it('should show actionable recommendations', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const optimizationTab = screen.getByRole('tab', { name: 'Optimización' });
      fireEvent.click(optimizationTab);
      
      await waitFor(() => {
        expect(screen.getByText('Implementar recordatorios de carrito')).toBeInTheDocument();
        expect(screen.getByText('Optimizar imágenes de productos')).toBeInTheDocument();
        expect(screen.getByText('Simplificar checkout móvil')).toBeInTheDocument();
      });
    });

    it('should display impact projections', async () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      const optimizationTab = screen.getByRole('tab', { name: 'Optimización' });
      fireEvent.click(optimizationTab);
      
      await waitFor(() => {
        expect(screen.getByText('Conversión Esperada')).toBeInTheDocument();
        expect(screen.getByText('Ingresos Adicionales')).toBeInTheDocument();
        expect(screen.getByText('ROI Proyectado')).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format currency values correctly', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      // Values should be formatted as currency
      expect(screen.getByText(/\$580/)).toBeInTheDocument();
    });

    it('should format percentage values correctly', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      // Values should include percentage symbol
      expect(screen.getByText('12.6%')).toBeInTheDocument();
    });

    it('should format date timestamps correctly', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText(/Última actualización:/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(5);
    });

    it('should have proper semantic structure', () => {
      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByRole('main') || screen.getByRole('region')).toBeTruthy();
      expect(screen.getAllByRole('button')).toHaveLength(2); // Refresh and Export buttons
    });
  });

  describe('Error Handling', () => {
    it('should handle missing store data gracefully', () => {
      useMonitoringStore.mockReturnValue({
        businessMetrics: null,
        performanceData: null,
        alertsData: null,
        refreshBusinessMetrics: vi.fn()
      });

      renderWithProviders(<BusinessMetricsPanel />);
      
      expect(screen.getByText('Panel de Métricas de Negocio')).toBeInTheDocument();
    });

    it('should handle refresh errors gracefully', async () => {
      const failingRefresh = vi.fn().mockRejectedValue(new Error('Network error'));
      useMonitoringStore.mockReturnValue({
        ...mockMonitoringStore,
        refreshBusinessMetrics: failingRefresh
      });

      renderWithProviders(<BusinessMetricsPanel />);
      
      const refreshButton = screen.getByRole('button', { name: /Actualizar/i });
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(failingRefresh).toHaveBeenCalled();
      });
    });
  });
});
