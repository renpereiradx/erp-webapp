/**
 * Dominio fiscal (SIFEN): rangos de numeración para inutilización (S4.2 —
 * MT §11.1.1). Lógica pura, sin React (reglas FSD del AGENTS.md).
 *
 * El backend reporta números saltados (GET /sifen/inutilize/skipped); la
 * vista FE4.2 los agrupa en rangos consecutivos para inutilizarlos de a
 * bloques (rango secuencial ≤ 1000, justificativa obligatoria).
 */

export interface NumberRange {
  desde: number;
  hasta: number;
}

/** Cantidad de números del rango (inclusive). */
export const rangeCount = (r: NumberRange): number => r.hasta - r.desde + 1;

/** Límite de rango de inutilización del MT §11.1.1. */
export const INUTILIZE_RANGE_LIMIT = 1000;

/** true si el rango es válido y no excede el límite legal. */
export const isRangeWithinLimit = (r: NumberRange, limit: number = INUTILIZE_RANGE_LIMIT): boolean =>
  r.desde >= 1 && r.hasta >= r.desde && rangeCount(r) <= limit;

/**
 * Agrupa números (sin repetidos) en rangos consecutivos ascendentes.
 * [1,2,3,5,9,10] → [{desde:1,hasta:3},{desde:5,hasta:5},{desde:9,hasta:10}].
 * Vacío → []. Entrada desordenada se ordena; duplicados se ignoran.
 */
export const groupConsecutive = (nums: number[]): NumberRange[] => {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const ranges: NumberRange[] = [];
  for (const n of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && n === last.hasta + 1) {
      last.hasta = n;
    } else {
      ranges.push({ desde: n, hasta: n });
    }
  }
  return ranges;
};

/** Formato de rango para UI: "1-3", "5", "9-10". */
export const formatRange = (r: NumberRange): string =>
  r.desde === r.hasta ? String(r.desde) : `${r.desde}-${r.hasta}`;

/** Formato de rango con padding de 7 dígitos (C007): "0000001-0000003". */
export const formatRangePadded = (r: NumberRange): string =>
  r.desde === r.hasta
    ? String(r.desde).padStart(7, '0')
    : `${String(r.desde).padStart(7, '0')}-${String(r.hasta).padStart(7, '0')}`;
