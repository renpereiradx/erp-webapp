/**
 * Tests del hook usePrinters (workspace maestro-detalle). El service se
 * mockea en su módulo; useToast se mockea para asertar los toasts. React
 * Query corre con retry desactivado para no ralentizar el run.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockService = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  testPage: vi.fn(),
}));

vi.mock('@/features/printers/services/printersService', () => ({
  printersService: mockService,
}));

const addToast = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ addToast }) }));

import { usePrinters } from '@/features/printers/hooks/usePrinters';
import type { Printer } from '@/features/printers/types';

const printer = (over: Partial<Printer>): Printer => ({
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

describe('usePrinters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.list.mockResolvedValue([
      printer({ id: 1, name: 'Caja 1' }),
      printer({ id: 2, name: 'Cocina', purpose: 'KITCHEN', is_default: false }),
    ]);
  });

  it('carga el listado y expone el total', async () => {
    const { result } = renderHook(() => usePrinters(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalPrinters).toBe(2);
    expect(mockService.list).toHaveBeenCalledTimes(1);
  });

  it('filtra por búsqueda de nombre', async () => {
    const { result } = renderHook(() => usePrinters(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setSearchQuery('cocina'));
    expect(result.current.printers).toHaveLength(1);
    expect(result.current.printers[0].name).toBe('Cocina');
  });

  it('startCreate + savePrinter crea y selecciona la nueva impresora', async () => {
    mockService.create.mockResolvedValue(printer({ id: 9, name: 'Barra' }));
    const { result } = renderHook(() => usePrinters(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startCreate());
    expect(result.current.selectedId).toBe('new');

    await act(async () => {
      await result.current.savePrinter({
        branch_id: null, name: 'Barra', purpose: 'BAR', host: '10.0.0.8', port: 9100,
        width_mm: 80, code_page: 'CP858', kick_drawer: false, is_default: false, is_active: true,
      });
    });

    expect(mockService.create).toHaveBeenCalledTimes(1);
    expect(result.current.selectedId).toBe(9);
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('mpresora'), 'success');
  });

  it('savePrinter sobre una selección existente hace update', async () => {
    mockService.update.mockResolvedValue(printer({ id: 1, name: 'Caja 1B' }));
    const { result } = renderHook(() => usePrinters(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectPrinter(1));
    await act(async () => {
      await result.current.savePrinter({
        branch_id: null, name: 'Caja 1B', purpose: 'RECEIPT', host: '192.168.1.50', port: 9100,
        width_mm: 80, code_page: 'CP858', kick_drawer: false, is_default: true, is_active: true,
      });
    });

    expect(mockService.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Caja 1B' }));
    expect(mockService.create).not.toHaveBeenCalled();
  });

  it('deletePrinter limpia la selección si era la activa', async () => {
    mockService.remove.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePrinters(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectPrinter(2));
    await act(async () => {
      await result.current.deletePrinter(2);
    });

    expect(mockService.remove).toHaveBeenCalledWith(2);
    expect(result.current.selectedId).toBeNull();
    expect(addToast).toHaveBeenCalledWith(expect.anything(), 'success');
  });

  it('testPrinter delega en el service y avisa por toast', async () => {
    mockService.testPage.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePrinters(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.testPrinter(1);
    });

    expect(mockService.testPage).toHaveBeenCalledWith(1);
    expect(addToast).toHaveBeenCalledWith(expect.anything(), 'success');
  });
});
