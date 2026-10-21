import type { ReactNode } from 'react'

interface ForecastControlGroupProps {
  /** Etiqueta visible del control (`Historial`, `Horizonte`, `Método`). */
  label: string
  children: ReactNode
}

/**
 * Agrupa un selector con su etiqueta visible. Sin esto, los segmented controls
 * "6 meses / 12 meses / 24 meses" no decían a qué dimensión pertenecían.
 */
export const ForecastControlGroup = ({ label, children }: ForecastControlGroupProps) => (
  <div className="min-w-0">
    <p className="mb-xs text-label-caps uppercase text-on-surface-deep">{label}</p>
    {children}
  </div>
)

export default ForecastControlGroup
