import React, { useState } from 'react';
import { Tag } from '@/types/tag';
import { IconPickerModal } from '../modals/IconPickerModal';

interface TagsTabProps {
  tags: Tag[];
  categories?: any[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedTag: Tag | null;
  onSelectTag: (tag: Tag | null) => void;
  onSaveTag?: (tag: Partial<Tag>) => void;
  onDeleteTag?: (id: string | number) => void;
  loading?: boolean;
}

export const TagsTab: React.FC<TagsTabProps> = ({
  tags,
  categories = [],
  searchTerm,
  onSearchChange,
  selectedTag,
  onSelectTag,
  onSaveTag,
  onDeleteTag,
  loading,
}) => {
  const [formData, setFormData] = React.useState<Partial<Tag>>({});
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  React.useEffect(() => {
    if (selectedTag) {
      setFormData(selectedTag);
    }
  }, [selectedTag]);

  const handleChange = (field: keyof Tag, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'name' && (!prev.slug || prev.id === 'new')) {
        const sanitized = String(value)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        newData.slug = sanitized;
      }
      return newData;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveTag) {
      const payload = { ...formData };
      if (payload.id === 'new') {
        delete payload.id;
      }
      onSaveTag(payload);
    }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
      {/* Left Card: Data Table */}
      <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-level-1 p-lg border border-outline-variant/30 h-[600px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-title-md text-title-md text-on-surface font-bold">Etiquetas Activas</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input 
              className="pl-9 pr-4 py-1.5 border border-outline-variant/50 rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest w-full max-w-[200px] transition-all" 
              placeholder="Buscar etiqueta..." 
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 bg-surface-container-low z-10">
              <tr className="text-on-surface-variant font-label-caps text-label-caps">
                <th className="px-4 py-3 rounded-tl-lg font-bold">Nombre</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold">Color</th>
                <th className="px-4 py-3 font-bold">Icono</th>
                <th className="px-4 py-3 font-bold">Tipo</th>
                <th className="px-4 py-3 rounded-tr-lg font-bold">Categoría</th>
              </tr>
            </thead>
            <tbody className="font-body-md divide-y divide-outline-variant/10">
              {tags.map(tag => (
                <tr 
                  key={tag.id} 
                  onClick={() => onSelectTag(tag)}
                  className={`transition-colors duration-150 cursor-pointer group ${selectedTag?.id === tag.id ? 'bg-surface-container-low/50' : 'hover:bg-surface-container-low/50'}`}
                >
                  <td className="px-4 py-3 text-on-surface font-medium">{tag.name}</td>
                  <td className="px-4 py-3 font-data-mono text-data-mono text-secondary text-sm">{tag.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-outline-variant/30" style={{ backgroundColor: tag.color }}></div>
                      <span className="font-data-mono text-[12px] text-outline">{tag.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">{tag.icon}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded bg-primary/10 text-primary font-label-caps text-[10px] font-bold`}>
                      {tag.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{tag.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Card: Form */}
      <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-level-1 p-lg border border-outline-variant/30 flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-sm">
          <h3 className="font-title-md text-title-md text-on-surface font-bold">
            {selectedTag?.id === 'new' ? 'Nueva Etiqueta' : 'Editor de Etiqueta'}
          </h3>
          {selectedTag && selectedTag.id !== 'new' && (
            <div className="flex space-x-xs">
              <button 
                type="button"
                onClick={() => onDeleteTag && onDeleteTag(selectedTag.id)}
                className="p-1 text-on-surface-variant hover:text-error transition-colors rounded disabled:opacity-50"
                disabled={loading}
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          )}
        </div>
        
        {selectedTag ? (
          <form onSubmit={handleSave} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div>
              <label className="block font-body-sm-bold text-body-sm-bold text-on-surface mb-1">Nombre</label>
              <input 
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-body-md px-3 py-2 outline-none transition-all" 
                placeholder="Ej. Black Friday" 
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
          <div>
            <label className="block font-body-sm-bold text-body-sm-bold text-on-surface mb-1">Slug</label>
            <input 
              className="w-full rounded-lg bg-surface-container-low border border-transparent text-secondary font-data-mono px-3 py-2 outline-none text-sm" 
              placeholder="black-friday" 
              type="text" 
              readOnly
              value={formData.slug || ''}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body-sm-bold text-body-sm-bold text-on-surface mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input 
                  className="w-10 h-10 rounded border border-outline-variant/50 p-0 cursor-pointer shrink-0" 
                  type="color" 
                  value={formData.color || '#137fec'}
                  onChange={(e) => handleChange('color', e.target.value)}
                />
                <input 
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-data-mono px-3 py-2 outline-none text-sm focus:border-primary" 
                  value={formData.color || '#137fec'}
                  onChange={(e) => handleChange('color', e.target.value)}
                  type="text" 
                />
              </div>
            </div>
            <div>
              <label className="block font-body-sm-bold text-body-sm-bold text-on-surface mb-1">Icono</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="w-10 h-10 shrink-0 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/50 flex items-center justify-center transition-colors text-on-surface-variant focus:border-primary"
                  title="Seleccionar icono"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {formData.icon || 'local_offer'}
                  </span>
                </button>
                <input 
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-data-mono px-3 py-2 outline-none text-sm focus:border-primary cursor-pointer" 
                  value={formData.icon || 'local_offer'}
                  onClick={() => setIsIconPickerOpen(true)}
                  readOnly
                  type="text" 
                  placeholder="Click para seleccionar..."
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body-sm-bold text-body-sm-bold text-on-surface mb-1">Tipo</label>
              <div className="relative">
                <select 
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-body-md px-3 py-2 appearance-none outline-none transition-all"
                  value={formData.type || 'GENERAL'}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="PROMOTION">PROMOTION</option>
                  <option value="STATUS">STATUS</option>
                  <option value="SEASON">SEASON</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block font-body-sm-bold text-body-sm-bold text-on-surface mb-1">Categoría</label>
              <div className="relative">
                <select 
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-body-md px-3 py-2 appearance-none outline-none transition-all"
                  value={formData.category || 'General'}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="Campañas">Campañas</option>
                  <option value="Logística">Logística</option>
                  <option value="Inventario">Inventario</option>
                  <option value="Catálogo">Catálogo</option>
                  {categories.length > 0 && <optgroup label="Categorías de Producto">
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
          </div>
          <div className="pt-6 mt-auto flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => onSelectTag(null)}
              className="px-4 py-2 rounded-lg text-on-surface-variant font-body-sm-bold hover:bg-surface-container-high transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-primary text-white font-body-sm-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={loading}
            >
              {selectedTag.id === 'new' ? 'Crear Etiqueta' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-60">
            <span className="material-symbols-outlined text-[48px] mb-2">sell</span>
            <p className="text-body-md">Selecciona o crea una etiqueta</p>
          </div>
        )}
      </div>

      <IconPickerModal 
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={(icon) => handleChange('icon', icon)}
        selectedIcon={formData.icon || 'local_offer'}
      />
    </div>
  );
};
