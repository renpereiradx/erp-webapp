/**
 * Dominio fiscal (SIFEN): formateo y validación del CDC.
 * Lógica pura, sin React ni side effects (reglas FSD del AGENTS.md).
 *
 * CDC = 44 dígitos (MT v150 §10.1). El KuDE lo muestra en 11 grupos de 4
 * (MT cap. 13). El backend valida la composición y el DV; el FE solo
 * formatea y valida longitud.
 */

/** Longitud exacta del CDC SIFEN. */
export const CDC_LENGTH = 44;

/** Tamaño de grupo de display del KuDE (11 grupos × 4 = 44). */
export const CDC_GROUP_SIZE = 4;

/**
 * Extrae solo dígitos del input (el CDC puede llegar con espacios, guiones
 * o ya agrupado).
 */
export const normalizeCDC = (input: string): string =>
  (input ?? '').replace(/\D/g, '');

/**
 * Valida la longitud del CDC: exactamente 44 dígitos (MT v150 §10.1).
 */
export const isValidCDC = (input: string): boolean =>
  normalizeCDC(input).length === CDC_LENGTH;

/**
 * Formatea el CDC en grupos de 4 dígitos separados por espacio (estilo KuDE).
 * Devuelve '' si el input no es un CDC de 44 dígitos.
 */
export const formatCDC = (input: string): string => {
  const digits = normalizeCDC(input);
  if (digits.length !== CDC_LENGTH) return '';

  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += CDC_GROUP_SIZE) {
    groups.push(digits.slice(i, i + CDC_GROUP_SIZE));
  }
  return groups.join(' ');
};
