import {
  AlertTriangle,
  CircleDollarSign,
  CreditCard,
  Flame,
  ListChecks,
  Percent,
  Receipt,
  Timer,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import type { Receivable } from '@/types/bi'
import {
  AgingBucketsPanel,
  CollectionTrendTable,
  ReceivablesKpiLedger,
  ReceivablesPageLayout,
  ReceivablesPeriodSelector,
  ReceivablesPriorityBadge,
  ReceivablesRefreshButton,
  ReceivablesStatusBadge,
  ReceivablesTable,
  TopDebtorsTable,
  useReceivablesOverview,
  useReceivablesPeriod,
  useReceivablesRecent,
  useReceivablesStatistics,
  useReceivablesTopDebtors,
  type ReceivablesColumn,
  type ReceivablesKpiItem,
  type ReceivablesKpiTone,
} from '@/features/receivables'
import {
  agingBucketRows,
  agingBucketsTotal,
  unclassifiedAgingAmount,
} from '@/domain/receivables/aging'
import { formatDate, formatMoney, formatRange } from '@/domain/receivables/format'
import { buildPeriodKpis, buildPortfolioKpis, formatKpiValue } from '@/domain/receivables/kpis'
import type { ReceivablesKpiValue } from '@/domain/receivables/kpis'

interface KpiMeta {
  icon: LucideIcon
  tone: ReceivablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const PORTFOLIO_META: Record<string, KpiMeta> = {
  pending: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'receivables.dashboard.portfolioKpis.pending',
    label: 'Saldo pendiente',
    hintKey: 'receivables.dashboard.portfolioHints.pending',
    hint: 'Cuentas con saldo, a hoy',
  },
  overdue: {
    icon: AlertTriangle,
    tone: 'error',
    labelKey: 'receivables.dashboard.portfolioKpis.overdue',
    label: 'Saldo vencido',
    hintKey: 'receivables.dashboard.portfolioHints.overdue',
    hint: 'Vencimiento anterior a hoy',
  },
  accounts: {
    icon: ListChecks,
    tone: 'secondary',
    labelKey: 'receivables.dashboard.portfolioKpis.accounts',
    label: 'Cuentas con saldo',
    hintKey: 'receivables.dashboard.portfolioHints.accounts',
    hint: 'Órdenes con importe pendiente',
  },
  overdueAccounts: {
    icon: AlertTriangle,
    tone: 'warning',
    labelKey: 'receivables.dashboard.portfolioKpis.overdueAccounts',
    label: 'Cuentas vencidas',
    hintKey: 'receivables.dashboard.portfolioHints.overdueAccounts',
    hint: 'Con vencimiento anterior a hoy',
  },
  highPriority: {
    icon: Flame,
    tone: 'error',
    labelKey: 'receivables.dashboard.portfolioKpis.highPriority',
    label: 'Alta prioridad',
    hintKey: 'receivables.dashboard.portfolioHints.highPriority',
    hint: 'Más de 60 días vencidos',
  },
  collectionRate: {
    icon: Percent,
    tone: 'secondary',
    labelKey: 'receivables.dashboard.portfolioKpis.collectionRate',
    label: 'Tasa de cobro histórica',
    hintKey: 'receivables.dashboard.portfolioHints.collectionRate',
    hint: 'Cobrado / facturado sobre todas las ventas',
  },
  settledAge: {
    icon: Timer,
    tone: 'neutral',
    labelKey: 'receivables.dashboard.portfolioKpis.settledAge',
    label: 'Antigüedad media (saldadas)',
    hintKey: 'receivables.dashboard.portfolioHints.settledAge',
    hint: 'Días desde la venta en las cuentas ya saldadas',
  },
}

const PERIOD_META: Record<string, KpiMeta> = {
  billed: {
    icon: Receipt,
    tone: 'primary',
    labelKey: 'receivables.dashboard.periodKpis.billed',
    label: 'Facturado del período',
    hintKey: 'receivables.dashboard.periodHints.billed',
    hint: 'Ventas registradas en el período',
  },
  collected: {
    icon: CircleDollarSign,
    tone: 'success',
    labelKey: 'receivables.dashboard.periodKpis.collected',
    label: 'Cobrado del período',
    hintKey: 'receivables.dashboard.periodHints.collected',
    hint: 'Pagos recibidos en el período',
  },
  periodCollectionRate: {
    icon: Percent,
    tone: 'secondary',
    labelKey: 'receivables.dashboard.periodKpis.periodCollectionRate',
    label: 'Tasa de cobro del período',
    hintKey: 'receivables.dashboard.periodHints.periodCollectionRate',
    hint: 'Cobrado / facturado del período (flujos)',
  },
  periodDso: {
    icon: Timer,
    tone: 'neutral',
    labelKey: 'receivables.dashboard.periodKpis.periodDso',
    label: 'Días hasta el primer pago',
    hintKey: 'receivables.dashboard.periodHints.periodDso',
    hint: 'Promedio desde la venta; sin pago cuenta hasta hoy',
  },
  periodOverdueShare: {
    icon: AlertTriangle,
    tone: 'warning',
    labelKey: 'receivables.dashboard.periodKpis.periodOverdueShare',
    label: 'Vencido del período',
    hintKey: 'receivables.dashboard.periodHints.periodOverdueShare',
    hint: 'Saldo vencido de las ventas del período / facturado',
  },
}

const toKpiItems = (
  rows: ReceivablesKpiValue[],
  meta: Record<string, KpiMeta>,
  t: (key: string, fallback?: string) => string,
  lang: string,
): ReceivablesKpiItem[] =>
  rows.map((row) => {
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

/**
 * F7 — Resumen de Cuentas por Cobrar. La cartera es un snapshot a hoy; el
 * selector de período solo controla "Facturación y cobranzas". Cada sección
 * tiene su propio estado de error: un fallo no envenena el resto (P0 de la
 * auditoría: Promise.all tumbaba la pantalla entera).
 */
const ReceivablesDashboardPage = () => {
  const { t, lang } = useI18n() as unknown as {
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string
    lang: string
  }
  const { period } = useReceivablesPeriod()
  const overviewQuery = useReceivablesOverview()
  const recentQuery = useReceivablesRecent()
  const statisticsQuery = useReceivablesStatistics(period)
  const topDebtorsQuery = useReceivablesTopDebtors()

  const errorTitle = t('receivables.errors.title', 'No se pudieron cargar los datos')
  const overview = overviewQuery.data
  const recent = recentQuery.data
  const statistics = statisticsQuery.data

  const portfolioItems = overview
    ? toKpiItems(
        buildPortfolioKpis(overview, recent?.summary),
        PORTFOLIO_META,
        t,
        lang,
      )
    : []
  const periodItems = statistics
    ? toKpiItems(buildPeriodKpis(statistics.statistics), PERIOD_META, t, lang)
    : []

  const rangeLabel = statistics?.range
    ? t('receivables.dashboard.periodRange', 'Rango aplicado: {range}', {
        range: formatRange(statistics.range.start, statistics.range.end, lang),
      })
    : undefined

  const recentColumns: Array<ReceivablesColumn<Receivable>> = [
    {
      key: 'account',
      mono: true,
      header: t('receivables.columns.account', 'Cuenta'),
      render: (row) => (
        <Link to={`/receivables/detail/${encodeURIComponent(row.id)}`} className="text-primary hover:underline">
          {row.id}
        </Link>
      ),
    },
    {
      key: 'client',
      header: t('receivables.columns.client', 'Cliente'),
      render: (row) => (
        <Link
          to={`/receivables/client-profile/${encodeURIComponent(row.client_id)}`}
          className="text-primary hover:underline"
        >
          {row.client_name || row.client_id}
        </Link>
      ),
    },
    {
      key: 'saleDate',
      mono: true,
      header: t('receivables.columns.saleDate', 'Venta'),
      render: (row) => formatDate(row.sale_date, lang),
    },
    {
      key: 'daysOverdue',
      align: 'right',
      header: t('receivables.columns.daysOverdue', 'Días vencidos'),
      render: (row) => (
        <div className="flex flex-col items-end gap-xs">
          <span className="font-data-mono text-data-mono">{row.days_overdue}</span>
          <ReceivablesPriorityBadge daysOverdue={row.days_overdue} />
        </div>
      ),
    },
    {
      key: 'pending',
      align: 'right',
      header: t('receivables.columns.pending', 'Pendiente'),
      render: (row) => formatMoney(row.pending_amount),
    },
    {
      key: 'status',
      header: t('receivables.columns.status', 'Estado'),
      render: (row) => <ReceivablesStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('receivables.columns.actions', 'Acciones'),
      render: (row) => (
        <Link
          to={`/receivables/detail/${encodeURIComponent(row.id)}`}
          className="text-body-sm-bold text-primary hover:underline"
        >
          {t('receivables.actions.viewDetail', 'Ver detalle')}
        </Link>
      ),
    },
  ]

  return (
    <ReceivablesPageLayout
      title={t('receivables.dashboard.title', 'Cuentas por cobrar')}
      subtitle={t(
        'receivables.dashboard.subtitle',
        'Cartera pendiente, antigüedad y cobranzas reales del sistema.',
      )}
      actions={<ReceivablesRefreshButton />}
    >
      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('receivables.dashboard.portfolioTitle', 'Cartera actual')}
          description={t(
            'receivables.dashboard.portfolioSubtitle',
            'Snapshot a hoy: no depende del período seleccionado.',
          )}
          testId="receivables-portfolio"
        >
          <QueryBoundary
            isLoading={overviewQuery.isLoading || recentQuery.isLoading}
            error={overviewQuery.error ?? recentQuery.error}
            errorTitle={errorTitle}
            onRetry={() => {
              void overviewQuery.refetch()
              void recentQuery.refetch()
            }}
            skeleton={<PanelSkeleton rows={7} testId="receivables-portfolio-skeleton" />}
          >
            <ReceivablesKpiLedger items={portfolioItems} testId="receivables-portfolio-kpis" />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('receivables.dashboard.periodTitle', 'Facturación y cobranzas')}
          description={t(
            'receivables.dashboard.periodSubtitle',
            'Flujos del período seleccionado, no cohortes de esas ventas.',
          )}
          action={<ReceivablesPeriodSelector />}
          testId="receivables-period"
        >
          <QueryBoundary
            isLoading={statisticsQuery.isLoading}
            error={statisticsQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void statisticsQuery.refetch()}
            skeleton={<PanelSkeleton rows={5} testId="receivables-period-skeleton" />}
          >
            <ReceivablesKpiLedger items={periodItems} testId="receivables-period-kpis" />
            {rangeLabel ? (
              <p className="mt-md text-body-sm text-on-surface-deep">{rangeLabel}</p>
            ) : null}
          </QueryBoundary>
        </SectionCard>
      </div>

      <TableCard
        title={t('receivables.dashboard.trendTitle', 'Serie semanal de cobranza')}
        description={t(
          'receivables.dashboard.trendSubtitle',
          'Hasta 12 semanas del período; la primera y la última pueden estar incompletas.',
        )}
        testId="receivables-trend-card"
      >
        <QueryBoundary
          isLoading={statisticsQuery.isLoading}
          error={statisticsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void statisticsQuery.refetch()}
          skeleton={<TableSkeleton rows={4} testId="receivables-trend-skeleton" />}
        >
          <CollectionTrendTable rows={statistics?.trend ?? []} locale={lang} />
        </QueryBoundary>
      </TableCard>

      <div className="grid gap-lg xl:grid-cols-5">
        <div className="xl:col-span-2">
          <SectionCard
            title={t('receivables.dashboard.agingTitle', 'Tramos de antigüedad')}
            description={t(
              'receivables.dashboard.agingSubtitle',
              'Días desde la fecha de venta (definición del reporte), no desde el vencimiento.',
            )}
            testId="receivables-aging"
          >
            <QueryBoundary
              isLoading={overviewQuery.isLoading}
              error={overviewQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void overviewQuery.refetch()}
              skeleton={<PanelSkeleton rows={4} testId="receivables-aging-skeleton" />}
            >
              {overview ? (
                <AgingBucketsPanel
                  rows={agingBucketRows(overview.aging_summary)}
                  unclassifiedAmount={unclassifiedAgingAmount(
                    overview.total_pending,
                    overview.aging_summary,
                  )}
                  testId="receivables-aging-buckets"
                />
              ) : null}
              {overview ? (
                <p className="mt-md text-body-sm text-on-surface-deep">
                  {t('receivables.dashboard.agingBase', 'Saldo en tramos: {amount}', {
                    amount: formatMoney(agingBucketsTotal(overview.aging_summary)),
                  })}
                </p>
              ) : null}
            </QueryBoundary>
          </SectionCard>
        </div>

        <div className="xl:col-span-3">
          <TableCard
            title={t('receivables.dashboard.topDebtorsTitle', 'Principales deudores')}
            description={t(
              'receivables.dashboard.topDebtorsSubtitle',
              'Saldo total a hoy; el comportamiento lo deriva el BE de la proporción vencida.',
            )}
            testId="receivables-top-debtors-card"
          >
            <QueryBoundary
              isLoading={topDebtorsQuery.isLoading}
              error={topDebtorsQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void topDebtorsQuery.refetch()}
              skeleton={<TableSkeleton rows={3} testId="receivables-top-debtors-skeleton" />}
            >
              <TopDebtorsTable rows={topDebtorsQuery.data ?? []} />
            </QueryBoundary>
          </TableCard>
        </div>
      </div>

      <TableCard
        title={t('receivables.dashboard.recentTitle', 'Cuentas recientes')}
        description={t(
          'receivables.dashboard.recentSubtitle',
          'Últimas 5 cuentas con saldo pendiente, ordenadas por fecha de venta.',
        )}
        action={
          <Link
            to='/receivables/list'
            className="text-body-sm-bold text-primary hover:underline"
            data-testid="receivables-view-all"
          >
            {t('receivables.dashboard.viewAll', 'Ver todas')}
          </Link>
        }
        testId="receivables-recent-card"
      >
        <QueryBoundary
          isLoading={recentQuery.isLoading}
          error={recentQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void recentQuery.refetch()}
          skeleton={<TableSkeleton rows={5} testId="receivables-recent-skeleton" />}
        >
          <ReceivablesTable
            columns={recentColumns}
            rows={recent?.items ?? []}
            rowKey={(row) => row.id}
            testId="receivables-recent"
            minWidthClass="min-w-[860px]"
            dense
            caption={t('receivables.dashboard.recentTitle', 'Cuentas recientes')}
            empty={
              <TableEmptyState
                icon={CreditCard}
                title={t('receivables.dashboard.recentEmpty', 'Sin cuentas pendientes')}
                description={t(
                  'receivables.dashboard.recentEmptyHint',
                  'Todas las ventas están saldadas.',
                )}
              />
            }
          />
        </QueryBoundary>
      </TableCard>
    </ReceivablesPageLayout>
  )
}

export default ReceivablesDashboardPage
