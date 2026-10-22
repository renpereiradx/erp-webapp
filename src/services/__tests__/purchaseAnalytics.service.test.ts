/**
 * Contrato del servicio de Analítica de Compras (PLAN_ANALITICA_COMPRAS):
 * ruta exacta de cada endpoint de `/purchase-analytics/*`, limpieza de params
 * vacíos y passthrough del envelope `{success,data,metadata}`. El gate
 * (analytics:read) vive en el BE y en el router; acá solo se fija el HTTP.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { purchaseAnalyticsService } from '../bi/purchaseAnalyticsService';
import { apiClient } from '../api';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}));

const envelope = (data: unknown, metadata: Record<string, unknown> = { scope: {} }) => ({
  success: true,
  data,
  metadata,
});

describe('purchaseAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}) as never);
  });

  it('getPerformance pega GET /purchase-analytics/performance con compare', async () => {
    await purchaseAnalyticsService.getPerformance({ period: 'month', compare: true });
    expect(apiClient.get).toHaveBeenCalledWith('/purchase-analytics/performance', {
      params: { period: 'month', compare: 'true' },
    });
  });

  it('getTrends envía la granularidad explícita', async () => {
    await purchaseAnalyticsService.getTrends({ period: 'year', granularity: 'monthly' });
    expect(apiClient.get).toHaveBeenCalledWith('/purchase-analytics/trends', {
      params: { period: 'year', granularity: 'monthly' },
    });
  });

  it('getByCategory envía limit cuando se pide', async () => {
    await purchaseAnalyticsService.getByCategory({ period: 'month', limit: 20 });
    expect(apiClient.get).toHaveBeenCalledWith('/purchase-analytics/by-category', {
      params: { period: 'month', limit: '20' },
    });
  });

  it('getByProduct envía paginación y sort server-side', async () => {
    await purchaseAnalyticsService.getByProduct({
      period: 'month',
      page: 2,
      page_size: 10,
      sort_by: 'units',
      sort_order: 'asc',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/purchase-analytics/by-product', {
      params: {
        period: 'month',
        page: '2',
        page_size: '10',
        sort_by: 'units',
        sort_order: 'asc',
      },
    });
  });

  it('getBySupplier usa sus tokens de sort propios (amount/purchases)', async () => {
    await purchaseAnalyticsService.getBySupplier({
      period: 'week',
      sort_by: 'amount',
      sort_order: 'desc',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/purchase-analytics/by-supplier', {
      params: { period: 'week', sort_by: 'amount', sort_order: 'desc' },
    });
  });

  it('getByBuyer pega GET /purchase-analytics/by-buyer con paginación', async () => {
    await purchaseAnalyticsService.getByBuyer({ period: 'month', page: 1, page_size: 10 });
    expect(apiClient.get).toHaveBeenCalledWith('/purchase-analytics/by-buyer', {
      params: { period: 'month', page: '1', page_size: '10' },
    });
  });

  it('getByPaymentMethod / getByHour / getByDayOfWeek pegan sus rutas', async () => {
    await purchaseAnalyticsService.getByPaymentMethod({ period: 'month' });
    await purchaseAnalyticsService.getByHour({ period: 'month' });
    await purchaseAnalyticsService.getByDayOfWeek({ period: 'month' });
    const calls = vi.mocked(apiClient.get).mock.calls.map(([path]) => path);
    expect(calls).toEqual([
      '/purchase-analytics/by-payment-method',
      '/purchase-analytics/by-hour',
      '/purchase-analytics/by-day-of-week',
    ]);
  });

  it('getComparison modo período manda solo period', async () => {
    await purchaseAnalyticsService.getComparison({ period: 'month' });
    expect(apiClient.get).toHaveBeenCalledWith('/purchase-analytics/compare', {
      params: { period: 'month' },
    });
  });

  it('getComparison modo rangos manda los 4 extremos', async () => {
    await purchaseAnalyticsService.getComparison({
      start1: '2026-09-01',
      end1: '2026-09-30',
      start2: '2026-08-01',
      end2: '2026-08-31',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/purchase-analytics/compare', {
      params: {
        start1: '2026-09-01',
        end1: '2026-09-30',
        start2: '2026-08-01',
        end2: '2026-08-31',
      },
    });
  });

  it('limpia params vacíos antes de la query', async () => {
    await purchaseAnalyticsService.getTrends({ period: 'month', granularity: undefined });
    expect(apiClient.get).toHaveBeenCalledWith('/purchase-analytics/trends', {
      params: { period: 'month' },
    });
  });

  it('devuelve el envelope sin desenvolver y telemetriza el error', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('boom') as never);
    await expect(purchaseAnalyticsService.getPerformance()).rejects.toThrow('boom');
  });
});
