// ===========================================================================
// CreateTransferModal (F.4/F.5 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Creación de transferencias: origen = sucursal activa (modelo depósito puro,
// sin selector libre), destino a elegir, ítems producto+variante+cantidad.
// Acepta ítems precargados desde el CTA post-compra (F.5).
// ===========================================================================

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Loader2, PackageSearch, Plus, Trash2 } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import { branchService } from '@/features/branches/services/branchService'
import { productService } from '@/services/productService'
import type { Branch, CreateBranchTransferRequest, Product } from '@/types'
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
  const createMutation = useCreateTransfer()

  const [destinationId, setDestinationId] = useState<string>(initialDestinationId ? String(initialDestinationId) : '')
  const [lines, setLines] = useState<TransferLine[]>(() => linesFromPreloaded(initialItems || []))
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce del buscador (300 ms) para no golpear la API por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: branchesResponse } = useQuery({
    queryKey: ['branches-names'],
    queryFn: () => branchService.getBranches({ is_active: true, page_size: 100 }),
    staleTime: 1000 * 60 * 5,
  })
  const branches: Branch[] = (branchesResponse as { branches?: Branch[] })?.branches || []

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['transfer-product-search', debouncedSearch],
    queryFn: () => productService.search(debouncedSearch),
    enabled: open && debouncedSearch.length >= 2,
  })
  const foundProducts: Product[] = Array.isArray(searchResults) ? searchResults : []

  const addLine = (product: Product, variantId?: string, variantName?: string) => {
    const line: TransferLine = {
      product_id: product.id,
      variant_id: variantId,
      product_name: variantName || product.name,
      quantity: 1,
    }
    setLines((prev) => {
      const key = lineKey(line)
      if (prev.some((existing) => lineKey(existing) === key)) return prev
      return [...prev, line]
    })
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
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-xs">
          <DialogTitle className="text-title-md text-foreground">{t('transfers.createTitle', 'Nueva Transferencia')}</DialogTitle>
          <DialogDescription className="text-body-md text-on-surface-deep">
            {t('transfers.createDescription', 'El stock sale de la sucursal activa y se recibe en la sucursal destino.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-md">
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div className="space-y-xs">
              <Label>{t('transfers.source', 'Sucursal de origen')}</Label>
              <div className="flex h-11 items-center rounded-md border border-border-subtle bg-surface-muted px-md text-body-md text-foreground">
                {sourceBranchName || sourceBranchId || t('transfers.noSource', 'Sin sucursal activa')}
              </div>
            </div>
            <div className="space-y-xs">
              <Label htmlFor="transfer-destination">{t('transfers.destination', 'Sucursal de destino')}</Label>
              <select
                id="transfer-destination"
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="h-11 w-full rounded-md border border-border-subtle bg-surface px-md text-body-md text-foreground"
              >
                <option value="">{t('transfers.pickDestination', 'Seleccionar destino...')}</option>
                {branches
                  .filter((b) => String(b.id) !== String(sourceBranchId))
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="transfer-product-search">{t('transfers.addProduct', 'Agregar producto')}</Label>
            <div className="relative">
              <PackageSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-deep" />
              <Input
                id="transfer-product-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('transfers.searchPlaceholder', 'Buscar por nombre o código...')}
                className="pl-10"
              />
            </div>
            {debouncedSearch.length >= 2 && (
              <ul className="max-h-40 overflow-y-auto rounded-md border border-border-subtle bg-surface shadow-whisper">
                {searching && (
                  <li className="flex items-center gap-xs p-sm text-body-sm text-on-surface-deep">
                    <Loader2 className="size-4 animate-spin" /> {t('transfers.searching', 'Buscando...')}
                  </li>
                )}
                {!searching && foundProducts.length === 0 && (
                  <li className="p-sm text-body-sm text-on-surface-deep">
                    {t('transfers.noResults', 'Sin resultados')}
                  </li>
                )}
                {foundProducts.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-sm p-sm text-left hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      onClick={() => addLine(product)}
                    >
                      <span className="min-w-0 truncate text-body-md text-foreground">{product.name}</span>
                      <Plus className="size-4 shrink-0 text-primary" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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

        <DialogFooter className="flex justify-end gap-sm">
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
