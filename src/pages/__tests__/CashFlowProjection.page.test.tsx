/**
 * Tests FASE 5 (plan auditoría BI): CashFlowProjection (página).
 * La lógica vive en useCashFlow (test propio del feature); aquí se fija la
 * orquestación: estados loading/error/retry, selector de período y título.
 * Mock en la frontera del módulo consumido: el hook del feature.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CashFlowProjection from '../CashFlowProjection';
import { useCashFlow } from '@/features/cash-flow/hooks/useCashFlow';

vi.mock('@/features/cash-flow/hooks/useCashFlow', () => ({
  useCashFlow: vi.fn(),
}));

const mockUse = useCashFlow as unknown as ReturnType<typeof vi.fn>;

const setPeriod = vi.fn();
const refresh = vi.fn();

const loadedState = {
  period: '30D' as const,
  setPeriod,
  loading: false,
  error: null,
  filteredData: [{ name: '17 sept.', ingresos: 100, egresos: 50, balance: 50 }],
  stats: { coverageRatio: 2, netFlow: 500000, totalInflows: 1000000, totalOutflows: 500000 },
  pendingPayments: [
    {
      date: '17 sept.',
      isToday: true,
      subtotal: 300000,
      items: [
        { id: 'PO-1', code: 'BO', name: 'BodyTech', description: 'Vence en 0 días', category: 'URGENT', amount: 300000, priority: 'PRIORIDAD ALTA' },
      ],
    },
  ],
  refresh,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <CashFlowProjection />
    </MemoryRouter>,
  );

describe('CashFlowProjection (página)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = '';
    mockUse.mockReturnValue(loadedState);
  });

  it('renderiza header, KPIs y calendario con datos reales + título de documento', async () => {
    renderPage();

    expect(screen.getByText('Proyección de Pagos y Flujo de Caja')).toBeInTheDocument();
    expect(await screen.findByText('Calendario de Pagos Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Ratio de Cobertura')).toBeInTheDocument();
    expect(screen.getByText('BodyTech')).toBeInTheDocument();
    expect(document.title).toBe('Proyección de Pagos y Flujo | ERP System');
  });

  it('selector de período 30/60/90 delega en setPeriod', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '90 Días' }));
    expect(setPeriod).toHaveBeenCalledWith('90D');
  });

  it('loading inicial (sin datos) → spinner, sin contenido', () => {
    mockUse.mockReturnValue({ ...loadedState, loading: true, filteredData: [], pendingPayments: [] });
    renderPage();

    expect(screen.getByText('Calculando Proyección Financiera...')).toBeInTheDocument();
    expect(screen.queryByText('Calendario de Pagos Pendientes')).not.toBeInTheDocument();
  });

  it('error sin datos → mensaje + Reintentar delega en refresh', async () => {
    const user = userEvent.setup();
    mockUse.mockReturnValue({ ...loadedState, error: 'boom', filteredData: [], pendingPayments: [] });
    renderPage();

    expect(screen.getByText('No se pudo cargar la proyección de flujo de caja.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refresh).toHaveBeenCalled();
  });

  it('error con datos previos → la página se mantiene (sin blank por un refresh fallido)', async () => {
    mockUse.mockReturnValue({ ...loadedState, error: 'boom' });
    renderPage();
    await waitFor(() => expect(screen.getByText('Calendario de Pagos Pendientes')).toBeInTheDocument());
  });
});
