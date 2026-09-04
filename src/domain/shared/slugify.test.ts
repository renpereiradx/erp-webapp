import { describe, expect, it } from 'vitest'

import { codify, slugify } from './slugify'

describe('slugify', () => {
  it('generates kebab-case slugs', () => {
    expect(slugify('Global Tech')).toBe('global-tech')
  })

  it('strips leading/trailing separators and collapses repeats', () => {
    expect(slugify('  --Black  Friday!!--  ')).toBe('black-friday')
  })

  it('returns empty string for separator-only input', () => {
    expect(slugify(' --- ')).toBe('')
  })
})

describe('codify', () => {
  it('generates snake_case codes', () => {
    expect(codify('Talla Textil')).toBe('talla_textil')
  })

  it('strips leading/trailing underscores', () => {
    expect(codify('__Color Primario__')).toBe('color_primario')
  })
})
