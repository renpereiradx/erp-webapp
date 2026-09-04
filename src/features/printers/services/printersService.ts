/**
 * Servicio HTTP del feature de impresoras — consume los endpoints del
 * contexto documents del backend:
 *   GET    /api/v1/printers                (lista; ?branch_id=&active=true)
 *   POST   /api/v1/printers                (crear)
 *   GET    /api/v1/printers/{id}           (detalle)
 *   PUT    /api/v1/printers/{id}           (patch parcial)
 *   DELETE /api/v1/printers/{id}
 *   POST   /api/v1/printers/{id}/test      (página de prueba ESC/POS)
 *
 * El backend guarda por CHECKs (purpose, width_mm, code_page, puerto) y
 * responde errores tipados { error_code, message } — el mensaje ya llega
 * en español para mostrar directo en toast.
 */
import { apiClient } from '@/services/api';
import type { Printer, PrinterInput, PrinterListParams } from '@/features/printers/types';

const BASE = '/api/v1/printers';

const printerPath = (id: number) => `${BASE}/${encodeURIComponent(String(id))}`;

export const printersService = {
  async list(params: PrinterListParams = {}): Promise<Printer[]> {
    const query = new URLSearchParams();
    if (params.branch_id != null) query.set('branch_id', String(params.branch_id));
    if (params.active) query.set('active', 'true');
    const qs = query.toString();
    return apiClient.get(qs ? `${BASE}?${qs}` : BASE);
  },

  async get(id: number): Promise<Printer> {
    return apiClient.get(printerPath(id));
  },

  async create(input: PrinterInput): Promise<Printer> {
    return apiClient.post(BASE, input);
  },

  async update(id: number, patch: Partial<PrinterInput>): Promise<Printer> {
    return apiClient.put(printerPath(id), patch);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(printerPath(id));
  },

  /** Imprime una página de prueba (respuesta { message } en éxito). */
  async testPage(id: number): Promise<void> {
    await apiClient.post(`${printerPath(id)}/test`);
  },
};

export default printersService;
