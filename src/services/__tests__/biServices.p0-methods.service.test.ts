// src/services/__tests__/biServices.p0-methods.service.test.ts
// FASE 3A (plan auditoría BI 2026-09): 12 métodos que los hooks BI llamaban
// y no existían en los services (6 payables + 4 receivables + 2 finreports)
// con los endpoints BE ya respondiendo 200 tras FASE 1. Fija el contrato
// FE→BE: rutas, mapeo de params de paginación/sort (T3/T9) y drops de
// sentinela ('all') que el enum del BE no acepta.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { payablesService } from '../bi/payablesService';
import { receivablesService } from '../bi/receivablesService';
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

describe('receivablesService — métodos P0', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(envelope({ items: [], pagination: {} }));
  });

  it('getMasterList mapea filtros+paginación+sort con defaults T3', async () => {
    await receivablesService.getMasterList(
      { status: 'all', client_id: 'c1' },
      { page: 1, pageSize: 5 },
      { sortBy: 'date', sortOrder: 'desc' },
    );
    expect(apiClient.get).toHaveBeenCalledWith('/receivables', {
      params: {
        // sentinela 'all' eliminado: el enum del BE no lo acepta
        client_id: 'c1',
        page: 1,
        page_size: 5,
        sort_by: 'date',
        sort_order: 'desc',
      },
    });
  });

  it('getTransactionDetail pega GET /receivables/{id}', async () => {
    await receivablesService.getTransactionDetail('SALE-9');
    expect(apiClient.get).toHaveBeenCalledWith('/receivables/SALE-9');
  });

  it('getTransactionHistory construye la URL de auditoría por entidad', async () => {
    await receivablesService.getTransactionHistory('SALE-9', 'SALE');
    expect(apiClient.get).toHaveBeenCalledWith('/audit/entity/SALE/SALE-9/history');

    await receivablesService.getTransactionHistory('R-1');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/audit/entity/RECEIVABLE/R-1/history');
  });

  it('getOverdueAccounts es alias de getOverdue (/receivables/overdue — ruta canónica T5)', async () => {
    await receivablesService.getOverdueAccounts({ page: 1, page_size: 20 });
    expect(apiClient.get).toHaveBeenCalledWith('/receivables/overdue', {
      params: { page: 1, page_size: 20 },
    });
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
