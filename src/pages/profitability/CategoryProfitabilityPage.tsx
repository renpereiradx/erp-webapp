import { Layers, Percent, Trophy, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  CategoriesTable,
  ProfitabilityKpiLedger,
  ProfitabilityPageLayout,
  ProfitabilityPeriodSelector,
  ProfitabilityRefreshButton,
  useProfitabilityCategories,
  useProfitabilityPeriod,
} from '@/features/profitability'
import type { ProfitabilityKpiTone } from '@/features/profitability'
import { buildCategoryKpis, formatKpiValue } from '@/domain/profitability/kpis'
import { categoryExtremes } from '@/domain/profitability/categories'
import { formatMoney, formatPercent, formatPeriodRange } from '@/domain/profitability/format'

const KPI_META: Record<
  string,
  { icon: LucideIcon; tone: ProfitabilityKpiTone; labelKey: string; fallback: string; hintKey: string; hintFallback: string }
> = {
  totalCategories: {
    icon: Layers,
    tone: 'neutral',
    labelKey: 'profitability.kpis.totalCategories',
    fallback: 'Categorías con ventas',
    hintKey: 'profitability.categories.totalHint',
    hintFallback: 'Solo entran categorías cuyos productos vendieron',
  },
  totalProfit: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'profitability.kpis.totalProfit',
    fallback: 'Beneficio bruto',
    hintKey: 'profitability.categories.profitHint',
    hintFallback: 'Suma del beneficio de las categorías',
  },
  averageMargin: {
    icon: Percent,
    tone: 'warning',
    labelKey: 'profitability.kpis.averageMargin',
    fallback: 'Margen promedio',
    hintKey: 'profitability.kpis.averageMarginHint',
    hintFallback: 'Promedio simple entre categorías, no ponderado',
  },
}

/**
 * F6 — Categorías rentables: resumen, extremos por beneficio y tabla completa
 * (el endpoint no pagina ni ordena). Los productos sin categoría no entran
 * porque el SQL usa INNER JOIN a `categories`.
 */
const CategoryProfitabilityPage = () => {
  const { t, lang } = useI18n()
  const { period } = useProfitabilityPeriod()
  const categoriesQuery = useProfitabilityCategories(period)
  const data = categoriesQuery.data

  const errorTitle = t('profitability.errors.title', 'No se pudieron cargar los datos')
  const kpiRows = buildCategoryKpis(data?.report.summary)
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

  const extremes = categoryExtremes(data?.report)
  const range = data?.report.period ? formatPeriodRange(data.report.period, lang) : undefined

  const empty = (
    <TableEmptyState
      icon={Layers}
      title={t('profitability.categories.empty', 'Sin categorías con ventas en el período')}
      description={t(
        'profitability.categories.emptyHint',
        'Solo aparecen categorías cuyos productos vendieron.',
      )}
    />
  )

  return (
    <ProfitabilityPageLayout
      title={t('profitability.categories.title', 'Rentabilidad por categoría')}
      subtitle={t(
        'profitability.categories.subtitle',
        'Beneficio y margen por categoría, con su participación en los totales.',
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
        title={t('profitability.categories.summaryTitle', 'Resumen del período')}
        description={t(
          'profitability.categories.summarySubtitle',
          'El margen promedio es simple entre categorías; la participación se calcula sobre los totales de la tabla.',
        )}
        testId="profitability-categories-summary-card"
      >
        <QueryBoundary
          isLoading={categoriesQuery.isLoading}
          error={categoriesQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void categoriesQuery.refetch()}
          skeleton={<PanelSkeleton rows={3} testId="profitability-categories-summary-skeleton" />}
        >
          <ProfitabilityKpiLedger items={kpiItems} testId="profitability-categories-kpi-ledger" />
        </QueryBoundary>
      </SectionCard>

      <SectionCard
        title={t('profitability.categories.extremesTitle', 'Extremos por beneficio')}
        description={t(
          'profitability.categories.extremesSubtitle',
          'Primera y última categoría del orden real por beneficio del período.',
        )}
        testId="profitability-categories-extremes-card"
      >
        <QueryBoundary
          isLoading={categoriesQuery.isLoading}
          error={categoriesQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void categoriesQuery.refetch()}
          skeleton={<PanelSkeleton rows={2} testId="profitability-categories-extremes-skeleton" />}
        >
          <dl className="grid gap-md sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-xs text-label-caps uppercase text-on-surface-deep">
                <Trophy size={14} aria-hidden="true" />
                {t('profitability.categories.best', 'Mayor beneficio')}
              </dt>
              <dd className="text-body-md-bold text-foreground">
                {extremes.best
                  ? `${extremes.best.category_name} · ${formatMoney(extremes.best.gross_profit)}`
                  : t('profitability.common.unavailable', '—')}
              </dd>
              {extremes.best ? (
                <dd className="font-data-mono text-data-mono text-on-surface-deep">
                  {formatPercent(extremes.best.gross_margin_pct)}
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="text-label-caps uppercase text-on-surface-deep">
                {t('profitability.categories.worst', 'Menor beneficio')}
              </dt>
              <dd className="text-body-md-bold text-foreground">
                {extremes.worst
                  ? `${extremes.worst.category_name} · ${formatMoney(extremes.worst.gross_profit)}`
                  : t('profitability.common.unavailable', '—')}
              </dd>
              {extremes.worst ? (
                <dd className="font-data-mono text-data-mono text-on-surface-deep">
                  {formatPercent(extremes.worst.gross_margin_pct)}
                </dd>
              ) : null}
            </div>
          </dl>
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={t('profitability.categories.tableTitle', 'Detalle por categoría')}
        description={t(
          'profitability.categories.tableSubtitle',
          'Sin paginación: el endpoint devuelve todas las categorías del período. La columna “% del beneficio” es la participación real.',
        )}
        testId="profitability-categories-table-card"
      >
        <QueryBoundary
          isLoading={categoriesQuery.isLoading}
          error={categoriesQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void categoriesQuery.refetch()}
          skeleton={<TableSkeleton rows={6} testId="profitability-categories-table-skeleton" />}
        >
          <CategoriesTable
            rows={data?.categories ?? []}
            totalProfit={data?.report.summary.total_profit}
            empty={empty}
          />
        </QueryBoundary>
      </TableCard>
    </ProfitabilityPageLayout>
  )
}

export default CategoryProfitabilityPage
