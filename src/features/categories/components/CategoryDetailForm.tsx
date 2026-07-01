import React, { useEffect } from 'react';
import type { Category, CategoryFormValues } from '../types';
import useTaxRateStore from '@/store/useTaxRateStore';

interface CategoryDetailFormProps {
  selectedCategory: Category | null;
  categories: Category[];
  handleSave: (values: CategoryFormValues) => void;
  confirmDelete: () => void;
  isMutating: boolean;
  onCancel: () => void;
  isOpen?: boolean; // Determines if the form is active (for creation or editing)
}

export function CategoryDetailForm({
  selectedCategory,
  categories,
  handleSave,
  confirmDelete,
  isMutating,
  onCancel,
  isOpen = true,
}: CategoryDetailFormProps) {
  const { taxRates, fetchTaxRates } = useTaxRateStore();

  useEffect(() => {
    fetchTaxRates();
  }, [fetchTaxRates]);

  const [formData, setFormData] = React.useState<CategoryFormValues>({
    name: '',
    description: '',
    default_tax_rate_id: null,
    parent_id: null,
    is_active: true,
  });

  React.useEffect(() => {
    if (selectedCategory) {
      setFormData({
        name: selectedCategory.name,
        description: selectedCategory.description || '',
        default_tax_rate_id: selectedCategory.default_tax_rate_id || null,
        parent_id: selectedCategory.parent_id || null,
        is_active: selectedCategory.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        default_tax_rate_id: null,
        parent_id: null,
        is_active: true,
      });
    }
  }, [selectedCategory, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    // Map DOM id back to state key
    const key = id === 'cat-name' ? 'name' 
              : id === 'cat-desc' ? 'description' 
              : id === 'cat-parent' ? 'parent_id' 
              : id === 'tax-rate' ? 'default_tax_rate_id' 
              : null;
    if (!key) return;

    setFormData(prev => ({
      ...prev,
      [key]: value === 'none' ? null : key.includes('id') ? Number(value) : value,
    }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(formData);
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col bg-surface rounded-[16px] shadow-sm border border-outline-variant/30 p-lg min-h-[300px] items-center justify-center text-on-surface-variant opacity-60 shrink-0">
        <span className="material-symbols-outlined text-[48px] mb-2">category</span>
        <p>Selecciona una categoría del árbol o crea una nueva</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-surface rounded-[16px] shadow-sm border border-outline-variant/30 p-lg shrink-0">
      <div className="flex justify-between items-center mb-md border-b border-outline-variant/20 pb-sm">
        <h2 className="text-title-md font-title-md text-on-surface font-bold">
          {isOpen ? (selectedCategory ? 'Editando Categoría' : 'Nueva Categoría') : 'Detalle de Categoría'}
        </h2>
        {selectedCategory && (
          <span className="bg-primary/10 text-primary text-label-sm font-bold px-sm py-[2px] rounded-full">
            ID: {selectedCategory.id}
          </span>
        )}
      </div>
      
      <form onSubmit={onSubmit} className="flex flex-col gap-md flex-1">
        <div>
          <label className="block text-label-caps font-label-caps text-on-surface-variant mb-xs" htmlFor="cat-name">
            Nombre de la Categoría
          </label>
          <input
            id="cat-name"
            type="text"
            className="w-full form-input-custom px-md py-sm bg-surface text-body-md font-body-md text-on-surface"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej. Deportivo"
            required
            disabled={isMutating}
          />
        </div>
        <div>
          <label className="block text-label-caps font-label-caps text-on-surface-variant mb-xs" htmlFor="cat-desc">
            Descripción
          </label>
          <textarea
            id="cat-desc"
            rows={3}
            className="w-full form-input-custom px-md py-sm bg-surface text-body-md font-body-md text-on-surface resize-none"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descripción de la categoría"
            disabled={isMutating}
          ></textarea>
        </div>
        <div>
          <label className="block text-label-caps font-label-caps text-on-surface-variant mb-xs" htmlFor="cat-parent">
            Categoría Padre
          </label>
          <div className="relative">
            <select
              id="cat-parent"
              className="w-full form-input-custom px-md py-sm bg-surface text-body-md font-body-md text-on-surface appearance-none"
              value={formData.parent_id ?? 'none'}
              onChange={handleChange}
              disabled={isMutating}
            >
              <option value="none">Ninguna (Raíz)</option>
              {categories.filter(c => c.id !== selectedCategory?.id).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
        <div>
          <label className="block text-label-caps font-label-caps text-on-surface-variant mb-xs" htmlFor="tax-rate">
            Tasa de IVA por Defecto
          </label>
          <div className="relative">
            <select
              id="tax-rate"
              className="w-full form-input-custom px-md py-sm bg-surface text-body-md font-body-md text-on-surface appearance-none"
              value={formData.default_tax_rate_id ?? 'none'}
              onChange={handleChange}
              disabled={isMutating}
            >
              <option value="none">Sin asignar</option>
              {taxRates.map((rate: any) => (
                <option key={rate.id} value={rate.id}>
                  {rate.tax_name || rate.name} ({rate.rate}%)
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
        
        {/* La clasificación SIFEN e IVA se configuran y aplican dinámicamente en el panel de Tasas de IVA de abajo */}
        
        <div className="mt-auto pt-lg flex justify-end gap-md items-center">
          {selectedCategory && (
            <button
              type="button"
              onClick={confirmDelete}
              className="text-error hover:text-error/80 font-bold text-body-md transition-colors mr-auto flex items-center gap-1"
              disabled={isMutating}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span> Eliminar
            </button>
          )}
          <button
            type="button"
            className="btn-tertiary px-lg py-sm rounded-lg text-body-md font-bold transition-colors"
            onClick={onCancel}
            disabled={isMutating}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary px-lg py-sm rounded-lg text-body-md shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            disabled={isMutating}
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}

export default CategoryDetailForm;
