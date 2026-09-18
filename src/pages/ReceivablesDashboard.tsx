import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import ErrorState from '@/components/ui/ErrorState'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import { RefreshCcw, CircleDollarSign, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatPYG } from '@/utils/currencyUtils'
import { useReceivablesDashboard } from '@/features/receivables/hooks/useReceivablesDashboard'
import SummaryCardsGrid from '@/features/receivables/components/SummaryCardsGrid'
import AgingSummaryChart from '@/features/receivables/components/AgingSummaryChart'
import RecentInvoicesTable from '@/features/receivables/components/RecentInvoicesTable'

/**
 * Dashboard de CxC.
 * Migración FASE 3: .tsx + PageHeader + 3 estados (el legacy ignoraba el
 * error del hook). El SVG artesanal de tendencia (con puntos fabricados
 * `|| 20/40/60/80` cuando faltaban datos y tope fijo de 4 semanas) es hoy
 * un AreaChart de recharts 100% data-driven.
 */

interface CollectionTrendItem {
  date?: string
  collected?: number
}

const ReceivablesDashboard = () => {
  const { t } = useI18n()
  const { summary, aging, recentInvoices, loading, error, refresh } = useReceivablesDashboard()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const trendItems = (Array.isArray(summary?.collectionTrend) ? summary?.collectionTrend : []) as CollectionTrendItem[]
  const totalCollected = trendItems.reduce((acc, curr) => acc + (curr.collected ?? 0), 0)
  const chartData = trendItems.map((item) => ({
    name: item.date ?? '',
    collected: item.collected ?? 0,
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.receivables.breadcrumb', 'Cuentas por Cobrar', {})}
          title={t('receivables.master.title', 'Cuentas por Cobrar', {})}
          subtitle={t('bi.receivables.dashboard.subtitle', 'Resumen general de cartera y cobranzas', {})}
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

        {loading && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="receivables-dashboard-skeleton">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
              ))}
            </div>
            <div className="h-72 bg-surface-muted rounded-md animate-pulse" />
            <GenericSkeletonList count={5} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.receivables.dashboard.errorTitle', 'No se pudo cargar el dashboard de CxC', {})}
              message={error}
              onRetry={refresh}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPIs */}
            <section className="mt-lg">
              <SummaryCardsGrid summary={summary ?? undefined} />
            </section>

            {/* Main Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mt-lg">
              <div className="lg:col-span-2">
                <div className="rounded-md bg-surface p-md shadow-whisper border border-border-subtle h-full overflow-hidden transition-shadow hover:shadow-fluent-8">
                  <div className="flex items-start justify-between mb-lg">
                    <div>
                      <h3 className="text-title-md text-foreground tracking-tight">
                        {t('bi.receivables.dashboard.trend.title', 'Tendencia de Cobranza', {})}
                      </h3>
                      <p className="text-body-sm-bold text-on-surface-deep uppercase mt-0.5">
                        {t('bi.receivables.dashboard.trend.subtitle', 'Rendimiento de las últimas semanas', {})}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-title-md font-data-mono text-data-mono text-foreground">
                        {formatPYG(totalCollected, { compact: true })}
                      </p>
                      <p className="text-label-caps uppercase text-success mt-xs">
                        {t('bi.receivables.dashboard.trend.totalCollected', 'Total Cobrado (Período)', {})}
                      </p>
                    </div>
                  </div>

                  <div className="relative h-[280px] w-full">
                    {chartData.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-sm">
                        <TrendingUp className="text-on-surface-deep" size={32} />
                        <p className="text-body-md-bold text-on-surface-deep">
                          {t('bi.receivables.dashboard.trend.empty', 'Sin historial de cobranza para el período.', {})}
                        </p>
                        <p className="text-label-caps uppercase text-on-surface-deep">
                          {t('bi.receivables.dashboard.trend.emptyHint', 'La tendencia se muestra al registrar cobros', {})}
                        </p>
                      </div>
                    ) : (
                      isClient && (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-divider" />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: 'var(--color-on-surface-deep)' }}
                              dy={8}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              width={64}
                              tick={{ fontSize: 11, fill: 'var(--color-on-surface-deep)' }}
                              tickFormatter={(v: number) => formatPYG(v, { compact: true, showSymbol: false })}
                            />
                            <Tooltip
                              formatter={(value) => formatPYG(Number(value))}
                              contentStyle={{
                                borderRadius: 8,
                                border: '1px solid var(--color-border-subtle)',
                                fontSize: 12,
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-foreground)',
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="collected"
                              name={t('bi.receivables.bvc.collected', 'Cobrado', {})}
                              className="stroke-primary"
                              strokeWidth={2.5}
                              fill="var(--color-primary)"
                              fillOpacity={0.15}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <AgingSummaryChart agingData={aging as never} />
              </div>
            </div>

            {/* Facturas Recientes */}
            <section className="mt-lg">
              <RecentInvoicesTable invoices={recentInvoices} />
            </section>

            <p className="flex items-center gap-xs mt-lg text-label-caps uppercase text-on-surface-deep">
              <CircleDollarSign size={14} className="shrink-0" />
              {t('bi.receivables.dashboard.hint', 'La tasa de cobranza se calcula sobre la cartera total del período.', {})}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default ReceivablesDashboard
