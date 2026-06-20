import type { Category as BaseCategory } from '@/types'

export type Category = BaseCategory

export interface CategoryFormValues {
  name: string
  description: string
  default_tax_rate_id: number | null
  parent_id: number | null
  is_active: boolean
}

export const emptyCategoryFormValues: CategoryFormValues = {
  name: '',
  description: '',
  default_tax_rate_id: null,
  parent_id: null,
  is_active: true,
}
