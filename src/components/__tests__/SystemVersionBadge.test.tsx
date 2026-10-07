import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Store real + servicio mockeado (frontera consumida): testea el wiring completo.
vi.mock('@/services/versionService', () => ({
  versionService: { getBuildInfo: vi.fn() },
}))

import { SystemVersionBadge } from '../SystemVersionBadge'
import useVersionStore from '@/store/useVersionStore'
import { versionService } from '@/services/versionService'

const mockedGetBuildInfo = vi.mocked(versionService.getBuildInfo)

const BE_MATCH = { version: 'v1.1.0-6-g9a91a32', commit: '9a91a32', build_date: '2026-10-07T10:00:00Z' }
const BE_DIVERGED = { version: 'v1.0.0', commit: 'deadbeef', build_date: '2026-09-01T10:00:00Z' }

function renderBadge() {
  return render(<SystemVersionBadge />)
}

describe('SystemVersionBadge', () => {
  beforeEach(() => {
    mockedGetBuildInfo.mockReset()
    useVersionStore.setState({ feVersion: '1.1.0', backend: null, status: 'idle' })
  })

  it('muestra la versión del build FE y en el title el detalle del backend', async () => {
    mockedGetBuildInfo.mockResolvedValue(BE_MATCH)
    renderBadge()

    const badge = await waitFor(() => screen.getByTestId('system-version-badge'))
    expect(badge).toHaveTextContent('v1.1.0')
    expect(badge.getAttribute('title')).toContain('v1.1.0-6-g9a91a32')
    expect(badge.getAttribute('title')).toContain('9a91a32')
    expect(badge.getAttribute('title')).toContain('2026-10-07')
  })

  it('cuando la base del backend difiere, muestra la divergencia (instalación parcialmente actualizada)', async () => {
    mockedGetBuildInfo.mockResolvedValue(BE_DIVERGED)
    renderBadge()

    const badge = await waitFor(() => {
      const el = screen.getByTestId('system-version-badge')
      if (!el.textContent?.includes('v1.0.0')) throw new Error('backend fetch aún no resuelto')
      return el
    })
    expect(badge).toHaveTextContent('v1.1.0')
    expect(badge).toHaveTextContent('v1.0.0')
    expect(badge.getAttribute('title')).toContain('parcialmente actualizada')
  })

  it('fail-open: backend inalcanzable → el badge conserva la versión FE y lo indica en el title', async () => {
    mockedGetBuildInfo.mockRejectedValue(new Error('network down'))
    renderBadge()

    const badge = await waitFor(() => {
      const el = screen.getByTestId('system-version-badge')
      if (useVersionStore.getState().status !== 'error') throw new Error('fetch aún en curso')
      return el
    })
    expect(badge).toHaveTextContent('v1.1.0')
    expect(badge.getAttribute('title')).toContain('no disponible')
  })

  it('sin feVersion no renderiza nada (defensivo ante define ausente)', () => {
    useVersionStore.setState({ feVersion: '', status: 'error' })
    renderBadge()

    expect(screen.queryByTestId('system-version-badge')).toBeNull()
  })
})
