import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import { buildVelocityKpis } from '@/domain/sales-analytics/velocity'
import { granularityForPeriod } from '@/domain/sales-analytics/periods'
import {
  HourlyProfile,
  ProductVelocityTable,
  SalesPageLayout,
  SalesPeriodSelector,
  SalesRefreshButton,
  TableCard,
  TrendSection,
  useSalesByDayOfWeek,
  useSalesByHour,
  useSalesPeriod,
  useSalesTrends,
  useSalesVelocity,
  VelocityKpis,
  WeekdayProfile,
} from '@/features/sales-analytics'

/**
 * F4 — Tendencias y velocidad: serie del período, ritmo de venta, perfil
 * horario y semanal. La hora pico y el mejor día salen del payload; el
 * heatmap queda en la landing de F2 (`/dashboard/sales-heatmap`), que usa su
 * propio endpoint.
 */
const TrendsVelocityPage = () => {
  const { t } = useI18n()
  const { period } = useSalesPeriod()
  const granularity = granularityForPeriod(period)

  const trendsQuery = useSalesTrends(period, granularity)
  const velocityQuery = useSalesVelocity(period)
  const hourlyQuery = useSalesByHour(period)
  const weekdayQuery = useSalesByDayOfWeek(period)

  const velocityRows = buildVelocityKpis(velocityQuery.data?.overall)
  const errorTitle = t('salesAnalytics.errors.title', 'No se pudieron cargar los datos')

  return (
    <SalesPageLayout
      title={t('salesAnalytics.trends.title', 'Tendencias y velocidad')}
      subtitle={t(
        'salesAnalytics.trends.subtitle',
        'Evolución y ritmo.',
      )}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <SalesPeriodSelector />
          <SalesRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('salesAnalytics.velocity.title', 'Velocidad de venta')}
        description={t(
          'salesAnalytics.velocity.subtitle',
          'Ritmo promedio del período completo, incluidas las horas sin ventas.',
        )}
        testId="sales-velocity-kpis"
      >
        <QueryBoundary
          isLoading={velocityQuery.isLoading}
          error={velocityQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void velocityQuery.refetch()}
          skeleton={<PanelSkeleton rows={5} testId="sales-velocity-skeleton" />}
        >
          <VelocityKpis rows={velocityRows} />
        </QueryBoundary>
      </SectionCard>

      <SectionCard
        title={t('salesAnalytics.trends.seriesTitle', 'Serie de ventas')}
        description={t(
          'salesAnalytics.trends.seriesSubtitle',
          'Serie de ventas y resumen del período.',
        )}
        testId="sales-trends-card"
      >
        <QueryBoundary
          isLoading={trendsQuery.isLoading}
          error={trendsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void trendsQuery.refetch()}
          skeleton={<TableSkeleton rows={6} testId="sales-trends-skeleton" />}
        >
          <TrendSection trends={trendsQuery.data?.trends} granularity={granularity} />
        </QueryBoundary>
      </SectionCard>

      {/* Perfiles complementarios: hora fija 0-23 y día de la semana. */}
      <div className="grid items-start gap-xl xl:grid-cols-2">
        <div className="min-w-0">
          <SectionCard
            title={t('salesAnalytics.velocity.hourlyTitle', 'Ventas por hora')}
            description={t(
              'salesAnalytics.velocity.hourlySubtitle',
              'Distribución horaria del período; la hora pico la calcula el servidor.',
            )}
            testId="sales-hourly-card"
          >
            <QueryBoundary
              isLoading={hourlyQuery.isLoading}
              error={hourlyQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void hourlyQuery.refetch()}
              skeleton={<PanelSkeleton rows={4} testId="sales-hourly-skeleton" />}
            >
              <HourlyProfile
                hourly={hourlyQuery.data?.hourly ?? []}
                peakHour={hourlyQuery.data?.peakHour ?? 0}
                peakSales={hourlyQuery.data?.peakSales ?? 0}
              />
            </QueryBoundary>
          </SectionCard>
        </div>

        <div className="min-w-0">
          <SectionCard
            title={t('salesAnalytics.velocity.weekdayTitle', 'Ventas por día')}
            description={t(
              'salesAnalytics.velocity.weekdaySubtitle',
              'Distribución semanal (domingo a sábado) del período.',
            )}
            testId="sales-weekday-card"
          >
            <QueryBoundary
              isLoading={weekdayQuery.isLoading}
              error={weekdayQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void weekdayQuery.refetch()}
              skeleton={<PanelSkeleton rows={4} testId="sales-weekday-skeleton" />}
            >
              <WeekdayProfile daily={weekdayQuery.data?.daily ?? []} />
            </QueryBoundary>
          </SectionCard>
        </div>
      </div>

      <TableCard
        title={t('salesAnalytics.velocity.productsTitle', 'Productos por velocidad')}
        description={t(
          'salesAnalytics.velocity.productsSubtitle',
          'Los 20 productos con más unidades vendidas por día.',
        )}
        testId="sales-velocity-products-card"
      >
        <QueryBoundary
          isLoading={velocityQuery.isLoading}
          error={velocityQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void velocityQuery.refetch()}
          skeleton={<TableSkeleton rows={6} testId="sales-velocity-products-skeleton" />}
        >
          <ProductVelocityTable products={velocityQuery.data?.byProduct ?? []} />
        </QueryBoundary>
      </TableCard>
    </SalesPageLayout>
  )
}

export default TrendsVelocityPage
