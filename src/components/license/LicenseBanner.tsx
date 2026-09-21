// ===========================================================================
// LicenseBanner — PLAN_BI_PACK_PREMIUM F4 (ADR-4). Aviso global de vencimiento
// del pack BI: ≤30 días restantes, gracia activa o licencia vencida. Solo
// aplica con enforcement ON (en dev fail-open no hay nada que avisar).
// Se monta en MainLayout, sobre el contenido. Consulta /system/license
// (auth-only) con staleTime de 5 min.
// ===========================================================================

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { licenseService, type LicenseSnapshot } from '@/services/licenseService'

const EXPIRY_WARNING_DAYS = 30

/** Null = no mostrar banner (todo en orden, o nada que avisar). */
function bannerFor(license: LicenseSnapshot): {
  tone: 'warning' | 'danger'
  key: string
  fallback: string
  vars?: Record<string, unknown>
} | null {
  if (!license.enforcing) return null
  switch (license.status) {
    case 'expired':
      return {
        tone: 'danger',
        key: 'licensing.banner.expired',
        fallback:
          'La licencia del pack BI está vencida: el módulo de Inteligencia de Negocios quedó deshabilitado. Contacte a su proveedor para renovar.',
      }
    case 'grace':
      return {
        tone: 'warning',
        key: 'licensing.banner.grace',
        fallback:
          'La licencia del pack BI está vencida; período de gracia activo. Contacte a su proveedor para renovar.',
      }
    case 'active':
      if (license.days_remaining >= 0 && license.days_remaining <= EXPIRY_WARNING_DAYS) {
        return {
          tone: 'warning',
          key: 'licensing.banner.expiring',
          fallback: 'La licencia del pack BI vence en {days} días. Contacte a su proveedor para renovar.',
          vars: { days: license.days_remaining },
        }
      }
      return null
    default:
      return null
  }
}

export default function LicenseBanner() {
  const { t } = useI18n()
  const { data } = useQuery({
    queryKey: ['system-license'],
    queryFn: licenseService.getStatus,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  if (!data) return null
  const banner = bannerFor(data)
  if (!banner) return null

  return (
    <div
      role='status'
      aria-live='polite'
      className={`flex items-start gap-sm border-b px-md py-sm text-body-sm ${
        banner.tone === 'danger'
          ? 'border-semantic-danger bg-semantic-danger/10 text-semantic-danger'
          : 'border-semantic-warning bg-semantic-warning/10 text-semantic-warning'
      }`}
    >
      <AlertTriangle size={16} className='mt-px shrink-0' aria-hidden />
      <span className='text-body-sm-bold'>
        {t(banner.key, banner.fallback, banner.vars)}
      </span>
    </div>
  )
}
