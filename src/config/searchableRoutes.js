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
  Users
} from 'lucide-react'

/**
 * Rutas adicionales que no están en el sidebar pero deben ser buscables
 * Estructura compatible con el sistema de navegación de MainLayout
 */
export const distinctSearchableRoutes = [
  // Dashboard & KPIs
  {
    name: 'KPIs Detallados',
    href: '/dashboard/kpis',
    icon: TrendingUp,
    category: 'Dashboard'
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
    name: 'Gestión de Reservas',
    href: '/reservas',
    icon: CalendarCheck,
    category: 'Reservas'
  },
  {
    name: 'Configuración de Horarios',
    href: '/horarios',
    icon: Clock,
    category: 'Reservas'
  },
  {
    name: 'Disponibilidad de Horarios',
    href: '/horarios-disponibles',
    icon: Clock,
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
