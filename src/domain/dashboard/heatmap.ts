/**
 * Pure logic for the sales-by-hour heatmap (SalesHeatmap page).
 * Extracted from pages/SalesHeatmap.jsx (PLAN_ALINEACION_BI_FRONTEND F1).
 * No React, no i18n, no fetch — the component only renders what these compute.
 */

/** Row labels shown on the UI, Monday first. */
export const HEATMAP_UI_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const

/** Column labels 8AM..9PM, shared by the grid header and the API lookup. */
export const HEATMAP_HOURS = [
  '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM',
] as const

/** One data point of the sales-heatmap endpoint. */
export interface HeatmapCell {
  day: number
  hour: number
  sales_count: number
  total_amount?: number
}

/**
 * Maps a UI row index (0 = Monday … 6 = Sunday) to the API day number
 * (1 = Monday … 6 = Saturday, 0 = Sunday).
 */
export const uiIndexToApiDay = (uiDayIndex: number): number => (uiDayIndex + 1) % 7

/** Parses an '8AM'/'12PM'/'1PM' style label into a 24h number (12AM → 0). */
export const parseHourLabel = (hourLabel: string): number => {
  let hour = parseInt(hourLabel)
  if (hourLabel.includes('PM') && hour !== 12) hour += 12
  if (hourLabel.includes('AM') && hour === 12) hour = 0
  return hour
}

/** Peak intensity of the grid: max sales_count, floored at 1 to avoid ÷0. */
export const computeMaxSales = (cells: HeatmapCell[]): number =>
  Math.max(...cells.map((d) => d.sales_count), 1)

/** '$$$' above 80% of the peak, '$$' above 50%, else empty. */
export const getIntensityLabel = (ratio: number): string => {
  if (ratio > 0.8) return '$$$'
  if (ratio > 0.5) return '$$'
  return ''
}

export interface CellIntensity {
  ratio: number
  sales: number
  label: string
  total_amount: number | undefined
}

const EMPTY_CELL: CellIntensity = { ratio: 0, sales: 0, label: '', total_amount: 0 }

/** Intensity of one grid cell; zeroed shape when the API has no data for it. */
export const getCellIntensity = (
  cells: HeatmapCell[],
  maxSales: number,
  uiDayIndex: number,
  hourLabel: string,
): CellIntensity => {
  const hour = parseHourLabel(hourLabel)
  const apiDay = uiIndexToApiDay(uiDayIndex)

  const cell = cells.find((d) => d.day === apiDay && d.hour === hour)
  if (!cell) return EMPTY_CELL

  const ratio = cell.sales_count / maxSales
  return {
    ratio,
    sales: cell.sales_count,
    label: getIntensityLabel(ratio),
    total_amount: cell.total_amount,
  }
}
