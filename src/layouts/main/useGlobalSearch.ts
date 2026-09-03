import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useKeyboardShortcutsStore from '@/store/useKeyboardShortcutsStore'
import { useI18n } from '@/lib/i18n'
import type { NavigationItem, SearchableItem, TFn } from './types'
import { buildSearchableItems, filterSearchResults } from './search'

interface UseGlobalSearchOptions {
  navigation: NavigationItem[]
  reservationsEnabled: boolean
}

/**
 * Orquestación del buscador global: índice de rutas, filtrado por término,
 * navegación con teclado (Ctrl+K, flechas, Enter, Escape) y click-outside.
 */
export const useGlobalSearch = ({ navigation, reservationsEnabled }: UseGlobalSearchOptions) => {
  // useI18n vive en un módulo JS: afirmamos la forma de `t` en el borde
  const { t } = useI18n() as unknown as { t: TFn }
  const navigate = useNavigate()
  const matchesShortcut = useKeyboardShortcutsStore((s) => s.matchesShortcut)

  const [term, setTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchableItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<(HTMLButtonElement | null)[]>([])

  const searchableItems = useMemo(
    () => buildSearchableItems(navigation, t, reservationsEnabled),
    [navigation, t, reservationsEnabled],
  )

  const go = useCallback(
    (href: string) => {
      navigate(href)
      setIsOpen(false)
      setTerm('')
    },
    [navigate],
  )

  // Filtrar resultados y resetear la selección en cada término
  useEffect(() => {
    if (!term.trim()) {
      setResults([])
      return
    }
    setResults(filterSearchResults(searchableItems, term))
    setSelectedIndex(-1)
  }, [term, searchableItems])

  // Mantener la opción seleccionada a la vista
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current[selectedIndex]) {
      resultsRef.current[selectedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  // Atajos de teclado y navegación por resultados
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesShortcut('general.globalSearch', event)) {
        event.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
        return
      }
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter': {
          if (selectedIndex < 0) break
          event.preventDefault()
          const selected = results[selectedIndex]
          if (selected) go(selected.href)
          break
        }
        case 'Escape':
          setIsOpen(false)
          inputRef.current?.blur()
          break
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [matchesShortcut, isOpen, results, selectedIndex, go])

  // Cerrar al hacer click fuera del contenedor
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return {
    term,
    setTerm,
    isOpen,
    setIsOpen,
    results,
    selectedIndex,
    inputRef,
    containerRef,
    resultsRef,
    go,
  }
}
