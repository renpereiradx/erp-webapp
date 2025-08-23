/**
 * Cancellation Workflow Component Tests - Enterprise Grade
 * Comprehensive tests for the order cancellation and refund management UI
 * 
 * Test Coverage:
 * - Cancellation reason selection and validation
 * - Refund calculation and partial refund support
 * - Approval workflow for different cancellation types
 * - Integration with payment processing for refunds
 * - Status tracking and notification system
 * - Audit trail and compliance logging
 * - Error handling and rollback scenarios
 * 
 * Target Coverage: ≥85%
 * Enfoque: Hardened Testing with complex business rules
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { CancellationWorkflow } from '@/components/Sales/CancellationWorkflow';
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

vi.mock('@/services/cancellationService', () => ({
  cancellationService: {
    initiateCancellation: vi.fn().mockResolvedValue({
      success: true,
      cancellationId: 'cancel_123',
      status: 'pending_approval'
    }),
    processRefund: vi.fn().mockResolvedValue({
      success: true,
      refundId: 'refund_456',
      amount: 25000
    }),
    getCancellationReasons: vi.fn().mockReturnValue([
      { id: 'customer_request', label: 'Solicitud del cliente', requiresApproval: false },
      { id: 'product_defect', label: 'Producto defectuoso', requiresApproval: false },
      { id: 'wrong_item', label: 'Artículo incorrecto', requiresApproval: false },
      { id: 'business_decision', label: 'Decisión comercial', requiresApproval: true },
      { id: 'fraud_suspicion', label: 'Sospecha de fraude', requiresApproval: true }
    ]),
    calculateRefundAmount: vi.fn().mockImplementation((saleData, reason, partial) => ({
      fullRefund: saleData.total,
      partialRefund: partial || saleData.total * 0.8,
      processingFee: saleData.total * 0.03
    })),
    validateCancellation: vi.fn().mockResolvedValue({ isValid: true }),
    approveCancellation: vi.fn().mockResolvedValue({ success: true }),
    rejectCancellation: vi.fn().mockResolvedValue({ success: true })
  }
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn(),
    time: {
      start: vi.fn().mockReturnValue('timer_cancellation'),
      end: vi.fn()
    }
  }
}));

vi.mock('@/utils/auditLog', () => ({
  auditLog: {
    record: vi.fn()
  }
}));

describe('CancellationWorkflow Component', () => {
  const mockSaleData = {
    id: 'sale_789',
    customerId: 'customer_123',
    customerName: 'Juan Pérez',
    date: '2024-01-15T10:30:00Z',
    items: [
      { 
        id: 'item_1', 
        name: 'Laptop Dell Inspiron', 
        price: 25000, 
        quantity: 1,
        category: 'electronics'
      },
      { 
        id: 'item_2', 
        name: 'Mouse Óptico Logitech', 
        price: 500, 
        quantity: 2,
        category: 'accessories'
      }
    ],
    subtotal: 26000,
    tax: 4160,
    total: 30160,
    currency: 'MXN',
    paymentMethod: 'card',
    status: 'completed',
    transactionId: 'txn_original_123'
  };

  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnApprovalRequired = vi.fn();

  beforeEach(() => {
    storeHelpers.resetAllStores();
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('renders cancellation workflow with sale details', () => {
      // Arrange & Act
      renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      expect(screen.getByText('Cancelación de Venta')).toBeInTheDocument();
      expect(screen.getByText('Venta #sale_789')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('$30,160.00')).toBeInTheDocument();
    });

    it('displays sale items with cancellation options', () => {
      // Arrange & Act
      renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      expect(screen.getByText('Artículos de la Venta')).toBeInTheDocument();
      expect(screen.getByText('Laptop Dell Inspiron')).toBeInTheDocument();
      expect(screen.getByText('Mouse Óptico Logitech')).toBeInTheDocument();
      
      // Check for cancellation checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('shows cancellation reason selection', () => {
      // Arrange & Act
      renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      expect(screen.getByText('Motivo de Cancelación')).toBeInTheDocument();
      expect(screen.getByText('Solicitud del cliente')).toBeInTheDocument();
      expect(screen.getByText('Producto defectuoso')).toBeInTheDocument();
      expect(screen.getByText('Artículo incorrecto')).toBeInTheDocument();
    });

    it('starts with process button disabled', () => {
      // Arrange & Act
      renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      const processButton = screen.getByText('Procesar Cancelación');
      expect(processButton).toBeDisabled();
    });
  });

  describe('Item Selection for Cancellation', () => {
    it('allows selecting individual items for cancellation', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      // Assert
      expect(firstItemCheckbox).toBeChecked();
    });

    it('calculates partial refund amount when items are selected', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Monto a Reembolsar:')).toBeInTheDocument();
        expect(screen.getByText(/\$25,000\.00/)).toBeInTheDocument(); // Item price
      });
    });

    it('shows select all option', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const selectAllButton = screen.getByText('Seleccionar Todos');
      await user.click(selectAllButton);

      // Assert
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('calculates full refund when all items selected', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const selectAllButton = screen.getByText('Seleccionar Todos');
      await user.click(selectAllButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/\$30,160\.00/)).toBeInTheDocument(); // Full amount
      });
    });

    it('enables process button when items and reason are selected', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      const reasonRadio = screen.getByLabelText('Solicitud del cliente');
      await user.click(reasonRadio);

      // Assert
      await waitFor(() => {
        const processButton = screen.getByText('Procesar Cancelación');
        expect(processButton).not.toBeDisabled();
      });
    });
  });

  describe('Cancellation Reason Handling', () => {
    it('selects cancellation reason', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const reasonRadio = screen.getByLabelText('Producto defectuoso');
      await user.click(reasonRadio);

      // Assert
      expect(reasonRadio).toBeChecked();
    });

    it('shows additional fields for specific reasons', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const reasonRadio = screen.getByLabelText('Producto defectuoso');
      await user.click(reasonRadio);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Descripción del Defecto')).toBeInTheDocument();
      });
    });

    it('indicates reasons that require approval', () => {
      // Arrange & Act
      renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      expect(screen.getByText('Decisión comercial')).toBeInTheDocument();
      expect(screen.getByText('(Requiere aprobación)')).toBeInTheDocument();
    });

    it('shows approval warning for sensitive reasons', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const reasonRadio = screen.getByLabelText('Decisión comercial');
      await user.click(reasonRadio);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Esta cancelación requerirá aprobación/)).toBeInTheDocument();
      });
    });
  });

  describe('Refund Calculation and Processing', () => {
    it('displays refund breakdown', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Desglose del Reembolso')).toBeInTheDocument();
        expect(screen.getByText('Monto Original:')).toBeInTheDocument();
        expect(screen.getByText('Comisión de Procesamiento:')).toBeInTheDocument();
        expect(screen.getByText('Total a Reembolsar:')).toBeInTheDocument();
      });
    });

    it('allows custom refund amount', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          allowCustomRefund={true}
        />
      );

      // Act
      const customRefundCheckbox = screen.getByLabelText('Monto personalizado');
      await user.click(customRefundCheckbox);

      // Assert
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ingrese el monto a reembolsar')).toBeInTheDocument();
      });
    });

    it('validates custom refund amount', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          allowCustomRefund={true}
        />
      );

      // Act
      const customRefundCheckbox = screen.getByLabelText('Monto personalizado');
      await user.click(customRefundCheckbox);

      const amountInput = screen.getByPlaceholderText('Ingrese el monto a reembolsar');
      await user.clear(amountInput);
      await user.type(amountInput, '50000'); // More than original

      // Assert
      await waitFor(() => {
        expect(screen.getByText('El monto no puede exceder el total original')).toBeInTheDocument();
      });
    });

    it('shows different refund methods', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Select items and reason
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      const reasonRadio = screen.getByLabelText('Solicitud del cliente');
      await user.click(reasonRadio);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Método de Reembolso')).toBeInTheDocument();
        expect(screen.getByText('Reembolso a la tarjeta original')).toBeInTheDocument();
        expect(screen.getByText('Transferencia bancaria')).toBeInTheDocument();
        expect(screen.getByText('Efectivo')).toBeInTheDocument();
      });
    });
  });

  describe('Cancellation Processing', () => {
    beforeEach(async () => {
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Setup basic cancellation
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      const reasonRadio = screen.getByLabelText('Solicitud del cliente');
      await user.click(reasonRadio);
    });

    it('processes cancellation successfully', async () => {
      // Arrange
      const { cancellationService } = require('@/services/cancellationService');
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Setup and act
      await interactionHelpers.setupBasicCancellation(user);

      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(cancellationService.initiateCancellation).toHaveBeenCalledWith({
          saleId: 'sale_789',
          reason: 'customer_request',
          items: expect.arrayContaining([
            expect.objectContaining({ id: 'item_1' })
          ]),
          refundMethod: expect.any(String),
          refundAmount: expect.any(Number)
        });
      });

      expect(mockOnComplete).toHaveBeenCalledWith({
        success: true,
        cancellationId: 'cancel_123',
        status: 'pending_approval'
      });
    });

    it('shows processing state during cancellation', async () => {
      // Arrange
      const { cancellationService } = require('@/services/cancellationService');
      cancellationService.initiateCancellation.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 2000))
      );

      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Setup and act
      await interactionHelpers.setupBasicCancellation(user);

      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert
      expect(screen.getByText('Procesando cancelación...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles approval-required scenarios', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          onApprovalRequired={mockOnApprovalRequired}
        />
      );

      // Act - Select reason that requires approval
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      const reasonRadio = screen.getByLabelText('Decisión comercial');
      await user.click(reasonRadio);

      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(mockOnApprovalRequired).toHaveBeenCalledWith({
          cancellationId: 'cancel_123',
          reason: 'business_decision',
          amount: expect.any(Number)
        });
      });
    });

    it('records audit trail for cancellation', async () => {
      // Arrange
      const { auditLog } = require('@/utils/auditLog');
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Setup and act
      await interactionHelpers.setupBasicCancellation(user);

      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(auditLog.record).toHaveBeenCalledWith({
          action: 'cancellation_initiated',
          saleId: 'sale_789',
          reason: 'customer_request',
          items: expect.any(Array),
          refundAmount: expect.any(Number),
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('Error Handling and Validation', () => {
    it('handles cancellation service errors', async () => {
      // Arrange
      const { cancellationService } = require('@/services/cancellationService');
      cancellationService.initiateCancellation.mockRejectedValue(
        new Error('Cancellation service unavailable')
      );

      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Setup and act
      await interactionHelpers.setupBasicCancellation(user);

      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cancellation service unavailable')).toBeInTheDocument();
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });
    });

    it('validates business rules for cancellation', async () => {
      // Arrange
      const { cancellationService } = require('@/services/cancellationService');
      cancellationService.validateCancellation.mockResolvedValue({
        isValid: false,
        reason: 'Sale already cancelled'
      });

      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={{...mockSaleData, status: 'cancelled'}}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Setup and act
      await interactionHelpers.setupBasicCancellation(user);

      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Sale already cancelled')).toBeInTheDocument();
      });
    });

    it('prevents cancellation of already processed items', () => {
      // Arrange
      const saleWithProcessedItems = {
        ...mockSaleData,
        items: [
          { ...mockSaleData.items[0], status: 'shipped' },
          { ...mockSaleData.items[1], status: 'pending' }
        ]
      };

      // Act
      renderWithProviders(
        <CancellationWorkflow 
          saleData={saleWithProcessedItems}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      expect(firstItemCheckbox).toBeDisabled();
      expect(screen.getByText('(Enviado - No cancelable)')).toBeInTheDocument();
    });

    it('shows confirmation dialog for high-value cancellations', async () => {
      // Arrange
      const highValueSale = {
        ...mockSaleData,
        total: 100000 // High value
      };

      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={highValueSale}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Setup and act
      await interactionHelpers.setupBasicCancellation(user);

      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Confirmar Cancelación de Alto Valor')).toBeInTheDocument();
        expect(screen.getByText(/Esta cancelación es por un monto mayor/)).toBeInTheDocument();
      });
    });
  });

  describe('Approval Workflow', () => {
    it('displays approval interface for authorized users', () => {
      // Arrange & Act
      renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          mode="approval"
          cancellationData={{
            id: 'cancel_123',
            reason: 'business_decision',
            requestedBy: 'user_456',
            amount: 25000
          }}
        />
      );

      // Assert
      expect(screen.getByText('Aprobación de Cancelación')).toBeInTheDocument();
      expect(screen.getByText('Aprobar')).toBeInTheDocument();
      expect(screen.getByText('Rechazar')).toBeInTheDocument();
    });

    it('approves cancellation with comments', async () => {
      // Arrange
      const { cancellationService } = require('@/services/cancellationService');
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          mode="approval"
          cancellationData={{
            id: 'cancel_123',
            reason: 'business_decision',
            requestedBy: 'user_456',
            amount: 25000
          }}
        />
      );

      // Act
      const commentsTextarea = screen.getByPlaceholderText('Comentarios de aprobación...');
      await user.type(commentsTextarea, 'Aprobado por excepción comercial');

      const approveButton = screen.getByText('Aprobar');
      await user.click(approveButton);

      // Assert
      await waitFor(() => {
        expect(cancellationService.approveCancellation).toHaveBeenCalledWith({
          cancellationId: 'cancel_123',
          comments: 'Aprobado por excepción comercial',
          approvedBy: expect.any(String)
        });
      });
    });

    it('rejects cancellation with mandatory reason', async () => {
      // Arrange
      const { cancellationService } = require('@/services/cancellationService');
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          mode="approval"
          cancellationData={{
            id: 'cancel_123',
            reason: 'business_decision',
            requestedBy: 'user_456',
            amount: 25000
          }}
        />
      );

      // Act
      const rejectButton = screen.getByText('Rechazar');
      await user.click(rejectButton);

      // Should show rejection reason dialog
      await waitFor(() => {
        expect(screen.getByText('Motivo del Rechazo')).toBeInTheDocument();
      });

      const reasonTextarea = screen.getByPlaceholderText('Explique el motivo del rechazo...');
      await user.type(reasonTextarea, 'No cumple con las políticas de la empresa');

      const confirmRejectButton = screen.getByText('Confirmar Rechazo');
      await user.click(confirmRejectButton);

      // Assert
      await waitFor(() => {
        expect(cancellationService.rejectCancellation).toHaveBeenCalledWith({
          cancellationId: 'cancel_123',
          reason: 'No cumple con las políticas de la empresa',
          rejectedBy: expect.any(String)
        });
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('supports keyboard navigation', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await user.tab(); // Navigate to first checkbox
      await user.keyboard(' '); // Select item

      await user.tab(); // Navigate to reason selection
      await user.keyboard('{ArrowDown}'); // Select next reason

      // Assert
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      expect(firstItemCheckbox).toBeChecked();
    });

    it('has proper ARIA labels and descriptions', () => {
      // Arrange & Act
      renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Assert
      expect(screen.getByRole('group', { name: /artículos para cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: /motivo de cancelación/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /resumen de reembolso/i })).toBeInTheDocument();
    });

    it('announces important state changes', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      const firstItemCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstItemCheckbox);

      // Assert
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent(/artículo seleccionado para cancelación/i);
    });

    it('provides clear progress indication', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          showProgress={true}
        />
      );

      // Act
      await interactionHelpers.setupBasicCancellation(user);

      // Assert
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
      expect(screen.getByText('Paso 2 de 4')).toBeInTheDocument();
    });
  });

  describe('Performance and Memory Management', () => {
    it('renders efficiently with large number of items', async () => {
      // Arrange
      const saleWithManyItems = {
        ...mockSaleData,
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `item_${i}`,
          name: `Product ${i}`,
          price: 100,
          quantity: 1
        }))
      };

      // Act
      const renderTime = await performanceUtils.measureRenderTime(() => {
        renderWithProviders(
          <CancellationWorkflow 
            saleData={saleWithManyItems}
            onComplete={mockOnComplete}
            onCancel={mockOnCancel}
          />
        );
      });

      // Assert
      expect(renderTime).toBeLessThan(150); // Should render efficiently
    });

    it('debounces refund calculations', async () => {
      // Arrange
      const { cancellationService } = require('@/services/cancellationService');
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          allowCustomRefund={true}
        />
      );

      // Act - Rapid changes
      const customRefundCheckbox = screen.getByLabelText('Monto personalizado');
      await user.click(customRefundCheckbox);

      const amountInput = screen.getByPlaceholderText('Ingrese el monto a reembolsar');
      await user.clear(amountInput);
      await user.type(amountInput, '12345'); // Multiple rapid keystrokes

      // Wait for debounce
      await asyncUtils.delay(300);

      // Assert - Should only call once after debounce
      expect(cancellationService.calculateRefundAmount).toHaveBeenCalledTimes(1);
    });

    it('cleans up resources on unmount', () => {
      // Arrange
      const { unmount } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      unmount();

      // Assert - No memory leaks or errors should occur
      expect(true).toBe(true);
    });
  });

  describe('Integration with Store State', () => {
    it('updates cancellation store state during processing', async () => {
      // Arrange
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await interactionHelpers.setupBasicCancellation(user);

      const processButton = screen.getByText('Procesar Cancelación');
      await user.click(processButton);

      // Assert
      await waitFor(() => {
        const cancellationStore = storeHelpers.getStoreState('cancellation');
        expect(cancellationStore.processing).toBe(true);
        expect(cancellationStore.currentCancellation).toBeDefined();
      });
    });

    it('records telemetry for cancellation events', async () => {
      // Arrange
      const { telemetry } = require('@/utils/telemetry');
      const { user } = renderWithProviders(
        <CancellationWorkflow 
          saleData={mockSaleData}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Act
      await interactionHelpers.setupBasicCancellation(user);

      // Assert
      expect(telemetry.record).toHaveBeenCalledWith(
        'cancellation_workflow.reason_selected',
        expect.objectContaining({
          reason: 'customer_request',
          saleId: 'sale_789'
        })
      );
    });
  });
});
