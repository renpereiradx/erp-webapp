/**
 * Contratos TypeScript de la API SIFEN (backend business_management).
 * Espejo de internal/sifen/handler_*.go — snake_case del wire, nunca
 * incluyen XMLs ni secretos (regla 4 del plan SIFEN).
 */

import type { FiscalDocType, FiscalState } from '@/domain/fiscal/states';

/**
 * GET /sale/{id}/fiscal (S3.5) — estado fiscal de una venta.
 * 404 cuando la venta no tiene documento fiscal (branch no activado).
 */
export interface SaleFiscalStatus {
  sale_id: string;
  cdc: string;
  doc_type: number;
  estado: FiscalState;
  timbrado_num: string;
  establecimiento: string;
  punto_expedicion: string;
  serie: string;
  numero_doc: number;
  codigo_respuesta?: string;
  mensaje?: string;
  protocolo?: string;
  fecha_firma?: string | null;
  fecha_proceso?: string | null;
  intentos: number;
  last_error?: string;
  /**
   * URL del KuDE (dCarQR J002) extraída del DE firmado por el backend.
   * El FE la codifica en QR con qrcode.react pero NUNCA calcula el hash
   * (regla 4: el CSC no viaja). Ausente si el DE aún no está firmado.
   */
  qr_url?: string;
}

/**
 * GET /sifen/config/{ambiente} (S2.5) — vista pública enmascarada.
 * Los secretos (CSC, contraseña del p12) nunca salen: solo flags csc_set /
 * has_cert. `actividades` llega en snake_case (DTO del backend, S2-H2).
 */
export interface SifenActividadEconomica {
  codigo: string;
  descripcion: string;
}

export interface SifenConfigPublic {
  ambiente: string;
  urls: Record<string, string>;
  id_csc: string;
  csc_set: boolean;
  has_cert: boolean;
  i_tip_con: number;
  actividades: SifenActividadEconomica[];
  is_active: boolean;
}

/**
 * PUT /sifen/branch/{branchID}/fiscal-enabled (S3.6) — activación fiscal
 * por branch (D3: arranque gradual).
 */
export interface FiscalEnabledRequest {
  document_type: FiscalDocType;
  enabled: boolean;
}

/**
 * POST /sifen/inutilize (S4.2, MT §11.1.1) — inutilización de rango.
 * Solo números sin DE aprobado; rango secuencial ≤ 1000; motivo 5-500 chars.
 */
export interface InutilizeRequest {
  branch_id: number;
  document_type: FiscalDocType;
  timbrado_num: string;
  establecimiento: string;
  punto_expedicion: string;
  serie: string;
  desde: number;
  hasta: number;
  motivo: string;
}

/** Vista pública de un evento de inutilización (sin XMLs de respuesta). */
export interface InutilizacionPublic {
  id: number;
  branch_id: number;
  doc_type: number;
  timbrado_num: string;
  establecimiento: string;
  punto_expedicion: string;
  serie: string;
  desde: number;
  hasta: number;
  motivo: string;
  estado: string; // PENDIENTE | REGISTRADA | RECHAZADA
  codigo_respuesta?: string;
  mensaje?: string;
  intentos: number;
  last_error?: string;
  created_at: string;
}

/** GET /sifen/inutilize → lista paginada (limit ≤ 200, default 50). */
export interface InutilizacionesListResponse {
  inutilizaciones: InutilizacionPublic[];
}

/** GET /sifen/inutilize/skipped — saltos de numeración sin evento. */
export interface SkippedNumbersResponse {
  timbrado_num: string;
  document_type: string;
  skipped: number[];
  count: number;
}

/**
 * POST /sale/{id}/credit-note | /sale/{id}/debit-note (S4.3).
 * Motivo = iMotEmi E401 (1-8, tabla E5 del MT): 1 devolución/ajuste,
 * 2 devolución, 3 descuento, 4 bonificación, 5 crédito incobrable,
 * 6 recupero de costo, 7 recupero de gasto, 8 ajuste de precio.
 */
export interface NoteEmitRequest {
  motivo: number;
  /** Opcional: nil = todo el disponible del DE original (regla de monto). */
  monto?: string;
}

/** Vista pública de la nota emitida (sin XMLs ni secretos). */
export interface NotaEmitida {
  cdc: string;
  doc_type: number;
  estado: string;
  timbrado_num: string;
  establecimiento: string;
  punto_expedicion: string;
  serie: string;
  numero_doc: number;
  cdc_ref: string;
  monto_total?: string;
  codigo_respuesta?: string;
  mensaje?: string;
}

/**
 * GET /sifen/metrics/overview (S7.2, FE5.2) — dashboard de ops fiscal.
 * El FE nunca calcula nada: el backend clasifica pendientes/extemporáneos
 * contra la ventana de 72 h (MT §6.2) con su propio reloj.
 */

/** Grupo de rechazos por d_cod_res en el período consultado. */
export interface RechazoPorCodigo {
  codigo: string;
  mensaje: string;
  cantidad: number;
  ultima_ocurrencia: string;
}

/** Timbrado activo próximo a vencer (≤ 30 días) o vencido. */
export interface TimbradoVencimiento {
  branch_id: number;
  branch_name: string;
  document_type: string;
  timbrado: string;
  valid_to: string;
  /** Negativo = vencido. */
  dias_restantes: number;
}

export interface FiscalMetricsOverview {
  generado_en: string;
  ventana_horas: number;
  pendientes_envio: number;
  extemporaneos: number;
  rechazos_por_codigo: RechazoPorCodigo[];
  timbrados_por_vencer: TimbradoVencimiento[];
  timbrados_vencidos: number;
}
