import { useEffect, useState } from 'react'
import { FolderTree, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/ui/EmptyState'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import useTaxRateStore from '@/store/useTaxRateStore'

import type { Category, CategoryFormValues } from '../types'
import { emptyCategoryFormValues } from '../types'

const NONE_VALUE = 'none'

interface CategoryDetailFormProps {
  selectedCategory: Category | null
  categories: Category[]
  handleSave: (values: CategoryFormValues) => void
  /** Dispara el flujo de confirmación de borrado (no borra directamente). */
  onRequestDelete: (category: Category) => void
  isMutating: boolean
  onCancel: () => void
  /** Determina si el formulario está activo (creación o edición). */
  isOpen?: boolean
}

export function CategoryDetailForm({
  selectedCategory,
  categories,
  handleSave,
  onRequestDelete,
  isMutating,
  onCancel,
  isOpen = true,
}: CategoryDetailFormProps) {
  const { t } = useI18n()
  const { taxRates, fetchTaxRates } = useTaxRateStore()

  const [formData, setFormData] = useState<CategoryFormValues>(emptyCategoryFormValues)

  useEffect(() => {
    fetchTaxRates().catch(() => {})
  }, [fetchTaxRates])

  useEffect(() => {
    if (selectedCategory) {
      setFormData({
        name: selectedCategory.name,
        description: selectedCategory.description || '',
        default_tax_rate_id: selectedCategory.default_tax_rate_id || null,
        parent_id: selectedCategory.parent_id || null,
        is_active: selectedCategory.is_active ?? true,
      })
    } else {
      setFormData(emptyCategoryFormValues)
    }
  }, [selectedCategory, isOpen])

  const update = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSave(formData)
  }

  if (!isOpen) {
    return (
      <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
        <EmptyState
          icon={FolderTree}
          size="small"
          title={t('categories.form.select_empty_title')}
          description={t('categories.form.select_empty')}
        />
      </div>
    )
  }

  const parentValue = formData.parent_id === null ? NONE_VALUE : String(formData.parent_id)
  const taxRateValue =
    formData.default_tax_rate_id === null ? NONE_VALUE : String(formData.default_tax_rate_id)
  const availableParents = categories.filter((c) => c.id !== selectedCategory?.id)

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
      <div className="flex justify-between items-center mb-md border-b border-border-subtle pb-sm">
        <h2 className="text-title-md text-foreground">
          {selectedCategory ? t('categories.form.editing') : t('categories.form.creating')}
        </h2>
        {selectedCategory ? (
          <Badge variant="secondary" className="text-data-mono font-data-mono">
            ID: {selectedCategory.id}
          </Badge>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-md">
        <div className="space-y-xs">
          <Label htmlFor="cat-name" className="text-body-md-bold text-foreground">
            {t('categories.field.name')}
          </Label>
          <Input
            id="cat-name"
            type="text"
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={t('categories.form.name_placeholder')}
            required
            disabled={isMutating}
          />
        </div>
        <div className="space-y-xs">
          <Label htmlFor="cat-desc" className="text-body-md-bold text-foreground">
            {t('categories.field.description')}
          </Label>
          <textarea
            id="cat-desc"
            rows={3}
            className="w-full rounded-input border border-border-subtle bg-surface px-md py-sm text-body-md text-foreground resize-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 outline-none transition-colors disabled:opacity-50"
            value={formData.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder={t('categories.form.description_placeholder')}
            disabled={isMutating}
          />
        </div>
        <div className="space-y-xs">
          <Label htmlFor="cat-parent" className="text-body-md-bold text-foreground">
            {t('categories.field.parent')}
          </Label>
          <Select
            value={parentValue}
            onValueChange={(v) => update('parent_id', v === NONE_VALUE ? null : Number(v))}
            disabled={isMutating}
          >
            <SelectTrigger id="cat-parent">
              <SelectValue placeholder={t('categories.field.parent.none')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>{t('categories.field.parent.none')}</SelectItem>
              {availableParents.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-xs">
          <Label htmlFor="tax-rate" className="text-body-md-bold text-foreground">
            {t('categories.field.tax_rate')}
          </Label>
          <Select
            value={taxRateValue}
            onValueChange={(v) =>
              update('default_tax_rate_id', v === NONE_VALUE ? null : Number(v))
            }
            disabled={isMutating}
          >
            <SelectTrigger id="tax-rate">
              <SelectValue placeholder={t('categories.field.tax_rate.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>{t('categories.form.tax_none')}</SelectItem>
              {taxRates.map((rate: any) => (
                <SelectItem key={rate.id} value={String(rate.id)}>
                  {rate.tax_name || rate.name} ({rate.rate}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* La clasificación SIFEN e IVA se configuran en el panel de Tasas de IVA de abajo */}

        <div className="pt-lg flex justify-end gap-md items-center">
          {selectedCategory ? (
            <Button
              type="button"
              variant="ghost"
              className="text-error hover:text-error mr-auto"
              onClick={() => onRequestDelete(selectedCategory)}
              disabled={isMutating}
            >
              <Trash2 className="w-4 h-4 mr-xs" />
              {t('categories.form.delete')}
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isMutating}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={isMutating}>
            {t('categories.form.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CategoryDetailForm
