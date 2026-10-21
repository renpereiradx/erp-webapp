import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { AuditErrorSummary } from '@/types/bi'
import {
  auditActionFallback,
  auditActionLabelKey,
  auditCategoryFallback,
  auditCategoryLabelKey,
} from '@/domain/audit/labels'
import { formatCount, formatDateTime } from '@/domain/audit/format'
import { AuditTable, type AuditColumn } from './AuditTable'

interface AuditErrorSummaryTableProps {
  errors: AuditErrorSummary[]
  testId: string
  caption?: string
}

/**
 * Errores agrupados por categoría/acción/mensaje (`getErrorSummary` filtra
 * success=false y error_message no nulo). El mensaje es dato REAL del
 * productor; si viene vacío se dice "Sin mensaje", no se rellena.
 */
export const AuditErrorSummaryTable = ({
  errors,
  testId,
  caption,
}: AuditErrorSummaryTableProps) => {
  const { t, lang } = useI18n()

  const columns: Array<AuditColumn<AuditErrorSummary>> = [
    {
      key: 'category',
      header: t('audit.table.category', 'Categoría'),
      render: (row) => (
        <div className="flex min-w-0 flex-col">
          <span>
            {t(auditCategoryLabelKey(row.category), auditCategoryFallback(row.category))}
          </span>
          <span className="text-body-sm text-on-surface-deep">
            {t(auditActionLabelKey(row.action), auditActionFallback(row.action))}
          </span>
        </div>
      ),
    },
    {
      key: 'message',
      header: t('audit.table.message', 'Mensaje'),
      render: (row) => (
        <span className="line-clamp-2 block max-w-[200px] break-words" title={row.error_message || undefined}>
          {row.error_message || t('audit.common.noMessage', 'Sin mensaje')}
        </span>
      ),
    },
    {
      key: 'count',
      align: 'right',
      header: t('audit.table.occurrences', 'Ocurrencias'),
      render: (row) => (
        <div className="flex flex-col items-end">
          <span>{formatCount(row.count)}</span>
          <span className="whitespace-nowrap text-body-sm text-on-surface-deep">
            {formatDateTime(row.last_occurred, lang)}
          </span>
        </div>
      ),
    },
  ]

  return (
    <AuditTable
      columns={columns}
      rows={errors}
      rowKey={(row) => `${row.category}-${row.action}-${row.error_message}`}
      minWidthClass="min-w-[440px]"
      testId={testId}
      caption={caption}
      empty={
        <TableEmptyState
          icon={AlertTriangle}
          title={t('audit.errors.empty', 'Sin errores registrados')}
          description={t(
            'audit.errors.emptyHint',
            'El período no registra acciones fallidas con mensaje de error.',
          )}
        />
      }
    />
  )
}

export default AuditErrorSummaryTable
