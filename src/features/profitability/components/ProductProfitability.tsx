import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import {
  ChevronLeft,
  ChevronRight,
  Percent,
  Package,
  PackageSearch,
  RefreshCcw,
  TrendingUp,
} from 'lucide-react'
import { formatNumber } from '@/utils/currencyUtils'
import { clampPage } from '@/domain/sales-analytics/format'
import { useProfitability } from '../hooks/useProfitability'
import KpiCard from './KpiCard'
import ProfitabilitySkeleton from './ProfitabilitySkeleton'
import type { ProductProfitabilityData } from '../types'

/**
 * Análisis por SKU (GET /profitability/products).
 * Migración FASE 2 (PLAN_ALINEACION_BI_FRONTEND): .tsx + FSD + tokens +
 * i18n. La paginación server-side (page/page_size) ahora está cableada;
 * se eliminaron el Exportar sin handler, el buscador sin estado y la
 * columna de filtro decorativa (§2.6).
 */

const PERFORMANCE_TONE: Record<string, string> = {
  EXCELLENT: 'bg-success/10 text-success border-success/20',
  GOOD: 'bg-primary/10 text-primary border-primary/20',
  AVERAGE: 'bg-warning/10 text-warning border-warning/20',
  POOR: 'bg-error/10 text-error border-error/20',
  LOSS: 'bg-error/10 text-error border-error/30',
}

const PAGE_SIZE = 10

const ProductProfitability = () => {
  const { t } = useI18n()
  const [params, setParams] = useState({ period: 'month', page: 1, page_size: PAGE_SIZE })
  const { data, loading, error, refresh } = useProfitability<ProductProfitabilityData>('getProducts', params)

  const products = data?.products ?? []
  const summary = data?.summary
  const pagination = data?.pagination
  const currentPage = pagination?.page ?? params.page
  const totalPages = pagination?.total_pages ?? 1

  const goToPage = (page: number) => {
    const target = clampPage(page, { page: currentPage, total_pages: totalPages })
    if (target === params.page) return
    setParams((prev) => ({ ...prev, page: target }))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.profitability.breadcrumb', 'Rentabilidad', {})}
          title={t('bi.profitability.products.title', 'Análisis por SKU', {})}
          subtitle={t(
            'bi.profitability.products.subtitle',
            'Desglose técnico de rentabilidad individual. Identifique productos estrella y riesgos operativos en el inventario actual.',
            {},
          )}
          actions={
            <button
              type="button"
              onClick={() => refresh()}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('bi.profitability.action.refresh', 'Actualizar', {})}
            </button>
          }
        />

        {loading && <ProfitabilitySkeleton kpiCount={3} rows={5} />}

        {!loading && error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.profitability.errorTitle', 'No se pudo cargar la rentabilidad', {})}
              message={error}
              onRetry={refresh}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-md mt-lg">
              <KpiCard
                title={t('bi.profitability.products.kpi.skus', 'SKUs Analizados', {})}
                value={summary?.total_products}
                trendValue={summary?.total_products_growth}
                icon={Package}
                tone="primary"
                testId="kpi-skus"
              />
              <KpiCard
                title={t('bi.profitability.products.kpi.avgMargin', 'Margen Promedio', {})}
                value={summary?.average_margin}
                trendValue={summary?.margin_growth}
                isCurrency={false}
                icon={Percent}
                tone="warning"
                testId="kpi-avg-margin"
              />
              <KpiCard
                title={t('bi.profitability.products.kpi.totalProfit', 'Profit Total', {})}
                value={summary?.total_profit}
                trendValue={summary?.profit_growth}
                icon={TrendingUp}
                isAnchor
                testId="kpi-total-profit"
              />
            </section>

            {/* Tabla auditada */}
            <section className="bg-surface rounded-md shadow-whisper overflow-hidden mt-xl">
              <div className="px-lg py-md border-b border-border-subtle bg-surface-muted flex items-center gap-md">
                <h2 className="text-label-caps uppercase text-foreground">
                  {t('bi.profitability.products.table.title', 'Inventario Auditado', {})}
                </h2>
                <span className="px-sm py-0.5 bg-primary/10 text-primary text-body-sm-bold rounded-xs uppercase">
                  {t('bi.profitability.products.table.liveData', 'Live Data', {})}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-surface-muted border-b border-border-subtle text-on-surface-deep text-label-caps uppercase">
                    <tr>
                      <th className="px-lg py-md">{t('bi.profitability.products.col.product', 'Producto / SKU', {})}</th>
                      <th className="px-md py-md text-center">{t('bi.profitability.products.col.units', 'Unidades', {})}</th>
                      <th className="px-md py-md text-right">{t('bi.profitability.products.col.revenue', 'Ingresos', {})}</th>
                      <th className="px-md py-md text-right">{t('bi.profitability.products.col.grossProfit', 'Beneficio Bruto', {})}</th>
                      <th className="px-md py-md text-right">{t('bi.profitability.products.col.margin', 'Margen %', {})}</th>
                      <th className="px-md py-md text-right">{t('bi.profitability.products.col.markup', 'Markup %', {})}</th>
                      <th className="px-lg py-md text-center">{t('bi.profitability.products.col.performance', 'Desempeño', {})}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {products.map((item) => (
                      <tr key={item.product_id} className="hover:bg-surface-muted transition-colors duration-150">
                        <td className="px-lg py-md">
                          <div className="flex flex-col gap-xs">
                            <span className="text-body-md-bold text-foreground uppercase">{item.product_name}</span>
                            <span className="text-body-sm-bold font-data-mono text-data-mono text-on-surface-deep uppercase bg-surface-muted w-fit px-sm py-0.5 rounded-xs border border-border-subtle">
                              {item.sku}
                            </span>
                          </div>
                        </td>
                        <td className="px-md py-md text-center text-data-mono font-data-mono text-on-surface-deep">
                          {item.units_sold ?? 0}
                        </td>
                        <td className="px-md py-md text-right text-data-mono font-data-mono text-foreground">
                          {formatNumber(item.revenue ?? 0)}
                        </td>
                        <td
                          className={`px-md py-md text-right font-data-mono text-data-mono ${
                            (item.gross_profit ?? 0) >= 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {(item.gross_profit ?? 0) < 0 ? '-' : '+'}
                          {formatNumber(Math.abs(item.gross_profit ?? 0))}
                        </td>
                        <td className="px-md py-md text-right text-data-mono font-data-mono text-foreground">
                          {formatNumber(item.gross_margin_pct ?? 0)}%
                        </td>
                        <td className="px-md py-md text-right text-data-mono font-data-mono text-on-surface-deep">
                          {formatNumber(item.markup ?? 0)}%
                        </td>
                        <td className="px-lg py-md text-center">
                          <span
                            className={`inline-flex items-center px-sm py-0.5 rounded-xs text-body-sm-bold uppercase border ${
                              PERFORMANCE_TONE[item.performance as string] ??
                              'bg-surface-subtle text-on-surface-deep border-border-subtle'
                            }`}
                          >
                            {item.performance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.length === 0 && (
                <EmptyState
                  icon={PackageSearch}
                  title={t('bi.profitability.products.emptyTitle', 'Sin datos de productos', {})}
                  description={t(
                    'bi.profitability.products.emptyDescription',
                    'No hay rentabilidad registrada para este período.',
                    {},
                  )}
                  actionLabel={t('bi.profitability.action.refresh', 'Actualizar', {})}
                  onAction={refresh}
                />
              )}

              {/* Paginación server-side cableada (antes: botones sin onClick) */}
              <div className="px-lg py-md border-t border-border-subtle flex items-center justify-between bg-surface-muted">
                <p className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.profitability.products.pagination.total', 'Total de registros', {})}:{' '}
                  <span className="text-data-mono font-data-mono">{pagination?.total_items ?? 0}</span>
                </p>
                <div className="flex items-center gap-lg">
                  <span className="text-label-caps uppercase text-on-surface-deep" data-testid="products-pagination-label">
                    {t('bi.profitability.products.pagination.page', 'Página {p} de {t}', {
                      p: currentPage,
                      t: totalPages,
                    })}
                  </span>
                  <div className="flex items-center gap-sm">
                    <button
                      type="button"
                      aria-label={t('bi.profitability.products.pagination.prev', 'Página anterior', {})}
                      data-testid="products-prev"
                      disabled={currentPage <= 1}
                      onClick={() => goToPage(currentPage - 1)}
                      className="size-9 flex items-center justify-center rounded-button border border-border-subtle bg-surface text-on-surface-deep disabled:opacity-30 hover:bg-surface-muted transition-colors duration-150"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('bi.profitability.products.pagination.next', 'Página siguiente', {})}
                      data-testid="products-next"
                      disabled={currentPage >= totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                      className="size-9 flex items-center justify-center rounded-button border border-border-subtle bg-surface text-primary disabled:opacity-30 hover:bg-surface-muted transition-colors duration-150"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default ProductProfitability
