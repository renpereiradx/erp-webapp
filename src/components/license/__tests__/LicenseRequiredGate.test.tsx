/**
 * REQ_BIPACK v2.0 — gate full-screen de licencia requerida: el bloqueo total
 * (trial agotado sin licencia) reemplaza la app completa por esta pantalla,
 * que consulta el estado y ofrece la carga de licencia (rescate web,
 * PUT /api/v1/system/license). Sin router ni react-query por diseño.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const getStatus = vi.fn()
const upload = vi.fn()

vi.mock('@/services/licenseService', () => ({
  licenseService: {
    getStatus: (...args: unknown[]) => getStatus(...args),
    upload: (...args: unknown[]) => upload(...args),
  },
}))

import LicenseRequiredGate from '../LicenseRequiredGate'
import { ApiError } from '@/utils/ApiError'
import type { LicenseSnapshot } from '@/services/licenseService'

const blockedSnapshot = (over: Partial<LicenseSnapshot> = {}): LicenseSnapshot => ({
  status: 'none',
  enforcing: true,
  modules: [],
  expires_at: null,
  days_remaining: -3,
  grace_days: 0,
  mode: 'expired',
  blocked: true,
  trial_ends_at: '2026-09-20T00:00:00Z',
  ...over,
})

const renderGate = (props?: { onInstalled?: () => void; onRecovered?: () => void }) =>
  render(<LicenseRequiredGate {...props} />)

describe('LicenseRequiredGate', () => {
  beforeEach(() => {
    getStatus.mockReset()
    upload.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('instalación bloqueada: muestra título, badge de bloqueo y acción de carga', async () => {
    getStatus.mockResolvedValue(blockedSnapshot())
    renderGate()

    expect(await screen.findByRole('heading', { name: /licencia requerida/i })).toBeInTheDocument()
    expect(screen.getByText(/sistema bloqueado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cargar licencia/i })).toBeInTheDocument()
    expect(screen.getByText(/período de evaluación/i)).toBeInTheDocument()
  })

  it('carga de licencia exitosa: envía el contenido del archivo y ejecuta onInstalled', async () => {
    const user = userEvent.setup()
    const onInstalled = vi.fn()
    getStatus.mockResolvedValue(blockedSnapshot())
    upload.mockResolvedValue(
      blockedSnapshot({ status: 'active', mode: 'licensed', blocked: false, modules: ['bi'] }),
    )
    renderGate({ onInstalled })
    const input = await screen.findByLabelText(/cargar licencia/i)
    const content = '{"payload":"{}","signature":"AA=="}'
    const licenseFile = new File([content], 'license.json', { type: 'application/json' })

    await user.upload(input, licenseFile)

    await waitFor(() => expect(onInstalled).toHaveBeenCalledTimes(1))
    expect(upload).toHaveBeenCalledWith(content)
  })

  it('licencia inválida: muestra el motivo del rechazo y no ejecuta onInstalled', async () => {
    const user = userEvent.setup()
    const onInstalled = vi.fn()
    getStatus.mockResolvedValue(blockedSnapshot())
    upload.mockRejectedValue(
      new ApiError('VALIDATION', 'license signature verification failed', undefined, undefined, 400),
    )
    renderGate({ onInstalled })
    const input = await screen.findByLabelText(/cargar licencia/i)

    await user.upload(input, new File(['{"payload":{}}'], 'license.json', { type: 'application/json' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/license signature verification failed/i)
    expect(onInstalled).not.toHaveBeenCalled()
  })

  it('sin sesión (401): ofrece iniciar sesión en lugar del formulario', async () => {
    getStatus.mockRejectedValue(new ApiError('UNAUTHORIZED', 'Token inválido o expirado', undefined, undefined, 401))
    renderGate()

    expect(await screen.findByRole('link', { name: /iniciar sesión/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: /cargar licencia/i })).toBeNull()
  })

  it('error de consulta genérico: mensaje + botón de reintento', async () => {
    getStatus.mockRejectedValue(new ApiError('NETWORK', 'Error de red', undefined, undefined, undefined))
    renderGate()

    const retry = await screen.findByRole('button', { name: /actualizar estado/i })
    expect(screen.getByText(/no se pudo consultar el estado/i)).toBeInTheDocument()

    getStatus.mockResolvedValue(blockedSnapshot())
    await userEvent.click(retry)
    expect(await screen.findByRole('button', { name: /cargar licencia/i })).toBeInTheDocument()
  })

  // aud Fix 8: el rescate puede llegar por otra vía (otra pestaña, el
  // proveedor). Un refresco que encuentra la instalación desbloqueada
  // dispara onRecovered en lugar de esperar un F5 manual.
  it('refresco que encuentra la instalación desbloqueada dispara onRecovered', async () => {
    const onRecovered = vi.fn()
    getStatus.mockResolvedValueOnce(blockedSnapshot())
    renderGate({ onRecovered })
    await screen.findByText(/sistema bloqueado/i)
    expect(onRecovered).not.toHaveBeenCalled()

    // El botón "Actualizar estado" trae un snapshot ya rescatado.
    getStatus.mockResolvedValueOnce(
      blockedSnapshot({ status: 'active', mode: 'licensed', blocked: false }),
    )
    await userEvent.click(screen.getByRole('button', { name: /actualizar estado/i }))
    await waitFor(() => expect(onRecovered).toHaveBeenCalledTimes(1))
  })
})
