import { Activity, Package, Receipt, Scale, ShoppingCart, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
  StatementTable,
  useFinancePeriod,
  useIncomeStatement,
  type BreakdownRow,
  type FinanceKpiItem,
  type FinanceKpiTone,
  type StatementRow,
} from '@/features/financial-reports'
import { formatFinancialRange } from '@/domain/finance/reportPeriod'
import { formatPercent } from '@/domain/finance/format'
import { incomeStatementKpis, incomeStatementView } from '@/domain/finance/incomeStatement'
import { formatKpiValue, type FinanceKpiValue } from '@/domain/finance/kpis'
import type { IncomePaymentRevenue } from '@/types/bi'

interface KpiMeta {
  icon: LucideIcon
  tone: FinanceKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const KPI_META: Record<string, KpiMeta> = {
  netSales: {
    icon: TrendingUp,
    tone: 'success',
    labelKey: 'finance.pnl.kpis.netSales',
    label: 'Ventas netas',
    hintKey: 'finance.pnl.hints.netSales',
    hint: 'Ingresos por líneas (cantidad × precio)',
  },
  cogs: {
    icon: ShoppingCart,
    tone: 'warning',
    labelKey: 'finance.pnl.kpis.cogs',
    label: 'Costo de ventas',
    hintKey: 'finance.pnl.hints.cogs',
    hint: 'Costo de los productos vendidos',
  },
  grossProfit: {
    icon: Scale,
    tone: 'primary',
    labelKey: 'finance.pnl.kpis.grossProfit',
    label: 'Utilidad bruta',
    hintKey: 'finance.pnl.hints.grossProfit',
    hint: 'Ventas netas − costo de ventas',
  },
  grossMargin: {
    icon: Activity,
    tone: 'secondary',
    labelKey: 'finance.pnl.kpis.grossMargin',
    label: 'Margen bruto',
    hintKey: 'finance.pnl.hints.grossMargin',
    hint: 'Utilidad bruta / ventas netas',
  },
  operatingExpenses: {
    icon: Receipt,
    tone: 'error',
    labelKey: 'finance.pnl.kpis.expenses',
    label: 'Gastos operativos',
    hintKey: 'finance.pnl.hints.expenses',
    hint: 'Solo si el backend los modela',
  },
}

/**
 * F9 — Estado de Resultados. El contrato devuelve SOLO el resultado bruto:
 * gastos operativos, devoluciones y descuentos viajan en 0 porque el backend no
 * los calcula. Se muestran notas explícitas y no se inventan esos ceros.
 */
const ProfitAndLossPage = () => {
  const { t, lang } = useI18n()
  const { period, setPeriod } = useFinancePeriod()
  const income = useIncomeStatement(period)
  const view = incomeStatementView(income.data)
  const errorTitle = t('finance.errors.title', 'No se pudieron cargar los datos')
  const range = formatFinancialRange(income.data?.period, lang)

  const kpiItems: FinanceKpiItem[] = (view ? incomeStatementKpis(view) : []).map(
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
          id: 'grossSales',
          label: t('finance.pnl.grossSales', 'Ventas brutas'),
          amount: view.grossSales,
        },
        ...(view.hasReturnsOrDiscounts
          ? [
              {
                id: 'returns',
                label: t('finance.pnl.returns', 'Devoluciones'),
                amount: view.returns,
                negative: true,
              },
              {
                id: 'discounts',
                label: t('finance.pnl.discounts', 'Descuentos'),
                amount: view.discounts,
                negative: true,
              },
            ]
          : []),
        {
          id: 'netSales',
          label: t('finance.pnl.netSales', 'Ventas netas'),
          amount: view.netSales,
          emphasis: 'subtotal',
        },
        {
          id: 'cogs',
          label: t('finance.pnl.cogs', 'Costo de ventas'),
          amount: view.cogs,
          negative: true,
        },
        {
          id: 'grossProfit',
          label: t('finance.pnl.grossProfit', 'Utilidad bruta'),
          amount: view.grossProfit,
          emphasis: 'total',
          hint: t('finance.pnl.grossMarginHint', 'Margen bruto: {margin}', {
            margin: formatPercent(view.grossMarginPct),
          }),
        },
        ...(view.hasModeledExpenses
          ? [
              {
                id: 'expenses',
                label: t('finance.pnl.expenses', 'Gastos operativos'),
                amount: view.expensesTotal,
                negative: true,
              },
              {
                id: 'operatingIncome',
                label: t('finance.pnl.operatingIncome', 'Resultado operativo'),
                amount: view.operatingIncome,
                emphasis: 'subtotal' as const,
              },
            ]
          : []),
        ...((view.otherIncome ?? 0) !== 0
          ? [
              {
                id: 'otherIncome',
                label: t('finance.pnl.otherIncome', 'Otros ingresos'),
                amount: view.otherIncome,
              },
            ]
          : []),
        ...((view.otherExpenses ?? 0) !== 0
          ? [
              {
                id: 'otherExpenses',
                label: t('finance.pnl.otherExpenses', 'Otros gastos'),
                amount: view.otherExpenses,
                negative: true,
              },
            ]
          : []),
        {
          id: 'netIncome',
          label: view.hasModeledExpenses
            ? t('finance.pnl.netIncome', 'Resultado neto')
            : t('finance.pnl.grossResult', 'Resultado (utilidad bruta)'),
          amount: view.netIncome,
          emphasis: 'total',
          hint: view.hasModeledExpenses
            ? undefined
            : t(
                'finance.pnl.noExpensesHint',
                'El backend no modela gastos operativos: el resultado coincide con la utilidad bruta.',
              ),
        },
      ]
    : []

  const categories: BreakdownRow[] = (view?.categories ?? []).map((row) => ({
    id: row.category_id || row.category_name,
    name: row.category_name || '—',
    amount: row.amount,
    percentage: row.percentage,
  }))

  const paymentMethods: BreakdownRow[] = (view?.paymentMethods ?? []).map(
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
      title={t('finance.pnl.title', 'Estado de Resultados')}
      subtitle={t(
        'finance.pnl.subtitle',
        'Ventas, costo de ventas y utilidad bruta del período. El backend no modela gastos operativos.',
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
        title={t('finance.pnl.kpisTitle', 'Indicadores del P&L')}
        description={t(
          'finance.pnl.kpisDescription',
          'Cifras del estado de resultados bruto del período.',
        )}
        testId="finance-pnl-kpis-card"
      >
        <QueryBoundary
          isLoading={income.isLoading}
          error={income.error}
          errorTitle={errorTitle}
          onRetry={() => void income.refetch()}
          skeleton={<PanelSkeleton rows={4} />}
        >
          <FinanceKpiLedger items={kpiItems} testId="finance-pnl-kpis" />
        </QueryBoundary>
      </SectionCard>

      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('finance.pnl.statementTitle', 'Estado de resultados')}
          description={t(
            'finance.pnl.statementDescription',
            'Conceptos del contrato, con resta explícita del costo de ventas.',
          )}
          testId="finance-pnl-statement"
        >
          <QueryBoundary
            isLoading={income.isLoading}
            error={income.error}
            errorTitle={errorTitle}
            onRetry={() => void income.refetch()}
            skeleton={<PanelSkeleton rows={6} />}
          >
            <StatementTable rows={statementRows} testId="finance-pnl-statement-rows" />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('finance.pnl.costTitle', 'Costo de ventas')}
          description={t(
            'finance.pnl.costDescription',
            'Compras del período, inventario final a costo y costo de ventas calculado.',
          )}
          testId="finance-pnl-cost"
        >
          <QueryBoundary
            isLoading={income.isLoading}
            error={income.error}
            errorTitle={errorTitle}
            onRetry={() => void income.refetch()}
            skeleton={<PanelSkeleton rows={3} />}
          >
            <dl className="divide-y divide-divider">
              <div className="flex items-baseline justify-between gap-md py-sm first:pt-0">
                <dt className="text-body-md text-foreground">
                  {t('finance.pnl.purchases', 'Compras del período')}
                </dt>
                <dd className="font-data-mono text-data-mono">
                  {formatKpiValue({ id: 'purchases', kind: 'money', value: view?.purchases ?? null })}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-md py-sm">
                <dt className="text-body-md text-foreground">
                  {t('finance.pnl.endingInventory', 'Inventario final a costo')}
                </dt>
                <dd className="font-data-mono text-data-mono">
                  {formatKpiValue({
                    id: 'ending',
                    kind: 'money',
                    value: income.data?.cost_of_sales?.ending_inventory ?? null,
                  })}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-md py-sm last:pb-0">
                <dt className="text-body-md-bold text-foreground">
                  {t('finance.pnl.cogs', 'Costo de ventas')}
                </dt>
                <dd className="font-data-mono text-data-mono">
                  {formatKpiValue({ id: 'cogs', kind: 'money', value: view?.cogs ?? null })}
                </dd>
              </div>
            </dl>
            <p className="mt-md text-body-sm text-on-surface-deep">
              {t(
                'finance.pnl.costNote',
                'El inventario inicial y las devoluciones de compra viajan en 0 porque el backend no los calcula; no se muestran como si fueran cero reales.',
              )}
            </p>
          </QueryBoundary>
        </SectionCard>
      </div>

      <div className="grid gap-lg xl:grid-cols-2">
        <TableCard
          title={t('finance.pnl.categoriesTitle', 'Ingresos por categoría')}
          description={t(
            'finance.pnl.categoriesDescription',
            'Participación sobre las ventas del período.',
          )}
          testId="finance-pnl-categories"
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
              testId="finance-pnl-category-table"
              empty={{
                icon: Package,
                title: t('finance.pnl.categoriesEmpty', 'Sin categorías con ventas'),
                description: t(
                  'finance.pnl.categoriesEmptyHint',
                  'No hay ingresos clasificados por categoría en el período.',
                ),
              }}
            />
          </QueryBoundary>
        </TableCard>

        <TableCard
          title={t('finance.pnl.paymentsTitle', 'Medios de pago')}
          description={t(
            'finance.pnl.paymentsDescription',
            'Ventas del período por método registrado.',
          )}
          testId="finance-pnl-payments"
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
              testId="finance-pnl-payment-table"
              empty={{
                icon: Receipt,
                title: t('finance.pnl.paymentsEmpty', 'Sin medios de pago'),
                description: t(
                  'finance.pnl.paymentsEmptyHint',
                  'No hay ventas con método de pago en el período.',
                ),
              }}
            />
          </QueryBoundary>
        </TableCard>
      </div>
    </FinancialReportsPageLayout>
  )
}

export default ProfitAndLossPage
