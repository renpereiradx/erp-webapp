import type { LucideIcon } from 'lucide-react'
import { CircleDollarSign, Package, Percent, ReceiptText, ShoppingCart, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  formatCount,
  formatMoney,
  formatPercent,
} from '@/domain/sales-analytics/format'
import type { SalesKpiId, SalesKpiRow } from '@/domain/sales-analytics/kpis'
import { KpiLedger, type KpiLedgerItem, type KpiTone } from './KpiLedger'

interface KpiMeta {
  icon: LucideIcon
  tone: KpiTone
  labelKey: string
  fallback: string
}

const META: Record<SalesKpiId, KpiMeta> = {
  sales: {
    icon: CircleDollarSign,
    tone: 'primary',
    labelKey: 'salesAnalytics.kpi.sales',
    fallback: 'Ventas del período',
  },
  transactions: {
    icon: ReceiptText,
    tone: 'secondary',
    labelKey: 'salesAnalytics.kpi.transactions',
    fallback: 'Transacciones',
  },
  ticket: {
    icon: ShoppingCart,
    tone: 'neutral',
    labelKey: 'salesAnalytics.kpi.ticket',
    fallback: 'Ticket promedio',
  },
  units: {
    icon: Package,
    tone: 'neutral',
    labelKey: 'salesAnalytics.kpi.units',
    fallback: 'Unidades vendidas',
  },
  customers: {
    icon: Users,
    tone: 'success',
    labelKey: 'salesAnalytics.kpi.customers',
    fallback: 'Clientes únicos',
  },
  margin: {
    icon: Percent,
    tone: 'warning',
    labelKey: 'salesAnalytics.kpi.margin',
    fallback: 'Margen bruto',
  },
}

const formatValue = (row: SalesKpiRow): string => {
  if (row.kind === 'money') return formatMoney(row.value)
  if (row.kind === 'percent') return formatPercent(row.value)
  return formatCount(row.value, row.kind === 'units' ? 2 : 0)
}

/**
 * KPIs reales del período (performance + comparación contra la ventana
 * previa). Los `*_growth_pct` del dashboard consolidado no se usan: el BE no
 * los calcula y mostraban "+0%" siempre.
 */
export const SalesKpis = ({ rows }: { rows: SalesKpiRow[] }) => {
  const { t } = useI18n()

  const items: KpiLedgerItem[] = rows.map((row) => {
    const meta = META[row.id]
    return {
      id: row.id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.fallback),
      value: formatValue(row),
      hint:
        row.id === 'margin' && row.secondaryMoney !== undefined
          ? t('salesAnalytics.kpi.marginHint', 'Utilidad bruta: {amount}', {
              amount: formatMoney(row.secondaryMoney),
            })
          : undefined,
      trend: row.trend,
    }
  })

  return <KpiLedger items={items} testId="sales-kpis" />
}

export default SalesKpis
