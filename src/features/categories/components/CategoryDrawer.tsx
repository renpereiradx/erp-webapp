import { useCallback, useEffect, useState } from 'react'
import { Layers, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import useCategoryStore from '@/store/useCategoryStore'
import useTaxRateStore from '@/store/useTaxRateStore'

import type { Category, CategoryFormValues } from '../types'
import { CategoryAttributesManager } from './CategoryAttributesManager'

const NONE_VALUE = 'none'

interface CategoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onSave: (values: CategoryFormValues) => Promise<Category | null>
}

function fromCategory(category: Category | null): CategoryFormValues {
  if (!category) {
    return {
      name: '',
      description: '',
      default_tax_rate_id: null,
      parent_id: null,
      is_active: true,
    }
  }
  return {
    name: category.name || '',
    description: category.description ?? '',
    default_tax_rate_id: category.default_tax_rate_id ?? null,
    parent_id: category.parent_id ?? null,
    is_active: category.is_active !== false,
  }
}

export default function CategoryDrawer({
  isOpen,
  onClose,
  category,
  onSave,
}: CategoryDrawerProps) {
  const { t } = useI18n()
  const { taxRates, fetchTaxRates } = useTaxRateStore()
  const { categories: allCategories } = useCategoryStore()
  const [formData, setFormData] = useState<CategoryFormValues>(() => fromCategory(category))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormValues, string>>>({})

  useEffect(() => {
    if (!isOpen) return
    fetchTaxRates().catch(() => {})
  }, [isOpen, fetchTaxRates])

  useEffect(() => {
    if (isOpen) {
      setFormData(fromCategory(category))
      setErrors({})
    }
  }, [category, isOpen])

  const update = useCallback(
    <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    },
    [],
  )

  const validate = useCallback(
    (data: CategoryFormValues): Partial<Record<keyof CategoryFormValues, string>> => {
      const next: Partial<Record<keyof CategoryFormValues, string>> = {}
      if (!data.name.trim()) next.name = t('categories.field.name.required')
      return next
    },
    [t],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const fieldErrors = validate(formData)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        return
      }
      setSaving(true)
      try {
        await onSave(formData)
      } finally {
        setSaving(false)
      }
    },
    [formData, validate, onSave],
  )

  if (!isOpen) return null

  const parentValue = formData.parent_id === null ? NONE_VALUE : String(formData.parent_id)
  const taxRateValue =
    formData.default_tax_rate_id === null ? '' : String(formData.default_tax_rate_id)
  const availableParents = allCategories.filter((c) => c.id !== category?.id)

  return (
    <div
      className="fixed inset-y-0 right-0 w-full max-w-md bg-surface shadow-fluent-16 z-[120] flex flex-col animate-in slide-in-from-right duration-300 border-l border-border-subtle"
      data-testid="category-drawer"
    >
      <div className="p-lg border-b border-border-subtle flex items-center justify-between">
        <h3 className="text-title-md text-foreground">
          {category ? t('categories.drawer.edit_title') : t('categories.drawer.new_title')}
        </h3>
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

      <div className="flex-1 overflow-y-auto p-lg space-y-lg">
        <form id="category-form" onSubmit={handleSubmit} className="space-y-md">
          <div className="space-y-xs">
            <Label htmlFor="category-name" className="text-label-caps uppercase text-on-surface-deep">
              {t('categories.field.name')}
            </Label>
            <Input
              id="category-name"
              value={formData.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder={t('categories.field.name.placeholder')}
              aria-invalid={!!errors.name}
              data-testid="category-name"
            />
            {errors.name ? (
              <p className="text-body-sm text-error">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-xs">
            <Label htmlFor="category-description" className="text-label-caps uppercase text-on-surface-deep">
              {t('categories.field.description')}
            </Label>
            <Input
              id="category-description"
              value={formData.description ?? ''}
              onChange={(e) => update('description', e.target.value)}
              placeholder={t('categories.field.description.placeholder')}
              data-testid="category-description"
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="category-tax-rate" className="text-label-caps uppercase text-on-surface-deep">
              {t('categories.field.tax_rate')}
            </Label>
            <Select
              value={taxRateValue}
              onValueChange={(v) => update('default_tax_rate_id', v ? Number(v) : null)}
            >
              <SelectTrigger id="category-tax-rate">
                <SelectValue placeholder={t('categories.field.tax_rate.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {taxRates.map((rate) => (
                  <SelectItem key={rate.id} value={rate.id.toString()}>
                    {rate.tax_name || rate.name} ({rate.rate}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="category-parent" className="text-label-caps uppercase text-on-surface-deep">
              {t('categories.field.parent')}
            </Label>
            <Select
              value={parentValue}
              onValueChange={(v) => update('parent_id', v === NONE_VALUE ? null : Number(v))}
            >
              <SelectTrigger id="category-parent">
                <SelectValue placeholder={t('categories.field.parent.none')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('categories.field.parent.none_short')}</SelectItem>
                {availableParents.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-md bg-surface-muted rounded-md border border-border-subtle">
            <span className="text-label-caps uppercase text-foreground">
              {t('categories.field.is_active')}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => update('is_active', e.target.checked)}
                className="sr-only peer"
                data-testid="category-is-active"
              />
              <div className="w-10 h-5 bg-divider rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </form>

        {category ? (
          <div className="pt-lg border-t border-border-subtle">
            <h3 className="text-body-md-bold text-foreground mb-xs flex items-center gap-sm">
              <Layers className="w-4 h-4 text-primary" />
              {t('categories.attributesPanel.title')}
            </h3>
            <p className="text-body-sm text-on-surface-deep mb-md">
              {t('categories.attributesPanel.subtitle')}
            </p>
            <CategoryAttributesManager categoryId={category.id} />
          </div>
        ) : null}
      </div>

      <div className="p-lg border-t border-border-subtle bg-surface-muted flex gap-md">
        <Button
          form="category-form"
          type="submit"
          variant="primary"
          className="flex-1 h-11"
          disabled={saving}
          data-testid="category-save"
        >
          {saving ? t('common.saving') : t('categories.action.save')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="flex-1 h-11"
          disabled={saving}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
