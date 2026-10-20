import type { RefObject } from 'react'
import {
  SearchableDropdown,
  type SearchableDropdownItem,
} from '@/components/ui/SearchableDropdown'
import { HighlightText } from '@/components/ui/HighlightText'
import { useI18n } from '@/lib/i18n'
import type { EntityOption, EntitySearchFn } from '../types'

type DropdownItem = SearchableDropdownItem & EntityOption

interface EntitySearchSelectProps {
  /**
   * Búsqueda del servicio correspondiente (producto/cliente/proveedor).
   * El signal es opt-in (convención DESIGN §13): el dropdown lo aborta al
   * re-tipear y los services que lo aceptan cancelan el HTTP en vuelo.
   */
  search: EntitySearchFn
  /** el segundo argumento llega completo para pickers que navegan variantes */
  onPick: (id: string, option: EntityOption) => void
  placeholder: string
  /** mínimo de caracteres para fetchear (búsqueda plana de productos: 3) */
  minChars?: number
  inputRef?: RefObject<HTMLInputElement | null>
  testId?: string
}

/**
 * Selector de entidad de los drill-downs sin id en la URL: wrapper del
 * dropmenu compartido `SearchableDropdown` (debounce, teclado y resaltado)
 * con ítems de dos líneas en contexto: nombre + SKU/documento. Sin datos
 * operativos de venta (precio/stock), que quedan fuera de contexto acá.
 */
export const EntitySearchSelect = ({
  search,
  onPick,
  placeholder,
  minChars = 2,
  inputRef,
  testId = 'entity-search',
}: EntitySearchSelectProps) => {
  const { t } = useI18n()

  const handleSearch = async (
    term: string,
    ctx?: { signal?: AbortSignal },
  ): Promise<DropdownItem[]> => {
    const results = await search(term, ctx)
    return results.map((option) => ({ ...option, name: option.label }))
  }

  return (
    <div data-testid={testId} className="w-full max-w-xl">
      <SearchableDropdown<DropdownItem>
        onSearch={handleSearch}
        onSelect={(option) => onPick(option.id, option)}
        minSearchLength={minChars}
        placeholder={placeholder}
        emptyMessage={t('relationalAnalytics.picker.noResults', 'Sin resultados')}
        inputRef={inputRef}
        renderItem={(option, _index, _isHighlighted, searchTerm) => (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body-md-bold text-foreground">
              <HighlightText text={option.label} term={searchTerm} />
            </span>
            {option.sub ? (
              <span className="font-data-mono text-body-sm text-on-surface-deep">
                <HighlightText text={option.sub} term={searchTerm} />
              </span>
            ) : null}
          </span>
        )}
      />
    </div>
  )
}

export default EntitySearchSelect
