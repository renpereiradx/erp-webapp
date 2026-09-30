/**
 * Tests de SaleSuccessPrintModal (PLAN impresión checkout):
 * - el resumen viene de getSalePaymentStatus (verdad del BE): cobro parcial
 *   muestra badge + saldo; cobro completo no;
 * - "Imprimir ticket" golpea fiscalService.printTicket y avisa con el nombre
 *   de la impresora; sin RECEIPT configurada queda deshabilitado con hint;
 * - sin documents:read las acciones se deshabilitan y no se consulta /printers;
 * - "Listo" cierra (onClose).
 * Servicios mockeados en frontera; i18n lo cubre el fakeT global.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPaymentStatus = vi.hoisted(() => vi.fn());
vi.mock('@/services/salePaymentService', () => ({
  salePaymentService: { getSalePaymentStatus: mockPaymentStatus },
}));

const mockFiscal = vi.hoisted(() => ({
  printTicket: vi.fn(),
  downloadComprobantePdf: vi.fn(),
}));
vi.mock('@/features/fiscal/services/fiscalService', () => ({
  fiscalService: mockFiscal,
}));

const mockPrinters = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@/features/printers/services/printersService', () => ({
  printersService: mockPrinters,
}));

const mockPermissions = vi.hoisted(() => ({ perms: ['documents:read'] as string[] }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (p: string) => mockPermissions.perms.includes(p) }),
}));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    success: mockToast.success,
    error: mockToast.error,
    warning: vi.fn(),
    info: vi.fn(),
    toasts: [],
    removeToast: vi.fn(),
    addToast: vi.fn(),
  }),
}));

import { SaleSuccessPrintModal } from '@/features/sales/components/SaleSuccessPrintModal';
import type { Printer } from '@/features/printers/types';

const receiptPrinter = (over: Partial<Printer> = {}): Printer => ({
  id: 1,
  branch_id: null,
  name: 'Caja 1',
  purpose: 'RECEIPT',
  connection: 'NETWORK',
  host: '192.168.1.50',
  port: 9100,
  width_mm: 80,
  chars_per_line: 48,
  code_page: 'CP858',
  kick_drawer: false,
  is_default: true,
  is_active: true,
  ...over,
});

const paidStatus = (over: Record<string, unknown> = {}) => ({
  sale_id: 'SALE-1',
  total_amount: 80000,
  total_paid: 80000,
  balance_due: 0,
  payment_progress: 100,
  is_fully_paid: true,
  payment_status: 'PAID',
  payments: [],
  ...over,
});

const renderModal = (saleId: string | null = 'SALE-1', onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={qc}>
      <SaleSuccessPrintModal saleId={saleId} onClose={onClose} />
    </QueryClientProvider>,
  );
  return { ...utils, onClose };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPermissions.perms = ['documents:read'];
  mockPaymentStatus.mockResolvedValue(paidStatus());
  mockPrinters.list.mockResolvedValue([receiptPrinter()]);
});

describe('SaleSuccessPrintModal', () => {
  it('cierra con "Listo"', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await waitFor(() => expect(screen.getByTestId('receipt-close')).toBeEnabled());
    await user.click(screen.getByTestId('receipt-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cobra completo: sin badge parcial ni saldo', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByTestId('receipt-summary')).toBeInTheDocument());
    expect(screen.queryByTestId('receipt-partial-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('receipt-balance')).not.toBeInTheDocument();
  });

  it('cobra parcial: badge + saldo del backend', async () => {
    mockPaymentStatus.mockResolvedValue(
      paidStatus({ total_paid: 30000, balance_due: 50000, is_fully_paid: false, payment_status: 'PENDING' }),
    );
    renderModal();
    await waitFor(() => expect(screen.getByTestId('receipt-partial-badge')).toBeInTheDocument());
    expect(screen.getByTestId('receipt-balance')).toHaveTextContent('50.000');
  });

  it('imprime el ticket y avisa con la impresora', async () => {
    const user = userEvent.setup();
    mockFiscal.printTicket.mockResolvedValue({ success: true, sale_id: 'SALE-1', printer: 'Caja 1', printer_host: 'x', reprint_count: 0 });
    renderModal();
    await waitFor(() => expect(screen.getByTestId('receipt-print-ticket')).toBeEnabled());
    await user.click(screen.getByTestId('receipt-print-ticket'));
    await waitFor(() => expect(mockFiscal.printTicket).toHaveBeenCalledWith('SALE-1'));
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });

  it('sin impresora RECEIPT: botón deshabilitado con hint, sin golpear print', async () => {
    mockPrinters.list.mockResolvedValue([receiptPrinter({ purpose: 'KITCHEN' })]);
    renderModal();
    await waitFor(() => expect(screen.getByTestId('receipt-print-ticket')).toBeDisabled());
    expect(screen.getByText(/Sin impresora configurada/)).toBeInTheDocument();
    expect(mockFiscal.printTicket).not.toHaveBeenCalled();
  });

  it('sin documents:read: acciones deshabilitadas y no consulta impresoras', async () => {
    mockPermissions.perms = [];
    renderModal();
    await waitFor(() => expect(screen.getByTestId('receipt-print-ticket')).toBeDisabled());
    expect(mockPrinters.list).not.toHaveBeenCalled();
    expect(mockFiscal.printTicket).not.toHaveBeenCalled();
  });

  it('saleId null ⇒ modal cerrado', () => {
    renderModal(null);
    expect(screen.queryByTestId('sale-success-print-modal')).not.toBeInTheDocument();
  });
});
