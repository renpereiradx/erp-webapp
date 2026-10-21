import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth, useBiPackEnabled } from '@/contexts/AuthContext'

interface BiDrilldownButtonProps {
  /** ruta del drill-down (con la entidad por query param) */
  to: string
  label: string
  icon?: LucideIcon
  /** cierra el modal de origen antes de navegar */
  onBeforeNavigate?: () => void
  className?: string
  testId?: string
  /**
   * Permiso que exige la ruta destino. Default `analytics:read` (drill-downs
   * de F3); la ficha de crédito de CxC usa `receivables:read`.
   */
  permission?: string
}

/**
 * Acceso a un drill-down BI desde una ficha Core (producto/cliente/proveedor).
 *
 * Se oculta cuando la instalación no tiene el pack o el usuario no tiene el
 * permiso de la ruta (`analytics:read` por defecto, `receivables:read` para la
 * ficha de crédito): la ruta destino lo expulsaría igual (BiModuleRoute), pero
 * un botón que termina en redirect es una affordance muerta (§5.9).
 */
export const BiDrilldownButton = ({
  to,
  label,
  icon: Icon,
  onBeforeNavigate,
  className,
  testId,
  permission = 'analytics:read',
}: BiDrilldownButtonProps) => {
  const biEnabled = useBiPackEnabled()
  const { hasPermission } = useAuth()
  const navigate = useNavigate()

  if (!biEnabled || !hasPermission(permission)) return null

  return (
    <Button
      variant="secondary"
      type="button"
      className={className}
      data-testid={testId}
      onClick={() => {
        onBeforeNavigate?.()
        navigate(to)
      }}
    >
      {Icon ? <Icon className="mr-xs size-4" aria-hidden="true" /> : null}
      {label}
    </Button>
  )
}

export default BiDrilldownButton
