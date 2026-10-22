import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface SortableHeaderProps {
  label: string
  active: boolean
  order: 'asc' | 'desc'
  onSort: () => void
  testId?: string
}

/**
 * Encabezado ordenable server-side: botón real con `aria-sort` en el `<th>`
 * (lo agrega la columna) y flecha solo en la columna activa. El orden lo
 * resuelve el BE (`sort_by`/`sort_order`), nunca client-side.
 */
export const SortableHeader = ({ label, active, order, onSort, testId }: SortableHeaderProps) => {
  const { t } = useI18n()
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown
  const directionLabel = active
    ? order === 'asc'
      ? t('purchaseAnalytics.table.sortedAsc', 'ordenado ascendente')
      : t('purchaseAnalytics.table.sortedDesc', 'ordenado descendente')
    : t('purchaseAnalytics.table.sortBy', 'ordenar por')

  return (
    <button
      type="button"
      onClick={onSort}
      className="inline-flex items-center gap-xs hover:text-foreground"
      aria-label={`${label} — ${directionLabel}`}
      data-testid={testId}
    >
      <span className={active ? 'text-foreground' : undefined}>{label}</span>
      <Icon size={14} className={active ? 'text-foreground' : undefined} aria-hidden="true" />
    </button>
  )
}

export default SortableHeader
