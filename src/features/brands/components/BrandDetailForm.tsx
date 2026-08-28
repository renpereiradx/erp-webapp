import React, { useState, useEffect } from 'react';
import { Brand } from '../types/brand';

interface BrandDetailFormProps {
  brand: Brand | { id: 'new' } | null;
  onSave: (data: Partial<Brand>) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

export const BrandDetailForm: React.FC<BrandDetailFormProps> = ({
  brand,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Partial<Brand>>({});

  useEffect(() => {
    if (brand) {
      if (brand.id === 'new') {
        setFormData({
          name: '',
          slug: '',
          description: '',
          logoUrl: '',
          isActive: true,
        });
      } else {
        setFormData(brand as Brand);
      }
    }
  }, [brand]);

  if (!brand) return null;

  const isNew = brand.id === 'new';

  const handleChange = (field: keyof Brand, value: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && isNew) {
        // Auto-generate slug for new brands
        next.slug = (value as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      return next;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <section className="w-full h-full bg-background rounded-[16px] shadow-sm border border-divider/30 flex flex-col shrink-0 overflow-hidden">
      <div className="p-lg border-b border-divider/20 flex justify-between items-center bg-surface rounded-t-[16px]">
        <h3 className="font-title-md text-title-md font-bold text-foreground">Ficha de Marca</h3>
        <button type="button" onClick={onCancel} className="text-on-surface-deep hover:text-foreground hover:bg-surface-muted p-1 rounded transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <div className="p-lg flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-lg">
        {/* Cover / Logo Area */}
        <div className="flex flex-col items-center mb-sm">
          <div className="w-20 h-20 rounded-xl bg-surface-subtle border border-divider flex items-center justify-center mb-sm shadow-sm relative group overflow-hidden cursor-pointer">
            {formData.logoUrl ? (
               <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
               <span className="material-symbols-outlined text-[32px] text-on-surface-deep group-hover:opacity-0 transition-opacity">
                 {formData.icon || 'public'}
               </span>
            )}
            <div className="absolute inset-0 bg-surface-deep/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-primary text-[20px]">upload</span>
              <span className="font-label-caps text-[10px] text-primary mt-1">Subir</span>
            </div>
          </div>
          <span className="font-body-md-bold text-body-md-bold text-foreground">
            {formData.name || 'Sin nombre'}
          </span>
          {!isNew && (
            <span className="font-data-mono text-[12px] text-on-surface-deep">ID: {brand.id}</span>
          )}
        </div>

        {/* Form Fields */}
        <form id="brand-form" className="flex flex-col gap-md" onSubmit={handleSave}>
          <div className="flex flex-col gap-xs">
            <label className="font-body-md-bold text-body-md-bold text-foreground">
              Nombre de la Marca <span className="text-error">*</span>
            </label>
            <input
              required
              className="w-full px-3 py-2 bg-surface border border-divider rounded-xl font-body-md text-body-md text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Ej. Global Tech"
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-xs">
            <label className="font-body-md-bold text-body-md-bold text-foreground flex items-center">
              Slug 
              <span className="material-symbols-outlined text-[14px] text-on-surface-deep ml-1 cursor-help" title="Identificador único para URLs">info</span>
            </label>
            <input
              className={`w-full px-3 py-2 border border-divider rounded-xl font-data-mono text-data-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${!isNew ? 'bg-surface-muted cursor-not-allowed text-on-surface-deep' : 'bg-surface text-foreground'}`}
              disabled={!isNew}
              type="text"
              value={formData.slug || ''}
              onChange={(e) => handleChange('slug', e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-xs">
            <label className="font-body-md-bold text-body-md-bold text-foreground">Logo URL</label>
            <div className="relative">
              <input
                className="w-full pl-3 pr-10 py-2 bg-surface border border-divider rounded-xl font-data-mono text-data-mono text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                type="text"
                placeholder="https://"
                value={formData.logoUrl || ''}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-deep hover:text-primary transition-colors" type="button">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className="flex items-center justify-between p-4 sm:p-lg border-t border-divider/30 mt-auto bg-background rounded-b-[16px] shrink-0">
        {!isNew ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Está seguro de que desea eliminar esta marca?')) {
                onDelete(String(brand.id));
              }
            }}
            className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors flex items-center justify-center"
            title="Eliminar marca"
          >
            <span className="material-symbols-outlined text-[24px]">delete</span>
          </button>
        ) : (
          <div /> // Espaciador para mantener alineación
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-tertiary px-4 py-2 rounded-lg text-body-md font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="brand-form"
            className="btn-primary px-4 py-2 rounded-lg text-body-md shadow-sm hover:shadow-md transition-all"
          >
            Guardar
          </button>
        </div>
      </div>
    </section>
  );
};
