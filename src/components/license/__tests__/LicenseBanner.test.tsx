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
})
