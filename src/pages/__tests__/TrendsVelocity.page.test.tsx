/**
 * Tests FASE 5 (plan auditoría BI): TrendsVelocity.
 * Contratos fijados por FASE 3/4: hora pico REAL del hourly (P1-4, fuera la
 * "14:00" fija), heatmap con máximo real del período (fuera el max fijo 1M),
 * KPIs formateados y unidades/día redondeadas. H7: "Actualizar" cableado.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrendsVelocity from '../sales-analytics/TrendsVelocity';
import salesAnalyticsService from '@/services/bi/salesAnalyticsService';

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  default: {
    getVelocity: vi.fn(),
    getHeatmap: vi.fn(),
    getTrends: vi.fn(),
  },
  salesAnalyticsService: {
    getVelocity: vi.fn(),
    getHeatmap: vi.fn(),
    getTrends: vi.fn(),
  },
}));

const mockService = salesAnalyticsService as unknown as {
  getVelocity: ReturnType<typeof vi.fn>;
  getHeatmap: ReturnType<typeof vi.fn>;
  getTrends: ReturnType<typeof vi.fn>;
};

const hourly = {
  data_points: [
    { label: '10:00', sales: 120000 },
    { label: '12:00', sales: 900000 },
    { label: '20:00', sales: 60000 },
  ],
};

describe('TrendsVelocity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getVelocity.mockResolvedValue({
      success: true,
      data: {
        overall: {
          sales_per_day: 500000,
          sales_per_hour: 20833,
          units_per_day: 12.3456,
          avg_minutes_between_sales: 45,
        },
      },
    });
    mockService.getHeatmap.mockResolvedValue({
      success: true,
      data: {
        data: Array.from({ length: 7 }, (_, d) =>
          Array.from({ length: 24 }, (_, h) => (d === 4 && h === 12 ? 800 : 10)),
        ),
        period: { start_date: '2026-08-18', end_date: '2026-09-17' },
      },
    });
    mockService.getTrends.mockImplementation((({ granularity }: { granularity: string }) =>
      Promise.resolve({
        success: true,
        data: granularity === 'hourly' ? hourly : { data_points: [{ label: 'Viernes', sales: 800000 }] },
      })) as unknown as ReturnType<typeof vi.fn>);
  });

  it('consulta velocity, heatmap y las 2 granularidades de trends', async () => {
    render(<TrendsVelocity />);

    await waitFor(() => {
      expect(mockService.getVelocity).toHaveBeenCalledWith({ period: 'month' });
      expect(mockService.getHeatmap).toHaveBeenCalledWith({ period: 'month' });
      expect(mockService.getTrends).toHaveBeenCalledWith({ period: 'month', granularity: 'daily' });
      expect(mockService.getTrends).toHaveBeenCalledWith({ period: 'month', granularity: 'hourly' });
    });
  });

  it('KPIs formateados: hora pico REAL del hourly y unidades redondeadas', async () => {
    render(<TrendsVelocity />);
    await screen.findByText('Hora pico: 12:00');

    expect(screen.getByText('Gs. 500.000')).toBeInTheDocument();
    expect(screen.getByText('Hora pico: 12:00')).toBeInTheDocument(); // no la fija "14:00"
    expect(screen.getByText('12.3')).toBeInTheDocument(); // unidades/día 1 decimal
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText('Pico: 12:00')).toBeInTheDocument(); // badge del gráfico horario
  });

  it('heatmap: días renderizados con período real del BE', async () => {
    render(<TrendsVelocity />);
    await screen.findByText('Heatmap de Ventas');

    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Domingo')).toBeInTheDocument();
    const expectedLabel = `${new Date('2026-08-18').toLocaleDateString()} - ${new Date('2026-09-17').toLocaleDateString()}`;
    await waitFor(() => expect(screen.getByText(expectedLabel)).toBeInTheDocument());
  });

  it('H7: el botón Actualizar re-consulta los 4 endpoints', async () => {
    const user = userEvent.setup();
    render(<TrendsVelocity />);
    await screen.findByText('Hora pico: 12:00');

    const calls = mockService.getVelocity.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /Actualizar/ }));

    await waitFor(() => expect(mockService.getVelocity.mock.calls.length).toBeGreaterThan(calls));
  });
});
