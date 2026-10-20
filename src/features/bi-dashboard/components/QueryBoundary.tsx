import type { ReactNode } from 'react'
import ErrorState from '@/components/ui/ErrorState'
import { getErrorMessage } from '../utils'

interface QueryBoundaryProps {
  isLoading: boolean
  error: unknown
  errorTitle: string
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
 */
export const QueryBoundary = ({
  isLoading,
  error,
  errorTitle,
  onRetry,
  skeleton,
  isEmpty = false,
  empty = null,
  children,
}: QueryBoundaryProps) => {
  if (isLoading) return <>{skeleton}</>
  if (error) {
    return <ErrorState title={errorTitle} message={getErrorMessage(error)} onRetry={onRetry} />
  }
  if (isEmpty) return <>{empty}</>
  return <>{children}</>
}
