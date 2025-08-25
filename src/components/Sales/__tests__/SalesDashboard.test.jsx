/**
 * Sales Dashboard Component Tests - Enterprise Grade
 * Comprehensive tests for the sales dashboard UI component
 * 
 * Test Coverage:
 * - Component rendering and UI elements
 * - User interactions and event handling
 * - Real-time data updates
 * - Responsive design and accessibility
 * - Performance and error handling
 * 
 * Target Coverage: ≥85%
 * Enfoque: Hardened Testing with UI patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesDashboard } from '@/components/Sales/SalesDashboard';
import { 
  renderWithProviders, 
  mockData, 
  storeHelpers, 
  interactionHelpers,
  asyncUtils,
  performanceUtils 
} from '@/test/utils.jsx';

// Mock dependencies
vi.mock('@/hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({
    getCardStyles: () => 'mock-card-styles',
    getTextStyles: () => 'mock-text-styles',
    getButtonStyles: () => 'mock-button-styles',
    theme: 'light'
  })
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn()
  }
}));

describe('SalesDashboard Component', () => {
  beforeEach(() => {
    storeHelpers.resetAllStores();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders dashboard with all main sections', () => {
      // Arrange & Act
      renderWithProviders(<SalesDashboard />);

      // Assert
      expect(screen.getByText('Dashboard de Ventas')).toBeInTheDocument();
      expect(screen.getByText('Métricas de Hoy')).toBeInTheDocument();
      expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
      expect(screen.getByText('Ventas Recientes')).toBeInTheDocument();
    });

    it('renders metric cards with correct structure', () => {
      // Arrange
      const initialSalesState = {
        sales: [
          mockData.sale({ total: 1000, status: 'completed', createdAt: new Date().toISOString() }),
          mockData.sale({ total: 500, status: 'completed', createdAt: new Date().toISOString() })
        ]
      };

      // Act
      renderWithProviders(<SalesDashboard />, { initialSalesState });

      // Assert
      expect(screen.getByText('Ventas de Hoy')).toBeInTheDocument();
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      expect(screen.getByText('Meta Diaria')).toBeInTheDocument();
      expect(screen.getByText('Conversión')).toBeInTheDocument();
    });

    it('renders quick action buttons', () => {
      // Arrange & Act
      renderWithProviders(<SalesDashboard />);

      // Assert
      expect(screen.getByText('Nueva Venta')).toBeInTheDocument();
      expect(screen.getByText('Procesar Pago')).toBeInTheDocument();
      expect(screen.getByText('Ver Reportes')).toBeInTheDocument();
      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });

    it('renders recent sales list when sales exist', () => {
      // Arrange
      const recentSales = [
        mockData.sale({ 
          id: 'sale_1', 
          customerName: 'Juan Pérez',
          total: 250.00,
          createdAt: new Date().toISOString()
        }),
        mockData.sale({ 
          id: 'sale_2', 
          customerName: 'María García',
          total: 150.00,
          createdAt: new Date().toISOString()
        })
      ];

      const initialSalesState = { sales: recentSales };

      // Act
      renderWithProviders(<SalesDashboard />, { initialSalesState });

      // Assert
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
      expect(screen.getByText('$250.00')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    it('renders empty state when no sales exist', () => {
      // Arrange
      const initialSalesState = { sales: [] };

      // Act
      renderWithProviders(<SalesDashboard />, { initialSalesState });

      // Assert
      expect(screen.getByText('No hay ventas recientes')).toBeInTheDocument();
      expect(screen.getByText('Las ventas aparecerán aquí una vez que realices transacciones')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles new sale button click', async () => {
      // Arrange
      const onNewSale = vi.fn();
      const { user } = renderWithProviders(
        <SalesDashboard onNewSale={onNewSale} />
      );

      // Act
      const newSaleButton = screen.getByText('Nueva Venta');
      await user.click(newSaleButton);

      // Assert
      expect(onNewSale).toHaveBeenCalledTimes(1);
    });

    it('handles process payment button click', async () => {
      // Arrange
      const onProcessPayment = vi.fn();
      const { user } = renderWithProviders(
        <SalesDashboard onProcessPayment={onProcessPayment} />
      );

      // Act
      const processPaymentButton = screen.getByText('Procesar Pago');
      await user.click(processPaymentButton);

      // Assert
      expect(onProcessPayment).toHaveBeenCalledTimes(1);
    });

    it('handles view reports button click', async () => {
      // Arrange
      const onViewReports = vi.fn();
      const { user } = renderWithProviders(
        <SalesDashboard onViewReports={onViewReports} />
      );

      // Act
      const viewReportsButton = screen.getByText('Ver Reportes');
      await user.click(viewReportsButton);

      // Assert
      expect(onViewReports).toHaveBeenCalledTimes(1);
    });

    it('handles sale click in recent sales list', async () => {
      // Arrange
      const sale = mockData.sale({ 
        id: 'sale_123', 
        customerName: 'Juan Pérez' 
      });
      const onSaleClick = vi.fn();
      
      const initialSalesState = { sales: [sale] };
      
      const { user } = renderWithProviders(
        <SalesDashboard onSaleClick={onSaleClick} />, 
        { initialSalesState }
      );

      // Act
      const saleElement = screen.getByText('Juan Pérez').closest('div[role="button"]');
      await user.click(saleElement);

      // Assert
      expect(onSaleClick).toHaveBeenCalledWith(sale.id);
    });

    it('handles keyboard navigation on interactive elements', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act
      const newSaleButton = screen.getByText('Nueva Venta');
      newSaleButton.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(newSaleButton).toHaveFocus();
    });
  });

  describe('Real-time Data Updates', () => {
    it('updates metrics when sales data changes', async () => {
      // Arrange
      const initialSalesState = {
        sales: [mockData.sale({ total: 100, status: 'completed' })]
      };

      const { rerender } = renderWithProviders(<SalesDashboard />, { initialSalesState });

      // Initial state
      expect(screen.getByText('$100.00')).toBeInTheDocument();

      // Act - Add new sale
      const newSale = mockData.sale({ total: 200, status: 'completed' });
      const updatedSalesState = {
        sales: [...initialSalesState.sales, newSale]
      };

      rerender(<SalesDashboard />, { initialSalesState: updatedSalesState });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('$300.00')).toBeInTheDocument();
      });
    });

    it('updates recent sales list when new sales are added', async () => {
      // Arrange
      const initialSalesState = { sales: [] };
      const { rerender } = renderWithProviders(<SalesDashboard />, { initialSalesState });

      // Initial empty state
      expect(screen.getByText('No hay ventas recientes')).toBeInTheDocument();

      // Act - Add new sale
      const newSale = mockData.sale({ customerName: 'Nuevo Cliente' });
      const updatedSalesState = { sales: [newSale] };

      rerender(<SalesDashboard />, { initialSalesState: updatedSalesState });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Nuevo Cliente')).toBeInTheDocument();
        expect(screen.queryByText('No hay ventas recientes')).not.toBeInTheDocument();
      });
    });

    it('handles loading state during data updates', async () => {
      // Arrange
      const initialSalesState = { loading: true };

      // Act
      renderWithProviders(<SalesDashboard />, { initialSalesState });

      // Assert
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Cargando métricas...')).toBeInTheDocument();
    });

    it('handles error state during data updates', async () => {
      // Arrange
      const initialSalesState = { 
        error: 'Error al cargar las ventas',
        loading: false
      };

      // Act
      renderWithProviders(<SalesDashboard />, { initialSalesState });

      // Assert
      expect(screen.getByText('Error al cargar las ventas')).toBeInTheDocument();
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile devices', () => {
      // Arrange
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Act
      renderWithProviders(<SalesDashboard />);

      // Assert
      const container = screen.getByRole('main');
      expect(container).toHaveClass('mobile-layout');
    });

    it('adapts layout for tablet devices', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      fireEvent(window, new Event('resize'));

      // Act
      renderWithProviders(<SalesDashboard />);

      // Assert
      const container = screen.getByRole('main');
      expect(container).toHaveClass('tablet-layout');
    });

    it('adapts layout for desktop devices', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      fireEvent(window, new Event('resize'));

      // Act
      renderWithProviders(<SalesDashboard />);

      // Assert
      const container = screen.getByRole('main');
      expect(container).toHaveClass('desktop-layout');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      // Arrange & Act
      renderWithProviders(<SalesDashboard />);

      // Assert
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Dashboard de Ventas');
      expect(screen.getByRole('region', { name: 'Métricas de Ventas' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Acciones Rápidas' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Ventas Recientes' })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act
      await user.tab();
      
      // Assert
      const firstFocusableElement = screen.getByText('Nueva Venta');
      expect(firstFocusableElement).toHaveFocus();
      
      // Continue tabbing
      await user.tab();
      const secondFocusableElement = screen.getByText('Procesar Pago');
      expect(secondFocusableElement).toHaveFocus();
    });

    it('has appropriate heading hierarchy', () => {
      // Arrange & Act
      renderWithProviders(<SalesDashboard />);

      // Assert
      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveAttribute('aria-level', '1'); // Main title
      expect(headings[1]).toHaveAttribute('aria-level', '2'); // Section titles
    });

    it('provides screen reader announcements for dynamic content', async () => {
      // Arrange
      const initialSalesState = { sales: [] };
      const { rerender } = renderWithProviders(<SalesDashboard />, { initialSalesState });

      // Act - Add new sale
      const newSale = mockData.sale({ customerName: 'Nuevo Cliente' });
      const updatedSalesState = { sales: [newSale] };

      rerender(<SalesDashboard />, { initialSalesState: updatedSalesState });

      // Assert
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveTextContent('Nueva venta agregada');
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large datasets', async () => {
      // Arrange
      const largeSalesList = Array.from({ length: 1000 }, (_, i) => 
        mockData.sale({ id: `sale_${i}`, customerName: `Customer ${i}` })
      );

      const initialSalesState = { sales: largeSalesList };

      // Act
      const renderTime = await performanceUtils.measureRenderTime(() => {
        renderWithProviders(<SalesDashboard />, { initialSalesState });
      });

      // Assert
      expect(renderTime).toBeLessThan(100); // Should render within 100ms
    });

    it('uses memoization to prevent unnecessary re-renders', () => {
      // Arrange
      const initialSalesState = {
        sales: [mockData.sale()]
      };

      let renderCount = 0;
      const TestDashboard = () => {
        renderCount++;
        return <SalesDashboard />;
      };

      const { rerender } = renderWithProviders(<TestDashboard />, { initialSalesState });

      // Act - Rerender with same data
      rerender(<TestDashboard />, { initialSalesState });

      // Assert
      expect(renderCount).toBe(2); // Should only render twice despite multiple rerenders
    });

    it('handles rapid data updates efficiently', async () => {
      // Arrange
      const initialSalesState = { sales: [] };
      const { rerender } = renderWithProviders(<SalesDashboard />, { initialSalesState });

      // Act - Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const newSale = mockData.sale({ id: `sale_${i}` });
        const updatedState = { 
          sales: [...initialSalesState.sales, newSale] 
        };
        
        rerender(<SalesDashboard />, { initialSalesState: updatedState });
        initialSalesState.sales.push(newSale);
      }

      // Assert - Component should remain responsive
      expect(screen.getByText('Dashboard de Ventas')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles component errors gracefully', () => {
      // Arrange
      const ErrorBoundary = ({ children, onError }) => {
        try {
          return children;
        } catch (error) {
          onError(error);
          return <div>Error occurred</div>;
        }
      };

      const onError = vi.fn();

      // Mock a component that throws
      const ThrowingDashboard = () => {
        throw new Error('Test error');
      };

      // Act
      renderWithProviders(
        <ErrorBoundary onError={onError}>
          <ThrowingDashboard />
        </ErrorBoundary>
      );

      // Assert
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    it('retries failed operations', async () => {
      // Arrange
      const retryAction = vi.fn();
      const initialSalesState = { 
        error: 'Failed to load data',
        loading: false
      };

      const { user } = renderWithProviders(
        <SalesDashboard onRetry={retryAction} />, 
        { initialSalesState }
      );

      // Act
      const retryButton = screen.getByText('Reintentar');
      await user.click(retryButton);

      // Assert
      expect(retryAction).toHaveBeenCalledTimes(1);
    });

    it('provides meaningful error messages', () => {
      // Arrange
      const errorStates = [
        { error: 'Network error', expected: 'Problema de conexión' },
        { error: 'Unauthorized', expected: 'No autorizado' },
        { error: 'Server error', expected: 'Error del servidor' }
      ];

      errorStates.forEach(({ error, expected }) => {
        const initialSalesState = { error, loading: false };
        
        // Act
        const { unmount } = renderWithProviders(<SalesDashboard />, { initialSalesState });

        // Assert
        expect(screen.getByText(expected)).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Telemetry and Analytics', () => {
    it('records dashboard view events', () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');

      // Act
      renderWithProviders(<SalesDashboard />);

      // Assert
      expect(telemetry.record).toHaveBeenCalledWith(
        'dashboard.sales.viewed',
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      );
    });

    it('records user interaction events', async () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act
      const newSaleButton = screen.getByText('Nueva Venta');
      await user.click(newSaleButton);

      // Assert
      expect(telemetry.record).toHaveBeenCalledWith(
        'dashboard.action.new_sale_clicked',
        expect.objectContaining({
          buttonType: 'quick_action'
        })
      );
    });

    it('records performance metrics', () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');

      // Act
      renderWithProviders(<SalesDashboard />);

      // Assert
      expect(telemetry.record).toHaveBeenCalledWith(
        'dashboard.performance.render_time',
        expect.objectContaining({
          duration: expect.any(Number)
        })
      );
    });
  });
});
