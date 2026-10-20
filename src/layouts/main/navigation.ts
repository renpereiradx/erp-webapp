import {
  Activity,
  ArrowLeftRight,
  Building2,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  Clock as ClockIcon,
  Coins,
  CreditCard,
  DollarSign,
  FileText,
  Factory,
  Gauge,
  List,
  Package,
  PlusCircle,
  Printer,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tags,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import type { NavigationItem, TFn } from './types'

interface PermissionChecks {
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (...permissions: string[]) => boolean
}

/**
 * Árbol de navegación del sidebar. Los textos se resuelven vía i18n; los
 * módulos gated por negocio (ej. reservas) no generan la entrada.
 */
export const buildNavigation = (
  t: TFn,
  reservationsEnabled: boolean,
  _biEnabled: boolean = true,
): NavigationItem[] => [
  // PLAN_REBUILD_BI_UI_FRONTEND F1: el grupo BI completo se eliminó en la
  // ventana de teardown; cada fase F2-F11 re-activa su grupo con su pantalla.
  // El parámetro biEnabled se conserva para la firma que reintroducirá F2.
  // Carve-out ADR-3: los dashboards fiscales SIFEN son Core y siempre tienen
  // entrada propia, con o sin pack BI.
  {
    name: t('nav.sifenFiscalGroup', 'Fiscal (SIFEN)'),
    href: '#',
    icon: Gauge,
    permission: 'sifen:read',
    children: [
      { name: t('nav.sifenFiscalDashboard', 'Dashboard Fiscal SIFEN'), href: '/finance/sifen-ops', icon: Gauge },
      { name: t('nav.sifenNumberingGaps', 'Saltos de numeración SIFEN'), href: '/finance/sifen-inutilizacion', icon: List },
    ],
  },
  {
    name: t('common.commercial', 'Gestión Comercial'),
    href: '#',
    icon: ShoppingCart,
    children: [
      {
        // PLAN_PEDIDOS_MOSTRADOR: carrito del vendedor → cobro en caja.
        name: t('nav.counterorders', 'Pedidos'),
        href: '/pedidos',
        icon: ClipboardList,
        permission: 'counterorders:read',
      },
      {
        // PLAN_CATALOGO_VENDEDOR 3.3: consulta de precios sin datos de costo
        // (la garantía real es server-side, permiso products:cost).
        name: t('nav.catalog', 'Catálogo'),
        href: '/catalogo',
        icon: Store,
        permission: 'products:read',
      },
      {
        name: t('sales.title', 'Ventas'),
        href: '#',
        icon: ShoppingCart,
        permission: 'sales:read',
        children: [
          { name: t('nav.newSale', 'Nueva Venta'), href: '/ventas', icon: PlusCircle },
          { name: t('nav.budgets', 'Presupuestos'), href: '/comercial/presupuestos', icon: FileText, permission: 'budgets:read' },
          // Gate del módulo: con reservas desactivadas la entrada no existe
          // (no solo se oculta) — el route guard redirige igualmente.
          ...(reservationsEnabled
            ? [
                {
                  name: t('nav.agendaReservations', 'Agenda y Reservas'),
                  href: '/gestion-agenda',
                  icon: Calendar,
                  permission: 'reserves:read',
                },
              ]
            : []),
        ],
      },
      {
        name: t('purchases.title', 'Compras'),
        href: '/compras',
        icon: ShoppingBag,
        permission: 'purchases:read',
      },
      {
        name: t('common.payments', 'Pagos y Cobros'),
        href: '#',
        icon: DollarSign,
        // Cobranza = territorio de cajero (cash:write), no payments:read —
        // payments:read es instrumental para el checkout del vendedor.
        permission: 'cash:write',
        children: [
          { name: t('sales.payments', 'Cobros Ventas'), href: '/cobros-ventas', icon: CreditCard },
          { name: t('purchasePaymentsMvp.title', 'Pagos Compras'), href: '/pagos-compras', icon: CircleDollarSign },
        ],
      },
      {
        name: t('cashRegister.title', 'Caja'),
        href: '#',
        icon: DollarSign,
        permission: 'cash:read',
        children: [
          { name: t('cashRegister.openClose', 'Apertura y Cierre'), href: '/caja-registradora', icon: DollarSign },
          { name: t('cashMovement.title', 'Movimientos Manuales'), href: '/movimientos-caja', icon: Activity },
        ],
      },
    ],
  },
  {
    name: t('common.inventory_logistics', 'Logística e Inventario'),
    href: '#',
    icon: Package,
    permission: 'inventory:read',
    children: [
      // PLAN_CATALOGO_VENDEDOR 3.4: la gestión de productos exige write
      // (quien solo consulta precios tiene /catalogo). Ride-along §5.4:
      // los metadatos de catálogo también pasan a write.
      { name: t('products.title', 'Productos'), href: '/productos', icon: Package, permission: 'products:write' },
      {
        name: t('nav.classificationCatalogs', 'Clasificación y Catálogos'),
        icon: Tags,
        permission: 'products:write',
        children: [
          { name: t('nav.categoriesTaxes', 'Categorías e Impuestos'), href: '/configuracion/categorias' },
          { name: t('nav.brands', 'Marcas'), href: '/configuracion/marcas' },
          { name: t('nav.attributesTags', 'Atributos y Etiquetas'), href: '/configuracion/atributos' },
        ],
      },
      { name: t('nav.requisitions', 'Requisiciones'), href: '/logistica/requisiciones', icon: ClipboardList },
      {
        name: t('nav.transfers', 'Transferencias'),
        href: '/transferencias',
        icon: ArrowLeftRight,
        permission: 'transfers:read',
      },
      {
        name: t('manufacturing.nav', 'Manufactura'),
        href: '/manufactura',
        icon: Factory,
        permission: 'manufacturing:read',
      },
      {
        name: t('productAdjustments.title', 'Ajustes de Producto'),
        href: '#',
        icon: SlidersHorizontal,
        children: [
          { name: t('priceAdjustment.title', 'Ajustes de Precios'), href: '/ajustes-precios', icon: TrendingUp },
          { name: t('stockMovements.menu', 'Movimientos de Stock'), href: '/movimientos-stock', icon: List },
        ],
      },
    ],
  },
  {
    name: t('common.directory', 'Directorio de Contactos'),
    href: '/parties',
    icon: Users,
    // anyOf: vendedores con clients:read ven el directorio sin parties:read
    permissions: ['parties:read', 'clients:read', 'suppliers:read'],
  },
  // Sección completa gated por el módulo de reservas del negocio.
  ...(reservationsEnabled
    ? [
        {
          name: t('common.services_planning', 'Planificación y Reservas'),
          href: '#',
          icon: Calendar,
          permission: 'reserves:read',
          children: [
            {
              name: t('reservations.title', 'Gestión de Agenda'),
              href: '/gestion-agenda',
              icon: Calendar,
            },
          ],
        },
      ]
    : []),
  {
    name: t('common.system_config', 'Configuración y Sistema'),
    href: '#',
    icon: Settings,
    // anyOf: si el rol no califica a ningún hijo, la sección completa se
    // oculta (p. ej. VNDR01 perfil vendedor puro no ve Configuración).
    permissions: ['branches:write', 'documents:read', 'tax:write', 'users:read', 'settings:write'],
    children: [
      {
        name: t('branches.title', 'Sucursales'),
        href: '/configuracion/sucursales',
        icon: Building2,
        // La ruta es admin-only (RoleGuard F2VLso); el nav se alinea a
        // branches:write para no mostrar entradas que redirigen.
        permission: 'branches:write',
      },
      {
        name: t('printers.nav', 'Impresoras de tickets'),
        href: '/configuracion/impresoras',
        icon: Printer,
        permission: 'documents:read',
      },
      {
        name: t('common.financeConfig', 'Config. Financiera'),
        href: '#',
        icon: Coins,
        // La config de monedas/métodos/tipos de cambio es de administración:
        // solo roles con tax:write (F2VLso).
        permission: 'tax:write',
        children: [
          { name: t('currencies.title', 'Monedas'), href: '/configuracion/monedas', icon: Coins },
          { name: t('nav.payment_methods', 'Métodos de Pago'), href: '/configuracion/metodos-pago', icon: CreditCard },
          { name: t('exchangeRates.title', 'Tipos de Cambio'), href: '/configuracion/tipos-cambio', icon: SlidersHorizontal },
        ],
      },
      {
        name: t('nav.usersSecurity', 'Usuarios y Seguridad'),
        href: '#',
        icon: Shield,
        permission: 'users:read',
        children: [
          { name: t('nav.usersManagement', 'Gestión de Usuarios'), href: '/configuracion/usuarios', icon: Users },
          { name: t('nav.sessionControl', 'Control de Sesiones'), href: '/configuracion/sesiones', icon: ClockIcon },
          {
            name: t('nav.myProfile', 'Mi Perfil'),
            href: '/configuracion/perfil',
            icon: User,
            permission: undefined, // Mi perfil es accesible por todos
          },
        ],
      },
      {
        name: t('businessPrefs.title', 'Preferencias del negocio'),
        href: '/configuracion/preferencias',
        icon: SlidersHorizontal,
        permission: 'settings:write',
      },
      {
        name: t('settings.title', 'Ajustes Generales'),
        href: '/configuracion',
        icon: Settings,
        // Ajustes de negocio: alineado a settings:write (Preferencias).
        permission: 'settings:write',
      },
    ],
  },
]

/**
 * Filtra el árbol por permisos, inmutable: los padres con gate quedan solo si
 * les queda al menos un hijo; los padres sin gate se mantengan o no tengan hijos.
 */
export const filterNavigationItems = (
  items: NavigationItem[],
  checks: PermissionChecks,
): NavigationItem[] =>
  items.flatMap((item) => {
    if (item.permissions?.length && !checks.hasAnyPermission(...item.permissions)) return []
    if (item.permission && !checks.hasPermission(item.permission)) return []
    if (!item.children) return [item]

    const children = filterNavigationItems(item.children, checks)
    if (children.length === 0 && item.permission) return []
    return [{ ...item, children }]
  })
