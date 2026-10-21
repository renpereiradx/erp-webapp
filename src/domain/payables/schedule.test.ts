import { describe, expect, it } from 'vitest'
import { scheduleItemRows, scheduleTotals, sortedScheduleDays } from './schedule'
import type { PaymentCalendar } from '@/types/bi'

const calendar: PaymentCalendar = {
  start_date: '2026-10-20',
  end_date: '2026-11-19',
  total_due: 950,
  schedule: [
    {
      date: '2026-11-02',
      day_of_week: 'Lunes',
      total_due: 300,
      item_count: 2,
      items: [
        { payable_id: 'PO-2', supplier_name: 'B', amount: 100, priority: 'HIGH', days_until_due: 13 },
        { payable_id: 'PO-1', supplier_name: 'A', amount: 200, priority: 'MEDIUM', days_until_due: 13 },
      ],
    },
    {
      date: '2026-10-25',
      day_of_week: 'Domingo',
      total_due: 650,
      item_count: 1,
      items: [
        { payable_id: 'PO-3', supplier_name: 'C', amount: 650, priority: 'HIGH', days_until_due: 5 },
      ],
    },
  ],
}

describe('payables/schedule', () => {
  it('ordena los días (el BE los entrega desde un map) y los ítems por monto', () => {
    const days = sortedScheduleDays(calendar.schedule)
    expect(days.map((day) => day.date)).toEqual(['2026-10-25', '2026-11-02'])
    expect(days[1].items?.map((item) => item.payable_id)).toEqual(['PO-1', 'PO-2'])
    // no muta el payload original
    expect(calendar.schedule?.[0].items?.[0].payable_id).toBe('PO-2')
  })

  it('aplana filas por vencimiento y respeta el límite', () => {
    const rows = scheduleItemRows(calendar)
    expect(rows.map((row) => row.payable_id)).toEqual(['PO-3', 'PO-1', 'PO-2'])
    expect(scheduleItemRows(calendar, 2)).toHaveLength(2)
    expect(scheduleItemRows(null)).toEqual([])
  })

  it('toma el total del payload y cuenta días/ítems reales', () => {
    expect(scheduleTotals(calendar)).toEqual({
      totalDue: 950,
      dayCount: 2,
      itemCount: 3,
    })
    expect(scheduleTotals(null)).toEqual({ totalDue: 0, dayCount: 0, itemCount: 0 })
  })
})
