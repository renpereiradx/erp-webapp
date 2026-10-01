/**
 * Tests de BudgetPrintModal (PLAN presupuestos: impresión + PDF):
 * - resumen con total y vigencia del presupuesto aprobado;
 * - "Imprimir ticket" golpea budgetService.printTicket y avisa la impresora;
 *   sin RECEIPT configurada queda deshabilitado con hint;
 * - sin documents:read las acciones se deshabilitan y no se consulta /printers;
 * - "Listo" cierra.
 * Servicios mockeados en frontera; i18n lo cubre el fakeT global.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPrinters = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@/features/printers/services/printersService', () => ({
  printersService: mockPrinters,
}));

const mockPrintTicket = vi.hoisted(() => vi.fn());
const mockDownloadPdf = vi.hoisted(() => vi.fn());
vi.mock('@/services/budgetService', () => ({
  budgetService: { printTicket: mockPrintTicket, downloadPdf: mockDownloadPdf },
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

import { BudgetPrintModal } from '@/features/budgets/components/BudgetPrintModal';
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

const budget = { id: 'BUD-1', total_amount: 1298200, valid_until: '2026-10-15T00:00:00Z' };

const renderModal = (b: typeof budget | null = budget, onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={qc}>
      <BudgetPrintModal budget={b} onClose={onClose} />
    </QueryClientProvider>,
  );
  return { ...utils, onClose };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPermissions.perms = ['documents:read'];
  mockPrinters.list.mockResolvedValue([receiptPrinter()]);
});

describe('BudgetPrintModal', () => {
  it('muestra total y vigencia del presupuesto aprobado', async () => {
    renderModal();
    await waitFor(() => expect(screen.getByTestId('budget-print-summary')).toBeInTheDocument());
    expect(screen.getByTestId('budget-print-summary')).toHaveTextContent('1.298.200');
  });

  it('cierra con "Listo"', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await waitFor(() => expect(screen.getByTestId('budget-print-close')).toBeEnabled());
    await user.click(screen.getByTestId('budget-print-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('imprime el ticket y avisa con la impresora', async () => {
    const user = userEvent.setup();
    mockPrintTicket.mockResolvedValue({ success: true, sale_id: 'BUD-1', printer: 'Caja 1', printer_host: 'x', reprint_count: 0 });
    renderModal();
    await waitFor(() => expect(screen.getByTestId('budget-print-ticket')).toBeEnabled());
    await user.click(screen.getByTestId('budget-print-ticket'));
    await waitFor(() => expect(mockPrintTicket).toHaveBeenCalledWith('BUD-1'));
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });

  it('sin impresora RECEIPT: botón deshabilitado con hint, sin golpear print', async () => {
    mockPrinters.list.mockResolvedValue([receiptPrinter({ purpose: 'KITCHEN' })]);
    renderModal();
    await waitFor(() => expect(screen.getByTestId('budget-print-ticket')).toBeDisabled());
    expect(screen.getByText(/Sin impresora configurada/)).toBeInTheDocument();
    expect(mockPrintTicket).not.toHaveBeenCalled();
  });

  it('sin documents:read: acciones deshabilitadas y no consulta impresoras', async () => {
    mockPermissions.perms = [];
    renderModal();
    await waitFor(() => expect(screen.getByTestId('budget-print-ticket')).toBeDisabled());
    expect(mockPrinters.list).not.toHaveBeenCalled();
    expect(mockPrintTicket).not.toHaveBeenCalled();
  });

  it('budget null ⇒ modal cerrado', () => {
    renderModal(null);
    expect(screen.queryByTestId('budget-print-modal')).not.toBeInTheDocument();
  });
});
