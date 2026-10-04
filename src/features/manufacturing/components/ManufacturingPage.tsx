/**
 * Página Manufactura (PLAN_UNITS_V2 F6.2) — shell con PageHeader + tabs.
 * Reconstrucción completa de la vertical (el panel JSX de 2025 fue eliminado
 * en la migración JS→TS y nunca reemplazado): Insumos / Recetas / Producción,
 * con el design system actual y el patrón UnitSelect+factor probado en F4.
 */

import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SuppliesTab } from './SuppliesTab'
import { RecipesTab } from './RecipesTab'
import { ProductionTab } from './ProductionTab'

export function ManufacturingPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('manufacturing.breadcrumb')}
          title={t('manufacturing.title')}
          subtitle={t('manufacturing.subtitle')}
        />

        <div className="mt-lg">
          <Tabs defaultValue="supplies" className="w-full">
            <TabsList className="mb-lg">
              <TabsTrigger value="supplies" className="">
                {t('manufacturing.tabs.supplies')}
              </TabsTrigger>
              <TabsTrigger value="recipes" className="">
                {t('manufacturing.tabs.recipes')}
              </TabsTrigger>
              <TabsTrigger value="production" className="">
                {t('manufacturing.tabs.production')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="supplies" className="">
              <SuppliesTab />
            </TabsContent>
            <TabsContent value="recipes" className="">
              <RecipesTab />
            </TabsContent>
            <TabsContent value="production" className="">
              <ProductionTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default ManufacturingPage
