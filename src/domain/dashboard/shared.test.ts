import { describe, expect, it } from 'vitest'
import { getActivityRoute, getTimeAgo } from './shared'

describe('getTimeAgo', () => {
  const now = new Date('2026-09-18T12:00:00')

  it('devuelve "" para timestamps falsy', () => {
    expect(getTimeAgo(null, 'ahora', now)).toBe('')
    expect(getTimeAgo(undefined, 'ahora', now)).toBe('')
    expect(getTimeAgo('', 'ahora', now)).toBe('')
  })

  it('devuelve la etiqueta "ahora" traducida bajo un minuto', () => {
    expect(getTimeAgo('2026-09-18T11:59:30', 'justo ahora', now)).toBe('justo ahora')
  })

  it.each([
    ['2026-09-18T11:30:00', '30m'],
    ['2026-09-18T11:01:00', '59m'],
  ])('%s → %s', (ts, expected) => {
    expect(getTimeAgo(ts, 'ahora', now)).toBe(expected)
  })

  it.each([
    ['2026-09-18T11:00:00', '1h'],
    ['2026-09-17T13:30:00', '22h'],
  ])('%s → %s', (ts, expected) => {
    expect(getTimeAgo(ts, 'ahora', now)).toBe(expected)
  })

  it('a partir de 24h cae al string de fecha local', () => {
    const ts = '2026-09-16T12:00:00'
    expect(getTimeAgo(ts, 'ahora', now)).toBe(new Date(ts).toLocaleDateString())
  })
})

describe('getActivityRoute', () => {
  it('venta → detalle de cobro por sale_id', () => {
    expect(getActivityRoute({ type: 'sale', details: { sale_id: 42 } })).toBe('/cobros-ventas/42')
  })

  it('venta sin sale_id → ruta con vacío (comportamiento legacy)', () => {
    expect(getActivityRoute({ type: 'sale', details: {} })).toBe('/cobros-ventas/')
  })

  it('compra → pagos de compra por purchase_id', () => {
    expect(getActivityRoute({ type: 'purchase', details: { purchase_id: 'abc' } })).toBe(
      '/pagos-compras/abc',
    )
  })

  it('pago con sale_id → historial de pagos del cobro', () => {
    expect(getActivityRoute({ type: 'payment', details: { sale_id: 7 } })).toBe(
      '/cobros-ventas/7/pagos',
    )
  })

  it('pago sin sale_id → movimientos de caja', () => {
    expect(getActivityRoute({ type: 'payment', details: {} })).toBe('/movimientos-caja')
  })

  it('tipo desconocido → dashboard', () => {
    expect(getActivityRoute({ type: 'stock' })).toBe('/dashboard')
    expect(getActivityRoute({})).toBe('/dashboard')
  })
})
