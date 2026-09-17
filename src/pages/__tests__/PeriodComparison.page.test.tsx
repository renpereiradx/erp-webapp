/**
 * Tests FASE 5 (plan auditoría BI): PeriodComparison.
 * Contrato fijado en FASE 4 (drift): la serie "Período B" YA NO se fabrica —
 * ambas series vienen de /trends/date-range con los límites que el propio
 * compare resuelve. Delta de margen en pp calculado de márgenes reales.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PeriodComparison from '../sales-analytics/PeriodComparison';
import salesAnalyticsService from '@/services/bi/salesAnalyticsService';

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  default: { comparePeriods: vi.fn(), getTrendsDateRange: vi.fn() },
  salesAnalyticsService: { comparePeriods: vi.fn(), getTrendsDateRange: vi.fn() },
}));

const mockService = salesAnalyticsService as unknown as {
  comparePeriods: ReturnType<typeof vi.fn>;
  getTrendsDateRange: ReturnType<typeof vi.fn>;
};

const compareData = {
  period_1: {
    period: { start_date: '2026-08-01', end_date: '2026-08-31' },
    total_sales: 1000000,
    total_transactions: 100,
    total_units: 300,
    average_ticket: 10000,
    unique_customers: 40,
    gross_margin: 200000,
  },
  period_2: {
    period: { start_date: '2026-07-01', end_date: '2026-07-31' },
    total_sales: 800000,
    total_transactions: 90,
    total_units: 250,
    average_ticket: 8888,
    unique_customers: 35,
    gross_margin: 120000,
  },
  differences: {
    sales_change_pct: 25,
    sales_change: 200000,
    transactions_change_pct: 11.1,
    transactions_change: 10,
    units_change_pct: 20,
    units_change: 50,
    ticket_change_pct: 12.5,
    ticket_change: 1112,
    customers_change_pct: 14.3,
    customers_change: 5,
    margin_change_pct: 33.3,
  },
};

const renderPage = () => render(<PeriodComparison />);

describe('PeriodComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.comparePeriods.mockResolvedValue({ success: true, data: compareData });
    mockService.getTrendsDateRange.mockImplementation(({ start_date }: { start_date: string }) =>
      Promise.resolve({
        success: true,
        data: {
          data_points: [
            { label: start_date.slice(8), sales: start_date < '2026-08' ? 90000 : 100000 },
            { label: '15', sales: 120000 },
          ],
        },
      }),
    );
  });

  it('consulta el compare con month y las 2 series reales con los límites del compare', async () => {
    renderPage();

    await waitFor(() => expect(mockService.comparePeriods).toHaveBeenCalledWith({ period: 'month' }));
    await waitFor(() => {
      expect(mockService.getTrendsDateRange).toHaveBeenCalledWith({
        start_date: '2026-08-01',
        end_date: '2026-08-31',
      });
      expect(mockService.getTrendsDateRange).toHaveBeenCalledWith({
        start_date: '2026-07-01',
        end_date: '2026-07-31',
      });
    });
  });

  it('KPIs A vs B con delta de margen en pp (20% - 15% = +5pp)', async () => {
    renderPage();
    await screen.findByText('Ventas Totales');

    expect(screen.getByText('Gs. 1.000.000')).toBeInTheDocument();
    expect(screen.getByText('+5pp')).toBeInTheDocument();
    expect(screen.getByText('+25%')).toBeInTheDocument();
    // margen % por período: 20.0% y 15.0%
    expect(screen.getAllByText('20.0%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('15.0%').length).toBeGreaterThanOrEqual(1);
  });

  it('rangos personalizados incompletos → alerta, sin consulta', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Ventas Totales');

    await user.click(screen.getByRole('button', { name: 'Rangos Personalizados' }));
    await user.click(screen.getByRole('button', { name: /Comparar/ }));

    expect(alertSpy).toHaveBeenCalled();
    expect(mockService.comparePeriods).toHaveBeenCalledTimes(1); // solo el mount
    alertSpy.mockRestore();
  });

  it('rangos personalizados completos → compare con las fechas del formulario', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Ventas Totales');

    await user.click(screen.getByRole('button', { name: 'Rangos Personalizados' }));
    const inputs = screen.getAllByDisplayValue('');
    await user.type(inputs[0], '2026-06-01');
    await user.type(inputs[1], '2026-06-30');
    await user.type(inputs[2], '2026-05-01');
    await user.type(inputs[3], '2026-05-31');
    await user.click(screen.getByRole('button', { name: /Comparar/ }));

    await waitFor(() =>
      expect(mockService.comparePeriods).toHaveBeenLastCalledWith({
        start1: '2026-06-01',
        end1: '2026-06-30',
        start2: '2026-05-01',
        end2: '2026-05-31',
      }),
    );
  });

  it('compare sin datos → estado vacío honesto', async () => {
    mockService.comparePeriods.mockResolvedValue({ success: true, data: null });
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('No se pudo cargar la comparación de períodos.')).toBeInTheDocument(),
    );
  });
});
