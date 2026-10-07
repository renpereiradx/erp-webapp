import { beforeEach, describe, expect, it, vi } from 'vitest'
import useVersionStore from '../useVersionStore'

// Mock en la frontera consumida por el store: el servicio HTTP.
vi.mock('@/services/versionService', () => ({
  versionService: { getBuildInfo: vi.fn() },
}))

import { versionService } from '@/services/versionService'

const mockedGetBuildInfo = vi.mocked(versionService.getBuildInfo)

const BE_OK = { version: 'v1.1.0-6-g9a91a32', commit: '9a91a32', build_date: '2026-10-07T10:00:00Z' }

function resetStore(feVersion = '1.1.0') {
  useVersionStore.setState({ feVersion, backend: null, status: 'idle' })
}

describe('useVersionStore', () => {
  beforeEach(() => {
    mockedGetBuildInfo.mockReset()
    resetStore()
  })

  it('fetchVersion exitoso: guarda el backend y status ready', async () => {
    mockedGetBuildInfo.mockResolvedValue(BE_OK)

    await useVersionStore.getState().fetchVersion()

    expect(useVersionStore.getState().status).toBe('ready')
    expect(useVersionStore.getState().backend).toEqual(BE_OK)
  })

  it('fail-open: si el backend falla, status error y el badge conserva la versión FE', async () => {
    mockedGetBuildInfo.mockRejectedValue(new Error('network down'))

    await useVersionStore.getState().fetchVersion()

    const state = useVersionStore.getState()
    expect(state.status).toBe('error')
    expect(state.backend).toBeNull()
    expect(state.feVersion).toBe('1.1.0')
  })

  it('es idempotente: status ready no re-dispara el fetch', async () => {
    mockedGetBuildInfo.mockResolvedValue(BE_OK)

    await useVersionStore.getState().fetchVersion()
    await useVersionStore.getState().fetchVersion()
    await useVersionStore.getState().fetchVersion()

    expect(mockedGetBuildInfo).toHaveBeenCalledTimes(1)
  })

  it('no dispara fetches duplicados mientras loading', async () => {
    let resolveFetch: (v: typeof BE_OK) => void = () => {}
    mockedGetBuildInfo.mockImplementation(
      () => new Promise<typeof BE_OK>((resolve) => { resolveFetch = resolve }),
    )

    const first = useVersionStore.getState().fetchVersion()
    const second = useVersionStore.getState().fetchVersion()

    resolveFetch(BE_OK)
    await Promise.all([first, second])

    expect(mockedGetBuildInfo).toHaveBeenCalledTimes(1)
  })
})
