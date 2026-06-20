import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { variantService } from '@/services/variantService';
import { useToast } from '@/hooks/useToast';
import { useBranch } from '@/contexts/BranchContext';

interface VariantFormModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VariantFormModal({ productId, isOpen, onClose, onSuccess }: VariantFormModalProps) {
  const [loading, setLoading] = useState(false);
  const { currentBranchId } = useBranch();
  const toast = useToast();

  const [formData, setFormData] = useState({
    sku: '',
    color: '',
    talla: '',
    initial_stock: '',
    initial_price: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!formData.color && !formData.talla) {
      toast.error('Debe especificar al menos un atributo (color o talla)');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        variant_attributes: {},
      };

      if (formData.color) payload.variant_attributes.color = formData.color;
      if (formData.talla) payload.variant_attributes.talla = formData.talla;
      if (formData.sku) payload.sku = formData.sku;

      if (formData.initial_stock || formData.initial_price) {
        if (!currentBranchId) {
          toast.error('Debe seleccionar una sucursal activa para establecer stock o precio inicial.');
          setLoading(false);
          return;
        }
        if (!formData.initial_price) {
          toast.error('Debe especificar el precio inicial para poder registrar el stock inicial en la sucursal.');
          setLoading(false);
          return;
        }

        payload.stock_branch_id = currentBranchId;
        payload.initial_price = parseFloat(formData.initial_price);
        
        if (formData.initial_stock) {
          payload.initial_stock = parseFloat(formData.initial_stock);
        }
      }

      await variantService.createVariant(productId, payload);
      toast.success('Variante creada exitosamente');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la variante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Nueva Variante</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Color</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Ej. Rojo, Azul"
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Talla</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Ej. S, M, L, XL"
                value={formData.talla}
                onChange={e => setFormData({ ...formData, talla: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">SKU (Opcional)</label>
            <input 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono uppercase"
              placeholder="Auto-generado si se omite"
              value={formData.sku}
              onChange={e => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Precio Específico</label>
              <input 
                type="number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="Igual al padre si vacío"
                value={formData.initial_price}
                onChange={e => setFormData({ ...formData, initial_price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Stock Inicial</label>
              <input 
                type="number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="0"
                value={formData.initial_stock}
                onChange={e => setFormData({ ...formData, initial_stock: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" disabled={loading} onClick={handleSubmit}>
              <Save size={16} className="mr-2" />
              {loading ? 'Guardando...' : 'Guardar Variante'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
