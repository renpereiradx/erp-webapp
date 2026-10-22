import type { ReactNode } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface PurchasePageLayoutProps {
  title: string
  /** Opcional (regla DESIGN §8: cero subtítulo decorativo — solo si informa). */
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

/**
 * Shell de las pantallas de Analítica de Compras: fondo, contenedor y
 * `PageHeader` (DESIGN §4/§6.8). La página solo aporta contenido.
 */
export const PurchasePageLayout = ({ title, subtitle, actions, children }: PurchasePageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="space-y-xl">{children}</div>
    </div>
  </div>
)

export default PurchasePageLayout
