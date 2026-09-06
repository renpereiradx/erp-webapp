/**
 * DevicesPage (FASE E — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES). Contrato UI:
 *
 * - Lista desde deviceService con nombre/sucursal/código/última actividad.
 * - Alta: "Nueva terminal" abre el formulario; guarda con el código generado
 *   por el backend (nunca se envía un pairing_code desde el cliente).
 * - Edición: rotación de código opcional + baja con confirmación.
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
import DevicesPage from '@/pages/DevicesPage'
import type { Device } from '@/features/devices/types'

const listDevices = vi.mocked(deviceService.list)

const deviceCaja1: Device = {
  id: 5,
  name: 'Caja 1',
  branch_id: 2,
  pairing_code: 'ABCD2345',
  is_active: true,
  last_seen_at: '2026-09-06T10:00:00Z',
  created_at: '2026-09-06T09:00:00Z',
  updated_at: '2026-09-06T09:00:00Z',
}

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <DevicesPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  listDevices.mockResolvedValue([deviceCaja1])
})

afterEach(() => cleanup())

describe('DevicesPage — registro de terminales (FASE E)', () => {
  it('lists devices with branch name and pairing code', async () => {
    renderPage()

    expect(await screen.findByTestId('device-row-5')).toBeInTheDocument()
    expect(screen.getByText('Caja 1')).toBeInTheDocument()
    expect(screen.getByText('Sucursal Centro')).toBeInTheDocument()
    expect(screen.getByText('ABCD2345')).toBeInTheDocument()
  })

  it('creates a device from the detail form without sending a pairing code', async () => {
    const user = userEvent.setup()
    vi.mocked(deviceService.create).mockResolvedValue({ ...deviceCaja1, id: 6, name: 'Caja 2' })
    renderPage()

    await user.click(await screen.findByTestId('device-new'))
    await user.type(screen.getByLabelText('Nombre'), 'Caja 2')
    await user.selectOptions(screen.getByLabelText('Sucursal de la terminal'), '2')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(deviceService.create).toHaveBeenCalledWith({
        name: 'Caja 2',
        branch_id: 2,
        is_active: true,
        regenerate_pairing_code: false,
      }),
    )
  })

  it('validates the form before saving (branch required)', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByTestId('device-new'))
    await user.type(screen.getByLabelText('Nombre'), 'Caja sin sucursal')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(deviceService.create).not.toHaveBeenCalled()
    // fieldError resuelve t(clave, clave): el test mockea t() y devuelve la clave.
    expect(await screen.findByText('devices.form.branchRequired')).toBeInTheDocument()
  })

  it('edits a device rotating its pairing code', async () => {
    const user = userEvent.setup()
    vi.mocked(deviceService.update).mockResolvedValue(deviceCaja1)
    renderPage()

    await user.click(await screen.findByTestId('device-row-5'))
    await screen.findByTestId('device-pairing-code')
    await user.click(screen.getByRole('checkbox', { name: /Rotar código al guardar/ }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(deviceService.update).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          name: 'Caja 1',
          branch_id: 2,
          regenerate_pairing_code: true,
        }),
      ),
    )
  })
})
