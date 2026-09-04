import type { ReactNode } from 'react'

interface WorkspaceLayoutProps {
  /** Fila bajo el PageHeader: contexto (tabs / conteo) a la izquierda, búsqueda a la derecha. */
  toolbar?: ReactNode
  /** Columna maestra: árbol, listado o tabla. */
  master: ReactNode
  /** Columna de detalle: formulario/panel o estado de bienvenida. Siempre presente. */
  detail: ReactNode
  masterClassName?: string
  detailClassName?: string
  /** Columna corta que queda fija al scrollear (solo ≥ lg). */
  sticky?: 'master' | 'detail'
  testId?: string
}

/**
 * Workspace maestro-detalle compartido por las páginas de Clasificación y
 * Catálogos (ver conductor/PLAN_CATALOG_WORKSPACE_LAYOUT_FRONTEND.md).
 * Master a la izquierda, detalle a la derecha, siempre presentes; la columna
 * corta queda sticky para no perder contexto al scrollear.
 */
export function WorkspaceLayout({
  toolbar,
  master,
  detail,
  masterClassName = 'lg:col-span-5',
  detailClassName = 'lg:col-span-7',
  sticky,
  testId,
}: WorkspaceLayoutProps) {
  const stickyMaster = sticky === 'master' ? 'lg:sticky lg:top-md' : ''
  const stickyDetail = sticky === 'detail' ? 'lg:sticky lg:top-md' : ''

  return (
    <div className="flex flex-col gap-md" data-testid={testId}>
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-md">{toolbar}</div>
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        <div className={`${masterClassName} ${stickyMaster} min-w-0`}>{master}</div>
        <div className={`${detailClassName} ${stickyDetail} min-w-0 flex flex-col gap-lg`}>
          {detail}
        </div>
      </div>
    </div>
  )
}

export default WorkspaceLayout
