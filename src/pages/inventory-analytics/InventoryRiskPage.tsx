import { useState } from 'react'
import { Boxes, CalendarClock, PackageCheck, PackageX, Percent, Wallet } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  AgingTable,
  DeadStockTable,
  DeadStockThresholdSelector,
  InventoryKpiLedger,
  InventoryPageLayout,
  InventoryRefreshButton,
  useDeadStock,
  useStockAging,
} from '@/features/inventory-analytics'
import type { DeadStockThreshold, InventoryKpiItem } from '@/features/inventory-analytics'
import {
  buildDeadStockSummary,
  DEAD_STOCK_DEFAULT_THRESHOLD,
} from '@/domain/inventory-analytics/deadStock'
import { formatCount, formatDays, formatMoney, formatPercent } from '@/domain/inventory-analytics/format'


/**
 * F5 — Riesgos de inventario: stock sin venta para un umbral elegible y
 * antigüedad del stock por tramos. No se muestra `potential_loss` (30 %
 * hardcodeado) ni las recomendaciones en español del BE: la UI deriva su
 * propia recomendación i18n de los días reales.
 */
const InventoryRiskPage = () => {
  const { t } = useI18n()
  const [threshold, setThreshold] = useState<DeadStockThreshold>(
    DEAD_STOCK_DEFAULT_THRESHOLD,
  )
  const deadStockQuery = useDeadStock(threshold)
  const agingQuery = useStockAging()

  const errorTitle = t('inventoryAnalytics.errors.title', 'No se pudieron cargar los datos')
  const summary = buildDeadStockSummary(deadStockQuery.data?.summary)

  const kpiItems: InventoryKpiItem[] = [
    {
      id: 'products',
      icon: PackageX,
      tone: 'error',
      label: t('inventoryAnalytics.risk.kpis.products', 'Productos sin venta'),
      hint: t(
        'inventoryAnalytics.risk.thresholdHint',
        'Sin ventas en los últimos {days} días',
        { days: threshold },
      ),
      value: formatCount(summary.products),
    },
    {
      id: 'units',
      icon: Boxes,
      tone: 'warning',
      label: t('inventoryAnalytics.risk.kpis.units', 'Unidades inmovilizadas'),
      value: formatCount(summary.units),
    },
    {
      id: 'value',
      icon: Wallet,
      tone: 'primary',
      label: t('inventoryAnalytics.risk.kpis.value', 'Valor inmovilizado'),
      value: formatMoney(summary.value),
    },
    {
      id: 'percentage',
      icon: Percent,
      tone: 'secondary',
      label: t(
        'inventoryAnalytics.risk.kpis.percentage',
        'Participación del inventario',
      ),
      value: formatPercent(summary.percentageOfStock),
    },
    {
      id: 'avgDays',
      icon: CalendarClock,
      tone: 'neutral',
      label: t('inventoryAnalytics.risk.kpis.avgDays', 'Días promedio sin venta'),
      value: t('inventoryAnalytics.common.daysValue', '{n} días', {
        n: formatDays(summary.averageDaysIdle),
      }),
    },
  ]

  const deadEmpty = (
    <TableEmptyState
      icon={PackageCheck}
      title={t(
        'inventoryAnalytics.risk.deadEmpty',
        'Sin stock muerto para este umbral',
      )}
      description={t(
        'inventoryAnalytics.risk.deadEmptyHint',
        'Ningún producto supera el umbral sin ventas.',
      )}
    />
  )
  const agingEmpty = (
    <TableEmptyState
      icon={PackageCheck}
      title={t('inventoryAnalytics.risk.agingEmpty', 'Sin stock para analizar')}
    />
  )

  return (
    <InventoryPageLayout
      title={t('inventoryAnalytics.risk.title', 'Riesgos de inventario')}
      subtitle={t(
        'inventoryAnalytics.risk.subtitle',
        'Stock sin movimiento y antigüedad de las existencias.',
      )}
      actions={<InventoryRefreshButton />}
    >
      <SectionCard
        title={t('inventoryAnalytics.risk.deadTitle', 'Stock sin venta')}
        description={t(
          'inventoryAnalytics.risk.deadSubtitle',
          'Productos con stock y sin ventas en el umbral elegido. Ordenado por valor inmovilizado.',
        )}
        testId="dead-stock-kpis-card"
      >
        <QueryBoundary
          isLoading={deadStockQuery.isLoading}
          error={deadStockQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void deadStockQuery.refetch()}
          skeleton={<PanelSkeleton rows={5} testId="dead-stock-kpis-skeleton" />}
        >
          <InventoryKpiLedger items={kpiItems} testId="dead-stock-kpi-ledger" />
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={t('inventoryAnalytics.risk.deadTitle', 'Stock sin venta')}
        description={t(
          'inventoryAnalytics.risk.noteDates',
          'Si el producto nunca se vendió o movió, el reporte usa la fecha de alta.',
        )}
        action={
          <DeadStockThresholdSelector value={threshold} onChange={setThreshold} />
        }
        testId="dead-stock-card"
      >
        <QueryBoundary
          isLoading={deadStockQuery.isLoading}
          error={deadStockQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void deadStockQuery.refetch()}
          skeleton={<TableSkeleton rows={8} testId="dead-stock-skeleton" />}
        >
          <DeadStockTable
            key={threshold}
            rows={deadStockQuery.data?.products ?? []}
            empty={deadEmpty}
          />
        </QueryBoundary>
      </TableCard>

      <TableCard
        title={t('inventoryAnalytics.risk.agingTitle', 'Antigüedad del stock')}
        description={t(
          'inventoryAnalytics.risk.agingSubtitle',
          'Días desde el último ingreso (o alta del producto) del stock disponible.',
        )}
        testId="aging-card"
      >
        <QueryBoundary
          isLoading={agingQuery.isLoading}
          error={agingQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void agingQuery.refetch()}
          skeleton={<TableSkeleton rows={5} testId="aging-skeleton" />}
        >
          <AgingTable
            buckets={agingQuery.data?.buckets ?? []}
            summary={agingQuery.data?.summary}
            empty={agingEmpty}
          />
        </QueryBoundary>
      </TableCard>
    </InventoryPageLayout>
  )
}

export default InventoryRiskPage
