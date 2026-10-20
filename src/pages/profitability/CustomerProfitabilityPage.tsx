import { useState } from 'react'
import { Award, Banknote, UserCheck, UserX, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import TablePagination from '@/components/ui/TablePagination'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  CustomersTable,
  ProfitabilityKpiLedger,
  ProfitabilityPageLayout,
  ProfitabilityPeriodSelector,
  ProfitabilityRefreshButton,
  useProfitabilityCustomers,
  useProfitabilityPeriod,
} from '@/features/profitability'
import type { ProfitabilityKpiTone } from '@/features/profitability'
import { buildCustomerKpis, formatKpiValue } from '@/domain/profitability/kpis'
import { formatPeriodRange } from '@/domain/profitability/format'

const KPI_META: Record<
  string,
  { icon: LucideIcon; tone: ProfitabilityKpiTone; labelKey: string; fallback: string; hintKey: string; hintFallback: string }
> = {
  totalCustomers: {
    icon: Users,
    tone: 'neutral',
    labelKey: 'profitability.kpis.totalCustomers',
    fallback: 'Clientes con compras',
    hintKey: 'profitability.customers.totalHint',
    hintFallback: 'Clientes con al menos una venta en el período',
  },
  profitableCustomers: {
    icon: UserCheck,
    tone: 'success',
    labelKey: 'profitability.kpis.profitableCustomers',
    fallback: 'Clientes rentables',
    hintKey: 'profitability.customers.profitableHint',
    hintFallback: 'Beneficio bruto positivo',
  },
  totalProfit: {
    icon: Banknote,
    tone: 'primary',
    labelKey: 'profitability.kpis.totalProfit',
    fallback: 'Beneficio bruto',
    hintKey: 'profitability.customers.profitHint',
    hintFallback: 'Ingresos menos costo de las compras del período',
  },
  averageCustomerValue: {
    icon: Award,
    tone: 'secondary',
    labelKey: 'profitability.kpis.averageCustomerValue',
    fallback: 'Beneficio promedio por cliente',
    hintKey: 'profitability.customers.averageHint',
    hintFallback: 'Beneficio total / clientes con compras (no es ticket promedio)',
  },
  unprofitableCustomers: {
    icon: UserX,
    tone: 'error',
    labelKey: 'profitability.kpis.unprofitableCustomers',
    fallback: 'Clientes sin beneficio',
    hintKey: 'profitability.customers.unprofitableHint',
    hintFallback: 'El total menos los clientes rentables',
  },
}

/**
 * F6 — Clientes rentables: tabla paginada (orden fijo por beneficio, sin
 * búsqueda porque el endpoint no la acepta), segmento por participación y
 * antigüedad derivada de la última compra real.
 */
const CustomerProfitabilityPage = () => {
  const { t, lang } = useI18n()
  const { period } = useProfitabilityPeriod()
  const [page, setPage] = useState(1)
  const customersQuery = useProfitabilityCustomers(period, page)
  const data = customersQuery.data

  const errorTitle = t('profitability.errors.title', 'No se pudieron cargar los datos')
  const summary = data?.report.summary
  const kpiRows = buildCustomerKpis(summary)
  const kpiItems = kpiRows.map((row) => {
    const meta = KPI_META[row.id]
    return {
      id: row.id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.fallback),
      hint: t(meta.hintKey, meta.hintFallback),
      value: formatKpiValue(row),
    }
  })

  const range = data?.report.period ? formatPeriodRange(data.report.period, lang) : undefined
  const pagination = data?.pagination

  const empty = (
    <TableEmptyState
      icon={Users}
      title={t('profitability.customers.empty', 'Sin clientes con compras en el período')}
      description={t('profitability.customers.emptyHint', 'Probá con otro período.')}
    />
  )

  return (
    <ProfitabilityPageLayout
      title={t('profitability.customers.title', 'Rentabilidad por cliente')}
      subtitle={t(
        'profitability.customers.subtitle',
        'Ingresos, beneficio y margen por cliente con compras en el período.',
      )}
      range={range}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <ProfitabilityPeriodSelector />
          <ProfitabilityRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('profitability.customers.summaryTitle', 'Resumen del período')}
        description={t(
          'profitability.customers.summarySubtitle',
          'El beneficio promedio por cliente es la media de ingresos menos costo, no el ticket promedio.',
        )}
        testId="profitability-customers-summary-card"
      >
        <QueryBoundary
          isLoading={customersQuery.isLoading}
          error={customersQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void customersQuery.refetch()}
          skeleton={<PanelSkeleton rows={5} testId="profitability-customers-summary-skeleton" />}
        >
          <ProfitabilityKpiLedger items={kpiItems} testId="profitability-customers-kpi-ledger" />
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={t('profitability.customers.tableTitle', 'Detalle por cliente')}
        description={t(
          'profitability.customers.tableSubtitle',
          'Orden fijo por beneficio. El segmento sale de la participación en el beneficio: PLATINUM ≥ 10 %, GOLD ≥ 5 %, SILVER ≥ 2 %, resto BRONZE.',
        )}
        testId="profitability-customers-table-card"
        footer={
          pagination ? (
            <TablePagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total_items}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        <QueryBoundary
          isLoading={customersQuery.isLoading}
          error={customersQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void customersQuery.refetch()}
          skeleton={<TableSkeleton rows={8} testId="profitability-customers-table-skeleton" />}
        >
          <CustomersTable
            rows={data?.customers ?? []}
            totalProfit={summary?.total_profit}
            empty={empty}
          />
        </QueryBoundary>
      </TableCard>
    </ProfitabilityPageLayout>
  )
}

export default CustomerProfitabilityPage
