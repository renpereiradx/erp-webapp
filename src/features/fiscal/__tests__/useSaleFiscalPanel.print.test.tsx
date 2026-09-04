/**
 * Tests de la impresión OPCIONAL en useSaleFiscalPanel:
 * - sin documents:read la acción no se ofrece y no se consulta /printers;
 * - con permiso, printConfigured refleja si hay una RECEIPT activa+default;
 * - reprintTicket golpea /ticket/print (impresión real, no el render).
 * fiscalService, printersService, useAuth y useToast se mockean en frontera.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockFiscal = vi.hoisted(() => ({
  getSaleFiscal: vi.fn(),
  printTicket: vi.fn(),
}));

vi.mock('@/features/fiscal/services/fiscalService', () => ({
  fiscalService: mockFiscal,
  isApiNotFound: (e: unknown) =>
    (e as { code?: string })?.code === 'NOT_FOUND',
}));

const mockPrintersService = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock('@/features/printers/services/printersService', () => ({
  printersService: mockPrintersService,
}));

const mockPermissions = vi.hoisted(() => ({ perms: [] as string[] }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: (p: string) => mockPermissions.perms.includes(p),
  }),
}));

const addToast = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ addToast }) }));

import { useSaleFiscalPanel } from '@/features/fiscal/hooks/useSaleFiscalPanel';
import type { SaleFiscalStatus } from '@/features/fiscal/types';
import type { Printer } from '@/features/printers/types';

const fiscalStatus: SaleFiscalStatus = {
  sale_id: 'SALE-1',
  cdc: '0144444401700100100145282201701251587326094',
  doc_type: 1,
  estado: 'APROBADO',
  timbrado_num: '12345678',
  establecimiento: '001',
  punto_expedicion: '001',
  serie: 'A',
  numero_doc: 7,
  intentos: 1,
  reprint_count: 0,
};

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

const makeWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const renderPanel = () => renderHook(() => useSaleFiscalPanel('SALE-1'), { wrapper: makeWrapper() });

describe('useSaleFiscalPanel — impresión opcional', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPermissions.perms = ['documents:read'];
    mockFiscal.getSaleFiscal.mockResolvedValue(fiscalStatus);
  });

  it('sin documents:read no consulta impresoras y printConfigured queda indeterminado', async () => {
    mockPermissions.perms = [];
    const { result } = renderPanel();
    await waitFor(() => expect(result.current.status).toBeDefined());
    expect(result.current.canUseDocuments).toBe(false);
    expect(result.current.printConfigured).toBeNull();
    expect(mockPrintersService.list).not.toHaveBeenCalled();
  });

  it('con una RECEIPT activa+default registrada, printConfigured es true', async () => {
    mockPrintersService.list.mockResolvedValue([
      receiptPrinter({ id: 1, is_default: true }),
      receiptPrinter({ id: 2, purpose: 'KITCHEN', is_default: false }),
    ]);
    const { result } = renderPanel();
    await waitFor(() => expect(result.current.printConfigured).toBe(true));
    expect(mockPrintersService.list).toHaveBeenCalledWith({ active: true });
  });

  it('sin impresoras registradas, printConfigured es false', async () => {
    mockPrintersService.list.mockResolvedValue([]);
    const { result } = renderPanel();
    await waitFor(() => expect(result.current.printConfigured).toBe(false));
  });

  it('una RECEIPT sin is_default no habilita la impresión (el backend no la resolvería)', async () => {
    mockPrintersService.list.mockResolvedValue([receiptPrinter({ is_default: false })]);
    const { result } = renderPanel();
    await waitFor(() => expect(result.current.printConfigured).toBe(false));
  });

  it('reprintTicket golpea /ticket/print y expone el reprint_count devuelto', async () => {
    mockPrintersService.list.mockResolvedValue([receiptPrinter()]);
    mockFiscal.printTicket.mockResolvedValue({
      success: true, sale_id: 'SALE-1', printer: 'Caja 1', printer_host: '192.168.1.50',
      reprint_count: 3, message: 'ticket enviado a la impresora',
    });
    const { result } = renderPanel();
    await waitFor(() => expect(result.current.status).toBeDefined());

    await act(async () => {
      await result.current.reprintTicket();
    });

    expect(mockFiscal.printTicket).toHaveBeenCalledWith('SALE-1');
    await waitFor(() => expect(result.current.reprintCount).toBe(3));
    expect(addToast).toHaveBeenCalledWith(expect.anything(), 'success');
  });
});
