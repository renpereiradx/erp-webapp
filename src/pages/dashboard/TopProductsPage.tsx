import { useRef, useState } from 'react'
import { DollarSign, Package, Search, TrendingUp } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { Input } from '@/components/ui/input'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { useI18n } from '@/lib/i18n'
import { useSearchFocusShortcut } from '@/hooks/useSearchFocusShortcut'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import { filterTopProducts } from '@/domain/dashboard/topProducts'
import type { TopProductSort } from '@/types/bi'
import {
  CardGridSkeleton,
  DashboardPeriodSelector,
  DashboardRefreshButton,
  KpiCard,
  PanelSkeleton,
  PartialDataBanner,
  QueryBoundary,
  TableEmptyState,
  TopProductsTable,
  useDashboardTopProducts,
} from '@/features/bi-dashboard'

const TOP_PRODUCTS_LIMIT = 10

const SORT_OPTIONS: Array<{ value: TopProductSort; fallback: string }> = [
  { value: 'revenue', fallback: 'Ingresos' },
  { value: 'quantity', fallback: 'Cantidad' },
  { value: 'profit', fallback: 'Utilidad' },
]

const TopProductsPage = () => {
  const { t } = useI18n()
  const [sortBy, setSortBy] = useState<TopProductSort>('revenue')
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useSearchFocusShortcut({ enabled: true, inputRef: searchInputRef })

  const topProductsQuery = useDashboardTopProducts(TOP_PRODUCTS_LIMIT, sortBy)
  const products = topProductsQuery.data?.products ?? []
  const filtered = filterTopProducts(products, search)
  const hasSearch = search.trim() !== ''

  const emptyState = hasSearch ? (
    <TableEmptyState
      icon={Search}
      title={t('dashboard.topProducts.empty.filteredTitle', 'Sin resultados')}
      description={t(
        'dashboard.topProducts.empty.filteredDescription',
        'Probá con otro nombre, categoría, marca o SKU.',
      )}
    />
  ) : (
    <TableEmptyState
      icon={Package}
      title={t('dashboard.topProducts.empty.title', 'Sin productos en el período')}
      description={t(
        'dashboard.topProducts.empty.description',
        'Sin ventas registradas en el período seleccionado.',
      )}
    />
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
        <PageHeader
          title={t('dashboard.topProducts.title', 'Top de productos')}
          subtitle={t(
            'dashboard.topProducts.subtitle',
            'Ranking por ingresos, unidades o utilidad del período.',
          )}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <DashboardPeriodSelector />
              <SegmentedControl
                options={SORT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(`dashboard.topProducts.sort.${option.value}`, option.fallback),
                }))}
                value={sortBy}
                onChange={(value: string) => setSortBy(value as TopProductSort)}
                aria-label={t('dashboard.topProducts.sort.label', 'Ordenar por')}
                size="small"
              />
              <DashboardRefreshButton />
            </div>
          }
        />

        <div className="space-y-xl">
          <PartialDataBanner metadata={topProductsQuery.data?.metadata} />

          <QueryBoundary
            isLoading={topProductsQuery.isLoading}
            error={topProductsQuery.error}
            errorTitle={t('dashboard.errors.title', 'No se pudieron cargar los datos')}
            onRetry={() => void topProductsQuery.refetch()}
            skeleton={
              <div className="space-y-xl">
                <CardGridSkeleton count={3} columns={3} />
                <PanelSkeleton rows={6} />
              </div>
            }
          >
            <div className="space-y-xl">
              <div className="grid gap-md sm:grid-cols-3">
                <KpiCard
                  icon={DollarSign}
                  tone="primary"
                  label={t('dashboard.topProducts.totals.revenue', 'Ingresos del top')}
                  value={formatPYG(topProductsQuery.data?.totalRevenue ?? 0)}
                  hint={t('dashboard.topProducts.totals.hint', 'Sobre los {count} productos listados', {
                    count: formatNumber(products.length, 0),
                  })}
                  testId="top-kpi-revenue"
                />
                <KpiCard
                  icon={TrendingUp}
                  tone="success"
                  label={t('dashboard.topProducts.totals.profit', 'Utilidad del top')}
                  value={formatPYG(topProductsQuery.data?.totalProfit ?? 0)}
                  hint={t('dashboard.topProducts.totals.hint', 'Sobre los {count} productos listados', {
                    count: formatNumber(products.length, 0),
                  })}
                  testId="top-kpi-profit"
                />
                <KpiCard
                  icon={Package}
                  label={t('dashboard.topProducts.totals.products', 'Productos listados')}
                  value={formatNumber(products.length, 0)}
                  hint={t(
                    'dashboard.topProducts.totals.limitHint',
                    'El backend devuelve hasta {limit}.',
                    { limit: TOP_PRODUCTS_LIMIT },
                  )}
                  testId="top-kpi-count"
                />
              </div>

              <section
                className="overflow-hidden rounded-md bg-surface shadow-whisper"
                data-testid="top-products-card"
              >
                <div className="flex flex-col gap-sm border-b border-divider bg-surface-muted px-lg py-md">
                  <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:gap-md">
                    <div className="w-full shrink-0 sm:w-80">
                      <Input
                        ref={searchInputRef}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t(
                          'dashboard.topProducts.searchPlaceholder',
                          'Buscar producto, categoría, marca o SKU (F2)…',
                        )}
                        aria-label={t('dashboard.topProducts.search', 'Buscar productos')}
                      />
                    </div>
                    <h2 className="text-title-md text-foreground sm:ml-auto sm:text-right">
                      {t('dashboard.topProducts.table.title', 'Top {limit} productos', {
                        limit: TOP_PRODUCTS_LIMIT,
                      })}
                    </h2>
                  </div>
                  <p className="flex flex-wrap items-center gap-x-sm gap-y-1 text-body-sm font-data-mono text-on-surface-deep">
                    <span>[F2] {t('dashboard.topProducts.searchHint', 'Buscar')}</span>
                  </p>
                </div>

                <TopProductsTable products={filtered} emptyState={emptyState} />
              </section>
            </div>
          </QueryBoundary>
        </div>
      </div>
    </div>
  )
}

export default TopProductsPage
