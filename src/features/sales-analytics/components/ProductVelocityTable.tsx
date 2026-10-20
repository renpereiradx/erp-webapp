import { Gauge } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount, formatMoney } from '@/domain/sales-analytics/format'
import { getSelloutState, velocityLevelKey } from '@/domain/sales-analytics/velocity'
import type { ProductVelocity } from '@/types/bi'
import { AnalyticsTable, type AnalyticsColumn } from './AnalyticsTable'

const LEVEL_FALLBACKS = {
  fast: 'Rápida',
  medium: 'Media',
  slow: 'Lenta',
} as const

const LEVEL_CLASSES = {
  fast: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  slow: 'bg-surface-muted text-on-surface-deep',
} as const

/**
 * Velocidad por producto (top 20 por unidades/día, límite del BE). `velocity`
 * la clasifica el backend con umbrales fijos (5 y 1 uds./día); la UI no los
 * recalcula ni los presenta como metas.
 */
export const ProductVelocityTable = ({ products }: { products: ProductVelocity[] }) => {
  const { t } = useI18n()

  const columns: Array<AnalyticsColumn<ProductVelocity>> = [
    {
      key: 'product',
      header: t('salesAnalytics.columns.product', 'Producto'),
      render: (row) => (
        <p className="text-body-md-bold text-foreground">{row.product_name || '—'}</p>
      ),
    },
    {
      key: 'unitsPerDay',
      align: 'right',
      header: t('salesAnalytics.velocity.columns.unitsPerDay', 'Unidades/día'),
      render: (row) => formatCount(row.units_per_day, 2),
    },
    {
      key: 'salesPerDay',
      align: 'right',
      header: t('salesAnalytics.velocity.columns.salesPerDay', 'Ventas/día'),
      render: (row) => formatMoney(row.sales_per_day),
    },
    {
      key: 'stock',
      align: 'right',
      header: t('salesAnalytics.velocity.columns.stock', 'Stock actual'),
      render: (row) => formatCount(row.current_stock),
    },
    {
      key: 'sellout',
      align: 'right',
      header: t('salesAnalytics.velocity.columns.sellout', 'Días para agotar'),
      render: (row) => {
        const state = getSelloutState(row.current_stock, row.days_to_sellout)
        if (state.kind === 'out') {
          return t('salesAnalytics.velocity.outOfStock', 'Sin stock')
        }
        if (state.kind === 'unknown') return '—'
        return `${formatCount(state.days, 1)} ${t('salesAnalytics.duration.days', 'días')}`
      },
    },
    {
      key: 'velocity',
      header: t('salesAnalytics.velocity.columns.level', 'Velocidad'),
      render: (row) => {
        const level = velocityLevelKey(row.velocity)
        return (
          <span
            className={`inline-flex rounded-full px-sm py-xs text-body-sm-bold ${LEVEL_CLASSES[level]}`}
          >
            {t(`salesAnalytics.velocity.level.${level}`, LEVEL_FALLBACKS[level])}
          </span>
        )
      },
    },
  ]

  return (
    <AnalyticsTable
      columns={columns}
      rows={products}
      rowKey={(row) => row.product_id}
      minWidthClass="min-w-[900px]"
      testId="product-velocity-table"
      empty={
        <TableEmptyState
          icon={Gauge}
          title={t('salesAnalytics.velocity.productEmpty', 'Sin productos vendidos')}
          description={t(
            'salesAnalytics.velocity.productEmptyHint',
            'El período seleccionado no registra ventas de productos.',
          )}
        />
      }
    />
  )
}

export default ProductVelocityTable
