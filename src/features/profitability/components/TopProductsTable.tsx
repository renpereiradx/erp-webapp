import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import type { ProductProfitabilityRow } from '@/types/bi'
import { derivedMarginPct } from '@/domain/profitability/products'
import { formatMoney, formatPercent, formatUnits } from '@/domain/profitability/format'
import { ProfitabilityTable, type ProfitabilityColumn } from './ProfitabilityTable'

interface TopProductsTableProps {
  rows: ProductProfitabilityRow[]
  empty: ReactNode
  testId?: string
}

/**
 * Top de productos del dashboard. Usa `top_profitable`, cuyos SELECTs dejan
 * `gross_margin_pct`/`contribution_pct`/`profit_per_unit` en 0: el margen se
 * deriva de revenue/beneficio y no se muestran las columnas vacías.
 */
export const TopProductsTable = ({
  rows,
  empty,
  testId = 'top-products-table',
}: TopProductsTableProps) => {
  const { t } = useI18n()

  const columns: Array<ProfitabilityColumn<ProductProfitabilityRow>> = [
    {
      key: 'product',
      header: t('profitability.columns.product', 'Producto'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.product_name}</p>
          <p className="text-body-sm text-on-surface-deep">{row.category_name}</p>
        </div>
      ),
    },
    {
      key: 'units',
      header: t('profitability.columns.units', 'Unidades'),
      align: 'right',
      render: (row) => formatUnits(row.units_sold),
    },
    {
      key: 'revenue',
      header: t('profitability.columns.revenue', 'Ingresos'),
      align: 'right',
      render: (row) => formatMoney(row.revenue),
    },
    {
      key: 'profit',
      header: t('profitability.columns.profit', 'Beneficio'),
      align: 'right',
      render: (row) => formatMoney(row.gross_profit),
    },
    {
      key: 'margin',
      header: t('profitability.columns.margin', 'Margen'),
      align: 'right',
      render: (row) => formatPercent(derivedMarginPct(row)),
    },
  ]

  return (
    <ProfitabilityTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.product_id}
      empty={empty}
      minWidthClass="min-w-[620px]"
      testId={testId}
      caption={t('profitability.dashboard.topProductsCaption', 'Productos con mayor beneficio')}
    />
  )
}

export default TopProductsTable
