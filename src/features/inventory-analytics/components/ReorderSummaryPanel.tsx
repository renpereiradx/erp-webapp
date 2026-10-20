import { useI18n } from '@/lib/i18n'
import { formatCount, formatMoney } from '@/domain/inventory-analytics/format'
import { buildReorderSummary } from '@/domain/inventory-analytics/reorder'
import type { ReorderSummary } from '@/types/bi'

interface ReorderSummaryPanelProps {
  summary?: ReorderSummary
}

/** Resumen del análisis de reposición (conteos y costo estimado real). */
export const ReorderSummaryPanel = ({ summary }: ReorderSummaryPanelProps) => {
  const { t } = useI18n()
  const view = buildReorderSummary(summary)

  const items = [
    {
      id: 'total',
      label: t('inventoryAnalytics.reorder.total', 'Productos a reponer'),
      value: formatCount(view.total),
    },
    {
      id: 'urgent',
      label: t('inventoryAnalytics.reorder.urgent', 'Urgentes'),
      value: formatCount(view.urgent),
    },
    {
      id: 'soon',
      label: t('inventoryAnalytics.reorder.soon', 'Próximos'),
      value: formatCount(view.soon),
    },
    {
      id: 'cost',
      label: t('inventoryAnalytics.reorder.estimatedCost', 'Costo estimado'),
      value: view.estimatedCost === null ? '—' : formatMoney(view.estimatedCost),
    },
  ]

  return (
    <div data-testid="inventory-reorder-summary">
      <dl className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-md bg-surface-muted p-md">
            <dt className="text-label-caps uppercase text-on-surface-deep">{item.label}</dt>
            <dd className="mt-xs whitespace-nowrap font-data-mono text-title-md text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {view.hasMissingCost ? (
        <p className="mt-sm text-body-sm text-on-surface-deep">
          {t(
            'inventoryAnalytics.reorder.estimatedCostMissing',
            'El reporte no tiene costo unitario para estos productos.',
          )}
        </p>
      ) : null}
    </div>
  )
}

export default ReorderSummaryPanel
