import React from 'react';
import { Attribute } from '@/types/attribute';

const getTypeBadgeClass = (type: string) => {
  switch(type) {
    case 'LIST': return 'bg-secondary-container/30 text-on-secondary-container';
    case 'NUMBER': return 'bg-tertiary-container/10 text-tertiary';
    case 'STRING': return 'bg-surface-tint/10 text-surface-tint';
    case 'BOOLEAN': return 'bg-primary-fixed-dim/30 text-on-primary-fixed';
    default: return 'bg-secondary/10 text-secondary';
  }
};

interface AttributesTabProps {
  attributes: Attribute[];
  categories?: any[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedAttribute: Attribute | null;
  onSelectAttribute: (attr: Attribute | null) => void;
  onSaveAttribute?: (attr: Partial<Attribute>) => void;
  onDeleteAttribute?: (id: string | number) => void;
  loading?: boolean;
}

export const AttributesTab: React.FC<AttributesTabProps> = ({
  attributes,
  categories = [],
  searchTerm,
  onSearchChange,
  selectedAttribute,
  onSelectAttribute,
  onSaveAttribute,
  onDeleteAttribute,
  loading,
}) => {
  const [formData, setFormData] = React.useState<Partial<Attribute>>({});

  React.useEffect(() => {
    if (selectedAttribute) {
      setFormData(selectedAttribute);
    }
  }, [selectedAttribute]);

  const handleChange = (field: keyof Attribute, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'name' && (!prev.code || prev.id === 'new')) {
        // Autogenerate code if it's a new attribute (lowercase kebab-case)
        const sanitized = String(value)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        newData.code = sanitized;
      }
      return newData;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveAttribute) {
      const payload = { ...formData };
      if (payload.id === 'new') {
        delete payload.id;
      }
      onSaveAttribute(payload);
    }
  };

  const handleAddOption = () => {
    const opts = formData.options || [];
    setFormData(prev => ({ ...prev, options: [...opts, 'Nueva Opción'] }));
  };

  const handleRemoveOption = (index: number) => {
    const opts = formData.options || [];
    setFormData(prev => ({ ...prev, options: opts.filter((_, i) => i !== index) }));
  };

  const handleOptionChange = (index: number, val: string) => {
    const opts = [...(formData.options || [])];
    opts[index] = val;
    setFormData(prev => ({ ...prev, options: opts }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter h-full">
      {/* Left Card: Data Table */}
      <div className="lg:col-span-2 bg-surface-container-lowest rounded-[12px] p-lg shadow-sm border border-outline-variant/30 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-md">
          <h3 className="font-title-md text-title-md text-on-background">Atributos Registrados</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input 
              className="pl-[32px] pr-sm py-[6px] rounded bg-surface-container-low border-none text-body-md w-64 focus:ring-1 focus:ring-primary outline-none transition-all" 
              placeholder="Buscar atributo..." 
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead className="sticky top-0 bg-surface-container-low z-10 rounded-t-[12px]">
              <tr>
                <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md rounded-tl-[12px]">Nombre</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md">Código</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md">Tipo</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md text-center">Req.</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md text-center">Filt.</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant py-sm px-md rounded-tr-[12px]">Variante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {attributes.map(attr => (
                <tr 
                  key={attr.id}
                  onClick={() => onSelectAttribute(attr)}
                  className={`transition-colors duration-150 cursor-pointer group ${selectedAttribute?.id === attr.id ? 'bg-surface-container-low/50' : 'hover:bg-surface-container-low/50'}`}
                >
                  <td className="py-md px-md font-body-md text-on-background font-medium">{attr.name}</td>
                  <td className="py-md px-md font-data-mono text-data-mono text-secondary">{attr.code}</td>
                  <td className="py-md px-md">
                    <span className={`inline-flex items-center px-2 py-1 rounded font-label-caps text-label-caps ${getTypeBadgeClass(attr.type)}`}>
                      {attr.type}
                    </span>
                  </td>
                  <td className="py-md px-md text-center">
                    <span className={`material-symbols-outlined text-[20px] ${attr.isRequired ? 'text-primary' : 'text-outline-variant'}`}>
                      {attr.isRequired ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                  </td>
                  <td className="py-md px-md text-center">
                    <span className={`material-symbols-outlined text-[20px] ${attr.isFilterable ? 'text-primary' : 'text-outline-variant'}`}>
                      {attr.isFilterable ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                  </td>
                  <td className="py-md px-md">
                    {attr.isVariant && (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-[#059669]/10 text-[#059669] font-label-caps text-label-caps">TRUE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Card: Editor Form */}
      <div className="bg-surface-container-lowest rounded-[12px] p-lg shadow-sm border border-outline-variant/30 flex flex-col h-full">
        <div className="flex justify-between items-center mb-md border-b border-outline-variant/20 pb-sm">
          <h3 className="font-title-md text-title-md text-on-background">Editor de Atributo</h3>
          {selectedAttribute && selectedAttribute.id !== 'new' && (
            <div className="flex space-x-xs">
              <button 
                type="button"
                onClick={() => onDeleteAttribute && onDeleteAttribute(selectedAttribute.id)}
                className="p-1 text-on-surface-variant hover:text-error transition-colors rounded disabled:opacity-50"
                disabled={loading}
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          )}
        </div>
        
        {selectedAttribute ? (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-xs space-y-md custom-scrollbar">
            <div>
              <label className="block font-body-sm-bold text-body-sm-bold text-on-surface-variant mb-xs">Nombre</label>
              <input 
                className="w-full rounded bg-surface-container-lowest border border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary text-body-md px-sm py-[8px] outline-none" 
                type="text" 
                value={formData.name || ''} 
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-body-sm-bold text-body-sm-bold text-on-surface-variant mb-xs">
                Código <span className="font-normal text-outline text-[11px]">(Autogenerado)</span>
              </label>
              <input 
                className="w-full rounded bg-surface-container-low border border-transparent text-data-mono font-data-mono px-sm py-[8px] text-secondary outline-none" 
                readOnly 
                type="text" 
                value={formData.code || ''} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className="block font-body-sm-bold text-body-sm-bold text-on-surface-variant mb-xs">Tipo</label>
                <div className="relative">
                  <select 
                    className="w-full rounded bg-surface-container-lowest border border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary text-body-md px-sm py-[8px] appearance-none outline-none"
                    value={formData.type || 'STRING'}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    <option value="STRING">STRING</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="LIST">LIST</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
              <div>
                <label className="block font-body-sm-bold text-body-sm-bold text-on-surface-variant mb-xs">Categoría</label>
                <div className="relative">
                  <select 
                    className="w-full rounded bg-surface-container-lowest border border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary text-body-md px-sm py-[8px] appearance-none outline-none"
                    value={formData.category || 'General'}
                    onChange={(e) => handleChange('category', e.target.value)}
                  >
                    <option value="General">General (Sin categoría)</option>
                    {categories.length > 0 && <optgroup label="Categorías de Producto">
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            {formData.type === 'LIST' && (
              <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30">
                <label className="block font-body-sm-bold text-body-sm-bold text-on-background mb-sm flex justify-between items-center">
                  Opciones de Lista
                  <button onClick={handleAddOption} className="text-primary hover:text-primary-container flex items-center text-[11px]" type="button">
                    <span className="material-symbols-outlined text-[14px] mr-[2px]">add</span> Añadir
                  </button>
                </label>
                <div className="space-y-2">
                  {(formData.options || []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline cursor-grab text-[18px]">drag_indicator</span>
                      <input 
                        className="flex-1 rounded bg-surface-container-lowest border border-outline/20 text-body-md px-2 py-1 text-sm outline-none" 
                        type="text" 
                        value={opt} 
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                      />
                      <button onClick={() => handleRemoveOption(i)} type="button" className="text-outline hover:text-error"><span className="material-symbols-outlined text-[18px]">close</span></button>
                    </div>
                  ))}
                  {(!formData.options || formData.options.length === 0) && (
                    <p className="text-sm text-outline italic">No hay opciones definidas</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-y-sm gap-x-md pt-sm border-t border-outline-variant/20">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  checked={!!formData.isRequired} 
                  onChange={(e) => handleChange('isRequired', e.target.checked)}
                  className="rounded text-primary border-outline-variant focus:ring-primary w-4 h-4 bg-surface-container-lowest" 
                  type="checkbox" 
                />
                <span className="font-body-md text-on-background">Requerido</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  checked={!!formData.isFilterable}
                  onChange={(e) => handleChange('isFilterable', e.target.checked)}
                  className="rounded text-primary border-outline-variant focus:ring-primary w-4 h-4 bg-surface-container-lowest" 
                  type="checkbox" 
                />
                <span className="font-body-md text-on-background">Filtrable</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  checked={!!formData.isVisible}
                  onChange={(e) => handleChange('isVisible', e.target.checked)}
                  className="rounded text-primary border-outline-variant focus:ring-primary w-4 h-4 bg-surface-container-lowest" 
                  type="checkbox" 
                />
                <span className="font-body-md text-on-background">Visible</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  checked={!!formData.isVariant}
                  onChange={(e) => handleChange('isVariant', e.target.checked)}
                  className="rounded text-[#059669] border-outline-variant focus:ring-[#059669] w-4 h-4 bg-surface-container-lowest" 
                  type="checkbox" 
                />
                <span className="font-body-md text-on-background flex items-center">
                  Variante <span className="material-symbols-outlined text-outline ml-1 text-[14px]" title="Define un SKU">info</span>
                </span>
              </label>
            </div>
            
            <div className="pt-md mt-auto border-t border-outline-variant/20 flex justify-end space-x-sm shrink-0">
              <button onClick={() => onSelectAttribute(null)} type="button" className="px-md py-sm rounded bg-surface-container-low text-on-background font-body-sm-bold hover:bg-surface-variant transition-colors disabled:opacity-50" disabled={loading}>Cancelar</button>
              <button type="submit" className="px-md py-sm rounded btn-primary font-body-sm-bold hover:opacity-90 transition-opacity disabled:opacity-50" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-60">
            <span className="material-symbols-outlined text-[48px] mb-2">list_alt</span>
            <p className="text-body-md">Selecciona o crea un atributo</p>
          </div>
        )}
      </div>
    </div>
  );
};
