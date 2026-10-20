import { Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount, formatIsoDate, formatMoney } from '@/domain/sales-analytics/format'
import {
  frequencyKey,
  segmentKey,
  type FrequencyKey,
  type SegmentKey,
} from '@/domain/sales-analytics/customers'
import type { CustomerSalesData } from '@/types/bi'
import { AnalyticsTable, type AnalyticsColumn } from './AnalyticsTable'

const FREQUENCY_FALLBACKS: Record<FrequencyKey, string> = {
  frequent: 'Frecuente',
  regular: 'Regular',
  occasional: 'Ocasional',
  new: 'Nuevo',
  unknown: 'Sin dato',
}

const SEGMENT_FALLBACKS: Record<SegmentKey, string> = {
  vip: 'VIP',
  premium: 'Premium',
  standard: 'Estándar',
  new: 'Nuevo',
  unknown: 'Sin dato',
}

const SEGMENT_CLASSES: Record<SegmentKey, string> = {
  vip: 'bg-warning/10 text-warning',
  premium: 'bg-primary/10 text-primary',
  standard: 'bg-surface-muted text-on-surface-deep',
  new: 'bg-success/10 text-success',
  unknown: 'bg-surface-muted text-on-surface-deep',
}

/**
 * Clientes del período, paginados por el BE. Frecuencia y segmento llegan como
 * códigos en mayúsculas: se traducen por clave, no se muestran crudos.
 */
export const CustomersTable = ({ customers }: { customers: CustomerSalesData[] }) => {
  const { t, lang } = useI18n()

  const columns: Array<AnalyticsColumn<CustomerSalesData>> = [
    {
      key: 'customer',
      header: t('salesAnalytics.columns.customer', 'Cliente'),
      render: (row) => (
        <div>
          <p className="text-body-md-bold text-foreground">{row.customer_name || '—'}</p>
          <p className="font-data-mono text-body-sm text-on-surface-deep">
            {row.customer_ruc || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'purchases',
      align: 'right',
      header: t('salesAnalytics.columns.purchases', 'Compras'),
      render: (row) => formatMoney(row.total_purchases),
    },
    {
      key: 'transactions',
      align: 'right',
      header: t('salesAnalytics.columns.transactions', 'Transacciones'),
      render: (row) => formatCount(row.transaction_count),
    },
    {
      key: 'ticket',
      align: 'right',
      header: t('salesAnalytics.columns.ticket', 'Ticket promedio'),
      render: (row) => formatMoney(row.average_ticket),
    },
    {
      key: 'frequency',
      header: t('salesAnalytics.columns.frequency', 'Frecuencia'),
      render: (row) => {
        const key = frequencyKey(row.frequency)
        return (
          <span className="inline-flex rounded-full bg-surface-muted px-sm py-xs text-body-sm-bold text-on-surface-deep">
            {t(`salesAnalytics.frequency.${key}`, FREQUENCY_FALLBACKS[key])}
          </span>
        )
      },
    },
    {
      key: 'segment',
      header: t('salesAnalytics.columns.segment', 'Segmento'),
      render: (row) => {
        const key = segmentKey(row.segment)
        return (
          <span
            className={`inline-flex rounded-full px-sm py-xs text-body-sm-bold ${SEGMENT_CLASSES[key]}`}
          >
            {t(`salesAnalytics.segment.${key}`, SEGMENT_FALLBACKS[key])}
          </span>
        )
      },
    },
    {
      key: 'lastPurchase',
      align: 'right',
      mono: true,
      header: t('salesAnalytics.columns.lastPurchase', 'Última compra'),
      render: (row) => formatIsoDate(row.last_purchase, lang),
    },
    {
      key: 'topProduct',
      header: t('salesAnalytics.columns.topProduct', 'Producto top'),
      render: (row) => (
        <span className="text-body-sm" title={row.top_product || undefined}>
          {row.top_product || '—'}
        </span>
      ),
    },
  ]

  return (
    <AnalyticsTable
      columns={columns}
      rows={customers}
      rowKey={(row) => row.customer_id}
      minWidthClass="min-w-[1100px]"
      testId="sales-customers-table"
      empty={
        <TableEmptyState
          icon={Users}
          title={t('salesAnalytics.customers.empty', 'Sin clientes en el período')}
          description={t(
            'salesAnalytics.customers.emptyHint',
            'El período seleccionado no registra ventas con cliente identificado.',
          )}
        />
      }
    />
  )
}

export default CustomersTable
