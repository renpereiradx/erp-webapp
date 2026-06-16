import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { variantService } from '@/services/variantService';
import { ProductVariant } from '@/types';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { VariantFormModal } from './VariantFormModal';

export function ProductVariantsManager({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const loadVariants = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await variantService.getVariantsByProductId(productId);
      setVariants(data);
    } catch (error) {
      toast.error('Error al cargar variantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [productId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-800">Variantes Registradas ({variants.length})</h4>
        <Button type="button" size="sm" variant="outline" className="text-xs h-8 px-3" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} className="mr-1" /> Nueva Variante
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">
          <RefreshCw className="animate-spin mx-auto mb-2" /> Cargando...
        </div>
      ) : variants.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-500 mb-3">No hay variantes registradas para este producto.</p>
          <Button type="button" size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} className="mr-1" /> Crear Primera Variante
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Nombre / SKU</th>
                <th className="px-4 py-3">Atributos</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variants.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {v.variant_name}
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{v.sku}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(v.variant_attributes || {}).map(([k, val]) => (
                        <span key={k} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] rounded text-slate-600 font-bold uppercase">
                          {k}: {val as React.ReactNode}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {v.current_price ? `$${v.current_price.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${v.stock_quantity && v.stock_quantity > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {v.stock_quantity || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button type="button" className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Editar Variante"><Edit2 size={14} /></button>
                      <button type="button" className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded transition-colors" title="Eliminar Variante"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VariantFormModal 
        productId={productId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          loadVariants();
        }} 
      />
    </div>
  );
}
