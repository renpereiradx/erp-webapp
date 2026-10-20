import { DollarSign, Package, ShoppingBag, TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { DashboardSummary, DashboardTrends } from '@/types/bi'
import { KpiCard } from './KpiCard'

interface SummaryCardsProps {
  summary: DashboardSummary
  trends?: DashboardTrends
}

/** Las 4 tarjetas principales del Resumen Ejecutivo (todas de /summary). */
export const SummaryCards = ({ summary, trends }: SummaryCardsProps) => {
  const { t } = useI18n()

  return (
    <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={DollarSign}
        tone="primary"
        label={t('dashboard.summary.cards.sales', 'Ventas del período')}
        value={formatPYG(summary.sales.total)}
        hint={t(
          'dashboard.summary.cards.salesHint',
          '{count} ventas · ticket promedio {ticket}',
          {
            count: formatNumber(summary.sales.count, 0),
            ticket: formatPYG(summary.sales.average_ticket),
          },
        )}
        trend={
          trends
            ? { direction: trends.sales.trend, percentage: trends.sales.change_percentage }
            : undefined
        }
        testId="dashboard-kpi-sales"
      />
      <KpiCard
        icon={ShoppingBag}
        tone="warning"
        label={t('dashboard.summary.cards.purchases', 'Compras del período')}
        value={formatPYG(summary.purchases.total)}
        hint={t('dashboard.summary.cards.purchasesHint', '{count} compras', {
          count: formatNumber(summary.purchases.count, 0),
        })}
        trend={
          trends
            ? { direction: trends.purchases.trend, percentage: trends.purchases.change_percentage }
            : undefined
        }
        testId="dashboard-kpi-purchases"
      />
      <KpiCard
        icon={TrendingUp}
        tone="success"
        label={t('dashboard.summary.cards.grossProfit', 'Utilidad bruta')}
        value={formatPYG(summary.profit.gross)}
        hint={t('dashboard.summary.cards.profitHint', 'Margen bruto {margin}%', {
          margin: formatNumber(summary.profit.margin_percentage, 1),
        })}
        testId="dashboard-kpi-profit"
      />
      <KpiCard
        icon={Package}
        label={t('dashboard.summary.cards.inventoryValue', 'Valor de inventario')}
        value={formatPYG(summary.inventory.total_value)}
        hint={t(
          'dashboard.summary.cards.inventoryHint',
          '{products} SKUs · {low} bajo stock · {out} sin stock',
          {
            products: formatNumber(summary.inventory.total_products, 0),
            low: formatNumber(summary.inventory.low_stock_count, 0),
            out: formatNumber(summary.inventory.out_of_stock_count, 0),
          },
        )}
        testId="dashboard-kpi-inventory"
      />
    </div>
  )
}
