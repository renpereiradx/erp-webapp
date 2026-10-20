import type { RefObject } from 'react'
import { Search } from 'lucide-react'
import EntitySearchSelect from './EntitySearchSelect'
import type { EntityOption, EntitySearchFn } from '../types'

interface DrilldownEntityPickerProps {
  title: string
  help: string
  searchPlaceholder: string
  search: EntitySearchFn
  onPick: (id: string, option: EntityOption) => void
  minChars?: number
  inputRef?: RefObject<HTMLInputElement | null>
  testId?: string
}

/**
 * Estado inicial de un drill-down sin entidad en la URL: explica qué se va a
 * ver y ofrece el picker. La tabla/filtros no se renderizan hasta elegir una
 * entidad (no hay análisis posible sin sujeto).
 */
export const DrilldownEntityPicker = ({
  title,
  help,
  searchPlaceholder,
  search,
  onPick,
  minChars,
  inputRef,
  testId = 'drilldown-entity-picker',
}: DrilldownEntityPickerProps) => (
  <section
    className="rounded-md bg-surface p-lg shadow-whisper"
    data-testid={testId}
    aria-labelledby={`${testId}-title`}
  >
    <div className="flex items-start gap-md">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-muted text-on-surface-deep">
        <Search size={22} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-xs">
        <h2 id={`${testId}-title`} className="text-title-md text-foreground">
          {title}
        </h2>
        <p className="text-body-md text-on-surface-deep">{help}</p>
      </div>
    </div>
    <div className="mt-lg">
      <EntitySearchSelect
        search={search}
        onPick={onPick}
        placeholder={searchPlaceholder}
        minChars={minChars}
        inputRef={inputRef}
        testId={`${testId}-search`}
      />
    </div>
  </section>
)

export default DrilldownEntityPicker
