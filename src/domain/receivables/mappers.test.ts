import { describe, expect, it } from 'vitest'
import {
  getAvatarColor,
  getInitials,
  getStatusColor,
  transformApiResponse,
  transformDetailData,
  transformReceivableItem,
  transformRecentInvoices,
  transformSummary,
} from './mappers'

describe('getAvatarColor', () => {
  it('determinístico por primera letra y cae en el primer color sin nombre', () => {
    expect(getAvatarColor('Ana')).toBe(getAvatarColor('Ana'))
    expect(getAvatarColor('Ana')).toBe('#fce7f3') // 'A'.charCodeAt(0) % 10 === 5
    expect(getAvatarColor('')).toBe('#dbeafe')
    expect(getAvatarColor(null)).toBe('#dbeafe')
  })
})

describe('getStatusColor', () => {
  it.each([
    ['OVERDUE', 'red'],
    ['PENDING', 'yellow'],
    ['PARTIAL', 'blue'],
    ['PAID', 'green'],
    ['OTHER', 'gray'],
    [null, 'gray'],
  ])('%s → %s', (status, expected) => {
    expect(getStatusColor(status)).toBe(expected)
  })
})

describe('transformReceivableItem', () => {
  it('mapea el item del API con fechas es-PY y color de estado', () => {
    const row = transformReceivableItem({
      id: 7,
      client_id: 'CLI-9',
      client_name: 'Ana',
      sale_date: '2026-09-01T10:00:00',
      due_date: '2026-09-30T10:00:00',
      original_amount: 1000,
      pending_amount: 400,
      status: 'OVERDUE',
    })
    expect(row).toMatchObject({
      id: 7,
      clientId: 'CLI-9',
      clientName: 'Ana',
      clientInitial: 'A',
      originalAmt: 1000,
      pendingAmt: 400,
      status: 'OVERDUE',
      statusColor: 'red',
    })
    expect(row.issueDate).toBe(new Date('2026-09-01T10:00:00').toLocaleDateString('es-PY'))
  })

  it('aplica fallbacks: sale_order_id como id y cliente desconocido', () => {
    const row = transformReceivableItem({ sale_order_id: 3 })
    expect(row).toMatchObject({
      id: 3,
      clientId: 'CLI-001',
      clientName: 'Cliente Desconocido',
      clientInitial: 'C',
      issueDate: '',
      dueDate: '',
    })
  })
})

describe('getInitials', () => {
  it.each([
    ['Ana Pérez', 'AP'],
    ['Ana', 'AN'],
    ['', 'XX'],
    [null, 'XX'],
    [undefined, 'XX'],
  ])('%s → %s', (name, expected) => {
    expect(getInitials(name)).toBe(expected)
  })
})

describe('transformApiResponse', () => {
  it('acepta respuesta en array directo y enriquece filas', () => {
    const rows = transformApiResponse([
      { id: 1, client_name: 'Ana Pérez', days_overdue: 70, pending_amount: 500, original_amount: 1000, paid_amount: 500 },
      { id: 2, client_name: 'Bo', days_overdue: 10 },
    ])
    expect(rows[0]).toMatchObject({
      id: 1,
      client: 'Ana Pérez',
      priority: 'High',
      nextAction: 'Llamar urgente',
      riskScore: 90,
      code: 'AP',
      lastContact: 'Sin contacto',
    })
    expect(rows[1]).toMatchObject({ priority: 'Low', nextAction: 'Enviar recordatorio', riskScore: 30 })
    expect(rows[0].bgColor).toBe('#dbeafe')
    expect(rows[1].bgColor).toBe('#fef3c7') // rotación de paleta
  })

  it('acepta respuesta paginada {items}', () => {
    const rows = transformApiResponse({ items: [{ id: 5, client_name: 'Caco', days_overdue: 40 }] })
    expect(rows).toHaveLength(1)
    expect(rows[0].priority).toBe('Medium')
  })

  it('devuelve [] con basura no array', () => {
    expect(transformApiResponse(null)).toEqual([])
    expect(transformApiResponse({})).toEqual([])
  })
})

describe('transformDetailData', () => {
  const raw = {
    id: 9,
    client_id: 'C1',
    client_name: 'Ana',
    client_email: 'a@a.com',
    status: 'PARTIAL',
    sale_date: '2026-09-01T14:30:00',
    due_date: '2026-09-30T00:00:00',
    original_amount: 100000,
    paid_amount: 40000,
    pending_amount: 60000,
    days_overdue: 5,
    payment_history: [
      { id: 'p1', payment_date: '2026-09-05T10:00:00', reference: 'R1', payment_method: 'Efectivo', processed_by: 'Vendedor', amount: 40000 },
    ],
    metadata: { notes: 'Prometió pagar el viernes' },
    user_name: 'Vendedor',
  }

  it('mapea cliente, transacción con montos PYG y estados', () => {
    const detail = transformDetailData(raw)
    expect(detail.client).toMatchObject({ id: 'C1', name: 'Ana', email: 'a@a.com' })
    expect(detail.transaction.status).toBe('Partial')
    expect(detail.transaction.amount).toBe('Gs. 100.000')
    expect(detail.transaction.balance).toBe('Gs. 60.000')
    expect(detail.transaction.daysOverdue).toBe(5)
  })

  it('construye historial de pagos y feed ordenado desc con la nota incluida', () => {
    const detail = transformDetailData(raw)
    expect(detail.paymentHistory).toHaveLength(1)
    expect(detail.paymentHistory[0]).toMatchObject({ ref: 'R1', method: 'Efectivo', amount: 40000 })
    // La nota (fecha 2026-09-01) es más vieja que el pago (2026-09-05)
    expect(detail.activities.map((a: { id: string }) => a.id)).toEqual(['p1', 'note-0'])
    expect(detail.activities[1]).toMatchObject({ type: 'NOTE', description: 'Prometió pagar el viernes' })
  })

  it('tolera raw mínimo sin historial ni metadata', () => {
    const detail = transformDetailData({ id: 1 })
    expect(detail.paymentHistory).toEqual([])
    expect(detail.activities).toEqual([])
  })
})

describe('transformSummary', () => {
  it('mapea overview con porcentaje de vencido', () => {
    expect(
      transformSummary({
        total_pending: 1000,
        total_overdue: 250,
        collection_rate: 80,
        total_count: 10,
        overdue_count: 2,
        average_days_to_collect: 12.4,
        collection_trend: [1, 2],
      }),
    ).toEqual({
      totalReceivables: { amount: 1000, trend: 80 },
      overdueAmount: { amount: 250, percentage: 25 },
      totalCount: 10,
      overdueCount: 2,
      avgDaysToCollect: 12,
      collectionRate: 80,
      collectionTrend: [1, 2],
    })
  })

  it('porcentaje 0 cuando no hay pendiente', () => {
    const summary = transformSummary({ total_pending: 0, total_overdue: 100 })
    expect(summary.overdueAmount).toEqual({ amount: 100, percentage: 0 })
  })
})

describe('transformRecentInvoices', () => {
  it('mapea filas con color por estado y fecha es-PY', () => {
    const rows = transformRecentInvoices([
      { id: 1, client_name: 'Ana', sale_date: '2026-09-01T10:00:00', pending_amount: 500, days_overdue: 3, status: 'OVERDUE' },
      { id: 2, client_name: 'Bo', status: 'PAID' },
    ])
    expect(rows[0]).toMatchObject({
      invoiceId: 1,
      client: 'Ana',
      balance: 500,
      daysOverdue: 3,
      statusColor: 'red',
    })
    expect(rows[0].issueDate).toContain('sep')
    expect(rows[1]).toMatchObject({ client: 'Bo', issueDate: 'Pendiente', statusColor: 'green', balance: 0 })
  })
})
