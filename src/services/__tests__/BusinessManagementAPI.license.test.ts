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

// REQ_BIPACK v2.0: el bloqueo total (trial agotado sin licencia) responde 403
// LICENSE_EXPIRED en TODA ruta no-rescate y es un evento propio distinto del
// de módulo — App reemplaza la app completa por el gate de licencia.
describe('BusinessManagementAPI — 403 de bloqueo total (api:license_expired)', () => {
  const client = new BusinessManagementAPI({ baseUrl: 'http://test' })
  const expiredEvents: string[] = []
  const moduleEvents: string[] = []
  const forbiddenEvents: string[] = []
  const expiredListener = (e: Event) => expiredEvents.push((e as CustomEvent).detail as string)
  const moduleListener = (e: Event) => moduleEvents.push((e as CustomEvent).detail as string)
  const forbiddenListener = (e: Event) => forbiddenEvents.push((e as CustomEvent).detail as string)

  beforeEach(() => {
    expiredEvents.length = 0
    moduleEvents.length = 0
    forbiddenEvents.length = 0
    window.addEventListener('api:license_expired', expiredListener)
    window.addEventListener('api:module_not_licensed', moduleListener)
    window.addEventListener('api:forbidden', forbiddenListener)
  })

  afterEach(() => {
    window.removeEventListener('api:license_expired', expiredListener)
    window.removeEventListener('api:module_not_licensed', moduleListener)
    window.removeEventListener('api:forbidden', forbiddenListener)
    vi.unstubAllGlobals()
  })

  it('GET 403 LICENSE_EXPIRED: dispara el evento de bloqueo, no el de módulo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json403({
          error: 'El período de evaluación finalizó y no hay licencia activa: cargue una licencia válida para seguir usando el sistema',
          code: 'LICENSE_EXPIRED',
        }),
      ),
    )

    await expect(client.get('/api/v1/users/me')).rejects.toMatchObject({ status: 403 })
    expect(expiredEvents).toHaveLength(1)
    expect(moduleEvents).toEqual([])
    expect(forbiddenEvents).toEqual([])
  })

  it('POST 403 LICENSE_EXPIRED: tampoco duplica api:forbidden', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json403({ error: 'bloqueado', code: 'LICENSE_EXPIRED' })),
    )

    await expect(client.post('/sale/', {})).rejects.toMatchObject({ status: 403 })
    expect(expiredEvents).toEqual(['bloqueado'])
    expect(forbiddenEvents).toEqual([])
  })
})
