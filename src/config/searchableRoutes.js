import {
  List,
  Settings,
  Shield,
  CalendarCheck,
  TrendingUp,
  ClipboardList,
  History,
  PlusCircle,
  Users,
} from 'lucide-react'

/**
 * Rutas adicionales que no están en el sidebar pero deben ser buscables
 * Estructura compatible con el sistema de navegación de MainLayout
 */
export const distinctSearchableRoutes = [
  // Cuentas por Cobrar (F7): la lista maestra también se ofrece en el buscador
  // global. requiredModule evita una ruta que expulsa sin pack; el permiso es
  // el de la cadena BE (receivables:read).
  {
    name: 'Lista de cuentas por cobrar',
    href: '/receivables/list',
    icon: List,
    category: 'Finanzas / Cobros',
    requiredModule: 'bi',
    requiredPermission: 'receivables:read'
  },

  // Cuentas por Pagar (F8): mismo criterio que CxC — sin pack o sin
  // payables:read la entrada no se ofrece (la ruta expulsaría).
  {
    name: 'Facturas por pagar',
    href: '/payables/invoices',
    icon: List,
    category: 'Finanzas / Pagos',
    requiredModule: 'bi',
    requiredPermission: 'payables:read'
  },

  // Reportes Financieros (F9): dos rutas del grupo que no están en el primer
  // nivel del sidebar. Mismo gate que la cadena BE (reports:read).
  {
    name: 'Gestión de IVA',
    href: '/finance/tax-management',
    icon: List,
    category: 'Finanzas / Impuestos',
    requiredModule: 'bi',
    requiredPermission: 'reports:read'
  },
  {
    name: 'Libros legales',
    href: '/finance/legal-books',
    icon: List,
    category: 'Finanzas / Libros',
    requiredModule: 'bi',
    requiredPermission: 'reports:read'
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
  // requiredModule: con el módulo desactivado (business settings) el palette
  // no debe ofrecer una ruta que redirige con toast (route guard).
  {
    name: 'Gestión de Agenda y Reservas',
    href: '/gestion-agenda',
    icon: CalendarCheck,
    category: 'Reservas',
    requiredModule: 'reservations'
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
    name: 'Movimientos de Stock',
    href: '/movimientos-stock',
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