/**
 * Layout principal del sistema ERP
 * Incluye sidebar responsive, navbar y área de contenido principal
 * Diseñado con Fluent Design System
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
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
  Loader2,
  CircleDollarSign,
  Euro,
  PoundSterling,
  JapaneseYen,
  IndianRupee,
  Bitcoin,
  Coins,
} from 'lucide-react'
import { ExchangeRateService } from '@/services/exchangeRateService.js'

// Mapeo de iconos de monedas
const currencyIconMap = {
  USD: CircleDollarSign,
  USDT: CircleDollarSign,
  EUR: Euro,
  GBP: PoundSterling,
  JPY: JapaneseYen,
  CNY: Coins,
  INR: IndianRupee,
  BTC: Bitcoin,
  ETH: Bitcoin,
  BRL: Coins,
  ARS: Coins,
  CLP: Coins,
  COP: Coins,
  MXN: Coins,
  PYG: Coins,
}

const getCurrencyIcon = (code = '') => {
  const normalizedCode = String(code || '').toUpperCase()
  return currencyIconMap[normalizedCode] || Coins
}

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
  const [navbarRates, setNavbarRates] = useState([])
  const [navbarRatesLoading, setNavbarRatesLoading] = useState(false)
  const [navbarRatesError, setNavbarRatesError] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Formateo de números para tipos de cambio
  const rateFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-PY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }),
    []
  )

  // Filtrar rates válidos
  const displayedRates = useMemo(
    () =>
      navbarRates.filter(
        rate => rate && rate.currency_code && Number.isFinite(rate.rate_to_base)
      ),
    [navbarRates]
  )

  // Obtener código de moneda base
  const baseCurrencyCode = useMemo(() => {
    const fromPayload = navbarRates.find(rate => {
      const candidate = rate?.original?.base_currency_code
      return candidate && typeof candidate === 'string'
    })

    if (fromPayload?.original?.base_currency_code) {
      return String(fromPayload.original.base_currency_code).toUpperCase()
    }

    return 'PYG'
  }, [navbarRates])

  const hasNavbarRates = displayedRates.length > 0

  // Configuración de navegación
  const navigation = useMemo(
    () => [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Productos', href: '/productos', icon: Package },
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Proveedores', href: '/proveedores', icon: Truck },
      {
        name: 'Ajustes de Producto',
        href: '/ajustes-producto',
        icon: SlidersHorizontal,
      },
      { name: 'Compras', href: '/compras', icon: ShoppingBag },
      { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
      { name: 'Gestión Reservas', href: '/gestion-reservas', icon: Calendar },
      {
        name: 'Pagos',
        href: '#',
        icon: DollarSign,
        children: [
          {
            name: 'Pagos Compras',
            href: '/pagos-compras',
            icon: CircleDollarSign,
          },
          {
            name: 'Cobros Ventas',
            href: '/cobros-ventas',
            icon: CreditCard,
          },
          {
            name: 'Documentación de Pagos',
            href: '/pagos/documentacion',
            icon: BookOpen,
          },
          {
            name: 'Gestión de Pagos',
            href: '/pagos/gestion',
            icon: SlidersHorizontal,
          },
        ],
      },
      {
        name: 'Registro de Caja',
        href: '#',
        icon: DollarSign,
        children: [
          {
            name: 'Apertura y Cierre',
            href: '/caja-registradora',
            icon: DollarSign,
          },
          {
            name: 'Registro Manual',
            href: '/movimientos-caja',
            icon: DollarSign,
          },
        ],
      },
      { name: 'Reportes', href: '/reportes', icon: BarChart3 },
    ],
    []
  )

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

  // Obtener tipos de cambio
  useEffect(() => {
    if (!isClient) return undefined

    let isActive = true

    const fetchRates = async (withLoader = false) => {
      if (!isActive) {
        return
      }
      if (withLoader) {
        setNavbarRatesLoading(true)
      }

      try {
        const data = await ExchangeRateService.getLatestAll()
        if (isActive) {
          setNavbarRates(Array.isArray(data) ? data : [])
          setNavbarRatesError(null)
        }
      } catch (error) {
        if (isActive) {
          setNavbarRatesError(
            error?.message || 'Sin datos de tipo de cambio disponibles'
          )
        }
      } finally {
        if (isActive) {
          setNavbarRatesLoading(false)
          hasFetchedRatesRef.current = true
        }
      }
    }

    fetchRates(!hasFetchedRatesRef.current)

    const intervalId = window.setInterval(() => {
      fetchRates(false)
    }, 5 * 60 * 1000)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }
  }, [isClient])

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
                  className={`nav__subitem ${
                    childActive ? 'nav__subitem--active' : ''
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
          className={`sidebar sidebar--desktop ${
            isSidebarExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'
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
        className={`layout__main ${
          isClient && isLargeScreen ? 'layout__main--with-sidebar' : ''
        } ${
          isClient && isLargeScreen && isSidebarExpanded
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
            {/* Exchange Rates */}
            <div className='navbar__rates'>
              <span className='navbar__rates-label'>Tipos de cambio</span>
              <div className='navbar__rates-list'>
                {navbarRatesLoading ? (
                  <Loader2
                    className='navbar__rates-loader'
                    aria-label='Cargando tipos de cambio'
                  />
                ) : hasNavbarRates ? (
                  displayedRates.map(rate => {
                    const Icon = getCurrencyIcon(rate.currency_code)
                    const key = `${rate.currency_code}-${
                      rate.id ?? rate.date ?? 'latest'
                    }`
                    return (
                      <div
                        key={key}
                        className='navbar__rate'
                        title={
                          rate.currency_name
                            ? `${rate.currency_name} • ${rateFormatter.format(
                                rate.rate_to_base
                              )} ${baseCurrencyCode}`
                            : undefined
                        }
                      >
                        <Icon className='navbar__rate-icon' />
                        <span className='navbar__rate-code'>
                          {rate.currency_code}
                        </span>
                        <span className='navbar__rate-value'>
                          {rateFormatter.format(rate.rate_to_base)}
                        </span>
                        <span className='navbar__rate-base'>
                          {baseCurrencyCode}
                        </span>
                      </div>
                    )
                  })
                ) : navbarRatesError ? (
                  <span
                    className='navbar__rates-error'
                    title={navbarRatesError}
                  >
                    Tipos no disponibles
                  </span>
                ) : (
                  <span className='navbar__rates-empty'>Sin datos</span>
                )}
              </div>
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
                <span className='navbar__settings-text'>Ajustes</span>
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
                      <div className='user-menu__avatar'>
                        <User className='user-menu__avatar-icon' />
                      </div>
                      <div className='user-menu__info'>
                        <p className='user-menu__name'>
                          {user?.name || 'Usuario Demo'}
                        </p>
                        <p className='user-menu__email'>
                          {user?.email || user?.username || 'demo@erp.com'}
                        </p>
                      </div>
                    </div>
                    <div className='user-menu__body'>
                      <Link
                        to='/configuracion'
                        className='user-menu__item'
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className='user-menu__item-icon' />
                        Configuración
                      </Link>
                      <button
                        onClick={handleLogout}
                        className='user-menu__item user-menu__item--danger'
                      >
                        <LogOut className='user-menu__item-icon' />
                        Cerrar Sesión
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
