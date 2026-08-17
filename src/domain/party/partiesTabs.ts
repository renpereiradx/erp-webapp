/**
 * Dominio Party — visibilidad de tabs del directorio (/parties).
 *
 * Reglas puras de qué tabs mostrar según permisos y de cómo resolver la tab
 * activa inicial. Sin dependencias de React ni side effects.
 */

export type PartyTab = 'clientes' | 'proveedores'

/** Tabs visibles según permisos (el orden del directorio se conserva). */
export function visiblePartyTabs(
  canSeeClients: boolean,
  canSeeSuppliers: boolean,
): PartyTab[] {
  const tabs: PartyTab[] = []
  if (canSeeClients) tabs.push('clientes')
  if (canSeeSuppliers) tabs.push('proveedores')
  return tabs
}

/**
 * Resuelve la tab activa: respeta la pedida (query param `tab`) si está
 * visible; si no, cae a la primera visible.
 */
export function resolvePartyTab(
  requested: string | null | undefined,
  visible: PartyTab[],
): PartyTab {
  const normalized: PartyTab =
    requested === 'proveedores' ? 'proveedores' : 'clientes'
  return visible.includes(normalized) ? normalized : (visible[0] ?? 'clientes')
}
