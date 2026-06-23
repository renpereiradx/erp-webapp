import React, { useState, useEffect } from 'react';
import { useVariants } from '@/hooks/useVariants';
import { VariantModal } from '@/components/modals/VariantModal';
import { Package, Search, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductVariantsManager({ productId, categoryId }: { productId: string; categoryId?: string | number }) {
  const { variants, searchTerm, setSearchTerm, toggleVariantStatus, createVariant, editVariant, setActiveProductId, loading } = useVariants();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variantToEdit, setVariantToEdit] = useState<any>(null);

  useEffect(() => {
    if (productId) {
      setActiveProductId(productId);
    }
  }, [productId, setActiveProductId]);

  const handleEdit = (variant: any) => {
    setVariantToEdit(variant);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    if (!productId) {
      alert('Debe guardar los datos básicos del producto antes de poder agregarle variantes.');
      return;
    }
    setVariantToEdit(null);
    setIsModalOpen(true);
  };

  const handleSaveVariant = async (data: any) => {
    if (variantToEdit) {
      await editVariant(variantToEdit.id, data);
    } else {
      await createVariant(data);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Actions Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar variantes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
            />
          </div>
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-1">
            <button type="button" className="p-1.5 rounded-md bg-secondary-container text-on-secondary-container shadow-sm">
              <LayoutGrid size={16} />
            </button>
            <button type="button" className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container">
              <List size={16} />
            </button>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-2.5 btn-primary text-white font-label-md text-label-md rounded-full hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Variante
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando variantes...</div>
      ) : !productId ? (
        <div className="p-12 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-lowest">
          <Package className="mx-auto text-outline-variant mb-4" size={32} />
          <h3 className="text-title-md font-bold text-on-surface mb-2">Guarde el producto primero</h3>
          <p className="text-body-sm text-on-surface-variant mb-6">Debe guardar los datos básicos de este producto antes de poder agregarle variantes.</p>
        </div>
      ) : variants.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-lowest">
          <Package className="mx-auto text-outline-variant mb-4" size={32} />
          <h3 className="text-title-md font-bold text-on-surface mb-2">Sin variantes configuradas</h3>
          <p className="text-body-sm text-on-surface-variant mb-6">Comienza a agregar combinaciones de atributos (ej. Color y Talla) para este producto.</p>
          <button 
            type="button"
            onClick={handleCreate}
            className="px-6 py-2 bg-secondary-container text-on-secondary-container font-label-md rounded-full hover:bg-secondary-container/80 transition-colors"
          >
            Agregar primera variante
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-surface-variant/30 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(19,127,236,0.05)] flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant">
                  <th className="py-md px-md font-label-md text-label-md text-on-surface-variant font-semibold rounded-tl-xl w-12">ESTADO</th>
                  <th className="py-md px-md font-label-md text-label-md text-on-surface-variant font-semibold">INFO VARIANTE</th>
                  <th className="py-md px-md font-label-md text-label-md text-on-surface-variant font-semibold">ATRIBUTOS</th>
                  <th className="py-md px-md font-label-md text-label-md text-on-surface-variant font-semibold text-right">STOCK</th>
                  <th className="py-md px-md font-label-md text-label-md text-on-surface-variant font-semibold text-right">PRECIO</th>
                  <th className="py-md px-md font-label-md text-label-md text-on-surface-variant font-semibold text-center rounded-tr-xl">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-surface-variant/50">
                {variants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-surface-bright shadow-[inset_2px_0_0_transparent] hover:shadow-[inset_2px_0_0_#005baf] transition-all duration-150 group">
                    <td className="py-sm px-md text-center">
                      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                          checked={variant.isActive} 
                          onChange={() => toggleVariantStatus(variant.id, variant.isActive)}
                          className={`toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out ${variant.isActive ? 'border-primary translate-x-[100%]' : 'border-outline-variant translate-x-0'}`} 
                          id={`toggle-${variant.id}`} 
                          type="checkbox"
                        />
                        <label 
                          htmlFor={`toggle-${variant.id}`} 
                          className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${variant.isActive ? 'bg-primary/20' : 'bg-surface-container-high'}`}
                        ></label>
                      </div>
                    </td>
                    <td className="py-sm px-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[20px]">style</span>
                        </div>
                        <div>
                          <p className="font-title-sm text-title-sm text-on-surface font-bold">{variant.name}</p>
                          <div className="flex items-center gap-xs mt-1">
                            <span className="font-label-sm text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/20">SKU: {variant.sku}</span>
                            <span className="font-label-sm text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/20 font-mono">BC: {variant.barcode}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-sm px-md">
                      <div className="flex flex-wrap gap-xs">
                        {variant.attributes.map((attr, idx) => (
                          <span 
                            key={idx} 
                            className={`font-label-sm text-[11px] px-2 py-1 rounded-full ${attr.bgColor} ${attr.color} border ${attr.borderColor}`}
                          >
                            <span className="opacity-70 mr-1 font-normal">{attr.name}:</span>
                            <span className="font-bold">{attr.value}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-sm px-md text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-data-tabular font-bold text-title-md ${variant.lowStock ? 'text-error' : 'text-on-surface'}`}>
                          {variant.stock}
                        </span>
                        {variant.lowStock && <span className="font-label-sm text-[10px] text-error flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">warning</span> Bajo</span>}
                      </div>
                    </td>
                    <td className="py-sm px-md text-right">
                      <span className="font-data-tabular font-bold text-title-md text-on-surface">
                        ${variant.price}
                      </span>
                    </td>
                    <td className="py-sm px-md">
                      <div className="flex items-center justify-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button"
                          onClick={() => handleEdit(variant)}
                          className="p-1.5 rounded-md text-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-colors" title="Editar Variante"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <VariantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleSaveVariant}
        product={{ id: productId, category_id: categoryId }}
        variantToEdit={variantToEdit}
      />
    </div>
  );
}
