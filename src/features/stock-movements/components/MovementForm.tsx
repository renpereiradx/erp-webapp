/**
 * Panel de registro de movimientos de stock (batch 1..N).
 * Usa EXCLUSIVAMENTE POST /stock-transactions/ (vía hook → store → service), que ahora
 * acepta un item o un array: este panel envía TODAS las filas en un único POST.
 *
 * Por fila el usuario elige un producto (con variantes si las tiene) + variante + modo
 * (establecer stock / ajustar por diferencia) + valor + motivo. El domain calcula el delta
 * con signo y el stock resultante. Al registrarse, cada fila dispara su propio
 * transaction_type derivado de la categoría de motivo.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Search, Trash2, Send, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/utils/currencyUtils';
import { getUnitLabel, isDecimalUnit } from '@/constants/units';
import { variantService } from '@/services/variantService';
import useAuthStore from '@/store/useAuthStore';
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

function rowIsDecimal(product?: CatalogProduct): boolean {
  const unit = product?.base_unit?.toLowerCase();
  return unit ? isDecimalUnit(unit) : false;
}

export function MovementForm() {
  const { t } = useI18n();
  const { registerBatch, loading, error, clearError } = useStockMovements();
  const activeBranch = useAuthStore((s) => s.activeBranch);

  const [rows, setRows] = useState<MovementRowUI[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [approval, setApproval] = useState<string>('operator');

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

  // Al agregar un producto, cargamos sus variantes
  const handleAddProduct = useCallback(
    async (product: CatalogProduct) => {
      setShowSearch(false);
      let variants: ProductVariant[] = [];
      try {
        const data = await variantService.getEnrichedVariants(product.id, activeBranch, false);
        variants = data || [];
      } catch (e) {
        console.error('Error fetching variants', e);
        variants = [];
      }
      setRows((prev) => [
        ...prev,
        {
          product,
          variants,
          selectedVariantId: '',
          mode: 'target',
          value: '',
          reasonCategory: 'INVENTORY_COUNT',
          reason: '',
        },
      ]);
    },
    [activeBranch],
  );

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
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
        toast.error(
          t('stockMovements.errors.target_invalid', 'Ingresá un valor de stock válido'),
        );
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
      toast.success(
        t('stockMovements.success', 'Movimiento registrado'),
        { description: t('stockMovements.batchCount', { count: created.length }) },
      );
      setRows([]);
    } catch (err: any) {
      toast.error(t('stockMovements.errors.register_failed', 'No se pudo registrar el movimiento'), {
        description: err?.message,
      });
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Toolbar: agregar producto */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-title-md text-foreground font-bold">
            {t('stockMovements.form.title', 'Nuevo Movimiento')}
          </h2>
          <p className="text-body-sm-bold text-muted-foreground">
            {t('stockMovements.form.batchHint', 'Registrá una o varias filas en un solo envío.')}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowSearch(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('stockMovements.form.search', 'Agregar producto')}
        </Button>
      </div>

      {/* Lista de filas */}
      {rows.length === 0 ? (
        <div className="rounded-md bg-surface shadow-whisper border border-border-subtle p-lg flex flex-col items-center justify-center gap-3 text-center">
          <Package className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-body-md text-muted-foreground">
            {t('stockMovements.form.noProduct', 'No hay productos en la cola.')}
          </p>
          <Button variant="ghost" onClick={() => setShowSearch(true)}>
            {t('stockMovements.form.searchCta', 'Buscar uno')}
          </Button>
        </div>
      ) : (
        <div className="space-y-md">
          {rows.map((row, index) => {
            const current = rowCurrentStock(row);
            const result = resultingStockFor(row);
            const unit = row.product.base_unit ? getUnitLabel(row.product.base_unit) : '';
            const isDecimal = rowIsDecimal(row.product);
            const step = isDecimal ? '0.01' : '1';
            return (
              <div
                key={`${row.product.id}-${index}`}
                className="rounded-md bg-surface shadow-whisper border border-border-subtle p-lg space-y-md"
              >
                {/* Cabeza de fila: producto + quitar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 bg-surface-muted border border-border-subtle rounded-input flex items-center justify-center text-primary overflow-hidden shrink-0">
                      {row.product.image_url ? (
                        <img
                          src={row.product.image_url}
                          alt={row.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-data-mono font-data-mono text-primary font-bold truncate">
                        {row.product.id}
                      </p>
                      <h3 className="text-body-md-bold text-foreground truncate">
                        {row.product.name}
                      </h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('common.delete', 'Quitar')}
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Variante (si existen) */}
                {row.variants.length > 0 && (
                  <div className="space-y-xs">
                    <label className="text-body-sm-bold text-muted-foreground uppercase">
                      {t('stockMovements.form.variant', 'Variante (opcional)')}
                    </label>
                    <select
                      className="h-10 w-full px-3 rounded-input border border-border-subtle bg-surface text-body-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={row.selectedVariantId}
                      onChange={(e) => {
                        setRow(index, { selectedVariantId: e.target.value, value: '' });
                      }}
                    >
                      <option value="">
                        {t('stockMovements.form.mainProduct', 'Producto Principal (General)')}
                      </option>
                      {row.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.variant_name}
                          {v.sku ? ` (${v.sku})` : ''} · {t('stockMovements.form.stock', 'Stock')}:{' '}
                          {v.stock_quantity ?? 0}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Modo + valor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="space-y-xs">
                    <label className="text-body-sm-bold text-muted-foreground uppercase">
                      {t('stockMovements.form.mode.label', 'Modo de ajuste')}
                    </label>
                    <div className="flex gap-2">
                      {(['target', 'delta'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRow(index, { mode: m, value: '' })}
                          className={`flex-1 h-10 rounded-button border text-body-sm-bold uppercase transition-all ${
                            row.mode === m
                              ? 'bg-primary text-on-primary border-primary'
                              : 'bg-surface text-muted-foreground border-border-subtle hover:bg-surface-muted'
                          }`}
                        >
                          {t(`stockMovements.form.mode.${m}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <label className="text-body-sm-bold text-muted-foreground uppercase">
                      {row.mode === 'target'
                        ? t('stockMovements.form.targetStock', 'Stock objetivo')
                        : t('stockMovements.form.delta', 'Diferencia (+/−)')}
                    </label>
                    <input
                      type="number"
                      step={step}
                      className="h-10 w-full px-3 rounded-input border border-border-subtle bg-surface text-body-md text-foreground font-data-mono focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder={row.mode === 'target' ? `0 ${unit}` : '+/−'}
                      value={row.value}
                      onChange={(e) => setRow(index, { value: e.target.value })}
                    />
                  </div>
                </div>

                {/* Stock actual / resultante */}
                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-xs">
                    <p className="text-body-sm-bold text-muted-foreground uppercase">
                      {t('stockMovements.form.currentStock', 'Stock Actual')}
                    </p>
                    <p className="text-data-mono font-data-mono text-foreground">
                      {formatNumber(current)} {unit}
                    </p>
                  </div>
                  <div className="space-y-xs">
                    <p className="text-body-sm-bold text-muted-foreground uppercase">
                      {t('stockMovements.form.resultingStock', 'Stock resultante')}
                    </p>
                    <p className="text-data-mono font-data-mono font-bold text-foreground">
                      {result === null ? '—' : `${formatNumber(result)} ${unit}`}
                    </p>
                  </div>
                </div>

                {/* Categoría de motivo + motivo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="space-y-xs">
                    <label className="text-body-sm-bold text-muted-foreground uppercase">
                      {t('stockMovements.form.reasonCategory', 'Categoría de motivo')}
                    </label>
                    <select
                      className="h-10 w-full px-3 rounded-input border border-border-subtle bg-surface text-body-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={row.reasonCategory}
                      onChange={(e) => setRow(index, { reasonCategory: e.target.value as ReasonCategory })}
                    >
                      {REASON_CATEGORIES.map((rc) => (
                        <option key={rc} value={rc}>
                          {t(`stockMovements.reasons.${rc}`, rc)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-xs">
                    <label className="text-body-sm-bold text-muted-foreground uppercase">
                      {t('stockMovements.form.reason', 'Motivo / Justificación')}
                    </label>
                    <input
                      type="text"
                      className="h-10 w-full px-3 rounded-input border border-border-subtle bg-surface text-body-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder={t('stockMovements.form.reasonPlaceholder', 'Detalle del motivo...')}
                      value={row.reason}
                      onChange={(e) => setRow(index, { reason: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Errores */}
      {error && (
        <div className="rounded-input bg-error-container text-on-error-container p-3 text-body-sm-bold">
          {error}
        </div>
      )}

      {/* Footer: envío */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-sm">
          <label className="text-body-sm-bold text-muted-foreground uppercase">
            {t('stockMovements.form.approvalLevel', 'Nivel de aprobación')}
          </label>
          <select
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
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || rows.length === 0}
          >
            <Send className="w-4 h-4 mr-1.5" />
            {loading
              ? t('stockMovements.form.submitting', 'Registrando...')
              : t('stockMovements.form.submit', 'Registrar movimiento(s)')}
          </Button>
        </div>
      </div>

      <ProductSearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleAddProduct}
      />
    </div>
  );
}
