import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import { getMarginTone } from '@/domain/dashboard/topProducts'
import type { TopProduct } from '@/types/bi'
import { DashboardSection } from './DashboardSection'
import { QueryBoundary } from './QueryBoundary'
import { PanelSkeleton } from './Skeletons'

interface TopProductsPreviewProps {
  products: TopProduct[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
}

/** Vista compacta del top 5 para el Resumen Ejecutivo. */
export const TopProductsPreview = ({
  products,
  isLoading,
  error,
  onRetry,
}: TopProductsPreviewProps) => {
  const { t } = useI18n()

  return (
    <DashboardSection
      title={t('dashboard.topProducts.preview.title', 'Productos con mejor desempeño')}
      description={t('dashboard.topProducts.preview.subtitle', 'Top por ingresos en el período.')}
      action={
        <Link
          to="/dashboard/top-products"
          className="text-body-sm-bold text-primary hover:underline"
        >
          {t('dashboard.actions.viewAll', 'Ver todas')}
        </Link>
      }
      testId="dashboard-top-products-preview"
    >
      <QueryBoundary
        isLoading={isLoading}
        error={error}
        errorTitle={t('dashboard.errors.title', 'No se pudieron cargar los datos')}
        onRetry={onRetry}
        skeleton={<PanelSkeleton rows={5} />}
        isEmpty={products.length === 0}
        empty={
          <p className="text-body-md text-on-surface-deep">
            {t('dashboard.topProducts.empty.description', 'Sin ventas registradas en el período.')}
          </p>
        }
      >
        <ul className="divide-y divide-divider">
          {products.map((product) => (
            <li
              key={`${product.id}-${product.variant_id ?? 'base'}`}
              className="flex items-center gap-md py-sm first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md-bold text-foreground">{product.name}</p>
                <p className="text-body-sm text-on-surface-deep">
                  {product.category} · {formatNumber(product.quantity_sold, 2)}{' '}
                  {t('dashboard.topProducts.table.unitsShort', 'vendidas')}
                </p>
              </div>
              <Badge variant={getMarginTone(product.margin_percentage)} size="sm">
                {formatNumber(product.margin_percentage, 1)}%
              </Badge>
              <span className="shrink-0 font-data-mono text-data-mono text-foreground">
                {formatPYG(product.revenue)}
              </span>
            </li>
          ))}
        </ul>
      </QueryBoundary>
    </DashboardSection>
  )
}
