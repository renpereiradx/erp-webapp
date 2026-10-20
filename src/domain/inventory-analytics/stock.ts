/**
 * Estado, filtros y orden de los niveles de stock (F5).
 *
 * Los umbrales son los del SQL del BE (`StockLevels`): sin stock = 0, bajo
 * stock = 1-5, con stock = > 5, sobre-stock = > 15. OJO: los filtros
 * `IN_STOCK` y `OVERSTOCK` se superponen (un producto de 20 unidades aparece
 * con ambos). La UI lo dice en la descripción de la sección; no se "corrige"
 * inventando un estado que el endpoint no filtra.
 */
import type {
  InventorySortBy,
  InventorySortOrder,
  InventoryStatusFilter,
  InventoryStockStatus,
} from '@/types/bi'

export type StockStatusKey = 'inStock' | 'lowStock' | 'outOfStock' | 'overstock'
export type StatusTone = 'success' | 'warning' | 'error' | 'secondary'

export interface StockStatusRow {
  key: StockStatusKey
  count: number
  percentage: number
}

/** Orden de lectura fijo de las cuatro categorías del resumen. */
export const STOCK_STATUS_ROWS: ReadonlyArray<{
  key: StockStatusKey
  countField: keyof InventoryStockStatus
  pctField: keyof InventoryStockStatus
  tone: StatusTone
}> = [
  {
    key: 'inStock',
    countField: 'in_stock',
    pctField: 'in_stock_pct',
    tone: 'success',
  },
  {
    key: 'lowStock',
    countField: 'low_stock',
    pctField: 'low_stock_pct',
    tone: 'warning',
  },
  {
    key: 'outOfStock',
    countField: 'out_of_stock',
    pctField: 'out_of_stock_pct',
    tone: 'error',
  },
  {
    key: 'overstock',
    countField: 'overstock',
    pctField: 'overstock_pct',
    tone: 'secondary',
  },
]

const toNumber = (value: unknown): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Filas del panel "Estado del stock" a partir del payload del BE. */
export const buildStockStatusRows = (
  status: InventoryStockStatus | null | undefined,
): StockStatusRow[] => {
  if (!status) return []
  return STOCK_STATUS_ROWS.map((row) => ({
    key: row.key,
    count: toNumber(status[row.countField]),
    percentage: toNumber(status[row.pctField]),
  }))
}

/** Código del BE (`LOW_STOCK`) → clave de presentación (`lowStock`). */
export const stockStatusKeyForCode = (code: string | null | undefined): StockStatusKey | null => {
  switch (code) {
    case 'IN_STOCK':
      return 'inStock'
    case 'LOW_STOCK':
      return 'lowStock'
    case 'OUT_OF_STOCK':
      return 'outOfStock'
    case 'OVERSTOCK':
      return 'overstock'
    default:
      return null
  }
}

export const stockStatusToneForCode = (code: string | null | undefined): StatusTone => {
  const key = stockStatusKeyForCode(code)
  const row = STOCK_STATUS_ROWS.find((candidate) => candidate.key === key)
  return row?.tone ?? 'secondary'
}

/** Filtros que acepta el endpoint y que se ofrecen en la UI (en orden). */
export const STOCK_STATUS_FILTERS: readonly (InventoryStatusFilter | 'all')[] = [
  'all',
  'IN_STOCK',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'OVERSTOCK',
]

export const isStockStatusFilter = (value: unknown): value is InventoryStatusFilter =>
  typeof value === 'string' &&
  (['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK'] as const).includes(
    value as InventoryStatusFilter,
  )

/** Whitelist de `sort_by` espejo de `validSortFields` del repo. */
export const STOCK_SORT_FIELDS: readonly InventorySortBy[] = [
  'stock',
  'name',
  'value',
  'category',
  'days',
]

export const isStockSortField = (value: unknown): value is InventorySortBy =>
  typeof value === 'string' && (STOCK_SORT_FIELDS as readonly string[]).includes(value)

export interface StockSortState {
  by: InventorySortBy
  order: InventorySortOrder
}

export const DEFAULT_STOCK_SORT: StockSortState = { by: 'stock', order: 'DESC' }

/**
 * Click en una columna: misma columna alterna ASC/DESC; columna nueva arranca
 * DESC (el orden por defecto del BE y el más útil para valores/stock).
 */
export const nextStockSort = (
  current: StockSortState,
  field: InventorySortBy,
): StockSortState => {
  if (current.by === field) {
    return { by: field, order: current.order === 'DESC' ? 'ASC' : 'DESC' }
  }
  return { by: field, order: 'DESC' }
}

/** `aria-sort` del `<th>` para una columna ordenable. */
export const stockSortAria = (
  current: StockSortState,
  field: InventorySortBy,
): 'ascending' | 'descending' | 'none' => {
  if (current.by !== field) return 'none'
  return current.order === 'ASC' ? 'ascending' : 'descending'
}

/** Centinela del SQL: `days_of_stock` 999 = sin ventas en 30 días. */
export const DAYS_OF_STOCK_SENTINEL = 999

/** Días reales de stock; `null` cuando el BE devolvió el centinela. */
export const realDaysOfStock = (value: number | null | undefined): number | null => {
  const numeric = Number(value)
  // 0 es real (producto sin stock con demanda): solo el 999 es "sin ventas".
  if (!Number.isFinite(numeric) || numeric >= DAYS_OF_STOCK_SENTINEL) {
    return null
  }
  return numeric
}

export const hasNoRecentSales = (value: number | null | undefined): boolean =>
  Number(value) >= DAYS_OF_STOCK_SENTINEL
