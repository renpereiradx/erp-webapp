// ===========================================================================
// CreateTransferModal (F.4/F.5 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Creación de transferencias: origen = sucursal activa (modelo depósito puro,
// sin selector libre), destino a elegir, ítems producto+variante+cantidad.
// Acepta ítems precargados desde el CTA post-compra (F.5).
// ===========================================================================

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight, ArrowRight, Loader2, Trash2, X } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import { useBranch } from '@/contexts/BranchContext'
import { branchService } from '@/features/branches/services/branchService'
import type { Branch, CreateBranchTransferRequest } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchableDropdown, type SearchableDropdownItem } from '@/components/ui/SearchableDropdown'
import { searchSellableUnitsFlat, type SellableUnitOption } from '@/features/catalog/sellableUnitSearch'
import { useCreateTransfer } from '../hooks/useBranchTransfers'
import type { PreloadedTransferItem } from '../types'

interface TransferLine {
  product_id: string
  variant_id?: string
  product_name: string
  quantity: number
  unit_cost?: number
  /** F.6: compra de la que proviene la línea (solo ítems precargados). */
  purchase_order_id?: number
}

interface CreateTransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sucursal activa (origen fijo). `null` (visión global) deshabilita el envío. */
  sourceBranchId: number | null
  sourceBranchName?: string
  /** F.5: ítems precargados desde una compra. */
  initialItems?: PreloadedTransferItem[]
  initialDestinationId?: number | null
}

interface DestinationOption extends SearchableDropdownItem {
  id: string
  name: string
  code?: string
}

const lineKey = (line: Pick<TransferLine, 'product_id' | 'variant_id'>) =>
  `${line.product_id}::${line.variant_id ?? ''}`

function linesFromPreloaded(items: PreloadedTransferItem[]): TransferLine[] {
  return items.map((item) => ({
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product_name || item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    purchase_order_id: item.purchase_order_id,
  }))
}

const CreateTransferModal = ({
  open,
  onOpenChange,
  sourceBranchId,
  sourceBranchName,
  initialItems,
  initialDestinationId,
}: CreateTransferModalProps) => {
  const { t } = useI18n()
  const { addToast } = useToast()
  const { allowedBranches } = useBranch()
  const createMutation = useCreateTransfer()

  const [destinationId, setDestinationId] = useState<string>(initialDestinationId ? String(initialDestinationId) : '')
  const [lines, setLines] = useState<TransferLine[]>(() => linesFromPreloaded(initialItems || []))
  const [notes, setNotes] = useState('')

  const { data: branchesResponse } = useQuery({
    queryKey: ['branches-names'],
    queryFn: () => branchService.getBranches({ is_active: true, page_size: 100 }),
    staleTime: 1000 * 60 * 5,
  })
  const branches: Branch[] = (branchesResponse as { branches?: Branch[] })?.branches || []

  // El backend rechaza la transferencia si el usuario no tiene acceso a AMBAS
  // sucursales (identity/service.go); sin este filtro el dropdown ofrecía
  // destinos inaccesibles y el POST moría en 400. Sin datos de acceso se
  // muestran todas (fail-open) — el backend sigue siendo la barrera.
  const destinationOptions = useMemo<DestinationOption[]>(() => {
    const accessible = allowedBranches.length > 0
      ? branches.filter((b) => allowedBranches.includes(b.id))
      : branches
    return accessible
      .filter((b) => String(b.id) !== String(sourceBranchId))
      .map((b) => ({ id: String(b.id), name: b.name, code: b.code }))
  }, [branches, allowedBranches, sourceBranchId])

  const searchDestinations = async (term: string): Promise<DestinationOption[]> => {
    const q = term.trim().toLowerCase()
    if (!q) return []
    return destinationOptions.filter(
      (b) => b.name.toLowerCase().includes(q) || (b.code ?? '').toLowerCase().includes(q),
    )
  }

  const addUnitLine = (unit: SellableUnitOption) => {
    const line: TransferLine = {
      product_id: unit.id,
      variant_id: unit.variant_id ?? undefined,
      product_name: unit.variant_name ? `${unit.name} · ${unit.variant_name}` : unit.name,
      quantity: 1,
    }
    setLines((prev) =>
      prev.some((existing) => lineKey(existing) === lineKey(line)) ? prev : [...prev, line],
    )
  }

  const updateQuantity = (key: string, quantity: number) => {
    setLines((prev) =>
      prev.map((line) => (lineKey(line) === key ? { ...line, quantity: Math.max(1, quantity) } : line)),
    )
  }

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((line) => lineKey(line) !== key))
  }

  const destinationBranch = branches.find((b) => String(b.id) === destinationId) || null
  const canSubmit =
    sourceBranchId !== null &&
    destinationId !== '' &&
    String(sourceBranchId) !== destinationId &&
    lines.length > 0 &&
    !createMutation.isPending

  const handleSubmit = () => {
    if (sourceBranchId === null || !destinationBranch) return
    const payload: CreateBranchTransferRequest = {
      source_branch_id: sourceBranchId,
      destination_branch_id: destinationBranch.id,
      notes: notes.trim() || undefined,
      items: lines.map((line) => ({
        product_id: line.product_id,
        quantity_requested: line.quantity,
        ...(line.variant_id ? { variant_id: line.variant_id } : {}),
        ...(line.unit_cost != null ? { unit_cost: line.unit_cost } : {}),
        ...(line.purchase_order_id != null ? { purchase_order_id: line.purchase_order_id } : {}),
      })),
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        addToast(t('transfers.createSuccess', 'Transferencia creada'), 'success')
        onOpenChange(false)
      },
      onError: (error: Error) => addToast(error.message || t('transfers.createError', 'Error al crear la transferencia'), 'error'),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* DESIGN.md §6.6: la clase base .radix-dialog__content no aporta padding ni
          ancho — sin w-[...] el diálogo fijo se encoge al contenido y sin p-* todo
          queda pegado a los bordes (header/cuerpo/footer separados, cuerpo scrollable). */}
      <DialogContent className="w-[calc(100%-3rem)] sm:max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-xl border-border-subtle bg-surface shadow-fluent-16">
        <DialogHeader className="mb-0 shrink-0 space-y-xs border-b border-divider bg-surface-muted p-lg">
          <div className="flex items-center gap-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ArrowLeftRight className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-title-md text-foreground">{t('transfers.createTitle', 'Nueva Transferencia')}</DialogTitle>
              <DialogDescription className="text-body-md text-on-surface-deep">
                {t('transfers.createDescription', 'El stock sale de la sucursal activa y se recibe en la sucursal destino.')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-md overflow-y-auto p-lg">
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div className="space-y-xs">
              <Label>{t('transfers.source', 'Sucursal de origen')}</Label>
              <div className="flex h-11 items-center rounded-md border border-border-subtle bg-surface-muted px-md text-body-md text-foreground">
                {sourceBranchName || sourceBranchId || t('transfers.noSource', 'Sin sucursal activa')}
              </div>
            </div>
            <div className="space-y-xs">
              <Label htmlFor="transfer-destination-search">{t('transfers.destination', 'Sucursal de destino')}</Label>
              {destinationId ? (
                <div
                  className="flex items-center justify-between gap-sm rounded-md border border-border-subtle bg-surface-muted p-sm"
                  data-testid="transfer-destination-selected"
                >
                  <span className="min-w-0 truncate text-body-md-bold text-foreground">
                    {destinationBranch?.name ?? (destinationId ? `#${destinationId}` : '')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 shrink-0 p-0 text-on-surface-deep hover:text-error"
                    aria-label={t('transfers.clearDestination', 'Quitar sucursal de destino')}
                    data-testid="transfer-destination-clear"
                    onClick={() => setDestinationId('')}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <SearchableDropdown<DestinationOption>
                  inputId="transfer-destination-search"
                  onSelect={(option) => setDestinationId(option.id)}
                  onSearch={searchDestinations}
                  placeholder={t('transfers.destinationSearchPlaceholder', 'Escribí nombre o código de la sucursal...')}
                  minSearchLength={1}
                  emptyMessage={t('transfers.noResults', 'Sin resultados')}
                  renderItem={(option) => (
                    <div className="py-0.5">
                      <p className="truncate text-body-md-bold text-foreground">{option.name}</p>
                      {option.code && <p className="text-body-sm text-on-surface-deep">{option.code}</p>}
                    </div>
                  )}
                />
              )}
            </div>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="transfer-product-search">{t('transfers.addProduct', 'Agregar producto')}</Label>
            {/* Búsqueda plana compartida (granularity=variant): el stock que
                muestran las filas es el de la sucursal activa (origen), vía
                X-Branch-ID — mismo camino que presupuestos/requisiciones. */}
            <SearchableDropdown<SellableUnitOption>
              inputId="transfer-product-search"
              onSelect={addUnitLine}
              onSearch={searchSellableUnitsFlat}
              placeholder={t('transfers.productSearchPlaceholder', 'Buscar producto por nombre, SKU o variante...')}
              emptyMessage={t('transfers.noResults', 'Sin resultados')}
              renderItem={(unit) => (
                <div className="flex items-center gap-sm py-0.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md-bold text-foreground">
                      {unit.variant_name ? `${unit.name} · ${unit.variant_name}` : unit.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-sm text-body-sm text-on-surface-deep">
                      {unit.sku && <span className="font-mono">SKU: {unit.sku}</span>}
                      <span className={unit.stock > 0 ? 'font-bold text-success' : 'font-bold text-error'}>
                        {t('transfers.stockLabel', 'Stock: {stock}', { stock: String(unit.stock) })}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-xs">
            <Label>{t('transfers.items', 'Ítems ({count})', { count: String(lines.length) })}</Label>
            {lines.length === 0 ? (
              <p className="rounded-md border border-dashed border-border-subtle p-md text-body-sm text-on-surface-deep">
                {t('transfers.emptyItems', 'Agregá al menos un producto para transferir.')}
              </p>
            ) : (
              <ul className="divide-y divide-border-subtle rounded-md border border-border-subtle">
                {lines.map((line) => {
                  const key = lineKey(line)
                  return (
                    <li key={key} className="flex items-center justify-between gap-sm p-sm">
                      <span className="min-w-0 flex-1 truncate text-body-md text-foreground">{line.product_name}</span>
                      <Input
                        type="number"
                        min={1}
                        data-testid={`transfer-line-qty-${line.product_id}`}
                        value={line.quantity}
                        onChange={(e) => updateQuantity(key, parseInt(e.target.value, 10) || 1)}
                        aria-label={t('transfers.quantity', 'Cantidad de {name}', { name: line.product_name })}
                        className="h-9 w-20"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-on-surface-deep hover:text-error"
                        aria-label={t('transfers.removeItem', 'Quitar {name}', { name: line.product_name })}
                        onClick={() => removeLine(key)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="space-y-xs">
            <Label htmlFor="transfer-notes">{t('transfers.notes', 'Notas')}</Label>
            <Input
              id="transfer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('transfers.notesPlaceholder', 'Opcional')}
            />
          </div>

          {sourceBranchId !== null && destinationBranch && (
            <p className="flex items-center gap-xs text-body-sm text-on-surface-deep">
              <ArrowRight className="size-4" />
              {sourceBranchName} <ArrowRight className="size-4" /> {destinationBranch.name}
            </p>
          )}
        </div>

        <DialogFooter className="flex shrink-0 justify-end gap-sm border-t border-divider p-lg pt-md">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button data-testid='transfer-submit' onClick={handleSubmit} disabled={!canSubmit}>
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {t('transfers.submit', 'Crear transferencia')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransferModal
