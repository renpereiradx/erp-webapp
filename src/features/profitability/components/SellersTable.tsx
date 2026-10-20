import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import type { SellerProfitabilityRow } from '@/types/bi'
import { sellerContributionAvailable, sellerName, sellerRank } from '@/domain/profitability/sellers'
import { formatCount, formatMoney, formatPercent } from '@/domain/profitability/format'
import { ProfitabilityTable, type ProfitabilityColumn } from './ProfitabilityTable'

interface SellersTableProps {
  rows: SellerProfitabilityRow[]
  /** Beneficio total del resumen: habilita la participación. */
  totalProfit: number | null | undefined
  empty: ReactNode
  testId?: string
}

/**
 * Ranking de vendedores por beneficio. `total_sales` es COUNT(DISTINCT orden):
 * no hay fan-out de líneas (el bug T15 de la auditoría no está en este SQL).
 * La contribución solo se muestra con beneficio total positivo.
 */
export const SellersTable = ({
  rows,
  totalProfit,
  empty,
  testId = 'sellers-table',
}: SellersTableProps) => {
  const { t } = useI18n()
  const showContribution = sellerContributionAvailable(totalProfit)

  const columns: Array<ProfitabilityColumn<SellerProfitabilityRow>> = [
    {
      key: 'rank',
      header: t('profitability.columns.rank', 'Puesto'),
      align: 'right',
      render: (row, index) => (
        <span className="font-data-mono text-data-mono text-on-surface-deep">
          {sellerRank(row) ?? index + 1}
        </span>
      ),
    },
    {
      key: 'seller',
      header: t('profitability.columns.seller', 'Vendedor'),
      render: (row) => (
        <p className="text-body-md-bold text-foreground">{sellerName(row)}</p>
      ),
    },
    {
      key: 'sales',
      header: t('profitability.columns.sales', 'Ventas'),
      align: 'right',
      render: (row) => formatCount(row.total_sales),
    },
    {
      key: 'revenue',
      header: t('profitability.columns.revenue', 'Ingresos'),
      align: 'right',
      render: (row) => formatMoney(row.total_revenue),
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
    {
      key: 'ticket',
      header: t('profitability.columns.avgTicket', 'Ticket promedio'),
      align: 'right',
      render: (row) => formatMoney(row.average_ticket),
    },
    ...(showContribution
      ? [
          {
            key: 'contribution',
            header: t('profitability.columns.contribution', '% del beneficio'),
            align: 'right' as const,
            render: (row: SellerProfitabilityRow) => formatPercent(row.contribution_pct),
          },
        ]
      : []),
  ]

  return (
    <ProfitabilityTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.seller_id}
      empty={empty}
      minWidthClass="min-w-[860px]"
      dense
      testId={testId}
      caption={t('profitability.sellers.tableCaption', 'Rentabilidad por vendedor')}
    />
  )
}

export default SellersTable
