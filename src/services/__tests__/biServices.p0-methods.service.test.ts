// src/services/__tests__/biServices.p0-methods.service.test.ts
// FASE 3A (plan auditoría BI 2026-09): métodos que los hooks BI llamaban y no
// existían en los services (6 payables + 2 finreports) con los endpoints BE
// ya respondiendo 200 tras FASE 1. Fija el contrato FE→BE: rutas, mapeo de
// params de paginación/sort (T3/T9) y drops de sentinela ('all') que el enum
// del BE no acepta.
//
// Los 4 métodos de CxC que vivían acá se retiraron en F7: el service de
// Cuentas por Cobrar se reescribió tipado y su contrato vive en
// `receivables.service.test.ts`. Los 6 de CxP se retiraron en F8 por la misma
// razón: `payables.service.test.ts` es ahora el contrato canónico.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { financialReportsService } from '../bi/financialReportsService';
import { apiClient } from '../api';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}));

const envelope = (data: unknown) => ({ success: true, data });

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
