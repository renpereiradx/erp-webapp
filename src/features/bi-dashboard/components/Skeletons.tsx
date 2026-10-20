/**
 * Skeletons del Dashboard BI. Las implementaciones viven en
 * `components/ui/DataSkeletons` desde F4 (las comparten las features BI); acá
 * se conservan los `data-testid` del dashboard para no romper los page tests.
 */
import {
  CardGridSkeleton as SharedCardGridSkeleton,
  PanelSkeleton as SharedPanelSkeleton,
} from '@/components/ui/DataSkeletons'

type SkeletonColumns = 2 | 3 | 4 | 5

export const CardGridSkeleton = ({
  count = 4,
  columns = 4,
  className,
}: {
  count?: number
  columns?: SkeletonColumns
  className?: string
}) => (
  <SharedCardGridSkeleton
    count={count}
    columns={columns}
    className={className}
    testId="dashboard-cards-skeleton"
  />
)

export const PanelSkeleton = ({ rows = 4, className }: { rows?: number; className?: string }) => (
  <SharedPanelSkeleton rows={rows} className={className} testId="dashboard-panel-skeleton" />
)
