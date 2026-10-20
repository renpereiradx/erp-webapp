import { Building2, Package, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import type { RelationalEntityKind } from '../types'

const ENTITY_ICONS = {
  product: Package,
  client: Users,
  supplier: Building2,
} as const

export const ENTITY_LABEL_FALLBACK: Record<RelationalEntityKind, string> = {
  product: 'Producto',
  client: 'Cliente',
  supplier: 'Proveedor',
}

interface EntityContextBarProps {
  kind: RelationalEntityKind
  label: string
  sub?: string | null
  entityId: string
  variantLabel?: string | null
}

/**
 * Franja de identidad del drill-down: evita que la pantalla hable de un
 * UUID. El nombre viene del endpoint Core de la entidad; si aún no resolvió
 * (o falló), se muestra el id como fallback honesto, nunca un nombre inventado.
 */
export const EntityContextBar = ({
  kind,
  label,
  sub,
  entityId,
  variantLabel,
}: EntityContextBarProps) => {
  const { t } = useI18n()
  const Icon = ENTITY_ICONS[kind]
  const kindLabel = t(`relationalAnalytics.entity.${kind}`, ENTITY_LABEL_FALLBACK[kind])
  const reference = sub ?? t('relationalAnalytics.context.fallbackId', 'ID: {id}', { id: entityId })

  return (
    <section
      aria-label={t('relationalAnalytics.context.aria', 'Contexto del análisis')}
      className="flex flex-wrap items-center gap-md rounded-md bg-surface-muted px-md py-sm"
      data-testid="drilldown-entity-context"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-container text-on-primary-container">
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-label-caps uppercase text-on-surface-deep">{kindLabel}</p>
        <p className="truncate text-body-md-bold text-foreground" title={label}>
          {label}
        </p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-sm sm:ml-auto">
        <span
          className="max-w-full truncate font-data-mono text-body-sm text-on-surface-deep"
          title={reference}
        >
          {reference}
        </span>
        {variantLabel ? (
          <Badge
            variant="secondary"
            size="sm"
            title={variantLabel}
            className="max-w-full border-0 bg-surface-subtle text-on-surface-deep"
          >
            <span className="min-w-0 truncate">
              {t('relationalAnalytics.context.variant', 'Variante: {name}', {
                name: variantLabel,
              })}
            </span>
          </Badge>
        ) : null}
      </div>
    </section>
  )
}

export default EntityContextBar
