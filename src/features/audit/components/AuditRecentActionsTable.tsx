import { History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { AuditLogEntry } from '@/types/bi'
import {
  auditActionFallback,
  auditActionLabelKey,
  auditCategoryFallback,
  auditCategoryLabelKey,
} from '@/domain/audit/labels'
import { formatDateTime } from '@/domain/audit/format'
import { AuditTable, type AuditColumn } from './AuditTable'
import { AuditLevelBadge } from './AuditBadges'

interface AuditRecentActionsTableProps {
  logs: AuditLogEntry[]
  testId: string
  caption?: string
  /** La ficha de usuario ya está en el contexto del usuario. */
  showUser?: boolean
}

/**
 * Últimos eventos del dashboard (10 del BE) y de la ficha de usuario (20).
 * El timestamp linkea al detalle real y el usuario a su ficha de actividad;
 * no hay acciones decorativas.
 */
export const AuditRecentActionsTable = ({
  logs,
  testId,
  caption,
  showUser = true,
}: AuditRecentActionsTableProps) => {
  const { t, lang } = useI18n()

  const userColumn: AuditColumn<AuditLogEntry> = {
    key: 'user',
    header: t('audit.table.user', 'Usuario'),
    render: (row) =>
      row.user_id ? (
        <Link
          to={`/auditoria/usuarios/${encodeURIComponent(row.user_id)}`}
          className="text-primary hover:underline"
        >
          {row.username || row.user_id}
        </Link>
      ) : (
        '—'
      ),
  }

  const columns: Array<AuditColumn<AuditLogEntry>> = [
    {
      key: 'timestamp',
      mono: true,
      header: t('audit.table.timestamp', 'Fecha y hora'),
      render: (row) => (
        <Link
          to={`/auditoria/logs/${encodeURIComponent(String(row.id))}`}
          aria-label={t('audit.table.viewLogAria', 'Ver evento {id}', { id: row.id })}
          className="text-primary hover:underline"
        >
          {formatDateTime(row.timestamp, lang)}
        </Link>
      ),
    },
    ...(showUser ? [userColumn] : []),
    {
      key: 'action',
      header: t('audit.table.action', 'Acción'),
      render: (row) => t(auditActionLabelKey(row.action), auditActionFallback(row.action)),
    },
    {
      key: 'category',
      header: t('audit.table.category', 'Categoría'),
      render: (row) => t(auditCategoryLabelKey(row.category), auditCategoryFallback(row.category)),
    },
    {
      key: 'description',
      header: t('audit.table.description', 'Descripción'),
      render: (row) => (
        <span
          className="line-clamp-2 block max-w-[320px] break-words"
          title={row.description || undefined}
        >
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'level',
      header: t('audit.table.level', 'Nivel'),
      render: (row) => <AuditLevelBadge level={row.level} />,
    },
  ]

  return (
    <AuditTable
      columns={columns}
      rows={logs}
      rowKey={(row) => String(row.id)}
      minWidthClass={showUser ? 'min-w-[900px]' : 'min-w-[720px]'}
      testId={testId}
      caption={caption}
      empty={
        <TableEmptyState
          icon={History}
          title={t('audit.recent.empty', 'Sin eventos en el período')}
          description={t(
            'audit.recent.emptyHint',
            'El rango consultado no registra actividad de auditoría.',
          )}
        />
      }
    />
  )
}

export default AuditRecentActionsTable
