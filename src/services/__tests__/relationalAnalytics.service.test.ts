/**
 * Contrato del servicio de drill-downs relacionales (F3): ruta exacta de cada
 * endpoint BE (RF-BIPACK-021..024), limpieza de params vacíos (URLSearchParams
 * no debe ver undefined) y passthrough del envelope {success,data,metadata}.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { relationalAnalyticsService } from '../bi/relationalAnalyticsService';
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}));

const envelope = (data: unknown) => ({ success: true, data, metadata: { scope: {} } });

describe('relationalAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(envelope({ rows: [], total: 0 }) as never);
  });

  it('getProductBuyers pega GET /sales-analytics/products/{id}/buyers', async () => {
    const response = await relationalAnalyticsService.getProductBuyers('PRD-1', {
      sort: '-total',
      page: 1,
      page_size: 10,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/sales-analytics/products/PRD-1/buyers', {
      params: { sort: '-total', page: '1', page_size: '10' },
    });
    expect(response.success).toBe(true);
  });

  it('getCustomerTopProducts pega GET /sales-analytics/customers/{id}/top-products', async () => {
    await relationalAnalyticsService.getCustomerTopProducts('CLI-1', { sort: '-units' });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/sales-analytics/customers/CLI-1/top-products',
      { params: { sort: '-units' } },
    );
  });

  it('getSupplierTopProducts pega GET /purchase-analytics/suppliers/{id}/top-products', async () => {
    await relationalAnalyticsService.getSupplierTopProducts('SUP-1', { sort: '-units' });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/purchase-analytics/suppliers/SUP-1/top-products',
      { params: { sort: '-units' } },
    );
  });

  it('getProductSuppliers pega GET /purchase-analytics/products/{id}/suppliers', async () => {
    await relationalAnalyticsService.getProductSuppliers('PRD-1', { sort: '+last_unit_price' });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/purchase-analytics/products/PRD-1/suppliers',
      { params: { sort: '+last_unit_price' } },
    );
  });

  it('encodea ids con caracteres reservados', async () => {
    await relationalAnalyticsService.getProductBuyers('PRD/1 a', {});
    expect(apiClient.get).toHaveBeenCalledWith(
      '/sales-analytics/products/PRD%2F1%20a/buyers',
      { params: {} },
    );
  });

  it('droppea params undefined/null/empty y conserva variant_id', async () => {
    await relationalAnalyticsService.getProductBuyers('PRD-1', {
      q: '',
      sort: undefined,
      page: 2,
      date_from: '2026-09-01',
      date_to: '',
      variant_id: 'VAR-1',
      min_units: 0,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/sales-analytics/products/PRD-1/buyers', {
      params: {
        page: '2',
        date_from: '2026-09-01',
        variant_id: 'VAR-1',
        min_units: '0',
      },
    });
  });

  it('re-lanza el error del HTTP y lo registra en telemetría', async () => {
    const record = vi.spyOn(telemetry, 'record');
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network down'));
    await expect(
      relationalAnalyticsService.getProductSuppliers('PRD-1', {}),
    ).rejects.toThrow('network down');
    expect(record).toHaveBeenCalledWith('bi.relational.error', {
      operation: 'getProductSuppliers',
      error: 'network down',
    });
    record.mockRestore();
  });
});
