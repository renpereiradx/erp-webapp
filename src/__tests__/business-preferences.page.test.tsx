/**
 * Tests de la página "Preferencias del negocio"
 * (PLAN_SERVICIOS_Y_RESERVAS_CONFIGURABLES — pendiente Q1).
 *
 * Contrato verificado: la página refleja el valor allowlistado del backend,
 * el toggle guarda vía useBusinessConfigStore.updateSetting (que a su vez
 * refresca los gates globales) y el error de carga muestra retry.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BusinessPreferencesPage from '../features/settings/components/BusinessPreferencesPage'
import { businessSettingsService } from '@/services/businessSettingsService'
import { useBusinessConfigStore } from '@/store/useBusinessConfigStore'

vi.mock('@/services/businessSettingsService', () => ({
  businessSettingsService: {
    getAll: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

const reservationsRow = (over: Record<string, unknown> = {}) => ({
  key: 'modules.reservations.enabled',
  value: true,
  updated_at: '2026-09-01T12:00:00Z',
  updated_by: 'smoke_admin',
  ...over,
})

describe('BusinessPreferencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBusinessConfigStore.setState({
      settings: {},
      loading: false,
      loaded: true,
      error: null,
    })
    vi.mocked(businessSettingsService.getAll).mockResolvedValue([reservationsRow()])
    vi.mocked(businessSettingsService.update).mockImplementation(async (_key: string, value: unknown) => ({
      key: 'modules.reservations.enabled',
      value,
      updated_at: '2026-09-01T13:00:00Z',
      updated_by: 'test_admin',
    }))
  })

  it('renders the reservations toggle reflecting the stored value and audit metadata', async () => {
    render(<BusinessPreferencesPage />)

    expect(await screen.findByRole('switch', { name: /módulo de reservas/i })).toBeChecked()
    expect(screen.getByText('smoke_admin')).toBeInTheDocument()
    // Módulos activos: badge de estado
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('toggling off saves the inverted value through the global config store', async () => {
    render(<BusinessPreferencesPage />)

    const sw = await screen.findByRole('switch', { name: /módulo de reservas/i })
    fireEvent.click(sw)

    await waitFor(() => {
      expect(businessSettingsService.update).toHaveBeenCalledWith(
        'modules.reservations.enabled',
        false,
      )
    })
    // El store global (fuente de los gates) queda sincronizado.
    await waitFor(() => {
      expect(
        useBusinessConfigStore.getState().settings['modules.reservations.enabled'],
      ).toBe(false)
    })
    expect(await screen.findByText('Desactivado')).toBeInTheDocument()
  })

  it('shows an error state with retry when the initial load fails', async () => {
    vi.mocked(businessSettingsService.getAll).mockRejectedValueOnce(new Error('network down'))

    render(<BusinessPreferencesPage />)

    expect(
      await screen.findByText('No se pudo cargar la configuración'),
    ).toBeInTheDocument()
    expect(screen.getByText('network down')).toBeInTheDocument()

    vi.mocked(businessSettingsService.getAll).mockResolvedValueOnce([reservationsRow()])
    fireEvent.click(screen.getByTestId('error-retry'))

    expect(await screen.findByRole('switch', { name: /módulo de reservas/i })).toBeChecked()
  })
})
