import {
  CalendarClock,
  Layers,
  PackageSearch,
  Receipt,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  AbcExplorer,
  AbcSummaryTable,
  InventoryKpiLedger,
  InventoryPageLayout,
  InventoryPeriodSelector,
  InventoryRefreshButton,
  TurnoverCategoryTable,
  TurnoverProductTable,
  useInventoryAbc,
  useInventoryPeriod,
  useInventoryTurnover,
} from '@/features/inventory-analytics'
import type { InventoryKpiTone } from '@/features/inventory-analytics'
import { buildTurnoverKpis, type TurnoverKpiId, type TurnoverKpiRow } from '@/domain/inventory-analytics/kpis'
import { formatDays, formatMoney, formatPercent, formatRate } from '@/domain/inventory-analytics/format'

const KPI_META: Record<
  TurnoverKpiId,
  { icon: LucideIcon; tone: InventoryKpiTone; labelKey: string; fallback: string }
> = {
  turnoverRate: {
    icon: RefreshCw,
    tone: 'secondary',
    labelKey: 'inventoryAnalytics.kpis.turnoverRatePeriod',
    fallback: 'Tasa de rotación',
  },
  daysOfInventory: {
    icon: CalendarClock,
    tone: 'neutral',
    labelKey: 'inventoryAnalytics.kpis.daysPeriod',
    fallback: 'Días de inventario',
  },
  inventoryCost: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'inventoryAnalytics.kpis.inventoryCost',
    fallback: 'Inventario a costo',
  },
  cogs: {
    icon: Receipt,
    tone: 'warning',
    labelKey: 'inventoryAnalytics.kpis.cogs',
    fallback: 'Costo de ventas del período',
  },
}

const HINT_KEYS: Record<TurnoverKpiId, string> = {
  turnoverRate: 'inventoryAnalytics.turnover.rateHint',
  daysOfInventory: 'inventoryAnalytics.turnover.daysHint',
  inventoryCost: 'inventoryAnalytics.kpis.inventoryCostHint',
  cogs: 'inventoryAnalytics.turnover.cogsHint',
}

const HINT_FALLBACKS: Record<TurnoverKpiId, string> = {
  turnoverRate: 'Costo de ventas del período / inventario a costo',
  daysOfInventory: 'Sobre las ventas del período',
  inventoryCost: 'Valor actual del stock, no un promedio del período',
  cogs: 'Costo de las ventas del período',
}

/**
 * F5 — Rotación y ABC: KPIs reales del período, rotación por categoría y
 * producto, y clasificación ABC por ventas. La nota de días evita leer los
 * valores extremos (2.839 días) como un error de la UI.
 */
const TurnoverAbcPage = () => {
  const { t } = useI18n()
  const { period } = useInventoryPeriod()
  const turnoverQuery = useInventoryTurnover(period)
  const abcQuery = useInventoryAbc(period)

  const errorTitle = t('inventoryAnalytics.errors.title', 'No se pudieron cargar los datos')
  const kpiRows = buildTurnoverKpis(turnoverQuery.data?.overall)

  const renderValue = (row: TurnoverKpiRow): string => {
    if (row.unavailable) return t('inventoryAnalytics.common.unavailable', '—')
    switch (row.kind) {
      case 'money':
        return formatMoney(row.value)
      case 'rate':
        return t('inventoryAnalytics.common.rateValue', '{value}x', {
          value: formatRate(row.value),
        })
      case 'days':
        return t('inventoryAnalytics.common.daysValue', '{n} días', {
          n: formatDays(row.value),
        })
      default:
        return formatPercent(row.value)
    }
  }

  const kpiItems = kpiRows.map((row) => {
    const meta = KPI_META[row.id]
    return {
      id: row.id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.fallback),
      hint: row.unavailable
        ? t('inventoryAnalytics.common.noSalesPeriod', 'Sin costo de ventas en el período')
        : t(HINT_KEYS[row.id], HINT_FALLBACKS[row.id]),
      value: renderValue(row),
    }
  })

  const categoryEmpty = (
    <TableEmptyState
      icon={PackageSearch}
      title={t(
        'inventoryAnalytics.turnover.categoryEmpty',
        'Sin categorías con ventas en el período',
      )}
      description={t(
        'inventoryAnalytics.turnover.emptyHint',
        'El período no registra costo de ventas.',
      )}
    />
  )
  const productEmpty = (
    <TableEmptyState
      icon={PackageSearch}
      title={t(
        'inventoryAnalytics.turnover.productEmpty',
        'Sin productos con ventas en el período',
      )}
      description={t(
        'inventoryAnalytics.turnover.emptyHint',
        'El período no registra costo de ventas.',
      )}
    />
  )
  const abcEmpty = (
    <TableEmptyState
      icon={Layers}
      title={t('inventoryAnalytics.abc.classEmpty', 'Sin productos en esta clase')}
      description={t(
        'inventoryAnalytics.abc.emptyHint',
        'El período no registra ventas.',
      )}
    />
  )

  return (
    <InventoryPageLayout
      title={t('inventoryAnalytics.turnover.title', 'Rotación y ABC')}
      subtitle={t(
        'inventoryAnalytics.turnover.subtitle',
        'Rotación por categoría y producto, y clasificación ABC del período.',
      )}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <InventoryPeriodSelector />
          <InventoryRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('inventoryAnalytics.turnover.kpiTitle', 'Rotación del período')}
        description={t(
          'inventoryAnalytics.turnover.note',
          'Los días de inventario se calculan con el costo de ventas del período: períodos cortos o con poco movimiento producen valores altos.',
        )}
        testId="turnover-kpis-card"
      >
        <QueryBoundary
          isLoading={turnoverQuery.isLoading}
          error={turnoverQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void turnoverQuery.refetch()}
          skeleton={<PanelSkeleton rows={4} testId="turnover-kpis-skeleton" />}
        >
          <InventoryKpiLedger items={kpiItems} testId="turnover-kpi-ledger" />
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={t('inventoryAnalytics.turnover.categoryTitle', 'Rotación por categoría')}
        description={t(
          'inventoryAnalytics.turnover.categorySubtitle',
          'Categorías con ventas en el período, ordenadas por rotación.',
        )}
        testId="turnover-category-card"
      >
        <QueryBoundary
          isLoading={turnoverQuery.isLoading}
          error={turnoverQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void turnoverQuery.refetch()}
          isEmpty={turnoverQuery.data?.byCategory.length === 0}
          empty={<div className="px-md py-xl">{categoryEmpty}</div>}
          skeleton={<TableSkeleton rows={6} testId="turnover-category-skeleton" />}
        >
          <TurnoverCategoryTable
            rows={turnoverQuery.data?.byCategory ?? []}
            empty={categoryEmpty}
          />
        </QueryBoundary>
      </TableCard>

      <TableCard
        title={t('inventoryAnalytics.turnover.productTitle', 'Rotación por producto')}
        description={t(
          'inventoryAnalytics.turnover.productSubtitle',
          'Top 20 por rotación entre los productos con stock.',
        )}
        testId="turnover-product-card"
      >
        <QueryBoundary
          isLoading={turnoverQuery.isLoading}
          error={turnoverQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void turnoverQuery.refetch()}
          isEmpty={turnoverQuery.data?.byProduct.length === 0}
          empty={<div className="px-md py-xl">{productEmpty}</div>}
          skeleton={<TableSkeleton rows={6} testId="turnover-product-skeleton" />}
        >
          <TurnoverProductTable
            rows={turnoverQuery.data?.byProduct ?? []}
            empty={productEmpty}
          />
        </QueryBoundary>
      </TableCard>

      <TableCard
        title={t('inventoryAnalytics.abc.title', 'Clasificación ABC')}
        description={t(
          'inventoryAnalytics.abc.note',
          'El ABC se calcula sobre las ventas del período, no sobre el valor del inventario.',
        )}
        testId="abc-card"
      >
        <QueryBoundary
          isLoading={abcQuery.isLoading}
          error={abcQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void abcQuery.refetch()}
          skeleton={<TableSkeleton rows={4} testId="abc-skeleton" />}
        >
          <div className="px-md pb-md">
            <AbcSummaryTable summary={abcQuery.data?.summary} />
          </div>
          <AbcExplorer
            classA={abcQuery.data?.classA ?? []}
            classB={abcQuery.data?.classB ?? []}
            classC={abcQuery.data?.classC ?? []}
            empty={abcEmpty}
          />
        </QueryBoundary>
      </TableCard>
    </InventoryPageLayout>
  )
}

export default TurnoverAbcPage
