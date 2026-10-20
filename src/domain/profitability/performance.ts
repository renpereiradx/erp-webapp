/**
 * Clasificación de desempeño que el BE deriva con umbrales fijos de margen
 * bruto (productos: 40/25/10/0; categorías: 40/25/10 sin LOSS). La UI traduce
 * el código, nunca muestra el literal en mayúsculas.
 */
export type PerformanceKey = 'excellent' | 'good' | 'average' | 'poor' | 'loss'

export type PerformanceTone = 'success' | 'primary' | 'warning' | 'error' | 'neutral'

const PERFORMANCE_KEYS: Record<string, PerformanceKey> = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  AVERAGE: 'average',
  POOR: 'poor',
  LOSS: 'loss',
}

const PERFORMANCE_TONES: Record<PerformanceKey, PerformanceTone> = {
  excellent: 'success',
  good: 'primary',
  average: 'neutral',
  poor: 'warning',
  loss: 'error',
}

/** `EXCELLENT` → `excellent`; desconocido/ausente → `null` (no se muestra). */
export const performanceKey = (
  performance: string | null | undefined,
): PerformanceKey | null => {
  if (!performance) return null
  return PERFORMANCE_KEYS[performance.toUpperCase()] ?? null
}

export const performanceTone = (key: PerformanceKey): PerformanceTone => PERFORMANCE_TONES[key]
