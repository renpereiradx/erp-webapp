import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  const update = useCallback(<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }, [])

  const validate = useCallback((data: CategoryFormValues): Partial<Record<keyof CategoryFormValues, string>> => {
    const next: Partial<Record<keyof CategoryFormValues, string>> = {}
    if (!data.name.trim()) next.name = t('categories.field.name.required')
    return next
  }, [t])

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
    [formData, validate, onSave]
  )

  if (!isOpen) return null

  const parentValue = formData.parent_id === null ? NONE_VALUE : String(formData.parent_id)
  const taxRateValue = formData.default_tax_rate_id === null ? '' : String(formData.default_tax_rate_id)
  const availableParents = allCategories.filter(c => c.id !== category?.id)

  return (
    <div
      className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-surface-dark shadow-fluent-16 z-[120] flex flex-col animate-in slide-in-from-right duration-300 border-l border-border-subtle"
      data-testid="category-drawer"
    >
      <div className="p-6 border-b border-border-subtle flex items-center justify-between">
        <h3 className="text-xl font-black tracking-tighter text-text-main uppercase">
          {category ? t('categories.drawer.edit_title') : t('categories.drawer.new_title')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-text-secondary transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              {t('categories.field.name')}
            </label>
            <Input
              value={formData.name}
              onChange={e => update('name', e.target.value)}
              placeholder={t('categories.field.name.placeholder')}
              className="rounded border-border-subtle font-bold"
              data-testid="category-name"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-[10px] text-error font-black uppercase tracking-widest mt-1.5">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              {t('categories.field.description')}
            </label>
            <Input
              value={formData.description ?? ''}
              onChange={e => update('description', e.target.value)}
              placeholder={t('categories.field.description.placeholder')}
              className="rounded border-border-subtle"
              data-testid="category-description"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              {t('categories.field.tax_rate')}
            </label>
            <Select
              value={taxRateValue}
              onValueChange={v => update('default_tax_rate_id', v ? Number(v) : null)}
            >
              <SelectTrigger className="rounded border-border-subtle font-bold h-11">
                <SelectValue placeholder={t('categories.field.tax_rate.placeholder')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-fluent-16 border-border-subtle">
                {taxRates.map(rate => (
                  <SelectItem
                    key={rate.id}
                    value={rate.id.toString()}
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    {rate.tax_name || rate.name} ({rate.rate}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              {t('categories.field.parent')}
            </label>
            <Select
              value={parentValue}
              onValueChange={v => update('parent_id', v === NONE_VALUE ? null : Number(v))}
            >
              <SelectTrigger className="rounded border-border-subtle font-bold h-11">
                <SelectValue placeholder={t('categories.field.parent.none')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-fluent-16 border-border-subtle">
                <SelectItem value={NONE_VALUE} className="font-bold text-xs uppercase tracking-wider">
                  {t('categories.field.parent.none_short')}
                </SelectItem>
                {availableParents.map(c => (
                  <SelectItem
                    key={c.id}
                    value={c.id.toString()}
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-border-subtle">
            <span className="text-xs font-black uppercase tracking-widest text-text-main">
              {t('categories.field.is_active')}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => update('is_active', e.target.checked)}
                className="sr-only peer"
                data-testid="category-is-active"
              />
              <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </form>
      </div>

      <div className="p-6 border-t border-border-subtle bg-slate-50/50 dark:bg-slate-900/20 flex gap-3">
        <Button
          form="category-form"
          type="submit"
          className="flex-1 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] h-11 rounded shadow-fluent-2"
          disabled={saving}
          data-testid="category-save"
        >
          {saving ? t('common.saving') : t('categories.action.save')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 border-border-subtle font-black uppercase tracking-widest text-[10px] h-11 rounded"
          disabled={saving}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
