/**
 * Pure logic for the sales-by-day/hour heatmap (`/dashboard/sales-heatmap`).
 *
 * Fuente: `GET /dashboard/sales-heatmap` → `SalesHeatmapResponse`.
 * El endpoint entrega celdas `{day, hour, sales_count, sales_total}` con
 * `day` 0=domingo…6=sábado y `hour` 0-23. La grilla de la UI arranca el lunes,
 * por eso `uiIndexToApiDay` traduce fila UI → día del API.
 *
 * No React, no i18n, no fetch: la página solo renderiza lo que estas funciones
 * calculan. La intensidad se expone como nivel 0-3 (sin símbolos `$`: el
 * sistema opera en guaraníes y la auditoría 2026-09 marcó ese literal como
 * defecto de presentación).
 */

/** Claves i18n de las filas, lunes primero (`dashboard.heatmap.days.*`). */
export const HEATMAP_UI_DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

/** Horas 0-23 que se renderizan como columnas (ventana completa del API). */
export const HEATMAP_HOURS = Array.from({ length: 24 }, (_, hour) => hour) as readonly number[]

/** Una celda del endpoint (mismos campos que `SalesHeatmapEntry`). */
export interface HeatmapCell {
  day: number
  hour: number
  sales_count: number
  sales_total: number
}

/** Fila UI (0 = lunes) → día del API (0 = domingo). */
export const uiIndexToApiDay = (uiDayIndex: number): number => (uiDayIndex + 1) % 7

/** Día del API (0 = domingo) → fila UI (0 = lunes). */
export const apiDayToUiIndex = (apiDay: number): number => (apiDay + 6) % 7

/** Máximo de ventas de la grilla, con piso 1 para evitar división por cero. */
export const computeMaxSales = (cells: HeatmapCell[]): number =>
  Math.max(...cells.map((cell) => cell.sales_count), 1)

export type IntensityLevel = 0 | 1 | 2 | 3

/** Intensidad relativa al pico: 0 = sin datos, 3 = >80% del pico. */
export const getIntensityLevel = (ratio: number): IntensityLevel => {
  if (ratio > 0.8) return 3
  if (ratio > 0.5) return 2
  if (ratio > 0) return 1
  return 0
}

export interface CellIntensity {
  ratio: number
  sales: number
  total: number
  level: IntensityLevel
  hasData: boolean
}

const EMPTY_CELL: CellIntensity = {
  ratio: 0,
  sales: 0,
  total: 0,
  level: 0,
  hasData: false,
}

/** Celda de la grilla para una fila UI + hora; vacía si el API no trae datos. */
export const getCellIntensity = (
  cells: HeatmapCell[],
  maxSales: number,
  uiDayIndex: number,
  hour: number,
): CellIntensity => {
  const apiDay = uiIndexToApiDay(uiDayIndex)
  const cell = cells.find((entry) => entry.day === apiDay && entry.hour === hour)
  if (!cell) return EMPTY_CELL

  const ratio = cell.sales_count / maxSales
  return {
    ratio,
    sales: cell.sales_count,
    total: cell.sales_total,
    level: getIntensityLevel(ratio),
    hasData: true,
  }
}

export interface HeatmapSummary {
  /** Suma de `sales_total` de todas las celdas (ventana completa). */
  totalSales: number
  /** Suma de `sales_count` de todas las celdas. */
  totalTransactions: number
  /** Celdas día×hora con al menos una venta. */
  activeCells: number
}

/**
 * Totales de la ventana: cada venta cae exactamente en una celda día×hora,
 * así que sumar las celdas no duplica operaciones.
 */
export const summarizeHeatmap = (cells: HeatmapCell[]): HeatmapSummary =>
  cells.reduce<HeatmapSummary>(
    (acc, cell) => ({
      totalSales: acc.totalSales + cell.sales_total,
      totalTransactions: acc.totalTransactions + cell.sales_count,
      activeCells: acc.activeCells + (cell.sales_count > 0 ? 1 : 0),
    }),
    { totalSales: 0, totalTransactions: 0, activeCells: 0 },
  )

const DAY_NAME_KEYS: Record<string, string> = {
  domingo: 'sunday',
  lunes: 'monday',
  martes: 'tuesday',
  miercoles: 'wednesday',
  jueves: 'thursday',
  viernes: 'friday',
  sabado: 'saturday',
}

/**
 * `PeakTime.day` llega del backend en español ("Miércoles"). Se normaliza a
 * una clave i18n para que la UI pueda traducirlo; `null` si no se reconoce.
 */
export const dayNameToKey = (day: string | null | undefined): string | null => {
  if (!day) return null
  const normalized = day
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return DAY_NAME_KEYS[normalized] ?? null
}

/** Hora 0-23 → etiqueta de 24 h ("09:00"). */
export const formatHour = (hour: number): string => `${String(hour).padStart(2, '0')}:00`
