// ===========================================================================
// CreateTransferModal (F.4/F.5 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Creación de transferencias: origen = sucursal activa (modelo depósito puro,
// sin selector libre), destino a elegir, ítems producto+variante+cantidad.
// Acepta ítems precargados desde el CTA post-compra (F.5).
// ===========================================================================

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight, ArrowRight, Loader2, Trash2 } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchableDropdown } from '@/components/ui/SearchableDropdown'
import { searchSellableUnitsFlat, type SellableUnitOption } from '@/features/catalog/sellableUnitSearch'
import { useCreateTransfer } from '../hooks/useBranchTransfers'
import type { PreloadedTransferItem } from '../types'

interface TransferLine {
  product_id: string
  variant_id?: string
  product_name: string
  quantity: number
  /** Detalle para la tabla de ítems (desde la búsqueda plana; precargados no lo traen). */
  sku?: string
  stock?: number
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
  const { user } = useAuth()
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

  // El backend exige acceso a AMBAS sucursales para usuarios escopados
  // (identity/service.go); sin este filtro el select ofrecía destinos
  // inaccesibles y el POST moría en 400. El ADMIN gestiona todas las
  // sucursales de la instalación (bypass espejado en el backend), así que ve
  // la lista completa aunque sus claims JWT sean de sesiones viejas.
  const isAdminRole = user?.role_id === 'admin' || user?.role_id === 'F2VLso'
  const destinationOptions = useMemo(() => {
    const scoped = !isAdminRole && allowedBranches.length > 0
    const accessible = scoped ? branches.filter((b) => allowedBranches.includes(b.id)) : branches
    return accessible.filter((b) => String(b.id) !== String(sourceBranchId))
  }, [branches, allowedBranches, isAdminRole, sourceBranchId])

  const addUnitLine = (unit: SellableUnitOption) => {
    const line: TransferLine = {
      product_id: unit.id,
      variant_id: unit.variant_id ?? undefined,
      product_name: unit.variant_name ? `${unit.name} · ${unit.variant_name}` : unit.name,
      quantity: 1,
      sku: unit.sku,
      stock: unit.stock,
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
              <Label htmlFor="transfer-destination">{t('transfers.destination', 'Sucursal de destino')}</Label>
              <Select value={destinationId || undefined} onValueChange={setDestinationId}>
                <SelectTrigger
                  id="transfer-destination"
                  data-testid="transfer-destination-trigger"
                  className="h-11 w-full bg-surface border-border-subtle text-body-md text-foreground"
                >
                  <SelectValue placeholder={t('transfers.pickDestination', 'Seleccionar destino...')} />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <div className="overflow-x-auto rounded-md bg-surface shadow-whisper">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                      <TableHead className="text-label-caps uppercase text-on-surface-deep">
                        {t('transfers.col.product', 'Producto')}
                      </TableHead>
                      <TableHead className="text-label-caps uppercase text-on-surface-deep">
                        {t('transfers.col.sku', 'SKU')}
                      </TableHead>
                      <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                        {t('transfers.col.availableStock', 'Stock disp.')}
                      </TableHead>
                      <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                        {t('transfers.col.quantity', 'Cantidad')}
                      </TableHead>
                      <TableHead className="w-12" aria-label={t('transfers.col.actions', 'Acciones')} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => {
                      const key = lineKey(line)
                      return (
                        <TableRow
                          key={key}
                          className="hover:bg-surface-muted transition-colors duration-150"
                          data-testid={`transfer-line-${line.product_id}`}
                        >
                          <TableCell className="max-w-56 text-body-md text-foreground">
                            <span className="block truncate" title={line.product_name}>{line.product_name}</span>
                          </TableCell>
                          <TableCell className="max-w-40 text-data-mono font-data-mono text-on-surface-deep">
                            <span className="block truncate" title={line.sku ?? ''}>
                              {line.sku ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-data-mono font-data-mono text-right">
                            {line.stock !== undefined ? (
                              <span className={line.stock > 0 ? 'text-success' : 'text-error'}>{line.stock}</span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="ml-auto w-20">
                              <Input
                                type="number"
                                min={1}
                                data-testid={`transfer-line-qty-${line.product_id}`}
                                value={line.quantity}
                                onChange={(e) => updateQuantity(key, parseInt(e.target.value, 10) || 1)}
                                aria-label={t('transfers.quantity', 'Cantidad de {name}', { name: line.product_name })}
                                className="h-9"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-on-surface-deep hover:text-error"
                              aria-label={t('transfers.removeItem', 'Quitar {name}', { name: line.product_name })}
                              onClick={() => removeLine(key)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
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
