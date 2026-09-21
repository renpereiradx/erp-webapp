import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Landing post-login (App: /login autenticado y '/').
 * PLAN_PEDIDOS_MOSTRADOR FASE 4: la landing del vendor puro es /pedidos
 * ("vendor puro" = counterorders:read sin sales:write).
 * PLAN_BI_PACK_PREMIUM ADR-6: sin pack BI, el admin también aterriza en
 * /pedidos — ERP Core queda 100% navegable. Fail-open: sin entitlements
 * cargados aún, hasEntitlement('bi') es true (comportamiento actual hasta
 * que /me resuelva).
 */
function HomeRedirect() {
  const { hasPermission, hasEntitlement } = useAuth()
  // PERFIL VENDEDOR v3: sin dashboard:read el usuario no aterriza en el
  // dashboard (su sección de nav está gated por el mismo permiso).
  if (!hasPermission('dashboard:read')) {
    return <Navigate to='/pedidos' replace />
  }
  // Sin pack BI licenciado, el dashboard (superficie BI) no es la landing.
  if (!hasEntitlement('bi')) {
    return <Navigate to='/pedidos' replace />
  }
  if (hasPermission('counterorders:read') && !hasPermission('sales:write')) {
    return <Navigate to='/pedidos' replace />
  }
  return <Navigate to='/dashboard' replace />
}

export default HomeRedirect
