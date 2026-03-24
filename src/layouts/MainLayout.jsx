/**
 * Layout principal del sistema ERP
 * Incluye sidebar responsive, navbar y área de contenido principal
 * Diseñado con Fluent Design System
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
  BarChart,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Shield,
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
  TrendingUp,
  Flame,
  AlertTriangle,
  Award,
  List,
  FileText,
  Clock as ClockIcon,
  Zap,
  Activity,
  PieChart,
  UserCheck,
} from 'lucide-react'
import useKeyboardShortcutsStore from '@/store/useKeyboardShortcutsStore'
import { distinctSearchableRoutes } from '@/config/searchableRoutes'
import { useToast } from '@/hooks/useToast'

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  const profileBtnRef = useRef(null)
  const sidebarRef = useRef(null)

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
      {
        name: t('common.bi', 'Inteligencia de Negocios'),
        href: '#',
        icon: BarChart3,
        children: [
          {
            name: t('common.dashboard', 'Dashboard'),
            href: '#',
            icon: LayoutDashboard,
            children: [
              {
                name: t('common.home', 'Resumen Ejecutivo'),
                href: '/dashboard',
                icon: BarChart3,
              },
              {
                name: t('dashboard.kpis', 'KPIs y Rendimiento'),
                href: '/dashboard/kpis',
                icon: TrendingUp,
              },
              {
                name: t('dashboard.heatmap', 'Análisis de Ventas'),
                href: '/dashboard/sales-heatmap',
                icon: Flame,
              },
              {
                name: t('dashboard.alerts', 'Alertas de Negocio'),
                href: '/dashboard/alerts',
                icon: AlertTriangle,
              },
              {
                name: t('dashboard.topProducts', 'Top de Productos'),
                href: '/dashboard/top-products',
                icon: Award,
              },
            ],
          },
          {
            name: 'Analítica de Ventas',
            href: '#',
            icon: BarChart3,
            children: [
              {
                name: 'Dashboard Ejecutivo',
                href: '/sales-analytics/dashboard',
                icon: LayoutDashboard,
              },
              {
                name: 'Productos y Categorías',
                href: '/sales-analytics/products-categories',
                icon: PieChart,
              },
              {
                name: 'Insights Clientes/Vend.',
                href: '/sales-analytics/insights',
                icon: Users,
              },
              {
                name: 'Tendencias y Velocidad',
                href: '/sales-analytics/trends-velocity',
                icon: Zap,
              },
              {
                name: 'Comparativa Períodos',
                href: '/sales-analytics/period-comparison',
                icon: Activity,
              },
            ],
          },
          {
            name: 'Pronósticos BI (IA)',
            href: '#',
            icon: Zap,
            children: [
              {
                name: 'Dashboard de Pronósticos',
                href: '/bi/pronosticos/dashboard',
                icon: LayoutDashboard,
              },
              {
                name: 'Salud de Inventario',
                href: '/bi/pronosticos/inventario',
                icon: Package,
              },
              {
                name: 'Pronóstico de Ventas',
                href: '/bi/pronosticos/ventas',
                icon: TrendingUp,
              },
              {
                name: 'Pronóstico de Demanda',
                href: '/bi/pronosticos/demanda',
                icon: BarChart3,
              },
              {
                name: 'Escenarios de Ingresos',
                href: '/bi/pronosticos/ingresos',
                icon: BarChart,
              },
            ],
          },
          {
            name: 'Analítica de Rentabilidad',
            href: '#',
            icon: BarChart3,
            children: [
              {
                name: 'Dashboard Ejecutivo',
                href: '/profitability/dashboard',
                icon: LayoutDashboard,
              },
              {
                name: 'Rentabilidad por Producto',
                href: '/profitability/products',
                icon: BarChart3,
              },
              {
                name: 'Rentabilidad por Cliente',
                href: '/profitability/customers',
                icon: Users,
              },
              {
                name: 'Rentabilidad por Categoría',
                href: '/profitability/categories',
                icon: PieChart,
              },
              {
                name: 'Tendencias de Margen',
                href: '/profitability/trends',
                icon: Zap,
              },
              {
                name: 'Desempeño por Vendedor',
                href: '/profitability/sellers',
                icon: UserCheck,
              },
            ],
          },
          {
            name: t('inventory.analytics', 'Analítica de Inventario'),
            href: '#',
            icon: Package,
            children: [
              {
                name: t('inventory.analytics.dashboard', 'Dashboard de Inventario'),
                href: '/inventory-analytics/dashboard',
                icon: LayoutDashboard,
              },
              {
                name: t('inventory.analytics.turnover_abc', 'Rotación y Análisis ABC'),
                href: '/inventory-analytics/turnover-abc',
                icon: BarChart3,
              },
              {
                name: t('inventory.analytics.stock_levels', 'Niveles de Stock'),
                href: '/inventory-analytics/stock-levels',
                icon: List,
              },
              {
                name: t('inventory.analytics.risk', 'Riesgos y Stock Muerto'),
                href: '/inventory-analytics/risk',
                icon: AlertTriangle,
              },
            ],
          },
          {
            name: t('receivables.title', 'Cuentas por Cobrar'),
            href: '#',
            icon: CreditCard,
            children: [
              {
                name: t('receivables.summary', 'Resumen'),
                href: '/receivables',
                icon: BarChart3,
              },
              {
                name: t('receivables.list', 'Lista de Cuentas'),
                href: '/receivables/list',
                icon: List,
              },
              {
                name: t('receivables.overdue', 'Cuentas Vencidas'),
                href: '/receivables/overdue',
                icon: AlertTriangle,
              },
              {
                name: t('receivables.agingReport', 'Reporte de Antigüedad'),
                href: '/receivables/aging-report',
                icon: ClockIcon,
              },
            ],
          },
          {
            name: t('payables.title', 'Cuentas por Pagar'),
            href: '#',
            icon: CircleDollarSign,
            children: [
              {
                name: t('payables.summary', 'Resumen Ejecutivo'),
                href: '/dashboard/payables',
                icon: BarChart3,
              },
              {
                name: t('payables.invoices', 'Lista Maestra de Facturas'),
                href: '/payables/invoices',
                icon: FileText,
              },
              {
                name: t('payables.cashFlow', 'Proyección de Pagos y Flujo'),
                href: '/payables/cash-flow',
                icon: TrendingUp,
              },
              {
                name: 'Reporte de Antigüedad',
                href: '/payables/aging-report',
                icon: ClockIcon,
              },
            ],
          },
          {
            name: 'Reportes Financieros',
            href: '#',
            icon: FileText,
            children: [
              {
                name: 'Resumen Financiero BI',
                href: '/dashboard/financial-summary',
                icon: TrendingUp,
              },
              {
                name: 'Flujo de Efectivo Analítico',
                href: '/finance/analytical-cash-flow',
                icon: CircleDollarSign,
              },
              {
                name: 'Gestión de IVA / Fiscal',
                href: '/finance/tax-management',
                icon: FileText,
              },
              {
                name: 'Libros Legales (Ventas y Compras)',
                href: '/finance/legal-books',
                icon: BookOpen,
              },
              {
                name: 'Estado de Resultados (P&L)',
                href: '/finance/profit-and-loss',
                icon: BarChart3,
              },
            ],
          },
          {
            name: 'Auditoría de Sistema',
            href: '#',
            icon: Shield,
            children: [
              {
                name: 'Dashboard de Auditoría',
                href: '/auditoria',
                icon: LayoutDashboard,
              },
              {
                name: 'Registro de Logs',
                href: '/auditoria/logs',
                icon: List,
              },
            ],
          },
        ],
      },
      {
        name: t('common.commercial', 'Gestión Comercial'),
        href: '#',
        icon: ShoppingCart,
        children: [
          { name: t('sales.title', 'Ventas'), href: '/ventas', icon: ShoppingCart },
          { name: t('purchases.title', 'Compras'), href: '/compras', icon: ShoppingBag },
          {
            name: t('common.payments', 'Pagos y Cobros'),
            href: '#',
            icon: DollarSign,
            children: [
              {
                name: t('sales.payments', 'Cobros Ventas'),
                href: '/cobros-ventas',
                icon: CreditCard,
              },
              {
                name: t('purchasePaymentsMvp.title', 'Pagos Compras'),
                href: '/pagos-compras',
                icon: CircleDollarSign,
              },
            ],
          },
          {
            name: t('cashRegister.title', 'Caja'),
            href: '#',
            icon: DollarSign,
            children: [
              {
                name: t('cashRegister.openClose', 'Apertura y Cierre'),
                href: '/caja-registradora',
                icon: DollarSign,
              },
              {
                name: t('cashMovement.title', 'Movimientos Manuales'),
                href: '/movimientos-caja',
                icon: Activity,
              },
            ],
          },
        ],
      },
      {
        name: t('common.inventory_logistics', 'Logística e Inventario'),
        href: '#',
        icon: Package,
        children: [
          { name: t('products.title', 'Productos'), href: '/productos', icon: Package },
          {
            name: t('productAdjustments.title', 'Ajustes de Stock'),
            href: '#',
            icon: SlidersHorizontal,
            children: [
              {
                name: 'Resumen de Ajustes',
                href: '/ajustes-producto',
                icon: SlidersHorizontal,
              },
              {
                name: 'Ajustes de Inventario',
                href: '/ajustes-inventario',
                icon: Package,
              },
              {
                name: 'Ajuste Unitario',
                href: '/ajuste-inventario-unitario',
                icon: SlidersHorizontal,
              },
              {
                name: 'Ajuste Masivo',
                href: '/ajuste-inventario-masivo',
                icon: List,
              },
            ],
          },
        ],
      },
      {
        name: t('common.directory', 'Directorio y Contactos'),
        href: '#',
        icon: Users,
        children: [
          { name: t('clients.title', 'Clientes'), href: '/clientes', icon: Users },
          { name: t('suppliers.title', 'Proveedores'), href: '/proveedores', icon: Truck },
        ],
      },
      {
        name: t('common.services_planning', 'Planificación y Servicios'),
        href: '#',
        icon: Calendar,
        children: [
          {
            name: t('reservations.title', 'Gestión de Agenda'),
            href: '/gestion-agenda',
            icon: Calendar,
          },
        ],
      },
      {
        name: t('common.system_config', 'Configuración y Sistema'),
        href: '#',
        icon: Settings,
        children: [
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
          {
            name: 'Usuarios y Seguridad',
            href: '#',
            icon: Shield,
            children: [
              {
                name: 'Gestión de Usuarios',
                href: '/usuarios',
                icon: Users,
              },
              {
                name: 'Mi Perfil',
                href: '/perfil',
                icon: User,
              },
            ],
          },
          { name: t('settings.title', 'Ajustes Generales'), href: '/configuracion', icon: Settings },
        ],
      },
    ],
    [t]
  )

  const isActive = useCallback((href) => {
    if (!href || href === '#') return false
    if (href === '/dashboard' && location.pathname === '/dashboard') return true
    return location.pathname.startsWith(href) && href !== '/dashboard'
  }, [location.pathname])

  const isParentActive = useCallback((item) => {
    if (!item.children) return isActive(item.href)
    return item.children.some(child => 
      child.children ? isParentActive(child) : isActive(child.href)
    )
  }, [isActive])

  // Auto-expand menus based on current location
  useEffect(() => {
    if (!isLargeScreen || !isClient) return

    const newExpandedMenus = {}
    
    const findAndExpand = (items) => {
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
    setExpandedMenus(prev => ({ ...prev, ...newExpandedMenus }))
  }, [location.pathname, isLargeScreen, isClient, navigation, isActive])

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded)
  }

  const toggleMenu = (name) => {
    setExpandedMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }))
  }

  // Global Search Logic
  const allNavigationItems = useMemo(() => {
    const items = []
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

    // Agregar rutas buscables adicionales que no están en el sidebar
    if (distinctSearchableRoutes && Array.isArray(distinctSearchableRoutes)) {
      distinctSearchableRoutes.forEach(route => {
        // Evitar duplicados si ya están en el menú de navegación
        if (!items.some(item => item.href === route.href)) {
          items.push({
            ...route,
            parent: route.category,
            category: route.category
          })
        }
      })
    }

    return items
  }, [navigation, distinctSearchableRoutes])

  const normalizeText = (text) => {
    if (!text || typeof text !== 'string') return ''
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  }

  useEffect(() => {
    if (!globalSearchTerm.trim()) {
      setGlobalSearchResults([])
      return
    }
    const term = normalizeText(globalSearchTerm)
    const results = allNavigationItems.filter(item => {
      const name = normalizeText(item.name)
      const parent = item.parent ? normalizeText(item.parent) : ''
      return name.includes(term) || parent.includes(term)
    })
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
        setSelectedIndex(prev => prev < globalSearchResults.length - 1 ? prev + 1 : prev)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
      }
      if (event.key === 'Enter' && selectedIndex >= 0) {
        event.preventDefault()
        const selectedItem = globalSearchResults[selectedIndex]
        if (selectedItem) { navigate(selectedItem.href); setShowGlobalSearch(false); setGlobalSearchTerm(''); }
      }
      if (event.key === 'Escape') { setShowGlobalSearch(false); globalSearchInputRef.current?.blur(); }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [matchesShortcut, showGlobalSearch, globalSearchResults, selectedIndex, navigate])

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

  // Detectar tamaño de pantalla
  useEffect(() => {
    setIsClient(true)
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024)
    checkScreenSize(); window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (error) { console.error('Logout error:', error); }
  }

  return (
    <div className='min-h-screen bg-background-light flex'>
      {/* Sidebar Desktop */}
      {isClient && isLargeScreen && (
        <aside
          ref={sidebarRef}
          className={`${isSidebarExpanded ? 'w-72' : 'w-20'} flex-shrink-0 border-r border-border-subtle bg-white flex flex-col sticky top-0 h-screen z-[60] transition-all duration-300 ease-in-out`}
        >
          <div className={`p-6 flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} gap-3`}>
            {isSidebarExpanded ? (
              <>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="size-9 min-w-[36px] bg-primary rounded flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-xl font-bold">architecture</span>
                  </div>
                  <div onClick={() => navigate('/dashboard')} className="cursor-pointer whitespace-nowrap">
                    <h1 className="font-black text-base tracking-tighter uppercase leading-none">ERP System</h1>
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest leading-none mt-1">Fluent ERP v2.0</p>
                  </div>
                </div>
                <button onClick={toggleSidebar} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors" title="Colapsar menú">
                  <SlidersHorizontal className="size-4" />
                </button>
              </>
            ) : (
              <button onClick={toggleSidebar} className="size-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 shadow-sm" title="Expandir menú">
                <Menu className="size-5" />
              </button>
            )}
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-6 overflow-x-hidden">
            {navigation.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus[item.name];
              const active = hasChildren ? isParentActive(item) : isActive(item.href);
              
              if (hasChildren) {
                return (
                  <div key={item.name} className="space-y-1 pt-4 first:pt-0">
                    {isSidebarExpanded && (
                      <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] truncate">
                        {item.name}
                      </div>
                    )}
                    {item.children.map((child) => {
                      const childActive = child.children ? isParentActive(child) : isActive(child.href);
                      const isChildExpanded = expandedMenus[child.name];

                      return (
                        <div key={child.name} className="space-y-1">
                          {child.children ? (
                            <>
                              <button
                                onClick={() => isSidebarExpanded ? toggleMenu(child.name) : toggleSidebar()}
                                className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                                  childActive ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:bg-slate-50'
                                }`}
                                title={!isSidebarExpanded ? child.name : ''}
                              >
                                <div className="flex items-center gap-3">
                                  {child.icon && <child.icon className="size-4 min-w-[16px]" />}
                                  {isSidebarExpanded && <span className="truncate">{child.name}</span>}
                                </div>
                                {isSidebarExpanded && (
                                  <span className={`material-symbols-outlined text-xs transition-transform duration-300 ${isChildExpanded ? 'rotate-180' : ''}`}>
                                    expand_more
                                  </span>
                                )}
                              </button>
                              {isSidebarExpanded && isChildExpanded && (
                                <div className="ml-9 space-y-1 border-l border-slate-100 pl-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                  {child.children.map((grandchild) => (
                                    <Link
                                      key={grandchild.name}
                                      to={grandchild.href}
                                      className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
                                        isActive(grandchild.href) ? 'text-primary font-bold bg-primary/5' : 'text-text-secondary hover:text-text-main hover:bg-slate-50'
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
                              to={child.href}
                              className={`flex items-center ${isSidebarExpanded ? 'justify-start' : 'justify-center'} gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                                childActive ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:bg-slate-50'
                              }`}
                              title={!isSidebarExpanded ? child.name : ''}
                            >
                              {child.icon && <child.icon className="size-4 min-w-[16px]" />}
                              {isSidebarExpanded && <span className="truncate">{child.name}</span>}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center ${isSidebarExpanded ? 'justify-start' : 'justify-center'} gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium mt-1 ${
                    active ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:bg-slate-50'
                  }`}
                  title={!isSidebarExpanded ? item.name : ''}
                >
                  {item.icon && <item.icon className="size-4 min-w-[16px]" />}
                  {isSidebarExpanded && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className={`bg-slate-50 p-3 rounded-xl flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center'} cursor-pointer hover:bg-slate-100 transition-all duration-200 group/profile overflow-hidden`} onClick={() => navigate('/perfil')} title={!isSidebarExpanded ? user?.first_name || 'Perfil' : ''}>
              <div className="size-8 min-w-[32px] rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs overflow-hidden group-hover/profile:ring-2 group-hover/profile:ring-primary/20 transition-all">
                {user?.avatar_url ? <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : (user?.first_name?.charAt(0) || 'U')}
              </div>
              {isSidebarExpanded && (
                <div className="min-w-0 flex-1 animate-in fade-in duration-300">
                  <p className="text-xs font-bold truncate text-text-main">{user?.first_name || 'Usuario'}</p>
                  <p className="text-[10px] text-text-secondary truncate">{user?.email || 'Ver perfil'}</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && !isLargeScreen && (
        <div className="fixed inset-0 z-[70] flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[80vw] bg-white flex flex-col h-full animate-in slide-in-from-left duration-300">
            <button className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600" onClick={() => setSidebarOpen(false)}>
              <X className="size-5" />
            </button>
            <div className="p-6 flex items-center gap-3">
              <div className="size-9 bg-primary rounded flex items-center justify-center text-white"><span className="material-symbols-outlined text-xl font-bold">architecture</span></div>
              <h1 className="font-black text-base tracking-tighter uppercase leading-none">ERP System</h1>
            </div>
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-6 custom-scrollbar">
              {navigation.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedMenus[item.name];
                const active = hasChildren ? isParentActive(item) : isActive(item.href);
                
                if (hasChildren) {
                  return (
                    <div key={item.name} className="space-y-1 pt-4 first:pt-0">
                      <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] truncate">
                        {item.name}
                      </div>
                      {item.children.map((child) => {
                        const childActive = child.children ? isParentActive(child) : isActive(child.href);
                        const isChildExpanded = expandedMenus[child.name];

                        return (
                          <div key={child.name} className="space-y-1">
                            {child.children ? (
                              <>
                                <button
                                  onClick={() => toggleMenu(child.name)}
                                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                                    childActive ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {child.icon && <child.icon className="size-4 min-w-[16px]" />}
                                    <span className="truncate">{child.name}</span>
                                  </div>
                                  <span className={`material-symbols-outlined text-xs transition-transform duration-300 ${isChildExpanded ? 'rotate-180' : ''}`}>
                                    expand_more
                                  </span>
                                </button>
                                {isChildExpanded && (
                                  <div className="ml-9 space-y-1 border-l border-slate-100 pl-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {child.children.map((grandchild) => (
                                      <Link
                                        key={grandchild.name}
                                        to={grandchild.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`block px-3 py-1.5 rounded-md text-xs transition-colors ${
                                          isActive(grandchild.href) ? 'text-primary font-bold bg-primary/5' : 'text-text-secondary hover:text-text-main hover:bg-slate-50'
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
                                to={child.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center justify-start gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                                  childActive ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:bg-slate-50'
                                }`}
                              >
                                {child.icon && <child.icon className="size-4 min-w-[16px]" />}
                                <span className="truncate">{child.name}</span>
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-start gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium mt-1 ${
                      active ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:bg-slate-50'
                    }`}
                  >
                    {item.icon && <item.icon className="size-4 min-w-[16px]" />}
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border-subtle bg-white/80 backdrop-blur-md sticky top-0 z-[40] flex items-center justify-between px-6 md:px-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            {!isLargeScreen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 lg:hidden">
                <Menu className="size-6" />
              </button>
            )}
            <div className="relative flex-1 max-w-md hidden md:block" ref={searchContainerRef}>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-primary transition-colors"><Search className="size-4" /></span>
                <input
                  ref={globalSearchInputRef}
                  type="text"
                  placeholder="Buscar páginas o comandos (Ctrl+K)..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border-none rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all h-9"
                  value={globalSearchTerm}
                  onChange={(e) => { setGlobalSearchTerm(e.target.value); setShowGlobalSearch(true); }}
                  onFocus={() => setShowGlobalSearch(true)}
                />
              </div>
              {showGlobalSearch && globalSearchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-fluent-16 border border-border-subtle overflow-hidden z-[100] max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-2">
                    {globalSearchResults.map((item, index) => {
                      const Icon = item.icon || Search;
                      return (
                        <button key={index} onClick={() => { navigate(item.href); setShowGlobalSearch(false); setGlobalSearchTerm(''); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${index === selectedIndex ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}>
                          <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Icon className="size-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-text-main truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{item.category}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button className="p-2 text-text-secondary hover:bg-slate-100 !rounded-lg transition-colors relative group">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-error rounded-full border-2 border-white"></span>
              </button>
              <div className="relative" ref={profileBtnRef}>
                <button onClick={() => setShowUserMenu(!showUserMenu)} className={`flex items-center gap-2 p-1.5 !rounded-lg transition-all ${showUserMenu ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                  <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                    {user?.avatar_url ? <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined">person</span>}
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg transition-transform duration-200" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                </button>
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-fluent-16 border border-border-subtle overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                      <p className="text-xs font-black text-text-main truncate uppercase tracking-tighter">{user?.first_name || 'Usuario'}</p>
                      <p className="text-[10px] text-text-secondary truncate font-medium">{user?.email || 'No email'}</p>
                    </div>
                    <div className="p-2">
                      <button onClick={() => { navigate('/perfil'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-text-secondary hover:text-primary hover:bg-primary/5 rounded-md transition-colors"><span className="material-symbols-outlined text-lg">account_circle</span>Mi Perfil</button>
                      <div className="my-1 border-t border-slate-50"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-error hover:bg-error/5 rounded-md transition-colors"><span className="material-symbols-outlined text-lg">logout</span>Cerrar Sesión</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background-light p-6 md:p-10 custom-scrollbar">
          <div className="max-w-[1800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout;
