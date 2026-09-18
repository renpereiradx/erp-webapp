/**
 * Tests FASE 2 (plan alineación BI): SellerProfitability.
 * Mock del hook del feature; fakeT global resuelve fallbacks en español.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SellerProfitability from '@/features/profitability/components/SellerProfitability';
import { useProfitability } from '@/features/profitability/hooks/useProfitability';

vi.mock('@/features/profitability/hooks/useProfitability', () => ({
  useProfitability: vi.fn(),
}));

const mockUse = useProfitability as unknown as ReturnType<typeof vi.fn>;

const sellersData = {
  sellers: [
    { rank: 1, seller_name: 'Ana Ledesma', gross_profit: 4300000, gross_margin_pct: 32, total_sales: 120, total_revenue: 13400000 },
    { rank: 2, seller_name: 'Bruno Ortiz', gross_profit: 3100000, gross_margin_pct: 24, total_sales: 98, total_revenue: 12900000 },
  ],
  summary: {
    total_profit: 7400000,
    average_operating_margin: 21.4,
    margin_objective: 25,
    average_profit_per_seller: 3700000,
    profit_growth: 5.2,
  },
  contribution_share: [
    { label: 'Ana Ledesma', pct: 58 },
    { label: 'Bruno Ortiz', pct: 42 },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <SellerProfitability />
    </MemoryRouter>,
  );

describe('SellerProfitability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUse.mockReturnValue({ data: sellersData, loading: false, error: null, refresh: vi.fn() });
  });

  it('muestra header, KPIs y la tabla de ranking', () => {
    renderPage();

    expect(screen.getByText('Desempeño de Ventas')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-avg-profit')).toHaveTextContent('Promedio Beneficio');
    // Anchor del top seller con el nombre real como subtítulo
    expect(screen.getByTestId('kpi-top-seller')).toHaveTextContent('Ana Ledesma');
    // Aparece en la tabla y en la leyenda del donut
    expect(screen.getAllByText('Bruno Ortiz').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Ranking de Desempeño Comercial')).toBeInTheDocument();
  });

  it('no renderiza el ID fabricado del legacy (ES-7xx)', () => {
    renderPage();
    expect(screen.queryByText(/ES-70/)).not.toBeInTheDocument();
  });

  it('renderiza el donut de cuota de beneficio con el neto total compacto', () => {
    renderPage();

    expect(screen.getByText('Cuota de Beneficio')).toBeInTheDocument();
    // 7.400.000 > 1M → formato compacto del dominio
    expect(screen.getByText('7.4M')).toBeInTheDocument();
    expect(screen.getByText('Ana Ledesma', { selector: 'li span' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Cuota de Beneficio' })).toBeInTheDocument();
  });

  it('muestra la matriz de eficiencia con los primeros 4 vendedores', () => {
    renderPage();

    expect(screen.getByText('Matriz de Eficiencia')).toBeInTheDocument();
    // El "32% M.B." vive en un span con el porcentaje: match parcial
    expect(screen.getAllByText(/M\.B\./)).toHaveLength(2);
  });

  it('muestra skeleton mientras carga', () => {
    mockUse.mockReturnValue({ data: null, loading: true, error: null, refresh: vi.fn() });
    renderPage();

    expect(screen.getByTestId('profitability-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-top-seller')).not.toBeInTheDocument();
  });

  it('muestra ErrorState con reintento vía refresh', async () => {
    const refresh = vi.fn();
    mockUse.mockReturnValue({ data: null, loading: false, error: 'timeout', refresh });
    renderPage();

    expect(screen.getByText('timeout')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('error-retry'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('EmptyState cuando no hay vendedores, con acción', async () => {
    const refresh = vi.fn();
    mockUse.mockReturnValue({ data: { sellers: [], summary: {}, contribution_share: [] }, loading: false, error: null, refresh });
    renderPage();

    expect(screen.getByText('Sin datos de vendedores')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: /actualizar/i });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('expone solo los períodos month/quarter/year', () => {
    renderPage();

    expect(screen.getByTestId('period-month')).toBeInTheDocument();
    expect(screen.getByTestId('period-quarter')).toBeInTheDocument();
    expect(screen.getByTestId('period-year')).toBeInTheDocument();
    expect(screen.queryByTestId('period-today')).not.toBeInTheDocument();
  });
});
