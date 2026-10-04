/**
 * Pestaña Insumos (PLAN_UNITS_V2 F6.2): catálogo de insumos con estadísticas
 * de compras. Card-con-tabla §6.3 (banda toolbar + thead full-bleed + empty
 * dentro). Insumos = canal de costos: NO afectan el inventario (decisión de
 * diseño §11.1 del plan).
 */

import { useEffect, useState } from 'react'
import { Pencil, ShoppingCart, History, Boxes } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import EnhancedModal from '@/components/ui/EnhancedModal'
import UnitSelect from '@/components/UnitSelect'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ErrorState from '@/components/ui/ErrorState'
import { formatCurrency, formatNumber } from '@/utils/currencyUtils'
import { formatNumberInput, parseNumberInput } from '@/domain/shared/moneyInput'
import { manufacturingService } from '@/services/manufacturingService'
import { useSupplies } from '../hooks/useManufacturing'
import type { SupplyEnriched, SupplyPurchase } from '../types'

interface FormState {
  id: number | null
  name: string
  description: string
  unit: string
  supplier_name: string
}

const EMPTY_FORM: FormState = { id: null, name: '', description: '', unit: 'kg', supplier_name: '' }

interface PurchaseFormState {
  supply: SupplyEnriched | null
  quantity: string
  unit_cost: string
  supplier_name: string
  invoice_number: string
  notes: string
}

const EMPTY_PURCHASE: PurchaseFormState = {
  supply: null,
  quantity: '',
  unit_cost: '',
  supplier_name: '',
  invoice_number: '',
  notes: '',
}

export function SuppliesTab() {
  const { t } = useI18n()
  const { data: supplies, loading, error, refetch } = useSupplies()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [purchase, setPurchase] = useState<PurchaseFormState | null>(null)
  const [historySupply, setHistorySupply] = useState<SupplyEnriched | null>(null)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (s: SupplyEnriched) => {
    setForm({
      id: s.id,
      name: s.name,
      description: s.description ?? '',
      unit: s.unit,
      supplier_name: s.supplier_name ?? '',
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (form.id === null) {
        await manufacturingService.createSupply({
          name: form.name.trim(),
          description: form.description.trim() || null,
          unit: form.unit,
          supplier_name: form.supplier_name.trim() || null,
        })
        toast.success(t('manufacturing.supplies.toast.created'))
      } else {
        await manufacturingService.updateSupply(form.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          unit: form.unit,
          supplier_name: form.supplier_name.trim() || null,
        })
        toast.success(t('manufacturing.supplies.toast.updated'))
      }
      setFormOpen(false)
      await refetch()
    } catch (err: any) {
      toast.error(t('manufacturing.supplies.toast.failed'), { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  const handlePurchase = async () => {
    if (!purchase?.supply) return
    const qty = Number(purchase.quantity.replace(',', '.'))
    const cost = Number(parseNumberInput(purchase.unit_cost))
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(cost) || cost < 0) return
    setSaving(true)
    try {
      const result = await manufacturingService.registerSupplyPurchase({
        supply_id: purchase.supply.id,
        quantity: qty,
        unit_cost: cost,
        supplier_name: purchase.supplier_name.trim() || null,
        invoice_number: purchase.invoice_number.trim() || null,
        notes: purchase.notes.trim() || null,
      })
      if (result.success === false) {
        toast.error(t('manufacturing.supplies.toast.failed'), { description: result.error })
        return
      }
      toast.success(t('manufacturing.supplies.toast.purchase_ok'))
      setPurchase(null)
      await refetch()
    } catch (err: any) {
      toast.error(t('manufacturing.supplies.toast.failed'), { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  const purchaseTotal = (() => {
    if (!purchase) return 0
    const qty = Number(purchase.quantity.replace(',', '.'))
    const cost = Number(parseNumberInput(purchase.unit_cost))
    return Number.isFinite(qty) && Number.isFinite(cost) ? qty * cost : 0
  })()

  return (
    <div className="space-y-xl">
      {loading && <GenericSkeletonList count={5} data-testid="supplies-skeleton" />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && (
        <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
          <div className="px-lg py-md bg-surface-muted border-b border-divider flex items-center justify-between gap-md">
            <div>
              <h2 className="text-title-md text-foreground">
                {t('manufacturing.supplies.table_title')}
              </h2>
              <p className="text-body-sm text-on-surface-deep mt-0.5">
                {t('manufacturing.supplies.table_subtitle')}
              </p>
            </div>
            <Button variant="primary" onClick={openCreate} data-testid='supply-new'>
              {t('manufacturing.supplies.new')}
            </Button>
          </div>

          <Table className="min-w-[760px]">
            <TableHeader className="bg-surface-muted">
              <TableRow className="hover:bg-surface-muted border-0">
                {[
                  'col_name',
                  'col_unit',
                  'col_supplier',
                  'col_purchases',
                  'col_qty_bought',
                  'col_avg_cost',
                  'col_last',
                  'col_state',
                  'col_actions',
                ].map((key) => (
                  <TableHead
                    key={key}
                    className={
                      'text-label-caps uppercase text-on-surface-deep px-md py-md' +
                      (['col_purchases', 'col_qty_bought', 'col_avg_cost'].includes(key)
                        ? ' text-right'
                        : '')
                    }
                  >
                    {t(`manufacturing.supplies.${key}`)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplies.length === 0 ? (
                <TableRow className="hover:bg-transparent border-0">
                  <TableCell colSpan={9} className="py-xl">
                    <div className="flex flex-col items-center justify-center gap-sm text-on-surface-deep">
                      <div className="size-16 rounded-full bg-surface-muted flex items-center justify-center">
                        <Boxes size={28} strokeWidth={1.5} className="text-outline-fg" aria-hidden="true" />
                      </div>
                      <p className="text-body-md-bold text-foreground">
                        {t('manufacturing.supplies.empty_title')}
                      </p>
                      <p className="text-body-sm text-on-surface-deep">
                        {t('manufacturing.supplies.empty_hint')}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                supplies.map((s) => (
                  <TableRow
                    key={s.id}
                    className="hover:bg-surface-muted transition-colors duration-150"
                  >
                    <TableCell className="text-body-md text-foreground px-md">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-body-md text-on-surface-deep px-md">
                      {s.unit}
                    </TableCell>
                    <TableCell className="text-body-md text-on-surface-deep px-md">
                      {s.supplier_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-data-mono font-data-mono text-right px-md">
                      {formatNumber(s.total_purchases, 0)}
                    </TableCell>
                    <TableCell className="text-data-mono font-data-mono text-right px-md">
                      {formatNumber(s.total_quantity_purchased)} {s.unit}
                    </TableCell>
                    <TableCell className="text-data-mono font-data-mono text-right px-md">
                      {s.avg_unit_cost != null ? formatCurrency(s.avg_unit_cost) : '—'}
                    </TableCell>
                    <TableCell className="text-data-mono font-data-mono px-md">
                      {s.last_purchase_date
                        ? new Date(s.last_purchase_date).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell className="px-md">
                      <Badge variant={s.state ? 'success' : 'secondary'}>
                        {t(
                          s.state
                            ? 'manufacturing.supplies.active'
                            : 'manufacturing.supplies.inactive',
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-md">
                      <div className="flex items-center justify-end gap-xs">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t('manufacturing.supplies.history')}
                          onClick={() => setHistorySupply(s)}
                        >
                          <History size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t('manufacturing.supplies.purchase')}
                          onClick={() =>
                            setPurchase({
                              ...EMPTY_PURCHASE,
                              supply: s,
                              supplier_name: s.supplier_name ?? '',
                            })
                          }
                        >
                          <ShoppingCart size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t('manufacturing.supplies.edit')}
                          onClick={() => openEdit(s)}
                        >
                          <Pencil size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
      )}

      {/* Modal crear/editar insumo */}
      <EnhancedModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          form.id === null
            ? t('manufacturing.supplies.new')
            : t('manufacturing.supplies.edit')
        }
        size="sm"
        footer={
          <div className="flex justify-end gap-sm">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave} data-testid='supply-save'>
              {t('common.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-md">
          <div className="space-y-xs">
            <Label htmlFor="supply-name" className="text-body-md-bold text-foreground">
              {t('manufacturing.supplies.form.name')}
            </Label>
            <Input
              id="supply-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('manufacturing.supplies.form.name_ph')}
            />
          </div>
          <div className="space-y-xs">
            <Label className="text-body-md-bold text-foreground">
              {t('manufacturing.supplies.form.unit')}
            </Label>
            <UnitSelect
              value={form.unit}
              onChange={(unit) => setForm({ ...form, unit })}
              ariaLabel={t('manufacturing.supplies.form.unit')}
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="supply-supplier" className="text-body-md-bold text-foreground">
              {t('manufacturing.supplies.form.supplier')}
            </Label>
            <Input
              id="supply-supplier"
              value={form.supplier_name}
              onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="supply-description" className="text-body-md-bold text-foreground">
              {t('manufacturing.supplies.form.description')}
            </Label>
            <Textarea
              id="supply-description"
              className=""
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </EnhancedModal>

      {/* Modal registrar compra */}
      {purchase?.supply && (
        <EnhancedModal
          isOpen
          onClose={() => setPurchase(null)}
          title={t('manufacturing.supplies.purchase_modal.title')}
          size="sm"
          footer={
            <div className="flex justify-end gap-sm">
              <Button variant="secondary" onClick={() => setPurchase(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                loading={saving}
                onClick={handlePurchase}
                data-testid='purchase-submit'
              >
                {t('manufacturing.supplies.purchase_modal.submit')}
              </Button>
            </div>
          }
        >
          <div className="space-y-md">
            <div className="space-y-xs">
              <Label className="text-body-md-bold text-foreground">
                {t('manufacturing.supplies.purchase_modal.supply')}
              </Label>
              <p className="text-body-md text-foreground">
                {purchase.supply.name}{' '}
                <span className="text-on-surface-deep">({purchase.supply.unit})</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <Label htmlFor="purchase-qty" className="text-body-md-bold text-foreground">
                  {t('manufacturing.supplies.purchase_modal.quantity')}
                </Label>
                <Input
                  id="purchase-qty"
                  inputMode="decimal"
                  value={purchase.quantity}
                  onChange={(e) => setPurchase({ ...purchase, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-xs">
                <Label htmlFor="purchase-cost" className="text-body-md-bold text-foreground">
                  {t('manufacturing.supplies.purchase_modal.unit_cost')}
                </Label>
                <Input
                  id="purchase-cost"
                  inputMode="decimal"
                  value={formatNumberInput(purchase.unit_cost)}
                  onChange={(e) =>
                    setPurchase({ ...purchase, unit_cost: parseNumberInput(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <Label htmlFor="purchase-supplier" className="text-body-md-bold text-foreground">
                  {t('manufacturing.supplies.purchase_modal.supplier')}
                </Label>
                <Input
                  id="purchase-supplier"
                  value={purchase.supplier_name}
                  onChange={(e) => setPurchase({ ...purchase, supplier_name: e.target.value })}
                />
              </div>
              <div className="space-y-xs">
                <Label htmlFor="purchase-invoice" className="text-body-md-bold text-foreground">
                  {t('manufacturing.supplies.purchase_modal.invoice')}
                </Label>
                <Input
                  id="purchase-invoice"
                  value={purchase.invoice_number}
                  onChange={(e) => setPurchase({ ...purchase, invoice_number: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-xs">
              <Label htmlFor="purchase-notes" className="text-body-md-bold text-foreground">
                {t('manufacturing.supplies.purchase_modal.notes')}
              </Label>
            <Textarea
              id="purchase-notes"
              className=""
              rows={2}
              value={purchase.notes}
              onChange={(e) => setPurchase({ ...purchase, notes: e.target.value })}
            />
            </div>
            <p className="text-body-md text-on-surface-deep" data-testid='purchase-total-hint'>
              {t('manufacturing.supplies.purchase_modal.total_hint', {
                total: formatCurrency(purchaseTotal),
              })}
            </p>
          </div>
        </EnhancedModal>
      )}

      {/* Modal historial de compras */}
      <SupplyPurchasesModal
        supply={historySupply}
        onClose={() => setHistorySupply(null)}
      />
    </div>
  )
}

function SupplyPurchasesModal({
  supply,
  onClose,
}: {
  supply: SupplyEnriched | null
  onClose: () => void
}) {
  const { t } = useI18n()
  const [rows, setRows] = useState<SupplyPurchase[] | null>(null)

  useEffect(() => {
    if (!supply) return
    let cancelled = false
    manufacturingService
      .getSupplyPurchases(supply.id, 20)
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
    return () => {
      cancelled = true
    }
  }, [supply?.id])

  if (!supply) return null

  return (
    <EnhancedModal
      isOpen
      onClose={onClose}
      title={t('manufacturing.supplies.history_modal.title', { name: supply.name })}
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      {rows === null ? (
        <GenericSkeletonList count={3} data-testid="supply-purchases-skeleton" />
      ) : rows.length === 0 ? (
        <p className="text-body-md text-on-surface-deep py-lg text-center">
          {t('manufacturing.supplies.history_modal.empty')}
        </p>
      ) : (
        <Table className="min-w-[560px]">
          <TableHeader className="bg-surface-muted">
            <TableRow className="hover:bg-surface-muted border-0">
              {['col_date', 'col_qty', 'col_unit_cost', 'col_total', 'col_supplier'].map((key) => (
                <TableHead
                  key={key}
                  className={
                    'text-label-caps uppercase text-on-surface-deep px-md py-md' +
                    (key !== 'col_date' && key !== 'col_supplier' ? ' text-right' : '')
                  }
                >
                  {t(`manufacturing.supplies.history_modal.${key}`)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id} className="hover:bg-surface-muted transition-colors duration-150">
                <TableCell className="text-data-mono font-data-mono px-md">
                  {new Date(p.purchase_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-data-mono font-data-mono text-right px-md">
                  {formatNumber(p.quantity)} {supply.unit}
                </TableCell>
                <TableCell className="text-data-mono font-data-mono text-right px-md">
                  {formatCurrency(p.unit_cost)}
                </TableCell>
                <TableCell className="text-data-mono font-data-mono text-right px-md">
                  {formatCurrency(p.total_cost)}
                </TableCell>
                <TableCell className="text-body-md text-on-surface-deep px-md">
                  {p.supplier_name ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </EnhancedModal>
  )
}

export default SuppliesTab
