// ===========================================================================
// License Status Page (/configuracion/licencia) — PLAN_BI_PACK_PREMIUM F4 +
// REQ_BIPACK v2.0 (aud Fix 5): card de estado (edición, módulos, evaluación,
// vencimiento) Y carga de licencia desde la web para quien tiene el permiso
// license:write (GET auth-only para todos; PUT gateado server-side).
// Design: DESIGN.md (design/tokens.json) — componentes ui/
// i18n: useI18n() (ES/EN) · Sin permiso de ruta (auth-only, como el endpoint)
// ===========================================================================

import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, UploadCloud } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import PageHeader from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ErrorState from '@/components/ui/ErrorState'
import { licenseService, type LicenseSnapshot, type LicenseStatus } from '@/services/licenseService'

// Componente legacy en .jsx con props sin tipar: alias tipado local.
const SkeletonList = GenericSkeletonList as unknown as React.FC<{ count?: number }>
const LoadErrorState = ErrorState as unknown as React.FC<{
  title: string
  message: string
  onRetry?: () => void
}>

const STATUS_BADGE_VARIANT: Record<LicenseStatus, 'secondary' | 'destructive'> = {
  active: 'secondary',
  grace: 'destructive',
  expired: 'destructive',
  none: 'secondary',
  invalid: 'destructive',
}

// REQ_BIPACK v2.0: el modo efectivo de la instalación (licenciada / en
// evaluación / vencida con Core activo / bloqueada) tiene su propio badge; el
// status del archivo se muestra igual para diagnóstico.
const MODE_BADGE: Record<string, { label: string; fallback: string; variant: 'secondary' | 'destructive' }> = {
  licensed: { label: 'licensing.card.mode.licensed', fallback: 'Licenciada', variant: 'secondary' },
  trial: { label: 'licensing.card.mode.trial', fallback: 'En evaluación', variant: 'secondary' },
  core: { label: 'licensing.card.mode.core', fallback: 'Licencia vencida (Core activo)', variant: 'destructive' },
  expired: { label: 'licensing.card.mode.expired', fallback: 'Bloqueada', variant: 'destructive' },
}

function statusLabelKey(status: LicenseStatus): string {
  return `licensing.card.status.${status}`
}

type TFn = (k: string, fallback?: string, vars?: Record<string, unknown>) => string

function formatExpiresAt(value: string | null, t: TFn): string {
  if (!value) return t('licensing.card.never', 'No vence (perpetua)')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-md p-md">
      <span className="text-body-md-bold text-foreground">{label}</span>
      <span className="text-body-sm text-on-surface-deep">{children}</span>
    </div>
  )
}

/** Lee el archivo como texto (FileReader: soportado en browser y jsdom). */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('unreadable file'))
    reader.readAsText(file)
  })
}

export default function LicenseStatusPage() {
  // Componente .tsx sobre hook legacy en .js: afirmamos la firma de `t`.
  const { t } = useI18n() as unknown as { t: TFn }
  const { hasPermission, refreshEntitlements } = useAuth()
  const queryClient = useQueryClient()
  const {
    data: license,
    isLoading,
    isError,
    refetch,
  } = useQuery<LicenseSnapshot>({
    queryKey: ['system-license'],
    queryFn: licenseService.getStatus,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const canInstall = hasPermission('license:write')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // permite re-cargar el mismo archivo tras un error
    if (!file) return
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    try {
      const content = await readFileText(file)
      const installed = await licenseService.upload(content)
      // Estado fresco de inmediato + entitlements re-leídos de /me para que
      // la nav del pack BI aparezca/desaparezca en caliente (sin reload).
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['system-license'] }),
        refreshEntitlements(),
      ])
      setUploadSuccess(true)
      import('sonner').then(({ toast }) => {
        toast.success(
          t('licensing.install.success', 'Licencia instalada: {edition}', {
            edition: installed.edition || installed.status,
          }),
        )
      })
    } catch (err) {
      const reason = err instanceof Error && err.message ? err.message : ''
      setUploadError(
        t('licensing.install.error', 'La licencia no pudo instalarse: {reason}', { reason }),
      )
      import('sonner').then(({ toast }) => {
        toast.error(t('licensing.install.error', 'La licencia no pudo instalarse: {reason}', { reason }))
      })
    } finally {
      setUploading(false)
      void refetch()
    }
  }

  return (
    <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
      <PageHeader
        breadcrumb={t('businessPrefs.breadcrumb', 'Configuración')}
        title={t('licensing.card.title', 'Licencia')}
        subtitle={t(
          'licensing.card.description',
          'Edición y módulos contratados para esta instalación.',
        )}
      />

      <section className="mt-lg" aria-labelledby="license-status">
        <h2 id="license-status" className="sr-only">
          {t('licensing.card.title', 'Licencia')}
        </h2>
        <Card className="border-0 bg-surface p-0 shadow-whisper">
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-md">
                <SkeletonList count={4} />
              </div>
            )}
            {isError && (
              <div className="p-md">
                <LoadErrorState
                  title={t('licensing.card.loadError', 'No se pudo cargar el estado de la licencia')}
                  message={t('licensing.card.loadError', 'No se pudo cargar el estado de la licencia')}
                  onRetry={() => void refetch()}
                />
              </div>
            )}
            {license && (
              <div className="divide-y divide-x-0 divide-border-subtle">
                {license.mode && MODE_BADGE[license.mode] && (
                  <Row label={t('licensing.card.mode', 'Estado de la instalación')}>
                    <Badge variant={MODE_BADGE[license.mode].variant}>
                      {t(MODE_BADGE[license.mode].label, MODE_BADGE[license.mode].fallback)}
                    </Badge>
                  </Row>
                )}
                <Row label={t('licensing.card.edition', 'Edición')}>
                  <span className="font-mono">{license.edition || '—'}</span>
                </Row>
                {license.customer && (
                  <Row label={t('licensing.card.customer', 'Cliente')}>{license.customer}</Row>
                )}
                <Row label={t('licensing.card.modules', 'Módulos')}>
                  {license.modules.length > 0 ? (
                    <span className="font-mono">{license.modules.join(', ')}</span>
                  ) : (
                    <span>—</span>
                  )}
                </Row>
                <Row label={t('licensing.card.expires', 'Vence')}>
                  <span className="inline-flex items-center gap-sm">
                    {formatExpiresAt(license.expires_at, t)}
                    <Badge variant={STATUS_BADGE_VARIANT[license.status]}>
                      {t(statusLabelKey(license.status), license.status)}
                    </Badge>
                  </span>
                </Row>
                {license.mode === 'trial' && license.trial_ends_at && (
                  <Row label={t('licensing.card.trialEnds', 'Fin de la evaluación')}>
                    <span className="inline-flex items-center gap-sm">
                      {formatExpiresAt(license.trial_ends_at, t)}
                      <Badge variant={license.days_remaining <= 30 ? 'destructive' : 'secondary'}>
                        {t('licensing.card.daysRemaining', 'Quedan {days} días', {
                          days: license.days_remaining,
                        })}
                      </Badge>
                    </span>
                  </Row>
                )}
                {license.enforcing && license.mode === 'licensed' && license.status === 'active' && license.days_remaining >= 0 && (
                  <Row
                    label={t('licensing.card.daysRemaining', 'Quedan {days} días', {
                      days: license.days_remaining,
                    })}
                  >
                    <KeyRound size={16} className="text-on-surface-deep" aria-hidden />
                  </Row>
                )}
                <Row
                  label={
                    license.enforcing
                      ? t('licensing.card.enforced', 'Control de licencia activo')
                      : t(
                          'licensing.card.notEnforced',
                          'Control de licencia desactivado (desarrollo): todos los módulos disponibles.',
                        )
                  }
                >
                  <Badge variant='secondary'>{license.enforcing ? 'ON' : 'OFF'}</Badge>
                </Row>

                {canInstall && (
                  <div className="flex flex-col gap-sm p-md">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="sr-only"
                      onChange={(e) => void handleFileSelected(e)}
                      aria-label={t('licensing.install.button', 'Instalar licencia…')}
                    />
                    <div className="flex items-center gap-sm">
                      <Button
                        variant="secondary"
                        loading={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadCloud size={16} aria-hidden />
                        {uploading
                          ? t('licensing.install.uploading', 'Verificando licencia…')
                          : t('licensing.install.button', 'Instalar licencia…')}
                      </Button>
                      {uploadSuccess && (
                        <p role="status" className="text-body-sm text-on-surface-deep">
                          {t('licensing.install.installed', 'Licencia activa.')}
                        </p>
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-deep">
                      {t(
                        'licensing.install.hint',
                        'Seleccione el archivo license.json entregado por su proveedor: la instalación aplica al momento.',
                      )}
                    </p>
                    {uploadError && (
                      <p role="alert" className="text-body-md text-error">
                        {uploadError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
