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
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/30 animate-in fade-in duration-300 pointer-events-none"
      data-testid="category-management-modal"
    >
      <div
        className="bg-white dark:bg-surface-dark rounded-2xl shadow-fluent-16 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 pointer-events-auto"
      >
        <div className="px-8 py-5 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-primary/[0.03] via-transparent to-transparent">
          <div className="flex items-center gap-3.5">
            <div className="size-11 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/10">
              <Tags size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-main tracking-tight uppercase leading-none">
                {t('categories.management.title')}
              </h2>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">
                {t('categories.management.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-slate-100 rounded-full text-text-secondary hover:text-text-main transition-all hover:rotate-90 duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-4 border-b border-border-subtle bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <Button
            type="button"
            onClick={openCreate}
            className="bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] px-5 h-10 rounded shadow-fluent-2 flex items-center gap-2"
            data-testid="category-management-new"
          >
            <Plus size={16} />
            {t('categories.management.new')}
          </Button>
          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('categories.management.search.placeholder')}
              className="pl-10 h-10 border-border-subtle rounded-full bg-white focus:bg-white transition-all font-bold text-xs uppercase tracking-wider"
              data-testid="category-management-search"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <CategoriesTable
            categories={filteredCategories}
            loading={loading}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        </div>
      </div>

      {isDrawerOpen && (
        <div
          className="absolute inset-0 z-[100] bg-black/20 pointer-events-auto"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

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
        onOpenChange={open => {
          if (!open) closeDeleteDialog()
        }}
      >
        <AlertDialogContent className="z-[1200]">
          <AlertDialogHeader className="">
            <AlertDialogTitle className="">{t('categories.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription className="">
              {t('categories.delete.description', { name: selectedCategory?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel className="" disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-error hover:bg-error/90 text-white"
              data-testid="category-confirm-delete"
            >
              {isDeleting ? t('categories.delete.deleting') : t('categories.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isMutating && (
        <div
          className="pointer-events-none absolute inset-0 z-[1175] flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-2xl"
          data-testid="category-management-loading"
        >
          <div className="animate-spin w-7 h-7 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  )
}
