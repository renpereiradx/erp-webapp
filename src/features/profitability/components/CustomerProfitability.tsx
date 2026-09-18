import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { AlertTriangle, BarChart3, ChevronLeft, ChevronRight, CreditCard, RefreshCcw, Trophy, Users } from 'lucide-react'
import { formatNumber } from '@/utils/currencyUtils'
import { clampPage } from '@/domain/sales-analytics/format'
import { useProfitability } from '../hooks/useProfitability'
import KpiCard from './KpiCard'
import ProfitabilitySkeleton from './ProfitabilitySkeleton'
import type { CustomerProfitabilityData } from '../types'

/**
 * Cartera de clientes (GET /profitability/customers).
 * Migración FASE 2 (PLAN_ALINEACION_BI_FRONTEND): .tsx + FSD + tokens +
 * i18n. Cableada la paginación server-side; eliminados el Exportar, el
 * botón "Periodo" decorativo, el buscador sin estado y los botones de
 * contacto (Mail/Teléfono) sin handler (§2.6).
 */

const SEGMENT_TONE: Record<string, string> = {
  PLATINUM: 'bg-secondary/10 text-secondary border-secondary/20',
  GOLD: 'bg-warning/10 text-warning border-warning/20',
  SILVER: 'bg-surface-subtle text-on-surface-deep border-border-subtle',
  BRONZE: 'bg-tertiary/10 text-tertiary border-tertiary/20',
}

const SegmentBadge = ({ segment }: { segment?: string }) => (
  <span
    className={`inline-flex items-center rounded-xs px-sm py-0.5 text-body-sm-bold border uppercase tracking-wide ${
      SEGMENT_TONE[segment as string] ?? SEGMENT_TONE.SILVER
    }`}
  >
    {segment}
  </span>
)

const CustomerProfitability = () => {
  const { t } = useI18n()
  const [params, setParams] = useState({ period: 'month', page: 1 })
  const { data, loading, error, refresh } = useProfitability<CustomerProfitabilityData>('getCustomers', params)

  const customers = data?.customers ?? []
  const summary = data?.summary

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.profitability.breadcrumb', 'Rentabilidad', {})}
          title={t('bi.profitability.customers.title', 'Cartera de Clientes', {})}
          subtitle={t(
            'bi.profitability.customers.subtitle',
            'Análisis de contribución marginal y segmentación estratégica. Identifique clientes clave bajo la metodología Pareto.',
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
                title={t('bi.profitability.customers.kpi.activeCustomers', 'Clientes Activos', {})}
                value={summary?.active_customers}
                trendValue={summary?.active_customers_growth}
                icon={Users}
                tone="primary"
                testId="kpi-active-customers"
              />
              <KpiCard
                title={t('bi.profitability.customers.kpi.avgTicket', 'Ticket Promedio', {})}
                value={summary?.average_customer_value}
                trendValue={summary?.avg_value_growth}
                icon={CreditCard}
                tone="success"
                testId="kpi-avg-ticket"
              />
              <KpiCard
                title={t('bi.profitability.customers.kpi.paretoShare', 'Contribución Pareto', {})}
                value={summary?.top_customers_pct}
                trendValue={summary?.top_customers_variation}
                isCurrency={false}
                icon={BarChart3}
                isAnchor
                testId="kpi-pareto"
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg mt-xl">
              {/* Desglose operativo */}
              <section className="lg:col-span-3 bg-surface rounded-md shadow-whisper overflow-hidden">
                <div className="px-lg py-md border-b border-border-subtle bg-surface-muted">
                  <h2 className="text-label-caps uppercase text-foreground">
                    {t('bi.profitability.customers.table.title', 'Desglose Operativo de Cartera', {})}
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-surface-muted text-on-surface-deep text-label-caps uppercase border-b border-border-subtle">
                        <th className="px-lg py-md">{t('bi.profitability.customers.col.customer', 'Cliente / Identificador', {})}</th>
                        <th className="px-md py-md">{t('bi.profitability.customers.col.segment', 'Segmento', {})}</th>
                        <th className="px-md py-md text-center">{t('bi.profitability.customers.col.purchases', 'Compras', {})}</th>
                        <th className="px-md py-md text-right">{t('bi.profitability.customers.col.revenue', 'Ingresos', {})}</th>
                        <th className="px-lg py-md text-right">{t('bi.profitability.customers.col.grossMargin', 'M. Bruto %', {})}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {customers.map((c) => (
                        <tr key={c.customer_id} className="hover:bg-surface-muted transition-colors duration-150">
                          <td className="px-lg py-md">
                            <div className="flex flex-col gap-xs">
                              <span className="text-body-md-bold text-foreground uppercase">{c.customer_name}</span>
                              <span className="text-body-sm-bold font-data-mono text-data-mono text-on-surface-deep uppercase bg-surface-muted w-fit px-sm py-0.5 rounded-xs border border-border-subtle">
                                REF: {c.customer_id}
                              </span>
                            </div>
                          </td>
                          <td className="px-md py-md">
                            <SegmentBadge segment={c.segment} />
                          </td>
                          <td className="px-md py-md text-center text-data-mono font-data-mono text-on-surface-deep">
                            {c.total_purchases ?? 0}
                          </td>
                          <td className="px-md py-md text-right text-data-mono font-data-mono text-foreground">
                            {formatNumber(c.total_revenue ?? 0)}
                          </td>
                          <td className="px-lg py-md">
                            <div className="flex flex-col items-end gap-xs">
                              <span className="text-body-md font-data-mono text-data-mono text-success">
                                {formatNumber(c.gross_margin_pct ?? 0)}%
                              </span>
                              <div className="w-24 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                                <div
                                  className="bg-success h-full transition-all duration-300"
                                  style={{ width: `${c.gross_margin_pct ?? 0}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {customers.length === 0 && (
                  <EmptyState
                    icon={Users}
                    title={t('bi.profitability.customers.emptyTitle', 'Sin datos de clientes', {})}
                    description={t(
                      'bi.profitability.customers.emptyDescription',
                      'No hay cartera registrada para este período.',
                      {},
                    )}
                    actionLabel={t('bi.profitability.action.refresh', 'Actualizar', {})}
                    onAction={refresh}
                  />
                )}

                <div className="px-lg py-md border-t border-border-subtle bg-surface-muted flex justify-between items-center">
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('bi.profitability.customers.pagination.page', 'Página {p}', { p: params.page })}
                  </p>
                  <div className="flex items-center gap-sm">
                    <button
                      type="button"
                      aria-label={t('bi.profitability.products.pagination.prev', 'Página anterior', {})}
                      data-testid="customers-prev"
                      disabled={params.page <= 1}
                      onClick={() => setParams((prev) => ({ ...prev, page: clampPage(prev.page - 1, null) }))}
                      className="size-9 flex items-center justify-center rounded-button border border-border-subtle bg-surface text-on-surface-deep disabled:opacity-30 hover:bg-surface-muted transition-colors duration-150"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('bi.profitability.products.pagination.next', 'Página siguiente', {})}
                      data-testid="customers-next"
                      onClick={() => setParams((prev) => ({ ...prev, page: prev.page + 1 }))}
                      className="size-9 flex items-center justify-center rounded-button border border-border-subtle bg-surface text-primary hover:bg-surface-muted transition-colors duration-150"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Side panels */}
              <div className="lg:col-span-1 flex flex-col gap-lg">
                <section className="bg-surface rounded-md shadow-whisper overflow-hidden" data-testid="platinum-panel">
                  <div className="px-md py-md border-b border-border-subtle bg-surface-muted">
                    <h2 className="text-label-caps uppercase text-foreground flex items-center gap-sm">
                      <Trophy className="w-4 h-4 text-warning" />
                      {t('bi.profitability.customers.elite.title', 'Elite Platinum', {})}
                    </h2>
                  </div>
                  <div className="p-md flex flex-col gap-md">
                    {customers.slice(0, 3).map((c, i) => (
                      <div key={c.customer_id} className="flex items-center justify-between gap-sm">
                        <div className="flex items-center gap-sm min-w-0">
                          <span className="text-title-md font-data-mono text-data-mono text-on-surface-deep leading-none">
                            {i + 1}
                          </span>
                          <div className="flex flex-col gap-xs min-w-0">
                            <span className="text-body-sm-bold text-foreground uppercase truncate">{c.customer_name}</span>
                            <span className="text-body-sm-bold font-data-mono text-data-mono text-success uppercase">
                              {formatNumber(c.gross_profit ?? 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {customers.length === 0 && (
                      <p className="text-label-caps uppercase text-on-surface-deep text-center py-sm">
                        {t('bi.profitability.customers.elite.empty', 'Sin datos de ranking', {})}
                      </p>
                    )}
                  </div>
                </section>

                <section className="bg-surface rounded-md shadow-whisper overflow-hidden" data-testid="retention-panel">
                  <div className="px-md py-md border-b border-border-subtle bg-error/5">
                    <h2 className="text-label-caps uppercase text-error flex items-center gap-sm">
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                      {t('bi.profitability.customers.retention.title', 'Retención Crítica', {})}
                    </h2>
                  </div>
                  <div className="p-md">
                    <div className="p-md rounded-md bg-surface-muted border border-border-subtle flex justify-between items-center">
                      <div className="flex flex-col gap-xs">
                        <span className="text-body-sm-bold text-foreground uppercase">
                          {t('bi.profitability.customers.retention.inactive', 'Inactivos Riesgo', {})}
                        </span>
                        <span className="text-body-sm-bold font-data-mono text-data-mono text-error uppercase">
                          {summary?.inactive_risk_customers ?? 0}{' '}
                          {t('bi.profitability.customers.retention.customers', 'Clientes', {})}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CustomerProfitability
