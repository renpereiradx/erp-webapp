/**
 * Sales Components Testing - Wave 8 Component Tests
 * Tests progresivos para validar componentes de ventas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock de hooks necesarios
vi.mock('@/hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({
    getCardStyles: () => 'mock-card-styles',
    getTextStyles: () => 'mock-text-styles',
    getButtonStyles: () => 'mock-button-styles'
  })
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key
  })
}));

vi.mock('@/hooks/useLiveRegion', () => ({
  useLiveRegion: () => ({
    announce: vi.fn(),
    clear: vi.fn(),
    LiveRegions: () => React.createElement('div', { 'aria-live': 'polite' })
  })
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn(),
    error: vi.fn()
  }
}));

// Componente simple de métrica para testing
const MetricCard = ({ title, value, change, icon: Icon }) => {
  return (
    <div data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`} className="metric-card">
      <div className="metric-content">
        <h3>{title}</h3>
        <p className="metric-value">{value}</p>
        {change && <span className="metric-change">{change}</span>}
      </div>
      {Icon && (
        <div className="metric-icon">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

// Componente simple de acción rápida
const QuickActionButton = ({ label, onClick, icon: Icon, disabled = false }) => {
  return (
    <button
      data-testid={`action-${label.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      disabled={disabled}
      className="quick-action-btn"
    >
      {Icon && <Icon size={16} />}
      <span>{label}</span>
    </button>
  );
};

// Componente de dashboard simplificado
const SimpleSalesDashboard = ({ metrics = [], actions = [] }) => {
  return (
    <div data-testid="sales-dashboard" className="sales-dashboard">
      <header>
        <h1>Dashboard de Ventas</h1>
        <p>Panel principal para gestión de ventas</p>
      </header>
      
      <section data-testid="metrics-section" className="metrics">
        <h2>Métricas</h2>
        <div className="metrics-grid">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
      </section>
      
      <section data-testid="actions-section" className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          {actions.map((action, index) => (
            <QuickActionButton key={index} {...action} />
          ))}
        </div>
      </section>
    </div>
  );
};

describe('Wave 8 - Sales Component Testing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MetricCard Component', () => {
    it('should render metric information correctly', () => {
      const mockIcon = ({ size }) => <div data-testid="mock-icon" style={{ fontSize: size }} />;
      
      render(
        <MetricCard
          title="Ventas Totales"
          value="€1,234.56"
          change="+12.5%"
          icon={mockIcon}
        />
      );

      expect(screen.getByText('Ventas Totales')).toBeInTheDocument();
      expect(screen.getByText('€1,234.56')).toBeInTheDocument();
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('should handle missing optional props', () => {
      render(<MetricCard title="Test Metric" value="100" />);
      
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });
  });

  describe('QuickActionButton Component', () => {
    it('should render action button correctly', () => {
      const mockIcon = ({ size }) => <div data-testid="action-icon" style={{ fontSize: size }} />;
      const mockOnClick = vi.fn();
      
      render(
        <QuickActionButton
          label="Nueva Venta"
          onClick={mockOnClick}
          icon={mockIcon}
        />
      );

      const button = screen.getByTestId('action-nueva-venta');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Nueva Venta')).toBeInTheDocument();
      expect(screen.getByTestId('action-icon')).toBeInTheDocument();
    });

    it('should handle click events', () => {
      const mockOnClick = vi.fn();
      
      render(
        <QuickActionButton
          label="Test Action"
          onClick={mockOnClick}
        />
      );

      const button = screen.getByTestId('action-test-action');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should handle disabled state', () => {
      const mockOnClick = vi.fn();
      
      render(
        <QuickActionButton
          label="Disabled Action"
          onClick={mockOnClick}
          disabled={true}
        />
      );

      const button = screen.getByTestId('action-disabled-action');
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('SimpleSalesDashboard Component', () => {
    const mockMetrics = [
      { title: 'Ventas Hoy', value: '€500.00', change: '+5%' },
      { title: 'Productos Vendidos', value: '25', change: '+2' },
      { title: 'Clientes Atendidos', value: '12', change: '+3' }
    ];

    const mockActions = [
      { label: 'Nueva Venta', onClick: vi.fn() },
      { label: 'Ver Reportes', onClick: vi.fn() },
      { label: 'Gestionar Inventario', onClick: vi.fn() }
    ];

    it('should render dashboard structure correctly', () => {
      render(<SimpleSalesDashboard metrics={mockMetrics} actions={mockActions} />);
      
      expect(screen.getByTestId('sales-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard de Ventas')).toBeInTheDocument();
      expect(screen.getByText('Panel principal para gestión de ventas')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-section')).toBeInTheDocument();
      expect(screen.getByTestId('actions-section')).toBeInTheDocument();
    });

    it('should render all metrics', () => {
      render(<SimpleSalesDashboard metrics={mockMetrics} actions={[]} />);
      
      expect(screen.getByTestId('metric-ventas-hoy')).toBeInTheDocument();
      expect(screen.getByTestId('metric-productos-vendidos')).toBeInTheDocument();
      expect(screen.getByTestId('metric-clientes-atendidos')).toBeInTheDocument();
      
      expect(screen.getByText('€500.00')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should render all actions', () => {
      render(<SimpleSalesDashboard metrics={[]} actions={mockActions} />);
      
      expect(screen.getByTestId('action-nueva-venta')).toBeInTheDocument();
      expect(screen.getByTestId('action-ver-reportes')).toBeInTheDocument();
      expect(screen.getByTestId('action-gestionar-inventario')).toBeInTheDocument();
    });

    it('should handle empty props gracefully', () => {
      render(<SimpleSalesDashboard />);
      
      expect(screen.getByTestId('sales-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard de Ventas')).toBeInTheDocument();
      
      // Should not crash with empty arrays
      const metricsGrid = screen.getByTestId('metrics-section').querySelector('.metrics-grid');
      const actionsGrid = screen.getByTestId('actions-section').querySelector('.actions-grid');
      
      expect(metricsGrid).toBeInTheDocument();
      expect(actionsGrid).toBeInTheDocument();
    });

    it('should support interaction with action buttons', () => {
      const mockActions = [
        { label: 'Interactive Action', onClick: vi.fn() }
      ];
      
      render(<SimpleSalesDashboard metrics={[]} actions={mockActions} />);
      
      const button = screen.getByTestId('action-interactive-action');
      fireEvent.click(button);
      
      expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Integration Tests', () => {
    it('should integrate multiple components correctly', () => {
      const fullDashboardProps = {
        metrics: [
          { title: 'Revenue', value: '€1000', change: '+10%' },
          { title: 'Orders', value: '50', change: '+5' }
        ],
        actions: [
          { label: 'New Sale', onClick: vi.fn() },
          { label: 'Reports', onClick: vi.fn() }
        ]
      };
      
      render(<SimpleSalesDashboard {...fullDashboardProps} />);
      
      // Verify all metrics and actions are present
      expect(screen.getByTestId('metric-revenue')).toBeInTheDocument();
      expect(screen.getByTestId('metric-orders')).toBeInTheDocument();
      expect(screen.getByTestId('action-new-sale')).toBeInTheDocument();
      expect(screen.getByTestId('action-reports')).toBeInTheDocument();
      
      // Verify interactivity
      fireEvent.click(screen.getByTestId('action-new-sale'));
      expect(fullDashboardProps.actions[0].onClick).toHaveBeenCalled();
    });

    it('should maintain component state correctly', () => {
      const { rerender } = render(
        <SimpleSalesDashboard 
          metrics={[{ title: 'Test', value: '100' }]} 
          actions={[]} 
        />
      );
      
      expect(screen.getByText('100')).toBeInTheDocument();
      
      // Update props
      rerender(
        <SimpleSalesDashboard 
          metrics={[{ title: 'Test', value: '200' }]} 
          actions={[]} 
        />
      );
      
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Testing', () => {
    it('should have proper heading structure', () => {
      render(<SimpleSalesDashboard metrics={[]} actions={[]} />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      
      expect(h1).toHaveTextContent('Dashboard de Ventas');
      expect(h2Elements).toHaveLength(2); // Métricas and Acciones Rápidas
    });

    it('should have proper button roles', () => {
      const actions = [{ label: 'Test Button', onClick: vi.fn() }];
      render(<SimpleSalesDashboard metrics={[]} actions={actions} />);
      
      const button = screen.getByRole('button', { name: /test button/i });
      expect(button).toBeInTheDocument();
    });
  });
});
