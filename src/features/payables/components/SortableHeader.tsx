import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  ariaSortFor,
  type PayablesSort,
  type PayablesSortOrder,
} from '@/domain/payables/listing'
import type { PayablesSortBy } from '@/types/bi'

interface SortableHeaderProps {
  label: string
  field: PayablesSortBy
  sort: PayablesSort
  onSort: (field: PayablesSortBy) => void
}

/**
 * Encabezado de columna con orden server-side. El `<th>` recibe `aria-sort`
 * desde la página (`ariaSortFor`); el botón anuncia la dirección actual.
 * Sin orden client-side: click dispara el refetch con `sort_by`/`sort_order`.
 */
export const SortableHeader = ({ label, field, sort, onSort }: SortableHeaderProps) => {
  const { t } = useI18n()
  const ariaSort = ariaSortFor(sort, field)
  const active = ariaSort !== 'none'
  const ariaLabel =
    ariaSort === 'ascending'
      ? t('payables.common.sortActiveAsc', 'Ordenar por {column} (ascendente)', {
          column: label,
        })
      : ariaSort === 'descending'
        ? t('payables.common.sortActiveDesc', 'Ordenar por {column} (descendente)', {
            column: label,
          })
        : t('payables.common.sortBy', 'Ordenar por {column}', { column: label })
  const Icon = active ? (ariaSort === 'ascending' ? ArrowUp : ArrowDown) : ChevronsUpDown
  const order: PayablesSortOrder = sort.order

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      aria-label={ariaLabel}
      data-sort-field={field}
      data-sort-order={active ? order : undefined}
      className="inline-flex items-center gap-xs text-label-caps uppercase text-on-surface-deep transition-colors duration-150 hover:text-foreground"
    >
      {label}
      <Icon size={12} aria-hidden="true" />
    </button>
  )
}

export default SortableHeader
