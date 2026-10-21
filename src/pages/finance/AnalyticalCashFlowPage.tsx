import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Scale,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  DailyCashFlowTable,
  FinanceKpiLedger,
  FinancePeriodSelector,
  FinanceRefreshButton,
  FinancialReportsPageLayout,
  StatementTable,
  useCashFlowStatement,
  useFinancePeriod,
  type FinanceKpiItem,
  type FinanceKpiTone,
  type StatementRow,
} from '@/features/financial-reports'
import { formatFinancialRange } from '@/domain/finance/reportPeriod'
import { cashFlowKpis, cashFlowView } from '@/domain/finance/cashFlow'
import { formatMoney } from '@/domain/finance/format'
import { formatKpiValue, type FinanceKpiValue } from '@/domain/finance/kpis'

interface KpiMeta {
  icon: LucideIcon
  tone: FinanceKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const KPI_META: Record<string, KpiMeta> = {
  beginningCash: {
    icon: Wallet,
    tone: 'secondary',
    labelKey: 'finance.cashFlow.kpis.beginning',
    label: 'Caja inicial',
    hintKey: 'finance.cashFlow.hints.beginning',
    hint: 'Saldo de cajas abiertas al inicio',
  },
  inflows: {
    icon: ArrowDownLeft,
    tone: 'success',
    labelKey: 'finance.cashFlow.kpis.inflows',
    label: 'Cobros',
    hintKey: 'finance.cashFlow.hints.inflows',
    hint: 'Cobros de ventas del período y de cuentas anteriores',
  },
  outflows: {
    icon: ArrowUpRight,
    tone: 'error',
    labelKey: 'finance.cashFlow.kpis.outflows',
    label: 'Pagos',
    hintKey: 'finance.cashFlow.hints.outflows',
    hint: 'Pagos a proveedores y gastos del período',
  },
  netCashChange: {
    icon: Scale,
    tone: 'primary',
    labelKey: 'finance.cashFlow.kpis.net',
    label: 'Variación neta',
    hintKey: 'finance.cashFlow.hints.net',
    hint: 'Cobros − pagos',
  },
  endingCash: {
    icon: Landmark,
    tone: 'primary',
    labelKey: 'finance.cashFlow.kpis.ending',
    label: 'Caja al cierre',
    hintKey: 'finance.cashFlow.hints.ending',
    hint: 'Caja inicial + variación neta',
  },
}

/**
 * F9 — Flujo de caja analítico. Es base CAJA: cobros/pagos por fecha de pago,
 * no ventas/compras devengadas. La caja inicial es el saldo de cajas abiertas
 * y no se inventan actividades de inversión/financiación si el BE las deja en
 * cero (las marca como no modeladas).
 */
const AnalyticalCashFlowPage = () => {
  const { t, lang } = useI18n()
  const { period, setPeriod } = useFinancePeriod()
  const cashFlow = useCashFlowStatement(period)
  const view = cashFlowView(cashFlow.data)
  const errorTitle = t('finance.errors.title', 'No se pudieron cargar los datos')
  const range = formatFinancialRange(cashFlow.data?.period, lang)

  const kpiItems: FinanceKpiItem[] = (view ? cashFlowKpis(view) : []).map(
    (row: FinanceKpiValue) => {
      const meta = KPI_META[row.id]
      return {
        id: row.id,
        icon: meta.icon,
        tone: meta.tone,
        label: t(meta.labelKey, meta.label),
        hint: t(meta.hintKey, meta.hint),
        value: formatKpiValue(row),
      }
    },
  )

  const statementRows: StatementRow[] = view
    ? [
        {
          id: 'beginning',
          label: t('finance.cashFlow.beginning', 'Caja inicial (cajas abiertas)'),
          amount: view.beginningCash,
          emphasis: 'subtotal',
        },
        {
          id: 'salesCollections',
          label: t('finance.cashFlow.salesCollections', 'Cobros de ventas del período'),
          amount: view.salesCollections,
        },
        {
          id: 'priorCollections',
          label: t('finance.cashFlow.priorCollections', 'Cobros de cuentas anteriores'),
          amount: view.priorCollections,
        },
        {
          id: 'supplierPayments',
          label: t('finance.cashFlow.supplierPayments', 'Pagos a proveedores'),
          amount: view.supplierPayments,
          negative: true,
        },
        ...((view.expensePayments ?? 0) !== 0
          ? [
              {
                id: 'expensePayments',
                label: t('finance.cashFlow.expensePayments', 'Pagos de gastos'),
                amount: view.expensePayments,
                negative: true,
              },
            ]
          : []),
        ...((view.salaryPayments ?? 0) !== 0
          ? [
              {
                id: 'salaryPayments',
                label: t('finance.cashFlow.salaryPayments', 'Pagos de salarios'),
                amount: view.salaryPayments,
                negative: true,
              },
            ]
          : []),
        ...((view.otherOperating ?? 0) !== 0
          ? [
              {
                id: 'otherOperating',
                label: t('finance.cashFlow.otherOperating', 'Otros movimientos operativos'),
                amount: view.otherOperating,
              },
            ]
          : []),
        {
          id: 'operatingNet',
          label: t('finance.cashFlow.operatingNet', 'Flujo operativo neto'),
          amount: view.operatingNet,
          emphasis: 'subtotal',
        },
        ...((view.investingNet ?? 0) !== 0
          ? [
              {
                id: 'investingNet',
                label: t('finance.cashFlow.investingNet', 'Actividades de inversión'),
                amount: view.investingNet,
              },
            ]
          : []),
        ...((view.financingNet ?? 0) !== 0
          ? [
              {
                id: 'financingNet',
                label: t('finance.cashFlow.financingNet', 'Actividades de financiación'),
                amount: view.financingNet,
              },
            ]
          : []),
        {
          id: 'netChange',
          label: t('finance.cashFlow.netChange', 'Variación neta del período'),
          amount: view.netCashChange,
          emphasis: 'subtotal',
        },
        {
          id: 'ending',
          label: t('finance.cashFlow.ending', 'Caja al cierre'),
          amount: view.endingCash,
          emphasis: 'total',
        },
      ]
    : []

  return (
    <FinancialReportsPageLayout
      title={t('finance.cashFlow.title', 'Flujo de caja')}
      subtitle={t(
        'finance.cashFlow.subtitle',
        'Cobros y pagos por fecha de pago. La caja inicial es el saldo de cajas abiertas, no un saldo bancario.',
      )}
      range={range}
      actions={
        <div className="flex max-w-full flex-wrap items-center justify-end gap-sm">
          <FinancePeriodSelector value={period} onChange={setPeriod} />
          <FinanceRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('finance.cashFlow.kpisTitle', 'Resumen del flujo')}
        description={t(
          'finance.cashFlow.kpisDescription',
          'Todos los importes son movimientos de caja del período.',
        )}
        testId="finance-cash-flow-kpis-card"
      >
        <QueryBoundary
          isLoading={cashFlow.isLoading}
          error={cashFlow.error}
          errorTitle={errorTitle}
          onRetry={() => void cashFlow.refetch()}
          skeleton={<PanelSkeleton rows={5} />}
        >
          <FinanceKpiLedger items={kpiItems} testId="finance-cash-flow-kpis" />
        </QueryBoundary>
      </SectionCard>

      {view && !view.reconciled ? (
        <div
          role="alert"
          className="flex items-start gap-sm rounded-md bg-warning/10 px-md py-sm text-foreground"
          data-testid="finance-cash-flow-warning"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-body-sm">
            {t(
              'finance.cashFlow.reconciliationWarning',
              'El backend devolvió un flujo que no cierra contra su desglose diario. Se muestran los importes reportados; revisá el período con el área contable.',
            )}
          </p>
        </div>
      ) : null}

      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('finance.cashFlow.statementTitle', 'Estado de flujo de caja')}
          description={t(
            'finance.cashFlow.statementDescription',
            'Cobros y pagos del período con la caja inicial y final.',
          )}
          testId="finance-cash-flow-statement"
        >
          <QueryBoundary
            isLoading={cashFlow.isLoading}
            error={cashFlow.error}
            errorTitle={errorTitle}
            onRetry={() => void cashFlow.refetch()}
            skeleton={<PanelSkeleton rows={7} />}
          >
            <StatementTable rows={statementRows} testId="finance-cash-flow-statement-rows" />
            <p className="mt-md text-body-sm text-on-surface-deep">
              {t(
                'finance.cashFlow.statementNote',
                'Inversión, financiación, gastos y salarios se omiten cuando el backend los entrega en 0 porque no los modela: no son ceros medidos.',
              )}
            </p>
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('finance.cashFlow.summaryTitle', 'Conciliación')}
          description={t(
            'finance.cashFlow.summaryDescription',
            'La suma diaria debe coincidir con el estado de flujo.',
          )}
          testId="finance-cash-flow-summary"
        >
          <QueryBoundary
            isLoading={cashFlow.isLoading}
            error={cashFlow.error}
            errorTitle={errorTitle}
            onRetry={() => void cashFlow.refetch()}
            skeleton={<PanelSkeleton rows={4} />}
          >
            <dl className="divide-y divide-divider">
              <div className="flex items-baseline justify-between gap-md py-sm first:pt-0">
                <dt className="text-body-md text-foreground">
                  {t('finance.cashFlow.dailyInflows', 'Cobros en el desglose diario')}
                </dt>
                <dd className="font-data-mono text-data-mono">{formatMoney(view?.dailyInflows)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-md py-sm">
                <dt className="text-body-md text-foreground">
                  {t('finance.cashFlow.dailyOutflows', 'Pagos en el desglose diario')}
                </dt>
                <dd className="font-data-mono text-data-mono">{formatMoney(view?.dailyOutflows)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-md py-sm last:pb-0">
                <dt className="text-body-md-bold text-foreground">
                  {t('finance.cashFlow.dailyNet', 'Neto del desglose diario')}
                </dt>
                <dd className="font-data-mono text-data-mono">{formatMoney(view?.dailyNet)}</dd>
              </div>
            </dl>
          </QueryBoundary>
        </SectionCard>
      </div>

      <TableCard
        title={t('finance.cashFlow.dailyTitle', 'Movimientos por día')}
        description={t(
          'finance.cashFlow.dailyDescription',
          'Cobros y pagos con fecha dentro del período; el saldo es el acumulado desde la caja inicial.',
        )}
        testId="finance-cash-flow-daily-card"
      >
        <QueryBoundary
          isLoading={cashFlow.isLoading}
          error={cashFlow.error}
          errorTitle={errorTitle}
          onRetry={() => void cashFlow.refetch()}
          skeleton={<TableSkeleton rows={5} />}
        >
          <DailyCashFlowTable rows={view?.daily ?? []} />
        </QueryBoundary>
      </TableCard>
    </FinancialReportsPageLayout>
  )
}

export default AnalyticalCashFlowPage
