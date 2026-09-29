// ===========================================================================
// LicenseRequiredGate — REQ_BIPACK v2.0. Pantalla full-screen que reemplaza
// TODA la app cuando la instalación está bloqueada: el período de evaluación
// (90 días desde el primer arranque) terminó y no hay licencia válida. El
// backend solo responde login/logout/refresh y /system/license (ver + PUT),
// así que esta pantalla ofrece exactamente eso: estado + carga de licencia.
//
// Se monta FUERA de <Router> y <QueryClientProvider> (early-return en App):
// sin hooks de router ni react-query — fetch manual + window.location para
// navegación. El upload envía el archivo textual tal cual lo entregó el
// vendedor; la verificación de firma es server-side (PUT /api/v1/system/
// license, permiso license:write — aud Fix 2). Al instalar una licencia
// válida el sistema se desbloquea en caliente y un reload reinicia la app
// limpia; un sondeo de 30s también desmonta el gate si el rescate llegó por
// otra vía (aud Fix 8).
//
// Design: DESIGN.md (glass-acrylic de gate, rounded-xl, shadow-fluent-16) ·
// i18n: useI18n() (ES/EN) · Sin strings hardcoded.
// ===========================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { KeyRound, RefreshCw, ShieldAlert, UploadCloud } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { licenseService, type LicenseSnapshot } from '@/services/licenseService'
import { ApiError } from '@/utils/ApiError'

type TFn = (k: string, fallback?: string, vars?: Record<string, unknown>) => string

/** Lee el archivo como texto (FileReader: soportado en browser y jsdom). */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('unreadable file'))
    reader.readAsText(file)
  })
}

export interface LicenseRequiredGateProps {
  /**
   * Acción posterior a una instalación de licencia exitosa. Default:
   * reload completo (reinicio limpio de caches/entitlements). Los tests
   * inyectan un spy para no depender de window.location.
   */
  onInstalled?: () => void
  /**
   * Se dispara cuando un refresco descubre que la instalación ya NO está
   * bloqueada (la licencia se instaló por otra vía: otra pestaña, el
   * proveedor, o el botón de actualizar). aud Fix 8: sin esto, la pestaña
   * quedaba clavada en el gate hasta un F5 manual.
   */
  onRecovered?: () => void
}

const RECOVERY_POLL_MS = 30_000

function formatDate(value: string | null, t: TFn): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  // timeZone UTC explícito: el trial_ends_at viene del backend en UTC y el
  // claim "(UTC)" del label debe ser cierto (aud Fix 8).
  return t(
    'licensing.gate.dateLabel',
    '{date} (UTC)',
    { date: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) },
  )
}

export default function LicenseRequiredGate({ onInstalled, onRecovered }: LicenseRequiredGateProps) {
  const { t } = useI18n() as unknown as { t: TFn }
  const [snapshot, setSnapshot] = useState<LicenseSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recoveredRef = useRef(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const status = await licenseService.getStatus()
      setSnapshot(status)
      setUnauthorized(false)
      // aud Fix 8: alguien rescató la instalación por otra vía — desmontar
      // el gate en lugar de esperar un reload manual.
      if (!status.blocked && status.mode !== 'expired' && !recoveredRef.current) {
        recoveredRef.current = true
        onRecovered?.()
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUnauthorized(true)
      } else {
        setLoadError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [onRecovered])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // aud Fix 8: sondeo liviano — la instalación puede desbloquearse afuera
  // (otra pestaña, el proveedor por teléfono con el propio gate).
  useEffect(() => {
    const timer = window.setInterval(() => {
      void licenseService
        .getStatus()
        .then((status) => {
          if (!status.blocked && status.mode !== 'expired' && !recoveredRef.current) {
            recoveredRef.current = true
            onRecovered?.()
          }
        })
        .catch(() => {})
    }, RECOVERY_POLL_MS)
    return () => window.clearInterval(timer)
  }, [onRecovered])

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = '' // permite re-cargar el mismo archivo tras un error
      if (!file) return
      setUploading(true)
      setUploadError(null)
      try {
        const content = await readFileText(file)
        const installed = await licenseService.upload(content)
        setSnapshot(installed)
        // La licencia válida desbloquea en caliente: reinicio limpio de toda
        // la app (caches de queries, entitlements, sucursal activa).
        if (onInstalled) {
          onInstalled()
        } else {
          window.location.reload()
        }
      } catch (err) {
        const reason =
          err instanceof ApiError && err.message
            ? err.message
            : t('licensing.gate.invalidReason', 'archivo no válido')
        setUploadError(
          t('licensing.gate.invalid', 'La licencia no pudo instalarse: {reason}', { reason }),
        )
      } finally {
        setUploading(false)
      }
    },
    [t, onInstalled],
  )

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <main
        aria-labelledby='license-gate-title'
        className='glass-acrylic rounded-xl shadow-fluent-16 w-full max-w-lg p-lg animate-in fade-in'
      >
        <div className='flex flex-col items-center text-center gap-sm'>
          <div
            className='flex h-16 w-16 items-center justify-center rounded-full bg-error-container text-on-error-container'
            aria-hidden
          >
            <KeyRound size={28} />
          </div>
          <h1 id='license-gate-title' className='text-headline-lg text-foreground'>
            {t('licensing.gate.title', 'Licencia requerida')}
          </h1>
          <p className='text-body-md text-on-surface-deep max-w-md'>
            {t(
              'licensing.gate.description',
              'El período de evaluación de esta instalación finalizó y no hay licencia activa. Cargue el archivo de licencia entregado por su proveedor para volver a usar el sistema.',
            )}
          </p>
        </div>

        {loading && (
          <div className='mt-lg flex items-center justify-center gap-sm text-body-md text-on-surface-deep'>
            <RefreshCw size={16} className='animate-spin' aria-hidden />
            {t('licensing.gate.loading', 'Consultando estado de la licencia…')}
          </div>
        )}

        {!loading && unauthorized && (
          <div className='mt-lg flex flex-col items-center gap-md'>
            <p className='text-body-md text-on-surface-deep'>
              {t('licensing.gate.needLogin', 'Inicie sesión para cargar la licencia de la instalación.')}
            </p>
            <a
              href='/login'
              className='inline-flex h-10 items-center rounded-button bg-primary px-lg text-body-md-bold text-on-primary hover:bg-primary-container transition-colors duration-150'
            >
              {t('licensing.gate.login', 'Iniciar sesión')}
            </a>
          </div>
        )}

        {!loading && loadError && !unauthorized && (
          <div className='mt-lg flex flex-col items-center gap-md'>
            <p className='text-body-md text-on-surface-deep'>
              {t('licensing.gate.statusError', 'No se pudo consultar el estado de la licencia.')}
            </p>
            <Button variant='secondary' onClick={() => void refresh()}>
              {t('licensing.gate.retry', 'Actualizar estado')}
            </Button>
          </div>
        )}

        {!loading && snapshot && !unauthorized && (
          <section className='mt-lg' aria-label={t('licensing.gate.statusTitle', 'Estado de la licencia')}>
            <div className='bg-surface rounded-md shadow-whisper border border-border-subtle divide-y divide-border-subtle'>
              <div className='flex items-center justify-between gap-md p-md'>
                <span className='text-body-md-bold text-foreground'>
                  {t('licensing.gate.statusTitle', 'Estado de la licencia')}
                </span>
                {/* aud Fix 8: el badge refleja el snapshot, no un estado fijo —
                    entre el rescate y el desmontaje del gate dice la verdad. */}
                {snapshot.blocked ? (
                  <Badge variant='destructive'>
                    <ShieldAlert size={12} className='mr-1' aria-hidden />
                    {t('licensing.gate.blocked', 'Sistema bloqueado')}
                  </Badge>
                ) : (
                  <Badge variant='secondary'>
                    <KeyRound size={12} className='mr-1' aria-hidden />
                    {t('licensing.gate.unblocked', 'Sistema activo')}
                  </Badge>
                )}
              </div>
              {snapshot.trial_ends_at && (
                <div className='flex items-center justify-between gap-md p-md'>
                  <span className='text-body-md text-foreground'>
                    {t('licensing.gate.trialEnded', 'Evaluación finalizada')}
                  </span>
                  <span className='text-body-sm text-on-surface-deep'>
                    {formatDate(snapshot.trial_ends_at, t)}
                  </span>
                </div>
              )}
              {snapshot.customer && (
                <div className='flex items-center justify-between gap-md p-md'>
                  <span className='text-body-md text-foreground'>
                    {t('licensing.card.customer', 'Cliente')}
                  </span>
                  <span className='text-body-sm text-on-surface-deep'>{snapshot.customer}</span>
                </div>
              )}
              {/* aud Fix 8: refresco manual visible también con estado sano —
                  si la licencia llegó por otra vía, esto desmonta el gate. */}
              <div className='flex justify-end p-sm'>
                <Button variant='ghost' size='sm' onClick={() => void refresh()}>
                  <RefreshCw size={14} aria-hidden />
                  {t('licensing.gate.retry', 'Actualizar estado')}
                </Button>
              </div>
            </div>

            <div className='mt-lg flex flex-col items-center gap-sm'>
              <input
                ref={fileInputRef}
                type='file'
                accept='.json,application/json'
                className='sr-only'
                onChange={(e) => void handleFileSelected(e)}
                aria-label={t('licensing.gate.upload', 'Cargar licencia')}
              />
              <Button
                variant='primary'
                size='lg'
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={16} aria-hidden />
                {uploading
                  ? t('licensing.gate.uploading', 'Verificando licencia…')
                  : t('licensing.gate.upload', 'Cargar licencia')}
              </Button>
              <p className='text-body-sm text-on-surface-deep'>
                {t(
                  'licensing.gate.uploadHint',
                  'Seleccione el archivo license.json firmado por su proveedor.',
                )}
              </p>
              {uploadError && (
                <p role='alert' className='text-body-md text-error'>
                  {uploadError}
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
