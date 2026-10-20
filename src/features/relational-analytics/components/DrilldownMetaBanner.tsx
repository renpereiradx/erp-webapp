import { Info } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface DrilldownMetaBannerProps {
  /** #4: compras en otra moneda excluidas del ranking (meta D3 del BE) */
  excludedOtherCurrency: number
}

/**
 * Aviso de alcance del ranking de proveedores: el BE excluye las compras en
 * moneda distinta a la base. Sin exclusiones no se renderiza nada; el dato
 * sale del payload, no de una suposición.
 */
export const DrilldownMetaBanner = ({ excludedOtherCurrency }: DrilldownMetaBannerProps) => {
  const { t } = useI18n()
  if (excludedOtherCurrency <= 0) return null

  return (
    <div
      role="status"
      data-testid="excluded-other-currency-banner"
      className="flex items-start gap-sm rounded-md bg-surface-muted px-md py-sm text-on-surface-deep"
    >
      <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="text-body-sm">
        {t(
          'relationalAnalytics.excludedBanner',
          '{count} compras en otra moneda quedan fuera del ranking (solo se compara la moneda base).',
          { count: excludedOtherCurrency },
        )}
      </p>
    </div>
  )
}

export default DrilldownMetaBanner
