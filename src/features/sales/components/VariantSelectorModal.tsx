import React, { useState, useEffect, useMemo } from 'react';
import { X, Package, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { ProductVariant } from '@/types';
import { variantService } from '@/services/variantService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';

export function VariantSelectorModal({ product, onClose, onSelect }: any) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const toast = useToast();

  useEffect(() => {
    let ignore = false;

    if (product) {
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        setVariants(product.variants);
        return;
      }

      setLoading(true);
      // Retrieve activeBranch from local storage for accurate stock/price resolution
      const activeBranch = localStorage.getItem('activeBranch') ? parseInt(localStorage.getItem('activeBranch') as string) : undefined;
      
      variantService.getEnrichedVariants(product.id || product.product_id, activeBranch, false)
        .then(data => {
          if (!ignore) setVariants(data);
        })
        .catch(() => {
          if (!ignore) toast.error('Error al cargar variantes');
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }

    return () => {
      ignore = true;
    };
  }, [product, toast]);

  // Determine all unique attribute keys across all variants
  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach(v => {
      if (v.variant_attributes) {
        Object.keys(v.variant_attributes).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [variants]);

  const handleAttributeSelect = (key: string, value: string) => {
    setSelectedAttributes(prev => {
      const newSelected = { ...prev };
      if (newSelected[key] === value) {
        delete newSelected[key]; // Toggle: unselect
      } else {
        newSelected[key] = value;
      }
      return newSelected;
    });
  };

  // Find exact matching variant based on selections
  const selectedVariant = useMemo(() => {
    if (attributeKeys.length === 0) return null;
    const allSelected = attributeKeys.every(k => selectedAttributes[k]);
    if (!allSelected) return null;
    
    return variants.find(v => {
      return attributeKeys.every(k => String(v.variant_attributes?.[k]) === selectedAttributes[k]);
    });
  }, [attributeKeys, selectedAttributes, variants]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[var(--fluent-corner-radius-xlarge,8px)] shadow-[var(--fluent-shadow-64)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-[var(--fluent-border-neutral,#E1DFDD)]">
        <div className="px-6 py-4 border-b border-[var(--fluent-border-neutral,#E1DFDD)] flex items-center justify-between bg-[var(--fluent-surface-secondary,#FAF9F8)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--fluent-text-primary,#212121)]">Seleccionar Variante</h2>
            <p className="text-xs text-[var(--fluent-text-secondary,#605E5C)] mt-0.5">{product.name || product.product_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-neutral-hover,#F3F2F1)] rounded-md transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-[var(--fluent-text-tertiary,#8A8886)] text-sm">
              <div className='w-4 h-4 border-2 border-[var(--fluent-brand-primary,#0078D4)] border-t-transparent rounded-full animate-spin' />
              Cargando variantes...
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-8 text-[var(--fluent-text-tertiary,#8A8886)] text-sm">Este producto no tiene variantes registradas.</div>
          ) : attributeKeys.length === 0 ? (
            // Fallback for variants without attributes
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {variants.map(v => {
                const stock = v.stock_quantity || 0;
                const isOutOfStock = stock <= 0;
                return (
                  <div key={v.id} className={`flex items-center justify-between p-3 rounded-md border ${isOutOfStock ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-primary/50'} transition-all`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <Package size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{v.variant_name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{v.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-800">{v.current_price ? `Gs. ${v.current_price.toLocaleString()}` : 'N/A'}</p>
                        <p className={`text-[10px] font-bold ${isOutOfStock ? 'text-[var(--fluent-semantic-danger,#D13438)]' : 'text-[var(--fluent-semantic-success,#107C10)]'} uppercase`}>Stock: {stock}</p>
                      </div>
                      <Button size="sm" disabled={isOutOfStock} onClick={() => onSelect(v, 1)} className="text-xs px-4">
                        Añadir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5">
              {attributeKeys.map(attrKey => {
                const otherSelectedAttrs = Object.fromEntries(
                  Object.entries(selectedAttributes).filter(([k]) => k !== attrKey)
                );
                const availableForThisAttr = Array.from(
                  new Set(
                    variants
                      .filter(v =>
                        Object.entries(otherSelectedAttrs).every(
                          ([k, val]) => String(v.variant_attributes?.[k]) === String(val)
                        )
                      )
                      .map(v => String(v.variant_attributes?.[attrKey]))
                      .filter(Boolean)
                  )
                );

                const selectedValue = selectedAttributes[attrKey];

                return (
                  <div key={attrKey} className='space-y-1.5'>
                    <span className='text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)] uppercase tracking-wide'>
                      {attrKey}
                    </span>
                    <div className='flex flex-wrap gap-2'>
                      {availableForThisAttr.map(val => {
                        const isSelected = selectedValue === val;
                        // For sales: we enforce stock! We must check if ANY variant matching these attributes has stock
                        const candidateVariants = variants.filter(v =>
                          String(v.variant_attributes?.[attrKey]) === val &&
                          Object.entries(otherSelectedAttrs).every(
                            ([k, sv]) => String(v.variant_attributes?.[k]) === String(sv)
                          )
                        );
                        const hasStock = candidateVariants.some(v => (v.stock_quantity ?? 0) > 0);

                        return (
                          <button
                            key={val}
                            type='button'
                            onClick={() => handleAttributeSelect(attrKey, val)}
                            className={`
                              px-3 py-1.5 text-xs font-semibold rounded-[var(--fluent-corner-radius-medium,4px)]
                              border transition-all duration-150 relative
                              ${isSelected
                                ? 'bg-[var(--fluent-brand-primary,#0078D4)] text-white border-[var(--fluent-brand-primary,#0078D4)] shadow-[var(--fluent-shadow-4)]'
                                : hasStock
                                  ? 'bg-[var(--fluent-surface-secondary,#FAF9F8)] text-[var(--fluent-text-primary,#212121)] border-[var(--fluent-border-neutral,#E1DFDD)] hover:border-[var(--fluent-brand-primary,#0078D4)] hover:text-[var(--fluent-brand-primary,#0078D4)]'
                                  : 'bg-[var(--fluent-surface-tertiary,#F3F2F1)] text-[var(--fluent-text-tertiary,#8A8886)] border-[var(--fluent-border-neutral,#E1DFDD)] line-through cursor-not-allowed opacity-50'
                              }
                            `}
                            disabled={!hasStock && !isSelected}
                            title={!hasStock ? 'Sin stock disponible' : undefined}
                          >
                            {val}
                            {isSelected && (
                              <Check size={10} className='inline ml-1 -mt-0.5' />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 mt-2">
                {attributeKeys.every(k => selectedAttributes[k]) ? (
                  selectedVariant ? (
                    <div className={`p-4 rounded-[var(--fluent-corner-radius-medium,4px)] border ${selectedVariant.stock_quantity && selectedVariant.stock_quantity > 0 ? 'bg-[rgba(16,124,16,0.06)] border-[rgba(16,124,16,0.2)]' : 'bg-[rgba(209,52,56,0.06)] border-[rgba(209,52,56,0.2)]'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-[var(--fluent-text-primary,#212121)] text-sm flex items-center gap-1.5">
                            {selectedVariant.stock_quantity && selectedVariant.stock_quantity > 0 ? <CheckCircle2 size={16} className="text-[var(--fluent-semantic-success,#107C10)]" /> : <AlertCircle size={16} className="text-[var(--fluent-semantic-danger,#D13438)]" />}
                            {selectedVariant.variant_name}
                          </h4>
                          <p className="text-xs text-[var(--fluent-text-secondary,#605E5C)] font-mono mt-1 opacity-80">SKU: {selectedVariant.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-[var(--fluent-text-primary,#212121)]">
                            {selectedVariant.current_price ? `Gs. ${selectedVariant.current_price.toLocaleString()}` : 'N/A'}
                          </p>
                          <p className={`text-[10px] font-bold mt-1 ${selectedVariant.stock_quantity && selectedVariant.stock_quantity > 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'} uppercase`}>
                            Stock disponible: {selectedVariant.stock_quantity || 0}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        className="w-full mt-4 px-4 py-2.5 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white text-sm font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] transition-all disabled:opacity-50 disabled:pointer-events-none"
                        disabled={!selectedVariant.stock_quantity || selectedVariant.stock_quantity <= 0}
                        onClick={() => onSelect(selectedVariant, 1)}
                      >
                        Añadir al carrito
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-[var(--fluent-surface-secondary,#FAF9F8)] border border-[var(--fluent-border-neutral,#E1DFDD)] rounded-[var(--fluent-corner-radius-medium,4px)] text-center">
                      <AlertCircle size={20} className="text-[var(--fluent-text-tertiary,#8A8886)] mx-auto mb-2" />
                      <p className="text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]">Esta combinación no está disponible.</p>
                    </div>
                  )
                ) : (
                  <div className="p-4 border border-dashed border-[var(--fluent-border-neutral,#E1DFDD)] rounded-[var(--fluent-corner-radius-medium,4px)] text-center bg-[var(--fluent-surface-secondary,#FAF9F8)] opacity-70">
                    <p className="text-sm text-[var(--fluent-text-secondary,#605E5C)]">Seleccione todas las opciones para ver disponibilidad y precio.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Opción para agregar producto base (principal) */}
          <div className="mt-6 pt-4 border-t border-[var(--fluent-border-neutral,#E1DFDD)]">
            <button
              onClick={() => onSelect({ id: null, variant_name: 'Producto Principal' }, 1)}
              className="w-full px-4 py-2 bg-[var(--fluent-surface-secondary,#FAF9F8)] hover:bg-[var(--fluent-surface-neutral-hover,#F3F2F1)] text-[var(--fluent-text-primary,#212121)] text-sm font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] border border-[var(--fluent-border-neutral,#E1DFDD)] transition-all flex items-center justify-center gap-2"
            >
              <Package size={16} className="text-[var(--fluent-text-secondary,#605E5C)]" />
              Añadir producto principal sin variante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
