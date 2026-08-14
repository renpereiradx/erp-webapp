/**
 * Formulario de registro de movimiento de stock.
 * Usa EXCLUSIVAMENTE POST /stock-transactions/ (vía hook → store → service).
 *
 * Dos modos de entrada:
 *  - "target": el usuario ingresa el stock final; el domain calcula el delta (new - current).
 *  - "delta":  el usuario ingresa la diferencia con signo (+/-).
 * El resultado se muestra en vivo (stock resultante) y se envía con transaction_type
 * derivado de la categoría de motivo (ADJUSTMENT / LOSS / FOUND / INITIAL).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Search, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/utils/currencyUtils';
import { getUnitLabel, isDecimalUnit } from '@/constants/units';
import { variantService } from '@/services/variantService';
import useAuthStore from '@/store/useAuthStore';
import type { ProductVariant } from '@/types';
import { useStockMovements } from '../hooks/useStockMovements';
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

export function MovementForm() {
  const { t } = useI18n();
  const { register, loading, error, clearError } = useStockMovements();
  const activeBranch = useAuthStore((s) => s.activeBranch);

  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);

  const [mode, setMode] = useState<'target' | 'delta'>('target');
  const [targetStock, setTargetStock] = useState('');
  const [delta, setDelta] = useState('');
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>('INVENTORY_COUNT');
  const [reason, setReason] = useState('');
  const [approvalLevel, setApprovalLevel] = useState<string>('operator');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  const currentStock = selectedVariant
    ? (selectedVariant.stock_quantity ?? 0)
    : (selectedProduct?.stock_quantity ?? 0);

  const isDecimal = selectedProduct?.base_unit
    ? isDecimalUnit(selectedProduct.base_unit.toLowerCase())
    : false;
  const step = isDecimal ? '0.01' : '1';

  // Cargar variantes al elegir producto
  useEffect(() => {
    if (!selectedProduct?.id) {
      setVariants([]);
      setSelectedVariantId('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await variantService.getEnrichedVariants(
          selectedProduct.id,
          activeBranch,
          false,
        );
        if (!cancelled) setVariants(data || []);
      } catch (e) {
        if (!cancelled) {
          console.error('Error fetching variants', e);
          setVariants([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProduct, activeBranch]);

  // Atajo Ctrl+A
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

  const resultingStock = useMemo(() => {
    if (mode === 'target') {
      const v = parseFloat(targetStock);
      return Number.isFinite(v) ? v : null;
    }
    const d = parseFloat(delta);
    return Number.isFinite(d) ? Number((currentStock + d).toFixed(4)) : null;
  }, [mode, targetStock, delta, currentStock]);

  const handleSelectProduct = useCallback((p: CatalogProduct) => {
    setSelectedProduct(p);
    setShowSearch(false);
    setFieldError(null);
    clearError();
    setTargetStock('');
    setDelta('');
    setSelectedVariantId('');
  }, [clearError]);

  const resetQuantities = () => {
    setTargetStock('');
    setDelta('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    clearError();

    if (!selectedProduct) {
      setFieldError(t('stockMovements.errors.product_required', 'Seleccioná un producto'));
      return;
    }

    const parsedTarget = mode === 'target' ? parseFloat(targetStock) : undefined;
    const parsedDelta = mode === 'delta' ? parseFloat(delta) : undefined;

    if (mode === 'target' && (!Number.isFinite(parsedTarget) || parsedTarget! < 0)) {
      setFieldError(t('stockMovements.errors.target_invalid', 'Ingresá un stock objetivo válido (≥ 0)'));
      return;
    }
    if (mode === 'delta' && (!Number.isFinite(parsedDelta) || parsedDelta === 0)) {
      setFieldError(t('stockMovements.errors.delta_nonzero', 'La diferencia no puede ser 0'));
      return;
    }

    const values: MovementFormValues = {
      product_id: selectedProduct.id,
      variant_id: selectedVariantId ? Number(selectedVariantId) : undefined,
      mode,
      targetStock: parsedTarget,
      delta: parsedDelta,
      reasonCategory,
      reason: reason.trim() || undefined,
      approvalLevel,
      notes: undefined,
    };

    try {
      const tx = await register(values, currentStock);
      toast.success(t('stockMovements.success', 'Movimiento registrado'), {
        description: `#${tx.id} · Δ ${tx.quantity_change}`,
      });
      // actualizar stock local para reflejar el nuevo estado sin recargar
      const newStock = Number((currentStock + tx.quantity_change).toFixed(4));
      if (selectedVariantId && selectedVariant) {
        setVariants((prev) =>
          prev.map((v) =>
            v.id === selectedVariantId ? { ...v, stock_quantity: newStock } : v,
          ),
        );
      } else if (selectedProduct) {
        setSelectedProduct({ ...selectedProduct, stock_quantity: newStock });
      }
      resetQuantities();
    } catch (err: any) {
      // el store ya seteó `error`; mostramos toast con el mensaje normalizado
      toast.error(t('stockMovements.errors.register_failed', 'No se pudo registrar el movimiento'), {
        description: err?.message,
      });
    }
  };

  const unitLabel = selectedProduct?.base_unit ? getUnitLabel(selectedProduct.base_unit) : '';

  return (
    <div className='flex flex-col gap-6'>
      {/* Card producto seleccionado */}
      <div className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden'>
        <p className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4'>
          {t('stockMovements.form.selectedProduct', 'Producto Seleccionado')}
        </p>
        {selectedProduct ? (
          <div className='flex items-center gap-4'>
            <div className='size-16 bg-slate-50 border border-border-subtle rounded-lg flex items-center justify-center text-primary overflow-hidden flex-shrink-0'>
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className='w-full h-full object-cover' />
              ) : (
                <Package size={32} strokeWidth={1.5} />
              )}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-mono text-primary font-bold truncate'>{selectedProduct.id}</p>
              <h3 className='text-lg font-bold text-text-main leading-tight truncate'>{selectedProduct.name}</h3>
              <p className='text-sm text-text-secondary mt-1'>
                {t('stockMovements.form.currentStock', 'Stock Actual')}:{' '}
                <span className='font-bold text-text-main'>{formatNumber(currentStock)}</span> {unitLabel}
              </p>
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300'>
            <Package className='text-slate-300 mb-2' size={40} />
            <p className='text-sm text-text-secondary px-4'>
              {t('stockMovements.form.noProduct', 'No hay producto seleccionado.')}{' '}
              <button onClick={() => setShowSearch(true)} className='text-primary font-bold hover:underline'>
                {t('stockMovements.form.searchCta', 'Buscar uno')}
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Card formulario */}
      <div className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden'>
        <h2 className='text-sm font-black uppercase text-text-main tracking-widest mb-6 border-b border-slate-100 pb-3'>
          {t('stockMovements.form.title', 'Nuevo Movimiento')}
        </h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {variants.length > 0 && (
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                {t('stockMovements.form.variant', 'Variante (opcional)')}
              </label>
              <select
                className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                value={selectedVariantId}
                onChange={(e) => {
                  setSelectedVariantId(e.target.value);
                  resetQuantities();
                }}
              >
                <option value=''>
                  {t('stockMovements.form.mainProduct', 'Producto Principal (General)')}
                </option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variant_name}
                    {v.sku ? ` (${v.sku})` : ''} · {t('stockMovements.form.stock', 'Stock')}:{' '}
                    {v.stock_quantity ?? 0}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Modo */}
          <div className='flex gap-2'>
            {(['target', 'delta'] as const).map((m) => (
              <button
                key={m}
                type='button'
                onClick={() => setMode(m)}
                className={`flex-1 h-10 text-xs font-black uppercase rounded-lg border transition-all ${
                  mode === m
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-secondary border-border-subtle hover:bg-slate-50'
                }`}
              >
                {t(`stockMovements.form.mode.${m}`)}
              </button>
            ))}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                {mode === 'target'
                  ? t('stockMovements.form.targetStock', 'Stock objetivo')
                  : t('stockMovements.form.delta', 'Diferencia (+/−)')}
              </label>
              <input
                type='number'
                step={step}
                disabled={!selectedProduct}
                className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:bg-slate-50'
                placeholder={mode === 'target' ? `0 ${unitLabel}` : '+/−'}
                value={mode === 'target' ? targetStock : delta}
                onChange={(e) =>
                  mode === 'target' ? setTargetStock(e.target.value) : setDelta(e.target.value)
                }
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                {t('stockMovements.form.resultingStock', 'Stock resultante')}
              </label>
              <div className='h-11 px-3 flex items-center border border-border-subtle rounded-lg bg-slate-50 text-sm font-bold text-text-main'>
                {resultingStock === null ? '—' : formatNumber(resultingStock)} {unitLabel}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                {t('stockMovements.form.reasonCategory', 'Categoría de motivo')}
              </label>
              <select
                className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value as ReasonCategory)}
                disabled={!selectedProduct}
              >
                {REASON_CATEGORIES.map((rc) => (
                  <option key={rc} value={rc}>
                    {t(`stockMovements.reasons.${rc}`, rc)}
                  </option>
                ))}
              </select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                {t('stockMovements.form.approvalLevel', 'Nivel de aprobación')}
              </label>
              <select
                className='h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all'
                value={approvalLevel}
                onChange={(e) => setApprovalLevel(e.target.value)}
                disabled={!selectedProduct}
              >
                {APPROVAL_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {t(`stockMovements.form.approval.${lvl}`, lvl)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
              {t('stockMovements.form.reason', 'Motivo / Justificación')}
            </label>
            <textarea
              className='p-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[90px]'
              placeholder={t('stockMovements.form.reasonPlaceholder', 'Detalle del motivo del movimiento...')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={!selectedProduct}
            />
          </div>

          {(fieldError || error) && (
            <div className='bg-error/10 text-error p-3 rounded text-xs font-bold text-center'>
              {fieldError || error}
            </div>
          )}

          <div className='flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 border-t border-slate-50 pt-4'>
            <p>
              {t('stockMovements.form.source', 'Fuera')}: <span className='text-text-main'>/stock-transactions/</span>
            </p>
            <p>
              {t('stockMovements.form.date', 'Fecha')}:{' '}
              <span className='text-text-main'>{new Date().toLocaleString('es-ES')}</span>
            </p>
          </div>

          <div className='flex items-end gap-2 pt-2'>
            <button
              type='button'
              onClick={() => setShowSearch(true)}
              className='h-11 px-4 flex items-center gap-2 border border-border-subtle rounded-lg text-xs font-black uppercase hover:bg-slate-50 transition-all'
            >
              <Search size={16} strokeWidth={2} />
              {t('stockMovements.form.search', 'Buscar')}
            </button>
            <button
              type='submit'
              disabled={!selectedProduct || loading}
              className='h-11 flex-1 flex items-center justify-center gap-2 bg-primary text-white text-xs font-black uppercase rounded-lg shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Send size={16} strokeWidth={2} />
              {loading
                ? t('stockMovements.form.submitting', 'Registrando...')
                : t('stockMovements.form.submit', 'Registrar movimiento')}
            </button>
          </div>
        </form>
      </div>

      <ProductSearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleSelectProduct}
      />
    </div>
  );
}
