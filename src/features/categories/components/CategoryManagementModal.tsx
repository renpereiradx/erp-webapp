import { useCallback } from 'react'
import { Plus, Search, Tags, X } from 'lucide-react'

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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n'

import { useCategoryManagement } from '../hooks/useCategoryManagement'
import type { Category } from '../types'

import CategoriesTable from './CategoriesTable'
import CategoryDrawer from './CategoryDrawer'

interface CategoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (category: Category) => void
  onUpdated?: (category: Category) => void
  onDeleted?: (id: number) => void
  autoFetch?: boolean
}

export default function CategoryManagementModal({
  isOpen,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
  autoFetch = true,
}: CategoryManagementModalProps) {
  const { t } = useI18n()
  const {
    filteredCategories,
    loading,
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
  } = useCategoryManagement({
    autoFetch,
    onCreated,
    onUpdated,
    onDeleted,
  })

  const handleConfirmDelete = useCallback(async () => {
    await confirmDelete()
  }, [confirmDelete])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-foreground/30 animate-in fade-in duration-150 pointer-events-none"
      data-testid="category-management-modal"
    >
      <div
        className="bg-surface rounded-xl shadow-fluent-16 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-border-subtle pointer-events-auto"
      >
        <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between bg-surface">
          <div className="flex items-center gap-md">
            <div className="size-11 bg-primary rounded-md flex items-center justify-center text-on-primary">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-title-md text-foreground">
                {t('categories.management.title')}
              </h2>
              <p className="text-body-sm text-on-surface-deep">
                {t('categories.management.subtitle')}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-lg py-sm border-b border-border-subtle bg-surface-muted flex flex-col md:flex-row md:items-center justify-between gap-md">
          <Button
            type="button"
            variant="primary"
            onClick={openCreate}
            className="h-10"
            data-testid="category-management-new"
          >
            <Plus className="w-4 h-4 mr-xs" />
            {t('categories.management.new')}
          </Button>
          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep pointer-events-none"
            />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('categories.management.search.placeholder')}
              className="pl-10 h-10 rounded-full bg-surface"
              aria-label={t('categories.management.search.placeholder')}
              data-testid="category-management-search"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-lg bg-surface-muted/50">
          <CategoriesTable
            categories={filteredCategories}
            loading={loading}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        </div>
      </div>

      {isDrawerOpen ? (
        <div
          className="absolute inset-0 z-[100] bg-foreground/20 pointer-events-auto"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      ) : null}

      <div className="pointer-events-auto">
        <CategoryDrawer
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
          category={selectedCategory}
          onSave={handleSave}
        />
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
        }}
      >
        <AlertDialogContent className="z-[1200]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categories.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('categories.delete.description', { name: selectedCategory?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-error hover:bg-error/90 text-on-error"
              data-testid="category-confirm-delete"
            >
              {isDeleting ? t('categories.delete.deleting') : t('categories.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isMutating ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1175] flex items-center justify-center bg-surface/40 backdrop-blur-[1px] rounded-xl"
          data-testid="category-management-loading"
        >
          <div className="animate-spin w-7 h-7 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : null}
    </div>
  )
}
