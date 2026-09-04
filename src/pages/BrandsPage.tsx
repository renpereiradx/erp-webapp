import { Image, Plus, Search } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/ui/EmptyState'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ErrorState from '@/components/ui/ErrorState'
import WorkspaceLayout from '@/components/layout/WorkspaceLayout'

import { BrandDetailForm, BrandList, useBrands } from '@/features/brands'

/**
 * Brands Page — Gestión de Marcas.
 * Workspace maestro-detalle (conductor/PLAN_CATALOG_WORKSPACE_LAYOUT_FRONTEND.md):
 * búsqueda y conteo en la toolbar, listado a la izquierda, ficha sticky a la derecha.
 * El detalle SIEMPRE está presente (placeholder con CTA) para evitar saltos de layout.
 */
export const BrandsPage: React.FC = () => {
  const { t } = useI18n()
  const {
    brands,
    totalBrands,
    selectedBrandId,
    selectedBrand,
    searchQuery,
    setSearchQuery,
    handleSelectBrand,
    handleCreateNew,
    handleSaveBrand,
    handleDeleteBrand,
    handleCloseDetail,
    loading,
    error,
    refetch,
  } = useBrands()

  const brandForForm = selectedBrandId === 'new' ? { id: 'new' as const } : selectedBrand

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('nav.brands')}
          title={t('brands.title')}
          subtitle={t('brands.subtitle')}
          actions={
            <Button variant="primary" onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-xs" />
              {t('brands.action.new')}
            </Button>
          }
        />

        {error ? (
          <section className="mt-lg">
            <ErrorState title={t('errors.load_title')} message={error} onRetry={refetch} />
          </section>
        ) : loading && totalBrands === 0 ? (
          <section className="mt-lg">
            <GenericSkeletonList count={5} data-testid="page-loading" />
          </section>
        ) : (
          <section className="mt-lg">
            <WorkspaceLayout
              testId="brands-workspace"
              sticky="detail"
              masterClassName="lg:col-span-7"
              detailClassName="lg:col-span-5"
              toolbar={
                <>
                  <Badge variant="secondary">{t('brands.count', { count: brands.length })}</Badge>
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep pointer-events-none" />
                    <Input
                      className="pl-10 bg-surface border-border-subtle"
                      placeholder={t('brands.search.placeholder')}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label={t('brands.search.placeholder')}
                    />
                  </div>
                </>
              }
              master={
                <BrandList
                  brands={brands}
                  selectedBrandId={selectedBrandId}
                  onSelectBrand={handleSelectBrand}
                />
              }
              detail={
                brandForForm ? (
                  <BrandDetailForm
                    brand={brandForForm}
                    onSave={handleSaveBrand}
                    onCancel={handleCloseDetail}
                    onDelete={handleDeleteBrand}
                  />
                ) : (
                  <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
                    <EmptyState
                      icon={Image}
                      title={t('brands.placeholder_title')}
                      description={t('brands.placeholder_description')}
                      actionLabel={t('brands.action.new')}
                      onAction={handleCreateNew}
                    />
                  </div>
                )
              }
            />
          </section>
        )}
      </div>
    </div>
  )
}

export default BrandsPage
