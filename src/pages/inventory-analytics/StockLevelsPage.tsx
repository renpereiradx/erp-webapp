import { useState } from 'react'
import { PackageCheck, PackageSearch } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import TablePagination from '@/components/ui/TablePagination'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  InventoryPageLayout,
  InventoryRefreshButton,
  ReorderSummaryPanel,
  ReorderTable,
  StockLevelsSummaryPanel,
  StockLevelsTable,
  StockStatusFilter,
  useReorderAnalysis,
  useStockLevels,
} from '@/features/inventory-analytics'
import type { StockFilterValue } from '@/features/inventory-analytics'
import {
  DEFAULT_STOCK_SORT,
  nextStockSort,
  type StockSortState,
} from '@/domain/inventory-analytics/stock'
import type { InventorySortBy, InventoryStatusFilter } from '@/types/bi'

/**
 * F5 — Niveles de stock: tabla server-side con filtro por estado, orden y
 * paginación, más el análisis de reposición del grupo. No hay buscador de
 * texto porque el endpoint no lo acepta (filtrar solo la página actual sería
 * una mentira).
 */
const StockLevelsPage = () => {
  const { t } = useI18n()
  const [status, setStatus] = useState<StockFilterValue>('all')
  const [sort, setSort] = useState<StockSortState>(DEFAULT_STOCK_SORT)
  const [page, setPage] = useState(1)

  const levelsQuery = useStockLevels({
    page,
    status: status === 'all' ? undefined : (status as InventoryStatusFilter),
    sort,
  })
  const reorderQuery = useReorderAnalysis()

  const errorTitle = t('inventoryAnalytics.errors.title', 'No se pudieron cargar los datos')
  const pagination = levelsQuery.data?.pagination
  const reorderRows = [
    ...(reorderQuery.data?.urgent ?? []),
    ...(reorderQuery.data?.soon ?? []),
  ]

  const handleFilter = (next: StockFilterValue) => {
    setStatus(next)
    setPage(1)
  }

  const handleSort = (field: InventorySortBy) => {
    setSort((current) => nextStockSort(current, field))
    setPage(1)
  }

  const levelsEmpty = (
    <TableEmptyState
      icon={PackageSearch}
      title={t('inventoryAnalytics.stockLevels.empty', 'Sin productos con ese filtro')}
      description={t(
        'inventoryAnalytics.stockLevels.emptyHint',
        'Probá con otro estado.',
      )}
    />
  )
  const reorderEmpty = (
    <TableEmptyState
      icon={PackageCheck}
      title={t('inventoryAnalytics.stockLevels.reorderEmpty', 'Sin productos para reponer')}
      description={t(
        'inventoryAnalytics.stockLevels.reorderSubtitle',
        'Productos con stock ≤ 5. La cantidad sugerida repone hasta 10 unidades (regla del reporte).',
      )}
    />
  )

  return (
    <InventoryPageLayout
      title={t('inventoryAnalytics.stockLevels.title', 'Niveles de stock')}
      subtitle={t(
        'inventoryAnalytics.stockLevels.subtitle',
        'Existencias, valor a costo y estado por producto.',
      )}
      actions={<InventoryRefreshButton />}
    >
      <TableCard
        title={t('inventoryAnalytics.stockLevels.levelsTitle', 'Existencias por producto')}
        description={`${t(
          'inventoryAnalytics.stockLevels.levelsSubtitle',
          'Umbrales fijos del reporte: bajo stock ≤ 5, sobre-stock > 15. “Con stock” incluye sobre-stock.',
        )} ${t(
          'inventoryAnalytics.stockLevels.noteDates',
          'Si no hay movimiento o venta registrados, se usa la fecha de alta del producto.',
        )}`}
        testId="stock-levels-card"
        footer={
          pagination ? (
            <TablePagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total_items}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        <div className="px-md pb-md">
          <StockStatusFilter value={status} onChange={handleFilter} />
        </div>
        <QueryBoundary
          isLoading={levelsQuery.isLoading}
          error={levelsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void levelsQuery.refetch()}
          skeleton={<TableSkeleton rows={8} testId="stock-levels-skeleton" />}
        >
          <div className="space-y-md px-md pb-md">
            <StockLevelsSummaryPanel summary={levelsQuery.data?.summary} />
          </div>
          <StockLevelsTable
            rows={levelsQuery.data?.products ?? []}
            sort={sort}
            onSort={handleSort}
            empty={levelsEmpty}
          />
        </QueryBoundary>
      </TableCard>

      <TableCard
        title={t('inventoryAnalytics.stockLevels.reorderTitle', 'Reposición sugerida')}
        description={t(
          'inventoryAnalytics.stockLevels.reorderSubtitle',
          'Productos con stock ≤ 5. La cantidad sugerida repone hasta 10 unidades (regla del reporte).',
        )}
        testId="reorder-card"
      >
        <div className="px-md pb-md">
          <QueryBoundary
            isLoading={reorderQuery.isLoading}
            error={reorderQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void reorderQuery.refetch()}
            skeleton={<PanelSkeleton rows={4} testId="reorder-summary-skeleton" />}
          >
            <ReorderSummaryPanel summary={reorderQuery.data?.summary} />
          </QueryBoundary>
        </div>
        <QueryBoundary
          isLoading={reorderQuery.isLoading}
          error={reorderQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void reorderQuery.refetch()}
          isEmpty={reorderRows.length === 0}
          empty={<div className="px-md py-xl">{reorderEmpty}</div>}
          skeleton={<TableSkeleton rows={6} testId="reorder-table-skeleton" />}
        >
          <ReorderTable rows={reorderRows} empty={reorderEmpty} />
        </QueryBoundary>
      </TableCard>
    </InventoryPageLayout>
  )
}

export default StockLevelsPage
