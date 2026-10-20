import { Navigate } from 'react-router-dom'

/**
 * Landing post-login (App: /login autenticado y '/').
 * PLAN_REBUILD_BI_UI_FRONTEND F1: durante la ventana sin pantallas BI la
 * landing es /pedidos para todos los perfiles. F2 re-activa /dashboard y
 * restaura la regla de entitlement del pack BI (ADR-6).
 */
function HomeRedirect() {
  return <Navigate to='/pedidos' replace />
}

export default HomeRedirect
