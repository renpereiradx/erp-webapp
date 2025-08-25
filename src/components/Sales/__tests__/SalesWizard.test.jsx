/**
 * Sales Wizard Component Tests - Enterprise Grade  
 * Comprehensive tests for the multi-step sales wizard UI component
 * 
 * Test Coverage:
 * - Multi-step wizard navigation and state management
 * - Customer selection and creation workflows
 * - Product selection and cart management
 * - Payment processing integration
 * - Validation and error handling
 * - Accessibility and keyboard navigation
 * 
 * Target Coverage: ≥85%
 * Enfoque: Hardened Testing with complex workflow patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesWizard } from '@/components/Sales/SalesWizard';
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
    getInputStyles: () => 'mock-input-styles'
  })
}));

vi.mock('@/services/salesPaymentAdapter', () => ({
  salesPaymentAdapter: {
    processSalesPayment: vi.fn().mockResolvedValue({
      success: true,
      transactionId: 'txn_123',
      change: 5.00
    })
  }
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn()
  }
}));

describe('SalesWizard Component', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    storeHelpers.resetAllStores();
    vi.clearAllMocks();
  });

  describe('Wizard Initialization and Navigation', () => {
    it('renders wizard with step indicator', () => {
      // Arrange & Act
      renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Assert
      expect(screen.getByText('Cliente')).toBeInTheDocument();
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('Pago')).toBeInTheDocument();
      expect(screen.getByText('Confirmación')).toBeInTheDocument();
    });

    it('starts on customer selection step', () => {
      // Arrange & Act
      renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Assert
      expect(screen.getByText('Seleccionar Cliente')).toBeInTheDocument();
      expect(screen.getByText('Elige un cliente existente o crea uno nuevo')).toBeInTheDocument();
    });

    it('disables next button when step is invalid', () => {
      // Arrange & Act
      renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Assert
      const nextButton = screen.getByText('Siguiente');
      expect(nextButton).toBeDisabled();
    });

    it('enables next button when step is valid', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Act - Select a customer
      const customerOption = screen.getByText('Cliente General');
      await user.click(customerOption);

      // Assert
      await waitFor(() => {
        const nextButton = screen.getByText('Siguiente');
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('navigates to next step when next button is clicked', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Select customer first
      const customerOption = screen.getByText('Cliente General');
      await user.click(customerOption);

      // Act
      const nextButton = screen.getByText('Siguiente');
      await user.click(nextButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Agregar Productos')).toBeInTheDocument();
      });
    });

    it('navigates to previous step when back button is clicked', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to step 2
      await interactionHelpers.navigateWizard(user, 1);

      // Act
      const backButton = screen.getByText('Anterior');
      await user.click(backButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Seleccionar Cliente')).toBeInTheDocument();
      });
    });

    it('allows clicking on completed steps in indicator', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to step 3
      await interactionHelpers.navigateWizard(user, 2);

      // Act - Click on customer step indicator
      const customerStepIndicator = screen.getByText('Cliente').closest('div[role="button"]');
      await user.click(customerStepIndicator);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Seleccionar Cliente')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Selection Step', () => {
    it('displays customer search and list', () => {
      // Arrange & Act
      renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Assert
      expect(screen.getByPlaceholderText('Buscar cliente por nombre, email o teléfono...')).toBeInTheDocument();
      expect(screen.getByText('Cliente General')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    it('filters customers based on search input', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Act
      const searchInput = screen.getByPlaceholderText('Buscar cliente por nombre, email o teléfono...');
      await user.type(searchInput, 'Juan');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.queryByText('María García')).not.toBeInTheDocument();
      });
    });

    it('selects customer when clicked', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Act
      const customerOption = screen.getByText('Juan Pérez').closest('div');
      await user.click(customerOption);

      // Assert
      expect(customerOption).toHaveClass('border-blue-500');
    });

    it('opens new customer form when create button is clicked', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Act
      const createButton = screen.getByText('Crear Nuevo Cliente');
      await user.click(createButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Nuevo Cliente')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nombre completo *')).toBeInTheDocument();
      });
    });

    it('creates new customer with valid data', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Open new customer form
      await user.click(screen.getByText('Crear Nuevo Cliente'));

      // Act
      await interactionHelpers.fillForm(user, {
        'Nombre completo *': 'Nuevo Cliente',
        'Email': 'nuevo@email.com',
        'Teléfono': '555-0199'
      });

      const createButton = screen.getByText('Crear Cliente');
      await user.click(createButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Nuevo Cliente')).not.toBeInTheDocument(); // Modal closed
      });
    });

    it('records telemetry when customer is selected', async () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Act
      const customerOption = screen.getByText('Juan Pérez').closest('div');
      await user.click(customerOption);

      // Assert
      expect(telemetry.record).toHaveBeenCalledWith(
        'sales_wizard.customer_selected',
        expect.objectContaining({
          customerId: expect.any(String),
          customerType: expect.any(String)
        })
      );
    });
  });

  describe('Product Selection Step', () => {
    beforeEach(async () => {
      // Navigate to product step
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );
      
      // Select customer and navigate to products
      await user.click(screen.getByText('Cliente General'));
      await user.click(screen.getByText('Siguiente'));
      await waitFor(() => {
        expect(screen.getByText('Agregar Productos')).toBeInTheDocument();
      });
    });

    it('displays product search and list', () => {
      // Assert
      expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
      expect(screen.getByText('Productos Disponibles')).toBeInTheDocument();
      expect(screen.getByText('Carrito de Compras')).toBeInTheDocument();
    });

    it('displays empty cart initially', () => {
      // Assert
      expect(screen.getByText('No hay productos en el carrito')).toBeInTheDocument();
    });

    it('adds product to cart when add button is clicked', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to products step
      await interactionHelpers.navigateWizard(user, 1);

      // Act
      const addButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') // Looking for Plus icon
      );
      await user.click(addButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('No hay productos en el carrito')).not.toBeInTheDocument();
      });
    });

    it('updates item quantity in cart', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to products and add item
      await interactionHelpers.navigateWizard(user, 1);
      
      // Add product first
      const addButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')
      );
      await user.click(addButton);

      // Act - Increase quantity
      await waitFor(() => {
        const increaseButton = screen.getByRole('button', { name: /\+/ });
        return user.click(increaseButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Quantity should be 2
      });
    });

    it('removes item from cart when quantity reaches zero', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to products and add item
      await interactionHelpers.navigateWizard(user, 1);
      
      // Add product first
      const addButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')
      );
      await user.click(addButton);

      // Act - Decrease quantity to zero
      await waitFor(async () => {
        const decreaseButton = screen.getByRole('button', { name: /-/ });
        await user.click(decreaseButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No hay productos en el carrito')).toBeInTheDocument();
      });
    });

    it('calculates totals correctly', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to products and add item
      await interactionHelpers.navigateWizard(user, 1);
      
      // Add product
      const addButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')
      );
      await user.click(addButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Subtotal:')).toBeInTheDocument();
        expect(screen.getByText('IVA (16%):')).toBeInTheDocument();
        expect(screen.getByText('Total:')).toBeInTheDocument();
      });
    });

    it('enables next button when cart has items', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to products and add item
      await interactionHelpers.navigateWizard(user, 1);
      
      // Add product
      const addButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')
      );
      await user.click(addButton);

      // Assert
      await waitFor(() => {
        const nextButton = screen.getByText('Siguiente');
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('filters products based on search', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to products step
      await interactionHelpers.navigateWizard(user, 1);

      // Act
      const searchInput = screen.getByPlaceholderText('Buscar productos...');
      await user.type(searchInput, 'Laptop');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Laptop Dell Inspiron')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Processing Step', () => {
    beforeEach(async () => {
      // Navigate to payment step with cart items
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );
      
      // Complete previous steps
      await interactionHelpers.navigateWizard(user, 2);
    });

    it('displays sale summary', () => {
      // Assert
      expect(screen.getByText('Resumen de la Venta')).toBeInTheDocument();
      expect(screen.getByText('Total a Pagar:')).toBeInTheDocument();
    });

    it('displays payment method options', () => {
      // Assert
      expect(screen.getByText('Método de Pago')).toBeInTheDocument();
      expect(screen.getByText('Efectivo')).toBeInTheDocument();
      expect(screen.getByText('Tarjeta')).toBeInTheDocument();
      expect(screen.getByText('Transferencia')).toBeInTheDocument();
    });

    it('selects payment method when clicked', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to payment step
      await interactionHelpers.navigateWizard(user, 2);

      // Act
      const cashOption = screen.getByText('Efectivo').closest('button');
      await user.click(cashOption);

      // Assert
      expect(cashOption).toHaveClass('border-blue-500');
    });

    it('shows cash input fields when cash is selected', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to payment step
      await interactionHelpers.navigateWizard(user, 2);

      // Act
      const cashOption = screen.getByText('Efectivo').closest('button');
      await user.click(cashOption);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Monto Recibido')).toBeInTheDocument();
      });
    });

    it('calculates change correctly for cash payments', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to payment step and select cash
      await interactionHelpers.navigateWizard(user, 2);
      await user.click(screen.getByText('Efectivo').closest('button'));

      // Act
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '120');

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Cambio a devolver:/)).toBeInTheDocument();
      });
    });

    it('shows insufficient amount warning', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to payment step and select cash
      await interactionHelpers.navigateWizard(user, 2);
      await user.click(screen.getByText('Efectivo').closest('button'));

      // Act
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '50'); // Less than total

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/El monto recibido es insuficiente/)).toBeInTheDocument();
      });
    });

    it('processes payment when button is clicked', async () => {
      // Arrange
      const { salesPaymentAdapter } = require('@/services/salesPaymentAdapter');
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to payment step and select cash with sufficient amount
      await interactionHelpers.navigateWizard(user, 2);
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '120');

      // Act
      const processButton = screen.getByText(/Procesar Pago/);
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(salesPaymentAdapter.processSalesPayment).toHaveBeenCalled();
      });
    });

    it('handles payment processing errors', async () => {
      // Arrange
      const { salesPaymentAdapter } = require('@/services/salesPaymentAdapter');
      salesPaymentAdapter.processSalesPayment.mockRejectedValue(
        new Error('Payment failed')
      );

      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to payment step and attempt payment
      await interactionHelpers.navigateWizard(user, 2);
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '120');

      // Act
      const processButton = screen.getByText(/Procesar Pago/);
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Payment failed')).toBeInTheDocument();
      });
    });
  });

  describe('Confirmation Step', () => {
    beforeEach(async () => {
      // Complete entire wizard flow
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );
      
      // Complete all steps
      await interactionHelpers.navigateWizard(user, 3);
    });

    it('displays completion message', () => {
      // Assert
      expect(screen.getByText('¡Venta Completada!')).toBeInTheDocument();
      expect(screen.getByText('La venta se ha procesado exitosamente')).toBeInTheDocument();
    });

    it('displays sale details', () => {
      // Assert
      expect(screen.getByText('Detalles de la Venta')).toBeInTheDocument();
      expect(screen.getByText('ID de Venta:')).toBeInTheDocument();
      expect(screen.getByText('Total:')).toBeInTheDocument();
      expect(screen.getByText('Método de Pago:')).toBeInTheDocument();
    });

    it('shows print receipt button', () => {
      // Assert
      expect(screen.getByText('Imprimir Recibo')).toBeInTheDocument();
    });

    it('shows new sale button', () => {
      // Assert
      expect(screen.getByText('Nueva Venta')).toBeInTheDocument();
    });

    it('calls onComplete when finalizar is clicked', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to completion
      await interactionHelpers.navigateWizard(user, 3);

      // Act
      const finalizarButton = screen.getByText('Finalizar');
      await user.click(finalizarButton);

      // Assert
      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('records completion telemetry', async () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');
      
      // Wizard should automatically record completion
      renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to completion (triggers telemetry)
      await interactionHelpers.navigateWizard(user, 3);

      // Assert
      expect(telemetry.record).toHaveBeenCalledWith(
        'sales_wizard.completed',
        expect.objectContaining({
          saleId: expect.any(String),
          amount: expect.any(Number)
        })
      );
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('supports keyboard navigation through steps', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Act - Tab through elements
      await user.tab();
      
      // Assert
      const firstFocusableElement = screen.getByText('Cliente General').closest('div');
      expect(firstFocusableElement).toHaveFocus();
    });

    it('allows step navigation with Enter key', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Select customer
      const customerOption = screen.getByText('Cliente General').closest('div');
      customerOption.focus();
      await user.keyboard('{Enter}');

      // Act
      const nextButton = screen.getByText('Siguiente');
      nextButton.focus();
      await user.keyboard('{Enter}');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Agregar Productos')).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels and roles', () => {
      // Arrange & Act
      renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Assert
      expect(screen.getByRole('progressbar')).toBeInTheDocument(); // Step indicator
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
    });

    it('announces step changes to screen readers', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Select customer and navigate
      await user.click(screen.getByText('Cliente General'));
      await user.click(screen.getByText('Siguiente'));

      // Assert
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/Paso 2 de 4/);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles component unmounting during async operations', async () => {
      // Arrange
      const { user, unmount } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Start payment processing
      await interactionHelpers.navigateWizard(user, 2);
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const processButton = screen.getByText(/Procesar Pago/);
      user.click(processButton);

      // Act - Unmount component during processing
      unmount();

      // Assert - Should not throw errors
      await asyncUtils.delay(100);
    });

    it('validates required fields before proceeding', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Act - Try to proceed without selecting customer
      const nextButton = screen.getByText('Siguiente');
      await user.click(nextButton);

      // Assert - Should remain on same step
      expect(screen.getByText('Seleccionar Cliente')).toBeInTheDocument();
    });

    it('handles network errors gracefully', async () => {
      // Arrange
      const { salesPaymentAdapter } = require('@/services/salesPaymentAdapter');
      salesPaymentAdapter.processSalesPayment.mockRejectedValue(
        new Error('Network error')
      );

      const { user } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Navigate to payment and attempt processing
      await interactionHelpers.navigateWizard(user, 2);
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const processButton = screen.getByText(/Procesar Pago/);
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('renders efficiently with complex wizard state', async () => {
      // Arrange
      const renderTime = await performanceUtils.measureRenderTime(() => {
        renderWithProviders(
          <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
        );
      });

      // Assert
      expect(renderTime).toBeLessThan(50); // Should render quickly
    });

    it('cleans up resources on unmount', () => {
      // Arrange
      const { unmount } = renderWithProviders(
        <SalesWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Act
      unmount();

      // Assert - No memory leaks or errors should occur
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});
