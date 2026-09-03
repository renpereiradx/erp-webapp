import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import type { NavigationItem } from './types'

interface NavListProps {
  items: NavigationItem[]
  /** Estado de submenús expandidos, indexado por nombre del item */
  expandedMenus: Record<string, boolean>
  /** Sidebar expandido (desktop) — en mobile va siempre en true */
  isSidebarExpanded: boolean
  onToggleMenu: (name: string) => void
  /** Click en un grupo con sidebar colapsado: expande el sidebar */
  onToggleSidebar?: () => void
  /** Click en un enlace (cierra el overlay mobile) */
  onLinkClick?: () => void
  isActive: (href?: string) => boolean
  isParentActive: (item: NavigationItem) => boolean
}

/**
 * Lista de navegación compartida por el sidebar desktop y el overlay mobile.
 * Presentacional puro: recibe el árbol ya filtrado por permisos.
 */
export default function NavList({
  items,
  expandedMenus,
  isSidebarExpanded,
  onToggleMenu,
  onToggleSidebar,
  onLinkClick,
  isActive,
  isParentActive,
}: NavListProps) {
  const itemClasses = (active: boolean) =>
    `flex items-center ${isSidebarExpanded ? 'justify-start' : 'justify-center'} gap-xs px-md py-sm rounded-button transition-colors duration-150 text-body-md ${
      active ? 'bg-primary/10 text-primary text-body-md-bold' : 'text-on-surface-deep hover:bg-surface-subtle'
    }`

  return (
    <>
      {items.map((item) => {
        const hasChildren = !!item.children && item.children.length > 0
        const active = hasChildren ? isParentActive(item) : isActive(item.href)

        if (hasChildren) {
          return (
            <div key={item.name} className="space-y-xs pt-md first:pt-0">
              {isSidebarExpanded && (
                <div className="px-md py-sm text-label-caps uppercase text-on-surface-deep truncate">
                  {item.name}
                </div>
              )}
              {item.children!.map((child) => {
                const childHasChildren = !!child.children && child.children.length > 0
                const childActive = childHasChildren ? isParentActive(child) : isActive(child.href)
                const isChildExpanded = expandedMenus[child.name]

                return (
                  <div key={child.name} className="space-y-xs">
                    {childHasChildren ? (
                      <>
                        <button
                          onClick={() =>
                            isSidebarExpanded ? onToggleMenu(child.name) : onToggleSidebar?.()
                          }
                          className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} gap-xs px-md py-sm rounded-button transition-colors duration-150 text-body-md ${
                            childActive
                              ? 'bg-primary/10 text-primary text-body-md-bold'
                              : 'text-on-surface-deep hover:bg-surface-subtle'
                          }`}
                          title={!isSidebarExpanded ? child.name : ''}
                        >
                          <span className="flex items-center gap-xs">
                            {child.icon && <child.icon className="size-4 min-w-[16px]" />}
                            {isSidebarExpanded && <span className="truncate">{child.name}</span>}
                          </span>
                          {isSidebarExpanded && (
                            <ChevronDown
                              className={`size-4 transition-transform duration-150 ${isChildExpanded ? 'rotate-180' : ''}`}
                            />
                          )}
                        </button>
                        {isSidebarExpanded && isChildExpanded && (
                          <div className="ml-lg space-y-xs border-l border-border-subtle pl-sm animate-in fade-in slide-in-from-top-1 duration-200">
                            {child.children!.map((grandchild) => (
                              <Link
                                key={grandchild.name}
                                to={grandchild.href ?? '#'}
                                onClick={onLinkClick}
                                className={`block px-md py-xs rounded-sm text-body-sm-bold transition-colors duration-150 ${
                                  isActive(grandchild.href)
                                    ? 'text-primary bg-primary/5'
                                    : 'text-on-surface-deep hover:text-foreground hover:bg-surface-subtle'
                                }`}
                              >
                                {grandchild.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        to={child.href ?? '#'}
                        onClick={onLinkClick}
                        className={itemClasses(childActive)}
                        title={!isSidebarExpanded ? child.name : ''}
                      >
                        {child.icon && <child.icon className="size-4 min-w-[16px]" />}
                        {isSidebarExpanded && <span className="truncate">{child.name}</span>}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )
        }

        return (
          <Link
            key={item.name}
            to={item.href ?? '#'}
            onClick={onLinkClick}
            className={`${itemClasses(active)} mt-xs`}
            title={!isSidebarExpanded ? item.name : ''}
          >
            {item.icon && <item.icon className="size-4 min-w-[16px]" />}
            {isSidebarExpanded && <span className="truncate">{item.name}</span>}
          </Link>
        )
      })}
    </>
  )
}
