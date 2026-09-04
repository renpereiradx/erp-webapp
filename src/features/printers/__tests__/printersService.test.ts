/**
 * Tests del service de impresoras: contrato de endpoints contra el contexto
 * documents del backend. apiClient se mockea en su módulo (frontera).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/services/api', () => ({ apiClient }));

import { printersService } from '@/features/printers/services/printersService';
import type { PrinterInput } from '@/features/printers/types';

const input: PrinterInput = {
  branch_id: null,
  name: 'Caja 1',
  purpose: 'RECEIPT',
  host: '192.168.1.50',
  port: 9100,
  width_mm: 80,
  code_page: 'CP858',
  kick_drawer: false,
  is_default: true,
  is_active: true,
};

describe('printersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list sin filtros golpea GET /api/v1/printers', async () => {
    apiClient.get.mockResolvedValue([]);
    await printersService.list();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/printers');
  });

  it('list con filtros arma el querystring (branch_id + active)', async () => {
    apiClient.get.mockResolvedValue([]);
    await printersService.list({ branch_id: 3, active: true });
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/printers?branch_id=3&active=true');
  });

  it('create hace POST del payload completo', async () => {
    apiClient.post.mockResolvedValue({ id: 1, ...input });
    await printersService.create(input);
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/printers', input);
  });

  it('update hace PUT parcial sobre /{id}', async () => {
    apiClient.put.mockResolvedValue({ id: 7, ...input, name: 'Caja 2' });
    await printersService.update(7, { name: 'Caja 2' });
    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/printers/7', { name: 'Caja 2' });
  });

  it('remove DELETEa /{id}', async () => {
    apiClient.delete.mockResolvedValue({ message: 'impresora eliminada' });
    await printersService.remove(7);
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/printers/7');
  });

  it('testPage POSTea /{id}/test', async () => {
    apiClient.post.mockResolvedValue({ message: 'página de prueba enviada' });
    await printersService.testPage(7);
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/printers/7/test');
  });
});
