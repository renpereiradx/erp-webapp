/**
 * Pestaña Recetas (PLAN_UNITS_V2 F6.2): ingredientes por producto fabricado
 * + costo estimado por unidad (endpoint F6.1). La receta es INFORMATIVA (no
 * se valida al producir — decisión §11.4): quantity_per_unit se expresa en
 * la unidad del INSUMO por 1 base del producto.
 */

import { useMemo, useState } from 'react'
import { ChefHat, Trash2, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import EnhancedModal from '@/components/ui/EnhancedModal'
import SearchableDropdown, { type SearchableDropdownItem } from '@/components/ui/SearchableDropdown'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import { formatCurrency, formatNumber } from '@/utils/currencyUtils'
import { searchSellableUnitsFlat, type SellableUnitOption } from '@/features/catalog/sellableUnitSearch'
import { manufacturingService } from '@/services/manufacturingService'
import { useEstimatedCost, useRecipe, useSupplies } from '../hooks/useManufacturing'
import type { SupplyEnriched } from '../types'

/** Picker de productos: SOLO tipo PRODUCTION (artículos fabricados). */
async function searchProductionProducts(term: string): Promise<SellableUnitOption[]> {
  const rows = await searchSellableUnitsFlat(term, { pageSize: 30 })
  return rows.filter((r) => r.product_type === 'PRODUCTION')
}

interface SupplyOption extends SearchableDropdownItem {
  subtitle?: string
}

export function RecipesTab() {
  const { t } = useI18n()
  const [product, setProduct] = useState<SellableUnitOption | null>(null)
  const { data: recipe, loading, error, refetch } = useRecipe(product?.id ?? null)
  const { data: estimated } = useEstimatedCost(product?.id ?? null, 1)
  const { data: supplies } = useSupplies(true)
  const [addOpen, setAddOpen] = useState(false)

  const activeSupplies = useMemo(() => supplies.filter((s) => s.state), [supplies])

  const handleAdd = async (supplyId: number, qtyPerUnit: number, notes: string) => {
    if (!product || !Number.isFinite(qtyPerUnit) || qtyPerUnit <= 0) return
    try {
      await manufacturingService.addRecipeIngredient(product.id, {
        supply_id: supplyId,
        quantity_per_unit: qtyPerUnit,
        notes: notes.trim() || null,
      })
      toast.success(t('manufacturing.recipes.toast.added'))
      setAddOpen(false)
      await refetch()
    } catch (err: any) {
      toast.error(t('manufacturing.recipes.toast.failed'), { description: err?.message })
    }
  }

  const handleRemove = async (supplyId: number) => {
    if (!product) return
    try {
      await manufacturingService.removeRecipeIngredient(product.id, supplyId)
      toast.success(t('manufacturing.recipes.toast.removed'))
      await refetch()
    } catch (err: any) {
      toast.error(t('manufacturing.recipes.toast.failed'), { description: err?.message })
    }
  }

  return (
    <div className="space-y-xl">
      {/* Selector de producto fabricado */}
      <Card className="bg-surface rounded-md shadow-whisper border-0 p-lg">
        <CardHeader className="p-0 pb-md">
          <CardTitle className="text-title-md text-foreground">
            {t('manufacturing.recipes.title')}
          </CardTitle>
          <CardDescription className="text-body-md text-on-surface-deep">
            {t('manufacturing.recipes.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SearchableDropdown
            onSelect={setProduct}
            onSearch={searchProductionProducts}
            placeholder={t('manufacturing.recipes.pick_product')}
            renderItem={(item) => (
              <div className='flex flex-col'>
                <span className='text-body-md text-foreground'>{item.name}</span>
                <span className='text-body-sm text-on-surface-deep'>
                  {item.sku ? `${item.sku} · ` : ''}1 {item.base_unit}
                </span>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {!product && (
        <p className="text-body-md text-on-surface-deep py-lg text-center">
          {t('manufacturing.recipes.no_product')}
        </p>
      )}

      {product && (
        <div className="grid gap-gutter lg:grid-cols-[1fr_360px]">
          {/* Receta */}
          <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
            <div className="px-lg py-md bg-surface-muted border-b border-divider flex items-center justify-between gap-md">
              <div>
                <h2 className="text-title-md text-foreground">
                  {t('manufacturing.recipes.table_title', { name: product.name })}
                </h2>
                <p className="text-body-sm text-on-surface-deep mt-0.5">
                  {t('manufacturing.recipes.qty_hint')}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setAddOpen(true)}
                disabled={activeSupplies.length === 0}
                data-testid='recipe-add'
              >
                {t('manufacturing.recipes.add')}
              </Button>
            </div>

            {loading ? (
              <div className="p-lg">
                <GenericSkeletonList count={3} data-testid="recipe-skeleton" />
              </div>
            ) : (
              <Table className="min-w-[480px]">
                <TableHeader className="bg-surface-muted">
                  <TableRow className="hover:bg-surface-muted border-0">
                    <TableHead className="text-label-caps uppercase text-on-surface-deep px-md py-md">
                      {t('manufacturing.recipes.col_supply')}
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-deep px-md py-md text-right">
                      {t('manufacturing.recipes.col_qty')}
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-deep px-md py-md">
                      {t('manufacturing.recipes.col_notes')}
                    </TableHead>
                    <TableHead className="text-label-caps uppercase text-on-surface-deep px-md py-md text-right">
                      {t('manufacturing.recipes.col_actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {error ? (
                    <TableRow className="border-0">
                      <TableCell colSpan={4} className="px-md py-md text-error text-body-md">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : recipe.length === 0 ? (
                    <TableRow className="hover:bg-transparent border-0">
                      <TableCell colSpan={4} className="py-xl">
                        <div className="flex flex-col items-center justify-center gap-sm text-on-surface-deep">
                          <div className="size-16 rounded-full bg-surface-muted flex items-center justify-center">
                            <ChefHat size={28} strokeWidth={1.5} className="text-outline-fg" aria-hidden="true" />
                          </div>
                          <p className="text-body-md-bold text-foreground">
                            {t('manufacturing.recipes.empty_title')}
                          </p>
                          <p className="text-body-sm text-on-surface-deep">
                            {t('manufacturing.recipes.empty_hint')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipe.map((ing) => (
                      <TableRow key={ing.supply_id} className="hover:bg-surface-muted transition-colors duration-150">
                        <TableCell className="text-body-md text-foreground px-md">
                          {ing.supply_name ?? ing.supply_id}
                        </TableCell>
                        <TableCell className="text-data-mono font-data-mono text-right px-md">
                          {formatNumber(ing.quantity_per_unit)} {ing.unit ?? ''}
                        </TableCell>
                        <TableCell className="text-body-md text-on-surface-deep px-md">
                          {ing.notes ?? '—'}
                        </TableCell>
                        <TableCell className="px-md">
                          <div className="flex justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t('common.delete')}
                              onClick={() => handleRemove(ing.supply_id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </section>

          {/* Costo estimado (endpoint F6.1) */}
          <Card className="bg-surface rounded-md shadow-whisper border-0 p-lg h-fit">
            <CardHeader className="p-0 pb-md">
              <CardTitle className="text-title-md text-foreground flex items-center gap-sm">
                <Calculator size={20} aria-hidden="true" />
                {t('manufacturing.recipes.estimated.title')}
              </CardTitle>
              <CardDescription className="text-body-md text-on-surface-deep">
                {t('manufacturing.recipes.estimated.per_unit')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-md">
              {!estimated || estimated.cost_details.length === 0 ? (
                <p className="text-body-md text-on-surface-deep">
                  {t('manufacturing.recipes.estimated.no_recipe')}
                </p>
              ) : (
                <>
                  <p className="text-headline-lg-mobile text-primary" data-testid='estimated-per-unit'>
                    {formatCurrency(estimated.cost_per_unit)}
                  </p>
                  <ul className="space-y-xs">
                    {estimated.cost_details.map((d) => (
                      <li
                        key={d.supply_name}
                        className="flex items-center justify-between gap-sm text-body-sm"
                      >
                        <span className="text-on-surface-deep truncate">
                          {d.supply_name} · {formatNumber(d.quantity_needed)} {d.unit}
                        </span>
                        <span className="text-data-mono font-data-mono text-foreground shrink-0">
                          {formatCurrency(d.total_cost)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal agregar ingrediente */}
      {product && (
        <AddIngredientModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          supplies={activeSupplies}
          onSubmit={handleAdd}
          hasSupplies={activeSupplies.length > 0}
        />
      )}
    </div>
  )
}

function AddIngredientModal({
  open,
  onClose,
  supplies,
  onSubmit,
  hasSupplies,
}: {
  open: boolean
  onClose: () => void
  supplies: SupplyEnriched[]
  onSubmit: (supplyId: number, qtyPerUnit: number, notes: string) => Promise<void>
  hasSupplies: boolean
}) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<SupplyOption | null>(null)
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // El dropdown exige SearchableDropdownItem (id string); el supply real se
  // resuelve por id numérico al enviar.
  const toOption = (s: SupplyEnriched): SupplyOption => ({
    id: String(s.id),
    name: s.name,
    subtitle: s.unit,
  })

  const searchSupplies = async (term: string): Promise<SearchableDropdownItem[]> => {
    const needle = term.trim().toLowerCase()
    const pool = needle
      ? supplies.filter(
          (s) =>
            s.name.toLowerCase().includes(needle) ||
            (s.supplier_name ?? '').toLowerCase().includes(needle),
        )
      : supplies
    return pool.slice(0, 15).map(toOption)
  }

  const selectedSupply = supplies.find((s) => String(s.id) === selected?.id) ?? null

  const handleSubmit = async () => {
    if (!selectedSupply) return
    const value = Number(qty.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return
    setSaving(true)
    try {
      await onSubmit(selectedSupply.id, value, notes)
      setSelected(null)
      setQty('')
      setNotes('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <EnhancedModal
      isOpen={open}
      onClose={onClose}
      title={t('manufacturing.recipes.add_modal.title')}
      size="sm"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!selectedSupply || !Number.isFinite(Number(qty.replace(',', '.'))) || Number(qty.replace(',', '.')) <= 0}
            onClick={handleSubmit}
            data-testid='ingredient-submit'
          >
            {t('manufacturing.recipes.add_modal.submit')}
          </Button>
        </div>
      }
    >
      {hasSupplies ? (
        <div className="space-y-md">
          <div className="space-y-xs">
            <Label className="text-body-md-bold text-foreground">
              {t('manufacturing.recipes.add_modal.pick_supply')}
            </Label>
            <SearchableDropdown
              onSelect={(item) => setSelected(item as SupplyOption)}
              onSearch={searchSupplies}
              placeholder={t('manufacturing.recipes.add_modal.pick_supply')}
              minSearchLength={0}
              renderItem={(item) => (
                <div className='flex flex-col'>
                  <span className='text-body-md text-foreground'>{item.name}</span>
                  <span className='text-body-sm text-on-surface-deep'>
                    {String(item.subtitle ?? '')}
                  </span>
                </div>
              )}
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="ingredient-qty" className="text-body-md-bold text-foreground">
              {t('manufacturing.recipes.add_modal.quantity')}
              {selectedSupply ? ` (${selectedSupply.unit})` : ''}
            </Label>
            <Input
              id="ingredient-qty"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0.5"
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="ingredient-notes" className="text-body-md-bold text-foreground">
              {t('manufacturing.recipes.add_modal.notes')}
            </Label>
            <Textarea
              id="ingredient-notes"
              className=""
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <p className="text-body-md text-on-surface-deep">
          {t('manufacturing.recipes.add_modal.no_supplies')}
        </p>
      )}
    </EnhancedModal>
  )
}

export default RecipesTab
