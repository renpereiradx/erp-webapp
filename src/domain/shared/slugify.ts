/**
 * Slug/code generator puro para catálogo (marcas, atributos, etiquetas).
 * Sin dependencias de React ni side effects.
 */

/** Normaliza un nombre a slug kebab-case: "Global Tech!" -> "global-tech" */
export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Normaliza un nombre a código snake_case: "Talla Textil" -> "talla_textil" */
export const codify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
