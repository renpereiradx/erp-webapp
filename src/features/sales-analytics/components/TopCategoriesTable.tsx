import { Tags } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount, formatMoney } from '@/domain/sales-analytics/format'
import type { CategorySalesData } from '@/types/bi'
import { AnalyticsTable, type AnalyticsColumn } from './AnalyticsTable'

interface TopCategoriesTableProps {
  categories: CategorySalesData[]
}

/**
 * Top de categorías del dashboard. El payload anidado NO trae `percentage`
 * (el endpoint `/by-category` sí), así que acá no se muestra participación:
 * calcularla contra el total de ventas mezclaría bases distintas. Se omiten
 * unidades para que las 3 columnas entren en la card de 2/5 sin recortes.
 */
export const TopCategoriesTable = ({ categories }: TopCategoriesTableProps) => {
  const { t } = useI18n()

  const columns: Array<AnalyticsColumn<CategorySalesData>> = [
    {
      key: 'category',
      header: t('salesAnalytics.columns.category', 'Categoría'),
      render: (row) => (
        <div>
          <p className="text-body-md-bold text-foreground">{row.category_name || '—'}</p>
          <p className="text-body-sm text-on-surface-deep">
            {t('salesAnalytics.categories.transactionsHint', '{count} transacciones', {
              count: formatCount(row.transactions),
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'sales',
      align: 'right',
      header: t('salesAnalytics.columns.sales', 'Ventas'),
      render: (row) => formatMoney(row.sales),
    },
  ]

  return (
    <AnalyticsTable
      columns={columns}
      rows={categories}
      rowKey={(row) => row.category_id || row.category_name}
      minWidthClass="min-w-[320px]"
      testId="dashboard-top-categories-table"
      empty={
        <TableEmptyState
          icon={Tags}
          title={t('salesAnalytics.categories.topEmpty', 'Sin ventas por categoría')}
          description={t(
            'salesAnalytics.categories.topEmptyHint',
            'El período seleccionado no registra ventas con categoría.',
          )}
        />
      }
    />
  )
}

export default TopCategoriesTable
