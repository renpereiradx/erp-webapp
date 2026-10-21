import {
  AlertTriangle,
  Boxes,
  Gauge,
  Layers,
  PackageSearch,
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
  ForecastAlertsPanel,
  ForecastControlGroup,
  ForecastHorizonSelector,
  ForecastKpiLedger,
  ForecastPageLayout,
  ForecastRefreshButton,
  ForecastRiskBadge,
  ForecastTable,
  ForecastTrendBadge,
  useForecastRefresh,
  useInventoryForecast,
  useInventoryForecastParams,
  type ForecastColumn,
  type ForecastKpiItem,
  type ForecastKpiTone,
} from '@/features/forecast'
import type { ProductInventoryForecast } from '@/types/bi'
import { INVENTORY_HORIZONS } from '@/domain/forecast/constants'
import {
  formatCount,
  formatDateTime,
  formatDecimal,
  formatForecastKpiValue,
  formatLocalDate,
} from '@/domain/forecast/format'
import {
  inventoryAlertCounts,
  inventoryAlertViews,
  inventoryKpis,
  inventoryPagination,
  inventoryRiskRows,
  inventoryStockoutDays,
} from '@/domain/forecast/inventory'

interface KpiMeta {
  icon: LucideIcon
  tone: ForecastKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const KPI_ORDER = [
  'coverage',
  'currentStock',
  'projectedDemand',
  'highRisk',
  'mediumRisk',
  'totalProducts',
] as const

const KPI_META: Record<(typeof KPI_ORDER)[number], KpiMeta> = {
  coverage: {
    icon: Gauge,
    tone: 'primary',
    labelKey: 'forecast.inventory.kpi.coverage',
    label: 'Cobertura',
    hintKey: 'forecast.inventory.kpiHints.coverage',
    hint: 'Días de demanda cubiertos',
  },
  currentStock: {
    icon: Boxes,
    tone: 'secondary',
    labelKey: 'forecast.inventory.kpi.currentStock',
    label: 'Stock actual',
    hintKey: 'forecast.inventory.kpiHints.currentStock',
    hint: 'Unidades en stock',
  },
  projectedDemand: {
    icon: PackageSearch,
    tone: 'neutral',
    labelKey: 'forecast.inventory.kpi.projectedDemand',
    label: 'Demanda proyectada',
    hintKey: 'forecast.inventory.kpiHints.projectedDemand',
    hint: 'Unidades del horizonte',
  },
  highRisk: {
    icon: AlertTriangle,
    tone: 'error',
    labelKey: 'forecast.inventory.kpi.highRisk',
    label: 'Riesgo alto',
    hintKey: 'forecast.inventory.kpiHints.highRisk',
    hint: 'Quiebre en 3 días o menos',
  },
  mediumRisk: {
    icon: AlertTriangle,
    tone: 'warning',
    labelKey: 'forecast.inventory.kpi.mediumRisk',
    label: 'Riesgo medio',
    hintKey: 'forecast.inventory.kpiHints.mediumRisk',
    hint: 'Quiebre en 7 días o menos',
  },
  totalProducts: {
    icon: Layers,
    tone: 'neutral',
    labelKey: 'forecast.inventory.kpi.totalProducts',
    label: 'Productos analizados',
    hintKey: 'forecast.inventory.kpiHints.totalProducts',
    hint: 'Set completo (máx. 100)',
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
 * F11 — Salud de inventario. La página consume `/forecast/inventory` con
 * página server-side; el summary (cobertura, conteos) se calcula sobre el set
 * completo. `999` se rotula "Sin ventas en 90 días" y las alertas traducen el
 * `type` del backend, nunca su `message` en español.
 */
const InventoryForecastPage = () => {
  const { t, lang } = useI18n()
  const { days, page, setDays, setPage } = useInventoryForecastParams()
  const query = useInventoryForecast(days, page)
  const data = query.data
  const refresh = useForecastRefresh()

  const values = Object.fromEntries(
    inventoryKpis(data).map((row) => [row.id, row]),
  )
  const kpiItems: ForecastKpiItem[] = KPI_ORDER.map((id) => {
    const meta = KPI_META[id]
    return {
      id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.label),
      hint: t(meta.hintKey, meta.hint),
      value: formatForecastKpiValue(
        values[id] ?? { id, kind: 'count', value: null },
      ),
    }
  })

  const alertViews = inventoryAlertViews(data)
  const alertCounts = inventoryAlertCounts(data)
  const pagination = inventoryPagination(data)
  const products = data?.products ?? []
  const riskRows = inventoryRiskRows(data)

  const columns: Array<ForecastColumn<ProductInventoryForecast>> = [
    {
      key: 'product',
      header: t('forecast.inventory.columns.product', 'Producto'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.product_name}</p>
          <p className="font-data-mono text-data-mono text-on-surface-deep">
            {row.product_id}
          </p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: t('forecast.inventory.columns.stock', 'Stock'),
      align: 'right',
      render: (row) => formatCount(row.current_stock),
    },
    {
      key: 'dailySales',
      header: t('forecast.inventory.columns.dailySales', 'Venta diaria'),
      align: 'right',
      render: (row) => formatDecimal(row.average_daily_sales, 2),
    },
    {
      key: 'projectedDemand',
      header: t(
        'forecast.inventory.columns.projectedDemand',
        'Demanda proyectada',
      ),
      align: 'right',
      render: (row) => formatCount(row.projected_demand),
    },
    {
      key: 'days',
      header: t('forecast.inventory.columns.daysToStockout', 'Días restantes'),
      align: 'right',
      render: (row) => {
        const stockoutDays = inventoryStockoutDays(row)
        if (stockoutDays === null) {
          return (
            <span className="text-on-surface-deep">
              {t(
                'forecast.inventory.noVelocity',
                'Sin ventas en 90 días',
              )}
            </span>
          )
        }
        return (
          <div>
            <p>{formatCount(stockoutDays)}</p>
            {row.reorder_date ? (
              <p className="text-body-sm text-on-surface-deep">
                {t('forecast.inventory.reorderBefore', 'Reponer antes del {date}', {
                  date: formatLocalDate(row.reorder_date, lang),
                })}
              </p>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'reorderPoint',
      header: t('forecast.inventory.columns.reorderPoint', 'Punto de reorden'),
      align: 'right',
      render: (row) => formatCount(row.reorder_point),
    },
    {
      key: 'suggestedReorder',
      header: t(
        'forecast.inventory.columns.suggestedReorder',
        'Reposición sugerida',
      ),
      align: 'right',
      render: (row) => formatCount(row.suggested_reorder),
    },
    {
      key: 'risk',
      header: t('forecast.inventory.columns.risk', 'Riesgo'),
      render: (row) => <ForecastRiskBadge risk={row.stockout_risk} />,
    },
    {
      key: 'trend',
      header: t('forecast.inventory.columns.trend', 'Tendencia'),
      render: (row) => <ForecastTrendBadge trend={row.trend} />,
    },
  ]

  return (
    <ForecastPageLayout
      title={t('forecast.inventory.title', 'Salud de inventario')}
      subtitle={t(
        'forecast.inventory.subtitle',
        'Velocidad de venta de los últimos 90 días proyectada sobre el horizonte. El riesgo y la reposición los calcula el backend.',
      )}
      meta={t('forecast.common.generatedAt', 'Generado: {date}', {
        date: formatDateTime(data?.generated_at, lang),
      })}
      toolbar={
        <>
          <div className="flex flex-wrap items-end gap-md">
            <ForecastControlGroup
              label={t('forecast.inventory.horizonLabel', 'Horizonte')}
            >
              <ForecastHorizonSelector
                value={days}
                options={INVENTORY_HORIZONS}
                onChange={setDays}
                label={t('forecast.inventory.horizonLabel', 'Horizonte')}
                optionLabels={Object.fromEntries(
                  INVENTORY_HORIZONS.map((option) => [
                    option,
                    t('forecast.common.days', '{count} días', { count: option }),
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
      >
        <SectionCard
          title={t(
            'forecast.inventory.kpisTitle',
            'Indicadores del inventario',
          )}
          description={t(
            'forecast.inventory.kpisDescription',
            'Cobertura y conteos sobre el set completo analizado por el backend (máximo 100 productos).',
          )}
          testId="forecast-inventory-kpis-card"
        >
          <ForecastKpiLedger
            items={kpiItems}
            testId="forecast-inventory-kpis"
          />
        </SectionCard>

        <div className="grid gap-lg xl:grid-cols-2">
          <SectionCard
            title={t('forecast.inventory.alertsTitle', 'Alertas de quiebre')}
            description={t(
              'forecast.inventory.alertsDescription',
              'Las genera el backend para riesgo alto (quiebre inminente) y medio (stock bajo). Se muestran las primeras; el total real va en el resumen.',
            )}
            testId="forecast-inventory-alerts"
          >
            <ForecastAlertsPanel
              alerts={alertViews}
              counts={alertCounts}
              testId="forecast-alerts-list"
            />
          </SectionCard>

          <SectionCard
            title={t(
              'forecast.inventory.riskTitle',
              'Distribución de riesgo',
            )}
            description={t(
              'forecast.inventory.riskDescription',
              'Conteos del set completo. Los estados se superponen porque el backend aplica umbrales de días hasta el quiebre.',
            )}
            testId="forecast-inventory-risk"
          >
            <dl className="divide-y divide-divider">
              {riskRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-md py-sm first:pt-0 last:pb-0"
                  data-testid={`forecast-risk-${row.id.toLowerCase()}`}
                >
                  <dt>
                    <ForecastRiskBadge risk={row.id} />
                  </dt>
                  <dd className="font-data-mono text-title-sm text-foreground">
                    {formatCount(row.value)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-md text-body-sm text-on-surface-deep">
              {t(
                'forecast.inventory.notes.riskThresholds',
                'Riesgo por días hasta el quiebre: alto ≤ 3, medio ≤ 7, bajo ≤ 14.',
              )}
            </p>
            <p className="mt-xs text-body-sm text-on-surface-deep">
              {t(
                'forecast.inventory.pageScopeNote',
                'La cobertura y los conteos usan el set completo; la tabla muestra solo la página actual.',
              )}
            </p>
          </SectionCard>
        </div>

        <TableCard
          title={t('forecast.inventory.tableTitle', 'Productos')}
          description={t(
            'forecast.inventory.tableDescription',
            'La velocidad diaria se calcula sobre los días con ventas de los últimos 90 días, no sobre los 90.',
          )}
          testId="forecast-inventory-products"
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
            columns={columns}
            rows={products}
            rowKey={(row) => row.product_id}
            dense
            minWidthClass="min-w-[1040px]"
            testId="forecast-inventory-table"
            ariaLabel={t('forecast.inventory.tableTitle', 'Productos')}
            empty={
              <TableEmptyState
                icon={Boxes}
                title={t(
                  'forecast.inventory.emptyTitle',
                  'Sin productos para analizar',
                )}
                description={t(
                  'forecast.inventory.emptyHint',
                  'El endpoint no devolvió productos activos con el horizonte pedido.',
                )}
              />
            }
          />
        </TableCard>

        <SectionCard
          title={t('forecast.inventory.notesTitle', 'Cómo leer estas cifras')}
          testId="forecast-inventory-notes"
        >
          <div className="space-y-xs text-body-sm text-on-surface-deep">
            <p>
              {t(
                'forecast.inventory.notes.dailySales',
                'La venta diaria es el total vendido en 90 días dividido por los días con ventas.',
              )}
            </p>
            <p>
              {t(
                'forecast.inventory.notes.sentinel',
                '999 significa "sin velocidad de venta": se muestra como "Sin ventas en 90 días", no como 999 días.',
              )}
            </p>
            <p>
              {t(
                'forecast.inventory.notes.reorder',
                'Reposición sugerida = demanda proyectada + stock de seguridad − stock actual.',
              )}
            </p>
            <p>
              {t(
                'forecast.inventory.riskDescription',
                'Conteos del set completo. Los estados se superponen porque el backend aplica umbrales de días hasta el quiebre.',
              )}
            </p>
          </div>
        </SectionCard>
      </QueryBoundary>
    </ForecastPageLayout>
  )
}

export default InventoryForecastPage
