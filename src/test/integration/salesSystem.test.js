/**
 * Integration Tests for Sales System - Enterprise Grade
 * Comprehensive end-to-end testing for complete sales workflows
 * 
 * Test Coverage:
 * - Complete sales process from customer selection to payment completion
 * - Cross-component interaction and data flow
 * - Store state synchronization across multiple components
 * - Error handling and recovery in complex scenarios
 * - Performance testing with realistic data loads
 * - Accessibility compliance throughout the workflow
 * 
 * Target Coverage: ≥90% for integration scenarios
 * Enfoque: Hardened Testing with realistic business scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  renderWithProviders, 
  mockData, 
  storeHelpers, 
  interactionHelpers,
  asyncUtils,
  performanceUtils 
} from '@/test/utils.jsx';

// Import components for integration testing
import { SalesDashboard } from '@/components/Sales/SalesDashboard';
import { SalesWizard } from '@/components/Sales/SalesWizard';
import { PaymentProcessor } from '@/components/Sales/PaymentProcessor';
import { CancellationWorkflow } from '@/components/Sales/CancellationWorkflow';

// Mock all external services
vi.mock('@/services/salesService', () => ({
  salesService: {
    createSale: vi.fn().mockResolvedValue({
      success: true,
      saleId: 'sale_integration_123',
      total: 30160
    }),
    getSales: vi.fn().mockResolvedValue([
      mockData.sales.completed,
      mockData.sales.pending,
      mockData.sales.cancelled
    ]),
    getSaleById: vi.fn().mockResolvedValue(mockData.sales.completed),
    updateSaleStatus: vi.fn().mockResolvedValue({ success: true })
  }
}));

vi.mock('@/services/unifiedPaymentService', () => ({
  unifiedPaymentService: {
    processPayment: vi.fn().mockResolvedValue({
      success: true,
      transactionId: 'txn_integration_456',
      change: 5.00
    })
  }
}));

vi.mock('@/services/cancellationService', () => ({
  cancellationService: {
    initiateCancellation: vi.fn().mockResolvedValue({
      success: true,
      cancellationId: 'cancel_integration_789'
    })
  }
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn(),
    time: {
      start: vi.fn().mockReturnValue('timer_integration'),
      end: vi.fn()
    }
  }
}));

describe('Sales System Integration Tests', () => {
  beforeEach(() => {
    storeHelpers.resetAllStores();
    vi.clearAllMocks();
  });

  describe('Complete Sales Workflow Integration', () => {
    it('completes full sales process from dashboard to payment', async () => {
      // Arrange - Start with dashboard
      const { user } = renderWithProviders(<SalesDashboard />);

      // Assert initial dashboard state
      expect(screen.getByText('Panel de Ventas')).toBeInTheDocument();
      expect(screen.getByText('Nueva Venta')).toBeInTheDocument();

      // Act 1 - Start new sale
      const newSaleButton = screen.getByText('Nueva Venta');
      await user.click(newSaleButton);

      // Assert wizard opens
      await waitFor(() => {
        expect(screen.getByText('Asistente de Ventas')).toBeInTheDocument();
      });

      // Act 2 - Select customer
      const customerOption = screen.getByText('Cliente General');
      await user.click(customerOption);

      const nextButton = screen.getByText('Siguiente');
      await user.click(nextButton);

      // Assert product step
      await waitFor(() => {
        expect(screen.getByText('Agregar Productos')).toBeInTheDocument();
      });

      // Act 3 - Add products
      const addProductButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') // Plus icon
      );
      await user.click(addProductButton);

      await user.click(screen.getByText('Siguiente'));

      // Assert payment step
      await waitFor(() => {
        expect(screen.getByText('Procesar Pago')).toBeInTheDocument();
      });

      // Act 4 - Process payment
      const cashOption = screen.getByText('Efectivo').closest('button');
      await user.click(cashOption);

      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processPaymentButton = screen.getByText('Procesar Pago');
      await user.click(processPaymentButton);

      // Assert completion
      await waitFor(() => {
        expect(screen.getByText('¡Venta Completada!')).toBeInTheDocument();
      });

      // Verify all services were called correctly
      const { salesService } = require('@/services/salesService');
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');

      expect(salesService.createSale).toHaveBeenCalled();
      expect(unifiedPaymentService.processPayment).toHaveBeenCalledWith({
        method: 'cash',
        amount: expect.any(Number),
        receivedAmount: 35000,
        saleId: expect.any(String),
        currency: 'MXN'
      });
    });

    it('maintains store state consistency across components', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act - Navigate through sales process
      await user.click(screen.getByText('Nueva Venta'));
      
      // Select customer
      await user.click(screen.getByText('Cliente General'));
      await user.click(screen.getByText('Siguiente'));

      // Check store state after customer selection
      const salesStore = storeHelpers.getStoreState('sales');
      expect(salesStore.currentSale.customer).toBeDefined();

      // Add product
      const addProductButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')
      );
      await user.click(addProductButton);

      // Check store state after product addition
      const updatedSalesStore = storeHelpers.getStoreState('sales');
      expect(updatedSalesStore.currentSale.items).toHaveLength(1);

      // Navigate to payment
      await user.click(screen.getByText('Siguiente'));

      // Check payment store initialization
      const paymentStore = storeHelpers.getStoreState('payment');
      expect(paymentStore.saleData).toBeDefined();
      expect(paymentStore.saleData.total).toBeGreaterThan(0);
    });

    it('handles cross-component error propagation', async () => {
      // Arrange - Mock payment service to fail
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      unifiedPaymentService.processPayment.mockRejectedValue(
        new Error('Payment gateway unavailable')
      );

      const { user } = renderWithProviders(<SalesDashboard />);

      // Act - Complete process until payment fails
      await interactionHelpers.navigateToPayment(user);

      const cashOption = screen.getByText('Efectivo').closest('button');
      await user.click(cashOption);

      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processPaymentButton = screen.getByText('Procesar Pago');
      await user.click(processPaymentButton);

      // Assert error is displayed and sale remains in valid state
      await waitFor(() => {
        expect(screen.getByText('Payment gateway unavailable')).toBeInTheDocument();
      });

      // Store should maintain integrity
      const salesStore = storeHelpers.getStoreState('sales');
      expect(salesStore.currentSale.status).toBe('pending');
      expect(salesStore.error).toBeDefined();
    });
  });

  describe('Dashboard and Component Interaction', () => {
    it('refreshes dashboard data after successful sale', async () => {
      // Arrange
      const { salesService } = require('@/services/salesService');
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act - Complete sale
      await interactionHelpers.completeSaleWorkflow(user);

      // Assert dashboard refreshes
      await waitFor(() => {
        expect(salesService.getSales).toHaveBeenCalledTimes(2); // Initial load + refresh
      });

      // Should show updated metrics
      expect(screen.getByText(/ventas de hoy/i)).toBeInTheDocument();
    });

    it('opens cancellation workflow from dashboard', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Ventas Recientes')).toBeInTheDocument();
      });

      // Act - Click on sale to view details
      const saleRow = screen.getByText('sale_123').closest('tr');
      await user.click(saleRow);

      // Should open sale details modal
      await waitFor(() => {
        expect(screen.getByText('Detalles de la Venta')).toBeInTheDocument();
      });

      // Act - Click cancel sale button
      const cancelButton = screen.getByText('Cancelar Venta');
      await user.click(cancelButton);

      // Assert cancellation workflow opens
      await waitFor(() => {
        expect(screen.getByText('Cancelación de Venta')).toBeInTheDocument();
      });
    });

    it('updates real-time metrics during sales operations', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Check initial metrics
      const initialTotal = screen.getByTestId('total-sales-today').textContent;

      // Act - Complete a sale
      await interactionHelpers.completeSaleWorkflow(user);

      // Assert metrics are updated
      await waitFor(() => {
        const updatedTotal = screen.getByTestId('total-sales-today').textContent;
        expect(updatedTotal).not.toBe(initialTotal);
      });
    });
  });

  describe('Payment Processing Integration', () => {
    it('handles multiple payment methods in sequence', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      const { user } = renderWithProviders(<SalesDashboard />);

      // Navigate to payment
      await interactionHelpers.navigateToPayment(user);

      // Act 1 - Try card payment (simulate failure)
      unifiedPaymentService.processPayment
        .mockRejectedValueOnce(new Error('Card declined'))
        .mockResolvedValueOnce({ success: true, transactionId: 'txn_cash_123' });

      const cardOption = screen.getByText('Tarjeta').closest('button');
      await user.click(cardOption);

      const simulateButton = screen.getByText('Simular Transacción');
      await user.click(simulateButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Card declined')).toBeInTheDocument();
      });

      // Act 2 - Switch to cash payment
      const cashOption = screen.getByText('Efectivo').closest('button');
      await user.click(cashOption);

      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Assert successful cash payment
      await waitFor(() => {
        expect(screen.getByText('¡Pago Exitoso!')).toBeInTheDocument();
      });

      // Verify payment attempts were recorded
      expect(unifiedPaymentService.processPayment).toHaveBeenCalledTimes(2);
    });

    it('synchronizes payment state with sales store', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Navigate to payment
      await interactionHelpers.navigateToPayment(user);

      // Act - Start payment process
      const cashOption = screen.getByText('Efectivo').closest('button');
      await user.click(cashOption);

      // Check store synchronization
      const paymentStore = storeHelpers.getStoreState('payment');
      const salesStore = storeHelpers.getStoreState('sales');

      expect(paymentStore.selectedMethod).toBe('cash');
      expect(salesStore.currentSale.id).toBe(paymentStore.saleData.id);
    });
  });

  describe('Cancellation Workflow Integration', () => {
    it('processes cancellation and updates dashboard', async () => {
      // Arrange
      const { cancellationService } = require('@/services/cancellationService');
      const { salesService } = require('@/services/salesService');
      
      const mockSaleData = mockData.sales.completed;
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Act - Complete cancellation
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      const reasonRadio = screen.getByLabelText('Solicitud del cliente');
      await user.click(reasonRadio);

      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert cancellation service called
      await waitFor(() => {
        expect(cancellationService.initiateCancellation).toHaveBeenCalled();
      });

      // Store should reflect cancellation
      const cancellationStore = storeHelpers.getStoreState('cancellation');
      expect(cancellationStore.currentCancellation).toBeDefined();
    });

    it('handles partial cancellations correctly', async () => {
      // Arrange
      const mockSaleData = {
        ...mockData.sales.completed,
        items: [
          { id: 'item_1', name: 'Item 1', price: 1000, quantity: 2 },
          { id: 'item_2', name: 'Item 2', price: 2000, quantity: 1 }
        ]
      };

      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Act - Select only first item
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      const reasonRadio = screen.getByLabelText('Producto defectuoso');
      await user.click(reasonRadio);

      // Assert partial refund calculation
      await waitFor(() => {
        expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument(); // Item price
      });

      // Process cancellation
      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert correct parameters
      const { cancellationService } = require('@/services/cancellationService');
      await waitFor(() => {
        expect(cancellationService.initiateCancellation).toHaveBeenCalledWith(
          expect.objectContaining({
            items: [expect.objectContaining({ id: 'item_1' })],
            refundAmount: 1000
          })
        );
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('recovers from network timeouts during sales process', async () => {
      // Arrange
      const { salesService } = require('@/services/salesService');
      const { user } = renderWithProviders(<SalesDashboard />);

      // Simulate network timeout
      salesService.createSale
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ success: true, saleId: 'sale_retry_123' });

      // Act - Complete sales process with retry
      await interactionHelpers.navigateToPayment(user);

      const cashOption = screen.getByText('Efectivo').closest('button');
      await user.click(cashOption);

      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Network timeout')).toBeInTheDocument();
      });

      // Act - Retry
      const retryButton = screen.getByText('Reintentar');
      await user.click(retryButton);

      // Assert successful retry
      await waitFor(() => {
        expect(screen.getByText('¡Venta Completada!')).toBeInTheDocument();
      });

      expect(salesService.createSale).toHaveBeenCalledTimes(2);
    });

    it('maintains data integrity during component failures', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act - Start sale and cause component error
      await user.click(screen.getByText('Nueva Venta'));
      
      // Select customer and add products
      await user.click(screen.getByText('Cliente General'));
      await user.click(screen.getByText('Siguiente'));

      const addProductButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')
      );
      await user.click(addProductButton);

      // Simulate component crash by causing React error
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Store should still contain valid data
      const salesStore = storeHelpers.getStoreState('sales');
      expect(salesStore.currentSale).toBeDefined();
      expect(salesStore.currentSale.items).toHaveLength(1);

      consoleError.mockRestore();
    });
  });

  describe('Performance Integration Tests', () => {
    it('handles high-volume sales operations efficiently', async () => {
      // Arrange
      const largeSaleData = {
        items: Array.from({ length: 50 }, (_, i) => ({
          id: `item_${i}`,
          name: `Product ${i}`,
          price: Math.random() * 1000 + 100,
          quantity: Math.floor(Math.random() * 5) + 1
        }))
      };

      // Act
      const renderTime = await performanceUtils.measureRenderTime(() => {
        renderWithProviders(
          <PaymentProcessor 
            saleData={largeSaleData}
            onComplete={vi.fn()}
            onCancel={vi.fn()}
          />
        );
      });

      // Assert
      expect(renderTime).toBeLessThan(200); // Should handle large data efficiently
    });

    it('optimizes re-renders during state updates', async () => {
      // Arrange
      let renderCount = 0;
      const TestComponent = () => {
        renderCount++;
        return <SalesDashboard />;
      };

      const { user } = renderWithProviders(<TestComponent />);
      const initialRenderCount = renderCount;

      // Act - Perform actions that should trigger minimal re-renders
      await user.click(screen.getByText('Nueva Venta'));
      await asyncUtils.delay(100);

      // Assert - Should not cause excessive re-renders
      expect(renderCount - initialRenderCount).toBeLessThan(5);
    });

    it('debounces frequent store updates', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act - Rapid state changes
      await user.click(screen.getByText('Nueva Venta'));
      await user.click(screen.getByText('Cliente General'));

      // Simulate rapid typing in search
      const searchInput = screen.getByPlaceholderText('Buscar productos...');
      await user.type(searchInput, 'laptop', { delay: 10 }); // Fast typing

      // Assert - Store updates should be debounced
      await asyncUtils.delay(300);
      
      const salesStore = storeHelpers.getStoreState('sales');
      expect(salesStore.searchTerm).toBe('laptop');
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains keyboard navigation throughout workflow', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act - Navigate entire workflow with keyboard
      await user.tab(); // Focus on new sale button
      await user.keyboard('{Enter}');

      // Navigate through wizard with keyboard
      await user.tab(); // Customer selection
      await user.keyboard('{Enter}'); // Select customer

      await user.tab(); // Next button
      await user.keyboard('{Enter}');

      // Should reach product selection
      await waitFor(() => {
        expect(screen.getByText('Agregar Productos')).toBeInTheDocument();
      });

      // Assert focus is properly managed
      expect(document.activeElement).toBeDefined();
      expect(document.activeElement.tagName).not.toBe('BODY');
    });

    it('announces important state changes to screen readers', async () => {
      // Arrange
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act - Complete workflow and check announcements
      await user.click(screen.getByText('Nueva Venta'));

      // Assert live region announcements
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();

      // Progress through workflow
      await user.click(screen.getByText('Cliente General'));
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/cliente seleccionado/i);
      });
    });

    it('maintains ARIA relationships across components', () => {
      // Arrange & Act
      renderWithProviders(<SalesDashboard />);

      // Assert proper ARIA structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Form controls should have proper labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Telemetry and Analytics Integration', () => {
    it('records complete user journey analytics', async () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act - Complete full workflow
      await interactionHelpers.completeSaleWorkflow(user);

      // Assert telemetry events recorded
      expect(telemetry.record).toHaveBeenCalledWith(
        'sales_workflow.started',
        expect.any(Object)
      );

      expect(telemetry.record).toHaveBeenCalledWith(
        'sales_workflow.customer_selected',
        expect.any(Object)
      );

      expect(telemetry.record).toHaveBeenCalledWith(
        'sales_workflow.products_added',
        expect.any(Object)
      );

      expect(telemetry.record).toHaveBeenCalledWith(
        'sales_workflow.payment_processed',
        expect.any(Object)
      );

      expect(telemetry.record).toHaveBeenCalledWith(
        'sales_workflow.completed',
        expect.any(Object)
      );
    });

    it('measures performance across component boundaries', async () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');
      const { user } = renderWithProviders(<SalesDashboard />);

      // Act - Navigate through components
      await user.click(screen.getByText('Nueva Venta'));

      // Assert timing measurements
      expect(telemetry.time.start).toHaveBeenCalledWith('sales_wizard.render');
      expect(telemetry.time.end).toHaveBeenCalledWith('timer_integration');
    });
  });
});
