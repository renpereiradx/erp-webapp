import { useNavigate } from 'react-router-dom'
import { Menu, SlidersHorizontal, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { User } from '@/types'
import type { NavigationItem } from './types'
import NavList from './NavList'

interface SidebarProps {
  isExpanded: boolean
  onToggle: () => void
  items: NavigationItem[]
  expandedMenus: Record<string, boolean>
  onToggleMenu: (name: string) => void
  isActive: (href?: string) => boolean
  isParentActive: (item: NavigationItem) => boolean
  user: User | null
}

/** Marca del shell (logo + título), compartida por desktop y mobile */
function BrandMark() {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-sm overflow-hidden">
      <div className="size-9 min-w-[36px] bg-primary rounded-sm flex items-center justify-center text-on-primary">
        <span className="material-symbols-outlined text-xl font-bold">architecture</span>
      </div>
      <div onClick={() => navigate('/dashboard')} className="cursor-pointer whitespace-nowrap">
        <h1 className="text-title-md tracking-tighter uppercase leading-none text-foreground">ERP System</h1>
        <p className="text-label-caps uppercase text-on-surface-deep leading-none mt-xs">Fluent ERP v2.0</p>
      </div>
    </div>
  )
}

/** Sidebar desktop: sticky, colapsable (w-72 / w-20) */
export function Sidebar({
  isExpanded,
  onToggle,
  items,
  expandedMenus,
  onToggleMenu,
  isActive,
  isParentActive,
  user,
}: SidebarProps) {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <aside className={`${isExpanded ? 'w-72' : 'w-20'} shrink-0 border-r border-border-subtle bg-surface-muted flex flex-col sticky top-0 h-screen z-[60] transition-all duration-300 ease-in-out`}>
      <div className={`p-lg flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} gap-sm`}>
        {isExpanded ? (
          <>
            <BrandMark />
            <button
              onClick={onToggle}
              aria-label={t('nav.collapseSidebar', 'Colapsar menú')}
              title={t('nav.collapseSidebar', 'Colapsar menú')}
              className="p-xs rounded-button hover:bg-surface-subtle text-on-surface-deep transition-colors duration-150"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            aria-label={t('nav.expandSidebar', 'Expandir menú')}
            title={t('nav.expandSidebar', 'Expandir menú')}
            className="size-10 bg-primary/5 text-primary rounded-button flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors duration-150"
          >
            <Menu className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-md space-y-xs overflow-y-auto custom-scrollbar pb-lg overflow-x-hidden">
        <NavList
          items={items}
          expandedMenus={expandedMenus}
          isSidebarExpanded={isExpanded}
          onToggleMenu={onToggleMenu}
          onToggleSidebar={onToggle}
          isActive={isActive}
          isParentActive={isParentActive}
        />
      </nav>

      <div className="p-md border-t border-border-subtle">
        <div
          className={`bg-surface rounded-md shadow-whisper p-md flex items-center ${isExpanded ? 'gap-sm' : 'justify-center'} cursor-pointer hover:shadow-fluent-8 transition-shadow duration-150 group/profile overflow-hidden`}
          onClick={() => navigate('/configuracion/perfil')}
          title={!isExpanded ? user?.first_name || t('nav.profile', 'Perfil') : ''}
        >
          <div className="size-8 min-w-[32px] rounded-full bg-primary/20 flex items-center justify-center text-primary text-body-sm-bold overflow-hidden group-hover/profile:ring-2 group-hover/profile:ring-primary/20 transition-all">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.first_name?.charAt(0) || 'U'
            )}
          </div>
          {isExpanded && (
            <div className="min-w-0 flex-1 animate-in fade-in duration-300">
              <p className="text-body-sm-bold truncate text-foreground">
                {user?.first_name || t('common.user', 'Usuario')}
              </p>
              <p className="text-body-sm-bold text-on-surface-deep truncate">
                {user?.email || t('nav.viewProfile', 'Ver perfil')}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

interface MobileSidebarProps {
  onClose: () => void
  items: NavigationItem[]
  expandedMenus: Record<string, boolean>
  onToggleMenu: (name: string) => void
  isActive: (href?: string) => boolean
  isParentActive: (item: NavigationItem) => boolean
}

/** Overlay mobile: backdrop + drawer lateral. */
export function MobileSidebar({
  onClose,
  items,
  expandedMenus,
  onToggleMenu,
  isActive,
  isParentActive,
}: MobileSidebarProps) {
  const { t } = useI18n()

  return (
    <div className="fixed inset-0 z-[70] flex lg:hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-72 max-w-[80vw] bg-surface-muted border-r border-border-subtle flex flex-col h-full animate-in slide-in-from-left duration-300">
        <button
          className="absolute top-md right-md p-sm text-on-surface-deep hover:text-foreground transition-colors duration-150"
          aria-label={t('action.close', 'Cerrar')}
          onClick={onClose}
        >
          <X className="size-5" />
        </button>
        <div className="p-lg flex items-center gap-sm">
          <BrandMark />
        </div>
        <nav className="flex-1 px-md space-y-xs overflow-y-auto pb-lg custom-scrollbar">
          <NavList
            items={items}
            expandedMenus={expandedMenus}
            isSidebarExpanded
            onToggleMenu={onToggleMenu}
            onLinkClick={onClose}
            isActive={isActive}
            isParentActive={isParentActive}
          />
        </nav>
      </aside>
    </div>
  )
}
