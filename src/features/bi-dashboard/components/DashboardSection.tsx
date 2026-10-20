import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DashboardSectionProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  /** `data-testid` opcional para los page tests. */
  testId?: string
}

/**
 * Card de sección del dashboard: título + descripción + acción opcional.
 * Sin fetch ni cálculo; el contenido lo arma la página o un componente puro.
 */
export const DashboardSection = ({
  title,
  description,
  action,
  children,
  className,
  testId,
}: DashboardSectionProps) => (
  <section className={cn('rounded-md bg-surface p-lg shadow-whisper', className)} data-testid={testId}>
    <header className="mb-md flex flex-col gap-xs sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-title-md text-foreground">{title}</h2>
        {description ? <p className="text-body-md text-on-surface-deep">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
    {children}
  </section>
)
