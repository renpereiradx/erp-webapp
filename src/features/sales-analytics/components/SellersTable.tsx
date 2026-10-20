import { UserCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount, formatMoney, formatPercent, formatQuantity } from '@/domain/sales-analytics/format'
import type { SellerSalesData } from '@/types/bi'
import { AnalyticsTable, type AnalyticsColumn } from './AnalyticsTable'

/**
 * Ranking de vendedores por ventas (el BE ordena por `total_sales DESC` y el
 * `rank` es global, incluyendo la página). Los arrays `rankings.by_*` del
 * payload son copias de la página: no se muestran como rankings alternativos.
 */
export const SellersTable = ({ sellers }: { sellers: SellerSalesData[] }) => {
  const { t } = useI18n()

  const columns: Array<AnalyticsColumn<SellerSalesData>> = [
    {
      key: 'rank',
      header: '#',
      mono: true,
      render: (row) => formatCount(row.rank),
    },
    {
      key: 'seller',
      header: t('salesAnalytics.columns.seller', 'Vendedor'),
      render: (row) => (
        <div>
          <p className="text-body-md-bold text-foreground">{row.seller_name || '—'}</p>
          {row.top_category ? (
            <p className="text-body-sm text-on-surface-deep">
              {t('salesAnalytics.sellers.topCategory', 'Categoría top: {category}', {
                category: row.top_category,
              })}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'sales',
      align: 'right',
      header: t('salesAnalytics.columns.sales', 'Ventas'),
      render: (row) => formatMoney(row.total_sales),
    },
    {
      key: 'transactions',
      align: 'right',
      header: t('salesAnalytics.columns.transactions', 'Transacciones'),
      render: (row) => formatCount(row.transaction_count),
    },
    {
      key: 'units',
      align: 'right',
      header: t('salesAnalytics.columns.units', 'Unidades'),
      render: (row) => formatQuantity(row.units_sold),
    },
    {
      key: 'ticket',
      align: 'right',
      header: t('salesAnalytics.columns.ticket', 'Ticket promedio'),
      render: (row) => formatMoney(row.average_ticket),
    },
    {
      key: 'margin',
      align: 'right',
      header: t('salesAnalytics.columns.marginPct', 'Margen %'),
      render: (row) => formatPercent(row.gross_margin_pct),
    },
  ]

  return (
    <AnalyticsTable
      columns={columns}
      rows={sellers}
      rowKey={(row) => row.seller_id}
      minWidthClass="min-w-[860px]"
      testId="sales-sellers-table"
      empty={
        <TableEmptyState
          icon={UserCheck}
          title={t('salesAnalytics.sellers.empty', 'Sin vendedores en el período')}
          description={t(
            'salesAnalytics.sellers.emptyHint',
            'El período seleccionado no registra ventas asociadas a un vendedor.',
          )}
        />
      }
    />
  )
}

export default SellersTable
