import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import type { CustomerProfitabilityRow } from '@/types/bi'
import {
  customerContributionAvailable,
  customerName,
  customerRecencyDays,
  segmentKey,
  segmentTone,
} from '@/domain/profitability/customers'
import {
  formatCount,
  formatDays,
  formatIsoDate,
  formatMoney,
  formatPercent,
} from '@/domain/profitability/format'
import { ProfitabilityBadge } from './ProfitabilityBadge'
import { ProfitabilityTable, type ProfitabilityColumn } from './ProfitabilityTable'

interface CustomersTableProps {
  rows: CustomerProfitabilityRow[]
  /** Beneficio total del resumen: habilita la columna de contribución. */
  totalProfit: number | null | undefined
  empty: ReactNode
  /** Dashboard: cliente, compras, beneficio y margen. */
  variant?: 'full' | 'compact'
  testId?: string
}

/**
 * Tabla de clientes. `days_since_last_purchase` del BE no se usa: se deriva de
 * `last_purchase` (el SQL lo calculaba con EXTRACT(DAY)). `customer_type` es
 * una constante del SQL y no se muestra; `top_customers_pct` nunca se calcula.
 */
export const CustomersTable = ({
  rows,
  totalProfit,
  empty,
  variant = 'full',
  testId = 'customers-table',
}: CustomersTableProps) => {
  const { t, lang } = useI18n()
  const showContribution = customerContributionAvailable(totalProfit)

  const base: Array<ProfitabilityColumn<CustomerProfitabilityRow>> = [
    {
      key: 'customer',
      header: t('profitability.columns.customer', 'Cliente'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{customerName(row)}</p>
          <p className="text-body-sm text-on-surface-deep">
            {t('profitability.customers.purchasesCount', '{n} compras', {
              n: formatCount(row.total_purchases),
            })}
          </p>
        </div>
      ),
    },
  ]

  if (variant === 'compact') {
    return (
      <ProfitabilityTable
        columns={[
          ...base,
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
        ]}
        rows={rows}
        rowKey={(row) => row.customer_id}
        empty={empty}
        minWidthClass="min-w-[480px]"
        testId={testId}
        caption={t('profitability.customers.tableCaption', 'Rentabilidad por cliente')}
      />
    )
  }

  const columns: Array<ProfitabilityColumn<CustomerProfitabilityRow>> = [
    ...base,
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
            render: (row: CustomerProfitabilityRow) => formatPercent(row.contribution_pct),
          },
        ]
      : []),
    {
      key: 'segment',
      header: t('profitability.columns.segment', 'Segmento'),
      render: (row) => {
        const key = segmentKey(row.segment)
        if (!key) return '—'
        return (
          <ProfitabilityBadge tone={segmentTone(key)} testId={`segment-${key}`}>
            {t(`profitability.segment.${key}`, key.toUpperCase())}
          </ProfitabilityBadge>
        )
      },
    },
    {
      key: 'lastPurchase',
      header: t('profitability.columns.lastPurchase', 'Última compra'),
      render: (row) => {
        const days = customerRecencyDays(row)
        return (
          <div className="min-w-0">
            <p className="whitespace-nowrap font-data-mono text-data-mono text-foreground">
              {formatIsoDate(row.last_purchase, lang)}
            </p>
            <p className="text-body-sm text-on-surface-deep">
              {days === null
                ? t('profitability.common.unavailable', '—')
                : days === 0
                  ? t('profitability.customers.recencyToday', 'Hoy')
                  : t('profitability.customers.recencyDays', 'Hace {n} días', {
                      n: formatDays(days),
                    })}
            </p>
          </div>
        )
      },
    },
  ]

  return (
    <ProfitabilityTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.customer_id}
      empty={empty}
      minWidthClass="min-w-[1000px]"
      dense
      testId={testId}
      caption={t('profitability.customers.tableCaption', 'Rentabilidad por cliente')}
    />
  )
}

export default CustomersTable
