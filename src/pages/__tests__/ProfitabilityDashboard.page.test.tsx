/**
 * Tests FASE 2 (plan alineación BI): ProfitabilityDashboard.
 * Mock en la frontera del hook del feature
 * (@/features/profitability/hooks/useProfitability) y del barrel para
 * KpiCard/Skeleton (los hijos compartidos tienen su propio contrato).
 * fakeT global resuelve el fallback español de cada key.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfitabilityDashboard from '@/features/profitability/components/ProfitabilityDashboard';
import { useProfitability } from '@/features/profitability/hooks/useProfitability';

vi.mock('@/features/profitability/hooks/useProfitability', () => ({
  useProfitability: vi.fn(),
}));

const mockUse = useProfitability as unknown as ReturnType<typeof vi.fn>;

const dashboardData = {
  kpis: {
    total_revenue: 12500000,
    revenue_growth: 8.4,
    total_profit: 4300000,
    profit_growth: -2.1,
    gross_margin_pct: 34.5,
    gross_margin_growth: 1.2,
    net_margin_pct: 12.3,
    net_margin_growth: 0,
    roi: 18.9,
    roi_growth: 2.5,
    profit_per_transaction: 45000,
    profit_per_tx_growth: 3.1,
  },
  break_even_status: {
    has_reached_break_even: false,
    coverage_required: 4.2,
    current_progress: 87.5,
  },
  alerts: [
    { severity: 'HIGH', time_ago: 'hace 2h', type: 'MARGEN', message: 'Margen bajo en categoría accesorios' },
    { severity: 'INFO', time_ago: 'hace 1d', type: 'VOLUMEN', message: 'Caída de volumen en sucursal 2' },
  ],
  efficiency_trend: {
    data_points: [
      { label: 'Ene', performance: 80, profit_pct: 40 },
      { label: 'Feb', performance: 65, profit_pct: 30 },
    ],
  },
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfitabilityDashboard />
    </MemoryRouter>,
  );

describe('ProfitabilityDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUse.mockReturnValue({
      data: dashboardData,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
  });

  it('muestra header, 6 KPIs y el gráfico de eficiencia con datos', () => {
    renderPage();

    expect(screen.getByText('Dashboard Financiero')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-total-revenue')).toHaveTextContent('Ingresos Totales');
    expect(screen.getByTestId('kpi-gross-profit')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-gross-margin')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-net-margin')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-roi')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-profit-per-tx')).toBeInTheDocument();
    expect(screen.getByTestId('efficiency-chart')).toBeInTheDocument();
    expect(screen.getByText('Ene')).toBeInTheDocument();
  });

  it('renderiza break-even sin alcanzar con progreso y hint de cobertura', () => {
    renderPage();

    const widget = screen.getByTestId('break-even-widget');
    expect(widget).toHaveTextContent('Falta Cobertura');
    expect(widget).toHaveTextContent('4,2%');
    expect(widget).toHaveTextContent('87,5%');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '88');
  });

  it('renderiza las alertas de riesgo con severidad', () => {
    renderPage();

    expect(screen.getByTestId('risk-alerts')).toBeInTheDocument();
    expect(screen.getByText('Margen bajo en categoría accesorios')).toBeInTheDocument();
    expect(screen.getByText('Caída de volumen en sucursal 2')).toBeInTheDocument();
    expect(screen.getAllByText('HIGH')).toHaveLength(1);
  });

  it('muestra skeleton mientras carga (el header permanece)', () => {
    mockUse.mockReturnValue({ data: null, loading: true, error: null, refresh: vi.fn() });
    renderPage();

    expect(screen.getByTestId('profitability-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-total-revenue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('efficiency-chart')).not.toBeInTheDocument();
  });

  it('muestra ErrorState con mensaje del hook y reintenta vía refresh', async () => {
    const refresh = vi.fn();
    mockUse.mockReturnValue({ data: null, loading: false, error: 'backend offline', refresh });
    renderPage();

    expect(screen.getByText('backend offline')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('error-retry'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('muestra EmptyState cuando carga OK pero no hay kpis, con acción de actualizar', async () => {
    const refresh = vi.fn();
    mockUse.mockReturnValue({ data: null, loading: false, error: null, refresh });
    renderPage();

    expect(screen.getByText('Sin datos de rentabilidad')).toBeInTheDocument();
    // Hay 2 botones "Actualizar" (header + EmptyState); cualquiera refresca
    const refreshButtons = screen.getAllByRole('button', { name: /actualizar/i });
    await userEvent.click(refreshButtons[refreshButtons.length - 1]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('cambia el período con el selector segmentado', async () => {
    renderPage();

    const yearButton = screen.getByTestId('period-year');
    expect(yearButton).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(yearButton);
    expect(yearButton).toHaveAttribute('aria-pressed', 'true');
  });
});
