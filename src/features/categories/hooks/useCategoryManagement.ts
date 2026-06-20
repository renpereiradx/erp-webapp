import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/lib/i18n'
import useCategoryStore from '@/store/useCategoryStore'

import type { Category, CategoryFormValues } from '../types'

interface UseCategoryManagementOptions {
  autoFetch?: boolean
  onCreated?: (category: Category) => void
  onUpdated?: (category: Category) => void
  onDeleted?: (id: number) => void
}

export function useCategoryManagement(options: UseCategoryManagementOptions = {}) {
  const { t } = useI18n()
  const { autoFetch = true, onCreated, onUpdated, onDeleted } = options
  const {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore()

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!autoFetch) return
    let ignore = false
    fetchCategories().catch(err => {
      if (ignore) return
      toast.error(err?.message || t('categories.toast.load_error'))
    })
    return () => {
      ignore = true
    }
  }, [autoFetch, fetchCategories, t])

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories
    const term = searchTerm.toLowerCase()
    return categories.filter(cat => {
      const name = (cat.name || '').toLowerCase()
      const description = (cat.description || '').toLowerCase()
      return name.includes(term) || description.includes(term)
    })
  }, [categories, searchTerm])

  const openCreate = useCallback(() => {
    setSelectedCategory(null)
    setIsDrawerOpen(true)
  }, [])

  const openEdit = useCallback((cat: Category) => {
    setSelectedCategory(cat)
    setIsDrawerOpen(true)
  }, [])

  const openDelete = useCallback((cat: Category) => {
    setSelectedCategory(cat)
    setIsDeleteDialogOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedCategory(null)
  }, [])

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setSelectedCategory(null)
  }, [])

  const closeAll = useCallback(() => {
    setIsDrawerOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedCategory(null)
  }, [])

  const handleSave = useCallback(
    async (values: CategoryFormValues): Promise<Category | null> => {
      setIsMutating(true)
      try {
        if (selectedCategory) {
          const updated = await updateCategory(selectedCategory.id, values)
          toast.success(t('categories.toast.updated'))
          onUpdated?.(updated)
          closeDrawer()
          return updated
        }
        const created = await createCategory(values)
        toast.success(t('categories.toast.created'))
        onCreated?.(created)
        closeDrawer()
        return created
      } catch (err: any) {
        toast.error(err?.message || t('categories.toast.create_error'))
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [selectedCategory, createCategory, updateCategory, onCreated, onUpdated, closeDrawer, t]
  )

  const confirmDelete = useCallback(async (): Promise<boolean> => {
    if (!selectedCategory) return false
    setIsDeleting(true)
    try {
      await deleteCategory(selectedCategory.id)
      toast.success(t('categories.toast.deleted'))
      onDeleted?.(selectedCategory.id)
      closeDeleteDialog()
      return true
    } catch (err: any) {
      toast.error(err?.message || t('categories.toast.delete_error'))
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [selectedCategory, deleteCategory, onDeleted, closeDeleteDialog, t])

  return {
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
    closeAll,
    handleSave,
    confirmDelete,
    refetch: fetchCategories,
  }
}

export type UseCategoryManagementReturn = ReturnType<typeof useCategoryManagement>
