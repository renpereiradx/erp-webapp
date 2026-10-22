import { CalendarDays, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/DataSkeletons'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount, formatHour, formatMoney, formatPercent } from '@/domain/sales-analytics/format'
import { purchaseGranularityForPeriod } from '@/domain/purchase-analytics/periods'
import {
  PurchasePageLayout,
  PurchasePeriodSelector,
  PurchaseRefreshButton,
  PurchaseTable,
  PurchaseTrendSection,
  usePurchasePeriod,
  usePurchasesByDayOfWeek,
  usePurchasesByHour,
  usePurchaseTrends,
} from '@/features/purchase-analytics'

/**
 * Tendencias de compras: serie del período con granularidad derivada y
 * perfil horario/semanal de las órdenes (`peak_hour` y `best_day` salen del
 * payload, nunca hardcodeados).
 */
const PurchaseTrendsPage = () => {
  const { t } = useI18n()
  const { period } = usePurchasePeriod()
  const granularity = purchaseGranularityForPeriod(period)

  const trendsQuery = usePurchaseTrends(period, granularity)
  const hourlyQuery = usePurchasesByHour(period)
  const weekdayQuery = usePurchasesByDayOfWeek(period)

  const hourly = hourlyQuery.data?.hourly ?? []
  const daily = weekdayQuery.data?.daily ?? []
  const maxHourly = hourly.reduce((max, row) => Math.max(max, Number(row.purchases) || 0), 0)
  const errorTitle = t('purchaseAnalytics.errors.title', 'No se pudieron cargar los datos')

  const hourlyColumns = [
    {
      key: 'hour',
      header: t('purchaseAnalytics.columns.hour', 'Hora'),
      render: (row: (typeof hourly)[number]) => formatHour(row.hour),
      mono: true,
    },
    {
      key: 'purchases',
      header: t('purchaseAnalytics.columns.purchases', 'Compras'),
      align: 'right' as const,
      render: (row: (typeof hourly)[number]) => {
        const width = maxHourly > 0 ? Math.round(((Number(row.purchases) || 0) / maxHourly) * 100) : 0
        return (
          <div className="flex items-center justify-end gap-sm">
            <span
              className="h-2 w-16 shrink-0 overflow-hidden rounded-full bg-surface-muted"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full bg-primary/60"
                style={{ width: `${width}%` }}
              />
            </span>
            <span className="whitespace-nowrap">{formatMoney(row.purchases)}</span>
          </div>
        )
      },
    },
    {
      key: 'orders',
      header: t('purchaseAnalytics.columns.ordersCount', 'Órdenes'),
      align: 'right' as const,
      render: (row: (typeof hourly)[number]) => formatCount(row.transactions),
    },
    {
      key: 'share',
      header: t('purchaseAnalytics.columns.share', 'Participación'),
      align: 'right' as const,
      render: (row: (typeof hourly)[number]) => formatPercent(row.percentage),
    },
  ]

  const weekdayColumns = [
    {
      key: 'day',
      header: t('purchaseAnalytics.columns.day', 'Día'),
      render: (row: (typeof daily)[number]) => row.day_name || '—',
    },
    {
      key: 'purchases',
      header: t('purchaseAnalytics.columns.purchases', 'Compras'),
      align: 'right' as const,
      render: (row: (typeof daily)[number]) => formatMoney(row.purchases),
    },
    {
      key: 'orders',
      header: t('purchaseAnalytics.columns.ordersCount', 'Órdenes'),
      align: 'right' as const,
      render: (row: (typeof daily)[number]) => formatCount(row.transactions),
    },
    {
      key: 'avgOrder',
      header: t('purchaseAnalytics.columns.avgOrder', 'Orden promedio'),
      align: 'right' as const,
      render: (row: (typeof daily)[number]) => formatMoney(row.average_order),
    },
    {
      key: 'share',
      header: t('purchaseAnalytics.columns.share', 'Participación'),
      align: 'right' as const,
      render: (row: (typeof daily)[number]) => formatPercent(row.percentage),
    },
  ]

  return (
    <PurchasePageLayout
      title={t('purchaseAnalytics.trendsPage.title', 'Tendencias de compras')}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <PurchasePeriodSelector />
          <PurchaseRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('purchaseAnalytics.trends.seriesTitle', 'Serie del período')}
        testId="purchase-trends-series"
      >
        <QueryBoundary
          isLoading={trendsQuery.isLoading}
          error={trendsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void trendsQuery.refetch()}
          skeleton={<TableSkeleton rows={8} testId="purchase-trends-page-skeleton" />}
        >
          <PurchaseTrendSection trends={trendsQuery.data?.trends} granularity={granularity} />
        </QueryBoundary>
      </SectionCard>

      <div className="grid items-start gap-xl xl:grid-cols-2">
        <SectionCard
          title={t('purchaseAnalytics.hourly.title', 'Compras por hora')}
          description={
            hourlyQuery.data?.peakHour || hourlyQuery.data?.peakHour === 0
              ? t('purchaseAnalytics.hourly.peak', 'Hora pico: {hour}', {
                  hour: formatHour(hourlyQuery.data.peakHour),
                })
              : undefined
          }
          testId="purchase-hourly"
        >
          <QueryBoundary
            isLoading={hourlyQuery.isLoading}
            error={hourlyQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void hourlyQuery.refetch()}
            skeleton={<TableSkeleton rows={5} testId="purchase-hourly-skeleton" />}
          >
            <PurchaseTable
              columns={hourlyColumns}
              rows={hourly}
              rowKey={(row) => String(row.hour)}
              minWidthClass="min-w-[560px]"
              testId="purchase-hourly-table"
              empty={
                <TableEmptyState
                  icon={Clock}
                  title={t('purchaseAnalytics.hourly.empty', 'Sin compras en el período')}
                  description={t('purchaseAnalytics.hourly.emptyHint', 'Probá con otro período.')}
                />
              }
            />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('purchaseAnalytics.weekday.title', 'Compras por día de la semana')}
          description={
            weekdayQuery.data?.bestDay
              ? t('purchaseAnalytics.weekday.best', 'Mejor día: {day}', {
                  day: weekdayQuery.data.bestDay,
                })
              : undefined
          }
          testId="purchase-weekday"
        >
          <QueryBoundary
            isLoading={weekdayQuery.isLoading}
            error={weekdayQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void weekdayQuery.refetch()}
            skeleton={<TableSkeleton rows={5} testId="purchase-weekday-skeleton" />}
          >
            <PurchaseTable
              columns={weekdayColumns}
              rows={daily}
              rowKey={(row) => String(row.day_of_week)}
              minWidthClass="min-w-[560px]"
              testId="purchase-weekday-table"
              empty={
                <TableEmptyState
                  icon={CalendarDays}
                  title={t('purchaseAnalytics.weekday.empty', 'Sin compras en el período')}
                  description={t('purchaseAnalytics.weekday.emptyHint', 'Probá con otro período.')}
                />
              }
            />
          </QueryBoundary>
        </SectionCard>
      </div>
    </PurchasePageLayout>
  )
}

export default PurchaseTrendsPage
