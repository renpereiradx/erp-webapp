import {
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