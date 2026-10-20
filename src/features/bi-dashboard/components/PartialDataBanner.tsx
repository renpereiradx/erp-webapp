import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { BIMetadata } from '@/types/bi'

/**
 * T8/BR-4a: el backend responde `metadata.partial=true` cuando una
 * sub-consulta falló y ensambló ceros para esa sección. El aviso es explícito
 * para que el usuario no confunda un cero parcial con un cero real.
 */
export const PartialDataBanner = ({ metadata }: { metadata?: BIMetadata }) => {
  const { t } = useI18n()
  if (!metadata?.partial) return null

  return (
    <div
      role="status"
      className="flex items-start gap-sm rounded-md bg-warning/10 p-md text-body-md text-warning"
      data-testid="dashboard-partial-banner"
    >
      <AlertTriangle size={18} className="mt-xs shrink-0" aria-hidden="true" />
      <p>
        {t(
          'dashboard.partial.message',
          'Algunas secciones no pudieron calcularse completas. Los valores mostrados pueden estar incompletos.',
        )}
      </p>
    </div>
  )
}
