import type { ReactNode } from 'react'

interface TableCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  /** Pager u otro pie dentro de la card (full-bleed). */
  footer?: ReactNode
  testId?: string
}

/**
 * Card cuyo contenido principal es una tabla: header con padding y tabla
 * full-bleed (DESIGN §6.3, anatomía "card con tabla"). El empty state va
 * dentro o fuera de la tabla como fila/estado explícito.
 *
 * Promovida a `components/ui` en F5 (la usan Analítica de Ventas F4 y
 * Analítica de Inventario F5): un feature no importa componentes de otro.
 */
export const TableCard = ({
  title,
  description,
  action,
  children,
  footer,
  testId,
}: TableCardProps) => (
  <section
    className="min-w-0 overflow-hidden rounded-md bg-surface shadow-whisper"
    data-testid={testId}
  >
    <header className="flex flex-col gap-xs px-lg pb-md pt-lg sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-title-md text-foreground">{title}</h2>
        {description ? <p className="text-body-md text-on-surface-deep">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
    {children}
    {footer}
  </section>
)

export default TableCard
