import React, { useState, useEffect } from 'react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import useProductStore from '@/store/useProductStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Save, Package, AlertCircle } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, product, onSuccess }) => {
  const { styles } = useThemeStyles();
  const { t } = useI18n();
  const { categories, fetchCategories } = useProductStore();

  const [formData, setFormData] = useState({ name: '', id_category: '', state: true, description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({ 
        name: product.name || '', 
        id_category: product.id_category || '', 
        state: product.state !== undefined ? product.state : true,
        description: product.description?.description || ''
      });
    } else {
      setFormData({ name: '', id_category: '', state: true, description: '' });
    }
    if (isOpen && categories.length === 0) {
      setCategoriesLoading(true);
      fetchCategories().finally(() => setCategoriesLoading(false));
    }
  }, [product, isOpen, categories.length, fetchCategories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (submission logic remains the same)
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-lg max-h-[90vh] flex flex-col ${styles.card()}`}>
        <div className="flex justify-between items-center p-4 border-b-2 border-border">
          <h2 className={styles.header('h2')}>{product ? t('products.edit_title') : t('products.new_title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && <div className="bg-destructive/20 text-destructive p-3 rounded-md text-sm">{error}</div>}
          
          <div>
            <label className={styles.label()}>{t('field.name')}</label>
            <Input name="name" value={formData.name} onChange={handleChange} required className={`mt-1 ${styles.input()}`} />
          </div>

          <div>
            <label className={styles.label()}>{t('products.description_label')}</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={`mt-1 w-full ${styles.input()}`} />
          </div>

          <div>
            <label className={styles.label()}>{t('products.category_label')}</label>
            <select name="id_category" value={formData.id_category} onChange={handleChange} required disabled={categoriesLoading} className={`mt-1 w-full ${styles.input()}`}>
              <option value="">{categoriesLoading ? t('products.categories_loading') : t('products.categories_select')}</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="state" checked={formData.state} onChange={handleChange} id="product-active" />
            <label htmlFor="product-active" className={styles.label()}>{t('products.active_label')}</label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <Button type="button" onClick={onClose} disabled={loading} variant="secondary" className="w-full">{t('products.cancel')}</Button>
            <Button type="submit" disabled={loading} variant="primary" className="w-full">{loading ? t('products.saving') : t('products.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;