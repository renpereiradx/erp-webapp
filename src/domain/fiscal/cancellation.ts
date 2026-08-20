/**
 * Dominio fiscal (SIFEN): cancelación de DE (S4.1 — MT §11.1.2).
 * Lógica pura, sin React (reglas FSD del AGENTS.md).
 *
 * El evento de cancelación tiene plazo legal: 48 h para FE, 168 h para
 * NCE/NDE, contados desde la aprobación de SIFEN (fec_proc). El backend
 * valida el plazo (CancellationService.ValidateForCancel); este módulo
 * alimenta la advertencia del modal de cancelación (FE4.1).
 */

/** Horas del plazo legal por iTiDE (MT §11.1.2): 1 FE → 48 h; 5/6 → 168 h. */
export const CANCELLATION_DEADLINE_HOURS: Record<number, number> = {
  1: 48, // FACTURA
  5: 168, // NCE
  6: 168, // NDE
};

/** Horas del plazo de cancelación; fallback conservador 168 h. */
export const cancellationDeadlineHours = (docType: number): number =>
  CANCELLATION_DEADLINE_HOURS[docType] ?? 168;

export interface CancellationWindowInput {
  doc_type: number;
  /** Aprobación de SIFEN (fec_proc) — la referencia legal del plazo. */
  fecha_proceso?: string | null;
  /** Fallback si no hay proceso aún: fecha de firma del DE. */
  fecha_firma?: string | null;
}

export interface CancellationWindow {
  /** false si no hay fecha de referencia para calcular el plazo. */
  computable: boolean;
  /** true si la fecha límite aún no venció. */
  withinDeadline: boolean;
  /** Fecha límite del evento de cancelación (null si no computable). */
  deadline: Date | null;
  /** Horas restantes hasta el límite (negativo = vencido). */
  hoursLeft: number;
  /** Horas legales según el tipo de DE. */
  deadlineHours: number;
}

/**
 * Parsea fechas del backend ("YYYY-MM-DDTHH:MM:SS", sin zona) en LOCAL,
 * evitando el desplazamiento UTC de `new Date(iso)` en zonas -03:00
 * (mismo criterio que validity.ts, pitfall 18 del skill sifen).
 */
export const parseFiscalDateTime = (value: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (m) {
    const d = new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] ?? 0),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Ventana legal de cancelación de un DE. La referencia es la aprobación
 * de SIFEN (fecha_proceso, fec_proc); fallback a la firma del DE.
 * Sin fecha de referencia → no computable (la UI no muestra advertencia).
 */
export const cancellationWindow = (
  status: CancellationWindowInput,
  now: Date = new Date(),
): CancellationWindow => {
  const deadlineHours = cancellationDeadlineHours(status.doc_type);
  const ref = parseFiscalDateTime(status.fecha_proceso ?? '') ?? parseFiscalDateTime(status.fecha_firma ?? '');
  if (!ref) {
    return { computable: false, withinDeadline: true, deadline: null, hoursLeft: deadlineHours, deadlineHours };
  }
  const deadline = new Date(ref.getTime() + deadlineHours * 3_600_000);
  const hoursLeft = (deadline.getTime() - now.getTime()) / 3_600_000;
  return { computable: true, withinDeadline: hoursLeft >= 0, deadline, hoursLeft, deadlineHours };
};
