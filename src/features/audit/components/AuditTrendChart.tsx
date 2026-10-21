import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount } from '@/domain/audit/format'
import { maxAuditChartValue, type AuditChartDatum } from '@/domain/audit/trends'

interface AuditTrendChartProps {
  data: AuditChartDatum[]
  ariaLabel: string
  testId: string
  empty: { icon: LucideIcon; title: string; description?: string }
  minWidthClass?: string
}

/**
 * Columnas CSS escaladas al máximo REAL de la serie (sin librería de charts,
 * igual que el resto de las pantallas BI). Cada columna expone su valor por
 * `aria-label` — la barra es decorativa y el gráfico no inventa una curva
 * cuando no hay buckets. Las etiquetas ya vienen re-derivadas del `date` por
 * el dominio (nunca el `to_char` en inglés del servidor).
 */
export const AuditTrendChart = ({
  data,
  ariaLabel,
  testId,
  empty,
  minWidthClass = 'min-w-0',
}: AuditTrendChartProps) => {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const measure = () => setContainerWidth(node.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [data.length])

  if (data.length === 0) {
    return (
      <div data-testid={`${testId}-empty`}>
        <TableEmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
        />
      </div>
    )
  }

  const max = maxAuditChartValue(data)
  // Cada etiqueta necesita ~36 px; si no entran, quedan solo los extremos.
  const showPointLabels =
    containerWidth > 0 && data.length > 0 && data.length <= Math.floor(containerWidth / 36)

  return (
    <div>
      <div className="overflow-x-auto" ref={containerRef}>
        <div className={minWidthClass}>
          <div
            role="list"
            aria-label={ariaLabel}
            data-testid={testId}
            className="flex items-end gap-xs"
          >
            {data.map((item, index) => {
              const height = max > 0 && item.total > 0 ? Math.max(2, Math.round((item.total / max) * 100)) : 0
              return (
                <div
                  key={item.key}
                  role="listitem"
                  aria-label={t(
                    'audit.chart.barAria',
                    '{label}: {total} acciones · {failed} fallos',
                    {
                      label: item.label,
                      total: formatCount(item.total),
                      failed: formatCount(item.failed),
                    },
                  )}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-xs"
                  data-testid={`${testId}-bar-${index}`}
                >
                  <div
                    className="flex h-32 w-full items-end rounded-xs bg-surface-muted"
                    aria-hidden="true"
                  >
                    <div
                      className={`w-full rounded-xs ${item.failed > 0 ? 'bg-primary' : 'bg-primary/50'}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  {showPointLabels ? (
                    <span className="h-4 whitespace-nowrap text-body-sm text-on-surface-deep">
                      {item.label}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
          {!showPointLabels ? (
            <div
              className="mt-xs flex justify-between text-body-sm text-on-surface-deep"
              aria-hidden="true"
            >
              <span>{data[0]?.label}</span>
              <span>{data[data.length - 1]?.label}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AuditTrendChart
