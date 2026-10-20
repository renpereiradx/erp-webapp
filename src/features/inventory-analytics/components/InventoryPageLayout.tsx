import type { ReactNode } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface InventoryPageLayoutProps {
  title: string
  subtitle: string
  actions?: ReactNode
  children: ReactNode
}

/** Shell de las 4 pantallas de Analítica de Inventario (DESIGN §4/§6.8). */
export const InventoryPageLayout = ({
  title,
  subtitle,
  actions,
  children,
}: InventoryPageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="space-y-xl">{children}</div>
    </div>
  </div>
)

export default InventoryPageLayout
