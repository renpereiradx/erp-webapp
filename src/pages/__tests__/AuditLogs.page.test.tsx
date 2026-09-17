/**
 * Tests FASE 5 (plan auditoría BI): AuditLogs.
 * Contrato real: GET /audit/logs server-side paginado + filtros (F3C/cierre ⑤),
 * KPIs del footer desde /audit/dashboard, export CSV via POST /audit/export.
 * Mocks en la frontera: auditService, useToast; ToastContainer stub;
 * MemoryRouter (navigate al detalle por fila).
 * Debounce de 400 ms: se avanza con fake timers y se vuelve a timers reales
 * antes de usar waitFor (RTL no integra los fake timers de vitest).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuditLogs from '../AuditLogs';
import { useToast } from '@/hooks/useToast';

const serviceMocks = vi.hoisted(() => ({
  getLogs: vi.fn(),
  getSummary: vi.fn(),
  exportLogs: vi.fn(),
}));

vi.mock('@/services/bi/auditService', () => ({
  default: serviceMocks,
  auditService: serviceMocks,
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    toasts: [],
    removeToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    errorFrom: vi.fn(),
  })),
}));

vi.mock('@/components/ui/ToastContainer', () => ({ default: () => null }));

const mockService = serviceMocks as unknown as {
  getLogs: ReturnType<typeof vi.fn>;
  getSummary: ReturnType<typeof vi.fn>;
  exportLogs: ReturnType<typeof vi.fn>;
};

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  errorFrom: vi.fn(),
}));

const logsPayload = {
  data: {
    logs: [
      {
        id: 21,
        timestamp: '2026-09-16T13:45:00Z',
        username: 'admin',
        action: 'CREATE_PRODUCT',
        entity_id: 'P-9',
        category: 'PRODUCT',
        description: 'Producto creado',
        level: 'INFO',
      },
    ],
    total: 45,
    total_pages: 3,
  },
};

/** Render + flush del debounce inicial; devuelve el entorno a timers reales. */
const renderFlushed = () => {
  render(
    <MemoryRouter>
      <AuditLogs />
    </MemoryRouter>,
  );
  return vi.advanceTimersByTimeAsync(500).then(() => {
    vi.useRealTimers();
  });
};

/** El footer "Página X de Y" parte el texto en <span>s: matcher por textContent. */
const pageFooter = (text: string) =>
  screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === text);

describe('AuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    toastMocks.success.mockClear();
    toastMocks.errorFrom.mockClear();
    vi.mocked(useToast).mockReturnValue({
      toasts: [],
      removeToast: vi.fn(),
      success: toastMocks.success,
      error: toastMocks.error,
      errorFrom: toastMocks.errorFrom,
    } as unknown as ReturnType<typeof useToast>);
    mockService.getLogs.mockResolvedValue(logsPayload);
    mockService.getSummary.mockResolvedValue({
      data: { kpis: { total_actions: 8800, successful_actions: 8500, failed_actions: 300, unique_users: 14 } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetch debounced (400ms) con paginación default y KPIs reales del dashboard', async () => {
    await renderFlushed();

    expect(mockService.getLogs).toHaveBeenCalledWith({ page: 1, page_size: 20 });
    expect(mockService.getSummary).toHaveBeenCalledWith('month');

    await waitFor(() => {
      expect(screen.getByText('CREATE_PRODUCT')).toBeInTheDocument();
      expect(screen.getByText('45 registros')).toBeInTheDocument();
      expect(screen.getByText('8.800')).toBeInTheDocument(); // KPI real, no mock
    });
    expect(screen.getByText('8.500')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('paginación server-side: página 1 de 3, Siguiente consulta page 2', async () => {
    await renderFlushed();

    // el footer parte el texto en <span>s: se matchea el nodo contenedor
    expect(pageFooter('Página 1 de 3')).toBeInTheDocument();

    const next = screen.getByText('chevron_right').closest('button')!;
    const prev = screen.getByText('chevron_left').closest('button')!;
    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();

    vi.useFakeTimers();
    fireEvent.click(next);
    await vi.advanceTimersByTimeAsync(500);
    vi.useRealTimers();

    expect(mockService.getLogs).toHaveBeenLastCalledWith({ page: 2, page_size: 20 });
  });

  it('filtros viajan al endpoint y resetean a la página 1', async () => {
    await renderFlushed();
    await waitFor(() => expect(screen.getByText('CREATE_PRODUCT')).toBeInTheDocument());

    vi.useFakeTimers();
    fireEvent.change(screen.getByDisplayValue('Todas'), { target: { value: 'PRODUCT' } });
    await vi.advanceTimersByTimeAsync(500);
    vi.useRealTimers();

    expect(mockService.getLogs).toHaveBeenLastCalledWith({
      category: 'PRODUCT',
      page: 1,
      page_size: 20,
    });
  });

  it('error del listado → fila de error con Reintentar', async () => {
    mockService.getLogs.mockRejectedValue(new Error('boom'));
    await renderFlushed();

    await waitFor(() =>
      expect(
        screen.getByText('No se pudieron cargar los registros de auditoría.'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('Exportar CSV con filtros activos → toast de éxito', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    mockService.exportLogs.mockResolvedValue({ blob: new Blob(['a,b']), filename: 'audit.csv' });

    await renderFlushed();
    await waitFor(() => expect(screen.getByRole('button', { name: /Exportar CSV/ })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/ }));

    await waitFor(() => expect(mockService.exportLogs).toHaveBeenCalledWith({}, { format: 'csv' }));
    await waitFor(() => expect(toastMocks.success).toHaveBeenCalledWith('Exportación descargada'));
  });

  it('lista vacía → estado honesto (sin "Página 1 de 30" con 0 filas)', async () => {
    mockService.getLogs.mockResolvedValue({ data: { logs: [], total: 0, total_pages: 1 } });
    await renderFlushed();

    await waitFor(() => expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument());
    expect(pageFooter('Página 1 de 1')).toBeInTheDocument();
  });
});
