import {
  Settings,
  User,
  Shield,
  FileText,
  Clock,
  CalendarCheck,
  TrendingUp,
  PackagePlus,
  ClipboardList,
  History,
  PlusCircle,
  Users,
  Flame,
  AlertTriangle,
  Award,
  PieChart,
  List,
  Package,
  UserCheck,
  LayoutDashboard,
  BarChart3,
  SlidersHorizontal,
  Activity,
  Zap,
  BarChart
} from 'lucide-react'

/**
 * Rutas adicionales que no están en el sidebar pero deben ser buscables
 * Estructura compatible con el sistema de navegación de MainLayout
 */
export const distinctSearchableRoutes = [
  // Cuentas por Cobrar (Receivables) - Detalle y Reportes específicos
  {
    name: 'Lista Maestra de Facturas (Cuentas por Cobrar)',
    href: '/receivables/list',
    icon: List,
    category: 'Finanzas / Cobros'
  },
  {
    name: 'Detalle de Factura e Historial de Pagos',
    href: '/receivables/list',
    icon: History,
    category: 'Finanzas / Cobros'
  },

  // Cuentas por Pagar (Payables)
  {
    name: 'Lista Maestra de Facturas',
    href: '/payables/invoices',
    icon: FileText,
    category: 'Finanzas / Cuentas por Pagar'
  },

  // Reportes y Gestión Fiscal
  {
    name: 'Gestión de IVA, Resumen Fiscal y Formulario 120',
    href: '/finance/tax-management',
    icon: FileText,
    category: 'Finanzas / Impuestos'
  },
  {
    name: 'Libros Legales de Ventas y Compras (Tax Compliance)',
    href: '/finance/legal-books',
    icon: FileText,
    category: 'Finanzas / Impuestos'
  },
  
  // Gestión de Usuarios y Perfil
  {
    name: 'Mi Perfil y Seguridad',
    href: '/perfil',
    icon: Shield,
    category: 'Configuración'
  },
  {
    name: 'Gestión de Usuarios',
    href: '/usuarios',
    icon: Users,
    category: 'Configuración'
  },
  {
    name: 'Configuración General',
    href: '/configuracion',
    icon: Settings,
    category: 'Configuración'
  },

  // Reservas y Horarios
  {
    name: 'Gestión de Agenda y Reservas',
    href: '/gestion-agenda',
    icon: CalendarCheck,
    category: 'Reservas'
  },

  // Inventario y Precios
  {
    name: 'Ajustes de Precios',
    href: '/ajustes-precios',
    icon: TrendingUp,
    category: 'Inventario'
  },
  {
    name: 'Historial de Precios',
    href: '/ajustes-precios/historial',
    icon: History,
    category: 'Inventario'
  },
  {
    name: 'Ajustes de Inventario',
    href: '/ajustes-inventario',
    icon: ClipboardList,
    category: 'Inventario'
  },
  {
    name: 'Ajuste Manual Unitario',
    href: '/ajuste-inventario-unitario',
    icon: PackagePlus,
    category: 'Inventario'
  },
  {
    name: 'Ajuste Masivo de Inventario',
    href: '/ajuste-inventario-masivo',
    icon: ClipboardList,
    category: 'Inventario'
  },

  // Caja y Movimientos
  {
    name: 'Nuevo Movimiento de Caja',
    href: '/movimientos-caja/nuevo',
    icon: PlusCircle,
    category: 'Caja'
  }
]