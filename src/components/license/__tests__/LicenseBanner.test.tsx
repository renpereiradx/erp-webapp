/**
 * PLAN_BI_PACK_PREMIUM F4 — banner global de vencimiento (ADR-4): ≤30 días o
 * gracia → aviso; vencida → aviso crítico; sin enforcement o licencia sana →
 * nada. El endpoint /system/license es auth-only (sin permiso).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const getStatus = vi.fn()

vi.mock('@/services/licenseService', () => ({
  licenseService: { getStatus: (...args: unknown[]) => getStatus(...args) },
}))

import LicenseBanner from '../LicenseBanner'
import type { LicenseSnapshot } from '@/services/licenseService'

const snapshot = (over: Partial<LicenseSnapshot>): LicenseSnapshot => ({
  status: 'active',
  enforcing: true,
  edition: 'core+bi',
  customer: 'Vista Bar',
  modules: ['bi'],
  expires_at: '2027-01-01T00:00:00Z',
  days_remaining: 90,
  grace_days: 0,
  ...over,
})

const renderBanner = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LicenseBanner />
    </QueryClientProvider>,
  )
}

describe('LicenseBanner', () => {
  it('licencia activa lejana (>30 días): no muestra banner', async () => {
    getStatus.mockResolvedValue(snapshot({ days_remaining: 90 }))
    renderBanner()
    expect(await screen.queryByRole('status')).toBeNull()
  })

  it('licencia por vencer (≤30 días): banner con días restantes', async () => {
    getStatus.mockResolvedValue(snapshot({ days_remaining: 12 }))
    renderBanner()
    const banner = await screen.findByRole('status')
    expect(banner.textContent).toContain('12')
  })

  it('gracia activa: banner de aviso', async () => {
    getStatus.mockResolvedValue(snapshot({ status: 'grace', days_remaining: -3 }))
    renderBanner()
    expect((await screen.findByRole('status')).textContent).toContain('gracia')
  })

  it('vencida: banner crítico', async () => {
    getStatus.mockResolvedValue(snapshot({ status: 'expired', days_remaining: -40 }))
    renderBanner()
    expect((await screen.findByRole('status')).textContent).toContain('deshabilitado')
  })

  it('sin enforcement (dev fail-open): nunca hay banner', async () => {
    getStatus.mockResolvedValue(snapshot({ enforcing: false, status: 'none', days_remaining: 3 }))
    renderBanner()
    expect(await screen.queryByRole('status')).toBeNull()
  })

  // REQ_BIPACK v2.0: evaluación activa (modo trial) — aviso con ≤30 días.
  it('evaluación activa lejana (>30 días): no muestra banner', async () => {
    getStatus.mockResolvedValue(snapshot({ mode: 'trial', status: 'none', expires_at: null, days_remaining: 80 }))
    renderBanner()
    expect(await screen.queryByRole('status')).toBeNull()
  })

  it('evaluación por terminar (≤30 días): banner con días restantes', async () => {
    getStatus.mockResolvedValue(snapshot({ mode: 'trial', status: 'none', expires_at: null, days_remaining: 21 }))
    renderBanner()
    const banner = await screen.findByRole('status')
    expect(banner.textContent).toContain('21')
    expect(banner.textContent).toContain('evaluación')
  })

  // aud Fix 8: ventana ya vencida en gracia (días negativos, pre-gate) →
  // aviso crítico, no silencio.
  it('evaluación vencida (días negativos): banner crítico de fin de evaluación', async () => {
    getStatus.mockResolvedValue(snapshot({ mode: 'trial', status: 'none', expires_at: null, days_remaining: -1 }))
    renderBanner()
    const banner = await screen.findByRole('status')
    expect(banner.textContent).toContain('finalizó')
  })

  // aud Fix 8: el test anterior esperaba null con status=active + 10 días —
  // exactamente lo contrario del comportamiento real (≤30 días avisa). Sin
  // `mode` (backend legacy) el banner sigue decidiendo por `status`.
  it('sin mode (backend legacy): status=active con ≤30 días sigue avisando el vencimiento', async () => {
    getStatus.mockResolvedValue(snapshot({ status: 'active', mode: undefined, days_remaining: 10 }))
    renderBanner()
    const banner = await screen.findByRole('status')
    expect(banner.textContent).toContain('10')
  })

  // aud Fix 4: licencia firmada vencida (mode core) — Core activo, pack BI
  // apagado: el copy de status=expired lo explica.
  it('licencia vencida con Core activo (mode core): banner crítico del pack BI', async () => {
    getStatus.mockResolvedValue(snapshot({ status: 'expired', mode: 'core', days_remaining: -40 }))
    renderBanner()
    expect((await screen.findByRole('status')).textContent).toContain('deshabilitado')
  })
})

