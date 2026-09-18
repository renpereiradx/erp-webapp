/**
 * Tests FASE 2 (plan alineación BI): ProfitabilityTrends.
 * Mock del hook del feature; fakeT global con fallbacks en español.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfitabilityTrends from '@/features/profitability/components/ProfitabilityTrends';
import { useProfitability } from '@/features/profitability/hooks/useProfitability';

vi.mock('@/features/profitability/hooks/useProfitability', () => ({
  useProfitability: vi.fn(),
}));

const mockUse = useProfitability as unknown as ReturnType<typeof vi.fn>;

const trendsData = {
  data_points: [
    { label: 'Lun', revenue: 1000000, gross_profit: 250000 },
    { label: 'Mar', revenue: 800000, gross_profit: 120000 },
  ],
  summary: {
    trend_direction: 'UP',
    growth_rate: 12.5,
    previous_growth_rate: 9.8,
    peak_profit_date: '2026-09-05',
    peak_profit_value: 450000,
    total_period_revenue: 1800000,
    average_gross_margin: 24.5,
    average_net_margin: 11.2,
    insights: [
      { type: 'EFFICIENCY', title: 'Margen saludable', message: 'Margen bruto estable sobre 20%' },
      { type: 'WARNING', title: 'Caída puntual', message: 'Martes con beneficio bajo' },
    ],
  },
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfitabilityTrends />
    </MemoryRouter>,
  );

describe('ProfitabilityTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUse.mockReturnValue({ data: trendsData, loading: false, error: null, refresh: vi.fn() });
  });

  it('muestra header, KPIs de resumen y la matriz de evolución', () => {
    renderPage();

    expect(screen.getByText('Evolución Temporal')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-trend-vector')).toHaveTextContent('Expansión Sostenida');
    expect(screen.getByTestId('kpi-growth-rate')).toHaveTextContent('+12,5%');
    expect(screen.getByTestId('kpi-peak-profit')).toBeInTheDocument();
    expect(screen.getByTestId('trends-chart')).toBeInTheDocument();
    expect(screen.getByText('Lun')).toBeInTheDocument();
  });

  it('muestra los insights con tono por tipo', () => {
    renderPage();

    expect(screen.getByTestId('insights-panel')).toHaveTextContent('Margen saludable');
    expect(screen.getByTestId('insights-panel')).toHaveTextContent('Caída puntual');
  });

  it('muestra la vigilancia de márgenes con valores reales', () => {
    renderPage();

    expect(screen.getByTestId('margin-watch')).toHaveTextContent('24,5%');
    expect(screen.getByTestId('margin-watch')).toHaveTextContent('11,2%');
  });

  it('cambia la granularidad con el selector segmentado', async () => {
    renderPage();

    expect(screen.getByTestId('granularity-weekly')).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByTestId('granularity-weekly'));
    expect(screen.getByTestId('granularity-weekly')).toHaveAttribute('aria-pressed', 'true');
  });

  it('muestra EmptyState sin data points y ErrorState con reintento', async () => {
    const refresh = vi.fn();
    mockUse.mockReturnValue({ data: { data_points: [], summary: {} }, loading: false, error: null, refresh });
    const { unmount } = renderPage();
    expect(screen.getByText('Sin series disponibles')).toBeInTheDocument();
    unmount();

    mockUse.mockReturnValue({ data: null, loading: false, error: 'sin señal', refresh });
    renderPage();
    expect(screen.getByText('sin señal')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('error-retry'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
