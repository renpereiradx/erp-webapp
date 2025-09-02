import React, { useState, useEffect } from 'react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import useProductStore from '@/store/useProductStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import '@/styles/ProductDetailModal.css';
import { 
  X, 
  Save, 
  Package, 
  AlertCircle
} from 'lucide-react';
import { productService } from '@/services/productService';
import { useToast } from '@/hooks/useToast';

const ProductModal = ({ isOpen, onClose, product, onSuccess, container = null }) => {
  const { styles } = useThemeStyles();
  const { t } = useI18n();
  const { categories, fetchCategories, createProduct, updateProduct, fetchProducts } = useProductStore();
  const { success, info, error: toastError } = useToast();

  const [formData, setFormData] = useState({ name: '', id_category: '', state: true, description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    if (product) {
      // Carga la descripción ya sea que venga como string directa o anidada en un objeto { description: "..." }
      const resolvedDescription = typeof product.description === 'string'
        ? product.description
        : (product.description?.description || '');
      setFormData({ 
        name: product.name || '', 
        id_category: product.id_category || '', 
        state: product.state !== undefined ? product.state : true,
        description: resolvedDescription
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
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      // Validaciones mínimas
      if (!formData.name.trim()) {
        throw new Error('El nombre es requerido');
      }
      if (!formData.id_category) {
        throw new Error('La categoría es requerida');
      }
      if (!isEditing && !formData.description.trim()) {
        throw new Error('La descripción es requerida');
      }

      // Preparar payload principal (sin descripción porque suele gestionarse aparte)
      const payload = {
        name: formData.name.trim(),
        id_category: isNaN(Number(formData.id_category)) ? formData.id_category : Number(formData.id_category),
        state: !!formData.state,
        product_type: product?.product_type || 'PHYSICAL',
        description: formData.description?.trim() || ''
      };

      let savedProduct;
      if (isEditing && product?.id) {
        savedProduct = await updateProduct(product.id, payload);
      } else {
        savedProduct = await createProduct(payload);
      }

      // Si la API sólo devuelve un mensaje sin datos del producto, refrescar lista
      let messageOnly = false;
      if (!savedProduct || (savedProduct && !savedProduct.id)) {
        messageOnly = true;
        try { await fetchProducts(); } catch {}
      }

      if (messageOnly) {
        info(isEditing ? 'Producto actualizado' : 'Producto creado', 2500);
      } else {
        success(isEditing ? 'Producto actualizado' : 'Producto creado', 2500);
      }
      onSuccess?.(savedProduct || null);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el producto');
      toastError(err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!product;

  return (
    <div className={`${container ? 'absolute' : 'fixed'} inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 product-detail-modal ${container ? 'modal-in-container' : ''}`}>
      <div className={`w-full max-w-2xl max-h-[85vh] flex flex-col modal-content ${styles.card()} shadow-2xl animate-in slide-in-from-bottom-4 duration-300`}>
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className={`${styles.header('h2')} text-xl font-bold mb-2`}>
                  {isEditing ? t('products.edit_title') : t('products.new_title')}
                </h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {isEditing ? `ID: ${product.id}` : 'Nuevo Producto'}
                  </span>
                  {isEditing && (
                    <Badge variant={formData.state ? 'default' : 'secondary'} className="product-badge">
                      {formData.state ? 'Activo' : 'Inactivo'}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6 product-scroll-area">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Información General */}
            <div className={`space-y-4 p-4 rounded-lg border ${styles.card('subtle')}`}>
              <h3 className={`${styles.header('h3')} text-base font-semibold flex items-center gap-2`}>
                <Package className="h-5 w-5 text-primary" />
                Información del Producto
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`${styles.label()} block text-sm font-medium mb-2`}>
                    {t('field.name')} *
                  </label>
                  <Input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="Nombre del producto"
                    className={`${styles.input()}`} 
                  />
                </div>
                
                <div>
                  <label className={`${styles.label()} block text-sm font-medium mb-2`}>
                    {t('products.category_label')} *
                  </label>
                  <select 
                    name="id_category" 
                    value={formData.id_category} 
                    onChange={handleChange} 
                    required 
                    disabled={categoriesLoading} 
                    className={`w-full ${styles.input()} ${categoriesLoading ? 'opacity-50' : ''}`}
                  >
                    <option value="">
                      {categoriesLoading ? t('products.categories_loading') : t('products.categories_select')}
                    </option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {categoriesLoading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 animate-spin" />
                      Cargando categorías...
                    </div>
                  )}
                </div>

                <div>
                  <label className={`${styles.label()} block text-sm font-medium mb-2`}>
                    {t('products.description_label')}
                  </label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows={4}
                    placeholder="Descripción del producto (opcional)"
                    className={`w-full ${styles.input()} resize-none`}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <label htmlFor="product-active" className={`${styles.label()} font-medium cursor-pointer`}>
                      {t('products.active_label')}
                    </label>
                    <div className="text-sm text-muted-foreground mt-1">
                      Los productos activos aparecen en búsquedas y pueden ser utilizados
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={formData.state ? 'default' : 'secondary'} className="product-badge">
                      {formData.state ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <input 
                      type="checkbox" 
                      name="state" 
                      checked={formData.state} 
                      onChange={handleChange} 
                      id="product-active"
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                    />
                  </div>
                </div>
                
                {isEditing && (
                  <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
                    <h4 className="font-medium text-foreground">Información del Producto:</h4>
                    <div>ID del Producto: {product.id}</div>
                    {product.user_id && <div>Propietario: {product.user_id}</div>}
                  </div>
                )}
              </div>
            </div>
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-muted/20">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
          >
            {t('products.cancel')}
          </Button>
          <Button 
            type="submit" 
            variant="default"
            disabled={loading}
            onClick={handleSubmit}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <AlertCircle className="h-4 w-4 animate-spin" />
                {t('products.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('products.save')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;