import type { ReactNode } from 'react'
import ErrorState from '@/components/ui/ErrorState'

interface QueryBoundaryProps {
  isLoading: boolean
  error: unknown
  errorTitle: string
  /** Mensaje localizado opcional; por defecto se usa el del error crudo. */
  errorMessage?: string
  onRetry?: () => void
  skeleton: ReactNode
  isEmpty?: boolean
  empty?: ReactNode
  children: ReactNode
}

/**
 * Estados de datos de una sección (DESIGN §6.7): loading → skeleton con la
 * forma final, error → `ErrorState` con retry, empty → estado explícito.
 * Nunca ceros silenciosos: si la query falla, se ve el error.
 *
 * Vive en `components/ui` porque lo comparten features BI distintas
 * (F2 Dashboard y F3 drill-downs): un feature no importa de otro.
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Error al cargar los datos'
}

export const QueryBoundary = ({
  isLoading,
  error,
  errorTitle,
  errorMessage,
  onRetry,
  skeleton,
  isEmpty = false,
  empty = null,
  children,
}: QueryBoundaryProps) => {
  if (isLoading) return <>{skeleton}</>
  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        message={errorMessage ?? getErrorMessage(error)}
        onRetry={onRetry}
      />
    )
  }
  if (isEmpty) return <>{empty}</>
  return <>{children}</>
}

export default QueryBoundary
