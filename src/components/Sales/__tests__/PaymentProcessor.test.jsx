/**
 * Payment Processor Component Tests - Enterprise Grade
 * Comprehensive tests for the unified payment processing UI component
 * 
 * Test Coverage:
 * - Payment method selection and validation
 * - Cash payment processing with change calculation
 * - Card payment integration with terminal simulation
 * - Transfer payment with reference management
 * - Multi-currency support and conversion
 * - Error handling and retry logic
 * - Loading states and user feedback
 * - Accessibility and keyboard navigation
 * 
 * Target Coverage: ≥85%
 * Enfoque: Hardened Testing with comprehensive payment scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentProcessor } from '@/components/Sales/PaymentProcessor';
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

vi.mock('@/services/unifiedPaymentService', () => ({
  unifiedPaymentService: {
    processPayment: vi.fn().mockResolvedValue({
      success: true,
      transactionId: 'txn_123456',
      change: 5.00,
      reference: 'REF123'
    }),
    validateCardPayment: vi.fn().mockResolvedValue({ valid: true }),
    cancelPayment: vi.fn().mockResolvedValue({ success: true }),
    getExchangeRate: vi.fn().mockResolvedValue(18.50),
    getSupportedCurrencies: vi.fn().mockReturnValue(['MXN', 'USD', 'EUR'])
  }
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn(),
    time: {
      start: vi.fn().mockReturnValue('timer_123'),
      end: vi.fn()
    }
  }
}));

vi.mock('@/utils/validators', () => ({
  validateAmount: vi.fn((amount) => ({
    isValid: amount > 0,
    error: amount <= 0 ? 'Amount must be greater than 0' : null
  })),
  validateCardNumber: vi.fn(() => ({ isValid: true })),
  validateCVV: vi.fn(() => ({ isValid: true }))
}));

describe('PaymentProcessor Component', () => {
  const mockSaleData = {
    id: 'sale_123',
    customerId: 'customer_456',
    items: [
      { id: 'item_1', name: 'Laptop Dell', price: 25000, quantity: 1 },
      { id: 'item_2', name: 'Mouse Óptico', price: 500, quantity: 2 }
    ],
    subtotal: 26000,
    tax: 4160,
    total: 30160,
    currency: 'MXN'
  };

  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    storeHelpers.resetAllStores();
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('renders payment processor with sale summary', () => {
      // Arrange & Act
      renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Assert
      expect(screen.getByText('Procesar Pago')).toBeInTheDocument();
      expect(screen.getByText('Resumen de la Venta')).toBeInTheDocument();
      expect(screen.getByText('$30,160.00')).toBeInTheDocument();
    });

    it('displays available payment methods', () => {
      // Arrange & Act
      renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      expect(screen.getByText('Método de Pago')).toBeInTheDocument();
      expect(screen.getByText('Efectivo')).toBeInTheDocument();
      expect(screen.getByText('Tarjeta')).toBeInTheDocument();
      expect(screen.getByText('Transferencia')).toBeInTheDocument();
    });

    it('starts with no payment method selected', () => {
      // Arrange & Act
      renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      const processButton = screen.getByText('Procesar Pago');
      expect(processButton).toBeDisabled();
    });

    it('displays currency selector for multi-currency support', () => {
      // Arrange & Act
      renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          multiCurrency={true}
        />
      );

      // Assert
      expect(screen.getByText('Moneda')).toBeInTheDocument();
      expect(screen.getByDisplayValue('MXN')).toBeInTheDocument();
    });
  });

  describe('Cash Payment Processing', () => {
    beforeEach(() => {
      renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
    });

    it('selects cash payment method', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const cashButton = screen.getByText('Efectivo').closest('button');
      await user.click(cashButton);

      // Assert
      expect(cashButton).toHaveClass('border-blue-500');
      expect(screen.getByText('Monto Recibido')).toBeInTheDocument();
    });

    it('calculates change correctly', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cambio:')).toBeInTheDocument();
        expect(screen.getByText('$4,840.00')).toBeInTheDocument();
      });
    });

    it('shows insufficient amount warning', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '25000');

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/El monto recibido es insuficiente/)).toBeInTheDocument();
      });
    });

    it('enables process button with sufficient amount', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      // Assert
      await waitFor(() => {
        const processButton = screen.getByText('Procesar Pago');
        expect(processButton).not.toBeDisabled();
      });
    });

    it('processes cash payment successfully', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(unifiedPaymentService.processPayment).toHaveBeenCalledWith({
          method: 'cash',
          amount: 30160,
          receivedAmount: 35000,
          saleId: 'sale_123',
          currency: 'MXN'
        });
      });

      expect(mockOnComplete).toHaveBeenCalledWith({
        success: true,
        transactionId: 'txn_123456',
        change: 5.00,
        method: 'cash'
      });
    });

    it('supports quick amount buttons', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          showQuickAmounts={true}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const exactAmountButton = screen.getByText('Monto Exacto');
      await user.click(exactAmountButton);

      // Assert
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      expect(amountInput).toHaveValue('30160');
    });
  });

  describe('Card Payment Processing', () => {
    beforeEach(() => {
      renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
    });

    it('selects card payment method', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const cardButton = screen.getByText('Tarjeta').closest('button');
      await user.click(cardButton);

      // Assert
      expect(cardButton).toHaveClass('border-blue-500');
      expect(screen.getByText('Procesamiento con Tarjeta')).toBeInTheDocument();
    });

    it('shows card processing interface', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Tarjeta').closest('button'));

      // Assert
      expect(screen.getByText('Terminal de Pago')).toBeInTheDocument();
      expect(screen.getByText('Inserte o pase la tarjeta')).toBeInTheDocument();
      expect(screen.getByText('Simular Transacción')).toBeInTheDocument();
    });

    it('simulates card payment successfully', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Tarjeta').closest('button'));
      
      const simulateButton = screen.getByText('Simular Transacción');
      await user.click(simulateButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Procesando...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(unifiedPaymentService.processPayment).toHaveBeenCalledWith({
          method: 'card',
          amount: 30160,
          saleId: 'sale_123',
          currency: 'MXN'
        });
      });
    });

    it('handles card payment rejection', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      unifiedPaymentService.processPayment.mockRejectedValueOnce(
        new Error('Card declined')
      );

      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Act
      await user.click(screen.getByText('Tarjeta').closest('button'));
      await user.click(screen.getByText('Simular Transacción'));

      // Assert
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Card declined',
            method: 'card'
          })
        );
      });
    });

    it('shows retry option after card failure', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      unifiedPaymentService.processPayment.mockRejectedValueOnce(
        new Error('Card declined')
      );

      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Tarjeta').closest('button'));
      await user.click(screen.getByText('Simular Transacción'));

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });

      // Assert
      const retryButton = screen.getByText('Reintentar');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Transfer Payment Processing', () => {
    it('selects transfer payment method', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const transferButton = screen.getByText('Transferencia').closest('button');
      await user.click(transferButton);

      // Assert
      expect(transferButton).toHaveClass('border-blue-500');
      expect(screen.getByText('Información de Transferencia')).toBeInTheDocument();
    });

    it('displays transfer details', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Transferencia').closest('button'));

      // Assert
      expect(screen.getByText('Número de Cuenta:')).toBeInTheDocument();
      expect(screen.getByText('CLABE:')).toBeInTheDocument();
      expect(screen.getByText('Referencia:')).toBeInTheDocument();
    });

    it('generates transfer reference', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Transferencia').closest('button'));

      // Assert
      const referenceField = screen.getByText(/REF-/);
      expect(referenceField).toBeInTheDocument();
    });

    it('confirms transfer payment', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Transferencia').closest('button'));
      
      const confirmButton = screen.getByText('Confirmar Transferencia');
      await user.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(unifiedPaymentService.processPayment).toHaveBeenCalledWith({
          method: 'transfer',
          amount: 30160,
          saleId: 'sale_123',
          reference: expect.stringMatching(/REF-/),
          currency: 'MXN'
        });
      });
    });
  });

  describe('Multi-Currency Support', () => {
    it('changes currency and updates amounts', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          multiCurrency={true}
        />
      );

      // Act
      const currencySelect = screen.getByDisplayValue('MXN');
      await user.selectOptions(currencySelect, 'USD');

      // Assert
      await waitFor(() => {
        expect(unifiedPaymentService.getExchangeRate).toHaveBeenCalledWith('MXN', 'USD');
      });

      // Should show converted amount
      await waitFor(() => {
        expect(screen.getByText(/\$1,630\.27/)).toBeInTheDocument(); // ~30160/18.5
      });
    });

    it('maintains original currency for processing', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          multiCurrency={true}
        />
      );

      // Act
      const currencySelect = screen.getByDisplayValue('MXN');
      await user.selectOptions(currencySelect, 'USD');

      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '1700'); // USD amount

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(unifiedPaymentService.processPayment).toHaveBeenCalledWith({
          method: 'cash',
          amount: 30160, // Original MXN amount
          receivedAmount: expect.any(Number), // Converted amount
          saleId: 'sale_123',
          currency: 'MXN', // Original currency
          displayCurrency: 'USD',
          exchangeRate: 18.50
        });
      });
    });
  });

  describe('Loading States and User Feedback', () => {
    it('shows loading state during payment processing', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      unifiedPaymentService.processPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 2000))
      );

      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Assert
      expect(screen.getByText('Procesando pago...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('disables interface during processing', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      unifiedPaymentService.processPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      );

      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Assert
      expect(amountInput).toBeDisabled();
      expect(screen.getByText('Tarjeta').closest('button')).toBeDisabled();
    });

    it('shows success feedback', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('¡Pago Exitoso!')).toBeInTheDocument();
        expect(screen.getByText('Transacción: txn_123456')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('supports keyboard navigation between payment methods', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.tab(); // Navigate to first payment method
      await user.keyboard('{Enter}'); // Select cash

      // Assert
      expect(screen.getByText('Efectivo').closest('button')).toHaveFocus();
      expect(screen.getByText('Monto Recibido')).toBeInTheDocument();
    });

    it('has proper ARIA labels', () => {
      // Arrange & Act
      renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      expect(screen.getByRole('group', { name: /método de pago/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /resumen de la venta/i })).toBeInTheDocument();
    });

    it('announces payment status to screen readers', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));

      // Assert
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent(/efectivo seleccionado/i);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('handles network timeout errors', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      unifiedPaymentService.processPayment.mockRejectedValue(
        new Error('Network timeout')
      );

      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          onError={mockOnError}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Network timeout',
            recoverable: true
          })
        );
      });
    });

    it('allows canceling payment during processing', async () => {
      // Arrange
      const { unifiedPaymentService } = require('@/services/unifiedPaymentService');
      let resolvePayment;
      unifiedPaymentService.processPayment.mockImplementation(
        () => new Promise(resolve => { resolvePayment = resolve; })
      );

      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Start payment
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Act - Cancel during processing
      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      // Assert
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('validates payment amounts', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '0');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
      });

      const processButton = screen.getByText('Procesar Pago');
      expect(processButton).toBeDisabled();
    });
  });

  describe('Performance and Telemetry', () => {
    it('records performance metrics', async () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));

      // Assert
      expect(telemetry.time.start).toHaveBeenCalledWith('payment_processor.render');
      expect(telemetry.record).toHaveBeenCalledWith(
        'payment_processor.method_selected',
        expect.objectContaining({
          method: 'cash',
          amount: 30160
        })
      );
    });

    it('measures payment processing time', async () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(telemetry.time.end).toHaveBeenCalledWith('timer_123');
      });
    });

    it('renders efficiently with large transaction amounts', async () => {
      // Arrange
      const largeSaleData = {
        ...mockSaleData,
        total: 999999.99
      };

      // Act
      const renderTime = await performanceUtils.measureRenderTime(() => {
        renderWithProviders(
          <PaymentProcessor 
            saleData={largeSaleData}
            onComplete={mockOnComplete}
            onCancel={mockOnCancel}
          />
        );
      });

      // Assert
      expect(renderTime).toBeLessThan(100); // Should render efficiently
    });
  });

  describe('Integration with Store State', () => {
    it('updates payment store state during processing', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        const paymentStore = storeHelpers.getStoreState('payment');
        expect(paymentStore.processing).toBe(true);
      });
    });

    it('clears payment state on completion', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <PaymentProcessor 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.click(screen.getByText('Efectivo').closest('button'));
      
      const amountInput = screen.getByPlaceholderText('Ingrese el monto recibido');
      await user.clear(amountInput);
      await user.type(amountInput, '35000');

      const processButton = screen.getByText('Procesar Pago');
      await user.click(processButton);

      // Wait for completion
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });

      // Assert
      const paymentStore = storeHelpers.getStoreState('payment');
      expect(paymentStore.processing).toBe(false);
      expect(paymentStore.error).toBeNull();
    });
  });
});
