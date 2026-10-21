import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  auditAriaSortFor,
  type AuditSort,
} from '@/domain/audit/filters'
import type { AuditLogSortBy } from '@/types/bi'

interface AuditSortHeaderProps {
  label: string
  field: AuditLogSortBy
  sort: AuditSort | null
  onSort: (field: AuditLogSortBy) => void
}

/**
 * Encabezado de columna con orden server-side (whitelist del repo:
 * category|action|level). El `<th>` recibe `aria-sort` desde la página
 * (`auditAriaSortFor`); el botón anuncia la dirección actual. Un tercer click
 * vuelve al orden default del BE (timestamp DESC).
 */
export const AuditSortHeader = ({ label, field, sort, onSort }: AuditSortHeaderProps) => {
  const { t } = useI18n()
  const ariaSort = auditAriaSortFor(sort, field)
  const active = ariaSort !== 'none'
  const ariaLabel =
    ariaSort === 'ascending'
      ? t('audit.common.sortActiveAsc', 'Ordenar por {column} (ascendente)', {
          column: label,
        })
      : ariaSort === 'descending'
        ? t('audit.common.sortActiveDesc', 'Ordenar por {column} (descendente)', {
            column: label,
          })
        : t('audit.common.sortBy', 'Ordenar por {column}', { column: label })
  const Icon = active ? (ariaSort === 'ascending' ? ArrowUp : ArrowDown) : ChevronsUpDown

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      aria-label={ariaLabel}
      data-sort-field={field}
      data-sort-order={active && sort ? sort.order : undefined}
      className="inline-flex items-center gap-xs text-label-caps uppercase text-on-surface-deep transition-colors duration-150 hover:text-foreground"
    >
      {label}
      <Icon size={12} aria-hidden="true" />
    </button>
  )
}

export default AuditSortHeader
