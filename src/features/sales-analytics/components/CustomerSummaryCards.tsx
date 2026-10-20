import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { formatCount, formatMoney, formatPercent } from '@/domain/sales-analytics/format'
import type { CustomerSummaryId, CustomerSummaryItem } from '@/domain/sales-analytics/customers'

interface SummaryMeta {
  labelKey: string
  fallback: string
  hint?: (item: CustomerSummaryItem, t: TranslationFn) => ReactNode
}

type TranslationFn = (key: string, fallback?: string, vars?: Record<string, unknown>) => string

const META: Record<CustomerSummaryId, SummaryMeta> = {
  total: {
    labelKey: 'salesAnalytics.customers.summary.total',
    fallback: 'Clientes del período',
  },
  new: {
    labelKey: 'salesAnalytics.customers.summary.new',
    fallback: 'Nuevos',
  },
  returning: {
    labelKey: 'salesAnalytics.customers.summary.returning',
    fallback: 'Recurrentes',
  },
  retention: {
    labelKey: 'salesAnalytics.customers.summary.retention',
    fallback: 'Retención del período',
    hint: (item, t) =>
      t('salesAnalytics.customers.summary.retentionHint', 'Recurrentes: {count}', {
        count: formatCount(item.secondaryCount),
      }),
  },
  ltv: {
    labelKey: 'salesAnalytics.customers.summary.ltv',
    fallback: 'Valor de vida promedio',
    hint: (_item, t) =>
      t('salesAnalytics.customers.summary.historicalHint', 'Histórico hasta el fin del período'),
  },
  topCustomer: {
    labelKey: 'salesAnalytics.customers.summary.topCustomer',
    fallback: 'Mayor cliente',
    hint: (_item, t) =>
      t('salesAnalytics.customers.summary.historicalHint', 'Histórico hasta el fin del período'),
  },
}

const formatValue = (item: CustomerSummaryItem): string => {
  if (item.kind === 'money') return formatMoney(item.value)
  if (item.kind === 'percent') return formatPercent(item.value)
  return formatCount(item.value)
}

/** Resumen de clientes: solo métricas calculadas por el BE. */
export const CustomerSummaryCards = ({ items }: { items: CustomerSummaryItem[] }) => {
  const { t } = useI18n()

  return (
    <dl className="grid gap-md sm:grid-cols-2 lg:grid-cols-3" data-testid="customer-summary">
      {items.map((item) => {
        const meta = META[item.id]
        return (
          <div
            key={item.id}
            className="rounded-md bg-surface p-lg shadow-whisper"
            data-testid={`customer-summary-${item.id}`}
          >
            <dt className="text-label-caps uppercase text-on-surface-deep">
              {t(meta.labelKey, meta.fallback)}
            </dt>
            <dd className="mt-xs whitespace-nowrap font-data-mono text-title-md text-foreground">
              {formatValue(item)}
            </dd>
            {meta.hint ? (
              <dd className="mt-xs text-body-sm text-on-surface-deep">
                {meta.hint(item, t as unknown as TranslationFn)}
              </dd>
            ) : null}
          </div>
        )
      })}
    </dl>
  )
}

export default CustomerSummaryCards
