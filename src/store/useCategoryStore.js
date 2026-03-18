import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { categoryService } from '@/services/categoryService'
import { telemetry } from '@/utils/telemetry'

const useCategoryStore = create()(
  devtools(
    (set, get) => ({
      categories: [],
      loading: false,
      error: null,

      fetchCategories: async () => {
        set({ loading: true, error: null })
        try {
          const data = await categoryService.getAll()
          set({ categories: data, loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      createCategory: async (categoryData) => {
        set({ loading: true, error: null })
        try {
          const result = await categoryService.create(categoryData)
          await get().fetchCategories() // Recargar lista
          set({ loading: false })
          return result
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      updateCategory: async (id, categoryData) => {
        set({ loading: true, error: null })
        try {
          const result = await categoryService.update(id, categoryData)
          await get().fetchCategories()
          set({ loading: false })
          return result
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      deleteCategory: async (id) => {
        set({ loading: true, error: null })
        try {
          await categoryService.delete(id)
          await get().fetchCategories()
          set({ loading: false })
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      }
    }),
    { name: 'CategoryStore' }
  )
)

export default useCategoryStore
