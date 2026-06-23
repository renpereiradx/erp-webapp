import React, { useState, useEffect, useMemo } from 'react';
import { X, Package, CheckCircle2, AlertCircle } from 'lucide-react';
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
      setLoading(true);
      // Retrieve activeBranch from local storage for accurate stock/price resolution
      const activeBranch = localStorage.getItem('activeBranch') ? parseInt(localStorage.getItem('activeBranch') as string) : undefined;
      
      variantService.getEnrichedVariants(product.id, activeBranch, false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

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

  // Compute available options for a given attribute, filtering by other selections
  const getAvailableOptions = (key: string) => {
    const filteredVariants = variants.filter(v => {
      // Must match all OTHER selected attributes
      for (const [selKey, selVal] of Object.entries(selectedAttributes)) {
        if (selKey === key) continue; // Skip self
        if (selVal && String(v.variant_attributes?.[selKey]) !== selVal) return false;
      }
      return true;
    });

    const options = new Set<string>();
    filteredVariants.forEach(v => {
      const val = v.variant_attributes?.[key];
      if (val) options.add(String(val));
    });
    return Array.from(options);
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

  const handleAttributeSelect = (key: string, value: string) => {
    setSelectedAttributes(prev => ({ ...prev, [key]: value }));
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-fluent-16 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Seleccionar Variante</h2>
            <p className="text-xs text-slate-500">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando variantes...</div>
          ) : variants.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Este producto no tiene variantes registradas.</div>
          ) : attributeKeys.length === 0 ? (
            // Fallback for variants without attributes (should not happen normally)
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {variants.map(v => {
                const stock = v.stock_quantity || 0;
                const isOutOfStock = stock <= 0;
                return (
                  <div key={v.id} className={`flex items-center justify-between p-4 rounded-xl border ${isOutOfStock ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-sm'} transition-all`}>
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
                        <p className="text-sm font-black text-slate-800">{v.current_price ? `$${v.current_price.toLocaleString()}` : 'N/A'}</p>
                        <p className={`text-[10px] font-bold ${isOutOfStock ? 'text-error' : 'text-success'} uppercase`}>Stock: {stock}</p>
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
            // Patrón A: Selectores independientes
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {attributeKeys.map(key => {
                  const options = getAvailableOptions(key);
                  return (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-600 mb-1 capitalize">{key}</label>
                      <select
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={selectedAttributes[key] || ''}
                        onChange={e => handleAttributeSelect(key, e.target.value)}
                      >
                        <option value="">Seleccionar {key}...</option>
                        {options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {attributeKeys.every(k => selectedAttributes[k]) ? (
                selectedVariant ? (
                  <div className={`p-5 rounded-xl border ${selectedVariant.stock_quantity && selectedVariant.stock_quantity > 0 ? 'bg-success/5 border-success/20' : 'bg-error/5 border-error/20'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          {selectedVariant.stock_quantity && selectedVariant.stock_quantity > 0 ? <CheckCircle2 size={18} className="text-success" /> : <AlertCircle size={18} className="text-error" />}
                          {selectedVariant.variant_name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-1">SKU: {selectedVariant.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-800">
                          {selectedVariant.current_price ? `$${selectedVariant.current_price.toLocaleString()}` : 'N/A'}
                        </p>
                        <p className={`text-xs font-bold mt-1 ${selectedVariant.stock_quantity && selectedVariant.stock_quantity > 0 ? 'text-success' : 'text-error'}`}>
                          Stock disponible: {selectedVariant.stock_quantity || 0}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4 h-12 text-sm font-bold shadow-fluent-2"
                      disabled={!selectedVariant.stock_quantity || selectedVariant.stock_quantity <= 0}
                      onClick={() => onSelect(selectedVariant, 1)}
                    >
                      Añadir al carrito
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <AlertCircle size={24} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Esta combinación no está disponible.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setSelectedAttributes({})}>
                      Limpiar selección
                    </Button>
                  </div>
                )
              ) : (
                <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                  <p className="text-sm text-slate-500">Seleccione todas las opciones para ver disponibilidad y precio.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
