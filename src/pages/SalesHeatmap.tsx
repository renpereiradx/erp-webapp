import React, { useCallback, useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import ErrorState from '@/components/ui/ErrorState'
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'
import { formatPYG } from '@/utils/currencyUtils'
import { formatTimeInParaguayTimezone } from '@/utils/timeUtils'
import useDashboardStore from '@/store/useDashboardStore'
import { HEATMAP_HOURS, HEATMAP_UI_DAYS, computeMaxSales, getCellIntensity } from '@/domain/dashboard/heatmap'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'

/**
 * Mapa de Calor de Ventas por Hora.
 * Migración FASE 5: .tsx + PageHeader + tokens + loading/error por slice.
 * El widget muerto "Sucursales Activas" (mapa no implementado) y el botón
 * "Ver Todo" sin handler se eliminaron (§2.6).
 */

const ACTIVITY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  sale: { bg: 'bg-success/10', text: 'text-success', icon: 'payments' },
  product: { bg: 'bg-warning/10', text: 'text-warning', icon: 'inventory_2' },
  client: { bg: 'bg-primary/10', text: 'text-primary', icon: 'person' },
  alert: { bg: 'bg-error/10', text: 'text-error', icon: 'error' },
  error: { bg: 'bg-error/10', text: 'text-error', icon: 'error' },
}

const getActivityStyle = (type?: string) =>
  ACTIVITY_STYLES[type || ''] ?? { bg: 'bg-surface-muted', text: 'text-on-surface-deep', icon: 'info' }

const formatActivityDate = (timestamp?: string | null) => {
  if (!timestamp) return 'Reciente'
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Hoy ${timeStr}`
  return `${date.toLocaleDateString([], { day: '2-digit', month: 'short' })} ${timeStr}`
}

const SalesHeatmap = () => {
  const { t } = useI18n()
  const salesHeatmap = useDashboardStore((s) => s.salesHeatmap)
  const summary = useDashboardStore((s) => s.summary) as Record<string, any> | null
  const activities = useDashboardStore((s) => s.activities)
  const fetchSalesHeatmap = useDashboardStore((s) => s.fetchSalesHeatmap)
  const fetchDashboardData = useDashboardStore((s) => s.fetchDashboardData)
  const loading = useDashboardStore((s) => s.loadingBySlice.heatmap)
  const error = useDashboardStore((s) => s.errorBySlice.heatmap)

  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [analysisWeeks, setAnalysisWeeks] = useState(4)

  const loadData = useCallback(async () => {
    fetchSalesHeatmap(analysisWeeks)
    if (!summary) fetchDashboardData()
    setLastUpdate(new Date())
  }, [fetchSalesHeatmap, fetchDashboardData, summary, analysisWeeks])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Data Processing
  const heatmapData = salesHeatmap?.heatmap || []
  const peakTimes = salesHeatmap?.peak_times || []
  const peakTime = peakTimes[0] || { day: '-', hour: '-' }
  const maxSales = computeMaxSales(heatmapData)
  const getIntensity = (uiDayIndex: number, hourLabel: string) =>
    getCellIntensity(heatmapData, maxSales, uiDayIndex, hourLabel)

  const getIntensityClasses = (ratio: number) => {
    if (ratio === 0) return 'bg-primary/5'
    if (ratio <= 0.1) return 'bg-primary/10'
    if (ratio <= 0.2) return 'bg-primary/20'
    if (ratio <= 0.3) return 'bg-primary/30'
    if (ratio <= 0.4) return 'bg-primary/40'
    if (ratio <= 0.5) return 'bg-primary/50'
    if (ratio <= 0.6) return 'bg-primary/60'
    if (ratio <= 0.7) return 'bg-primary/70'
    if (ratio <= 0.8) return 'bg-primary/80'
    if (ratio <= 0.9) return 'bg-primary/90'
    return 'bg-primary text-on-primary shadow-whisper z-10'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.dashboard.breadcrumb', 'Dashboard', {})}
          title={t('bi.dashboard.heatmap.title', 'Mapa de Calor de Ventas por Hora', {})}
          subtitle={t('bi.dashboard.heatmap.subtitle', 'Visualizando picos de actividad e intensidad de ventas.', {})}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <span className="text-body-sm-bold text-on-surface-deep">
                {loading
                  ? t('bi.dashboard.heatmap.updating', 'Actualizando...', {})
                  : `${t('bi.receivables.master.lastUpdate', 'Última actualización', {})}: ${formatTimeInParaguayTimezone(lastUpdate)}`}
              </span>
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150 disabled:opacity-50"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                {t('bi.profitability.action.refresh', 'Actualizar', {})}
              </button>
            </div>
          }
        />

        {loading && !salesHeatmap && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="heatmap-skeleton">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-surface-muted rounded-md animate-pulse" />
            <GenericSkeletonList count={4} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && !salesHeatmap && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.dashboard.heatmap.errorTitle', 'No se pudo cargar el mapa de calor', {})}
              message={error}
              onRetry={loadData}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mt-lg">
              <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8">
                <div className="flex justify-between items-start mb-xs">
                  <p className="text-label-caps uppercase text-on-surface-deep truncate">
                    {t('bi.dashboard.heatmap.revenue', 'Ingresos Totales (Día)', {})}
                  </p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-xs rounded-sm text-body-lg" aria-hidden="true">payments</span>
                </div>
                <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                  {formatPYG(summary?.sales?.total || summary?.sales_today || 0)}
                </p>
                <div className={`flex items-center gap-xs mt-xs text-body-sm-bold ${(summary?.sales?.trend || summary?.revenue_trend || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-body-md" aria-hidden="true">
                    {(summary?.sales?.trend || summary?.revenue_trend || 0) >= 0 ? 'trending_up' : 'trending_down'}
                  </span>
                  <span className="font-data-mono text-data-mono">{Math.abs(summary?.sales?.trend || summary?.revenue_trend || 0)}%</span>
                  <span className="text-on-surface-deep ml-xs">{t('bi.dashboard.heatmap.vsPrevPeriod', 'vs periodo anterior', {})}</span>
                </div>
              </div>

              <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8">
                <div className="flex justify-between items-start mb-xs">
                  <p className="text-label-caps uppercase text-on-surface-deep truncate">
                    {t('bi.dashboard.heatmap.peak', 'Hora Punta (Promedio)', {})}
                  </p>
                  <span className="material-symbols-outlined text-warning bg-warning/10 p-xs rounded-sm text-body-lg" aria-hidden="true">schedule</span>
                </div>
                <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                  {peakTime.day} {peakTime.hour}:00
                </p>
                <div className="flex items-center gap-xs mt-xs text-body-sm-bold text-on-surface-deep">
                  <span>{t('bi.dashboard.heatmap.peakHint', 'Mayor afluencia promedio', {})}</span>
                </div>
              </div>

              <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8">
                <div className="flex justify-between items-start mb-xs">
                  <p className="text-label-caps uppercase text-on-surface-deep truncate">
                    {t('bi.dashboard.heatmap.avgTicket', 'Ticket Promedio', {})}
                  </p>
                  <span className="material-symbols-outlined text-secondary bg-secondary/10 p-xs rounded-sm text-body-lg" aria-hidden="true">receipt_long</span>
                </div>
                <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                  {formatPYG(summary?.sales?.average_ticket || 0)}
                </p>
                <div className="flex items-center gap-xs mt-xs text-body-sm-bold text-success">
                  <span className="material-symbols-outlined text-body-md" aria-hidden="true">auto_graph</span>
                  <span>
                    {t('bi.dashboard.heatmap.txCount', 'Basado en {n} transacciones', { n: summary?.sales?.count || 0 })}
                  </span>
                </div>
              </div>

              <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8">
                <div className="flex justify-between items-start mb-xs">
                  <p className="text-label-caps uppercase text-on-surface-deep truncate">
                    {t('bi.dashboard.heatmap.activeRegisters', 'Cajas Activas', {})}
                  </p>
                  <span className="material-symbols-outlined text-secondary bg-secondary/10 p-xs rounded-sm text-body-lg" aria-hidden="true">storefront</span>
                </div>
                <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight">
                  {summary?.cash_registers?.open_count || 0}
                </p>
                <div className="flex items-center gap-xs mt-xs text-body-sm-bold text-success">
                  <span className="size-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
                  <span>{t('bi.dashboard.heatmap.inOperation', 'En operación ahora', {})}</span>
                </div>
              </div>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-md mt-lg">
              {/* Heatmap Section (Span 9) */}
              <div className="xl:col-span-9 flex flex-col gap-md">
                {/* Heatmap Controls */}
                <div className="bg-surface p-sm rounded-md border border-border-subtle shadow-whisper flex flex-wrap items-center justify-between gap-md">
                  <div className="flex items-center bg-surface-muted rounded-md p-xs">
                    <button
                      type="button"
                      aria-label={t('bi.dashboard.heatmap.weeksMinus', 'Menos semanas', {})}
                      onClick={() => setAnalysisWeeks((prev) => Math.max(1, prev - 1))}
                      className="p-xs hover:bg-surface rounded-sm transition-colors text-on-surface-deep hover:text-primary"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-md text-body-sm-bold text-foreground">
                      {t('bi.dashboard.heatmap.weeksAnalysis', 'Análisis de últimas {n} semanas', { n: analysisWeeks })}
                    </span>
                    <button
                      type="button"
                      aria-label={t('bi.dashboard.heatmap.weeksPlus', 'Más semanas', {})}
                      onClick={() => setAnalysisWeeks((prev) => Math.min(52, prev + 1))}
                      className="p-xs hover:bg-surface rounded-sm transition-colors text-on-surface-deep hover:text-primary"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Heatmap Visualization */}
                <div className="bg-surface p-lg rounded-md border border-border-subtle shadow-whisper overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Legend */}
                    <div className="flex justify-end items-center gap-sm mb-md text-label-caps uppercase text-on-surface-deep">
                      <span>{t('bi.dashboard.heatmap.lowIntensity', 'Baja Intensidad', {})}</span>
                      <div className="h-2 w-24 rounded-full bg-primary/10" aria-hidden="true" />
                      <span>{t('bi.dashboard.heatmap.highIntensity', 'Alta Intensidad', {})}</span>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-[auto_repeat(14,_minmax(0,_1fr))] gap-xs">
                      <div className="h-8" />
                      {HEATMAP_HOURS.map((hour) => (
                        <div key={`header-${hour}`} className="text-center text-label-caps uppercase text-on-surface-deep">
                          {hour}
                        </div>
                      ))}

                      {HEATMAP_UI_DAYS.map((day, dIndex) => (
                        <React.Fragment key={`row-${day}`}>
                          <div className="flex items-center text-label-caps uppercase text-foreground pr-sm h-10">{day}</div>
                          {HEATMAP_HOURS.map((hour) => {
                            const { ratio, sales, label, total_amount } = getIntensity(dIndex, hour)
                            const isPeak = ratio >= 0.95 && ratio > 0
                            const bgClass = getIntensityClasses(ratio)

                            return (
                              <div
                                key={`cell-${day}-${hour}`}
                                title={
                                  ratio > 0
                                    ? `${t('bi.receivables.bvc.collected', 'Cobrado', {})}: ${formatPYG(total_amount ?? 0)} · ${t('bi.payables.invoices.col.id', 'ID Factura', {})}: ${sales}`
                                    : undefined
                                }
                                className={`${bgClass} rounded-sm h-10 group relative cursor-pointer transition-all ${
                                  isPeak ? 'text-on-primary flex items-center justify-center text-body-sm-bold' : ''
                                }`}
                              >
                                {ratio >= 0.6 && !isPeak && (
                                  <span className="text-on-primary flex items-center justify-center h-full w-full text-body-sm-bold">{label}</span>
                                )}
                                {isPeak && t('bi.dashboard.heatmap.peakLabel', 'Peak', {})}
                              </div>
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed (Span 3) */}
              <div className="xl:col-span-3 bg-surface rounded-md border border-border-subtle shadow-whisper flex flex-col h-full">
                <div className="p-sm border-b border-border-subtle flex justify-between items-center bg-surface-muted">
                  <h3 className="text-body-md-bold text-foreground">{t('bi.dashboard.heatmap.activity.title', 'Actividad Reciente', {})}</h3>
                </div>
                <div className="p-sm flex flex-col gap-md overflow-y-auto max-h-[500px]">
                  {activities && activities.length > 0 ? (
                    activities.map((item, index) => {
                      const style = getActivityStyle(item.type)
                      const uniqueKey = item.id ? `activity-${item.id}-${index}` : `activity-idx-${index}`
                      return (
                        <div key={uniqueKey} className="flex gap-sm">
                          <div className={`size-8 rounded-full ${style.bg} ${style.text} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined text-body-sm" aria-hidden="true">{style.icon}</span>
                          </div>
                          <div className="flex flex-col gap-xs">
                            <p className="text-body-md text-foreground leading-snug break-words line-clamp-2">{item.description}</p>
                            <p className="text-label-caps uppercase text-on-surface-deep">
                              {formatActivityDate(item.timestamp || (item as unknown as Record<string, any>).time)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-lg text-center text-body-md text-on-surface-deep">
                      {t('bi.dashboard.heatmap.activity.empty', 'Sin actividad reciente', {})}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SalesHeatmap
