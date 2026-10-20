/**
 * Clases compartidas por las tablas de Analítica de Inventario (DESIGN §6.3):
 * header label-caps sobre surface-muted, texto a la izquierda y datos
 * numéricos en mono a la derecha.
 */

export const TABLE_HEADER = 'px-md py-sm text-label-caps uppercase text-on-surface-deep'

export const TABLE_CELL = 'px-md py-sm align-top text-body-md text-foreground'

export const TABLE_NUM =
  'whitespace-nowrap px-md py-sm text-right align-top font-data-mono text-data-mono text-foreground'

/** Variante densa para tablas de muchas columnas (stock levels). */
export const TABLE_HEADER_DENSE = 'px-sm py-sm text-label-caps uppercase text-on-surface-deep'

export const TABLE_CELL_DENSE = 'px-sm py-sm align-top text-body-md text-foreground'

export const TABLE_NUM_DENSE =
  'whitespace-nowrap px-sm py-sm text-right align-top font-data-mono text-data-mono text-foreground'
