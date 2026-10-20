interface BarDatum {
  key: string
  label: string
  value: number
  /** Texto visible sobre la barra (solo si `showValues`). */
  valueText?: string
  ariaLabel: string
  highlight: boolean
}

interface BarColumnsProps {
  data: BarDatum[]
  ariaLabel: string
  showValues?: boolean
  minWidthClass?: string
  testId?: string
  /** Etiquetas del eje (p. ej. horas cada 6) cuando hay demasiadas columnas. */
  axisLabels?: string[]
}

/**
 * Columnas con barras CSS escaladas al máximo REAL del conjunto. Sin librería
 * de charts: cada columna expone su valor por `aria-label` (la barra es
 * decorativa) y el label del eje.
 */
export const BarColumns = ({
  data,
  ariaLabel,
  showValues = false,
  minWidthClass = 'min-w-[720px]',
  testId,
  axisLabels,
}: BarColumnsProps) => {
  const max = data.reduce((current, item) => Math.max(current, item.value), 0)

  return (
    <div className="overflow-x-auto">
      <div className={minWidthClass}>
        <div role="list" aria-label={ariaLabel} data-testid={testId} className="flex items-end gap-xs">
          {data.map((item) => {
            const height =
              max > 0 && item.value > 0 ? Math.max(2, Math.round((item.value / max) * 100)) : 0
            return (
              <div
                key={item.key}
                role="listitem"
                aria-label={item.ariaLabel}
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-xs"
                data-testid={`bar-${item.key}`}
              >
                {showValues ? (
                  <span className="whitespace-nowrap text-body-sm text-on-surface-deep">
                    {item.valueText}
                  </span>
                ) : null}
                <div
                  className="flex h-32 w-full items-end rounded-xs bg-surface-muted"
                  aria-hidden="true"
                >
                  <div
                    className={`w-full rounded-xs ${item.highlight ? 'bg-primary' : 'bg-primary/40'}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="h-4 whitespace-nowrap text-body-sm text-on-surface-deep">
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
        {axisLabels && axisLabels.length > 0 ? (
          <div
            className="mt-xs flex justify-between text-body-sm text-on-surface-deep"
            aria-hidden="true"
          >
            {axisLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export type { BarDatum, BarColumnsProps }
export default BarColumns
