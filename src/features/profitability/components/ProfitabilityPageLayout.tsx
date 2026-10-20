import type { ReactNode } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface ProfitabilityPageLayoutProps {
  title: string
  subtitle: string
  /** Rango real aplicado por el BE (fin inclusivo), ya localizado. */
  range?: string
  actions?: ReactNode
  children: ReactNode
}

/** Shell de las 6 pantallas de Rentabilidad (DESIGN §4/§6.8). */
export const ProfitabilityPageLayout = ({
  title,
  subtitle,
  range,
  actions,
  children,
}: ProfitabilityPageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
      <PageHeader
        title={title}
        subtitle={range ? `${subtitle} · ${range}` : subtitle}
        actions={actions}
      />
      <div className="space-y-xl">{children}</div>
    </div>
  </div>
)

export default ProfitabilityPageLayout
