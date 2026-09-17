/**
 * Tests FASE 5 (plan auditoría BI): FinancialSummaryDashboard.
 * Datos reales (F3F): income-statement + cash-flow (ending_cash) +
 * health-score. Mock en la frontera del hook del módulo
 * (@/hooks/useFinancialReports) — el cast de la página es parte de su contrato.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FinancialSummaryDashboard from '../FinancialSummaryDashboard';
import { useFinancialReports } from '@/hooks/useFinancialReports';

vi.mock('@/hooks/useFinancialReports', () => ({
  useFinancialReports: vi.fn(),
}));

const mockUse = useFinancialReports as unknown as ReturnType<typeof vi.fn>;

const fetchIncomeStatement = vi.fn();
const fetchCashFlow = vi.fn();
const fetchHealthScore = vi.fn();

const loadedState = {
  loading: false,
  incomeStatement: {
    revenue: { net_sales: 2500000 },
    cost_of_sales: { cost_of_goods_sold: 1800000 },
    net_income: 700000,
    comparison: { revenue_change_pct: 12, expense_change_pct: -3, net_income_change_pct: 25 },
  },
  cashFlow: { ending_cash: 386360 },
  healthScore: {
    score: 95,
    rating: 'EXCELLENT',
    working_capital: 1500000,
    current_ratio: 1.82,
    quick_ratio: 0.29,
    net_margin: 42.5,
  },
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <FinancialSummaryDashboard />
    </MemoryRouter>,
  );

describe('FinancialSummaryDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUse.mockReturnValue({
      ...loadedState,
      fetchIncomeStatement,
      fetchCashFlow,
      fetchHealthScore,
    });
  });

  it('consulta los 3 reportes con el período default (month, comparación on)', async () => {
    renderPage();

    await waitFor(() => expect(fetchIncomeStatement).toHaveBeenCalledWith('month', true));
    expect(fetchCashFlow).toHaveBeenCalledWith('month');
    expect(fetchHealthScore).toHaveBeenCalledWith('month');
  });

  it('monta KPIs, salud financiera y ratios reales', async () => {
    renderPage();

    expect(screen.getByText('Resumen Financiero')).toBeInTheDocument();
    expect(screen.getByText('Ingresos Totales')).toBeInTheDocument();
    expect(screen.getByText(/2\.500\.000/)).toBeInTheDocument();
    expect(screen.getByText(/1\.800\.000/)).toBeInTheDocument();
    expect(screen.getByText(/700\.000/)).toBeInTheDocument();
    // Posición de Caja = ending_cash real (fuera "$1.2M" de F2)
    expect(screen.getByText(/386\.360/)).toBeInTheDocument();
    // +12% / -3% / +25%
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('-3%')).toBeInTheDocument();

    expect(screen.getByText('95')).toBeInTheDocument(); // score real
    expect(screen.getByText('Excelente')).toBeInTheDocument();
    expect(screen.getByText('1.82')).toBeInTheDocument(); // current ratio
    expect(screen.getByText('0.29')).toBeInTheDocument(); // quick ratio
    expect(screen.getByText('42.5%')).toBeInTheDocument();
    expect(screen.getByText('Saludable')).toBeInTheDocument();
  });

  it('cambiar período y toggle de comparación re-consulta', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Resumen Financiero')).toBeInTheDocument());

    await user.click(screen.getByText('Semana'));
    await waitFor(() => expect(fetchIncomeStatement).toHaveBeenLastCalledWith('week', true));
    expect(fetchCashFlow).toHaveBeenLastCalledWith('week');

    await user.click(screen.getByRole('checkbox')); // toggle "comparar con período anterior"
    await waitFor(() => expect(fetchIncomeStatement).toHaveBeenLastCalledWith('week', false));
  });

  it('loading inicial sin datos → spinner (estado §6.7)', () => {
    mockUse.mockReturnValue({
      loading: true,
      incomeStatement: null,
      cashFlow: null,
      healthScore: null,
      fetchIncomeStatement,
      fetchCashFlow,
      fetchHealthScore,
    });
    renderPage();

    expect(screen.getByText('Cargando Resumen Financiero...')).toBeInTheDocument();
  });

  it('sin ending_cash ni score la página cae honesta a guiones', () => {
    mockUse.mockReturnValue({
      loading: false,
      incomeStatement: null,
      cashFlow: { ending_cash: null },
      healthScore: null,
      fetchIncomeStatement,
      fetchCashFlow,
      fetchHealthScore,
    });
    renderPage();

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4); // caja, score, pct y ratios
  });
});
