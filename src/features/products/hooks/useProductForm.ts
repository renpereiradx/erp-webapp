import { useState, useEffect } from 'react';
import { z } from 'zod';
import useProductStore from '@/store/useProductStore';

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.string().min(1, 'La categoría es requerida'),
  productType: z.enum(['PHYSICAL', 'SERVICE']),
  description: z.string().min(1, 'La descripción es requerida'),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  origin: z.string().optional(),
  base_unit: z.string().default('unit'),
  tax_rate_id: z.string().optional(),
  is_variable_measure: z.boolean().default(false),
  scale_code: z.string().optional(),
}).refine(data => {
  if (data.is_variable_measure && (!data.scale_code || data.scale_code.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "El código de balanza es requerido si la medida es variable",
  path: ["scale_code"]
});

export type ProductFormData = z.infer<typeof productSchema>;

interface UseProductFormProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function useProductForm({ product, isOpen, onClose }: UseProductFormProps) {
  const { createProduct, updateProduct, deleteProduct } = useProductStore();
  const isEditMode = product !== null;

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    productType: 'PHYSICAL',
    description: '',
    barcode: '',
    brand: '',
    origin: '',
    base_unit: 'unit',
    tax_rate_id: '',
    is_variable_measure: false,
    scale_code: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTaxRates, setLoadingTaxRates] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadTaxRates();
      
      if (product) {
        setFormData({
          name: product.product_name || product.name || '',
          category: product.category_id?.toString() || product.id_category?.toString() || '',
          productType: product.product_type || 'PHYSICAL',
          description: product.description || '',
          barcode: product.barcode || '',
          brand: product.brand || '',
          origin: product.origin || '',
          base_unit: product.base_unit || 'unit',
          tax_rate_id: (product.override_tax_rate_id || product.tax_rate_id)?.toString() || '',
          is_variable_measure: product.is_variable_measure || false,
          scale_code: product.scale_code || '',
        });
      } else {
        setFormData({
          name: '', category: '', productType: 'PHYSICAL', description: '',
          barcode: '', brand: '', origin: '', base_unit: 'unit', tax_rate_id: '',
          is_variable_measure: false, scale_code: '',
        });
      }
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, product]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const { categoryService } = await import('@/services/categoryService');
      const response = await categoryService.getAll();
      setCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadTaxRates = async () => {
    setLoadingTaxRates(true);
    try {
      const { taxRateService } = await import('@/services/taxRateService');
      const response = await taxRateService.getPaginated(1, 100);
      if (Array.isArray(response)) setTaxRates(response);
      else if (response && response.tax_rates) setTaxRates(response.tax_rates);
      else setTaxRates([]);
    } catch (error) {
      console.error('Error loading tax rates:', error);
      setTaxRates([]);
    } finally {
      setLoadingTaxRates(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => {
      const next = { ...prev, [name]: finalValue };
      // Validate the specific field immediately
      const fieldSchema = productSchema.shape[name as keyof typeof productSchema.shape];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(finalValue);
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: result.success ? undefined : result.error.errors[0].message
        }));
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = productSchema.safeParse(formData);
    if (!validation.success) {
      const formattedErrors: Partial<Record<keyof ProductFormData, string>> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          formattedErrors[err.path[0] as keyof ProductFormData] = err.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        name: formData.name.trim(),
        category_id: parseInt(formData.category),
        description: formData.description.trim(),
        product_type: formData.productType,
        barcode: formData.barcode?.trim() || undefined,
        brand: formData.brand?.trim() || undefined,
        origin: formData.origin || undefined,
        base_unit: formData.base_unit || 'unit',
        override_tax_rate_id: formData.tax_rate_id ? parseInt(formData.tax_rate_id) : undefined,
        is_variable_measure: formData.is_variable_measure,
        scale_code: formData.is_variable_measure ? (formData.scale_code?.trim() || null) : null,
        state: true,
        is_active: true,
      };
      
      const productId = product?.product_id || product?.id;
      if (isEditMode) await updateProduct(productId, productData);
      else await createProduct(productData);
      
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;
    setIsDeleting(true);
    try {
      const productId = product?.product_id || product?.id;
      await deleteProduct(productId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    isDeleting,
    isEditMode,
    showDeleteConfirm,
    setShowDeleteConfirm,
    categories,
    taxRates,
    loadingCategories,
    loadingTaxRates,
    handleChange,
    handleSubmit,
    handleDelete
  };
}
