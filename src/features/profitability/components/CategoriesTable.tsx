import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import type { CategoryProfitabilityRow } from '@/types/bi'
import { categoryShareAvailable } from '@/domain/profitability/categories'
import { formatMoney, formatPercent, formatUnits } from '@/domain/profitability/format'
import { PerformanceBadge } from './ProfitabilityBadge'
import { ProfitabilityTable, type ProfitabilityColumn } from './ProfitabilityTable'

interface CategoriesTableProps {
  rows: CategoryProfitabilityRow[]
  /** Beneficio total del resumen: habilita la participación. */
  totalProfit: number | null | undefined
  empty: ReactNode
  /** Dashboard: categoría, beneficio, margen y participación. */
  variant?: 'full' | 'compact'
  testId?: string
}

/**
 * Tabla de categorías. `contribution_pct` es una copia de `profit_share` del
 * SQL: se muestra una sola vez. El recargo promedio puede ser alto por costos
 * ínfimos; es el número real del BE.
 */
export const CategoriesTable = ({
  rows,
  totalProfit,
  empty,
  variant = 'full',
  testId = 'categories-table',
}: CategoriesTableProps) => {
  const { t } = useI18n()
  const showShare = categoryShareAvailable(totalProfit)

  const columns: Array<ProfitabilityColumn<CategoryProfitabilityRow>> = [
    {
      key: 'category',
      header: t('profitability.columns.category', 'Categoría'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.category_name}</p>
          <p className="text-body-sm text-on-surface-deep">
            {t('profitability.categories.productCount', '{n} productos', {
              n: row.product_count,
            })}
          </p>
        </div>
      ),
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
      render: (row) => formatPercent(row.gross_margin_pct),
    },
  ]

  if (variant === 'compact') {
    return (
      <ProfitabilityTable
        columns={[
          ...columns,
          ...(showShare
            ? [
                {
                  key: 'share',
                  header: t('profitability.columns.profitShare', '% del beneficio'),
                  align: 'right' as const,
                  render: (row: CategoryProfitabilityRow) =>
                    formatPercent(row.profit_share),
                },
              ]
            : []),
        ]}
        rows={rows}
        rowKey={(row) => row.category_id}
        empty={empty}
        minWidthClass="min-w-[560px]"
        testId={testId}
        caption={t('profitability.categories.tableCaption', 'Rentabilidad por categoría')}
      />
    )
  }

  const full: Array<ProfitabilityColumn<CategoryProfitabilityRow>> = [
    ...columns,
    {
      key: 'products',
      header: t('profitability.columns.products', 'Productos'),
      align: 'right',
      render: (row) => row.product_count,
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
      key: 'cost',
      header: t('profitability.columns.cost', 'Costo'),
      align: 'right',
      render: (row) => formatMoney(row.cost),
    },
    {
      key: 'markup',
      header: t('profitability.columns.markup', 'Recargo s/ costo'),
      align: 'right',
      render: (row) => formatPercent(row.average_markup),
    },
    ...(showShare
      ? [
          {
            key: 'revenueShare',
            header: t('profitability.columns.revenueShare', '% de ingresos'),
            align: 'right' as const,
            render: (row: CategoryProfitabilityRow) => formatPercent(row.revenue_share),
          },
          {
            key: 'profitShare',
            header: t('profitability.columns.profitShare', '% del beneficio'),
            align: 'right' as const,
            render: (row: CategoryProfitabilityRow) => formatPercent(row.profit_share),
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
      columns={full}
      rows={rows}
      rowKey={(row) => row.category_id}
      empty={empty}
      minWidthClass="min-w-[1040px]"
      dense
      testId={testId}
      caption={t('profitability.categories.tableCaption', 'Rentabilidad por categoría')}
    />
  )
}

export default CategoriesTable
