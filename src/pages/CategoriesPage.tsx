import { FolderTree, Plus, Search } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/ui/EmptyState'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ErrorState from '@/components/ui/ErrorState'
import WorkspaceLayout from '@/components/layout/WorkspaceLayout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
  CategoryDetailForm,
  CategoryTree,
  TaxRatesPanel,
  useCategoryManagement,
} from '@/features/categories'

/**
 * Categories Page — Categorías e Impuestos.
 * Workspace maestro-detalle (conductor/PLAN_CATALOG_WORKSPACE_LAYOUT_FRONTEND.md):
 * árbol sticky a la izquierda; a la derecha, un único estado de bienvenida cuando
 * no hay selección (antes se mostraban dos empty states) o formulario + panel fiscal.
 */
export default function CategoriesPage() {
  const { t } = useI18n()
  const {
    categories,
    filteredCategories,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    isDrawerOpen,
    isDeleteDialogOpen,
    isMutating,
    isDeleting,
    openCreate,
    openEdit,
    openDelete,
    closeDrawer,
    closeDeleteDialog,
    handleSave,
    confirmDelete,
    refetch,
  } = useCategoryManagement()

  const handleConfirmDelete = async () => {
    const deleted = await confirmDelete()
    // Si se borró la categoría editada, el formulario vuelve al estado vacío.
    if (deleted) closeDrawer()
  }

  const hasSelection = !!selectedCategory || isDrawerOpen

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('nav.categoriesTaxes')}
          title={t('categories.page.title')}
          subtitle={t('categories.page.subtitle')}
          actions={
            <Button variant="primary" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-xs" />
              {t('categories.management.new')}
            </Button>
          }
        />

        {error ? (
          <section className="mt-lg">
            <ErrorState title={t('errors.load_title')} message={error} onRetry={refetch} />
          </section>
        ) : loading && categories.length === 0 ? (
          <section className="mt-lg">
            <GenericSkeletonList count={5} data-testid="page-loading" />
          </section>
        ) : (
          <section className="mt-lg">
            <WorkspaceLayout
              testId="categories-workspace"
              sticky="master"
              masterClassName="lg:col-span-5"
              detailClassName="lg:col-span-7"
              toolbar={
                <>
                  <Badge variant="secondary">
                    {t('categories.count', { count: filteredCategories.length })}
                  </Badge>
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep pointer-events-none" />
                    <Input
                      className="pl-10 bg-surface border-border-subtle"
                      placeholder={t('categories.search.placeholder')}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label={t('categories.search.placeholder')}
                    />
                  </div>
                </>
              }
              master={
                <CategoryTree
                  categories={filteredCategories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={openEdit}
                  onAddCategory={openCreate}
                />
              }
              detail={
                !hasSelection ? (
                  <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
                    <EmptyState
                      icon={FolderTree}
                      title={t('categories.welcome_title')}
                      description={t('categories.welcome_description')}
                      actionLabel={t('categories.management.new')}
                      onAction={openCreate}
                    />
                  </div>
                ) : (
                  <>
                    <CategoryDetailForm
                      selectedCategory={selectedCategory}
                      categories={categories}
                      handleSave={handleSave}
                      onRequestDelete={openDelete}
                      isMutating={isMutating}
                      onCancel={closeDrawer}
                      isOpen={isDrawerOpen}
                    />

                    <TaxRatesPanel selectedCategory={selectedCategory} />
                  </>
                )
              }
            />
          </section>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categories.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('categories.delete.description', { name: selectedCategory?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                // Evitar que Radix cierre el diálogo antes de conocer el resultado.
                e.preventDefault()
                handleConfirmDelete()
              }}
              className="bg-error hover:bg-error/90 text-on-error"
            >
              {isDeleting ? t('categories.delete.deleting') : t('categories.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
