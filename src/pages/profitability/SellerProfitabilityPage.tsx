import { Award, Handshake, TrendingUp, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  ProfitabilityKpiLedger,
  ProfitabilityPageLayout,
  ProfitabilityPeriodSelector,
  ProfitabilityRefreshButton,
  SellersTable,
  useProfitabilityPeriod,
  useProfitabilitySellers,
} from '@/features/profitability'
import type { ProfitabilityKpiTone } from '@/features/profitability'
import { buildSellerKpis, formatKpiValue } from '@/domain/profitability/kpis'
import { formatMoney, formatPercent, formatPeriodRange } from '@/domain/profitability/format'

const KPI_META: Record<
  string,
  { icon: LucideIcon; tone: ProfitabilityKpiTone; labelKey: string; fallback: string; hintKey: string; hintFallback: string }
> = {
  totalSellers: {
    icon: Handshake,
    tone: 'neutral',
    labelKey: 'profitability.kpis.totalSellers',
    fallback: 'Vendedores con ventas',
    hintKey: 'profitability.sellers.totalHint',
    hintFallback: 'Usuarios con ventas registradas en el período',
  },
  totalProfit: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'profitability.kpis.totalProfit',
    fallback: 'Beneficio bruto',
    hintKey: 'profitability.sellers.profitHint',
    hintFallback: 'Suma del beneficio de los vendedores',
  },
  averageProfitPerSeller: {
    icon: TrendingUp,
    tone: 'success',
    labelKey: 'profitability.kpis.averageProfitPerSeller',
    fallback: 'Beneficio promedio por vendedor',
    hintKey: 'profitability.sellers.averageHint',
    hintFallback: 'Beneficio total / vendedores con ventas',
  },
}

/**
 * F6 — Vendedores rentables: ranking real por beneficio, ventas contadas por
 * orden (sin fan-out de líneas) y participación en el beneficio.
 */
const SellerProfitabilityPage = () => {
  const { t, lang } = useI18n()
  const { period } = useProfitabilityPeriod()
  const sellersQuery = useProfitabilitySellers(period)
  const data = sellersQuery.data

  const errorTitle = t('profitability.errors.title', 'No se pudieron cargar los datos')
  const summary = data?.report.summary
  const kpiRows = buildSellerKpis(summary)
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
  const topSeller = data?.sellers[0]

  const empty = (
    <TableEmptyState
      icon={Handshake}
      title={t('profitability.sellers.empty', 'Sin vendedores con ventas en el período')}
      description={t('profitability.sellers.emptyHint', 'Probá con otro período.')}
    />
  )

  return (
    <ProfitabilityPageLayout
      title={t('profitability.sellers.title', 'Rentabilidad por vendedor')}
      subtitle={t(
        'profitability.sellers.subtitle',
        'Ranking por beneficio con ventas, ticket promedio y participación.',
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
        title={t('profitability.sellers.summaryTitle', 'Resumen del período')}
        description={t(
          'profitability.sellers.summarySubtitle',
          'El promedio es beneficio total / vendedores con ventas; el top es la primera fila del ranking real.',
        )}
        testId="profitability-sellers-summary-card"
      >
        <QueryBoundary
          isLoading={sellersQuery.isLoading}
          error={sellersQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void sellersQuery.refetch()}
          skeleton={<PanelSkeleton rows={3} testId="profitability-sellers-summary-skeleton" />}
        >
          <ProfitabilityKpiLedger items={kpiItems} testId="profitability-sellers-kpi-ledger" />
          {topSeller ? (
            <div className="mt-md flex items-center gap-sm border-t border-divider pt-md">
              <Award size={18} className="text-warning" aria-hidden="true" />
              <p className="text-body-md text-foreground">
                <span className="text-label-caps uppercase text-on-surface-deep">
                  {t('profitability.sellers.topSeller', 'Top vendedor')}
                </span>
                <span aria-hidden="true"> · </span>
                <span className="text-body-md-bold">{topSeller.seller_name}</span>
                <span aria-hidden="true"> · </span>
                <span className="font-data-mono text-data-mono">
                  {formatMoney(topSeller.gross_profit)}
                </span>
                <span aria-hidden="true"> · </span>
                <span className="font-data-mono text-data-mono">
                  {formatPercent(topSeller.gross_margin_pct)}
                </span>
              </p>
            </div>
          ) : null}
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={t('profitability.sellers.tableTitle', 'Detalle por vendedor')}
        description={t(
          'profitability.sellers.tableSubtitle',
          'Sin paginación: el endpoint devuelve todos los vendedores del período, ordenados por beneficio.',
        )}
        testId="profitability-sellers-table-card"
      >
        <QueryBoundary
          isLoading={sellersQuery.isLoading}
          error={sellersQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void sellersQuery.refetch()}
          skeleton={<TableSkeleton rows={6} testId="profitability-sellers-table-skeleton" />}
        >
          <SellersTable
            rows={data?.sellers ?? []}
            totalProfit={summary?.total_profit}
            empty={empty}
          />
        </QueryBoundary>
      </TableCard>
    </ProfitabilityPageLayout>
  )
}

export default SellerProfitabilityPage
