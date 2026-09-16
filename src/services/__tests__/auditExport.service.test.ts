// src/services/__tests__/auditExport.service.test.ts
// Cierre ⑤ del plan auditoría BI (2026-09): POST /api/v1/audit/export tenía
// endpoint BE completo pero sin UI. Fija el contrato del body: keys del filtro
// (search_term, success booleano, fechas RFC3339 con end EXCLUSIVO — el BE
// compara timestamp >= start AND < end), format y cap de max_records.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../bi/auditService';
import { apiClient } from '../api';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn(), getBlob: vi.fn() },
}));

const blobResult = { blob: new Blob(['id\n']), filename: 'audit_logs.csv' };

describe('auditService.exportLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.getBlob).mockResolvedValue(blobResult);
  });

  it('arma el body con search_term, success booleano y end_date exclusivo (+1d)', async () => {
    await auditService.exportLogs(
      {
        search: ' BodyTech ',
        level: 'ERROR',
        success: 'false',
        start_date: '2026-09-01',
        end_date: '2026-09-15',
      },
      { format: 'csv' },
    );

    expect(apiClient.getBlob).toHaveBeenCalledTimes(1);
    const [endpoint, options] = vi.mocked(apiClient.getBlob).mock.calls[0];
    expect(endpoint).toBe('/api/v1/audit/export');
    expect(options?.method).toBe('POST');

    const body = JSON.parse(options?.body as string);
    expect(body.format).toBe('csv');
    expect(body.max_records).toBe(10000);
    expect(body.filter.search_term).toBe('BodyTech');
    expect(body.filter.success).toBe(false);
    expect(body.filter.level).toBe('ERROR');
    expect(body.filter.start_date).toBe(new Date('2026-09-01T00:00:00').toISOString());
    // El BE usa timestamp < end: 2026-09-15 excluye el día → se manda el 16.
    expect(body.filter.end_date).toBe(new Date('2026-09-16T00:00:00').toISOString());
  });

  it('sin filtros manda filter vacío y respeta format json + max_records', async () => {
    await auditService.exportLogs({}, { format: 'json', max_records: 50 });

    const body = JSON.parse(vi.mocked(apiClient.getBlob).mock.calls[0][1]?.body as string);
    expect(body.filter).toEqual({});
    expect(body.format).toBe('json');
    expect(body.max_records).toBe(50);
  });

  it('devuelve blob + filename del Content-Disposition', async () => {
    const result = await auditService.exportLogs({ category: 'LEGACY' });
    expect(result).toEqual(blobResult);
  });
});
