/**
 * Dominio fiscal (SIFEN): vigencia de timbrados (FE2).
 * Lógica pura, sin React (reglas FSD del AGENTS.md).
 *
 * El timbrado de `branch_fiscal_config` tiene valid_from/valid_to; la UI
 * (BranchModal tab fiscal) muestra una alerta cuando quedan < 30 días.
 */

export type TimbradoValidity =
  | 'indefinite' // sin valid_to — vigencia no definida
  | 'ok' // más de 30 días
  | 'warning' // <= 30 días restantes
  | 'expired'; // vencido

/** Umbral de alerta del plan FE2: < 30 días. */
export const TIMBRADO_WARNING_DAYS = 30;

/**
 * Parsea fechas del backend ("YYYY-MM-DD…") en LOCAL, evitando el
 * desplazamiento UTC de `new Date('YYYY-MM-DD')` (que en zonas -03:00
 * cae al día anterior).
 */
const parseLocalDate = (value: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Días (enteros, hacia arriba) entre `now` y `validTo` (solo fecha).
 * null si no hay fecha de vencimiento (indefinido).
 * Negativo => vencido; 0 => vence hoy (aún vigente hasta fin de día).
 */
export const daysUntilValidTo = (validTo?: string | null, now: Date = new Date()): number | null => {
  if (!validTo) return null;
  const to = parseLocalDate(validTo);
  if (!to) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
};

/**
 * Severidad de vigencia para el badge/colores del tab fiscal.
 * - sin fecha      → 'indefinite'
 * - vencido (< 0)  → 'expired'
 * - <= 30 días     → 'warning' (0 = vence hoy, aún vigente)
 * - resto          → 'ok'
 */
export const timbradoValiditySeverity = (validTo?: string | null, now: Date = new Date()): TimbradoValidity => {
  const days = daysUntilValidTo(validTo, now);
  if (days === null) return 'indefinite';
  if (days < 0) return 'expired';
  if (days <= TIMBRADO_WARNING_DAYS) return 'warning';
  return 'ok';
};

/** Label i18n por severidad (fiscal.validity.<SEVERITY>). */
export const TIMBRADO_VALIDITY_I18N: Record<TimbradoValidity, string> = {
  indefinite: 'fiscal.validity.indefinite',
  ok: 'fiscal.validity.ok',
  warning: 'fiscal.validity.warning',
  expired: 'fiscal.validity.expired',
};

/** Variante de Badge por severidad. */
export const TIMBRADO_VALIDITY_BADGE: Record<TimbradoValidity, 'secondary' | 'success' | 'warning' | 'destructive'> = {
  indefinite: 'secondary',
  ok: 'success',
  warning: 'warning',
  expired: 'destructive',
};

/** Serie del DE: 2 letras mayúsculas (C010 dSerieNum). Normaliza y valida. */
export const normalizeSerie = (value: string): string => value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);

export const isValidSerie = (value: string): boolean => /^[A-Z]{2}$/.test(value);

/** Número de documento con 7 dígitos (C007 dNumDoc, MT v150). */
export const formatInvoiceNumber = (n: number): string => String(n).padStart(7, '0');
