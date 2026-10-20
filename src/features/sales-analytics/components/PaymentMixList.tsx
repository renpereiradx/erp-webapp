import { CreditCard } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount, formatMoney, formatPercent } from '@/domain/sales-analytics/format'
import type { PaymentMethodSales } from '@/types/bi'

const UNKNOWN_METHOD = 'unknown'

interface PaymentMixListProps {
  methods: PaymentMethodSales[]
}

/**
 * Mix de medios de pago del período. `percentage` lo calcula el BE contra el
 * total vendido. Una venta sin `payment_method_id` cae en `unknown`: se
 * rotula "Sin método registrado" en vez de mostrar el código crudo.
 */
export const PaymentMixList = ({ methods }: PaymentMixListProps) => {
  const { t } = useI18n()

  if (methods.length === 0) {
    return (
      <TableEmptyState
        icon={CreditCard}
        title={t('salesAnalytics.payment.empty', 'Sin ventas registradas')}
        description={t(
          'salesAnalytics.payment.emptyHint',
          'El período seleccionado no tiene ventas para desglosar.',
        )}
      />
    )
  }

  return (
    <ul className="space-y-sm" data-testid="sales-payment-mix">
      {methods.map((method) => {
        const unknown = method.method === UNKNOWN_METHOD
        const label = unknown
          ? t('salesAnalytics.payment.unknown', 'Sin método registrado')
          : method.display_name || method.method || '—'
        const percentage = Math.min(Math.max(Number(method.percentage) || 0, 0), 100)

        return (
          <li key={`${method.method}-${method.display_name}`} className="space-y-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-x-sm">
              <span className="text-body-md-bold text-foreground">{label}</span>
              <span className="font-data-mono text-data-mono text-foreground">
                {formatMoney(method.sales)} · {formatPercent(percentage)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
              <div className="h-full rounded-full bg-primary/60" style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-body-sm text-on-surface-deep">
              {unknown
                ? t(
                    'salesAnalytics.payment.unknownHint',
                    'Ventas sin método de pago asociado: {count}',
                    { count: formatCount(method.transaction_count) },
                  )
                : t('salesAnalytics.payment.transactions', 'Transacciones: {count}', {
                    count: formatCount(method.transaction_count),
                  })}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

export default PaymentMixList
