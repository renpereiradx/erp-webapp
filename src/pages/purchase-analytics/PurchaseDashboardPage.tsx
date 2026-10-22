import { Link } from 'react-router-dom'
import { Package, ShoppingCart, Store, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import { formatCount, formatMoney, formatQuantity } from '@/domain/sales-analytics/format'
import { buildPurchaseKpiHints, buildPurchaseKpiRows } from '@/domain/purchase-analytics/kpis'
import { purchaseGranularityForPeriod } from '@/domain/purchase-analytics/periods'
import {
  PurchaseKpiLedger,
  PurchasePageLayout,
  PurchasePaymentMixList,
  PurchasePeriodSelector,
  PurchaseRefreshButton,
  PurchaseTrendSection,
  usePurchasePerformance,
  usePurchasePeriod,
  usePurchasesByCategory,
  usePurchasesByPaymentMethod,
  usePurchasesBySupplier,
  usePurchaseTrends,
} from '@/features/purchase-analytics'

/**
 * Dashboard de Compras: KPIs con comparación real contra la ventana previa,
 * serie de compras, mix de medios de pago y topes de categorías/proveedores.
 * Las órdenes PENDING y las compras excluidas por moneda viajan como hints —
 * nunca dentro del total (el BE las reporta por separado).
 */
const PurchaseDashboardPage = () => {
  const { t } = useI18n()
  const { period } = usePurchasePeriod()
  const granularity = purchaseGranularityForPeriod(period)

  const performanceQuery = usePurchasePerformance(period)
  const trendsQuery = usePurchaseTrends(period, granularity)
  const paymentQuery = usePurchasesByPaymentMethod(period)
  const categoriesQuery = usePurchasesByCategory(period)
  // Top proveedores del dashboard: primera página ordenada por monto.
  const suppliersQuery = usePurchasesBySupplier(period, 1, 'amount', 'desc')

  const performance = performanceQuery.data?.performance
  const kpiRows = buildPurchaseKpiRows(performance)
  const hints = buildPurchaseKpiHints(performance)
  const errorTitle = t('purchaseAnalytics.errors.title', 'No se pudieron cargar los datos')

  const kpiItems = [
    {
      id: 'purchases',
      icon: ShoppingCart,
      tone: 'primary' as const,
      label: t('purchaseAnalytics.kpi.purchases', 'Compras'),
      value: formatMoney(performance?.total_purchases),
      trend: kpiRows[0]?.trend ?? null,
    },
    {
      id: 'orders',
      icon: Package,
      tone: 'neutral' as const,
      label: t('purchaseAnalytics.kpi.orders', 'Órdenes'),
      value: formatCount(performance?.total_transactions),
      trend: kpiRows[1]?.trend ?? null,
    },
    {
      id: 'avgOrder',
      icon: Package,
      tone: 'neutral' as const,
      label: t('purchaseAnalytics.kpi.avgOrder', 'Orden promedio'),
      value: formatMoney(performance?.average_order),
      trend: kpiRows[2]?.trend ?? null,
    },
    {
      id: 'units',
      icon: Package,
      tone: 'neutral' as const,
      label: t('purchaseAnalytics.kpi.units', 'Unidades'),
      value: formatQuantity(performance?.total_units),
      trend: null,
    },
    {
      id: 'suppliers',
      icon: Store,
      tone: 'secondary' as const,
      label: t('purchaseAnalytics.kpi.suppliers', 'Proveedores'),
      value: formatCount(performance?.unique_suppliers),
      hint:
        hints.pendingOrders > 0
          ? t('purchaseAnalytics.kpi.pendingHint', 'Pendientes: {count} · {amount}', {
              count: formatCount(hints.pendingOrders),
              amount: formatMoney(hints.pendingAmount),
            })
          : undefined,
      trend: null,
    },
  ]

  const categories = categoriesQuery.data?.categories ?? []
  const suppliers = suppliersQuery.data?.suppliers ?? []

  return (
    <PurchasePageLayout
      title={t('purchaseAnalytics.dashboard.title', 'Dashboard de compras')}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <PurchasePeriodSelector />
          <PurchaseRefreshButton />
        </div>
      }
    >
      {hints.excludedOtherCurrency > 0 ? (
        <p
          className="rounded-md bg-warning/10 px-md py-sm text-body-sm text-on-surface-deep"
          data-testid="purchase-excluded-currency"
        >
          {t(
            'purchaseAnalytics.kpi.excludedCurrency',
            'Se excluyen {count} compras en moneda distinta a la base.',
            { count: formatCount(hints.excludedOtherCurrency) },
          )}
        </p>
      ) : null}

      <SectionCard
        title={t('purchaseAnalytics.dashboard.kpisTitle', 'Indicadores del período')}
        description={t(
          'purchaseAnalytics.dashboard.kpisSubtitle',
          'Compras recibidas en moneda base, contra la ventana previa equivalente.',
        )}
        testId="purchase-dashboard-kpis"
      >
        <QueryBoundary
          isLoading={performanceQuery.isLoading}
          error={performanceQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void performanceQuery.refetch()}
          skeleton={<PanelSkeleton rows={5} testId="purchase-kpis-skeleton" />}
        >
          <PurchaseKpiLedger items={kpiItems} testId="purchase-kpis" />
        </QueryBoundary>
      </SectionCard>

      <div className="grid items-start gap-xl xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <SectionCard
            title={t('purchaseAnalytics.dashboard.trendTitle', 'Evolución de las compras')}
            description={t(
              'purchaseAnalytics.dashboard.trendSubtitle',
              'Compras agrupadas por la granularidad del período.',
            )}
            testId="purchase-dashboard-trend"
          >
            <QueryBoundary
              isLoading={trendsQuery.isLoading}
              error={trendsQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void trendsQuery.refetch()}
              skeleton={<TableSkeleton rows={6} testId="purchase-trend-skeleton" />}
            >
              <PurchaseTrendSection
                trends={trendsQuery.data?.trends}
                granularity={granularity}
              />
            </QueryBoundary>
          </SectionCard>
        </div>

        <div className="min-w-0">
          <SectionCard
            title={t('purchaseAnalytics.dashboard.paymentTitle', 'Medios de pago')}
            description={t(
              'purchaseAnalytics.dashboard.paymentSubtitle',
              'Participación sobre las compras del período.',
            )}
            testId="purchase-dashboard-payment"
          >
            <QueryBoundary
              isLoading={paymentQuery.isLoading}
              error={paymentQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void paymentQuery.refetch()}
              skeleton={<PanelSkeleton rows={4} testId="purchase-payment-skeleton" />}
            >
              <PurchasePaymentMixList methods={paymentQuery.data?.methods ?? []} />
            </QueryBoundary>
          </SectionCard>
        </div>
      </div>

      <div className="grid items-start gap-xl xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <SectionCard
            title={t('purchaseAnalytics.dashboard.topSuppliersTitle', 'Proveedores con más compras')}
            description={t(
              'purchaseAnalytics.dashboard.topSuppliersSubtitle',
              'Los 5 proveedores con mayor monto comprado del período.',
            )}
            action={
              <Link
                to={`/purchase-analytics/insights?period=${period}`}
                className="text-body-sm-bold text-primary hover:underline"
              >
                {t('purchaseAnalytics.actions.viewAll', 'Ver todos')}
              </Link>
            }
            testId="purchase-dashboard-top-suppliers"
          >
            <QueryBoundary
              isLoading={suppliersQuery.isLoading}
              error={suppliersQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void suppliersQuery.refetch()}
              skeleton={<TableSkeleton rows={5} testId="purchase-top-suppliers-skeleton" />}
            >
              <ul className="divide-y divide-divider" data-testid="purchase-top-suppliers">
                {suppliers.slice(0, 5).map((supplier) => (
                  <li
                    key={supplier.supplier_id}
                    className="flex flex-wrap items-baseline justify-between gap-x-sm py-sm first:pt-0 last:pb-0"
                  >
                    <span className="text-body-md text-foreground">
                      {supplier.supplier_name || supplier.supplier_id}
                    </span>
                    <span className="font-data-mono text-data-mono text-foreground">
                      {formatMoney(supplier.total_purchases)} ·{' '}
                      {t('purchaseAnalytics.columns.ordersWithCount', 'Órdenes: {count}', {
                        count: formatCount(supplier.transaction_count),
                      })}
                    </span>
                  </li>
                ))}
                {suppliers.length === 0 ? (
                  <li className="py-md text-body-sm text-on-surface-deep">
                    {t('purchaseAnalytics.suppliers.empty', 'Sin compras en el período.')}
                  </li>
                ) : null}
              </ul>
            </QueryBoundary>
          </SectionCard>
        </div>

        <div className="min-w-0 xl:col-span-2">
          <SectionCard
            title={t('purchaseAnalytics.dashboard.topCategoriesTitle', 'Categorías con más compras')}
            description={t(
              'purchaseAnalytics.dashboard.topCategoriesSubtitle',
              'Top 5 de categorías del período.',
            )}
            testId="purchase-dashboard-top-categories"
          >
            <QueryBoundary
              isLoading={categoriesQuery.isLoading}
              error={categoriesQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void categoriesQuery.refetch()}
              skeleton={<TableSkeleton rows={5} testId="purchase-top-categories-skeleton" />}
            >
              <ul className="divide-y divide-divider" data-testid="purchase-top-categories">
                {categories.slice(0, 5).map((category) => (
                  <li
                    key={category.category_id}
                    className="flex flex-wrap items-baseline justify-between gap-x-sm py-sm first:pt-0 last:pb-0"
                  >
                    <span className="flex items-center gap-xs text-body-md text-foreground">
                      <Users size={14} className="text-on-surface-deep" aria-hidden="true" />
                      {category.category_name}
                    </span>
                    <span className="font-data-mono text-data-mono text-foreground">
                      {formatMoney(category.purchases)}
                    </span>
                  </li>
                ))}
                {categories.length === 0 ? (
                  <li className="py-md text-body-sm text-on-surface-deep">
                    {t('purchaseAnalytics.categories.empty', 'Sin compras en el período.')}
                  </li>
                ) : null}
              </ul>
            </QueryBoundary>
          </SectionCard>
        </div>
      </div>
    </PurchasePageLayout>
  )
}

export default PurchaseDashboardPage
