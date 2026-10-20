import type { LucideIcon } from 'lucide-react'
import { CalendarDays, Clock, Package, ShoppingCart, Timer } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatCount, formatMoney, splitDurationMinutes } from '@/domain/sales-analytics/format'
import type { VelocityKpiId, VelocityKpiRow } from '@/domain/sales-analytics/velocity'
import { KpiLedger, type KpiLedgerItem, type KpiTone } from './KpiLedger'

interface KpiMeta {
  icon: LucideIcon
  tone: KpiTone
  labelKey: string
  fallback: string
}

const META: Record<VelocityKpiId, KpiMeta> = {
  salesPerDay: {
    icon: CalendarDays,
    tone: 'primary',
    labelKey: 'salesAnalytics.velocity.kpi.salesPerDay',
    fallback: 'Ventas por día',
  },
  salesPerHour: {
    icon: Clock,
    tone: 'secondary',
    labelKey: 'salesAnalytics.velocity.kpi.salesPerHour',
    fallback: 'Ventas por hora',
  },
  transactionsPerDay: {
    icon: ShoppingCart,
    tone: 'neutral',
    labelKey: 'salesAnalytics.velocity.kpi.transactionsPerDay',
    fallback: 'Transacciones por día',
  },
  unitsPerDay: {
    icon: Package,
    tone: 'neutral',
    labelKey: 'salesAnalytics.velocity.kpi.unitsPerDay',
    fallback: 'Unidades por día',
  },
  avgBetween: {
    icon: Timer,
    tone: 'warning',
    labelKey: 'salesAnalytics.velocity.kpi.avgBetween',
    fallback: 'Tiempo promedio entre ventas',
  },
}

const DURATION_FALLBACKS = {
  minutes: 'min',
  hours: 'h',
  days: 'días',
} as const

const formatValue = (
  row: VelocityKpiRow,
  t: (key: string, fallback?: string) => string,
): string => {
  if (row.kind === 'money') return formatMoney(row.value)
  if (row.kind === 'units') return formatCount(row.value, 1)
  if (row.kind === 'duration') {
    const parts = splitDurationMinutes(row.value)
    if (!parts) return '—'
    return `${formatCount(parts.value, 1)} ${t(
      `salesAnalytics.duration.${parts.unit}`,
      DURATION_FALLBACKS[parts.unit],
    )}`
  }
  return formatCount(row.value, 1)
}

/** Indicadores de velocidad del período (sin metas ni comparaciones inventadas). */
export const VelocityKpis = ({ rows }: { rows: VelocityKpiRow[] }) => {
  const { t } = useI18n()

  const items: KpiLedgerItem[] = rows.map((row) => {
    const meta = META[row.id]
    return {
      id: row.id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.fallback),
      value: formatValue(row, t as unknown as (key: string, fallback?: string) => string),
      hint:
        row.id === 'avgBetween'
          ? t(
              'salesAnalytics.velocity.kpi.avgBetweenHint',
              'Sobre todas las horas del período',
            )
          : undefined,
    }
  })

  return <KpiLedger items={items} testId="velocity-kpis" />
}

export default VelocityKpis
