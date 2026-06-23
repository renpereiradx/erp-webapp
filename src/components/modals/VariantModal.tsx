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
  const { currentBranch } = useBranch();

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
          // Filter ONLY variant attributes for the variant modal
          setDynamicAttributes(definitions.filter((d: any) => d.is_variant || d.isVariant));
        })
        .catch(console.error)
        .finally(() => {
          setAttributesLoaded(true);
        });
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (isOpen && variantToEdit) {
      setBarcode(variantToEdit.barcode || '');
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
        if (!currentBranch?.id) {
          alert("Debe tener una sucursal activa para configurar stock/precio.");
          setSubmitting(false);
          return;
        }

        payload.initial_price = numPrecio;
        payload.stock_branch_id = currentBranch.id;
        
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

  const erpInput = "w-full bg-surface-container-lowest border border-surface-container-low rounded-lg px-4 py-2 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";
  const erpLabel = "block font-label-md text-secondary mb-2 uppercase tracking-wider disabled:opacity-50";

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-level-2 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-surface-variant flex justify-between items-center bg-surface-container-lowest">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {variantToEdit ? 'Editar Variante' : 'Nueva Variante'}
          </h2>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error-container/20"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Section 1: Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={erpLabel} htmlFor="sku">SKU</label>
              <input 
                className={`${erpInput} font-data-tabular bg-surface-container-low text-on-surface-variant`} 
                disabled 
                id="sku" 
                placeholder="Auto-generado" 
                type="text" 
              />
            </div>
            <div>
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
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">barcode_scanner</span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-surface-variant my-4"></div>

          {/* Section 2: Attributes */}
          <div>
            <h3 className="font-title-md text-title-md text-on-surface mb-4">Atributos de Variante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dynamicAttributes.length === 0 ? (
                <div className="col-span-2 text-sm text-on-surface-variant italic">
                  No hay atributos de variante configurados para la categoría de este producto. Use atributos personalizados abajo.
                </div>
              ) : (
                dynamicAttributes.map((attr) => (
                  <div key={attr.id || attr.code}>
                    <label className={erpLabel} htmlFor={attr.slug || attr.code}>{attr.name}</label>
                    <input 
                      className={erpInput} 
                      id={attr.slug || attr.code}
                      placeholder={`Ej: ${attr.name}`}
                      value={attributeValues[attr.slug || attr.code] || ''}
                      onChange={(e) => setAttributeValues(prev => ({ ...prev, [attr.slug || attr.code]: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                ))
              )}
            </div>

            {/* CUSTOM ATTRIBUTES */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className={erpLabel}>Atributos Personalizados</label>
                <button 
                  type="button" 
                  className="text-xs text-primary font-bold hover:underline"
                  onClick={() => setCustomAttributes([...customAttributes, { key: '', value: '' }])}
                >
                  + Agregar atributo extra
                </button>
              </div>
              {customAttributes.map((attr, index) => (
                <div key={index} className="flex gap-4 mb-3 items-center">
                  <div className="flex-1">
                    <input
                      className={erpInput}
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
                      className={erpInput}
                      placeholder="Valor (ej. Rojo)"
                      value={attr.value}
                      onChange={e => {
                        const newAttrs = [...customAttributes];
                        newAttrs[index].value = e.target.value;
                        setCustomAttributes(newAttrs);
                      }}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="p-2 text-outline-variant hover:text-error transition-colors"
                    onClick={() => {
                      const newAttrs = customAttributes.filter((_, i) => i !== index);
                      setCustomAttributes(newAttrs);
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-surface-variant my-2"></div>

          {/* Section 3: Inventory & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-3">
              <label className={erpLabel} htmlFor="sucursal">Sucursal de Origen</label>
                <select 
                  className={`${erpInput} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23717785%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_16px_center] bg-[length:20px]`} 
                  id="sucursal"
                  value={currentBranch?.id || ''}
                  disabled
                >
                <option value="central">Sucursal Central</option>
                <option value="norte">Almacén Norte</option>
              </select>
            </div>
            <div>
              <label className={erpLabel} htmlFor="stock">Stock Inicial (Opcional)</label>
              <input 
                className={`${erpInput} font-data-tabular text-right`} 
                id="stock" 
                min="0" 
                placeholder="Ej: 100"
                type="number" 
                value={stock} 
                onChange={(e) => setStock(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className={erpLabel} htmlFor="precio">Precio Inicial (Opcional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-data-tabular text-outline-variant">$</span>
                <input 
                  className={`${erpInput} font-data-tabular pl-8`} 
                  id="precio" 
                  placeholder="Igual al padre si vacío" 
                  step="0.01" 
                  type="number" 
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Actions) */}
        <div className="px-8 py-6 bg-surface-container-low border-t border-surface-variant flex justify-end gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="px-8 py-2 font-label-md text-label-md text-secondary hover:text-primary hover:bg-secondary-fixed/50 rounded-xl transition-colors border border-transparent"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2 font-label-md text-label-md text-on-primary bg-gradient-to-r from-primary to-primary-container rounded-xl shadow-sm hover:shadow-md hover:opacity-95 transition-all disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : (variantToEdit ? 'Guardar Cambios' : 'Crear Variante')}
          </button>
        </div>

      </div>
    </div>
  );
};
