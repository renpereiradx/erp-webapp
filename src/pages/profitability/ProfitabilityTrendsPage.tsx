import { LineChart, Receipt, TrendingUp, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  GranularitySelector,
  ProfitabilityKpiLedger,
  ProfitabilityPageLayout,
  ProfitabilityPeriodSelector,
  ProfitabilityRefreshButton,
  TrendsSummary,
  TrendsTable,
  useProfitabilityGranularity,
  useProfitabilityPeriod,
  useProfitabilityTrends,
} from '@/features/profitability'
import type { ProfitabilityKpiTone } from '@/features/profitability'
import { buildTrendKpis, formatKpiValue } from '@/domain/profitability/kpis'
import { formatPeriodRange } from '@/domain/profitability/format'

const KPI_META: Record<
  string,
  { icon: LucideIcon; tone: ProfitabilityKpiTone; labelKey: string; fallback: string; hintKey: string; hintFallback: string }
> = {
  points: {
    icon: LineChart,
    tone: 'neutral',
    labelKey: 'profitability.kpis.trendPoints',
    fallback: 'Buckets con ventas',
    hintKey: 'profitability.trends.pointsHint',
    hintFallback: 'Solo se listan los períodos con ventas; no se rellenan huecos',
  },
  totalRevenue: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'profitability.kpis.totalRevenue',
    fallback: 'Ingresos de la serie',
    hintKey: 'profitability.trends.revenueHint',
    hintFallback: 'Suma de los buckets mostrados',
  },
  totalProfit: {
    icon: TrendingUp,
    tone: 'success',
    labelKey: 'profitability.kpis.totalProfit',
    fallback: 'Beneficio de la serie',
    hintKey: 'profitability.trends.profitHint',
    hintFallback: 'Suma de los beneficios de los buckets',
  },
  units: {
    icon: Receipt,
    tone: 'warning',
    labelKey: 'profitability.columns.units',
    fallback: 'Unidades',
    hintKey: 'profitability.trends.unitsHint',
    hintFallback: 'Normalizadas a unidad base; sin conversión se muestra “—”',
  },
}

/**
 * F6 — Tendencias: serie de beneficios con granularidad real (diaria, semanal
 * del lunes o mensual), resumen re-derivado en el locale de la UI y tabla
 * accesible. `week` del período es rolling; la granularidad semanal agrupa
 * semanas calendario de Postgres.
 */
const ProfitabilityTrendsPage = () => {
  const { t, lang } = useI18n()
  const { period } = useProfitabilityPeriod()
  const { granularity, setGranularity } = useProfitabilityGranularity(period)
  const trendsQuery = useProfitabilityTrends(period, granularity)
  const data = trendsQuery.data

  const errorTitle = t('profitability.errors.title', 'No se pudieron cargar los datos')
  const kpiRows = buildTrendKpis(data?.points ?? [])
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

  const range = data?.period ? formatPeriodRange(data.period, lang) : undefined

  const empty = (
    <TableEmptyState
      icon={LineChart}
      title={t('profitability.trends.empty', 'Sin ventas en el período')}
      description={t('profitability.trends.emptyHint', 'Probá con otro período o granularidad.')}
    />
  )

  return (
    <ProfitabilityPageLayout
      title={t('profitability.trends.title', 'Tendencias de rentabilidad')}
      subtitle={t(
        'profitability.trends.subtitle',
        'Evolución de ingresos, costo y beneficio con la granularidad elegida.',
      )}
      range={range}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <ProfitabilityPeriodSelector />
          <GranularitySelector value={granularity} onChange={setGranularity} />
          <ProfitabilityRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('profitability.trends.summaryTitle', 'Resumen de la serie')}
        description={t(
          'profitability.trends.summarySubtitle',
          'Crecimiento primera vs última fecha (la regla del BE), dirección ±5 % y extremos reales de los buckets.',
        )}
        testId="profitability-trends-summary-card"
      >
        <QueryBoundary
          isLoading={trendsQuery.isLoading}
          error={trendsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void trendsQuery.refetch()}
          skeleton={<PanelSkeleton rows={4} testId="profitability-trends-summary-skeleton" />}
        >
          {data ? (
            <TrendsSummary insight={data.insight} granularity={granularity} />
          ) : null}
          <div className="mt-md border-t border-divider pt-md">
            <ProfitabilityKpiLedger items={kpiItems} testId="profitability-trends-kpi-ledger" />
          </div>
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={t('profitability.trends.tableTitle', 'Serie por período')}
        description={t(
          'profitability.trends.tableSubtitle',
          'Granularidad semanal = semana calendario de Postgres (lunes). Los importes no se rellenan: cada fila es un bucket con ventas reales.',
        )}
        testId="profitability-trends-table-card"
      >
        <QueryBoundary
          isLoading={trendsQuery.isLoading}
          error={trendsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void trendsQuery.refetch()}
          isEmpty={(data?.points.length ?? 0) === 0}
          empty={<div className="px-md py-xl">{empty}</div>}
          skeleton={<TableSkeleton rows={8} testId="profitability-trends-table-skeleton" />}
        >
          <TrendsTable
            points={data?.points ?? []}
            granularity={granularity}
            empty={empty}
            showBars
          />
        </QueryBoundary>
      </TableCard>
    </ProfitabilityPageLayout>
  )
}

export default ProfitabilityTrendsPage
