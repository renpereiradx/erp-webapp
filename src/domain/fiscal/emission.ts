/**
 * Dominio fiscal (SIFEN): ventana de envío/reenvío del DE (MT §6.2).
 * Lógica pura, sin React (reglas FSD del AGENTS.md).
 *
 * El DE puede transmitirse durante 72 h desde su emisión; pasado el plazo el
 * reenvío queda bloqueado (riesgo de observación AO) y el camino legal es
 * NCE o trámite administrativo. El backend ancla la ventana al created_at
 * del DE y la defiende con 409 (`EmissionService.RetryEmission`); este
 * módulo alimenta el preview del botón "Reenviar a SIFEN" (S6-H4) usando
 * `fecha_firma` — la firma ocurre en la emisión, es la referencia disponible
 * en el contrato del FE.
 */

import { parseFiscalDateTime } from './cancellation';

/** Horas de la ventana legal de envío (MT §6.2). */
export const RETRY_WINDOW_HOURS = 72;

/**
 * Rechazos estructurales definitivos (dCodRes 1050–1053, S3.4): el DE no se
 * reenvía con el mismo CDC — el camino es inutilizar el número (S4.2) y
 * emitir NCE o un nuevo DE. Espejo del `EsRechazoReenviable` del backend.
 */
const FINAL_REJECTION_CODES = new Set(['1050', '1051', '1052', '1053']);

export const isFinalRejection = (codigo?: string): boolean =>
  !!codigo && FINAL_REJECTION_CODES.has(codigo);

/** Estados desde los que el DE puede (re)enviarse (D2). */
export const isRetryableState = (estado: string): boolean =>
  estado === 'EMITIDO' || estado === 'RECHAZADO';

export interface RetryWindowInput {
  estado: string;
  fecha_firma?: string | null;
  codigo_respuesta?: string;
}

export interface RetryWindow {
  /** false si no hay fecha de referencia para calcular la ventana. */
  computable: boolean;
  /** true si las 72 h no vencieron. */
  withinWindow: boolean;
  /** Fin de la ventana (null si no computable). */
  deadline: Date | null;
  /** Horas restantes (negativo = vencida). */
  hoursLeft: number;
  /** Rechazo definitivo: el reenvío con este CDC no procede jamás. */
  finalRejection: boolean;
}

/**
 * Ventana de reenvío de un DE. Sin fecha de firma → no computable (la UI
 * muestra el botón sin preview y el backend defiende).
 */
export const retryWindow = (
  status: RetryWindowInput,
  now: Date = new Date(),
): RetryWindow => {
  const finalRejection = status.estado === 'RECHAZADO' && isFinalRejection(status.codigo_respuesta);
  const ref = parseFiscalDateTime(status.fecha_firma ?? '');
  if (!ref) {
    return {
      computable: false, withinWindow: true, deadline: null,
      hoursLeft: RETRY_WINDOW_HOURS, finalRejection,
    };
  }
  const deadline = new Date(ref.getTime() + RETRY_WINDOW_HOURS * 3_600_000);
  const hoursLeft = (deadline.getTime() - now.getTime()) / 3_600_000;
  return { computable: true, withinWindow: hoursLeft >= 0, deadline, hoursLeft, finalRejection };
};
