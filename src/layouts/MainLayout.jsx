/**
 * Layout principal del sistema ERP
 * Incluye sidebar responsive, navbar y área de contenido principal
 * Diseñado con Fluent Design System
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  ShoppingBag,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  CreditCard,
  Receipt,
  DollarSign,
  ChevronRight,
  ChevronDown,
  BookOpen,
  SlidersHorizontal,
  CircleDollarSign,
  Coins,
  Search,
} from 'lucide-react'
import useKeyboardShortcutsStore from '@/store/useKeyboardShortcutsStore'
import { distinctSearchableRoutes } from '@/config/searchableRoutes'
import { useDebounce } from '@/hooks/useDebounce'

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  const profileBtnRef = useRef(null)
  const sidebarRef = useRef(null)
  const hasFetchedRatesRef = useRef(false)

  const [menuPos, setMenuPos] = useState({ top: 0, right: 0, width: 288 })

  // Global Search State
  const [globalSearchTerm, setGlobalSearchTerm] = useState('')
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [globalSearchResults, setGlobalSearchResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const globalSearchInputRef = useRef(null)
  const searchContainerRef = useRef(null)

  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const { matchesShortcut } = useKeyboardShortcutsStore()

  // Configuración de navegación
  const navigation = useMemo(
    () => [
      { name: t('common.home', 'Dashboard'), href: '/dashboard', icon: LayoutDashboard },
      { name: t('products.title', 'Productos'), href: '/productos', icon: Package },
      { name: t('clients.title', 'Clientes'), href: '/clientes', icon: Users },
      { name: t('suppliers.title', 'Proveedores'), href: '/proveedores', icon: Truck },
      {
        name: t('productAdjustments.title', 'Ajustes de Producto'),
        href: '/ajustes-producto',
        icon: SlidersHorizontal,
      },
      { name: t('purchases.title', 'Compras'), href: '/compras', icon: ShoppingBag },
      { name: t('sales.title', 'Ventas'), href: '/ventas', icon: ShoppingCart },
      { name: t('reservations.title', 'Gestión Reservas'), href: '/gestion-reservas', icon: Calendar },
      {
        name: t('common.payments', 'Pagos'),
        href: '#',
        icon: DollarSign,
        children: [
          {
            name: t('purchasePaymentsMvp.title', 'Pagos Compras'),
            href: '/pagos-compras',
            icon: CircleDollarSign,
          },
          {
            name: t('sales.payments', 'Cobros Ventas'),
            href: '/cobros-ventas',
            icon: CreditCard,
          },
        ],
      },
      {
        name: t('cashRegister.title', 'Registro de Caja'),
        href: '#',
        icon: DollarSign,
        children: [
          {
            name: t('cashRegister.openClose', 'Apertura y Cierre'),
            href: '/caja-registradora',
            icon: DollarSign,
          },
          {
            name: t('cashMovement.title', 'Registro Manual'),
            href: '/movimientos-caja',
            icon: DollarSign,
          },
        ],
      },
      {
        name: t('common.financeConfig', 'Config. Financiera'),
        href: '#',
        icon: Coins,
        children: [
          {
            name: t('currencies.title', 'Monedas'),
            href: '/configuracion/monedas',
            icon: Coins,
          },
          {
            name: t('exchangeRates.title', 'Tipos de Cambio'),
            href: '/configuracion/tipos-cambio',
            icon: SlidersHorizontal,
          },
        ],
      },
    ],
    [t]
  )

  // Global Search Logic
  // Import extra routes dynamically or use predefined ones
  // We need to import distinctSearchableRoutes inside the component or outside?
  // Since it's a static file, we should import it at the top, but since I'm using replace_file_content 
  // and avoiding moving imports around too much, I'll assume I can add the import statement separately 
  // or just inline the logic if I can't easily add top-level imports without context.
  // actually, let's try to add the import at the top first in a separate call or handle it here if possible.
  // Wait, I can only replace a contiguous block. I should probably add the import first at the top.
  // I will skip adding the import here and do it in 2 steps: 1. Add import, 2. Update logic.

  // This step: updating the logic to use the variable (which I will import in the next step).

  const allNavigationItems = useMemo(() => {
    const items = []

    // Process sidebar navigation
    const traverse = (nodes, parentLabel = '') => {
      nodes.forEach(node => {
        if (node.href && node.href !== '#') {
          items.push({
            name: node.name,
            href: node.href,
            icon: node.icon,
            parent: parentLabel,
            category: parentLabel || 'Menú Principal'
          })
        }
        if (node.children) {
          traverse(node.children, node.name)
        }
      })
    }
    traverse(navigation)

    // Process extra routes from config
    // Note: distinctSearchableRoutes will be imported
    if (typeof distinctSearchableRoutes !== 'undefined') {
      distinctSearchableRoutes.forEach(route => {
        items.push({
          name: route.name,
          href: route.href,
          icon: route.icon,
          parent: route.category,
          category: route.category
        })
      })
    }

    return items
  }, [navigation])

  // Helper function to normalize text (remove accents, lowercase)
  const normalizeText = (text) => {
    if (!text || typeof text !== 'string') return ''
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  }

  useEffect(() => {
    if (!globalSearchTerm.trim()) {
      setGlobalSearchResults([])
      return
    }

    const term = normalizeText(globalSearchTerm)

    // Debug info
    // console.log('Searching for:', term)
    // console.log('Total items:', allNavigationItems.length)

    const results = allNavigationItems.filter(item => {
      const name = normalizeText(item.name)
      const parent = item.parent ? normalizeText(item.parent) : ''
      const category = item.category ? normalizeText(item.category) : ''

      const matchName = name.includes(term)
      const matchParent = parent.includes(term)
      const matchCategory = category.includes(term)

      return matchName || matchParent || matchCategory
    })

    // console.log('Results:', results)
    setGlobalSearchResults(results)
    setSelectedIndex(-1)
  }, [globalSearchTerm, allNavigationItems])

  // Shortcut listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (matchesShortcut('general.globalSearch', event)) {
        event.preventDefault()
        globalSearchInputRef.current?.focus()
        setShowGlobalSearch(true)
      }

      if (!showGlobalSearch) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex(prev =>
          prev < globalSearchResults.length - 1 ? prev + 1 : prev
        )
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
      }

      if (event.key === 'Enter' && selectedIndex >= 0) {
        event.preventDefault()
        const selectedItem = globalSearchResults[selectedIndex]
        if (selectedItem) {
          handleSearchResultClick(selectedItem.href)
        }
      }

      if (event.key === 'Escape') {
        setShowGlobalSearch(false)
        globalSearchInputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [matchesShortcut, showGlobalSearch, globalSearchResults, selectedIndex])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowGlobalSearch(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchResultClick = (href) => {
    navigate(href)
    setShowGlobalSearch(false)
    setGlobalSearchTerm('')
  }

  // Detectar tamaño de pantalla
  useEffect(() => {
    setIsClient(true)
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Calcular posición del menú de usuario
  useEffect(() => {
    const calcPos = () => {
      if (!profileBtnRef.current) return
      const rect = profileBtnRef.current.getBoundingClientRect()
      setMenuPos({
        top: rect.bottom + window.scrollY,
        right: rect.right + window.scrollX,
        width: 288,
      })
    }
    if (showUserMenu) {
      calcPos()
      window.addEventListener('resize', calcPos)
      window.addEventListener('scroll', calcPos, true)
    }
    return () => {
      window.removeEventListener('resize', calcPos)
      window.removeEventListener('scroll', calcPos, true)
    }
  }, [showUserMenu])



  // Auto-expandir menús con sub-items activos
  useEffect(() => {
    navigation.forEach(item => {
      if (
        item.children &&
        item.children.some(child => child.href === location.pathname)
      ) {
        setExpandedMenus(prev => {
          if (prev[item.name]) return prev
          return { ...prev, [item.name]: true }
        })
      }
    })
  }, [location.pathname, navigation])

  const isActive = href => location.pathname === href

  const isParentActive = item => {
    if (isActive(item.href)) return true
    if (item.children) {
      return item.children.some(child => isActive(child.href))
    }
    return false
  }

  const toggleMenu = menuName => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName],
    }))
  }

  const closeSidebarIfPossible = () => {
    if (!isLargeScreen) return
    const activeElement = document.activeElement
    if (sidebarRef.current && sidebarRef.current.contains(activeElement)) {
      return
    }
    setIsSidebarExpanded(false)
  }

  const handleSidebarMouseEnter = () => {
    if (!isLargeScreen) return
    setIsSidebarExpanded(true)
  }

  const handleSidebarMouseLeave = () => {
    if (!isLargeScreen) return
    closeSidebarIfPossible()
  }

  const handleSidebarFocus = () => {
    if (!isLargeScreen) return
    setIsSidebarExpanded(true)
  }

  const handleSidebarBlur = () => {
    if (!isLargeScreen) return
    window.requestAnimationFrame(() => {
      closeSidebarIfPossible()
    })
  }

  useEffect(() => {
    if (!isLargeScreen) {
      setIsSidebarExpanded(false)
    }
  }, [isLargeScreen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Render navigation item
  const renderNavItem = (item, isMobile = false) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedMenus[item.name]
    const active = hasChildren ? isParentActive(item) : isActive(item.href)
    const labelVisible = !isLargeScreen || isSidebarExpanded || isMobile
    const itemAriaLabel = labelVisible ? undefined : item.name

    return (
      <div key={item.name} className='nav__item-wrapper'>
        {hasChildren ? (
          <button
            onClick={() => toggleMenu(item.name)}
            className={`nav__item ${active ? 'nav__item--active' : ''}`}
            aria-expanded={isExpanded}
            aria-label={itemAriaLabel}
            title={item.name}
          >
            <Icon className='nav__icon' />
            <span className='nav__text' aria-hidden={!labelVisible}>
              {item.name}
            </span>
            {isExpanded ? (
              <ChevronDown
                className='nav__chevron'
                aria-hidden={!labelVisible}
              />
            ) : (
              <ChevronRight
                className='nav__chevron'
                aria-hidden={!labelVisible}
              />
            )}
          </button>
        ) : (
          <Link
            to={item.href}
            onClick={() => isMobile && setSidebarOpen(false)}
            className={`nav__item ${active ? 'nav__item--active' : ''}`}
            aria-label={itemAriaLabel}
            title={item.name}
          >
            <Icon className='nav__icon' />
            <span className='nav__text' aria-hidden={!labelVisible}>
              {item.name}
            </span>
          </Link>
        )}

        {/* Submenu */}
        {hasChildren && isExpanded && (
          <div className='nav__submenu'>
            {item.children.map(child => {
              const ChildIcon = child.icon
              const childActive = isActive(child.href)
              const childLabelVisible =
                !isLargeScreen || isSidebarExpanded || isMobile
              const childAriaLabel = childLabelVisible ? undefined : child.name

              return (
                <Link
                  key={child.name}
                  to={child.href}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={`nav__subitem ${childActive ? 'nav__subitem--active' : ''
                    }`}
                  aria-label={childAriaLabel}
                  title={child.name}
                >
                  <ChildIcon className='nav__icon' />
                  <span className='nav__text' aria-hidden={!childLabelVisible}>
                    {child.name}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='layout'>
      {/* Sidebar Desktop */}
      {isClient && isLargeScreen && (
        <aside
          ref={sidebarRef}
          className={`sidebar sidebar--desktop ${isSidebarExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'
            }`}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
          onFocusCapture={handleSidebarFocus}
          onBlurCapture={handleSidebarBlur}
        >
          <div className='sidebar__header'>
            <div className='sidebar__logo'>
              <div className='sidebar__logo-icon'>
                <LayoutDashboard className='sidebar__logo-icon-svg' />
              </div>
              <h1 className='sidebar__logo-text'>ERP System</h1>
            </div>
          </div>

          <nav className='sidebar__nav'>
            {navigation.map(item => renderNavItem(item))}
          </nav>
        </aside>
      )}

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className='sidebar-overlay'>
          <div
            className='sidebar-overlay__backdrop'
            onClick={() => setSidebarOpen(false)}
          />
          <aside className='sidebar sidebar--mobile'>
            <button
              className='sidebar__close'
              onClick={() => setSidebarOpen(false)}
              aria-label='Cerrar menú'
            >
              <X className='sidebar__close-icon' />
            </button>

            <div className='sidebar__header'>
              <div className='sidebar__logo'>
                <div className='sidebar__logo-icon'>
                  <LayoutDashboard className='sidebar__logo-icon-svg' />
                </div>
                <h1 className='sidebar__logo-text'>ERP System</h1>
              </div>
            </div>

            <nav className='sidebar__nav'>
              {navigation.map(item => renderNavItem(item, true))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`layout__main ${isClient && isLargeScreen ? 'layout__main--with-sidebar' : ''
          } ${isClient && isLargeScreen && isSidebarExpanded
            ? 'layout__main--sidebar-expanded'
            : ''
          }`}
      >
        {/* Navbar */}
        <header className='navbar'>
          <button
            className='navbar__menu-btn'
            onClick={() => setSidebarOpen(true)}
            aria-label='Abrir menú'
            style={{ display: isLargeScreen ? 'none' : 'flex' }}
          >
            <Menu className='navbar__menu-icon' />
          </button>

          <div className='navbar__content'>
            {/* Global Search */}
            <div className='navbar__search' ref={searchContainerRef} style={{ position: 'relative', flex: 1, maxWidth: '400px', margin: '0 20px' }}>
              <div className='search-input-wrapper' style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search className='search-icon' size={18} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                <input
                  ref={globalSearchInputRef}
                  type='text'
                  className='search-input'
                  placeholder='Buscar páginas (Ctrl+K)...'
                  value={globalSearchTerm}
                  onChange={(e) => {
                    setGlobalSearchTerm(e.target.value)
                    setShowGlobalSearch(true)
                  }}
                  onFocus={() => setShowGlobalSearch(true)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                />
                {globalSearchTerm && (
                  <button
                    onClick={() => {
                      setGlobalSearchTerm('')
                      setGlobalSearchResults([])
                      globalSearchInputRef.current?.focus()
                    }}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showGlobalSearch && globalSearchTerm && (
                <div className='search-results' style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 9999
                }}>
                  {globalSearchResults.length > 0 ? (
                    globalSearchResults.map((item, index) => {
                      const Icon = item.icon || Search
                      return (
                        <button
                          key={index}
                          onClick={() => handleSearchResultClick(item.href)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            background: index === selectedIndex ? '#f1f5f9' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            borderBottom: '1px solid #f1f5f9'
                          }}
                          onMouseEnter={(e) => {
                            setSelectedIndex(index)
                            e.currentTarget.style.backgroundColor = '#f8fafc'
                          }}
                          onMouseLeave={(e) => {
                            if (index !== selectedIndex) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <Icon size={16} style={{ marginRight: '10px', color: '#64748b' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>{item.name}</span>
                            {item.parent && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>en {item.parent}</span>}
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                      No se encontraron resultados
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className='navbar__actions'>
              <button
                ref={profileBtnRef}
                className='navbar__settings-btn'
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setMenuPos({
                    top: rect.bottom + window.scrollY,
                    right: rect.right + window.scrollX,
                    width: 288,
                  })
                  setShowUserMenu(prev => !prev)
                }}
                aria-label='Abrir ajustes'
              >
                <Settings className='navbar__settings-icon' />
                <span className='navbar__settings-text'>{t('settings.title', 'Ajustes')}</span>
              </button>

              {showUserMenu &&
                profileBtnRef.current &&
                createPortal(
                  <div
                    className='user-menu'
                    style={{
                      top: `${menuPos.top}px`,
                      left: `${menuPos.right - menuPos.width}px`,
                      width: '18rem',
                    }}
                  >
                    <div className='user-menu__header'>
                      <Link to='/perfil' className='user-menu__avatar' onClick={() => setShowUserMenu(false)}>
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt={user.first_name || 'User'} className='user-menu__avatar-img' style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <User className='user-menu__avatar-icon' />
                        )}
                      </Link>
                      <Link to='/perfil' className='user-menu__info' onClick={() => setShowUserMenu(false)} style={{ textDecoration: 'none' }}>
                        <p className='user-menu__name'>
                          {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || t('common.user', 'Usuario')}
                        </p>
                        <p className='user-menu__email'>
                          {user?.email || t('common.no_email', 'Sin correo')}
                        </p>
                      </Link>
                    </div>
                    <div className='user-menu__body'>
                      <Link
                        to='/configuracion'
                        className='user-menu__item'
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className='user-menu__item-icon' />
                        {t('settings.title', 'Configuración')}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className='user-menu__item user-menu__item--danger'
                      >
                        <LogOut className='user-menu__item-icon' />
                        {t('action.logout', 'Cerrar Sesión')}
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          </div>

          {/* Overlay for user menu */}
          {showUserMenu && (
            <div
              className='user-menu-overlay'
              onClick={() => setShowUserMenu(false)}
            />
          )}
        </header>

        {/* Page Content */}
        <main className='layout__content'>{children}</main>
      </div>
    </div>
  )
}

export default MainLayout
