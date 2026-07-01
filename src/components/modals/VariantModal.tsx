import React, { useState, useEffect } from 'react';
import { useBranch } from '../../contexts/BranchContext';
import { attributeService } from '../../services/attributeService';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
  product?: any;
  variantToEdit?: any;
}

export const VariantModal: React.FC<VariantModalProps> = ({ isOpen, onClose, onCreate, product, variantToEdit }) => {
  const [barcode, setBarcode] = useState('');
  const [stock, setStock] = useState<number | string>('');
  const [precio, setPrecio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [customAttributes, setCustomAttributes] = useState<Array<{key: string, value: string}>>([]);
  const [attributesLoaded, setAttributesLoaded] = useState(false);
  const { currentBranchId } = useBranch();

  useEffect(() => {
    if (isOpen) {
      setAttributesLoaded(false);
      let fetchPromise;
      
      if (product?.category_id) {
        fetchPromise = attributeService.getCategoryAttributes(product.category_id);
      } else if (product?.id) {
        fetchPromise = attributeService.getApplicableAttributes(product.id);
      } else {
        setDynamicAttributes([]);
        setAttributesLoaded(true);
        return;
      }

      fetchPromise
        .then((res: any) => {
          const definitions = Array.isArray(res) ? res : (res?.data || []);
          // Filter ONLY variant attributes for the variant modal, fallback to all if none marked
          const variantsOnly = definitions.filter((d: any) => d.is_variant || d.isVariant);
          setDynamicAttributes(variantsOnly.length > 0 ? variantsOnly : definitions);
        })
        .catch(console.error)
        .finally(() => {
          setAttributesLoaded(true);
        });
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (isOpen && variantToEdit) {
      setBarcode(variantToEdit.barcode && variantToEdit.barcode !== '-' ? variantToEdit.barcode : '');
      setStock(variantToEdit.stock_quantity || variantToEdit.stock || '');
      setPrecio(variantToEdit.current_price || variantToEdit.price || '');
      
      if (attributesLoaded) {
        const attrs = variantToEdit.raw_attributes || variantToEdit.variant_attributes || {};
        const dynValues: Record<string, string> = {};
        const custAttrs: Array<{key: string, value: string}> = [];
        
        const dynKeys = dynamicAttributes.map((d: any) => (d.slug || d.code).toLowerCase());
        
        Object.entries(attrs).forEach(([k, v]) => {
          if (dynKeys.includes(k.toLowerCase())) {
            dynValues[k.toLowerCase()] = String(v);
          } else {
            custAttrs.push({ key: k, value: String(v) });
          }
        });
        
        setAttributeValues(dynValues);
        setCustomAttributes(custAttrs);
      }
    } else if (isOpen) {
      setBarcode('');
      setStock('');
      setPrecio('');
      setAttributeValues({});
      setCustomAttributes([]);
    }
  }, [isOpen, variantToEdit, attributesLoaded, dynamicAttributes]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const hasDynamicValues = Object.values(attributeValues).some(v => typeof v === 'string' && v.trim() !== '');
    const hasCustomAttributes = customAttributes.some(a => a.key.trim() !== '' && a.value.trim() !== '');

    if (!hasDynamicValues && !hasCustomAttributes) {
      alert('Debe especificar al menos un atributo para la variante');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload: any = {
        variant_attributes: { ...attributeValues },
      };

      if (barcode) {
        payload.barcode = barcode;
      }

      const numPrecio = Number(precio);
      const numStock = Number(stock);

      if (precio !== '' || (stock !== '' && numStock > 0)) {
        if (!precio) {
          alert("Debe especificar el precio si define un stock inicial.");
          setSubmitting(false);
          return;
        }
        if (!currentBranchId) {
          alert("Debe tener una sucursal activa para configurar stock/precio.");
          setSubmitting(false);
          return;
        }

        payload.initial_price = numPrecio;
        payload.stock_branch_id = currentBranchId;
        
        if (stock !== '') {
          payload.initial_stock = numStock;
        }
      }

      customAttributes.forEach(attr => {
        if (attr.key.trim() && attr.value.trim()) {
          payload.variant_attributes[attr.key.trim().toLowerCase()] = attr.value.trim();
        }
      });

      await onCreate(payload);
      // Reset form
      setBarcode('');
      setAttributeValues({});
      setCustomAttributes([]);
      setStock('');
      setPrecio('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const erpInput = "w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-body-md text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";
  const erpLabel = "block text-[10px] font-bold text-secondary mb-1.5 uppercase tracking-wider disabled:opacity-50";

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-level-2 overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-3 border-b border-surface-variant flex justify-between items-center bg-surface-container-lowest">
          <h2 className="font-bold text-base text-on-surface">
            {variantToEdit ? 'Editar Variante' : 'Nueva Variante'}
          </h2>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-full hover:bg-error-container/20"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Columna Izquierda: Identificación e Inventario */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className={erpLabel} htmlFor="sku">SKU</label>
                  <input 
                    className={`${erpInput} font-data-tabular bg-surface-container-low text-on-surface-variant`} 
                    disabled 
                    id="sku" 
                    placeholder="Auto" 
                    type="text" 
                  />
                </div>
                <div className="col-span-2">
                  <label className={erpLabel} htmlFor="barcode">Código de Barras</label>
                  <div className="relative">
                    <input 
                      className={`${erpInput} font-data-tabular pr-10`} 
                      id="barcode" 
                      placeholder="Escanear o ingresar" 
                      type="text" 
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      disabled={submitting}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-base">barcode_scanner</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-surface-variant/30 pt-1"></div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={erpLabel} htmlFor="sucursal">Sucursal</label>
                  <select 
                    className={`${erpInput} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23717785%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center] bg-[length:14px]`} 
                    id="sucursal"
                    value={currentBranchId || ''}
                    disabled
                  >
                    <option value="central">Central</option>
                    <option value="norte">Norte</option>
                  </select>
                </div>
                <div>
                  <label className={erpLabel} htmlFor="stock">Stock Inicial</label>
                  <input 
                    className={`${erpInput} font-data-tabular text-right`} 
                    id="stock" 
                    min="0" 
                    placeholder="Opcional"
                    type="number" 
                    value={stock} 
                    onChange={(e) => setStock(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
              
              <div className="mt-3">
                <label className={erpLabel} htmlFor="precio">Precio Inicial</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-data-tabular text-outline-variant text-xs">$</span>
                  <input 
                    className={`${erpInput} font-data-tabular pl-7`} 
                    id="precio" 
                    placeholder="Padre" 
                    step="0.01" 
                    type="number" 
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Atributos */}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-xs text-secondary uppercase tracking-wider mb-2.5">Atributos de Variante</h3>
                <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {dynamicAttributes.length === 0 ? (
                    <div className="text-xs text-on-surface-variant italic col-span-2">
                      No hay atributos de variante en la categoría.
                    </div>
                  ) : (
                    dynamicAttributes.map((attr) => (
                      <div key={attr.id || attr.code} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor={attr.slug || attr.code}>{attr.name}</label>
                        <input 
                          className={erpInput} 
                          id={attr.slug || attr.code}
                          placeholder={`Valor`}
                          value={attributeValues[attr.slug || attr.code] || ''}
                          onChange={(e) => setAttributeValues(prev => ({ ...prev, [attr.slug || attr.code]: e.target.value }))}
                          disabled={submitting}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="border-t border-surface-variant/30 pt-1"></div>
              
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider">Atributos Personalizados</label>
                  <button 
                    type="button" 
                    className="text-[10px] text-primary font-bold hover:underline"
                    onClick={() => setCustomAttributes([...customAttributes, { key: '', value: '' }])}
                  >
                    + Agregar atributo extra
                  </button>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {customAttributes.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No se han añadido atributos personalizados.</div>
                  ) : (
                    customAttributes.map((attr, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <input 
                            className={erpInput}
                            placeholder="Nombre"
                            value={attr.key}
                            onChange={e => {
                              const newAttrs = [...customAttributes];
                              newAttrs[index].key = e.target.value;
                              setCustomAttributes(newAttrs);
                            }}
                            disabled={submitting}
                          />
                        </div>
                        <div className="flex-1">
                          <input 
                            className={erpInput}
                            placeholder="Valor"
                            value={attr.value}
                            onChange={e => {
                              const newAttrs = [...customAttributes];
                              newAttrs[index].value = e.target.value;
                              setCustomAttributes(newAttrs);
                            }}
                            disabled={submitting}
                          />
                        </div>
                        <button 
                          type="button" 
                          className="p-1.5 text-outline-variant hover:text-error transition-colors shrink-0"
                          onClick={() => {
                            const newAttrs = customAttributes.filter((_, i) => i !== index);
                            setCustomAttributes(newAttrs);
                          }}
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer (Actions) */}
        <div className="px-6 py-3.5 bg-surface-container-low border-t border-surface-variant flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-secondary hover:text-primary hover:bg-slate-200/50 rounded-lg transition-colors border border-transparent"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-1.5 text-xs font-bold text-on-primary bg-gradient-to-r from-primary to-primary-container rounded-lg shadow-xs hover:shadow-sm hover:opacity-95 transition-all disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : (variantToEdit ? 'Guardar Cambios' : 'Crear Variante')}
          </button>
        </div>

      </div>
    </div>
  );
};
