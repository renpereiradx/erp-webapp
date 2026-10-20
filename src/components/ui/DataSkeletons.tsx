import { cn } from '@/lib/utils'

type SkeletonColumns = 2 | 3 | 4 | 5

const GRID_COLUMNS: Record<SkeletonColumns, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-2 xl:grid-cols-5',
}

interface CardGridSkeletonProps {
  count?: number
  columns?: SkeletonColumns
  className?: string
  testId?: string
}

/** Skeletons de tarjetas KPI: misma grilla que el contenido final. */
export const CardGridSkeleton = ({
  count = 4,
  columns = 4,
  className,
  testId = 'cards-skeleton',
}: CardGridSkeletonProps) => (
  <div
    className={cn('grid gap-md', GRID_COLUMNS[columns], className)}
    aria-busy="true"
    data-testid={testId}
  >
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="h-36 animate-pulse rounded-md bg-surface-muted" />
    ))}
  </div>
)

interface PanelSkeletonProps {
  rows?: number
  className?: string
  testId?: string
}

/** Skeletons de un panel con filas (tablas/listas). */
export const PanelSkeleton = ({
  rows = 4,
  className,
  testId = 'panel-skeleton',
}: PanelSkeletonProps) => (
  <div className={cn('space-y-sm', className)} aria-busy="true" data-testid={testId}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-12 animate-pulse rounded-sm bg-surface-muted" />
    ))}
  </div>
)

interface TableSkeletonProps {
  rows?: number
  className?: string
  testId?: string
}

/** Skeletons de tabla: filas altas que imitan las celdas de datos. */
export const TableSkeleton = ({
  rows = 6,
  className,
  testId = 'table-skeleton',
}: TableSkeletonProps) => (
  <div className={cn('space-y-sm', className)} aria-busy="true" data-testid={testId}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-14 animate-pulse rounded-sm bg-surface-muted" />
    ))}
  </div>
)
