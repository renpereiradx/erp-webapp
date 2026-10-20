import type { ReactNode } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface SalesPageLayoutProps {
  title: string
  subtitle: string
  actions?: ReactNode
  children: ReactNode
}

/**
 * Shell de las 6 pantallas de Analítica de Ventas: fondo, contenedor y
 * `PageHeader` (DESIGN §4/§6.8). La página solo aporta contenido.
 */
export const SalesPageLayout = ({ title, subtitle, actions, children }: SalesPageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="space-y-xl">{children}</div>
    </div>
  </div>
)

export default SalesPageLayout
