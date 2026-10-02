import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import useTaxRateStore from '@/store/useTaxRateStore'

// Códigos permitidos por el CHECK de la base (transactions.tax_rates).
export const RATE_CODES = [
  'IVA10',
  'IVA5',
  'EXENTO',
  'IVA_DIGITAL',
  'IVA_TURISMO',
  'ISC_BEBIDAS',
  'ISC_CIGARROS',
  'ISC_COMBUSTIBLES',
  'ISC',
  'IMPORT',
] as const

const NONE_CODE = '__none__'

const taxRateSchema = z
  .object({
    tax_name: z.string().trim().min(1).max(50),
    code: z.string(),
    rate: z.number().min(0).max(999.99),
    effective_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    effective_end: z
      .string()
      .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v)),
  })
  .refine(
    (data) => data.effective_end === '' || data.effective_end >= data.effective_start,
    { path: ['effective_end'] },
  )

export interface TaxRateRecord {
  id: number
  tax_name: string
  code?: string | null
  rate: number
  country?: string | null
  jurisdiction_type?: string | null
  operation_type?: string | null
  description?: string | null
  effective_start: string
  effective_end?: string | null
  is_default: boolean
  is_active: boolean
}

interface FormData {
  tax_name: string
  code: string
  rate: string
  effective_start: string
  effective_end: string
  is_default: boolean
  is_active: boolean
}

// El operation_type se deriva del código: la base lo usa para discriminar el
// régimen (EXEMPT para tasa cero, DIGITAL para servicios digitales).
function operationTypeForCode(code: string): string {
  if (code === 'EXENTO') return 'EXEMPT'
  if (code === 'IVA_DIGITAL') return 'DIGITAL'
  return 'NACIONAL'
}

function toFormData(rate: TaxRateRecord | null): FormData {
  return {
    tax_name: rate?.tax_name ?? '',
    code: rate?.code ?? '',
    rate: rate ? String(rate.rate) : '',
    effective_start: rate?.effective_start ?? new Date().toISOString().slice(0, 10),
    effective_end: rate?.effective_end ?? '',
    is_default: rate?.is_default ?? false,
    is_active: rate?.is_active ?? true,
  }
}

interface TaxRateFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Tasa en edición; null = alta. */
  rate?: TaxRateRecord | null
}

export function TaxRateFormModal({ isOpen, onClose, rate = null }: TaxRateFormModalProps) {
  const { t } = useI18n()
  const { createTaxRate, updateTaxRate } = useTaxRateStore()
  const [formData, setFormData] = useState<FormData>(() => toFormData(rate))
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!rate

  useEffect(() => {
    if (isOpen) {
      setFormData(toFormData(rate))
      setErrors({})
    }
  }, [isOpen, rate])

  const setField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
    },
    [],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting) return

      const parsed = Number(formData.rate.replace(',', '.'))
      const result = taxRateSchema.safeParse({
        tax_name: formData.tax_name,
        code: formData.code,
        rate: Number.isFinite(parsed) ? parsed : NaN,
        effective_start: formData.effective_start,
        effective_end: formData.effective_end,
      })

      if (!result.success) {
        const fieldErrors: Partial<Record<keyof FormData, string>> = {}
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof FormData
          if (!fieldErrors[field]) fieldErrors[field] = issue.message
        }
        if (!Number.isFinite(parsed)) fieldErrors.rate = t('categories.tax.form.error.rate')
        if (!isEditMode && !formData.code) fieldErrors.code = t('categories.tax.form.error.code')
        setErrors(fieldErrors)
        return
      }

      if (!isEditMode && !formData.code) {
        setErrors({ code: t('categories.tax.form.error.code') })
        return
      }

      setIsSubmitting(true)
      try {
        const payload = {
          tax_name: formData.tax_name.trim(),
          code: formData.code,
          rate: result.data.rate,
          country: rate?.country || 'PY',
          jurisdiction_type: rate?.jurisdiction_type || 'NACIONAL',
          operation_type: operationTypeForCode(formData.code),
          description: rate?.description || '',
          effective_start: formData.effective_start,
          effective_end: formData.effective_end,
          is_default: formData.is_default,
          is_active: formData.is_active,
        }

        if (isEditMode && rate) {
          await updateTaxRate(rate.id, payload)
          toast.success(t('categories.tax.form.toast.updated', { name: payload.tax_name }))
        } else {
          await createTaxRate(payload)
          toast.success(t('categories.tax.form.toast.created', { name: payload.tax_name }))
        }
        onClose()
      } catch (error: any) {
        toast.error(
          error?.response?.data?.error ||
            error?.message ||
            t('categories.tax.form.toast.save_error'),
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, isEditMode, isSubmitting, rate, createTaxRate, updateTaxRate, onClose, t],
  )

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode
          ? t('categories.tax.form.edit_title', { name: rate?.tax_name ?? '' })
          : t('categories.tax.form.create_title')
      }
      size="sm"
      footer={
        <div className="flex justify-end gap-sm">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <form className="space-y-md" onSubmit={handleSubmit} autoComplete="off" noValidate>
        <div className="space-y-xs">
          <Label htmlFor="tax-rate-name" className="text-body-md-bold text-foreground">
            {t('categories.tax.form.name')}
          </Label>
          <Input
            id="tax-rate-name"
            value={formData.tax_name}
            onChange={(e) => setField('tax_name', e.target.value)}
            state={errors.tax_name ? 'error' : ''}
            aria-invalid={!!errors.tax_name}
            maxLength={50}
          />
          {errors.tax_name && <p className="text-body-md text-error">{errors.tax_name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="tax-rate-value" className="text-body-md-bold text-foreground">
              {t('categories.tax.form.rate')}
            </Label>
            <div className="relative">
              <Input
                id="tax-rate-value"
                type="text"
                inputMode="decimal"
                value={formData.rate}
                onChange={(e) => setField('rate', e.target.value)}
                state={errors.rate ? 'error' : ''}
                aria-invalid={!!errors.rate}
                placeholder="10"
              />
              <span className="absolute right-sm top-1/2 -translate-y-1/2 text-body-md text-on-surface-deep pointer-events-none">
                %
              </span>
            </div>
            {errors.rate && <p className="text-body-md text-error">{errors.rate}</p>}
          </div>

          <div className="space-y-xs">
            <Label htmlFor="tax-rate-code" className="text-body-md-bold text-foreground">
              {t('categories.tax.form.code')}
            </Label>
            <Select
              value={formData.code || NONE_CODE}
              onValueChange={(v) => setField('code', v === NONE_CODE ? '' : v)}
            >
              <SelectTrigger id="tax-rate-code" className="bg-surface w-full">
                <SelectValue placeholder={t('categories.tax.form.code_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_CODE}>{t('categories.tax.form.code_none')}</SelectItem>
                {RATE_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.code && <p className="text-body-md text-error">{errors.code}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="tax-rate-start" className="text-body-md-bold text-foreground">
              {t('categories.tax.form.start')}
            </Label>
            <Input
              id="tax-rate-start"
              type="date"
              value={formData.effective_start}
              onChange={(e) => setField('effective_start', e.target.value)}
              state={errors.effective_start ? 'error' : ''}
              aria-invalid={!!errors.effective_start}
            />
            {errors.effective_start && (
              <p className="text-body-md text-error">{errors.effective_start}</p>
            )}
          </div>
          <div className="space-y-xs">
            <Label htmlFor="tax-rate-end" className="text-body-md-bold text-foreground">
              {t('categories.tax.form.end')}
            </Label>
            <Input
              id="tax-rate-end"
              type="date"
              value={formData.effective_end}
              onChange={(e) => setField('effective_end', e.target.value)}
              state={errors.effective_end ? 'error' : ''}
              aria-invalid={!!errors.effective_end}
            />
            {errors.effective_end && (
              <p className="text-body-md text-error">{errors.effective_end}</p>
            )}
          </div>
        </div>

        <div className="space-y-sm pt-xs border-t border-border-subtle">
          <div className="flex items-center justify-between gap-sm">
            <Label htmlFor="tax-rate-active" className="text-body-md text-foreground">
              {t('categories.tax.form.active')}
            </Label>
            <Switch
              id="tax-rate-active"
              checked={formData.is_active}
              onCheckedChange={(v) => setField('is_active', v)}
            />
          </div>
          <div className="flex items-center justify-between gap-sm">
            <div className="space-y-xs">
              <Label htmlFor="tax-rate-default" className="text-body-md text-foreground">
                {t('categories.tax.form.default')}
              </Label>
              <p className="text-body-sm text-on-surface-deep">
                {t('categories.tax.form.default_hint')}
              </p>
            </div>
            <Switch
              id="tax-rate-default"
              checked={formData.is_default}
              onCheckedChange={(v) => setField('is_default', v)}
            />
          </div>
        </div>
      </form>
    </EnhancedModal>
  )
}

export default TaxRateFormModal
