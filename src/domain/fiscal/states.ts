/**
 * Dominio fiscal (SIFEN): estados del ciclo de vida del DE y tipos de
 * documento (iTiDE). Lógica pura, sin React (reglas FSD del AGENTS.md).
 *
 * Los estados reflejan `fiscal.fiscal_documents.estado` del backend
 * (internal/sifen/domain.go); el mapeo estado → i18n key + variante de
 * Badge alimenta la UI (FE3).
 */

/** Estados del ciclo de vida del DE (espejo del backend). */
export const FISCAL_STATES = [
  'EMITIDO',
  'APROBADO',
  'APROBADO_OBS',
  'RECHAZADO',
  'CANCELADO',
  'INUTILIZADO',
  'CANCELACION_PENDIENTE',
] as const;

export type FiscalState = (typeof FISCAL_STATES)[number];

/** Variantes de Badge soportadas por src/components/ui/badge.tsx. */
export type FiscalBadgeVariant =
  | 'info'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'secondary';

export interface FiscalStateMeta {
  /** Clave i18n del label (fiscal.states.<ESTADO>). */
  i18nKey: string;
  /** Variante de Badge para el estado. */
  badgeVariant: FiscalBadgeVariant;
}

export const FISCAL_STATE_META: Record<FiscalState, FiscalStateMeta> = {
  EMITIDO: { i18nKey: 'fiscal.states.EMITIDO', badgeVariant: 'info' },
  APROBADO: { i18nKey: 'fiscal.states.APROBADO', badgeVariant: 'success' },
  APROBADO_OBS: {
    i18nKey: 'fiscal.states.APROBADO_OBS',
    badgeVariant: 'warning',
  },
  RECHAZADO: { i18nKey: 'fiscal.states.RECHAZADO', badgeVariant: 'destructive' },
  CANCELADO: { i18nKey: 'fiscal.states.CANCELADO', badgeVariant: 'secondary' },
  INUTILIZADO: { i18nKey: 'fiscal.states.INUTILIZADO', badgeVariant: 'secondary' },
  CANCELACION_PENDIENTE: {
    i18nKey: 'fiscal.states.CANCELACION_PENDIENTE',
    badgeVariant: 'warning',
  },
};

export const isFiscalState = (value: string): value is FiscalState =>
  (FISCAL_STATES as readonly string[]).includes(value);

/**
 * Meta de un estado, con fallback neutro para valores desconocidos
 * (estados nuevos del backend no deben romper la UI).
 */
export const fiscalStateMeta = (state: string): FiscalStateMeta => {
  if (isFiscalState(state)) return FISCAL_STATE_META[state];
  return { i18nKey: 'fiscal.states.UNKNOWN', badgeVariant: 'secondary' };
};

/** Tipos de documento SIFEN (iTiDE, MT v150 C002). */
export const FISCAL_DOC_TYPES = [
  { code: 1, docType: 'FACTURA', i18nKey: 'fiscal.docTypes.FACTURA' },
  { code: 5, docType: 'NCE', i18nKey: 'fiscal.docTypes.NCE' },
  { code: 6, docType: 'NDE', i18nKey: 'fiscal.docTypes.NDE' },
] as const;

export type FiscalDocType = (typeof FISCAL_DOC_TYPES)[number]['docType'];

export interface FiscalDocTypeInfo {
  /** Código SIFEN del tipo (iTiDE). */
  code: number;
  /** Identificador de documento usado por el backend (branch_fiscal_config). */
  docType: FiscalDocType;
  /** Clave i18n del label (fiscal.docTypes.<DOC_TYPE>). */
  i18nKey: string;
}

export const fiscalDocTypeFromCode = (code: number): FiscalDocTypeInfo | undefined =>
  FISCAL_DOC_TYPES.find(d => d.code === code);

export const fiscalDocTypeToCode = (docType: string): number | undefined =>
  FISCAL_DOC_TYPES.find(d => d.docType === docType)?.code;
