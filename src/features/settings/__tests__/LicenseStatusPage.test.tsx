/**
 * LicenseStatusPage — REQ_BIPACK v2.0 + auditoría Fix 5: card de estado en
 * /configuracion/licencia con carga de licencia desde la web para quien
 * tiene license:write. Mocks en la frontera: servicio de licencia y
 * AuthContext (permisos + refreshEntitlements); react-query real para
 * ejercitar la invalidación de ['system-license'].
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const getStatus = vi.fn()
const upload = vi.fn()
const refreshEntitlements = vi.fn()
const hasPermission = vi.fn()

vi.mock('@/services/licenseService', () => ({
  licenseService: {
    getStatus: (...args: unknown[]) => getStatus(...args),
    upload: (...args: unknown[]) => upload(...args),
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission, refreshEntitlements }),
}))

import LicenseStatusPage from '../components/LicenseStatusPage'
import type { LicenseSnapshot } from '@/services/licenseService'

const snapshot = (over: Partial<LicenseSnapshot>): LicenseSnapshot => ({
  status: 'none',
  enforcing: true,
  modules: [],
  expires_at: null,
  days_remaining: 80,
  grace_days: 0,
  ...over,
})

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LicenseStatusPage />
    </QueryClientProvider>,
  )
}

describe('LicenseStatusPage', () => {
  beforeEach(() => {
    getStatus.mockReset()
    upload.mockReset()
    refreshEntitlements.mockReset()
    hasPermission.mockReset()
  })

  it('muestra el modo evaluación con fin de ventana y días restantes', async () => {
    hasPermission.mockReturnValue(false)
    getStatus.mockResolvedValue(
      snapshot({ mode: 'trial', trial_ends_at: '2026-12-27T00:00:00Z', days_remaining: 80 }),
    )
    renderPage()

    expect(await screen.findByText('En evaluación')).toBeInTheDocument()
    expect(screen.getByText('Quedan 80 días')).toBeInTheDocument()
    expect(screen.getByText('Fin de la evaluación')).toBeInTheDocument()
  })

  it('mode core (aud Fix 4): licencia vencida con Core activo', async () => {
    hasPermission.mockReturnValue(false)
    getStatus.mockResolvedValue(snapshot({ mode: 'core', status: 'expired' }))
    renderPage()

    expect(await screen.findByText('Licencia vencida (Core activo)')).toBeInTheDocument()
  })

  it('sin license:write no ofrece el botón de instalación', async () => {
    hasPermission.mockReturnValue(false)
    getStatus.mockResolvedValue(snapshot({ mode: 'trial' }))
    renderPage()

    await screen.findByText('En evaluación')
    expect(screen.queryByRole('button', { name: /instalar licencia/i })).toBeNull()
  })

  it('con license:write instala la licencia y refresca estado + entitlements', async () => {
    hasPermission.mockReturnValue(true)
    getStatus.mockResolvedValueOnce(snapshot({ mode: 'trial' })).mockResolvedValueOnce(
      snapshot({ mode: 'licensed', status: 'active', edition: 'core+bi', modules: ['bi'] }),
    )
    upload.mockResolvedValue(snapshot({ mode: 'licensed', status: 'active', edition: 'core+bi' }))
    renderPage()

    const button = await screen.findByRole('button', { name: /instalar licencia/i })
    const input = screen.getByLabelText(/instalar licencia/i) as HTMLInputElement
    const file = new File(['{"payload":{}}'], 'license.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(upload).toHaveBeenCalledWith('{"payload":{}}'))
    // El botón deshabilitado durante la subida vuelve a habilitarse.
    await waitFor(() => expect(button).toBeEnabled())
    await waitFor(() => expect(refreshEntitlements).toHaveBeenCalled())
    // El refetch trae el estado instalado (badge Licenciada).
    expect(await screen.findByText('Licenciada')).toBeInTheDocument()
  })

  it('un upload rechazado muestra el motivo del backend sin perder el estado', async () => {
    hasPermission.mockReturnValue(true)
    getStatus.mockResolvedValue(snapshot({ mode: 'trial' }))
    upload.mockRejectedValue(new Error('licencia vencida el 2026-01-01T00:00:00Z'))
    renderPage()

    await screen.findByText('En evaluación')
    const input = screen.getByLabelText(/instalar licencia/i) as HTMLInputElement
    const file = new File(['{"payload":{}}'], 'license.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('La licencia no pudo instalarse')
    expect(alert.textContent).toContain('licencia vencida el 2026-01-01')
    // El estado de evaluación sigue visible.
    expect(screen.getByText('En evaluación')).toBeInTheDocument()
  })
})
