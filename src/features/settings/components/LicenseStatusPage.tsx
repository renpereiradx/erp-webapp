// ===========================================================================
// License Status Page (/configuracion/licencia) — PLAN_BI_PACK_PREMIUM F4.
// Card de solo lectura: edición, módulos contratados y vencimiento de la
// licencia de la instalación (GET /api/v1/system/license, auth-only).
// Design: DESIGN.md (design/tokens.json) — componentes ui/
// i18n: useI18n() (ES/EN) · Sin permiso de ruta (auth-only, como el endpoint)
// ===========================================================================

import { useQuery } from '@tanstack/react-query'
import { KeyRound } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/badge'
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

export default function LicenseStatusPage() {
  // Componente .tsx sobre hook legacy en .js: afirmamos la firma de `t`.
  const { t } = useI18n() as unknown as { t: TFn }
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
                {license.enforcing && license.status === 'active' && license.days_remaining >= 0 && (
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
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
