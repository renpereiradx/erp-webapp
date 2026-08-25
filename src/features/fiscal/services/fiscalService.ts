/**
 * Servicio HTTP del feature fiscal (SIFEN) — FE3.
 * Consume los endpoints del backend business_management:
 *   GET  /sale/{id}/fiscal            (S3.5) estado fiscal de la venta
 *   POST /sale/{id}/fiscal/retry      (FE3.3) reenvío manual del DE (D2)
 *   GET  /api/v1/documents/sales/{id}/comprobante.pdf   (S5.1) KuDE PDF (blob con auth)
 *   POST /api/v1/documents/sales/{id}/comprobante/email (S5.3) email del comprobante
 *   POST /api/v1/documents/sales/{id}/ticket/render     (S5.2) ticket 80 mm + reprint_count
 *
 * Ojo: el contexto documents del backend registra sus rutas bajo el prefijo
 * /api/v1 (único contexto que lo hace — el resto vive en la raíz), por lo que
 * estos tres paths lo incluyen (S6-H1: sin el prefijo el panel golpeaba
 * 404 en las tres acciones de comprobante).
 *
 * Secretos (CSC, p12) jamás pasan por aquí (regla 4 del plan).
 */
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/types';
import type {
  SaleFiscalStatus,
  InutilizeRequest,
  InutilizacionPublic,
  SkippedNumbersResponse,
  NoteEmitRequest,
  NotaEmitida,
  FiscalMetricsOverview,
  FiscalOpsAlerts,
} from '@/features/fiscal/types';

const FISCAL = {
  saleFiscal: (saleId: string) => `/sale/${encodeURIComponent(saleId)}/fiscal`,
  saleFiscalRetry: (saleId: string) => `/sale/${encodeURIComponent(saleId)}/fiscal/retry`,
  comprobantePdf: (saleId: string) => `/api/v1/documents/sales/${encodeURIComponent(saleId)}/comprobante.pdf`,
  comprobanteEmail: (saleId: string) => `/api/v1/documents/sales/${encodeURIComponent(saleId)}/comprobante/email`,
  ticketRender: (saleId: string) => `/api/v1/documents/sales/${encodeURIComponent(saleId)}/ticket/render`,
};

export interface TicketRenderResult {
  success: boolean;
  printer?: string;
  reprint_count: number;
  message?: string;
}

export const fiscalService = {
  /**
   * Estado fiscal de una venta. Lanza 404 (apperr NotFound) cuando la venta
   * no tiene documento fiscal (branch no activado, D3) — el panel lo trata
   * como estado "no fiscal", no como error.
   */
  async getSaleFiscal(saleId: string): Promise<SaleFiscalStatus> {
    return apiClient.get(FISCAL.saleFiscal(saleId));
  },

  /**
   * Reenvío manual del DE (FE3.3 / D2): solo EMITIDO/RECHAZADO dentro de la
   * ventana de 72 h. Devuelve el estado fiscal actualizado.
   */
  async retryEmission(saleId: string): Promise<SaleFiscalStatus> {
    return apiClient.post(FISCAL.saleFiscalRetry(saleId));
  },

  /**
   * Descarga el KuDE PDF (S5.1) como blob vía apiClient — el endpoint exige
   * JWT (middleware global) y `window.open` no puede enviar el header de
   * Authorization (S6-H1). El filename viene del Content-Disposition del
   * backend (número fiscal, S5-H7) con fallback al saleId.
   */
  async downloadComprobantePdf(saleId: string): Promise<{ blob: Blob; filename: string }> {
    const { blob, filename } = await apiClient.getBlob(FISCAL.comprobantePdf(saleId));
    return { blob, filename: filename || `kude_${saleId}.pdf` };
  },

  /** Envía el comprobante por email (S5.3, flujo documents.email_log). */
  async emailComprobante(saleId: string): Promise<{ success: boolean }> {
    return apiClient.post(FISCAL.comprobanteEmail(saleId));
  },

  /**
   * Renderiza/imprime el ticket 80 mm (S5.2). La respuesta incluye
   * `reprint_count` (contador de reimpresiones con auditoría).
   */
  async renderTicket(saleId: string): Promise<TicketRenderResult> {
    return apiClient.post(FISCAL.ticketRender(saleId));
  },

  // ============ FE4 — inutilización de rangos (S4.2) ============

  /**
   * Números saltados sin evento de inutilización (S4.2). Requiere
   * branch_id + document_type + timbrado_num (400 si faltan).
   */
  async getSkippedNumbers(params: {
    branch_id: number;
    document_type: string;
    timbrado_num: string;
  }): Promise<SkippedNumbersResponse> {
    return apiClient.get(API_ENDPOINTS.SIFEN_INUTILIZE_SKIPPED, { params });
  },

  /** Historial de inutilizaciones (paginado, limit ≤ 200). */
  async listInutilizaciones(params: {
    branch_id?: number;
    doc_type?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ inutilizaciones: InutilizacionPublic[] }> {
    return apiClient.get(API_ENDPOINTS.SIFEN_INUTILIZE, { params });
  },

  /** Inutiliza un rango de numeración (≤ 1000, motivo obligatorio). */
  async inutilizeRange(req: InutilizeRequest): Promise<{ ok: boolean; inutilizacion: InutilizacionPublic }> {
    return apiClient.post(API_ENDPOINTS.SIFEN_INUTILIZE, req);
  },

  /** POST /sifen/inutilize/retry — reintenta eventos PENDIENTES (S4.2). */
  async retryInutilizaciones(): Promise<{ ok: boolean }> {
    return apiClient.post(`${API_ENDPOINTS.SIFEN_INUTILIZE}/retry`);
  },

  // ============ FE4 — notas de crédito/débito (S4.3) ============

  /** Emite una NCE (credit-note) o NDE (debit-note) sobre el DE original. */
  async emitNote(
    saleId: string,
    noteType: 'NCE' | 'NDE',
    req: NoteEmitRequest,
  ): Promise<NotaEmitida> {
    const endpoint = noteType === 'NCE' ? API_ENDPOINTS.SALE_CREDIT_NOTE(saleId) : API_ENDPOINTS.SALE_DEBIT_NOTE(saleId);
    return apiClient.post(endpoint, req);
  },

  // ============ FE5.2 — dashboard de ops fiscal (S7.2) ============

  /**
   * Métricas de operación fiscal: rechazos por código, pendientes de envío
   * (ventana 72 h), extemporáneos y caducidad de timbrados.
   * GET /sifen/metrics/overview?dias=N (1–365, default 30).
   */
  async getMetricsOverview(dias = 30): Promise<FiscalMetricsOverview> {
    return apiClient.get('/sifen/metrics/overview', { params: { dias } });
  },

  /**
   * Capa de alertas accionables (S7.2, remedación S7-H9-b: el entregable
   * central de S7.2 existía solo backend-side — nadie veía las alertas salvo
   * por curl). La lista viene ordenada por severidad; el FE la re-ordena en
   * domain/fiscal/alerts por defensa.
   * GET /sifen/metrics/alerts?dias=N (1–365, default 30).
   */
  async getMetricsAlerts(dias = 30): Promise<FiscalOpsAlerts> {
    return apiClient.get('/sifen/metrics/alerts', { params: { dias } });
  },
};

export default fiscalService;
