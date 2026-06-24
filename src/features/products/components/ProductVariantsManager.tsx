import React, { useState, useEffect } from 'react';
import { useVariants } from '@/hooks/useVariants';
import { VariantModal } from '@/components/modals/VariantModal';
import { Package, Search, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductVariantsManager({ productId, categoryId, compact = false }: { productId: string; categoryId?: string | number; compact?: boolean }) {
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

  // Dinamic styles based on compact prop
  const gapClass = compact ? "gap-4" : "gap-6";
  const headerGapClass = compact ? "gap-3" : "gap-4";
  const searchInputClass = compact 
    ? "pl-8 pr-3 py-1 bg-surface-container-lowest border border-outline-variant/30 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-52 h-8"
    : "pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 h-10";
  const searchIconSize = compact ? 14 : 18;
  const searchIconClass = compact 
    ? "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[16px]"
    : "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]";
  const gridButtonPadding = compact ? "p-1 rounded shadow-xs" : "p-1.5 rounded-md bg-secondary-container text-on-secondary-container shadow-sm";
  const gridButtonSize = compact ? 14 : 16;
  const listButtonPadding = compact ? "p-1 rounded" : "p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container";
  const listButtonSize = compact ? 14 : 16;
  const createButtonClass = compact
    ? "flex items-center gap-1.5 px-4 py-1.5 btn-primary text-white font-label-sm text-xs rounded-full hover:opacity-90 transition-opacity shadow-xs whitespace-nowrap h-8"
    : "flex items-center gap-2 px-6 py-2.5 btn-primary text-white font-label-md text-label-md rounded-full hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap h-10";
  const createButtonIconTextSize = compact ? "text-[15px]" : "text-[18px]";
  const loadingPadding = compact ? "p-6 text-xs" : "p-8 text-sm";
  
  const emptyContainerPadding = compact ? "p-8 rounded-xl" : "p-12 rounded-2xl";
  const emptyIconSize = compact ? 24 : 32;
  const emptyTitleClass = compact ? "text-sm font-bold text-on-surface mb-1" : "text-title-md font-bold text-on-surface mb-2";
  const emptyTextClass = compact ? "text-xs text-on-surface-variant mb-4" : "text-body-sm text-on-surface-variant mb-6";
  const emptyButtonClass = compact
    ? "px-4 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-full hover:bg-secondary-container/80 transition-colors"
    : "px-6 py-2 bg-secondary-container text-on-secondary-container font-label-md rounded-full hover:bg-secondary-container/80 transition-colors";

  const tableShadowClass = compact 
    ? "bg-surface-container-lowest border border-surface-variant/30 rounded-lg overflow-hidden shadow-[0_2px_10px_rgba(19,127,236,0.02)] flex flex-col"
    : "bg-surface-container-lowest border border-surface-variant/30 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(19,127,236,0.05)] flex flex-col";
  const tableTextSizeClass = compact ? "text-xs" : "text-sm";
  const tableMinWClass = compact ? "min-w-[700px]" : "min-w-[900px]";
  const thPaddingClass = compact ? "py-1.5 px-3" : "py-md px-md";
  const thTextSizeClass = compact ? "text-[10px] tracking-wider font-semibold" : "font-label-md text-label-md font-semibold";
  const thRadiusLeftClass = compact ? "rounded-tl-lg" : "rounded-tl-xl";
  const thRadiusRightClass = compact ? "rounded-tr-lg" : "rounded-tr-xl";
  const tdPaddingClass = compact ? "py-1.5 px-3" : "py-sm px-md";
  const toggleWrapperWidth = compact ? "w-8" : "w-10 mr-2";
  const toggleInputClass = compact
    ? "toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-3 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
    : "toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out";
  const toggleLabelClass = compact
    ? "toggle-label block overflow-hidden h-4 rounded-full cursor-pointer transition-colors duration-200 ease-in-out"
    : "toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ease-in-out";
  const iconWrapperSizeClass = compact ? "w-7 h-7" : "w-10 h-10";
  const iconTextSizeClass = compact ? "text-[15px]" : "text-[20px]";
  const variantNameClass = compact ? "font-bold text-xs text-on-surface" : "font-title-sm text-title-sm text-on-surface font-bold";
  const badgeTextSizeClass = compact ? "text-[9px] px-1 py-0.2" : "font-label-sm text-[11px] px-1.5 py-0.5";
  const attrBadgeClass = compact 
    ? "text-[9px] px-1.5 py-0.5 rounded-md"
    : "font-label-sm text-[11px] px-2 py-1 rounded-md text-[11px] border border-secondary-container";
  const attrBadgeNameOpacity = compact ? "opacity-70 mr-0.5 font-normal" : "opacity-70 mr-1 font-normal";
  const numericTextClass = compact 
    ? "font-data-tabular font-bold text-xs"
    : "font-data-tabular font-bold text-title-md text-on-surface";
  const lowStockBadgeClass = compact
    ? "text-[8px] text-error flex items-center gap-0.5 font-semibold"
    : "font-label-sm text-[10px] text-error flex items-center gap-0.5";
  const lowStockIconSize = compact ? "text-[9px]" : "text-[12px]";
  const editButtonPaddingClass = compact ? "p-1 rounded text-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-colors" : "p-1.5 rounded-md text-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-colors";
  const editIconSize = compact ? "text-[15px]" : "text-[18px]";
  const hoverRowStyle = compact 
    ? "hover:bg-slate-50/50 shadow-[inset_2px_0_0_transparent] hover:shadow-[inset_2px_0_0_#005baf] transition-all duration-150 group"
    : "hover:bg-surface-bright shadow-[inset_2px_0_0_transparent] hover:shadow-[inset_2px_0_0_#005baf] transition-all duration-150 group";

  return (
    <div className={`flex flex-col ${gapClass}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between ${headerGapClass}`}>
        {/* Actions Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className={searchIconClass}>
              <Search size={searchIconSize} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar variantes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={searchInputClass}
            />
          </div>
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-0.5">
            <button type="button" className={gridButtonPadding}>
              <LayoutGrid size={gridButtonSize} />
            </button>
            <button type="button" className={listButtonPadding}>
              <List size={listButtonSize} />
            </button>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleCreate}
          className={createButtonClass}
        >
          <span className={`material-symbols-outlined ${createButtonIconTextSize}`}>add</span>
          Nueva Variante
        </button>
      </div>

      {loading ? (
        <div className={`text-center text-slate-400 ${loadingPadding}`}>Cargando variantes...</div>
      ) : !productId ? (
        <div className={`text-center border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest ${emptyContainerPadding}`}>
          <Package className="mx-auto text-outline-variant mb-2" size={emptyIconSize} />
          <h3 className={emptyTitleClass}>Guarde el producto primero</h3>
          <p className={emptyTextClass}>Debe guardar los datos básicos de este producto antes de poder agregarle variantes.</p>
        </div>
      ) : variants.length === 0 ? (
        <div className={`text-center border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest ${emptyContainerPadding}`}>
          <Package className="mx-auto text-outline-variant mb-2" size={emptyIconSize} />
          <h3 className={emptyTitleClass}>Sin variantes configuradas</h3>
          <p className={emptyTextClass}>Comienza a agregar combinaciones de atributos (ej. Color y Talla) para este producto.</p>
          <button 
            type="button"
            onClick={handleCreate}
            className={emptyButtonClass}
          >
            Agregar primera variante
          </button>
        </div>
      ) : (
        <div className={tableShadowClass}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className={`w-full ${tableMinWClass} text-left border-collapse ${tableTextSizeClass}`}>
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant">
                  <th className={`${thPaddingClass} ${thTextSizeClass} text-on-surface-variant ${thRadiusLeftClass} w-12`}>ESTADO</th>
                  <th className={`${thPaddingClass} ${thTextSizeClass} text-on-surface-variant`}>INFO VARIANTE</th>
                  <th className={`${thPaddingClass} ${thTextSizeClass} text-on-surface-variant`}>ATRIBUTOS</th>
                  <th className={`${thPaddingClass} ${thTextSizeClass} text-on-surface-variant text-right`}>STOCK</th>
                  <th className={`${thPaddingClass} ${thTextSizeClass} text-on-surface-variant text-right`}>PRECIO</th>
                  <th className={`${thPaddingClass} ${thTextSizeClass} text-on-surface-variant text-center ${thRadiusRightClass} w-16`}>ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-on-surface divide-y divide-surface-variant/30">
                {variants.map((variant) => (
                  <tr key={variant.id} className={hoverRowStyle}>
                    <td className={`${tdPaddingClass} text-center`}>
                      <div className={`relative inline-block align-middle select-none transition duration-200 ease-in ${toggleWrapperWidth}`}>
                        <input 
                          checked={variant.isActive} 
                          onChange={() => toggleVariantStatus(variant.id, variant.isActive)}
                          className={`${toggleInputClass} ${variant.isActive ? 'border-primary translate-x-[100%]' : 'border-outline-variant translate-x-0'}`} 
                          id={`toggle-${variant.id}`} 
                          type="checkbox"
                        />
                        <label 
                          htmlFor={`toggle-${variant.id}`} 
                          className={`${toggleLabelClass} ${variant.isActive ? 'bg-primary/20' : 'bg-surface-container-high'}`}
                        ></label>
                      </div>
                    </td>
                    <td className={tdPaddingClass}>
                      <div className="flex items-center gap-2">
                        <div className={`rounded bg-surface-container flex items-center justify-center text-primary shrink-0 ${iconWrapperSizeClass}`}>
                          <span className={`material-symbols-outlined ${iconTextSizeClass}`}>style</span>
                        </div>
                        <div>
                          <p className={variantNameClass}>{variant.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`bg-slate-100 text-slate-500 rounded-md border border-slate-200/50 font-data-tabular ${badgeTextSizeClass}`}>SKU: {variant.sku}</span>
                            <span className={`bg-slate-100 text-slate-500 rounded-md border border-slate-200/50 font-data-tabular ${badgeTextSizeClass}`}>BC: {variant.barcode}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={tdPaddingClass}>
                      <div className="flex flex-wrap gap-1">
                        {variant.attributes.map((attr, idx) => (
                          <span 
                            key={idx} 
                            className={`${attrBadgeClass} ${attr.bgColor} ${attr.color} border ${attr.borderColor}`}
                          >
                            <span className={attrBadgeNameOpacity}>{attr.name}:</span>
                            <span className="font-bold">{attr.value}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`${tdPaddingClass} text-right`}>
                      <div className="flex flex-col items-end">
                        <span className={`${numericTextClass} ${variant.lowStock ? 'text-error' : ''}`}>
                          {variant.stock}
                        </span>
                        {variant.lowStock && (
                          <span className={lowStockBadgeClass}>
                            <span className={`material-symbols-outlined ${lowStockIconSize}`}>warning</span> Bajo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`${tdPaddingClass} text-right`}>
                      <span className={numericTextClass}>
                        ${variant.price}
                      </span>
                    </td>
                    <td className={`${tdPaddingClass} text-center`}>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button"
                          onClick={() => handleEdit(variant)}
                          className={editButtonPaddingClass}
                          title="Editar Variante"
                        >
                          <span className={`material-symbols-outlined ${editIconSize}`}>edit</span>
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
