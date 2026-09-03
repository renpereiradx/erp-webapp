import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { User as UserType } from '@/types'
import BranchSwitcher from '@/components/BranchSwitcher'
import type { NavigationItem } from './types'
import { useGlobalSearch } from './useGlobalSearch'

interface HeaderProps {
  user: UserType | null
  /** Mostrar hamburguesa (pantallas < lg) */
  showMenuButton: boolean
  onOpenSidebar: () => void
  onLogout: () => void
  navigation: NavigationItem[]
  reservationsEnabled: boolean
}

/** Header sticky (glass-acrylic): buscador global, sucursal, notificaciones y perfil. */
export default function Header({
  user,
  showMenuButton,
  onOpenSidebar,
  onLogout,
  navigation,
  reservationsEnabled,
}: HeaderProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const {
    term,
    setTerm,
    isOpen,
    setIsOpen,
    results,
    selectedIndex,
    inputRef,
    containerRef,
    resultsRef,
    go,
  } = useGlobalSearch({ navigation, reservationsEnabled })

  return (
    <header className="h-16 border-b border-border-subtle glass-acrylic sticky top-0 z-[40] flex items-center justify-between px-md lg:px-lg">
      <div className="flex items-center gap-md flex-1">
        {showMenuButton && (
          <button
            onClick={onOpenSidebar}
            aria-label={t('nav.openMenu', 'Abrir menú')}
            className="p-sm text-on-surface-deep hover:text-foreground transition-colors duration-150 lg:hidden"
          >
            <Menu className="size-6" />
          </button>
        )}
        <div className="relative flex-1 max-w-md hidden md:block" ref={containerRef}>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-sm flex items-center text-on-surface-deep group-focus-within:text-primary transition-colors duration-150">
              <Search className="size-4" />
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder={t('nav.globalSearchPlaceholder', 'Buscar páginas o comandos (Ctrl+K)...')}
              className="w-full pl-10 pr-md bg-surface-subtle border border-border-subtle rounded-input text-body-md text-foreground placeholder:text-on-surface-deep focus:bg-surface focus:ring-2 focus:ring-primary/20 outline-none transition-colors duration-150 h-9"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
            />
          </div>
          {isOpen && term.length > 0 ? (
            <div className="absolute top-full left-0 right-0 mt-sm bg-surface rounded-md shadow-fluent-8 border border-border-subtle overflow-hidden z-[100] max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-sm">
                {results.map((item, index) => {
                  const Icon = item.icon || Search
                  const uniqueKey = `search-result-${item.href}-${index}`
                  return (
                    <button
                      key={uniqueKey}
                      ref={(el) => {
                        resultsRef.current[index] = el
                      }}
                      onClick={() => go(item.href)}
                      className={`w-full flex items-center gap-sm px-md py-sm text-left transition-colors duration-150 ${
                        index === selectedIndex
                          ? 'bg-primary/5 border-l-4 border-primary'
                          : 'hover:bg-surface-muted border-l-4 border-transparent'
                      }`}
                    >
                      <div
                        className={`p-xs rounded-sm ${
                          index === selectedIndex ? 'bg-primary text-on-primary' : 'bg-surface-subtle text-on-surface-deep'
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-body-sm-bold text-foreground truncate">{item.name}</span>
                        <span className="text-label-caps uppercase text-on-surface-deep">{item.category}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-sm">
        <BranchSwitcher />
        <div className="flex items-center gap-xs">
          <button
            className="p-sm text-on-surface-deep hover:bg-surface-muted rounded-button transition-colors duration-150 relative group"
            aria-label={t('common.notifications', 'Notificaciones')}
          >
            <Bell className="size-5" />
            <span className="absolute top-sm right-sm size-2 bg-error rounded-full border-2 border-surface"></span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              aria-label={t('nav.profile', 'Perfil')}
              className={`flex items-center gap-xs p-xs rounded-button transition-colors duration-150 ${
                showUserMenu ? 'bg-surface-muted' : 'hover:bg-surface-muted'
              }`}
            >
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-body-sm-bold overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <ChevronDown className={`size-4 text-on-surface-deep transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-sm w-64 bg-surface rounded-md shadow-fluent-8 border border-border-subtle overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                <div className="p-md border-b border-border-subtle bg-surface-muted">
                  <p className="text-body-sm-bold text-foreground truncate uppercase tracking-tighter">
                    {user?.first_name || t('common.user', 'Usuario')}
                  </p>
                  <p className="text-body-sm-bold text-on-surface-deep truncate">
                    {user?.email || t('common.no_email', 'Sin correo')}
                  </p>
                </div>
                <div className="p-sm">
                  <button
                    onClick={() => {
                      navigate('/configuracion/perfil')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-sm px-md py-sm text-body-md text-on-surface-deep hover:text-primary hover:bg-primary/5 rounded-sm transition-colors duration-150"
                  >
                    <User className="size-4" />
                    {t('nav.myProfile', 'Mi Perfil')}
                  </button>
                  <div className="my-xs border-t border-divider"></div>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-sm px-md py-sm text-body-md text-error hover:bg-error/10 rounded-sm transition-colors duration-150"
                  >
                    <LogOut className="size-4" />
                    {t('action.logout', 'Cerrar Sesión')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
