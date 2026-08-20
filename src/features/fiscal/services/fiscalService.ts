/**
 * Servicio HTTP del feature fiscal (SIFEN) — FE3.
 * Consume los endpoints del backend business_management:
 *   GET  /sale/{id}/fiscal            (S3.5) estado fiscal de la venta
 *   POST /sale/{id}/fiscal/retry      (FE3.3) reenvío manual del DE (D2)
 *   GET  /documents/sales/{id}/comprobante.pdf   (S5.1) KuDE PDF
 *   POST /documents/sales/{id}/comprobante/email (S5.3) email del comprobante
 *   POST /documents/sales/{id}/ticket/render     (S5.2) ticket 80 mm + reprint_count
 *
 * Secretos (CSC, p12) jamás pasan por aquí (regla 4 del plan).
 */
import { apiClient } from '@/services/api';
import type { SaleFiscalStatus } from '@/features/fiscal/types';

const FISCAL = {
  saleFiscal: (saleId: string) => `/sale/${encodeURIComponent(saleId)}/fiscal`,
  saleFiscalRetry: (saleId: string) => `/sale/${encodeURIComponent(saleId)}/fiscal/retry`,
  comprobantePdf: (saleId: string) => `/documents/sales/${encodeURIComponent(saleId)}/comprobante.pdf`,
  comprobanteEmail: (saleId: string) => `/documents/sales/${encodeURIComponent(saleId)}/comprobante/email`,
  ticketRender: (saleId: string) => `/documents/sales/${encodeURIComponent(saleId)}/ticket/render`,
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

  /** URL del KuDE PDF (S5.1) — para abrir en pestaña nueva / descargar. */
  comprobanteUrl(saleId: string): string {
    return FISCAL.comprobantePdf(saleId);
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
};

export default fiscalService;
