import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  Clock,
  Landmark,
  ListChecks,
  Percent,
  Receipt,
  Timer,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import { BiPeriodSelector } from '@/components/bi/BiPeriodSelector'
import {
  AgingBucketsPanel,
  PaymentSchedulePanel,
  PaymentTrendTable,
  PayablesKpiLedger,
  PayablesPageLayout,
  PayablesRefreshButton,
  TopSuppliersTable,
  usePayablesOverview,
  usePayablesPeriod,
  usePayablesSchedule,
  usePayablesStatistics,
  useTopSuppliers,
  type PayablesKpiItem,
  type PayablesKpiTone,
} from '@/features/payables'
import { formatRange, parseStatisticsRange } from '@/domain/payables/format'
import { paymentTrendRows } from '@/domain/payables/statistics'
import {
  buildPeriodKpis,
  buildPortfolioKpis,
  formatKpiValue,
} from '@/domain/payables/overview'
import { PAYABLES_SCHEDULE_DAYS } from '@/domain/payables/constants'
import type { PayablesKpiValue } from '@/domain/payables/overview'

interface KpiMeta {
  icon: LucideIcon
  tone: PayablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const PORTFOLIO_META: Record<string, KpiMeta> = {
  pending: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'payables.dashboard.portfolioKpis.pending',
    label: 'Saldo pendiente',
    hintKey: 'payables.dashboard.portfolioHints.pending',
    hint: 'Órdenes no canceladas con saldo',
  },
  overdue: {
    icon: AlertTriangle,
    tone: 'error',
    labelKey: 'payables.dashboard.portfolioKpis.overdue',
    label: 'Saldo vencido',
    hintKey: 'payables.dashboard.portfolioHints.overdue',
    hint: 'Vencimiento posterior a hoy',
  },
  accounts: {
    icon: ListChecks,
    tone: 'secondary',
    labelKey: 'payables.dashboard.portfolioKpis.accounts',
    label: 'Cuentas con saldo',
    hintKey: 'payables.dashboard.portfolioHints.accounts',
    hint: 'Órdenes con importe pendiente',
  },
  overdueAccounts: {
    icon: AlertTriangle,
    tone: 'warning',
    labelKey: 'payables.dashboard.portfolioKpis.overdueAccounts',
    label: 'Cuentas vencidas',
    hintKey: 'payables.dashboard.portfolioHints.overdueAccounts',
    hint: 'Con vencimiento anterior a hoy',
  },
  dueThisWeek: {
    icon: CalendarDays,
    tone: 'warning',
    labelKey: 'payables.dashboard.portfolioKpis.dueThisWeek',
    label: 'Vence esta semana',
    hintKey: 'payables.dashboard.portfolioHints.dueThisWeek',
    hint: 'Próximos 7 días',
  },
  dueThisMonth: {
    icon: CalendarClock,
    tone: 'secondary',
    labelKey: 'payables.dashboard.portfolioKpis.dueThisMonth',
    label: 'Vence este mes',
    hintKey: 'payables.dashboard.portfolioHints.dueThisMonth',
    hint: 'Próximos 30 días',
  },
  paymentRate: {
    icon: Percent,
    tone: 'secondary',
    labelKey: 'payables.dashboard.portfolioKpis.paymentRate',
    label: 'Tasa de pago histórica',
    hintKey: 'payables.dashboard.portfolioHints.paymentRate',
    hint: 'Pagado / comprado sobre todas las órdenes',
  },
  settledAge: {
    icon: Timer,
    tone: 'neutral',
    labelKey: 'payables.dashboard.portfolioKpis.settledAge',
    label: 'Antigüedad media (saldadas)',
    hintKey: 'payables.dashboard.portfolioHints.settledAge',
    hint: 'Días desde la compra en las órdenes saldadas',
  },
}

const PERIOD_META: Record<string, KpiMeta> = {
  purchased: {
    icon: Receipt,
    tone: 'primary',
    labelKey: 'payables.dashboard.periodKpis.purchased',
    label: 'Compras del período',
    hintKey: 'payables.dashboard.periodHints.purchased',
    hint: 'Total de órdenes del rango',
  },
  paid: {
    icon: CircleDollarSign,
    tone: 'success',
    labelKey: 'payables.dashboard.periodKpis.paid',
    label: 'Pagos del período',
    hintKey: 'payables.dashboard.periodHints.paid',
    hint: 'Pagos aplicados a esas órdenes',
  },
  periodPaymentRate: {
    icon: Percent,
    tone: 'secondary',
    labelKey: 'payables.dashboard.periodKpis.paymentRate',
    label: 'Tasa de pago del período',
    hintKey: 'payables.dashboard.periodHints.paymentRate',
    hint: 'Pagado / comprado del rango',
  },
  periodDpo: {
    icon: Clock,
    tone: 'warning',
    labelKey: 'payables.dashboard.periodKpis.dpo',
    label: 'Días hasta el primer pago',
    hintKey: 'payables.dashboard.periodHints.dpo',
    hint: 'Sin pago cuenta hasta hoy',
  },
  periodOverdueShare: {
    icon: AlertTriangle,
    tone: 'error',
    labelKey: 'payables.dashboard.periodKpis.overdueShare',
    label: 'Vencido del período',
    hintKey: 'payables.dashboard.periodHints.overdueShare',
    hint: 'Saldo vencido / comprado del rango',
  },
}

const periodLabels = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  year: 'Este año',
} as const

/**
 * F8 — Dashboard de Cuentas por Pagar. Todas las cifras salen de
 * `/payables/overview`, `/payables/statistics`, `/payables/schedule` y
 * `/payables/top-suppliers`; cada card aísla su error (un endpoint caído no
 * tumba el dashboard).
 */
const PayablesDashboardPage = () => {
  const { t, lang } = useI18n()
  const { period, setPeriod } = usePayablesPeriod()
  const overview = usePayablesOverview()
  const schedule = usePayablesSchedule(PAYABLES_SCHEDULE_DAYS)
  const topSuppliers = useTopSuppliers()
  const statistics = usePayablesStatistics(period)

  const errorTitle = t('payables.errors.title', 'No se pudieron cargar los datos')

  const toItems = (values: PayablesKpiValue[], meta: Record<string, KpiMeta>): PayablesKpiItem[] =>
    values.map((row) => {
      const item = meta[row.id]
      return {
        id: row.id,
        icon: item.icon,
        tone: item.tone,
        label: t(item.labelKey, item.label),
        hint: t(item.hintKey, item.hint),
        value: formatKpiValue(row, lang),
      }
    })

  const range = statistics.data ? parseStatisticsRange(statistics.data.period) : null
  const trendRows = paymentTrendRows(statistics.data?.payment_trend, range)
  const periodOptions = {
    today: t('payables.period.today', periodLabels.today),
    week: t('payables.period.week', periodLabels.week),
    month: t('payables.period.month', periodLabels.month),
    year: t('payables.period.year', periodLabels.year),
  }

  return (
    <PayablesPageLayout
      title={t('payables.dashboard.title', 'Cuentas por pagar')}
      subtitle={t(
        'payables.dashboard.subtitle',
        'Saldo pendiente, vencimientos y comportamiento de pago a hoy.',
      )}
      actions={<PayablesRefreshButton />}
    >
      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('payables.dashboard.portfolioTitle', 'Cartera')}
          description={t(
            'payables.dashboard.portfolioDescription',
            'Snapshot a hoy. El vencimiento que usa el sistema es la fecha de compra + 30 días.',
          )}
          testId="payables-portfolio-card"
        >
          <QueryBoundary
            isLoading={overview.isLoading}
            error={overview.error}
            errorTitle={errorTitle}
            onRetry={() => void overview.refetch()}
            skeleton={<PanelSkeleton rows={8} />}
          >
            {overview.data ? (
              <PayablesKpiLedger
                items={toItems(buildPortfolioKpis(overview.data), PORTFOLIO_META)}
                testId="payables-portfolio-kpis"
              />
            ) : null}
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('payables.dashboard.agingTitle', 'Antigüedad de la deuda')}
          description={t(
            'payables.dashboard.agingDescription',
            'Tramos medidos desde la fecha de compra, no desde el vencimiento.',
          )}
          testId="payables-aging-card"
        >
          <QueryBoundary
            isLoading={overview.isLoading}
            error={overview.error}
            errorTitle={errorTitle}
            onRetry={() => void overview.refetch()}
            skeleton={<PanelSkeleton rows={4} />}
          >
            {overview.data ? (
              <AgingBucketsPanel summary={overview.data.aging_summary} />
            ) : null}
          </QueryBoundary>
        </SectionCard>
      </div>

      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('payables.dashboard.periodTitle', 'Compras y pagos del período')}
          description={
            range
              ? t('payables.dashboard.periodRange', 'Rango aplicado: {range}', {
                  range: formatRange(range.start, range.end, lang),
                })
              : t(
                  'payables.dashboard.periodDescription',
                  'El rango lo resuelve el backend según el período elegido.',
                )
          }
          testId="payables-period-card"
        >
          <div className="mb-md flex justify-end">
            <BiPeriodSelector
              value={period}
              onChange={setPeriod}
              label={t('payables.period.aria', 'Período de las estadísticas')}
              optionLabels={periodOptions}
            />
          </div>
          <QueryBoundary
            isLoading={statistics.isLoading}
            error={statistics.error}
            errorTitle={errorTitle}
            onRetry={() => void statistics.refetch()}
            skeleton={<PanelSkeleton rows={5} />}
          >
            {statistics.data ? (
              <PayablesKpiLedger
                items={toItems(buildPeriodKpis(statistics.data), PERIOD_META)}
                testId="payables-period-kpis"
              />
            ) : null}
          </QueryBoundary>
        </SectionCard>

        <TableCard
          title={t('payables.dashboard.scheduleTitle', 'Próximos vencimientos')}
          description={t(
            'payables.dashboard.scheduleDescription',
            'Cuentas que vencen en los próximos {days} días (compra + 30 días).',
            { days: PAYABLES_SCHEDULE_DAYS },
          )}
          testId="payables-schedule-card"
        >
          <div className="px-lg pb-lg">
            <QueryBoundary
              isLoading={schedule.isLoading}
              error={schedule.error}
              errorTitle={errorTitle}
              onRetry={() => void schedule.refetch()}
              skeleton={<TableSkeleton rows={4} />}
            >
              {schedule.data ? <PaymentSchedulePanel calendar={schedule.data} /> : null}
            </QueryBoundary>
          </div>
        </TableCard>
      </div>

      <div className="grid gap-lg xl:grid-cols-2">
        <TableCard
          title={t('payables.dashboard.topSuppliersTitle', 'Proveedores con mayor deuda')}
          description={t(
            'payables.dashboard.topSuppliersDescription',
            'Saldo a hoy. El comportamiento de esta tabla se deriva de la proporción vencida.',
          )}
          testId="payables-top-suppliers-card"
        >
          <QueryBoundary
            isLoading={topSuppliers.isLoading}
            error={topSuppliers.error}
            errorTitle={errorTitle}
            onRetry={() => void topSuppliers.refetch()}
            skeleton={<TableSkeleton rows={5} />}
          >
            {topSuppliers.data ? <TopSuppliersTable suppliers={topSuppliers.data} /> : null}
          </QueryBoundary>
        </TableCard>

        <TableCard
          title={t('payables.dashboard.trendTitle', 'Compras y pagos por semana')}
          description={t(
            'payables.dashboard.trendDescription',
            'Semanas calendario del rango (hasta 12, desde el inicio). El acumulado es compras − pagos.',
          )}
          testId="payables-trend-card"
        >
          <QueryBoundary
            isLoading={statistics.isLoading}
            error={statistics.error}
            errorTitle={errorTitle}
            onRetry={() => void statistics.refetch()}
            skeleton={<TableSkeleton rows={4} />}
            isEmpty={trendRows.length === 0}
            empty={
              <TableEmptyState
                icon={Landmark}
                title={t('payables.dashboard.trendEmpty', 'Sin semanas con movimientos')}
                description={t(
                  'payables.dashboard.trendEmptyHint',
                  'No hubo compras ni pagos en el rango aplicado.',
                )}
              />
            }
          >
            <PaymentTrendTable rows={trendRows} />
          </QueryBoundary>
        </TableCard>
      </div>
    </PayablesPageLayout>
  )
}

export default PayablesDashboardPage
