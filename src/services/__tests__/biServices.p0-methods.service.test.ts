// src/services/__tests__/biServices.p0-methods.service.test.ts
// FASE 3A (plan auditoría BI 2026-09): métodos que los hooks BI llamaban y no
// existían en los services (6 payables + 2 finreports) con los endpoints BE
// ya respondiendo 200 tras FASE 1. Fija el contrato FE→BE: rutas, mapeo de
// params de paginación/sort (T3/T9) y drops de sentinela ('all') que el enum
// del BE no acepta.
//
// Los 4 métodos de CxC que vivían acá se retiraron en F7: el service de
// Cuentas por Cobrar se reescribió tipado y su contrato vive en
// `receivables.service.test.ts`.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { payablesService } from '../bi/payablesService';
import { financialReportsService } from '../bi/financialReportsService';
import { apiClient } from '../api';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}));

const envelope = (data: unknown) => ({ success: true, data });

describe('payablesService — métodos P0', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}));
  });

  it('getPayables mapea page/page_size en ambas formas y droppea status sentinela', async () => {
    await payablesService.getPayables(
      { status: 'all', search: 'acme', start_date: '2026-09-01' },
      { page: 2, pageSize: 20 },
    );
    expect(apiClient.get).toHaveBeenCalledWith('/payables', {
      params: { search: 'acme', start_date: '2026-09-01', page: 2, page_size: 20 },
    });

    await payablesService.getPayables(
      { status: 'PENDING' },
      { page: 3, page_size: 50 },
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/payables', {
      params: { status: 'PENDING', page: 3, page_size: 50 },
    });
  });

  it('getPayableById pega GET /payables/{id}', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope({ id: 'PO-1', status: 'PENDING' }));
    await payablesService.getPayableById('PO-1');
    expect(apiClient.get).toHaveBeenCalledWith('/payables/PO-1');
  });

  it('getTopSuppliers y getSchedule viajan como query params numéricos', async () => {
    await payablesService.getTopSuppliers(5);
    expect(apiClient.get).toHaveBeenCalledWith('/payables/top-suppliers', { params: { limit: 5 } });

    await payablesService.getSchedule(60);
    expect(apiClient.get).toHaveBeenCalledWith('/payables/schedule', { params: { days: 60 } });
  });

  it('getAgingSummary usa /payables/aging/summary y getStatistics el período', async () => {
    await payablesService.getAgingSummary();
    expect(apiClient.get).toHaveBeenCalledWith('/payables/aging/summary', { params: {} });

    await payablesService.getStatistics('week');
    expect(apiClient.get).toHaveBeenCalledWith('/payables/statistics', { params: { period: 'week' } });
  });

  it('getCashFlowProjection usa /payables/cash-flow (contrato proyección, no el estado contable)', async () => {
    await payablesService.getCashFlowProjection(90);
    expect(apiClient.get).toHaveBeenCalledWith('/payables/cash-flow', { params: { days: 90 } });
  });

  it('getSupplierPayables usa /payables/supplier/{id} (detalle con facturas)', async () => {
    await payablesService.getSupplierPayables('SUP-1');
    expect(apiClient.get).toHaveBeenCalledWith('/payables/supplier/SUP-1');
  });
});

describe('financialReportsService — métodos P0', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}));
  });

  it('getVat llama /financial-reports/vat con el período', async () => {
    await financialReportsService.getVat('month');
    expect(apiClient.get).toHaveBeenCalledWith('/financial-reports/vat', {
      params: { period: 'month' },
    });
  });

  it('getTaxSummary llama /financial-reports/tax-summary con el período', async () => {
    await financialReportsService.getTaxSummary('year');
    expect(apiClient.get).toHaveBeenCalledWith('/financial-reports/tax-summary', {
      params: { period: 'year' },
    });
  });
});
