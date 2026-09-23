import { useEffect, type RefObject } from 'react'

interface UseSearchFocusShortcutOptions {
  /** false mientras cualquier modal/wizard esté abierto (DESIGN.md §12.2). */
  enabled: boolean
  /** Ref del buscador principal de la página. */
  inputRef: RefObject<HTMLInputElement | null>
}

/**
 * F2 → foco (y selección) del buscador principal de la página.
 * Convención cross-página de atajos (DESIGN.md §12): F2 significa lo mismo
 * en toda página de listado; los atajos de página mueren si hay un modal abierto.
 */
export function useSearchFocusShortcut({ enabled, inputRef }: UseSearchFocusShortcutOptions) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.key === 'F2') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [enabled, inputRef])
}
