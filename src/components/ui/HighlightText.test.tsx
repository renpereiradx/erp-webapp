import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HighlightText } from './HighlightText'

const marks = (container: HTMLElement) => container.querySelectorAll('mark')

describe('HighlightText (DESIGN.md §13)', () => {
  it('término vacío o solo espacios: texto íntegro sin marcas', () => {
    const { container: a } = render(<HighlightText text="Cemento Portland" term="" />)
    const { container: b } = render(<HighlightText text="Cemento Portland" term="   " />)
    expect(marks(a)).toHaveLength(0)
    expect(marks(b)).toHaveLength(0)
    expect(a.textContent).toBe('Cemento Portland')
  })

  it('resalta la ocurrencia case-insensitive', () => {
    const { container } = render(<HighlightText text="Cemento Portland" term="cemento" />)
    expect(marks(container)).toHaveLength(1)
    expect(marks(container)[0].textContent).toBe('Cemento')
    expect(container.textContent).toBe('Cemento Portland')
  })

  it('resalta múltiples ocurrencias', () => {
    const { container } = render(<HighlightText text="cemento en bolsas de cemento" term="cemento" />)
    expect(marks(container)).toHaveLength(2)
  })

  it('trata los caracteres especiales de regex como literales (partición por índices, sin regex)', () => {
    const { container } = render(<HighlightText text="codigo (CEM-001) especial" term="(CEM-0" />)
    expect(marks(container)).toHaveLength(1)
    expect(marks(container)[0].textContent).toBe('(CEM-0')
  })

  it('sin match: texto íntegro sin marcas', () => {
    const { container } = render(<HighlightText text="Cemento Portland" term="ladrillo" />)
    expect(marks(container)).toHaveLength(0)
    expect(container.textContent).toBe('Cemento Portland')
  })

  it('texto undefined se trata como vacío sin romper', () => {
    const { container } = render(<HighlightText text={undefined} term="cem" />)
    expect(container.textContent).toBe('')
    expect(marks(container)).toHaveLength(0)
  })

  it('aplica markClassName al <mark> (contraste sobre fila resaltada)', () => {
    const { container } = render(
      <HighlightText text="Cemento" term="cem" markClassName="bg-on-primary/20" />,
    )
    expect(marks(container)[0].className).toContain('bg-on-primary/20')
  })
})
