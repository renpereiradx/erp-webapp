/**
 * TerminalPairing (D.3 + FASE E — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES).
 * Contrato UI del registro FASE E: un código de vinculación válido llama
 * a deviceService.pair y guarda el binding completo (device.id +
 * device.defaultBranch) en localStorage; un código vacío no llama al
 * servicio. El selector de sucursal nivel 1 sigue disponible como fallback.
 *
 * PLAN_CLARIDAD_TERMINALES_ESTE_DISPOSITIVO: con dispositivo registrado el
 * selector queda bloqueado (D4) y el binding se re-sincroniza desde el
 * servidor (D5 — sucursal/name frescos; 404 marca registro eliminado).
 *
 * Mocks en la frontera: deviceService, branchService e i18n (firma real,
 * fallback español). lucide-react NO se mockea (PLAN_TEST_DESIGN_FRONTEND).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}))

vi.mock('@/features/devices/services/deviceService', () => ({
  deviceService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    pair: vi.fn(),
  },
}))

vi.mock('@/features/branches/services/branchService', () => ({
  branchService: {
    getBranches: vi.fn().mockResolvedValue({
      branches: [
        { id: 1, name: 'Depósito Central', code: 'DEP' },
        { id: 2, name: 'Sucursal Centro', code: 'CEN' },
      ],
    }),
  },
}))

import { deviceService } from '@/features/devices/services/deviceService'
import TerminalPairing from '@/features/branches/components/TerminalPairing'

const pair = vi.mocked(deviceService.pair)
const getById = vi.mocked(deviceService.getById)

const deviceCaja1 = {
  id: 5,
  name: 'Caja 1',
  branch_id: 2,
  pairing_code: 'ABCD2345',
  is_active: true,
  created_at: '2026-09-06T09:00:00Z',
  updated_at: '2026-09-06T09:00:00Z',
}

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <TerminalPairing />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

afterEach(() => cleanup())

describe('TerminalPairing — registro de este dispositivo (FASE E)', () => {
  it('pairs with a backend code and stores the full device binding', async () => {
    const user = userEvent.setup()
    pair.mockResolvedValue({ id: 5, name: 'Caja 1', branch_id: 2 })
    getById.mockResolvedValue(deviceCaja1)
    renderPage()

    await user.type(await screen.findByTestId('terminal-pairing-code'), 'ABCD2345')
    await user.click(screen.getByTestId('terminal-register'))

    await waitFor(() => expect(pair).toHaveBeenCalledWith('ABCD2345'))
    await waitFor(() => {
      expect(localStorage.getItem('device.id')).toBe('5')
      expect(localStorage.getItem('device.defaultBranch')).toBe('2')
    })
    expect(await screen.findByText(/Registrado \(#5\)/)).toBeInTheDocument()
    // D5: la etiqueta combina el nombre del registro con la sucursal fresca.
    expect(await screen.findByText('Caja 1 · Sucursal Centro')).toBeInTheDocument()
  })

  it('does not call the service with an empty code', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId('terminal-pairing-code')
    const button = screen.getByTestId('terminal-register')
    expect(button).toBeDisabled()

    await user.click(button)
    expect(pair).not.toHaveBeenCalled()
  })

  it('still offers the level-1 branch picker as fallback, with the local-only hint', async () => {
    renderPage()

    expect(await screen.findByText('Depósito Central')).toBeInTheDocument()
    expect(screen.getByText('Sucursal Centro')).toBeInTheDocument()
    expect(screen.getByTestId('terminal-local-hint')).toBeInTheDocument()
  })

  it('blocks the branch picker when a device is registered (D4)', async () => {
    localStorage.setItem('device.id', '5')
    localStorage.setItem('device.defaultBranch', '2')
    getById.mockResolvedValue(deviceCaja1)
    renderPage()

    expect(await screen.findByTestId('terminal-registered-lock')).toBeInTheDocument()
    const branchCard = await screen.findByRole('button', { name: /Depósito Central/ })
    expect(branchCard).toBeDisabled()
    expect(screen.queryByTestId('terminal-local-hint')).toBeNull()
  })

  it('re-syncs the local binding from the server (D5)', async () => {
    localStorage.setItem('device.id', '5')
    localStorage.setItem('device.defaultBranch', '1') // fallback viejo
    getById.mockResolvedValue(deviceCaja1) // registro apunta a la sucursal 2
    renderPage()

    await waitFor(() => expect(localStorage.getItem('device.defaultBranch')).toBe('2'))
    expect(await screen.findByText('Caja 1 · Sucursal Centro')).toBeInTheDocument()
  })

  it('flags a deleted registration instead of staying stale (D5 — 404)', async () => {
    localStorage.setItem('device.id', '5')
    localStorage.setItem('device.defaultBranch', '2')
    getById.mockRejectedValue({ response: { status: 404 } })
    renderPage()

    expect(await screen.findByTestId('terminal-stale-registration')).toBeInTheDocument()
  })
})
