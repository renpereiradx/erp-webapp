import type { ReactNode } from 'react'

export interface AuditDetailItem {
  id: string
  label: string
  value: ReactNode
  /** Identificadores/valores técnicos en mono. */
  mono?: boolean
  /** Ocupa las dos columnas (descripciones largas, user agent). */
  wide?: boolean
}

/** Grilla de campos label/valor del detalle de un evento (DESIGN §6.8). */
export const AuditDetailGrid = ({
  items,
  testId,
}: {
  items: AuditDetailItem[]
  testId?: string
}) => (
  <dl className="grid grid-cols-1 gap-x-lg gap-y-md sm:grid-cols-2" data-testid={testId}>
    {items.map((item) => (
      <div
        key={item.id}
        className={`min-w-0 ${item.wide ? 'sm:col-span-2' : ''}`}
        data-testid={`audit-detail-${item.id}`}
      >
        <dt className="text-label-caps uppercase text-on-surface-deep">{item.label}</dt>
        <dd
          className={`mt-xs break-words text-body-md text-foreground ${
            item.mono ? 'font-data-mono text-data-mono' : ''
          }`}
        >
          {item.value}
        </dd>
      </div>
    ))}
  </dl>
)

export default AuditDetailGrid
