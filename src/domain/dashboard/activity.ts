/**
 * Pure helpers for the recent-activity list (`/dashboard/recent-activity`).
 *
 * El backend entrega `user` como `first_name + last_name`; cuando ambos campos
 * traen el mismo valor (p. ej. "ADMINISTRADOR ADMINISTRADOR") la UI mostraba el
 * nombre duplicado. `formatActorName` colapsa solo repeticiones ADYACENTES para
 * no alterar nombres legítimos con tokens repetidos no contiguos.
 */

export type ActivityKey = 'sale' | 'purchase' | 'payment' | 'adjustment' | 'other'

const KNOWN_ACTIVITY_TYPES = new Set(['sale', 'purchase', 'payment', 'adjustment'])

/** Tipo de actividad normalizado a una clave conocida (o `other`). */
export const getActivityKey = (type: string | null | undefined): ActivityKey => {
  const normalized = type?.trim().toLowerCase() ?? ''
  return KNOWN_ACTIVITY_TYPES.has(normalized) ? (normalized as ActivityKey) : 'other'
}

/** "ADMINISTRADOR ADMINISTRADOR" → "ADMINISTRADOR"; "Juan Pérez" intacto. */
export const formatActorName = (name: string | null | undefined): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  return parts
    .filter(
      (part, index) =>
        index === 0 || part.toLocaleLowerCase() !== parts[index - 1].toLocaleLowerCase(),
    )
    .join(' ')
}
