import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { variantService } from '@/services/variantService';
import { attributeService } from '@/services/attributeService';
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
    initial_stock: '',
    initial_price: ''
  });

  const [attributes, setAttributes] = useState<any[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [customAttributes, setCustomAttributes] = useState<Array<{key: string, value: string}>>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  useEffect(() => {
    let ignore = false;
    
    if (!isOpen || !productId) return;

    const fetchAttributes = async () => {
      setLoadingAttributes(true);
      try {
        const attrData = await attributeService.getApplicableAttributes(productId);
        if (!ignore) {
           setAttributes(Array.isArray(attrData) ? attrData : []);
        }
      } catch (err) {
        if (!ignore) {
           console.error("No se pudieron cargar atributos dinámicos", err);
        }
      } finally {
        if (!ignore) setLoadingAttributes(false);
      }
    };
    
    fetchAttributes();
    
    return () => { ignore = true; };
  }, [productId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const hasDynamicValues = Object.values(dynamicValues).some(v => typeof v === 'string' && v.trim() !== '');
    const hasCustomAttributes = customAttributes.some(a => a.key.trim() !== '' && a.value.trim() !== '');

    if (!hasDynamicValues && !hasCustomAttributes) {
      toast.error('Debe especificar al menos un atributo para la variante');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        variant_attributes: { ...dynamicValues },
      };

      // Add custom attributes
      customAttributes.forEach(attr => {
        if (attr.key.trim() && attr.value.trim()) {
          payload.variant_attributes[attr.key.trim().toLowerCase()] = attr.value.trim();
        }
      });

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
            {loadingAttributes ? (
              <div className="col-span-2 text-center py-2 text-slate-400 text-xs">
                <RefreshCw className="animate-spin mx-auto mb-1" size={14} /> Cargando atributos de categoría...
              </div>
            ) : (
              attributes.map(attr => (
                <div key={attr.code || attr.id} className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">{attr.name}</label>
                  {attr.data_type === 'LIST' && attr.options ? (
                    <select 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      value={dynamicValues[attr.code] || ''}
                      onChange={e => setDynamicValues({ ...dynamicValues, [attr.code]: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {attr.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      placeholder={`Ej. Valor para ${attr.name}`}
                      value={dynamicValues[attr.code] || ''}
                      onChange={e => setDynamicValues({ ...dynamicValues, [attr.code]: e.target.value })}
                    />
                  )}
                </div>
              ))
            )}

            {/* CUSTOM ATTRIBUTES */}
            <div className="col-span-2 mt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-600">Atributos Personalizados</label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] text-primary hover:bg-primary/10"
                  onClick={() => setCustomAttributes([...customAttributes, { key: '', value: '' }])}
                >
                  + Agregar atributo
                </Button>
              </div>
              {customAttributes.length === 0 && attributes.length === 0 && !loadingAttributes && (
                 <p className="text-[10px] text-slate-400 mb-2 italic">Agregue atributos específicos (ej: Conectividad, RAM) para diferenciar esta variante.</p>
              )}
              {customAttributes.map((attr, index) => (
                <div key={index} className="flex gap-2 mb-2 items-start">
                  <div className="flex-1">
                    <input
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Nombre (ej. Color)"
                      value={attr.key}
                      onChange={e => {
                        const newAttrs = [...customAttributes];
                        newAttrs[index].key = e.target.value;
                        setCustomAttributes(newAttrs);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Valor (ej. Rojo)"
                      value={attr.value}
                      onChange={e => {
                        const newAttrs = [...customAttributes];
                        newAttrs[index].value = e.target.value;
                        setCustomAttributes(newAttrs);
                      }}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="p-2 text-slate-400 hover:text-error"
                    onClick={() => {
                      const newAttrs = customAttributes.filter((_, i) => i !== index);
                      setCustomAttributes(newAttrs);
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
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
