import GenericSkeletonList from '@/components/ui/GenericSkeletonList'

/**
 * Skeleton del feature de rentabilidad: imita la forma final de las páginas
 * (header + grid de KPIs + tabla) según DESIGN §6.7. FASE 2.
 */
const ProfitabilitySkeleton = ({ kpiCount = 3, rows = 6 }: { kpiCount?: number; rows?: number }) => (
  <div className="space-y-xl animate-in fade-in duration-300" aria-busy="true" data-testid="profitability-skeleton">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg">
      <div className="space-y-md w-full max-w-lg">
        <div className="h-4 w-32 bg-surface-muted rounded-full animate-pulse" />
        <div className="h-10 w-full bg-surface-muted rounded-md animate-pulse" />
      </div>
      <div className="h-10 w-64 bg-surface-muted rounded-md animate-pulse" />
    </div>

    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg`}>
      {Array.from({ length: kpiCount }).map((_, i) => (
        <div key={i} className="h-32 bg-surface-muted rounded-md animate-pulse" />
      ))}
    </div>

    <div className="rounded-md bg-surface shadow-whisper overflow-hidden">
      <div className="h-14 bg-surface-muted border-b border-border-subtle animate-pulse" />
      <div className="p-md">
        <GenericSkeletonList count={rows} data-testid="profitability-skeleton-rows" />
      </div>
    </div>
  </div>
)

export default ProfitabilitySkeleton
