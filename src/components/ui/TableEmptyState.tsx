import type { LucideIcon } from 'lucide-react'

interface TableEmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
}

/**
 * Empty dentro de una card con tabla (DESIGN §6.3): la card no se desarma.
 * Compartido por las features BI (F2 Dashboard y F3 drill-downs) para que un
 * feature no importe componentes de otro.
 */
export const TableEmptyState = ({ icon: Icon, title, description }: TableEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-sm text-center text-on-surface-deep">
    <span className="flex size-14 items-center justify-center rounded-full bg-surface-muted">
      <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
    </span>
    <p className="text-body-md-bold text-foreground">{title}</p>
    {description ? <p className="text-body-sm text-on-surface-deep">{description}</p> : null}
  </div>
)

export default TableEmptyState
