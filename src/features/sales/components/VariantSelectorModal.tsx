import { useState, useEffect, useMemo } from 'react';
import { X, Package, CheckCircle2, AlertCircle, Check, Layers, Tag, Info } from 'lucide-react';
import { ProductVariant } from '@/types';
import { variantService } from '@/services/variantService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  // Format currency helper
  const formatPrice = (val: number | string | null | undefined) => {
    if (val === undefined || val === null) return 'N/A';
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return val;
    return num.toLocaleString('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-fluent-64 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 border border-slate-100 flex flex-col md:flex-row md:min-h-[450px]">
        
        {/* Left Panel: Product Identity & Details (Dark Tech Aesthetic) */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/50">
          <div>
            <div className="flex items-center gap-2 text-primary-light text-xs font-semibold tracking-wider uppercase mb-4">
              <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center gap-1">
                <Layers size={10} />
                Con Variantes
              </span>
            </div>
            
            <h2 className="text-xl font-black tracking-tight leading-tight line-clamp-3">
              {product.name || product.product_name}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1.5 uppercase tracking-wider">
              ID: {product.id}
            </p>

            <div className="mt-6 space-y-4">
              {/* Product Info Badges */}
              <div className="bg-slate-800/40 border border-slate-750/30 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Tag size={12} /> Precio Base:</span>
                  <span className="font-bold text-white">{formatPrice(product.price)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Package size={12} /> Stock Total:</span>
                  <span className={cn("font-bold", (product.stock || 0) > 0 ? "text-emerald-450" : "text-rose-450")}>
                    {product.stock || 0} {product.base_unit || 'unid'}
                  </span>
                </div>
                {product.taxRate !== undefined && (
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><Info size={12} /> IVA:</span>
                    <span className="font-bold text-white">{product.taxRate}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block mt-6">
            <p className="text-[10px] text-slate-550 leading-relaxed">
              Selecciona las opciones a la derecha para configurar la variante del producto y añadirla al carrito de ventas.
            </p>
          </div>
        </div>

        {/* Right Panel: Variant Selector and Options */}
        <div className="w-full md:w-3/5 flex flex-col justify-between bg-slate-50/50">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <h3 className="text-sm font-bold text-slate-800">Atributos del Producto</h3>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-655 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Selector Area */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[350px] md:max-h-[380px] space-y-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 text-sm">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Cargando variantes del catálogo...</span>
              </div>
            ) : variants.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                Este producto no tiene variantes registradas.
              </div>
            ) : attributeKeys.length === 0 ? (
              /* Fallback list for variants without structured attributes */
              <div className="space-y-3">
                {variants.map(v => {
                  const stock = v.stock_quantity || 0;
                  const isOutOfStock = stock <= 0;
                  return (
                    <div 
                      key={v.id} 
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                        isOutOfStock 
                          ? "bg-slate-100/70 border-slate-200/60 opacity-60" 
                          : "bg-white border-slate-150 hover:border-primary/40 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500 flex-shrink-0">
                          <Package size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{v.variant_name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5 truncate">{v.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800">{formatPrice(v.current_price)}</p>
                          <p className={cn(
                            "text-[10px] font-bold mt-0.5 uppercase",
                            isOutOfStock ? "text-rose-600" : "text-emerald-600"
                          )}>
                            Stock: {stock}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          disabled={isOutOfStock} 
                          onClick={() => onSelect(v, 1)} 
                          className="text-xs font-bold shadow-sm"
                        >
                          Añadir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Configurable Product Attributes */
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
                    <div key={attrKey} className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Seleccionar {attrKey}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {availableForThisAttr.map(val => {
                          const isSelected = selectedValue === val;
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
                              type="button"
                              onClick={() => handleAttributeSelect(attrKey, val)}
                              className={cn(
                                "px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 relative flex items-center gap-1.5",
                                isSelected
                                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                                  : hasStock
                                    ? "bg-white text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-slate-50/50"
                                    : "bg-slate-100 text-slate-400 border-slate-200/70 line-through cursor-not-allowed opacity-50"
                              )}
                              disabled={!hasStock && !isSelected}
                              title={!hasStock ? 'Sin stock disponible' : undefined}
                            >
                              {val}
                              {isSelected && (
                                <Check size={12} className="text-white flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Action Area */}
          <div className="p-6 border-t border-slate-100 bg-white space-y-4">
            {attributeKeys.length > 0 && (
              <div>
                {attributeKeys.every(k => selectedAttributes[k]) ? (
                  selectedVariant ? (
                    <div className={cn(
                      "p-4 rounded-xl border flex items-center justify-between transition-all",
                      (selectedVariant.stock_quantity || 0) > 0
                        ? "bg-emerald-50/40 border-emerald-100 text-emerald-800"
                        : "bg-rose-50/40 border-rose-100 text-rose-800"
                    )}>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm flex items-center gap-1.5">
                          {(selectedVariant.stock_quantity || 0) > 0 
                            ? <CheckCircle2 size={16} className="text-emerald-500" /> 
                            : <AlertCircle size={16} className="text-rose-500" />}
                          {selectedVariant.variant_name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">SKU: {selectedVariant.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-base font-black text-slate-850">
                          {formatPrice(selectedVariant.current_price)}
                        </p>
                        <p className={cn(
                          "text-[10px] font-bold mt-0.5 uppercase",
                          (selectedVariant.stock_quantity || 0) > 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          Stock: {selectedVariant.stock_quantity || 0}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center flex items-center justify-center gap-2">
                      <AlertCircle size={18} className="text-slate-400" />
                      <p className="text-xs font-semibold text-slate-600">Esta combinación no está disponible en catálogo.</p>
                    </div>
                  )
                ) : (
                  <div className="p-3.5 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/70 text-slate-500 text-xs">
                    Completa la selección de los atributos para ver disponibilidad.
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Botón Añadir Producto Principal */}
              <button
                type="button"
                onClick={() => onSelect({ id: null, variant_name: 'Producto Principal' }, 1)}
                className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Package size={14} className="text-slate-500" />
                Producto principal sin variante
              </button>

              {/* Botón Añadir Variante */}
              {attributeKeys.length > 0 && (
                <Button
                  className="flex-1 h-10 text-xs font-bold rounded-xl"
                  disabled={!selectedVariant || !selectedVariant.stock_quantity || selectedVariant.stock_quantity <= 0}
                  onClick={() => selectedVariant && onSelect(selectedVariant, 1)}
                >
                  Añadir variante seleccionada
                </Button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
