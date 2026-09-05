// ===========================================================================
// Settings Page (/configuracion) — Ajustes Generales
// Design: DESIGN.md (design/tokens.json) — componentes ui/
// i18n: useI18n() (ES/EN)
// ===========================================================================

import { useI18n } from '@/lib/i18n'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Moon,
  Sun,
  User,
  Users,
  Globe,
  ChevronRight,
  Info,
  Monitor,
  MonitorSmartphone,
  Command,
  Scale,
  ArrowRightLeft,
  Printer,
  SlidersHorizontal,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts'

interface NavRow {
  icon: React.ComponentType<{ size?: number; className?: string }>
  titleKey: string
  titleFallback: string
  descKey: string
  descFallback: string
  href: string
}

interface InfoRow {
  icon: React.ComponentType<{ size?: number; className?: string }>
  titleKey: string
  titleFallback: string
  valueKey: string
  valueFallback: string
}

const accountRows: NavRow[] = [
  {
    icon: User,
    titleKey: 'settings.profile.title',
    titleFallback: 'Mi Perfil',
    descKey: 'settings.profile.desc',
    descFallback: 'Gestiona tu información personal y seguridad',
    href: '/configuracion/perfil',
  },
  {
    icon: Users,
    titleKey: 'settings.users.title',
    titleFallback: 'Gestión de Usuarios',
    descKey: 'settings.users.desc',
    descFallback: 'Administra accesos, roles y permisos del sistema',
    href: '/configuracion/usuarios',
  },
  {
    icon: Monitor,
    titleKey: 'settings.sessions.title',
    titleFallback: 'Control de Sesiones',
    descKey: 'settings.sessions.desc',
    descFallback: 'Monitorea y gestiona sesiones activas en tiempo real',
    href: '/configuracion/sesiones',
  },
]

const systemInfoRows: InfoRow[] = [
  {
    icon: Globe,
    titleKey: 'settings.language.title',
    titleFallback: 'Idioma',
    valueKey: 'settings.language.value',
    valueFallback: 'Español',
  },
  {
    icon: Command,
    titleKey: 'settings.notifications.title',
    titleFallback: 'Notificaciones',
    valueKey: 'settings.notifications.value',
    valueFallback: 'Desactivado',
  },
]

const systemNavRows: NavRow[] = [
  {
    icon: Scale,
    titleKey: 'settings.scales.title',
    titleFallback: 'Balanzas y Etiquetas',
    descKey: 'settings.scales.desc',
    descFallback: 'Configuración de balanzas y impresión de etiquetas',
    href: '/configuracion/balanzas',
  },
  {
    icon: Printer,
    titleKey: 'settings.printers.title',
    titleFallback: 'Impresoras de tickets',
    descKey: 'settings.printers.desc',
    descFallback: 'Impresoras térmicas de recibos por red (58/80 mm)',
    href: '/configuracion/impresoras',
  },
  {
    icon: ArrowRightLeft,
    titleKey: 'settings.conversions.title',
    titleFallback: 'Conversiones de Unidad',
    descKey: 'settings.conversions.desc',
    descFallback: 'Factores de conversión entre unidades de medida',
    href: '/configuracion/conversiones',
  },
]

/** Fila admin (settings:write): toggles de módulos del negocio. */
const businessPrefsRow: NavRow = {
  icon: SlidersHorizontal,
  titleKey: 'businessPrefs.title',
  titleFallback: 'Preferencias del negocio',
  descKey: 'businessPrefs.generic.description',
  descFallback: 'Configuración global de este negocio.',
  href: '/configuracion/preferencias',
}

/** Fila branches:switch (D.3): emparejamiento de terminal con sucursal. */
const terminalRow: NavRow = {
  icon: MonitorSmartphone,
  titleKey: 'settings.terminal.title',
  titleFallback: 'Terminal',
  descKey: 'settings.terminal.desc',
  descFallback: 'Vincula este dispositivo a una sucursal',
  href: '/configuracion/terminal',
}

interface SectionTitleProps {
  labelKey: string
  fallback: string
}

function SectionTitle({ labelKey, fallback }: SectionTitleProps) {
  const { t } = useI18n()
  return (
    <h2 className="text-label-caps uppercase text-on-surface-deep">
      {t(labelKey, fallback)}
    </h2>
  )
}

/**
 * Fila de navegación dentro de una Card (§6.2). Botón real para accesibilidad:
 * foco de teclado gratis, Enter/Espacio funcionan, sin div onClick.
 */
function NavCardRow({ row }: { row: NavRow }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const Icon = row.icon

  return (
    <button
      type="button"
      onClick={() => navigate(row.href)}
      className="group flex w-full items-center gap-md p-md text-left transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-on-surface-deep transition-colors duration-150 group-hover:bg-primary group-hover:text-on-primary">
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-md-bold text-foreground">
          {t(row.titleKey, row.titleFallback)}
        </span>
        <span className="block truncate text-body-sm text-on-surface-deep">
          {t(row.descKey, row.descFallback)}
        </span>
      </span>
      <ChevronRight
        size={18}
        className="shrink-0 text-on-surface-deep transition-colors duration-150 group-hover:text-primary"
      />
    </button>
  )
}

export default function SettingsPage() {
  const { t } = useI18n()
  const { toggleTheme, isDark } = useTheme()
  const { hasPermission } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        {/* Header (patrón del módulo: border-l-4 + text-headline-lg) */}
        <header className="mb-xl flex flex-col gap-1 border-l-4 border-primary pl-4">
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-md font-black uppercase leading-none tracking-tight text-foreground">
            {t('settings.title', 'Configuración')}
          </h1>
          <p className="text-body-md text-muted-foreground">
            {t('settings.subtitle', 'Personaliza tu experiencia y gestiona tu cuenta corporativa.')}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
          {/* Cuenta y Seguridad */}
          <section className="flex flex-col gap-md" aria-labelledby="settings-section-account">
            <div className="flex items-center gap-sm px-xs">
              <SectionTitle labelKey="settings.sections.account" fallback="Cuenta y Seguridad" />
            </div>
            <Card className="border-0 bg-surface p-md shadow-whisper">
              <CardContent className="p-0">
                <div className="divide-y divide-x-0 divide-border-subtle">
                  {accountRows.map((row) => (
                    <NavCardRow key={row.href} row={row} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Personalización */}
          <section className="flex flex-col gap-md" aria-labelledby="settings-section-appearance">
            <div className="flex items-center gap-sm px-xs">
              <SectionTitle labelKey="settings.sections.appearance" fallback="Personalización" />
            </div>
            <Card className="border-0 bg-surface p-lg shadow-whisper">
              <div className="flex flex-col gap-sm">
                <h3 className="text-body-md-bold text-foreground">
                  {t('settings.theme.title', 'Tema Visual')}
                </h3>
                <p className="text-body-sm text-on-surface-deep">
                  {t('settings.theme.description', 'Selecciona el modo de apariencia preferido')}
                </p>
              </div>
              <div
                role="group"
                aria-label={t('settings.theme.title', 'Tema Visual')}
                className="mt-md grid grid-cols-2 gap-sm rounded-input bg-surface-muted p-xs"
              >
                <button
                  type="button"
                  onClick={() => isDark && toggleTheme()}
                  aria-pressed={!isDark}
                  className={`flex items-center justify-center gap-xs rounded-button py-sm text-body-sm-bold transition-colors duration-150 ${
                    !isDark
                      ? 'bg-surface text-foreground shadow-whisper'
                      : 'text-on-surface-deep hover:text-foreground'
                  }`}
                >
                  <Sun size={16} />
                  <span>{t('settings.theme.light', 'Modo Claro')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => !isDark && toggleTheme()}
                  aria-pressed={isDark}
                  className={`flex items-center justify-center gap-xs rounded-button py-sm text-body-sm-bold transition-colors duration-150 ${
                    isDark
                      ? 'bg-surface text-foreground shadow-whisper'
                      : 'text-on-surface-deep hover:text-foreground'
                  }`}
                >
                  <Moon size={16} />
                  <span>{t('settings.theme.dark', 'Modo Oscuro')}</span>
                </button>
              </div>
            </Card>
          </section>

          {/* Sistema */}
          <section className="flex flex-col gap-md" aria-labelledby="settings-section-system">
            <div className="flex items-center gap-sm px-xs">
              <SectionTitle labelKey="settings.sections.system" fallback="Sistema" />
            </div>
            <Card className="border-0 bg-surface p-0 shadow-whisper">
              <CardContent className="p-0">
                <div className="divide-y divide-x-0 divide-border-subtle">
                  {systemInfoRows.map((row) => {
                    const Icon = row.icon
                    return (
                      <div key={row.titleKey} className="flex items-center justify-between gap-md p-md">
                        <div className="flex items-center gap-md">
                          <Icon size={20} className="shrink-0 text-on-surface-deep" />
                          <span className="text-body-md-bold text-foreground">
                            {t(row.titleKey, row.titleFallback)}
                          </span>
                        </div>
                        <Badge variant="secondary">{t(row.valueKey, row.valueFallback)}</Badge>
                      </div>
                    )
                  })}
                  {systemNavRows.map((row) => (
                    <NavCardRow key={row.href} row={row} />
                  ))}
                  {hasPermission('branches:switch') && <NavCardRow row={terminalRow} />}
                  {hasPermission('settings:write') && <NavCardRow row={businessPrefsRow} />}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Accesibilidad / Atajos */}
          <section className="flex flex-col gap-md" aria-labelledby="settings-section-shortcuts">
            <div className="flex items-center gap-sm px-xs">
              <SectionTitle labelKey="settings.sections.shortcuts" fallback="Accesibilidad" />
            </div>
            <div className="overflow-hidden rounded-md bg-surface shadow-whisper">
              <KeyboardShortcuts />
            </div>
          </section>
        </div>

        {/* Footer Info */}
        <footer className="mt-xl flex flex-col items-center gap-xs border-t border-border-subtle pt-lg">
          <div className="flex items-center gap-xs text-on-surface-deep">
            <Info size={14} />
            <span className="text-label-caps uppercase">{t('settings.footer.version', 'ERP Business Intelligence v1.2.0')}</span>
          </div>
          <p className="text-body-sm text-on-surface-deep">
            {t('settings.footer.copyright', '© {year} Corporación Industrial • Paraguay Compliance', {
              year: new Date().getFullYear(),
            })}
          </p>
        </footer>
      </div>
    </div>
  )
}
