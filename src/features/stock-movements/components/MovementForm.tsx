/**
 * Panel de registro de movimientos de stock (batch 1..N).
 * Usa EXCLUSIVAMENTE POST /stock-transactions/ (vía hook → store → service), que ahora
 * acepta un item o un array: este panel envía TODAS las filas en un único POST.
 *
 * Flujo:
 *  - "Agregar producto" abre el buscador; al elegir un producto se agrega una fila a la
 *    TABLA de items y se abre el MODAL de edición para cargar variante/modo/valor/motivo.
 *  - Cada fila se puede editar (modal) o quitar.
 *  - "Registrar movimiento(s)" envía todas las filas en un solo POST.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Search, Trash2, Send, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { formatNumber } from '@/utils/currencyUtils';
import { getUnitLabel, isDecimalUnit } from '@/constants/units';
import type { ProductVariant } from '@/types';
import { useStockMovements, type MovementRow } from '../hooks/useStockMovements';
import type { MovementFormValues } from '@/domain/stock/movements';
import type { ReasonCategory } from '../types';
import { ProductSearchModal, type CatalogProduct } from './ProductSearchModal';

const REASON_CATEGORIES: ReasonCategory[] = [
  'INVENTORY_COUNT',
  'CORRECTION',
  'DAMAGE',
  'EXPIRY',
  'THEFT',
  'RETURN',
  'FOUND',
  'INITIAL_COUNT',
];

const APPROVAL_LEVELS = ['operator', 'supervisor', 'manager', 'admin'] as const;

interface MovementRowUI {
  product: CatalogProduct;
  variants: ProductVariant[];
  selectedVariantId: string;
  mode: 'target' | 'delta';
  value: string;
  reasonCategory: ReasonCategory;
  reason: string;
}

function rowCurrentStock(row: MovementRowUI): number {
  const variant = row.variants.find((v) => v.id === row.selectedVariantId);
  return variant ? (variant.stock_quantity ?? 0) : (row.product.stock_quantity ?? 0);
}

function rowSelectedVariant(row: MovementRowUI): ProductVariant | null {
  return row.variants.find((v) => v.id === row.selectedVariantId) ?? null;
}

function rowIsDecimal(product?: CatalogProduct): boolean {
  const unit = product?.base_unit?.toLowerCase();
  return unit ? isDecimalUnit(unit) : false;
}

export function MovementForm() {
  const { t } = useI18n();
  const { registerBatch, loading, error, clearError } = useStockMovements();

  const [rows, setRows] = useState<MovementRowUI[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [approval, setApproval] = useState<string>('operator');

  // Modal de edición
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<MovementRowUI | null>(null);

  // Atajo Ctrl+A para abrir el buscador
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setRow = useCallback((index: number, patch: Partial<MovementRowUI>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }, []);

  // Al elegir una unidad en el buscador: agrega la fila y abre el modal de
  // edición. Fila plana (PLAN_VARIANTES_PLANAS_AJUSTES_PRODUCTOS F-B): la
  // variante ya viene elegida en la fila — sin segunda llamada de variantes.
  const handleSelectProduct = useCallback(
    async (product: CatalogProduct) => {
      setShowSearch(false);
      let variants: ProductVariant[] = [];
      let selectedVariantId = '';
      if (product.variant_id) {
        selectedVariantId = product.variant_id;
        // Variante mínima para que el selector y el stock actual de la fila
        // reflejen la unidad elegida (el stock ya viaja en la fila).
        variants = [
          {
            id: product.variant_id,
            parent_product_id: product.id,
            variant_name: product.variant_name || product.variant_id,
            sku: product.sku || '',
            variant_attributes: {},
            is_active: true,
            display_order: 0,
            stock_quantity: product.stock_quantity ?? 0,
          } as ProductVariant,
        ];
      }
      const row: MovementRowUI = {
        product,
        variants,
        selectedVariantId,
        mode: 'target',
        value: '',
        reasonCategory: 'INVENTORY_COUNT',
        reason: '',
      };
      const index = rows.length;
      setRows((prev) => [...prev, row]);
      setEditingIndex(index);
      setDraft(row);
    },
    [rows.length],
  );

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({ ...rows[index] });
  };

  const closeEdit = () => {
    setEditingIndex(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (editingIndex === null || !draft) return;
    setRow(editingIndex, { ...draft });
    closeEdit();
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) closeEdit();
  };

  const resultingStockFor = useMemo(
    () => (row: MovementRowUI): number | null => {
      const current = rowCurrentStock(row);
      const parsed = parseFloat(row.value);
      if (!Number.isFinite(parsed)) return null;
      if (row.mode === 'target') return Number(parsed.toFixed(4));
      return Number((current + parsed).toFixed(4));
    },
    [],
  );

  const handleSubmit = async () => {
    clearError();
    if (rows.length === 0) {
      toast.error(t('stockMovements.errors.product_required', 'Seleccioná al menos un producto'));
      return;
    }

    const entries: MovementRow[] = [];
    for (const row of rows) {
      const current = rowCurrentStock(row);
      const value = parseFloat(row.value);
      if (!Number.isFinite(value)) {
        toast.error(t('stockMovements.errors.target_invalid', 'Ingresá un valor de stock válido'));
        return;
      }
      if (row.mode === 'delta' && value === 0) {
        toast.error(t('stockMovements.errors.delta_nonzero', 'La diferencia no puede ser 0'));
        return;
      }
      const form: MovementFormValues = {
        product_id: row.product.id,
        variant_id: row.selectedVariantId || undefined,
        mode: row.mode,
        targetStock: row.mode === 'target' ? value : undefined,
        delta: row.mode === 'delta' ? value : undefined,
        reasonCategory: row.reasonCategory,
        reason: row.reason.trim() || undefined,
        approvalLevel: approval,
        notes: undefined,
      };
      entries.push({ form, currentStock: current });
    }

    try {
      const created = await registerBatch(entries);
      toast.success(t('stockMovements.success', 'Movimiento registrado'), {
        description: t('stockMovements.batchCount', { count: created.length }),
      });
      setRows([]);
    } catch (err: any) {
      toast.error(t('stockMovements.errors.register_failed', 'No se pudo registrar el movimiento'), {
        description: err?.message,
      });
    }
  };

  const variantLabel = (v: ProductVariant) =>
    `${v.variant_name}${v.sku ? ` (${v.sku})` : ''}`;

  return (
    <div className="flex flex-col gap-lg">
      {/* Header + acción principal */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h2 className="text-title-md text-foreground font-bold">
            {t('stockMovements.form.title', 'Nuevo Movimiento')}
          </h2>
          <p className="text-body-sm-bold text-muted-foreground">
            {t('stockMovements.form.batchHint', 'Registrá una o varias filas en un solo envío.')}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowSearch(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          {t('stockMovements.form.search', 'Agregar producto')}
        </Button>
      </div>

      {/* Tabla de items */}
      <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
        <Table>
          <TableHeader className="bg-surface-muted">
            <TableRow>
              <TableHead className="text-label-caps uppercase text-muted-foreground">
                {t('stockMovements.queue.product', 'Producto')}
              </TableHead>
              <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                {t('stockMovements.form.currentStock', 'Stock Actual')}
              </TableHead>
              <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                {t('stockMovements.queue.adjustment', 'Ajuste')}
              </TableHead>
              <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                {t('stockMovements.form.resultingStock', 'Resultante')}
              </TableHead>
              <TableHead className="text-label-caps uppercase text-muted-foreground">
                {t('stockMovements.queue.reason', 'Motivo')}
              </TableHead>
              <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                {t('stockMovements.queue.actions', 'Acciones')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Package className="w-10 h-10 text-muted-foreground/40" strokeWidth={1.5} />
                    <p className="text-body-md text-muted-foreground">
                      {t('stockMovements.form.noProduct', 'No hay productos en la cola.')}
                    </p>
                    <Button variant="ghost" onClick={() => setShowSearch(true)}>
                      {t('stockMovements.form.searchCta', 'Buscar uno')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const current = rowCurrentStock(row);
                const result = resultingStockFor(row);
                const unit = row.product.base_unit ? getUnitLabel(row.product.base_unit) : '';
                const variant = rowSelectedVariant(row);
                return (
                  <TableRow
                    key={`${row.product.id}-${index}`}
                    className="hover:bg-surface-muted transition-colors duration-150"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 bg-surface-muted border border-border-subtle rounded-input flex items-center justify-center text-primary overflow-hidden shrink-0">
                          {row.product.image_url ? (
                            <img
                              src={row.product.image_url}
                              alt={row.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-body-md-bold text-foreground truncate">
                            {row.product.name}
                          </h3>
                          <p className="text-data-mono text-primary font-bold text-body-sm-bold truncate">
                            {row.product.id}
                            {variant ? ` · ${variantLabel(variant)}` : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-data-mono text-foreground">
                      {formatNumber(current)} {unit}
                    </TableCell>
                    <TableCell className="text-right font-data-mono text-foreground">
                      {row.mode === 'target' ? '→ ' : 'Δ '}
                      {formatNumber(Number(row.value) || 0)}
                    </TableCell>
                    <TableCell className={`text-right font-data-mono font-bold ${(result ?? 0) >= current ? 'text-success' : 'text-error'}`}>
                      {result === null ? '—' : formatNumber(result)}
                    </TableCell>
                    <TableCell className="text-body-sm-bold text-muted-foreground max-w-[220px] truncate">
                      {t(`stockMovements.reasons.${row.reasonCategory}`, row.reasonCategory)}
                      {row.reason ? ` · ${row.reason}` : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={t('stockMovements.queue.edit', 'Editar')} onClick={() => openEdit(index)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={t('common.delete', 'Quitar')} onClick={() => removeRow(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Errores */}
      {error && (
        <div className="rounded-input bg-error-container text-on-error-container p-3 text-body-sm-bold">
          {error}
        </div>
      )}

      {/* Footer: envío */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-sm">
          <Label htmlFor="approval" className="text-body-sm-bold text-muted-foreground uppercase">
            {t('stockMovements.form.approvalLevel', 'Nivel de aprobación')}
          </Label>
          <select
            id="approval"
            className="h-10 px-3 rounded-input border border-border-subtle bg-surface text-body-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={approval}
            onChange={(e) => setApproval(e.target.value)}
          >
            {APPROVAL_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {t(`stockMovements.form.approval.${lvl}`, lvl)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <Button variant="secondary" onClick={() => setShowSearch(true)}>
            <Search className="w-4 h-4 mr-1.5" />
            {t('stockMovements.form.search', 'Agregar producto')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || rows.length === 0}>
            <Send className="w-4 h-4 mr-1.5" />
            {loading
              ? t('stockMovements.form.submitting', 'Registrando...')
              : t('stockMovements.form.submit', 'Registrar movimiento(s)')}
          </Button>
        </div>
      </div>

      {/* Modal de edición de item */}
      <EnhancedModal
        isOpen={editingIndex !== null}
        onClose={closeEdit}
        title={t('stockMovements.edit.title', 'Editar movimiento')}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeEdit}>
              {t('action.cancel', 'Cancelar')}
            </Button>
            <Button variant="primary" type="button" onClick={saveEdit} disabled={!draft}>
              {t('action.save', 'Guardar')}
            </Button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-md">
            <div className="rounded-input bg-surface-muted border border-border-subtle p-3">
              <p className="text-data-mono text-primary font-bold text-body-sm-bold uppercase">{draft.product.id}</p>
              <h3 className="text-body-md-bold text-foreground">{draft.product.name}</h3>
            </div>

            {draft.variants.length > 0 && (
              <div className="space-y-xs">
                <Label htmlFor="edit-variant" className="text-body-md-bold text-foreground">
                  {t('stockMovements.form.variant', 'Variante (opcional)')}
                </Label>
                <select
                  id="edit-variant"
                  className="h-10 w-full px-3 rounded-input border border-border-subtle bg-surface text-body-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={draft.selectedVariantId}
                  onChange={(e) => setDraft({ ...draft, selectedVariantId: e.target.value, value: '' })}
                >
                  <option value="">
                    {t('stockMovements.form.mainProduct', 'Producto Principal (General)')}
                  </option>
                  {draft.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {variantLabel(v)} · {t('stockMovements.form.stock', 'Stock')}: {v.stock_quantity ?? 0}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-xs">
              <Label className="text-body-md-bold text-foreground">
                {t('stockMovements.form.mode.label', 'Modo de ajuste')}
              </Label>
              <div className="flex gap-2">
                {(['target', 'delta'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDraft({ ...draft, mode: m, value: '' })}
                    className={`flex-1 h-10 rounded-button border text-body-sm-bold uppercase transition-all ${
                      draft.mode === m
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface text-muted-foreground border-border-subtle hover:bg-surface-muted'
                    }`}
                  >
                    {t(`stockMovements.form.mode.${m}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <Label htmlFor="edit-value" className="text-body-md-bold text-foreground">
                  {draft.mode === 'target'
                    ? t('stockMovements.form.targetStock', 'Stock objetivo')
                    : t('stockMovements.form.delta', 'Diferencia (+/−)')}
                </Label>
                <Input
                  id="edit-value"
                  type="number"
                  step={rowIsDecimal(draft.product) ? '0.01' : '1'}
                  className="font-data-mono"
                  placeholder={draft.mode === 'target' ? `0 ${getUnitLabel(draft.product.base_unit || '')}` : '+/−'}
                  value={draft.value}
                  onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                />
              </div>
              <div className="space-y-xs">
                <Label className="text-body-md-bold text-foreground">
                  {t('stockMovements.form.resultingStock', 'Stock resultante')}
                </Label>
                <div className="h-10 px-3 flex items-center rounded-input border border-border-subtle bg-surface-muted text-body-md font-data-mono">
                  {(() => {
                    const r = resultingStockFor(draft);
                    return r === null ? '—' : `${formatNumber(r)} ${getUnitLabel(draft.product.base_unit || '')}`;
                  })()}
                </div>
              </div>
            </div>

            <div className="space-y-xs">
              <Label htmlFor="edit-category" className="text-body-md-bold text-foreground">
                {t('stockMovements.form.reasonCategory', 'Categoría de motivo')}
              </Label>
              <select
                id="edit-category"
                className="h-10 w-full px-3 rounded-input border border-border-subtle bg-surface text-body-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={draft.reasonCategory}
                onChange={(e) => setDraft({ ...draft, reasonCategory: e.target.value as ReasonCategory })}
              >
                {REASON_CATEGORIES.map((rc) => (
                  <option key={rc} value={rc}>
                    {t(`stockMovements.reasons.${rc}`, rc)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-xs">
              <Label htmlFor="edit-reason" className="text-body-md-bold text-foreground">
                {t('stockMovements.form.reason', 'Motivo / Justificación')}
              </Label>
              <Input
                id="edit-reason"
                type="text"
                placeholder={t('stockMovements.form.reasonPlaceholder', 'Detalle del motivo...')}
                value={draft.reason}
                onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
              />
            </div>
          </div>
        )}
      </EnhancedModal>

      <ProductSearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleSelectProduct}
      />
    </div>
  );
}
