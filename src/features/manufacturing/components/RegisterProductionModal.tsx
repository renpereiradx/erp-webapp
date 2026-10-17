/**
 * Modal "Registrar producción" — el alta vive aquí desde el replanteo UI/UX
 * (2026-10-17): la card de formulario dominaba el tab; ahora la toolbar del
 * resumen abre este modal (§6.6) y los datos quedan arriba.
 *
 * Patrón de unidades = F4/A3 (MovementForm): UnitSelect + hint del factor
 * (resolveUnitFactor) + gating decimal para unidades enteras (trunc hacia
 * cero; 0,5 entero BLOQUEA, nunca se pierde silenciosamente).
 */

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import UnitSelect from '@/components/UnitSelect'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { getUnitLabel, isDecimalUnit } from '@/constants/units'
import { formatNumber } from '@/utils/currencyUtils'
import { formatNumberInput, parseNumberInput } from '@/domain/shared/moneyInput'
import { resolveUnitFactor, type UnitConversionRow } from '@/domain/units/resolveUnitFactor'
import { unitConversionsService } from '@/features/unit-conversions/services/unitConversionsService'
import { searchSellableUnitsFlat, type SellableUnitOption } from '@/features/catalog/sellableUnitSearch'
import SearchableDropdown from '@/components/ui/SearchableDropdown'
import { manufacturingService } from '@/services/manufacturingService'

/** Picker de productos: SOLO tipo PRODUCTION (artículos fabricados). */
async function searchProductionProducts(term: string): Promise<SellableUnitOption[]> {
  const rows = await searchSellableUnitsFlat(term, { pageSize: 30 })
  return rows.filter((r) => r.product_type === 'PRODUCTION')
}

/** Gating decimal (mismo criterio que movimientos de stock, auditoría A3). */
const truncateForUnit = (value: number, unit: string): number =>
  isDecimalUnit(unit) ? value : Math.trunc(value)

interface FormState {
  product: SellableUnitOption | null
  quantity: string
  unit: string
  production_cost: string
  batch_code: string
  notes: string
}

const EMPTY_FORM: FormState = {
  product: null,
  quantity: '',
  unit: '',
  production_cost: '',
  batch_code: '',
  notes: '',
}

interface RegisterProductionModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void | Promise<void>
}

export function RegisterProductionModal({ isOpen, onClose, onSaved }: RegisterProductionModalProps) {
  const { t } = useI18n()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [conversions, setConversions] = useState<UnitConversionRow[] | null>(null)
  const [saving, setSaving] = useState(false)

  // Conversiones globales+específicas para el hint del factor (fail-silent).
  useEffect(() => {
    let cancelled = false
    unitConversionsService
      .getAll()
      .then((rows) => {
        if (!cancelled) setConversions(rows as UnitConversionRow[])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const baseUnit = form.product?.base_unit ?? 'unit'
  const effectiveUnit = form.unit || baseUnit

  const unitFactor = useMemo(() => {
    if (!form.product || effectiveUnit === baseUnit) return 1
    if (conversions === null) return null
    return resolveUnitFactor(conversions, form.product.id, effectiveUnit, baseUnit)
  }, [conversions, form.product, effectiveUnit, baseUnit])

  const handleProductSelect = (product: SellableUnitOption) => {
    setForm((prev) => ({ ...prev, product, unit: '', quantity: '' }))
  }

  const baseQtyPreview = useMemo(() => {
    const qty = Number(form.quantity.replace(',', '.'))
    if (!Number.isFinite(qty)) return null
    return Number((qty * (unitFactor ?? 0)).toFixed(4))
  }, [form.quantity, unitFactor])

  const handleSubmit = async () => {
    if (!form.product) return
    const rawQty = Number(form.quantity.replace(',', '.'))
    if (!Number.isFinite(rawQty) || rawQty <= 0) {
      toast.error(t('manufacturing.production.qty_required'))
      return
    }
    const qty = truncateForUnit(rawQty, effectiveUnit)
    if (rawQty !== 0 && qty === 0) {
      toast.error(
        t('manufacturing.production.integer_unit_zero', { unit: getUnitLabel(effectiveUnit) }),
      )
      return
    }
    if (qty <= 0) {
      toast.error(t('manufacturing.production.qty_required'))
      return
    }
    if (effectiveUnit !== baseUnit && unitFactor === null) {
      // El backend rechazaría con NO_CONVERSION: bloquear temprano con hint accionable.
      toast.error(
        t('manufacturing.production.unit_no_conversion', {
          unit: getUnitLabel(effectiveUnit),
          base: getUnitLabel(baseUnit),
        }),
      )
      return
    }

    const cost = Number(parseNumberInput(form.production_cost))
    setSaving(true)
    try {
      const result = await manufacturingService.registerProduction({
        product_id: form.product.id,
        quantity_produced: qty,
        production_cost: Number.isFinite(cost) && cost > 0 ? cost : null,
        batch_code: form.batch_code.trim() || null,
        notes: form.notes.trim() || null,
        ...(effectiveUnit !== baseUnit ? { unit: effectiveUnit.toLowerCase() } : {}),
      })
      if (result.success === false) {
        toast.error(t('manufacturing.production.toast_failed'), { description: result.error })
        return
      }
      toast.success(
        t('manufacturing.production.toast_ok', {
          qty: formatNumber(result.quantity_produced ?? qty),
          unit: result.unit ?? baseUnit,
          name: result.product_name ?? form.product.name,
        }),
      )
      setForm({ ...EMPTY_FORM })
      onClose()
      await onSaved()
    } catch (err: any) {
      toast.error(t('manufacturing.production.toast_failed'), { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('manufacturing.production.form_title')}
      size="lg"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!form.product}
            onClick={handleSubmit}
            data-testid='production-submit'
          >
            {t('manufacturing.production.submit')}
          </Button>
        </div>
      }
    >
      <div className="space-y-md">
        <p className="text-body-sm text-on-surface-deep">
          {t('manufacturing.production.form_subtitle')}
        </p>

        <div className="space-y-xs">
          <Label className="text-body-md-bold text-foreground">
            {t('manufacturing.production.pick_product')}
          </Label>
          <SearchableDropdown
            onSelect={handleProductSelect}
            onSearch={searchProductionProducts}
            placeholder={t('manufacturing.production.pick_product')}
            renderItem={(item) => (
              <div className='flex flex-col'>
                <span className='text-body-md text-foreground'>{item.name}</span>
                <span className='text-body-sm text-on-surface-deep'>
                  {item.sku ? `${item.sku} · ` : ''}
                  {t('manufacturing.production.quantity')} 1 {item.base_unit}
                </span>
              </div>
            )}
          />
          {form.product && (
            <p className="text-body-sm text-on-surface-deep" data-testid='production-product-chosen'>
              {form.product.name} · base {baseUnit}
            </p>
          )}
        </div>

        <div className="grid gap-md sm:grid-cols-2">
          <div className="space-y-xs">
            <Label htmlFor="production-qty" className="text-body-md-bold text-foreground">
              {t('manufacturing.production.quantity')}
            </Label>
            <Input
              id="production-qty"
              inputMode="decimal"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              disabled={!form.product}
            />
          </div>
          <div className="space-y-xs">
            <Label className="text-body-md-bold text-foreground">
              {t('manufacturing.production.unit')}
            </Label>
            <UnitSelect
              value={effectiveUnit}
              onChange={(unit) => setForm({ ...form, unit, quantity: '' })}
              disabled={!form.product}
              extraUnits={[baseUnit]}
              ariaLabel={t('manufacturing.production.unit')}
            />
          </div>
        </div>

        {/* Hints del factor / error sin conversión (patrón F4) */}
        {form.product && effectiveUnit !== baseUnit && (
          <p
            className={
              unitFactor === null
                ? 'text-body-sm text-error'
                : 'text-body-sm text-on-surface-deep'
            }
            data-testid={
              unitFactor === null ? 'production-unit-no-conversion' : 'production-unit-hint'
            }
          >
            {unitFactor === null
              ? t('manufacturing.production.unit_no_conversion', {
                  unit: getUnitLabel(effectiveUnit),
                  base: getUnitLabel(baseUnit),
                })
              : `1 ${getUnitLabel(effectiveUnit)} = ${formatNumber(unitFactor)} ${getUnitLabel(baseUnit)}${
                  baseQtyPreview != null && form.quantity
                    ? ` · → ${formatNumber(baseQtyPreview)} ${getUnitLabel(baseUnit)}`
                    : ''
                }`}
          </p>
        )}

        <div className="grid gap-md sm:grid-cols-2">
          <div className="space-y-xs">
            <Label htmlFor="production-cost" className="text-body-md-bold text-foreground">
              {t('manufacturing.production.cost')}
            </Label>
            <Input
              id="production-cost"
              inputMode="decimal"
              value={formatNumberInput(form.production_cost)}
              onChange={(e) =>
                setForm({ ...form, production_cost: parseNumberInput(e.target.value) })
              }
              disabled={!form.product}
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="production-batch" className="text-body-md-bold text-foreground">
              {t('manufacturing.production.batch_code')}
            </Label>
            <Input
              id="production-batch"
              value={form.batch_code}
              onChange={(e) => setForm({ ...form, batch_code: e.target.value })}
              placeholder={t('manufacturing.production.batch_code_ph')}
              disabled={!form.product}
            />
          </div>
        </div>

        <div className="space-y-xs">
          <Label htmlFor="production-notes" className="text-body-md-bold text-foreground">
            {t('manufacturing.production.notes')}
          </Label>
          <Textarea
            id="production-notes"
            className=""
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={!form.product}
          />
        </div>
      </div>
    </EnhancedModal>
  )
}

export default RegisterProductionModal
