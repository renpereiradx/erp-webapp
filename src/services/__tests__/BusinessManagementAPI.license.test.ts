/**
 * PLAN_BI_PACK_PREMIUM ADR-7 — el 403 de licencia (MODULE_NOT_LICENSED) es un
 * evento propio (api:module_not_licensed): llega también por GET (que
 * silencia api:forbidden) y nunca dispara el aviso de permisos duplicado.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BusinessManagementAPI from '../BusinessManagementAPI'

const json403 = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })

const LICENSE_403 = {
  error: 'El módulo no está incluido en la licencia de esta instalación. Contacte a su proveedor',
  code: 'MODULE_NOT_LICENSED',
}

describe('BusinessManagementAPI — 403 de licencia (api:module_not_licensed)', () => {
  const client = new BusinessManagementAPI({ baseUrl: 'http://test' })
  const licenseEvents: string[] = []
  const forbiddenEvents: string[] = []
  const licenseListener = (e: Event) => licenseEvents.push((e as CustomEvent).detail as string)
  const forbiddenListener = (e: Event) => forbiddenEvents.push((e as CustomEvent).detail as string)

  beforeEach(() => {
    licenseEvents.length = 0
    forbiddenEvents.length = 0
    window.addEventListener('api:module_not_licensed', licenseListener)
    window.addEventListener('api:forbidden', forbiddenListener)
  })

  afterEach(() => {
    window.removeEventListener('api:module_not_licensed', licenseListener)
    window.removeEventListener('api:forbidden', forbiddenListener)
    vi.unstubAllGlobals()
  })

  it('GET 403 MODULE_NOT_LICENSED: dispara el evento de licencia (a diferencia de un 403 de permiso)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json403(LICENSE_403)))

    await expect(client.get('/dashboard/summary')).rejects.toMatchObject({ status: 403 })
    expect(licenseEvents).toEqual([LICENSE_403.error])
    expect(forbiddenEvents).toEqual([])
  })

  it('POST 403 MODULE_NOT_LICENSED: evento de licencia, SIN api:forbidden duplicado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json403(LICENSE_403)))

    await expect(client.post('/api/v1/audit/export', {})).rejects.toMatchObject({ status: 403 })
    expect(licenseEvents).toEqual([LICENSE_403.error])
    expect(forbiddenEvents).toEqual([])
  })

  it('403 de permiso normal sigue disparando solo api:forbidden (escritura)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json403({ message: 'Acceso denegado' })))

    await expect(client.post('/sale/', {})).rejects.toMatchObject({ status: 403 })
    expect(forbiddenEvents).toEqual(['Acceso denegado'])
    expect(licenseEvents).toEqual([])
  })

  it('acepta también el envelope anidado {error:{code}}', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json403({ error: { code: 'MODULE_NOT_LICENSED', message: 'sin pack' } })),
    )

    await expect(client.get('/forecast/dashboard')).rejects.toMatchObject({ status: 403 })
    expect(licenseEvents).toEqual(['sin pack'])
  })
})
