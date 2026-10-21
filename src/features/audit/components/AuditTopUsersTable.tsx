import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import type { AuditUserActivitySummary } from '@/types/bi'
import { formatCount, formatDateTime, formatSuccessRate } from '@/domain/audit/format'
import { AuditTable, type AuditColumn } from './AuditTable'

interface AuditTopUsersTableProps {
  users: AuditUserActivitySummary[]
  testId: string
  caption?: string
}

/** Top de usuarios del período (5 del dashboard), con pivote a su ficha. */
export const AuditTopUsersTable = ({ users, testId, caption }: AuditTopUsersTableProps) => {
  const { t, lang } = useI18n()

  const columns: Array<AuditColumn<AuditUserActivitySummary>> = [
    {
      key: 'user',
      className: 'min-w-[200px]',
      header: t('audit.table.user', 'Usuario'),
      render: (row) => (
        <div className="flex min-w-0 flex-col">
          <Link
            to={`/auditoria/usuarios/${encodeURIComponent(row.user_id)}`}
            className="break-all text-primary hover:underline"
          >
            {row.username || row.user_id}
          </Link>
          <span className="text-body-sm text-on-surface-deep">
            {t('audit.topUsers.meta', '{sessions} sesiones · {categories} categorías', {
              sessions: formatCount(row.unique_sessions),
              categories: formatCount(row.unique_categories),
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      align: 'right',
      header: t('audit.table.count', 'Acciones'),
      render: (row) => formatCount(row.total_actions),
    },
    {
      key: 'success',
      align: 'right',
      header: t('audit.table.successRate', 'Tasa de éxito'),
      render: (row) =>
        formatSuccessRate(row.total_actions, row.successful_actions),
    },
    {
      key: 'last',
      mono: true,
      header: t('audit.table.lastActivity', 'Última actividad'),
      render: (row) => formatDateTime(row.last_activity, lang),
    },
  ]

  return (
    <AuditTable
      columns={columns}
      rows={users}
      rowKey={(row) => row.user_id}
      minWidthClass="min-w-0"
      testId={testId}
      caption={caption}
      empty={
        <TableEmptyState
          icon={Users}
          title={t('audit.topUsers.empty', 'Sin actividad de usuarios')}
          description={t(
            'audit.topUsers.emptyHint',
            'El período no registra eventos asociados a un usuario.',
          )}
        />
      }
    />
  )
}

export default AuditTopUsersTable
