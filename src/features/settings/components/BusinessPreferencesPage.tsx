// ===========================================================================
// Business Preferences Page (/configuracion/preferencias) — Preferencias del
// negocio. Toggle de módulos a nivel negocio vía internal/settings (BE).
// Design: DESIGN.md (design/tokens.json) — componentes ui/
// i18n: useI18n() (ES/EN) · Permiso de ruta: settings:write (App.tsx)
// ===========================================================================

import { useI18n } from '@/lib/i18n'
import { Calendar, Settings as SettingsIcon } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { useBusinessPreferences } from '../hooks/useBusinessPreferences'
import type { BusinessSetting } from '@/services/businessSettingsService'

// Componentes legacy en .jsx con props sin tipar: aliases tipados locales.
const SkeletonList = GenericSkeletonList as unknown as React.FC<{ count?: number }>
const LoadErrorState = ErrorState as unknown as React.FC<{
  title: string
  message: string
  onRetry?: () => void
}>
const NoDataState = EmptyState as unknown as React.FC<{
  icon?: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
}>

/**
 * Copy por clave allowlistada. Las claves que el backend agregue y que esta
 * tabla no conozca caen al genérico (título = la clave misma), de modo que la
 * página sigue siendo funcional sin cambios de FE.
 */
const SETTING_UI: Record<
  string,
  { icon: React.ComponentType<{ size?: number; className?: string }>; titleKey: string; titleFallback: string; descKey: string; descFallback: string }
> = {
  'modules.reservations.enabled': {
    icon: Calendar,
    titleKey: 'businessPrefs.reservations.title',
    titleFallback: 'Módulo de reservas',
    descKey: 'businessPrefs.reservations.description',
    descFallback:
      'Activa o desactiva la agenda de reservas para todo el negocio: entradas de menú, paso de Reservas del checkout y dashboards de reservas.',
  },
}

const GENERIC_UI = {
  icon: SettingsIcon,
  titleKey: 'businessPrefs.generic.title',
  titleFallback: 'Preferencia',
  descKey: 'businessPrefs.generic.description',
  descFallback: 'Configuración global de este negocio.',
}

function BooleanSettingCard({
  row,
  saving,
  onSave,
}: {
  row: BusinessSetting
  saving: boolean
  onSave: (key: string, next: boolean) => void
}) {
  const { t } = useI18n()
  const ui = SETTING_UI[row.key] ?? GENERIC_UI
  const Icon = ui.icon
  const enabled = row.value === true

  return (
    <Card className="border-0 bg-surface p-lg shadow-whisper">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-md">
          <div className="flex min-w-0 items-start gap-md">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-on-surface-deep">
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <h3 className="text-title-md text-foreground">
                {t(ui.titleKey, ui.titleFallback)}
              </h3>
              <p className="mt-xs text-body-md text-on-surface-deep">
                {t(ui.descKey, ui.descFallback)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-sm">
            <Badge variant={enabled ? 'success' : 'secondary'}>
              {enabled
                ? t('businessPrefs.badge.enabled', 'Activo')
                : t('businessPrefs.badge.disabled', 'Desactivado')}
            </Badge>
            <Switch
              checked={enabled}
              disabled={saving}
              onCheckedChange={(next) => onSave(row.key, next === true)}
              aria-label={t(ui.titleKey, ui.titleFallback)}
            />
          </div>
        </div>

        <div className="mt-md flex flex-wrap items-center gap-xs border-t border-border-subtle pt-sm text-body-sm text-on-surface-deep">
          <span>{t('businessPrefs.lastUpdated', 'Última actualización')}:</span>
          {row.updated_by ? (
            <span className="text-body-sm-bold text-foreground">{row.updated_by}</span>
          ) : (
            <span>{t('businessPrefs.default', 'valor por defecto del sistema')}</span>
          )}
          <span aria-hidden="true">·</span>
          <span className="font-data-mono text-data-mono">
            {new Date(row.updated_at).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ReadOnlySettingCard({ row }: { row: BusinessSetting }) {
  const { t } = useI18n()
  const ui = SETTING_UI[row.key] ?? GENERIC_UI
  const Icon = ui.icon

  return (
    <Card className="border-0 bg-surface p-lg shadow-whisper">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-md">
          <div className="flex min-w-0 items-start gap-md">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-on-surface-deep">
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <h3 className="text-title-md text-foreground">
                {t(ui.titleKey, ui.titleFallback)}
              </h3>
              <p className="mt-xs font-data-mono text-data-mono text-on-surface-deep">
                {row.key}
              </p>
            </div>
          </div>
          <Badge variant="secondary">{String(row.value)}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BusinessPreferencesPage() {
  const { t } = useI18n()
  const { rows, loading, error, savingKey, reload, saveBoolean } = useBusinessPreferences()

  const booleanRows = rows.filter((r) => typeof r.value === 'boolean')
  const readOnlyRows = rows.filter((r) => typeof r.value !== 'boolean')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('businessPrefs.breadcrumb', 'Configuración')}
          title={t('businessPrefs.title', 'Preferencias del negocio')}
          subtitle={t(
            'businessPrefs.subtitle',
            'Configuración global de módulos y comportamiento del sistema para este negocio.',
          )}
        />

        <section className="mt-lg space-y-md" aria-labelledby="business-prefs-modules">
          <h2 className="text-label-caps uppercase text-on-surface-deep">
            {t('businessPrefs.sections.modules', 'Módulos')}
          </h2>

          {loading && <SkeletonList count={2} />}

          {!loading && error && (
            <LoadErrorState
              title={t('businessPrefs.error.title', 'No se pudo cargar la configuración')}
              message={error}
              onRetry={reload}
            />
          )}

          {!loading && !error && rows.length === 0 && (
            <NoDataState
              icon={SettingsIcon}
              title={t('businessPrefs.empty.title', 'Sin preferencias disponibles')}
              description={t(
                'businessPrefs.empty.description',
                'El servidor no expuso preferencias configurables para este negocio.',
              )}
            />
          )}

          {!loading && !error && booleanRows.length > 0 && (
            <div className="space-y-md">
              {booleanRows.map((row) => (
                <BooleanSettingCard
                  key={row.key}
                  row={row}
                  saving={savingKey === row.key}
                  onSave={saveBoolean}
                />
              ))}
            </div>
          )}

          {!loading && !error && readOnlyRows.length > 0 && (
            <div className="space-y-md">
              {readOnlyRows.map((row) => (
                <ReadOnlySettingCard key={row.key} row={row} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
