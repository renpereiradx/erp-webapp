import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { formatCount, formatPercent } from '@/domain/audit/format'
import { AuditTable, type AuditColumn } from './AuditTable'

export interface AuditBreakdownRow {
  id: string
  label: string
  count: number
  successRate: number
  percentage: number
}

interface AuditBreakdownTableProps {
  rows: AuditBreakdownRow[]
  labelHeader: string
  testId: string
  empty: { icon: LucideIcon; title: string; description?: string }
  caption?: string
}

/**
 * Desglose por categoría o por acción: conteo, tasa de éxito y participación,
 * los tres calculados por el backend. La barra de participación solo dibuja el
 * porcentaje real (sin normalizar a 100).
 */
export const AuditBreakdownTable = ({
  rows,
  labelHeader,
  testId,
  empty,
  caption,
}: AuditBreakdownTableProps) => {
  const { t } = useI18n()
  const columns: Array<AuditColumn<AuditBreakdownRow>> = [
    {
      key: 'label',
      header: labelHeader,
      render: (row) => <span className="text-body-md-bold text-foreground">{row.label}</span>,
    },
    {
      key: 'count',
      align: 'right',
      header: t('audit.table.count', 'Acciones'),
      render: (row) => formatCount(row.count),
    },
    {
      key: 'success',
      align: 'right',
      header: t('audit.table.successRate', 'Tasa de éxito'),
      render: (row) => formatPercent(row.successRate),
    },
    {
      key: 'share',
      align: 'right',
      header: t('audit.table.share', 'Participación'),
      render: (row) => (
        <div className="flex flex-col items-end gap-xs">
          <span>{formatPercent(row.percentage)}</span>
          <span className="h-1 w-16 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${Math.max(0, Math.min(100, row.percentage))}%` }}
            />
          </span>
        </div>
      ),
    },
  ]

  return (
    <AuditTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      minWidthClass="min-w-[420px]"
      testId={testId}
      caption={caption}
      empty={<TableEmptyState icon={empty.icon} title={empty.title} description={empty.description} />}
    />
  )
}

export default AuditBreakdownTable
