import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { ProductVariant } from '@/types';
import { variantService } from '@/services/variantService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';

export function VariantSelectorModal({ product, onClose, onSelect }: any) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (product) {
      setLoading(true);
      variantService.getVariantsByProductId(product.id, false)
        .then(data => setVariants(data))
        .catch(() => toast.error('Error al cargar variantes'))
        .finally(() => setLoading(false));
    }
  }, [product]);

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

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando variantes...</div>
          ) : variants.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Este producto no tiene variantes registradas.</div>
          ) : (
            <div className="space-y-3">
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
                      <Button 
                        size="sm" 
                        disabled={isOutOfStock} 
                        onClick={() => onSelect(v, 1)}
                        className="text-xs px-4"
                      >
                        Añadir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
