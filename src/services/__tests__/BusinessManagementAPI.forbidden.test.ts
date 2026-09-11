/**
 * Política del aviso global de 403 (evento api:forbidden → toast en App.tsx):
 * solo una ESCRITURA denegada es feedback de usuario y dispara el toast.
 * Un GET denegado lo maneja cada pantalla con su estado de error/fallback —
 * el toast global demonizaba páginas que cargaban bien (ej. detalle de venta
 * del vendor: llamadas auxiliares 403 + toast "Acceso denegado").
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BusinessManagementAPI from '../BusinessManagementAPI'

const json403 = (message: string) =>
  new Response(JSON.stringify({ message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })

describe('BusinessManagementAPI — aviso global de 403 (api:forbidden)', () => {
  const client = new BusinessManagementAPI({ baseUrl: 'http://test' })
  const events: string[] = []
  const listener = (e: Event) => events.push((e as CustomEvent).detail as string)

  beforeEach(() => {
    events.length = 0
    window.addEventListener('api:forbidden', listener)
  })

  afterEach(() => {
    window.removeEventListener('api:forbidden', listener)
    vi.unstubAllGlobals()
  })

  it('GET 403: NO dispara el aviso global; el error viaja al llamador (status 403)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json403('Sin permisos suficientes para acceder a este módulo')),
    )

    await expect(client.get('/sale/SALE-1')).rejects.toMatchObject({ status: 403 })
    expect(events).toEqual([])
  })

  it('POST 403: dispara api:forbidden con el mensaje del backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json403('Acceso denegado')))

    await expect(client.post('/sale/', {})).rejects.toMatchObject({ status: 403 })
    expect(events).toEqual(['Acceso denegado'])
  })
})
