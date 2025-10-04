/**
 * Tests para funcionalidad de Reversión de Ventas
 * Verifica la implementación de REVERT_SALE_API.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SaleReversionModal from '@/components/SaleReversionModal';
import SalesHistorySection from '@/components/SalesHistorySection';
import saleService from '@/services/saleService';
import { AnnouncementProvider } from '@/contexts/AnnouncementContext';

// Mock del servicio
vi.mock('@/services/saleService', () => ({
  default: {
    previewSaleCancellation: vi.fn(),
    revertSale: vi.fn(),
    getSales: vi.fn()
  }
}));

// Mock del contexto de anuncios
const mockAnnounceSuccess = vi.fn();
const mockAnnounceError = vi.fn();

vi.mock('@/contexts/AnnouncementContext', () => ({
  AnnouncementProvider: ({ children }) => children,
  useAnnouncement: () => ({
    announceSuccess: mockAnnounceSuccess,
    announceError: mockAnnounceError
  })
}));

describe('SaleReversionModal', () => {
  const mockSaleId = 'SALE-123';
  const mockOnClose = vi.fn();
  const mockOnReversionComplete = vi.fn();

  const mockPreviewResponse = {
    success: true,
    sale: {
      id: mockSaleId,
      status: 'PAID',
      total_amount: 1625000.00,
      client_id: 'CLI001',
      sale_date: '2025-09-30T12:00:00'
    },
    products: [
      {
        product_id: 'PROD001',
        product_name: 'Producto Test',
        product_type: 'PHYSICAL',
        quantity: 2.00,
        unit_price: 812500.00,
        will_restore_stock: true,
        will_revert_reserve: false,
        reserve_id: null
      }
    ],
    reserves: [],
    payments: [
      {
        payment_id: 1,
        amount_received: 1625000.00,
        payment_date: '2025-09-30T12:05:00',
        status: 'COMPLETED'
      }
    ],
    summary: {
      total_products: 1,
      stock_movements: 1,
      reserves_to_handle: 0,
      payments_to_refund: 1,
      total_refund: 1625000.00
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    saleService.previewSaleCancellation.mockResolvedValue(mockPreviewResponse);
  });

  it('carga la vista previa al abrir el modal', async () => {
    render(
      <SaleReversionModal
        isOpen={true}
        onClose={mockOnClose}
        saleId={mockSaleId}
        onReversionComplete={mockOnReversionComplete}
      />
    );

    // Verificar que se llama a la API
    await waitFor(() => {
      expect(saleService.previewSaleCancellation).toHaveBeenCalledWith(mockSaleId);
    });

    // Verificar que se muestra la información
    await waitFor(() => {
      expect(screen.getByText(/Vista Previa de Reversión de Venta/i)).toBeInTheDocument();
    });
  });

  it('muestra la información de la venta correctamente', async () => {
    render(
      <SaleReversionModal
        isOpen={true}
        onClose={mockOnClose}
        saleId={mockSaleId}
        onReversionComplete={mockOnReversionComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(mockSaleId)).toBeInTheDocument();
      expect(screen.getByText(/PAID/i)).toBeInTheDocument();
    });
  });

  it('muestra los productos a revertir', async () => {
    render(
      <SaleReversionModal
        isOpen={true}
        onClose={mockOnClose}
        saleId={mockSaleId}
        onReversionComplete={mockOnReversionComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Producto Test')).toBeInTheDocument();
      expect(screen.getByText(/Restaurar stock/i)).toBeInTheDocument();
    });
  });

  it('requiere una razón para revertir', async () => {
    render(
      <SaleReversionModal
        isOpen={true}
        onClose={mockOnClose}
        saleId={mockSaleId}
        onReversionComplete={mockOnReversionComplete}
      />
    );

    await waitFor(() => {
      const continueButton = screen.getByText(/Continuar con Reversión/i);
      expect(continueButton).toBeDisabled();
    });
  });

  it('permite ejecutar la reversión con razón válida', async () => {
    saleService.revertSale.mockResolvedValue({
      success: true,
      message: 'Sale cancelled successfully',
      sale_id: mockSaleId
    });

    render(
      <SaleReversionModal
        isOpen={true}
        onClose={mockOnClose}
        saleId={mockSaleId}
        onReversionComplete={mockOnReversionComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Producto Test')).toBeInTheDocument();
    });

    // Ingresar razón
    const reasonInput = screen.getByPlaceholderText(/Cliente solicitó cancelación/i);
    fireEvent.change(reasonInput, { target: { value: 'Error en cantidad' } });

    // Continuar con reversión
    const continueButton = screen.getByText(/Continuar con Reversión/i);
    fireEvent.click(continueButton);

    // Confirmar reversión
    await waitFor(() => {
      const confirmButton = screen.getByText(/Confirmar Reversión/i);
      expect(confirmButton).toBeInTheDocument();
    });
  });

  it('maneja errores de API correctamente', async () => {
    saleService.previewSaleCancellation.mockRejectedValue(new Error('API Error'));

    render(
      <SaleReversionModal
        isOpen={true}
        onClose={mockOnClose}
        saleId={mockSaleId}
        onReversionComplete={mockOnReversionComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar vista previa/i)).toBeInTheDocument();
    });
  });
});

describe('SalesHistorySection', () => {
  const mockSales = [
    {
      id: 1,
      sale_id: 'SALE-001',
      sale_date: '2025-09-30T10:00:00',
      client_id: 'CLI001',
      client_name: 'Cliente Test',
      total_amount: 1000000,
      status: 'PAID'
    },
    {
      id: 2,
      sale_id: 'SALE-002',
      sale_date: '2025-09-29T15:00:00',
      client_id: 'CLI002',
      client_name: 'Cliente Test 2',
      total_amount: 500000,
      status: 'CANCELLED'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    saleService.getSales.mockResolvedValue({
      success: true,
      data: mockSales
    });
  });

  it('carga y muestra el historial de ventas', async () => {
    render(<SalesHistorySection />);

    await waitFor(() => {
      expect(saleService.getSales).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('SALE-001')).toBeInTheDocument();
      expect(screen.getByText('SALE-002')).toBeInTheDocument();
    });
  });

  it('permite filtrar ventas por búsqueda', async () => {
    render(<SalesHistorySection />);

    await waitFor(() => {
      expect(screen.getByText('SALE-001')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por ID/i);
    fireEvent.change(searchInput, { target: { value: 'SALE-001' } });

    expect(screen.getByText('SALE-001')).toBeInTheDocument();
  });

  it('muestra botón de reversión solo para ventas completadas', async () => {
    render(<SalesHistorySection />);

    await waitFor(() => {
      expect(screen.getByText('SALE-001')).toBeInTheDocument();
    });

    // La venta PAID debe tener botón de reversión
    // La venta CANCELLED no debe tener botón de reversión
    const reversionButtons = screen.getAllByTitle(/Revertir venta/i);
    expect(reversionButtons.length).toBe(1); // Solo para SALE-001
  });
});
