import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { BIMetadata } from '@/types/bi'

interface PartialDataBannerProps {
  metadata?: BIMetadata | null
  /** Permite a cada pantalla conservar un testid propio en sus page tests. */
  testId?: string
}

/**
 * T8/BR-4a — aviso de datos parciales.
 *
 * El backend responde `metadata.partial=true` cuando una sub-consulta falló y
 * ensambló una sección vacía/cero. El banner es explícito para que el usuario
 * no confunda un cero parcial con un cero real. Vive en `components/ui` porque
 * lo comparten los grupos BI (un feature no importa componentes de otro).
 */
export const PartialDataBanner = ({
  metadata,
  testId = 'partial-data-banner',
}: PartialDataBannerProps) => {
  const { t } = useI18n()
  if (!metadata?.partial) return null

  return (
    <div
      role="status"
      className="flex items-start gap-sm rounded-md bg-warning/10 p-md text-body-md text-warning"
      data-testid={testId}
    >
      <AlertTriangle size={18} className="mt-xs shrink-0" aria-hidden="true" />
      <p>
        {t(
          'common.partialData.message',
          'Algunas secciones no pudieron calcularse completas. Los valores mostrados pueden estar incompletos.',
        )}
      </p>
    </div>
  )
}

export default PartialDataBanner
