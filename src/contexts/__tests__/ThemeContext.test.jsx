/**
 * ThemeContext / themes.js — contract tests (Fluent 2: solo light y dark).
 * Reemplaza a src/__tests__/theme.system.test.jsx, que testeba el sistema
 * multi-tema (neo-brutalism/material) retirado del producto.
 *
 * Contrato (src/config/themes.js + src/contexts/ThemeContext.jsx):
 * - THEME_CONFIG: { light, dark } con { id, name, mode, cssClasses, dataAttributes }.
 * - Persistencia en localStorage bajo 'erp-theme-mode'; default 'light'.
 * - DOM: clases theme--light/theme--dark + data-mode en <html> y <body>,
 *   y la clase .dark de Tailwind 4 según el modo.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import {
  ThemeProvider,
  useTheme,
  useCurrentTheme,
  useThemeActions,
} from '@/contexts/ThemeContext'
import {
  THEME_CONFIG,
  DEFAULT_THEME,
  STORAGE_KEY,
  isValidTheme,
  getThemeById,
  getAllThemeClasses,
  isDark,
  isLight,
  getOppositeTheme,
  toggleTheme,
} from '@/config/themes'

function ThemeProbe() {
  const ctx = useTheme()
  return (
    <div>
      <span data-testid="theme">{ctx.theme}</span>
      <span data-testid="is-dark">{String(ctx.isDark)}</span>
      <span data-testid="is-light">{String(ctx.isLight)}</span>
      <span data-testid="initialized">{String(ctx.isInitialized)}</span>
      <span data-testid="themes">{ctx.availableThemes.map(t => t.id).join(',')}</span>
      <button onClick={() => ctx.setTheme('dark')}>set-dark</button>
      <button onClick={() => ctx.setTheme('light')}>set-light</button>
      <button onClick={() => ctx.setTheme('material-dark')}>set-invalid</button>
      <button onClick={() => ctx.toggleTheme()}>toggle</button>
      <button onClick={() => ctx.resetTheme()}>reset</button>
    </div>
  )
}

const renderTheme = () => render(<ThemeProvider><ThemeProbe /></ThemeProvider>)

const get = id => screen.getByTestId(id).textContent

describe('themes.js — configuración', () => {
  it('expone exactamente los temas light y dark con la forma del contrato', () => {
    expect(Object.keys(THEME_CONFIG).sort()).toEqual(['dark', 'light'])

    for (const config of Object.values(THEME_CONFIG)) {
      expect(config).toHaveProperty('id')
      expect(config).toHaveProperty('name')
      expect(config).toHaveProperty('mode')
      expect(config).toHaveProperty('cssClasses')
      expect(config).toHaveProperty('dataAttributes')
    }

    expect(THEME_CONFIG.light.cssClasses).toEqual(['theme--light'])
    expect(THEME_CONFIG.dark.dataAttributes).toEqual({ mode: 'dark' })
  })

  it('define default, storage key y helpers de modo', () => {
    expect(DEFAULT_THEME).toBe('light')
    expect(STORAGE_KEY).toBe('erp-theme-mode')

    expect(isValidTheme('light')).toBe(true)
    expect(isValidTheme('material-dark')).toBe(false)
    expect(getThemeById('nope')).toBe(null)

    expect(isDark('dark')).toBe(true)
    expect(isLight('light')).toBe(true)
    expect(getOppositeTheme('light')).toBe('dark')
    expect(toggleTheme('dark')).toBe('light')

    expect(getAllThemeClasses()).toEqual(['theme--light', 'theme--dark'])
  })
})

describe('ThemeProvider', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
    const all = getAllThemeClasses()
    document.documentElement.classList.remove(...all, 'dark')
    document.body.classList.remove(...all, 'dark')
    document.documentElement.removeAttribute('data-mode')
    document.body.removeAttribute('data-mode')
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('usa el tema guardado en localStorage si es válido', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    renderTheme()

    expect(get('theme')).toBe('dark')
    expect(get('is-dark')).toBe('true')
  })

  it('cae al default si el valor guardado no es válido', () => {
    localStorage.setItem(STORAGE_KEY, 'material-dark')

    renderTheme()

    expect(get('theme')).toBe('light')
  })

  it('aplica clases y data-mode del tema en <html> y <body> al montar', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    renderTheme()

    for (const el of [document.documentElement, document.body]) {
      expect(el.classList.contains('theme--dark')).toBe(true)
      expect(el.classList.contains('theme--light')).toBe(false)
      // Tailwind 4: la variante dark se activa con la clase .dark
      expect(el.classList.contains('dark')).toBe(true)
      expect(el.getAttribute('data-mode')).toBe('dark')
    }
  })

  it('setTheme aplica, persiste y cambia el estado', () => {
    renderTheme()

    expect(get('theme')).toBe('light')

    act(() => {
      screen.getByText('set-dark').click()
    })

    expect(get('theme')).toBe('dark')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.classList.contains('theme--dark')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.body.getAttribute('data-mode')).toBe('dark')
  })

  it('setTheme rechaza ids inválidos sin tocar estado ni DOM', () => {
    renderTheme()

    act(() => {
      screen.getByText('set-invalid').click()
    })

    expect(get('theme')).toBe('light')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(null)
    expect(document.documentElement.classList.contains('theme--light')).toBe(true)
  })

  it('toggleTheme alterna light/dark y resetTheme vuelve al default', () => {
    renderTheme()

    act(() => {
      screen.getByText('toggle').click()
    })
    expect(get('theme')).toBe('dark')

    act(() => {
      screen.getByText('toggle').click()
    })
    expect(get('theme')).toBe('light')

    act(() => {
      screen.getByText('set-dark').click()
    })
    expect(get('theme')).toBe('dark')

    act(() => {
      screen.getByText('reset').click()
    })
    expect(get('theme')).toBe('light')
  })

  it('expone themeConfig y availableThemes en el contexto', () => {
    render(
      <ThemeProvider>
        <ContextShapeProbe />
      </ThemeProvider>
    )

    expect(screen.getByTestId('config-id').textContent).toBe('light')
    expect(screen.getByTestId('config-n').textContent).toBe('2')
  })
})

function ContextShapeProbe() {
  const { themeConfig, availableThemes } = useTheme()
  return (
    <div>
      <span data-testid="config-id">{themeConfig?.id}</span>
      <span data-testid="config-n">{availableThemes.length}</span>
    </div>
  )
}

describe('hooks especializados', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('useCurrentTheme devuelve solo el tema actual', () => {
    function Probe() {
      return <span data-testid="only-theme">{useCurrentTheme()}</span>
    }

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )

    expect(screen.getByTestId('only-theme').textContent).toBe('light')
  })

  it('useThemeActions cambia el tema visible vía useCurrentTheme', () => {
    function Probe() {
      const { setTheme } = useThemeActions()
      return (
        <div>
          <span data-testid="current">{useCurrentTheme()}</span>
          <button onClick={() => setTheme('dark')}>a-dark</button>
        </div>
      )
    }

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )

    act(() => {
      screen.getByText('a-dark').click()
    })
    expect(screen.getByTestId('current').textContent).toBe('dark')
  })

  it('useTheme fuera de ThemeProvider lanza error descriptivo', () => {
    function Orphan() {
      useTheme()
      return null
    }

    expect(() => render(<Orphan />)).toThrow(/useTheme must be used within a ThemeProvider/)
  })
})
