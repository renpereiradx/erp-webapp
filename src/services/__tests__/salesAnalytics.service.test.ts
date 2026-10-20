/**
 * Contrato del servicio de Analítica de Ventas (F4): ruta exacta de cada
 * endpoint de `/sales-analytics/*`, limpieza de params vacíos y passthrough
 * del envelope `{success,data,metadata}`. Los gates (analytics:read /
 * reports:read) viven en el BE y en el router; acá solo se fija el HTTP.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { salesAnalyticsService } from '../bi/salesAnalyticsService';
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}));

const envelope = (data: unknown, metadata: Record<string, unknown> = { scope: {} }) => ({
  success: true,
  data,
  metadata,
});

describe('salesAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}) as never);
  });

  it('getPerformance pega GET /sales-analytics/performance con compare', async () => {
    await salesAnalyticsService.getPerformance({ period: 'month', compare: true });
    expect(apiClient.get).toHaveBeenCalledWith('/sales-analytics/performance', {
      params: { period: 'month', compare: 'true' },
    });
  });

  it('getDashboard pega GET /sales-analytics/dashboard', async () => {
    await salesAnalyticsService.getDashboard({ period: 'year' });
    expect(apiClient.get).toHaveBeenCalledWith('/sales-analytics/dashboard', {
      params: { period: 'year' },
    });
  });

  it('getTrends envía la granularidad explícita', async () => {
    await salesAnalyticsService.getTrends({ period: 'today', granularity: 'hourly' });
    expect(apiClient.get).toHaveBeenCalledWith('/sales-analytics/trends', {
      params: { period: 'today', granularity: 'hourly' },
    });
  });

  it('getByCategory envía limit cuando se pide', async () => {
    await salesAnalyticsService.getByCategory({ period: 'month', limit: 20 });
    expect(apiClient.get).toHaveBeenCalledWith('/sales-analytics/by-category', {
      params: { period: 'month', limit: '20' },
    });
  });

  it('getByProduct envía paginación y sort server-side', async () => {
    await salesAnalyticsService.getByProduct({
      period: 'month',
      page: 2,
      page_size: 10,
      sort_by: 'margin',
      sort_order: 'asc',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/sales-analytics/by-product', {
      params: {
        period: 'month',
        page: '2',
        page_size: '10',
        sort_by: 'margin',
        sort_order: 'asc',
      },
    });
  });

  it('getTopBottomProducts pega GET /sales-analytics/top-bottom-products', async () => {
    await salesAnalyticsService.getTopBottomProducts({ period: 'month', limit: 5 });
    expect(apiClient.get).toHaveBeenCalledWith('/sales-analytics/top-bottom-products', {
      params: { period: 'month', limit: '5' },
    });
  });

  it('getByCustomer y getBySeller envían page/page_size', async () => {
    await salesAnalyticsService.getByCustomer({ period: 'month', page: 1, page_size: 10 });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/by-customer', {
      params: { period: 'month', page: '1', page_size: '10' },
    });

    await salesAnalyticsService.getBySeller({ period: 'month', page: 3, page_size: 10 });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/by-seller', {
      params: { period: 'month', page: '3', page_size: '10' },
    });
  });

  it('getByHour y getByDayOfWeek pegan sus endpoints', async () => {
    await salesAnalyticsService.getByHour({ period: 'week' });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/by-hour', {
      params: { period: 'week' },
    });

    await salesAnalyticsService.getByDayOfWeek({ period: 'week' });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/by-day-of-week', {
      params: { period: 'week' },
    });
  });

  it('getHeatmap conserva el contrato del período', async () => {
    await salesAnalyticsService.getHeatmap({ period: 'month' });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/heatmap', {
      params: { period: 'month' },
    });
  });

  it('getVelocity pega GET /sales-analytics/velocity', async () => {
    await salesAnalyticsService.getVelocity({ period: 'month' });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/velocity', {
      params: { period: 'month' },
    });
  });

  it('getComparison modo período omite fechas y modo rangos las envía', async () => {
    await salesAnalyticsService.getComparison({ period: 'month' });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/compare', {
      params: { period: 'month' },
    });

    await salesAnalyticsService.getComparison({
      start1: '2026-09-01',
      end1: '2026-09-30',
      start2: '2026-08-01',
      end2: '2026-08-31',
    });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/compare', {
      params: {
        start1: '2026-09-01',
        end1: '2026-09-30',
        start2: '2026-08-01',
        end2: '2026-08-31',
      },
    });
  });

  it('getDiscounts y getDiscountsSummary exigen fechas y tipan metadata', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      envelope([], { total_count: 7, group_by: 'seller' }) as never,
    );

    const lines = await salesAnalyticsService.getDiscounts({
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      page: 1,
      page_size: 10,
    });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/discounts', {
      params: {
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        page: '1',
        page_size: '10',
      },
    });
    expect(lines.metadata?.total_count).toBe(7);

    await salesAnalyticsService.getDiscountsSummary({
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      group_by: 'branch',
    });
    expect(apiClient.get).toHaveBeenLastCalledWith('/sales-analytics/discounts/summary', {
      params: {
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        group_by: 'branch',
      },
    });
  });

  it('droppea params undefined/null/empty sin inventar defaults', async () => {
    await salesAnalyticsService.getByProduct({
      period: 'month',
      page: 1,
      page_size: undefined,
      sort_by: undefined,
      sort_order: undefined,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/sales-analytics/by-product', {
      params: { period: 'month', page: '1' },
    });
  });

  it('re-lanza el error del HTTP y lo registra en telemetría', async () => {
    const record = vi.spyOn(telemetry, 'record');
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network down'));

    await expect(salesAnalyticsService.getDashboard({ period: 'month' })).rejects.toThrow(
      'network down',
    );
    expect(record).toHaveBeenCalledWith('bi.salesAnalytics.error', {
      operation: 'getDashboard',
      error: 'network down',
    });
    record.mockRestore();
  });
});
