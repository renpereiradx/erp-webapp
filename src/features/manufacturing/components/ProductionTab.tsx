/**
 * Pestaña Producción (PLAN_UNITS_V2 F6.2): registrar producción manual que
 * suma stock del producto fabricado en la sucursal activa (backend F6.0/F6.1:
 * convierte la cantidad a base con la cascada canónica).
 *
 * Patrón de unidades = F4/A3 (MovementForm): UnitSelect + hint del factor
 * (resolveUnitFactor) + gating decimal para unidades enteras (trunc hacia
 * cero; 0,5 entero BLOQUEA, nunca se pierde silenciosamente).
 */

import { useEffect, useMemo, useState } from 'react'
import { Factory, ChefHat, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import UnitSelect from '@/components/UnitSelect'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ErrorState from '@/components/ui/ErrorState'
import { getUnitLabel, isDecimalUnit } from '@/constants/units'
import { formatCurrency, formatNumber } from '@/utils/currencyUtils'
import { formatNumberInput, parseNumberInput } from '@/domain/shared/moneyInput'
import { resolveUnitFactor, type UnitConversionRow } from '@/domain/units/resolveUnitFactor'
import { unitConversionsService } from '@/features/unit-conversions/services/unitConversionsService'
import { searchSellableUnitsFlat, type SellableUnitOption } from '@/features/catalog/sellableUnitSearch'
import SearchableDropdown from '@/components/ui/SearchableDropdown'
import { manufacturingService } from '@/services/manufacturingService'
import { useProduction } from '../hooks/useManufacturing'

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

export function ProductionTab() {
  const { t } = useI18n()
  const { data, loading, error, refetch } = useProduction()
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
      await refetch()
    } catch (err: any) {
      toast.error(t('manufacturing.production.toast_failed'), { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-xl">
      {/* Formulario de producción */}
      <Card className="bg-surface rounded-md shadow-whisper border-0 p-lg">
        <CardHeader className="p-0 pb-md">
          <CardTitle className="text-title-md text-foreground">
            {t('manufacturing.production.form_title')}
          </CardTitle>
          <CardDescription className="text-body-md text-on-surface-deep">
            {t('manufacturing.production.form_subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-md">
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

            <div className="flex justify-end gap-sm pt-md">
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
          </div>
        </CardContent>
      </Card>

      {loading && <GenericSkeletonList count={5} data-testid="production-skeleton" />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          {/* Últimos lotes */}
          <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
            <div className="px-lg py-md bg-surface-muted border-b border-divider">
              <h2 className="text-title-md text-foreground">
                {t('manufacturing.production.batches_title')}
              </h2>
            </div>
            <Table className="min-w-[720px]">
              <TableHeader className="bg-surface-muted">
                <TableRow className="hover:bg-surface-muted border-0">
                  {[
                    'batches_col_date',
                    'batches_col_code',
                    'batches_col_product',
                    'batches_col_qty',
                    'batches_col_cost',
                    'batches_col_cost_unit',
                  ].map((key) => (
                    <TableHead
                      key={key}
                      className={
                        'text-label-caps uppercase text-on-surface-deep px-md py-md' +
                        (key !== 'batches_col_date' &&
                        key !== 'batches_col_code' &&
                        key !== 'batches_col_product'
                          ? ' text-right'
                          : '')
                      }
                    >
                      {t(`manufacturing.production.${key}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.batches.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell colSpan={6} className="py-xl">
                      <div className="flex flex-col items-center justify-center gap-sm text-on-surface-deep">
                        <div className="size-16 rounded-full bg-surface-muted flex items-center justify-center">
                          <Factory size={28} strokeWidth={1.5} className="text-outline-fg" aria-hidden="true" />
                        </div>
                        <p className="text-body-md-bold text-foreground">
                          {t('manufacturing.production.batches_empty')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.batches.map((b) => (
                    <TableRow key={b.id} className="hover:bg-surface-muted transition-colors duration-150">
                      <TableCell className="text-data-mono font-data-mono px-md">
                        {new Date(b.production_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono px-md">
                        {b.batch_code ?? '—'}
                      </TableCell>
                      <TableCell className="text-body-md text-foreground px-md">
                        {b.product_name ?? b.product_id}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {formatNumber(b.quantity_produced)}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {b.production_cost != null ? formatCurrency(b.production_cost) : '—'}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {b.cost_per_unit != null ? formatCurrency(b.cost_per_unit) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>

          <div className="grid gap-gutter lg:grid-cols-2">
            {/* Resumen de producción */}
            <SimpleTable
              title={t('manufacturing.production.summary_title')}
              empty={t('manufacturing.production.summary_empty')}
              icon={<ChefHat size={20} aria-hidden="true" />}
              rows={data.summary.map((s) => ({
                key: s.product_id,
                cells: [
                  { value: s.product_name, mono: false },
                  { value: formatNumber(s.total_batches, 0), mono: true, right: true },
                  { value: formatNumber(s.total_produced), mono: true, right: true },
                  { value: formatCurrency(s.total_production_cost), mono: true, right: true },
                  { value: formatCurrency(s.avg_cost_per_unit), mono: true, right: true },
                  { value: formatNumber(s.current_stock), mono: true, right: true },
                ],
              }))}
              headers={[
                t('manufacturing.production.summary_col_product'),
                t('manufacturing.production.summary_col_batches'),
                t('manufacturing.production.summary_col_produced'),
                t('manufacturing.production.summary_col_cost'),
                t('manufacturing.production.summary_col_avg'),
                t('manufacturing.production.summary_col_stock'),
              ].map((h, i) => ({ label: h, right: i > 0 }))}
            />

            {/* Rentabilidad */}
            <SimpleTable
              title={t('manufacturing.production.profit_title')}
              empty={t('manufacturing.production.profit_empty')}
              icon={<TrendingUp size={20} aria-hidden="true" />}
              rows={data.profitability.map((p) => ({
                key: p.product_id,
                cells: [
                  { value: p.product_name, mono: false },
                  { value: formatCurrency(p.avg_production_cost_per_unit), mono: true, right: true },
                  { value: formatCurrency(p.sale_price_per_unit), mono: true, right: true },
                  { value: formatCurrency(p.profit_margin_per_unit), mono: true, right: true },
                  {
                    value: p.profit_margin_percentage != null
                      ? `${formatNumber(p.profit_margin_percentage, 1)}%`
                      : '—',
                    mono: true,
                    right: true,
                  },
                  { value: formatNumber(p.current_stock), mono: true, right: true },
                ],
              }))}
              headers={[
                t('manufacturing.production.profit_col_product'),
                t('manufacturing.production.profit_col_cost'),
                t('manufacturing.production.profit_col_price'),
                t('manufacturing.production.profit_col_margin'),
                t('manufacturing.production.profit_col_pct'),
                t('manufacturing.production.profit_col_stock'),
              ].map((h, i) => ({ label: h, right: i > 0 }))}
            />
          </div>
        </>
      )}
    </div>
  )
}

interface SimpleTableProps {
  title: string
  empty: string
  icon: React.ReactNode
  headers: Array<{ label: string; right?: boolean }>
  rows: Array<{
    key: string
    cells: Array<{ value: string; mono?: boolean; right?: boolean }>
  }>
}

function SimpleTable({ title, empty, icon, headers, rows }: SimpleTableProps) {
  return (
    <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
      <div className="px-lg py-md bg-surface-muted border-b border-divider flex items-center gap-sm">
        <span className="text-on-surface-deep">{icon}</span>
        <h2 className="text-title-md text-foreground">{title}</h2>
      </div>
      <Table className="min-w-[520px]">
        <TableHeader className="bg-surface-muted">
          <TableRow className="hover:bg-surface-muted border-0">
            {headers.map((h, i) => (
              <TableHead
                key={`${h.label}-${i}`}
                className={
                  'text-label-caps uppercase text-on-surface-deep px-md py-md' +
                  (h.right ? ' text-right' : '')
                }
              >
                {h.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent border-0">
              <TableCell colSpan={headers.length} className="py-lg text-center text-body-md text-on-surface-deep">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.key} className="hover:bg-surface-muted transition-colors duration-150">
                {r.cells.map((c, i) => (
                  <TableCell
                    key={`${r.key}-${i}`}
                    className={
                      (c.mono ? 'text-data-mono font-data-mono' : 'text-body-md text-foreground') +
                      (c.right ? ' text-right' : '') +
                      ' px-md'
                    }
                  >
                    {c.value}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  )
}

export default ProductionTab
