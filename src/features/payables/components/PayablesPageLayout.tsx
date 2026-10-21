import type { ReactNode } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface PayablesPageLayoutProps {
  title: string
  subtitle: string
  /** Rango/ventana real aplicada por el BE (ya localizada). */
  range?: string
  actions?: ReactNode
  children: ReactNode
}

/** Shell de las 6 pantallas de Cuentas por Pagar (DESIGN §4/§6.8). */
export const PayablesPageLayout = ({
  title,
  subtitle,
  range,
  actions,
  children,
}: PayablesPageLayoutProps) => (
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

export default PayablesPageLayout
