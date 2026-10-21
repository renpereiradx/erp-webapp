import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { PaymentCalendar } from '@/types/bi'
import { sortedScheduleDays } from '@/domain/payables/schedule'
import { formatMoney, formatUtcDayMonth } from '@/domain/payables/format'
import { PayablesPriorityBadge } from './PayablesBadges'

/**
 * Próximos vencimientos agrupados por día. El BE solo incluye lo que vence
 * entre hoy y hoy+N días y entrega el array sin ordenar (map de Go): el orden
 * y los totales salen del dominio. Cada ítem navega al detalle real.
 */
export const PaymentSchedulePanel = ({ calendar }: { calendar: PaymentCalendar }) => {
  const { t, lang } = useI18n()
  const days = sortedScheduleDays(calendar.schedule)

  if (days.length === 0) {
    return (
      <TableEmptyState
        icon={CalendarClock}
        title={t('payables.schedule.empty', 'Sin vencimientos en la ventana')}
        description={t(
          'payables.schedule.emptyHint',
          'No hay cuentas por pagar que venzan en los próximos días.',
        )}
      />
    )
  }

  return (
    <div className="space-y-lg" data-testid="payables-schedule-panel">
      {days.map((day) => (
        <section key={day.date}>
          <header className="mb-xs flex items-baseline justify-between gap-sm">
            <h3 className="text-body-md-bold text-foreground">
              {formatUtcDayMonth(day.date, lang)}
            </h3>
            <p className="font-data-mono text-data-mono text-on-surface-deep">
              {formatMoney(day.total_due)}
            </p>
          </header>
          <ul className="divide-y divide-divider">
            {(day.items ?? []).map((item) => (
              <li
                key={`${day.date}-${item.payable_id}`}
                className="flex flex-wrap items-center justify-between gap-x-md gap-y-xs py-xs"
              >
                <div className="min-w-0">
                  <Link
                    to={`/payables/detail/${encodeURIComponent(item.payable_id)}`}
                    className="block truncate text-body-md text-primary hover:underline"
                  >
                    {item.supplier_name || item.payable_id}
                  </Link>
                  <p className="text-body-sm text-on-surface-deep">
                    {t('payables.schedule.daysUntil', 'Vence en {days} días', {
                      days: item.days_until_due,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-sm">
                  <PayablesPriorityBadge priority={item.priority} />
                  <span className="font-data-mono text-data-mono text-foreground">
                    {formatMoney(item.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-body-sm text-on-surface-deep">
        {t('payables.schedule.window', 'Ventana: {start} – {end}', {
          start: formatUtcDayMonth(calendar.start_date, lang),
          end: formatUtcDayMonth(calendar.end_date, lang),
        })}
      </p>
    </div>
  )
}

export default PaymentSchedulePanel
