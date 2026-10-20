import { useI18n } from '@/lib/i18n'
import { Skeleton } from '@/components/ui/skeleton'

interface DrilldownTableSkeletonProps {
  columnCount: number
  rows?: number
}

/**
 * Skeleton con la forma final de la card con tabla (DESIGN §6.7): encabezado
 * muted + filas de celdas. Nunca un spinner centrado suelto en una página de
 * datos.
 */
export const DrilldownTableSkeleton = ({
  columnCount,
  rows = 6,
}: DrilldownTableSkeletonProps) => {
  const { t } = useI18n()
  const columns = Math.max(columnCount, 1)

  return (
    <section
      aria-busy="true"
      data-testid="drilldown-skeleton"
      className="overflow-hidden rounded-md bg-surface shadow-whisper"
    >
      <div className="flex items-center gap-md border-b border-divider bg-surface-muted px-md py-md">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1 bg-surface-subtle" />
        ))}
      </div>
      <div className="divide-y divide-divider">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-md px-md py-md">
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton key={columnIndex} className="h-4 flex-1 bg-surface-subtle" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        {t('relationalAnalytics.table.loading', 'Cargando análisis…')}
      </span>
    </section>
  )
}

export default DrilldownTableSkeleton
