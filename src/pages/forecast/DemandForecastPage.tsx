import { useState } from 'react'
import {
  BarChart3,
  Boxes,
  Gauge,
  Package,
  Percent,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton } from '@/components/ui/DataSkeletons'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import TablePagination from '@/components/ui/TablePagination'
import {
  ForecastControlGroup,
  ForecastHorizonSelector,
  ForecastKpiLedger,
  ForecastPageLayout,
  ForecastRefreshButton,
  ForecastTable,
  ForecastTrendBadge,
  useDemandForecast,
  useDemandForecastParams,
  useForecastRefresh,
  type ForecastColumn,
  type ForecastKpiItem,
  type ForecastKpiTone,
} from '@/features/forecast'
import type { CategoryDemand, ProductDemand } from '@/types/bi'
import { DEMAND_HORIZONS, FORECAST_PAGE_SIZE } from '@/domain/forecast/constants'
import {
  formatCount,
  formatDateTime,
  formatForecastKpiValue,
  formatSignedPercent,
} from '@/domain/forecast/format'
import { paginateRows } from '@/domain/forecast/pagination'
import {
  demandCategoryRows,
  demandKpis,
  demandPagination,
  demandTopGrowthCategory,
  demandTopProduct,
  demandTopProductRows,
} from '@/domain/forecast/demand'

interface KpiMeta {
  icon: LucideIcon
  tone: ForecastKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
  /** Hint con nombre real de categoría/producto (interpolado). */
  hintName?: 'category' | 'product'
}

const KPI_ORDER = [
  'categories',
  'historicalUnits',
  'forecastUnits',
  'topCategoryGrowth',
  'topProductUnits',
  'confidence',
] as const

const KPI_META: Record<(typeof KPI_ORDER)[number], KpiMeta> = {
  categories: {
    icon: BarChart3,
    tone: 'primary',
    labelKey: 'forecast.demand.kpi.categories',
    label: 'Categorías',
    hintKey: 'forecast.demand.kpiHints.categories',
    hint: 'Con ventas en el historial',
  },
  historicalUnits: {
    icon: Boxes,
    tone: 'neutral',
    labelKey: 'forecast.demand.kpi.historicalUnits',
    label: 'Unidades históricas',
    hintKey: 'forecast.demand.kpiHints.historicalUnits',
    hint: 'Suma de categorías',
  },
  forecastUnits: {
    icon: Package,
    tone: 'secondary',
    labelKey: 'forecast.demand.kpi.forecastUnits',
    label: 'Unidades proyectadas',
    hintKey: 'forecast.demand.kpiHints.forecastUnits',
    hint: 'Suma de categorías',
  },
  topCategoryGrowth: {
    icon: Percent,
    tone: 'success',
    labelKey: 'forecast.demand.kpi.topCategoryGrowth',
    label: 'Mayor crecimiento',
    hintKey: 'forecast.demand.kpiHints.topCategoryGrowth',
    hint: 'Categoría: {name}',
    hintName: 'category',
  },
  topProductUnits: {
    icon: TrendingUp,
    tone: 'warning',
    labelKey: 'forecast.demand.kpi.topProductUnits',
    label: 'Producto top (unidades)',
    hintKey: 'forecast.demand.kpiHints.topProductUnits',
    hint: 'Producto: {name}',
    hintName: 'product',
  },
  confidence: {
    icon: Gauge,
    tone: 'neutral',
    labelKey: 'forecast.demand.kpi.confidence',
    label: 'Confianza del modelo',
    hintKey: 'forecast.demand.kpiHints.confidence',
    hint: 'Constante del modelo',
  },
}

const PageSkeleton = () => (
  <div className="space-y-xl" aria-busy="true">
    <div className="rounded-md bg-surface p-lg shadow-whisper">
      <PanelSkeleton rows={6} />
    </div>
    <div className="rounded-md bg-surface p-lg shadow-whisper">
      <PanelSkeleton rows={6} />
    </div>
  </div>
)

/**
 * F11 — Pronóstico de demanda. Categorías completas y top de productos
 * paginado server-side; la confianza por fila es una constante del modelo y se
 * muestra una sola vez. Los totales de productos son de la página, las
 * categorías vienen completas.
 */
const DemandForecastPage = () => {
  const { t, lang } = useI18n()
  const { months, page, setMonths, setPage } = useDemandForecastParams()
  const query = useDemandForecast(months, page)
  const data = query.data
  const refresh = useForecastRefresh()

  const [categoriesPage, setCategoriesPage] = useState(1)

  const values = Object.fromEntries(
    demandKpis(data).map((row) => [row.id, row]),
  )
  const topCategory = demandTopGrowthCategory(data)
  const topProduct = demandTopProduct(data)
  const kpiItems: ForecastKpiItem[] = KPI_ORDER.map((id) => {
    const meta = KPI_META[id]
    const hint = meta.hintName
      ? t(meta.hintKey, meta.hint, {
          name:
            meta.hintName === 'category'
              ? topCategory?.category_name ?? '—'
              : topProduct?.product_name ?? '—',
        })
      : t(meta.hintKey, meta.hint)
    return {
      id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.label),
      hint,
      value: formatForecastKpiValue(
        values[id] ?? { id, kind: 'count', value: null },
      ),
    }
  })

  const categories = demandCategoryRows(data)
  const products = demandTopProductRows(data)
  const categoriesSlice = paginateRows(categories, categoriesPage, FORECAST_PAGE_SIZE)
  const pagination = demandPagination(data)

  const categoryColumns: Array<ForecastColumn<CategoryDemand>> = [
    {
      key: 'category',
      header: t('forecast.demand.columns.category', 'Categoría'),
      render: (row) => (
        <span className="text-body-md-bold text-foreground">
          {row.category_name || row.category_id || '—'}
        </span>
      ),
    },
    {
      key: 'historical',
      header: t('forecast.demand.columns.historical', 'Histórico'),
      align: 'right',
      render: (row) => formatCount(row.historical_units),
    },
    {
      key: 'forecast',
      header: t('forecast.demand.columns.forecast', 'Proyectado'),
      align: 'right',
      render: (row) => formatCount(row.forecast_units),
    },
    {
      key: 'growth',
      header: t('forecast.demand.columns.growth', 'Crecimiento'),
      align: 'right',
      render: (row) => formatSignedPercent(row.growth_rate),
    },
    {
      key: 'trend',
      header: t('forecast.demand.columns.trend', 'Tendencia'),
      render: (row) => <ForecastTrendBadge trend={row.trend} />,
    },
  ]

  const productColumns: Array<ForecastColumn<ProductDemand>> = [
    {
      key: 'product',
      header: t('forecast.demand.columns.product', 'Producto'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.product_name}</p>
          <p className="text-body-sm text-on-surface-deep">{row.category_name}</p>
        </div>
      ),
    },
    {
      key: 'historical',
      header: t('forecast.demand.columns.historical', 'Histórico'),
      align: 'right',
      render: (row) => formatCount(row.historical_units),
    },
    {
      key: 'forecast',
      header: t('forecast.demand.columns.forecast', 'Proyectado'),
      align: 'right',
      render: (row) => formatCount(row.forecast_units),
    },
    {
      key: 'growth',
      header: t('forecast.demand.columns.growth', 'Crecimiento'),
      align: 'right',
      render: (row) => formatSignedPercent(row.growth_rate),
    },
    {
      key: 'trend',
      header: t('forecast.demand.columns.trend', 'Tendencia'),
      render: (row) => <ForecastTrendBadge trend={row.trend} />,
    },
  ]

  const emptyState = (
    <TableEmptyState
      icon={Users}
      title={t('forecast.demand.emptyTitle', 'Sin demanda para proyectar')}
      description={t(
        'forecast.demand.emptyHint',
        'El período de historia no tiene ventas que permitan calcular la demanda.',
      )}
    />
  )

  return (
    <ForecastPageLayout
      title={t('forecast.demand.title', 'Pronóstico de demanda')}
      subtitle={t(
        'forecast.demand.subtitle',
        'Unidades históricas por categoría y producto, proyectadas con el crecimiento de los últimos 30 días contra los 30 anteriores.',
      )}
      meta={t('forecast.common.generatedAt', 'Generado: {date}', {
        date: formatDateTime(data?.generated_at, lang),
      })}
      toolbar={
        <>
          <div className="flex flex-wrap items-end gap-md">
            <ForecastControlGroup label={t('forecast.demand.horizonLabel', 'Horizonte')}>
              <ForecastHorizonSelector
                value={months}
                options={DEMAND_HORIZONS}
                onChange={setMonths}
                label={t('forecast.demand.horizonLabel', 'Horizonte')}
                optionLabels={Object.fromEntries(
                  DEMAND_HORIZONS.map((option) => [
                    option,
                    t('forecast.common.months', '{count} meses', { count: option }),
                  ]),
                )}
              />
            </ForecastControlGroup>
          </div>
          <ForecastRefreshButton />
        </>
      }
    >
      <QueryBoundary
        isLoading={query.isLoading}
        error={query.error}
        errorTitle={t(
          'forecast.common.errorTitle',
          'No se pudieron cargar los pronósticos',
        )}
        onRetry={() => void refresh()}
        skeleton={<PageSkeleton />}
        isEmpty={Boolean(data) && categories.length === 0 && products.length === 0}
        empty={
          <SectionCard
            title={t('forecast.demand.emptyTitle', 'Sin demanda para proyectar')}
            description={t(
              'forecast.demand.emptyHint',
              'El período de historia no tiene ventas que permitan calcular la demanda.',
            )}
            testId="forecast-demand-empty"
          >
            {emptyState}
          </SectionCard>
        }
      >
        <SectionCard
          title={t('forecast.demand.kpisTitle', 'Indicadores de demanda')}
          description={t(
            'forecast.demand.kpisDescription',
            'Sumas de las categorías y extremos reales del top de productos.',
          )}
          testId="forecast-demand-kpis-card"
        >
          <ForecastKpiLedger items={kpiItems} testId="forecast-demand-kpis" />
        </SectionCard>

        <TableCard
          title={t(
            'forecast.demand.categoriesTitle',
            'Demanda por categoría',
          )}
          description={t(
            'forecast.demand.categoriesDescription',
            'Crecimiento = últimos 30 días vs. 30 anteriores; sin base previa el backend devuelve 0.',
          )}
          testId="forecast-demand-categories"
          footer={
            categoriesSlice.totalPages > 1 ? (
              <TablePagination
                page={categoriesSlice.page}
                totalPages={categoriesSlice.totalPages}
                totalItems={categoriesSlice.totalItems}
                onPageChange={setCategoriesPage}
              />
            ) : null
          }
        >
          <ForecastTable
            columns={categoryColumns}
            rows={categoriesSlice.rows}
            rowKey={(row) => row.category_id || row.category_name}
            testId="forecast-demand-categories-table"
            minWidthClass="min-w-[620px]"
            ariaLabel={t(
              'forecast.demand.categoriesTitle',
              'Demanda por categoría',
            )}
            empty={emptyState}
          />
        </TableCard>

        <TableCard
          title={t('forecast.demand.productsTitle', 'Top de productos')}
          description={t(
            'forecast.demand.productsDescription',
            'Ordenado por unidades históricas; la página la define el backend.',
          )}
          testId="forecast-demand-products"
          footer={
            <TablePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              onPageChange={setPage}
            />
          }
        >
          <ForecastTable
            columns={productColumns}
            rows={products}
            rowKey={(row) => row.product_id || row.product_name}
            testId="forecast-demand-products-table"
            minWidthClass="min-w-[620px]"
            ariaLabel={t('forecast.demand.productsTitle', 'Top de productos')}
            empty={emptyState}
          />
        </TableCard>

        <SectionCard
          title={t('forecast.demand.notesTitle', 'Cómo leer estas cifras')}
          testId="forecast-demand-notes"
        >
          <div className="space-y-xs text-body-sm text-on-surface-deep">
            <p>
              {t(
                'forecast.demand.confidenceNote',
                'La confianza por fila es una constante del modelo (75 en categorías, 70 en productos): se muestra una sola vez.',
              )}
            </p>
            <p>
              {t(
                'forecast.demand.formulaNote',
                'Proyección = promedio mensual histórico × meses del horizonte × (1 + crecimiento).',
              )}
            </p>
            <p>
              {t(
                'forecast.demand.pageScopeNote',
                'Los totales de la tabla de productos corresponden a la página; las categorías vienen completas.',
              )}
            </p>
          </div>
        </SectionCard>
      </QueryBoundary>
    </ForecastPageLayout>
  )
}

export default DemandForecastPage
