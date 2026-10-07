import { beforeEach, describe, expect, it, vi } from 'vitest'
import { versionService } from '../versionService'

// Mock en la frontera: el servicio consume el cliente HTTP central.
vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '@/services/api'

const mockedGet = vi.mocked(apiClient.get)

describe('versionService.getBuildInfo', () => {
  beforeEach(() => {
    mockedGet.mockReset()
  })

  it('consulta /version en la raíz del router (sin /api/v1) y normaliza la respuesta', async () => {
    mockedGet.mockResolvedValue({
      version: 'v1.1.0-6-g9a91a32',
      commit: '9a91a32',
      build_date: '2026-10-07T10:00:00Z',
      go: 'go1.24.0',
    })

    const info = await versionService.getBuildInfo()

    expect(mockedGet).toHaveBeenCalledWith('/version')
    expect(info).toEqual({
      version: 'v1.1.0-6-g9a91a32',
      commit: '9a91a32',
      build_date: '2026-10-07T10:00:00Z',
    })
  })

  it('degrada a strings vacíos los campos ausentes o no string', async () => {
    mockedGet.mockResolvedValue({ version: 42, commit: null })

    const info = await versionService.getBuildInfo()

    expect(info).toEqual({ version: '', commit: '', build_date: '' })
  })

  it('propaga el error si el backend no responde (el store decide el fail-open)', async () => {
    mockedGet.mockRejectedValue(new Error('network down'))

    await expect(versionService.getBuildInfo()).rejects.toThrow('network down')
  })
})
