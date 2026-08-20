/**
 * Dominio fiscal (SIFEN): notas de crédito/débito (S4.3 — MT §11.1.3).
 * Lógica pura, sin React (reglas FSD del AGENTS.md).
 *
 * Una NCE/NDE referencia el DE original (FE aprobado) vía gCamDEAsoc; el
 * motivo de emisión es iMotEmi (E401, tabla E5 del MT). La regla de monto
 * la valida el backend (disponible = total del original − notas vivas);
 * aquí se validan los límites visibles de la UI.
 */

export type NoteType = 'NCE' | 'NDE';

export interface NoteEmissionMotivo {
  code: number;
  i18nKey: string;
}

/** Motivos de emisión E401 (iMotEmi, MT tabla E5): 1-8. */
export const NOTE_EMISSION_MOTIVES: NoteEmissionMotivo[] = [
  { code: 1, i18nKey: 'fiscal.notes.motivo.1' },
  { code: 2, i18nKey: 'fiscal.notes.motivo.2' },
  { code: 3, i18nKey: 'fiscal.notes.motivo.3' },
  { code: 4, i18nKey: 'fiscal.notes.motivo.4' },
  { code: 5, i18nKey: 'fiscal.notes.motivo.5' },
  { code: 6, i18nKey: 'fiscal.notes.motivo.6' },
  { code: 7, i18nKey: 'fiscal.notes.motivo.7' },
  { code: 8, i18nKey: 'fiscal.notes.motivo.8' },
];

export const isValidNoteMotivo = (code: number): boolean =>
  NOTE_EMISSION_MOTIVES.some(m => m.code === code);

/**
 * Valida el monto de la nota contra el disponible del DE original.
 * - vacío → válido (nil = todo el disponible, lo decide el backend)
 * - debe ser numérico > 0
 * - no puede exceder el tope visible (el backend valida el disponible real)
 * Devuelve mensaje de error o null.
 */
export const validateNoteMonto = (
  monto: string,
  disponible: number | undefined,
): string | null => {
  const trimmed = monto.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return 'fiscal.notes.error.invalidNumber';
  if (n <= 0) return 'fiscal.notes.error.zeroOrNegative';
  if (disponible !== undefined && n > disponible) return 'fiscal.notes.error.exceedsAvailable';
  return null;
};
