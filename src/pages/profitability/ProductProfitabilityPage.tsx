import { useState } from 'react'
import {
  BadgePercent,
  Boxes,
  PackageX,
  Percent,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import TablePagination from '@/components/ui/TablePagination'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  ProductHighlights,
  ProductsTable,
  ProfitabilityKpiLedger,
  ProfitabilityPageLayout,
  ProfitabilityPeriodSelector,
  ProfitabilityRefreshButton,
  useProfitabilityPeriod,
  useProfitabilityProducts,
} from '@/features/profitability'
import type { ProfitabilityKpiTone, ProfitabilitySortOrder } from '@/features/profitability'
import { buildProductKpis, formatKpiValue } from '@/domain/profitability/kpis'
import { DEFAULT_PRODUCT_SORT } from '@/domain/profitability/constants'
import { nextProductSort } from '@/domain/profitability/products'
import { formatPeriodRange } from '@/domain/profitability/format'
import type { ProfitabilityProductSortBy } from '@/types/bi'

const KPI_META: Record<
  string,
  { icon: LucideIcon; tone: ProfitabilityKpiTone; labelKey: string; fallback: string; hintKey: string; hintFallback: string }
> = {
  totalProducts: {
    icon: Boxes,
    tone: 'neutral',
    labelKey: 'profitability.kpis.totalProducts',
    fallback: 'Productos vendidos',
    hintKey: 'profitability.products.totalProductsHint',
    hintFallback: 'Productos con ventas en el período',
  },
  profitableProducts: {
    icon: TrendingUp,
    tone: 'success',
    labelKey: 'profitability.kpis.profitableProducts',
    fallback: 'Con beneficio',
    hintKey: 'profitability.products.profitableHint',
    hintFallback: 'Beneficio bruto positivo',
  },
  unprofitableProducts: {
    icon: TrendingDown,
    tone: 'error',
    labelKey: 'profitability.kpis.unprofitableProducts',
    fallback: 'Con pérdida o sin beneficio',
    hintKey: 'profitability.products.unprofitableHint',
    hintFallback: 'Beneficio bruto menor o igual a cero',
  },
  totalRevenue: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'profitability.kpis.totalRevenue',
    fallback: 'Ingresos',
    hintKey: 'profitability.products.revenueHint',
    hintFallback: 'Suma de las líneas vendidas, con IVA',
  },
  totalProfit: {
    icon: Receipt,
    tone: 'success',
    labelKey: 'profitability.kpis.totalProfit',
    fallback: 'Beneficio bruto',
    hintKey: 'profitability.products.profitHint',
    hintFallback: 'Ingresos menos costo de las líneas con costo registrado',
  },
  globalMargin: {
    icon: Percent,
    tone: 'secondary',
    labelKey: 'profitability.kpis.globalMargin',
    fallback: 'Margen global',
    hintKey: 'profitability.kpis.globalMarginHint',
    hintFallback: 'Beneficio total / ingresos totales (ponderado)',
  },
  averageMargin: {
    icon: BadgePercent,
    tone: 'warning',
    labelKey: 'profitability.kpis.averageMargin',
    fallback: 'Margen promedio',
    hintKey: 'profitability.kpis.averageMarginHint',
    hintFallback: 'Promedio simple entre productos, no ponderado',
  },
}

/**
 * F6 — Productos rentables: resumen real, tabla ordenable/paginada
 * server-side y los paneles de mayor beneficio / pérdidas. Sin columna SKU
 * (el SQL la devuelve vacía) y sin buscador (el endpoint no lo acepta).
 */
const ProductProfitabilityPage = () => {
  const { t, lang } = useI18n()
  const { period } = useProfitabilityPeriod()
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ProfitabilitySortOrder>(DEFAULT_PRODUCT_SORT)
  const productsQuery = useProfitabilityProducts({ period, page, sort })
  const data = productsQuery.data

  const errorTitle = t('profitability.errors.title', 'No se pudieron cargar los datos')
  const kpiRows = buildProductKpis(data?.report.summary)
  const kpiItems = kpiRows.map((row) => {
    const meta = KPI_META[row.id]
    return {
      id: row.id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.fallback),
      hint: t(meta.hintKey, meta.hintFallback),
      value: formatKpiValue(row),
    }
  })

  const handleSort = (field: ProfitabilityProductSortBy) => {
    setSort((current) => nextProductSort(current, field))
    setPage(1)
  }

  const range = data?.report.period ? formatPeriodRange(data.report.period, lang) : undefined
  const pagination = data?.pagination

  const empty = (
    <TableEmptyState
      icon={PackageX}
      title={t('profitability.products.empty', 'Sin productos con ventas en el período')}
      description={t('profitability.products.emptyHint', 'Probá con otro período.')}
    />
  )

  return (
    <ProfitabilityPageLayout
      title={t('profitability.products.title', 'Rentabilidad por producto')}
      subtitle={t(
        'profitability.products.subtitle',
        'Ingresos, costo, beneficio y margen por producto vendido.',
      )}
      range={range}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <ProfitabilityPeriodSelector />
          <ProfitabilityRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('profitability.products.summaryTitle', 'Resumen del período')}
        description={t(
          'profitability.products.summarySubtitle',
          'El margen global es ponderado; el promedio es simple entre productos.',
        )}
        testId="profitability-products-summary-card"
      >
        <QueryBoundary
          isLoading={productsQuery.isLoading}
          error={productsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void productsQuery.refetch()}
          skeleton={<PanelSkeleton rows={7} testId="profitability-products-summary-skeleton" />}
        >
          <ProfitabilityKpiLedger items={kpiItems} testId="profitability-products-kpi-ledger" />
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={t('profitability.products.tableTitle', 'Detalle por producto')}
        description={t(
          'profitability.products.tableSubtitle',
          'Orden y paginación server-side. Las unidades se normalizan a la unidad base del producto: si no hay conversión se muestran “—”.',
        )}
        testId="profitability-products-table-card"
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
        <QueryBoundary
          isLoading={productsQuery.isLoading}
          error={productsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void productsQuery.refetch()}
          skeleton={<TableSkeleton rows={8} testId="profitability-products-table-skeleton" />}
        >
          <ProductsTable
            rows={data?.products ?? []}
            sort={sort}
            onSort={handleSort}
            totalProfit={data?.report.summary.total_profit}
            empty={empty}
          />
        </QueryBoundary>
      </TableCard>

      <QueryBoundary
        isLoading={productsQuery.isLoading}
        error={productsQuery.error}
        errorTitle={errorTitle}
        onRetry={() => void productsQuery.refetch()}
        skeleton={<PanelSkeleton rows={6} testId="profitability-highlights-skeleton" />}
      >
        <ProductHighlights
          topProfitable={data?.topProfitable ?? []}
          losers={data?.losers ?? []}
        />
      </QueryBoundary>
    </ProfitabilityPageLayout>
  )
}

export default ProductProfitabilityPage
