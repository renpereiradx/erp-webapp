import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { useBiPackEnabled } from '@/contexts/AuthContext'

/**
 * Gate de ruta del pack BI (PLAN_BI_PACK_PREMIUM F3): sin entitlement la
 * superficie BI redirige a /pedidos con un aviso, sin romper deep-links.
 * Es el espejo FE del middleware BE RequireModule('bi') — UX only: el
 * enforcement real es server-side (403 MODULE_NOT_LICENSED). La revocación
 * en caliente llega por api:module_not_licensed → refreshEntitlements →
 * este gate re-renderiza y expulsa de la ruta.
 *
 * Fail-open: sin entitlements cargados aún (null), useBiPackEnabled es true
 * y el render no cambia hasta que /me resuelva (igual que los permisos).
 */
const BiModuleRoute = ({ children }: { children: React.ReactNode }) => {
  const { t } = useI18n()
  const biEnabled = useBiPackEnabled()
  const toastShownRef = useRef(false)

  useEffect(() => {
    if (!biEnabled && !toastShownRef.current) {
      toastShownRef.current = true
      import('sonner').then(({ toast }) => {
        toast.error(
          t(
            'licensing.moduleNotLocked',
            'El módulo de Inteligencia de Negocios no está incluido en la licencia de esta instalación',
          ),
        )
      })
    }
  }, [biEnabled, t])

  if (!biEnabled) {
    return <Navigate to='/pedidos' replace />
  }
  return <>{children}</>
}

export default BiModuleRoute
