import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import type { ProductProfitabilityRow, ProfitabilitySortOrder } from '@/types/bi'
import type { ProfitabilityProductSortBy } from '@/types/bi'
import {
  contributionAvailable,
  isUnprofitable,
  productAriaSort,
} from '@/domain/profitability/products'
import { formatMoney, formatPercent, formatUnits } from '@/domain/profitability/format'
import { PerformanceBadge } from './ProfitabilityBadge'
import { ProfitabilityTable, type ProfitabilityColumn } from './ProfitabilityTable'

interface ProductsTableProps {
  rows: ProductProfitabilityRow[]
  sort: ProfitabilitySortOrder
  onSort: (field: ProfitabilityProductSortBy) => void
  /** Beneficio total del resumen: habilita la columna de contribución. */
  totalProfit: number | null | undefined
  empty: ReactNode
  testId?: string
}

const SortHeaderButton = ({
  label,
  active,
  order,
  onClick,
}: {
  label: string
  active: boolean
  order: 'ASC' | 'DESC'
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-xs text-left uppercase hover:text-foreground"
  >
    {label}
    <span aria-hidden="true" className={active ? 'text-primary' : 'opacity-40'}>
      {active && order === 'ASC' ? '↑' : '↓'}
    </span>
  </button>
)

/**
 * Tabla de productos del período. El orden (incluido `name`) y la paginación
 * son server-side; `rank` del BE es por beneficio y no se muestra como puesto
 * de la página. Sin columna SKU porque el SQL devuelve cadena vacía.
 */
export const ProductsTable = ({
  rows,
  sort,
  onSort,
  totalProfit,
  empty,
  testId = 'products-table',
}: ProductsTableProps) => {
  const { t } = useI18n()
  const showContribution = contributionAvailable(totalProfit)

  const header = (field: ProfitabilityProductSortBy, label: string) => (
    <SortHeaderButton
      label={label}
      active={sort.by === field}
      order={sort.order}
      onClick={() => onSort(field)}
    />
  )

  const columns: Array<ProfitabilityColumn<ProductProfitabilityRow>> = [
    {
      key: 'product',
      header: header('name', t('profitability.columns.product', 'Producto')),
      ariaSort: productAriaSort(sort, 'name'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.product_name}</p>
          <p className="text-body-sm text-on-surface-deep">
            {row.category_name || t('profitability.common.noCategory', 'Sin categoría')}
            {row.brand_name ? (
              <>
                <span aria-hidden="true"> · </span>
                {row.brand_name}
              </>
            ) : null}
          </p>
        </div>
      ),
    },
    {
      key: 'units',
      header: header('units', t('profitability.columns.units', 'Unidades')),
      align: 'right',
      ariaSort: productAriaSort(sort, 'units'),
      render: (row) => formatUnits(row.units_sold),
    },
    {
      key: 'revenue',
      header: header('revenue', t('profitability.columns.revenue', 'Ingresos')),
      align: 'right',
      ariaSort: productAriaSort(sort, 'revenue'),
      render: (row) => formatMoney(row.revenue),
    },
    {
      key: 'cost',
      header: t('profitability.columns.cost', 'Costo'),
      align: 'right',
      render: (row) => formatMoney(row.cost),
    },
    {
      key: 'profit',
      header: header('profit', t('profitability.columns.profit', 'Beneficio')),
      align: 'right',
      ariaSort: productAriaSort(sort, 'profit'),
      render: (row) => (
        <span className={isUnprofitable(row) ? 'text-error' : undefined}>
          {formatMoney(row.gross_profit)}
        </span>
      ),
    },
    {
      key: 'margin',
      header: header('margin', t('profitability.columns.margin', 'Margen')),
      align: 'right',
      ariaSort: productAriaSort(sort, 'margin'),
      render: (row) => formatPercent(row.gross_margin_pct),
    },
    {
      key: 'markup',
      header: t('profitability.columns.markup', 'Recargo s/ costo'),
      align: 'right',
      render: (row) => formatPercent(row.markup),
    },
    ...(showContribution
      ? [
          {
            key: 'contribution',
            header: t('profitability.columns.contribution', '% del beneficio'),
            align: 'right' as const,
            render: (row: ProductProfitabilityRow) => formatPercent(row.contribution_pct),
          },
        ]
      : []),
    {
      key: 'performance',
      header: t('profitability.columns.performance', 'Desempeño'),
      render: (row) => (
        <PerformanceBadge
          performance={row.performance}
          label={(key, fallback) => t(`profitability.performance.${key}`, fallback)}
        />
      ),
    },
  ]

  return (
    <ProfitabilityTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.product_id}
      empty={empty}
      minWidthClass="min-w-[1040px]"
      dense
      testId={testId}
      caption={t('profitability.products.tableCaption', 'Rentabilidad por producto')}
    />
  )
}

export default ProductsTable
