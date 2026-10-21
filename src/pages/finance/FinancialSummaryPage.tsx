import {
  Activity,
  Building2,
  CreditCard,
  Gauge,
  Landmark,
  Scale,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton } from '@/components/ui/DataSkeletons'
import {
  BreakdownTable,
  FinanceKpiLedger,
  FinancePeriodSelector,
  FinanceRefreshButton,
  FinancialReportsPageLayout,
  HealthScorePanel,
  useFinancePeriod,
  useFinancialHealthScore,
  useFinancialOverview,
  useIncomeStatement,
  type BreakdownRow,
  type FinanceKpiItem,
  type FinanceKpiTone,
} from '@/features/financial-reports'
import { formatFinancialRange } from '@/domain/finance/reportPeriod'
import { formatMoney } from '@/domain/finance/format'
import {
  financialOverviewKpis,
  financialOverviewView,
  healthScoreView,
} from '@/domain/finance/overview'
import { incomeStatementKpis, incomeStatementView } from '@/domain/finance/incomeStatement'
import { formatKpiValue, healthScoreKpis, type FinanceKpiValue } from '@/domain/finance/kpis'
import type { IncomePaymentRevenue } from '@/types/bi'

interface KpiMeta {
  icon: LucideIcon
  tone: FinanceKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const OVERVIEW_META: Record<string, KpiMeta> = {
  revenue: {
    icon: TrendingUp,
    tone: 'success',
    labelKey: 'finance.summary.kpis.revenue',
    label: 'Ingresos',
    hintKey: 'finance.summary.hints.revenue',
    hint: 'Ventas del período',
  },
  purchases: {
    icon: ShoppingCart,
    tone: 'warning',
    labelKey: 'finance.summary.kpis.purchases',
    label: 'Compras',
    hintKey: 'finance.summary.hints.purchases',
    hint: 'Compras del período (no gastos operativos)',
  },
  revenueMinusPurchases: {
    icon: Scale,
    tone: 'primary',
    labelKey: 'finance.summary.kpis.result',
    label: 'Ingresos − compras',
    hintKey: 'finance.summary.hints.result',
    hint: 'Resultado de caja del endpoint, no utilidad contable',
  },
  cashPosition: {
    icon: Wallet,
    tone: 'secondary',
    labelKey: 'finance.summary.kpis.cash',
    label: 'Caja',
    hintKey: 'finance.summary.hints.cash',
    hint: 'Saldo de cajas abiertas',
  },
  receivables: {
    icon: CreditCard,
    tone: 'warning',
    labelKey: 'finance.summary.kpis.receivables',
    label: 'Cuentas por cobrar',
    hintKey: 'finance.summary.hints.receivables',
    hint: 'Órdenes pendientes o parciales',
  },
  payables: {
    icon: Building2,
    tone: 'error',
    labelKey: 'finance.summary.kpis.payables',
    label: 'Cuentas por pagar',
    hintKey: 'finance.summary.hints.payables',
    hint: 'Órdenes pendientes o parciales; CxP incluye todas las no canceladas',
  },
  workingCapital: {
    icon: Landmark,
    tone: 'primary',
    labelKey: 'finance.summary.kpis.workingCapital',
    label: 'Capital de trabajo',
    hintKey: 'finance.summary.hints.workingCapital',
    hint: 'Caja + CxC + inventario − CxP',
  },
}

const HEALTH_META: Record<string, KpiMeta> = {
  score: {
    icon: Activity,
    tone: 'primary',
    labelKey: 'finance.summary.healthKpis.score',
    label: 'Score',
    hintKey: 'finance.summary.healthHints.score',
    hint: 'Puntaje 0-100 del backend',
  },
  ratingCurrentRatio: {
    icon: Gauge,
    tone: 'secondary',
    labelKey: 'finance.summary.healthKpis.currentRatio',
    label: 'Liquidez corriente',
    hintKey: 'finance.summary.healthHints.currentRatio',
    hint: 'Activo corriente / CxP',
  },
  ratingQuickRatio: {
    icon: Gauge,
    tone: 'neutral',
    labelKey: 'finance.summary.healthKpis.quickRatio',
    label: 'Prueba ácida',
    hintKey: 'finance.summary.healthHints.quickRatio',
    hint: '(Caja + CxC) / CxP',
  },
  ratingNetMargin: {
    icon: Activity,
    tone: 'warning',
    labelKey: 'finance.summary.healthKpis.netMargin',
    label: 'Margen (ingresos − compras)',
    hintKey: 'finance.summary.healthHints.netMargin',
    hint: 'Base del overview, no el margen bruto del P&L',
  },
  ratingWorkingCapital: {
    icon: Landmark,
    tone: 'secondary',
    labelKey: 'finance.summary.healthKpis.workingCapital',
    label: 'Capital de trabajo',
    hintKey: 'finance.summary.healthHints.workingCapital',
    hint: 'Caja + CxC + inventario − CxP',
  },
}

const INCOME_META: Record<string, KpiMeta> = {
  netSales: {
    icon: TrendingUp,
    tone: 'success',
    labelKey: 'finance.summary.incomeKpis.netSales',
    label: 'Ventas netas',
    hintKey: 'finance.summary.incomeHints.netSales',
    hint: 'Ingresos por líneas del período',
  },
  cogs: {
    icon: ShoppingCart,
    tone: 'warning',
    labelKey: 'finance.summary.incomeKpis.cogs',
    label: 'Costo de ventas',
    hintKey: 'finance.summary.incomeHints.cogs',
    hint: 'Costo de los productos vendidos',
  },
  grossProfit: {
    icon: Scale,
    tone: 'primary',
    labelKey: 'finance.summary.incomeKpis.grossProfit',
    label: 'Utilidad bruta',
    hintKey: 'finance.summary.incomeHints.grossProfit',
    hint: 'Ventas netas − costo de ventas',
  },
  grossMargin: {
    icon: Activity,
    tone: 'secondary',
    labelKey: 'finance.summary.incomeKpis.grossMargin',
    label: 'Margen bruto',
    hintKey: 'finance.summary.incomeHints.grossMargin',
    hint: 'Utilidad bruta / ventas netas',
  },
}

type Translate = (key: string, fallback?: string) => string

const toItems = (
  values: FinanceKpiValue[],
  meta: Record<string, KpiMeta>,
  t: Translate,
): FinanceKpiItem[] =>
  values.map((row) => {
    const item = meta[row.id]
    return {
      id: row.id,
      icon: item.icon,
      tone: item.tone,
      label: t(item.labelKey, item.label),
      hint: t(item.hintKey, item.hint),
      value: formatKpiValue(row),
    }
  })

/**
 * F9 — Resumen financiero. `/overview` aporta caja/CxC/CxP/capital de trabajo,
 * `/income-statement` el resultado bruto y `/health-score` el score. El
 * "resultado" del overview es ingresos − compras y se rotula como tal; la
 * utilidad contable vive en el P&L (costo de ventas).
 */
const FinancialSummaryPage = () => {
  const { t, lang } = useI18n()
  const { period, setPeriod } = useFinancePeriod()
  const overview = useFinancialOverview(period)
  const income = useIncomeStatement(period)
  const health = useFinancialHealthScore(period)

  const translate: Translate = (key, fallback) => String(t(key, fallback))
  const errorTitle = t('finance.errors.title', 'No se pudieron cargar los datos')
  const overviewView = financialOverviewView(overview.data)
  const incomeView = incomeStatementView(income.data)
  const healthView = healthScoreView(health.data)
  const range = formatFinancialRange(overview.data?.period, lang)

  const categories: BreakdownRow[] = (incomeView?.categories ?? []).map((row) => ({
    id: row.category_id || row.category_name,
    name: row.category_name || '—',
    amount: row.amount,
    percentage: row.percentage,
  }))

  const paymentMethods: BreakdownRow[] = (incomeView?.paymentMethods ?? []).map(
    (row: IncomePaymentRevenue, index) => ({
      id: `${row.method || 'unknown'}-${index}`,
      name:
        row.method === 'unknown'
          ? t('finance.paymentMethods.unknown', 'Sin método registrado')
          : row.method || '—',
      amount: row.amount,
      percentage: row.percentage,
    }),
  )

  return (
    <FinancialReportsPageLayout
      title={t('finance.summary.title', 'Resumen financiero')}
      subtitle={t(
        'finance.summary.subtitle',
        'Ingresos, compras, caja y balance del período. La utilidad contable se detalla en el Estado de Resultados.',
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
        title={t('finance.summary.overviewTitle', 'Resumen del período')}
        description={t(
          'finance.summary.overviewDescription',
          'Compras no son gastos: el backend calcula este resultado como ingresos − compras.',
        )}
        testId="finance-summary-overview"
      >
        <QueryBoundary
          isLoading={overview.isLoading}
          error={overview.error}
          errorTitle={errorTitle}
          onRetry={() => void overview.refetch()}
          skeleton={<PanelSkeleton rows={7} />}
        >
          {overviewView ? (
            <FinanceKpiLedger
              items={toItems(financialOverviewKpis(overviewView), OVERVIEW_META, translate)}
              testId="finance-summary-kpis"
            />
          ) : null}
        </QueryBoundary>
      </SectionCard>

      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('finance.summary.incomeTitle', 'Estado de resultados')}
          description={t(
            'finance.summary.incomeDescription',
            'Ventas netas, costo de ventas y utilidad bruta del período.',
          )}
          action={
            <Link
              to="/finance/profit-and-loss"
              className="text-body-sm-bold text-primary hover:underline"
            >
              {t('finance.summary.openPnl', 'Ver P&L completo')}
            </Link>
          }
          testId="finance-summary-income"
        >
          <QueryBoundary
            isLoading={income.isLoading}
            error={income.error}
            errorTitle={errorTitle}
            onRetry={() => void income.refetch()}
            skeleton={<PanelSkeleton rows={5} />}
          >
            <FinanceKpiLedger
              items={toItems(incomeView ? incomeStatementKpis(incomeView) : [], INCOME_META, translate)}
              testId="finance-summary-income-kpis"
            />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('finance.summary.healthTitle', 'Salud financiera')}
          description={t(
            'finance.summary.healthDescription',
            'Score 0-100 y ratios que calcula el backend.',
          )}
          testId="finance-summary-health"
        >
          <QueryBoundary
            isLoading={health.isLoading}
            error={health.error}
            errorTitle={errorTitle}
            onRetry={() => void health.refetch()}
            skeleton={<PanelSkeleton rows={5} />}
          >
            {healthView ? <HealthScorePanel view={healthView} /> : null}
            <div className="mt-md">
              <FinanceKpiLedger
                items={toItems(
                  health.data ? healthScoreKpis(health.data).filter((kpi) => kpi.id !== 'score') : [],
                  HEALTH_META,
                  translate,
                )}
                testId="finance-summary-health-kpis"
              />
            </div>
            <p className="mt-md text-body-sm text-on-surface-deep">
              {t(
                'finance.summary.ratiosNote',
                'DSO, DPO y rotaciones no se muestran: el backend los entrega en 0 porque no los calcula.',
              )}
            </p>
          </QueryBoundary>
        </SectionCard>
      </div>

      <div className="grid gap-lg xl:grid-cols-2">
        <TableCard
          title={t('finance.summary.categoriesTitle', 'Ingresos por categoría')}
          description={t(
            'finance.summary.categoriesDescription',
            'Participación sobre las ventas del período.',
          )}
          testId="finance-summary-categories"
        >
          <QueryBoundary
            isLoading={income.isLoading}
            error={income.error}
            errorTitle={errorTitle}
            onRetry={() => void income.refetch()}
            skeleton={<PanelSkeleton rows={4} />}
          >
            <BreakdownTable
              rows={categories}
              nameHeader={t('finance.common.category', 'Categoría')}
              testId="finance-summary-category-table"
              empty={{
                icon: ShoppingCart,
                title: t('finance.summary.categoriesEmpty', 'Sin categorías con ventas'),
                description: t(
                  'finance.summary.categoriesEmptyHint',
                  'No hay ingresos clasificados por categoría en el período.',
                ),
              }}
            />
          </QueryBoundary>
        </TableCard>

        <TableCard
          title={t('finance.summary.paymentsTitle', 'Medios de pago')}
          description={t(
            'finance.summary.paymentsDescription',
            'Ventas del período por método registrado.',
          )}
          testId="finance-summary-payments"
        >
          <QueryBoundary
            isLoading={income.isLoading}
            error={income.error}
            errorTitle={errorTitle}
            onRetry={() => void income.refetch()}
            skeleton={<PanelSkeleton rows={3} />}
          >
            <BreakdownTable
              rows={paymentMethods}
              nameHeader={t('finance.common.paymentMethod', 'Método')}
              testId="finance-summary-payment-table"
              empty={{
                icon: CreditCard,
                title: t('finance.summary.paymentsEmpty', 'Sin medios de pago'),
                description: t(
                  'finance.summary.paymentsEmptyHint',
                  'No hay ventas con método de pago en el período.',
                ),
              }}
            />
          </QueryBoundary>
        </TableCard>
      </div>

      <SectionCard
        title={t('finance.summary.linksTitle', 'Otros reportes')}
        description={t(
          'finance.summary.linksDescription',
          'Accesos directos a los reportes del grupo.',
        )}
        testId="finance-summary-links"
      >
        <div className="flex flex-wrap gap-sm">
          <Link
            to="/finance/analytical-cash-flow"
            className="rounded-md bg-surface-muted px-md py-sm text-body-sm-bold text-primary hover:bg-surface"
          >
            {t('finance.summary.openCashFlow', 'Flujo de caja')}
          </Link>
          <Link
            to="/finance/tax-management"
            className="rounded-md bg-surface-muted px-md py-sm text-body-sm-bold text-primary hover:bg-surface"
          >
            {t('finance.summary.openTax', 'Gestión de IVA')}
          </Link>
          <Link
            to="/finance/legal-books"
            className="rounded-md bg-surface-muted px-md py-sm text-body-sm-bold text-primary hover:bg-surface"
          >
            {t('finance.summary.openLedgers', 'Libros legales')}
          </Link>
        </div>
        <p className="mt-md text-body-sm text-on-surface-deep">
          {t('finance.summary.purchasesFootnote', 'Compras del período: {amount}', {
            amount: formatMoney(overviewView?.purchases),
          })}
        </p>
      </SectionCard>
    </FinancialReportsPageLayout>
  )
}

export default FinancialSummaryPage
