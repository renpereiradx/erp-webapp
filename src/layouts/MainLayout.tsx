/**
 * Layout principal del sistema ERP (shell autenticado).
 *
 * Composición pura: la navegación vive en `main/navigation.ts`, la lógica del
 * buscador en `main/useGlobalSearch.ts` y la presentación en `main/*`.
 * Este archivo conserva solo estado de UI del shell y efectos globales.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useBranch } from '@/contexts/BranchContext'
import { useI18n } from '@/lib/i18n'
import {
  useBusinessConfigStore,
  useReservationsEnabled,
} from '@/store/useBusinessConfigStore'
import Header from './main/Header'
import { MobileSidebar, Sidebar } from './main/Sidebar'
import { buildNavigation, filterNavigationItems } from './main/navigation'
import type { NavigationItem, TFn } from './main/types'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasPermission, hasAnyPermission } = useAuth()
  // useI18n vive en un módulo JS: afirmamos la forma de `t` en el borde
  const { t } = useI18n() as unknown as { t: TFn }
  const reservationsEnabled = useReservationsEnabled()
  const { currentBranchId } = useBranch()
  const queryClient = useQueryClient()
  const prevBranchIdRef = useRef(currentBranchId)

  // Bootstrap de configuración del negocio (post-login). El layout es el
  // shell autenticado: aquí es seguro llamar a GET /settings. Fail-open
  // (D-SR-5): si falla, los gates conservan el default `true`.
  const fetchSettings = useBusinessConfigStore((s) => s.fetchSettings)
  const configLoaded = useBusinessConfigStore((s) => s.loaded)
  useEffect(() => {
    if (!configLoaded) {
      fetchSettings().catch(() => {})
    }
  }, [configLoaded, fetchSettings])

  // Al cambiar la sucursal se fuerza la recarga del área main: se limpia la
  // caché de react-query y el key de <main> remonta el árbol de la página,
  // re-ejecutando todos los fetch con la sucursal activa nueva.
  useEffect(() => {
    if (prevBranchIdRef.current === currentBranchId) return
    prevBranchIdRef.current = currentBranchId
    queryClient.clear()
  }, [currentBranchId, queryClient])

  // Detección de tamaño de pantalla (sidebar desktop vs overlay mobile)
  useEffect(() => {
    setIsClient(true)
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024)
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Expone el ancho del sidebar para que los modales portales a document.body
  // (EnhancedModal) se centren sobre el área de contenido y no sobre el viewport
  // completo (w-72 expandido / w-20 colapsado / 0 en pantallas pequeñas).
  useEffect(() => {
    const inset = isLargeScreen ? (isSidebarExpanded ? '18rem' : '5rem') : '0px'
    document.documentElement.style.setProperty('--erp-content-inset', inset)
    return () => {
      document.documentElement.style.removeProperty('--erp-content-inset')
    }
  }, [isLargeScreen, isSidebarExpanded])

  const navigation = useMemo(
    () =>
      filterNavigationItems(buildNavigation(t, reservationsEnabled), {
        hasPermission,
        hasAnyPermission,
      }),
    [t, hasPermission, hasAnyPermission, reservationsEnabled],
  )

  const isActive = useCallback(
    (href?: string) => {
      if (!href || href === '#') return false
      if (href === '/dashboard' && location.pathname === '/dashboard') return true
      return location.pathname.startsWith(href) && href !== '/dashboard'
    },
    [location.pathname],
  )

  const isParentActive = useCallback(
    (item: NavigationItem) => {
      if (!item.children) return isActive(item.href)
      return item.children.some((child) => (child.children ? isParentActive(child) : isActive(child.href)))
    },
    [isActive],
  )

  // Auto-expande los submenús que contienen la ruta actual
  useEffect(() => {
    if (!isLargeScreen || !isClient) return

    const newExpandedMenus: Record<string, boolean> = {}
    const findAndExpand = (items: NavigationItem[]): boolean => {
      let found = false
      for (const item of items) {
        if (item.href !== '#' && isActive(item.href)) {
          found = true
        }
        if (item.children) {
          const childFound = findAndExpand(item.children)
          if (childFound) {
            newExpandedMenus[item.name] = true
            found = true
          }
        }
      }
      return found
    }

    findAndExpand(navigation)
    setExpandedMenus((prev) => ({ ...prev, ...newExpandedMenus }))
  }, [location.pathname, isLargeScreen, isClient, navigation, isActive])

  const toggleSidebar = useCallback(() => setIsSidebarExpanded((prev) => !prev), [])

  const toggleMenu = useCallback((name: string) => {
    setExpandedMenus((prev) => ({ ...prev, [name]: !prev[name] }))
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {isClient && isLargeScreen && (
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
          items={navigation}
          expandedMenus={expandedMenus}
          onToggleMenu={toggleMenu}
          isActive={isActive}
          isParentActive={isParentActive}
          user={user}
        />
      )}

      {sidebarOpen && !isLargeScreen && (
        <MobileSidebar
          onClose={() => setSidebarOpen(false)}
          items={navigation}
          expandedMenus={expandedMenus}
          onToggleMenu={toggleMenu}
          isActive={isActive}
          isParentActive={isParentActive}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user}
          showMenuButton={!isLargeScreen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          navigation={navigation}
          reservationsEnabled={reservationsEnabled}
        />
        <main key={currentBranchId ?? 'global'} className="flex-1 overflow-y-auto bg-background p-md lg:p-lg custom-scrollbar">
          <div className="max-w-container-max mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
