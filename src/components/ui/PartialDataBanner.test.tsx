import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

import { PartialDataBanner } from './PartialDataBanner'

describe('PartialDataBanner', () => {
  it('no renderiza nada sin metadata o con partial=false', () => {
    const { container, rerender } = render(<PartialDataBanner metadata={undefined} />)
    expect(container).toBeEmptyDOMElement()

    rerender(<PartialDataBanner metadata={{ partial: false }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el aviso con role=status y testid propio', () => {
    render(<PartialDataBanner metadata={{ partial: true }} testId="bi-partial" />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('data-testid', 'bi-partial')
    expect(status).toHaveTextContent('Algunas secciones no pudieron calcularse completas')
  })
})
