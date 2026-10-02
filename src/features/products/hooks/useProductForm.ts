import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import useProductStore from '@/store/useProductStore';
import useCategoryStore from '@/store/useCategoryStore';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n';

export const baseProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.string().min(1, 'La categoría es requerida'),
  productType: z.enum(['PHYSICAL', 'SERVICE', 'PRODUCTION']),
  description: z.string().min(1, 'La descripción es requerida'),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  brand_id: z.string().optional(),
  origin: z.string().optional(),
  base_unit: z.string().default('unit'),
  tax_rate_id: z.string().optional(),
  is_variable_measure: z.boolean().default(false),
  is_bookable: z.boolean().default(false),
  scale_code: z.string().optional(),
});

export const productSchema = baseProductSchema.superRefine((data, ctx) => {
  if (data.is_variable_measure) {
    if (!data.scale_code || data.scale_code.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El código de balanza es requerido",
        path: ["scale_code"]
      });
    } else if (!/^\d{1,5}$/.test(data.scale_code.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe tener entre 1 y 5 dígitos numéricos",
        path: ["scale_code"]
      });
    }

    const validMeasurableUnits = ['kg', 'g', 'lb', 'oz', 'l', 'ml', 'gal', 'meter', 'cm', 'sqm', 'sqft'];
    if (!validMeasurableUnits.includes(data.base_unit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unidad debe ser de peso o volumen",
        path: ["base_unit"]
      });
    }
  }

  if (data.scale_code && data.scale_code.trim() !== '' && !data.is_variable_measure) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe activar medida variable",
      path: ["is_variable_measure"]
    });
  }

  // D-SR-4: reservable solo para servicios (se venden por franja horaria).
  if (data.is_bookable && data.productType !== 'SERVICE') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Solo los productos de tipo Servicio pueden ser reservables",
      path: ["is_bookable"]
    });
  }
});

export type ProductFormData = z.infer<typeof productSchema>;

interface UseProductFormProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
  // Instancia compartida de la página (ver useProductsLogic): solo la
  // renderizada en el ToastContainer es visible.
  toast?: ReturnType<typeof useToast>;
}

export function useProductForm({ product, isOpen, onClose, toast: externalToast }: UseProductFormProps) {
  const { createProduct, updateProduct, deleteProduct } = useProductStore();
  const { categories, loading: loadingCategories, fetchCategories } = useCategoryStore();
  const fallbackToast = useToast();
  const toast = externalToast ?? fallbackToast;
  // Métodos estables (no el objeto `toast`, cuya identidad cambia con cada
  // notificación y provocaría refetch en bucle en los efectos de abajo).
  const { errorFrom, success } = toast;
  const { t } = useI18n();
  const isEditMode = product !== null;

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    productType: 'PHYSICAL',
    description: '',
    barcode: '',
    sku: '',
    brand_id: '',
    origin: '',
    base_unit: 'unit',
    tax_rate_id: '',
    is_variable_measure: false,
    is_bookable: false,
    scale_code: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loadingTaxRates, setLoadingTaxRates] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

  const loadTaxRates = useCallback(async (ignore = false) => {
    setLoadingTaxRates(true);
    try {
      const { taxRateService } = await import('@/services/taxRateService');
      const response = await taxRateService.getPaginated(1, 100);
      if (!ignore) {
        if (Array.isArray(response)) setTaxRates(response);
        else if (response && response.tax_rates) setTaxRates(response.tax_rates);
        else setTaxRates([]);
      }
    } catch (error) {
      if (!ignore) {
        setTaxRates([]);
        errorFrom(error, {
          fallback: t('products.toast.tax_rates_error', 'No se pudieron cargar los impuestos'),
        });
      }
    } finally {
      if (!ignore) setLoadingTaxRates(false);
    }
  }, [errorFrom, t]);

  const loadBrands = useCallback(async (ignore = false) => {
    setLoadingBrands(true);
    try {
      const { brandService } = await import('@/services/brandService');
      const response = await brandService.getAll();
      if (!ignore) {
        setBrands(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      if (!ignore) {
        setBrands([]);
        errorFrom(error, {
          fallback: t('products.toast.brands_error', 'No se pudieron cargar las marcas'),
        });
      }
    } finally {
      if (!ignore) setLoadingBrands(false);
    }
  }, [errorFrom, t]);

  useEffect(() => {
    let ignore = false;
    if (isOpen) {
      if (categories.length === 0) {
        fetchCategories().catch((error: unknown) => {
          if (!ignore) {
            errorFrom(error, {
              fallback: t('products.toast.categories_error', 'No se pudieron cargar las categorías'),
            });
          }
        });
      }
      loadTaxRates(ignore);
      loadBrands(ignore);

      if (product) {
        setFormData({
          name: product.product_name || product.name || '',
          category: product.category?.id?.toString() || product.categoryId?.toString() || product.category_id?.toString() || product.id_category?.toString() || '',
          productType: product.product_type || 'PHYSICAL',
          description: product.description || '',
          barcode: product.barcode || '',
          sku: product.sku || '',
          brand_id: product.brand_id?.toString() || '',
          origin: product.origin || '',
          base_unit: product.base_unit || 'unit',
          tax_rate_id: (product.override_tax_rate_id || product.tax_rate_id)?.toString() || '',
          is_variable_measure: product.is_variable_measure || false,
          is_bookable: product.is_bookable || false,
          scale_code: product.scale_code || '',
        });
      } else {
        setFormData({
          name: '', category: '', productType: 'PHYSICAL', description: '',
          barcode: '', sku: '', brand_id: '', origin: '', base_unit: 'unit', tax_rate_id: '',
          is_variable_measure: false, is_bookable: false, scale_code: '',
        });
      }
      setErrors({});
      setShowDeleteConfirm(false);
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, product, categories.length, fetchCategories, loadTaxRates, loadBrands]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => {
      const next = { ...prev, [name]: finalValue };
      // Validate the specific field immediately using the base schema
      const fieldSchema = baseProductSchema.shape[name as keyof typeof baseProductSchema.shape];
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
        // SKU universal: vacío en creación = el backend genera uno desde el
        // nombre; en edición, ausente = sin cambio.
        sku: formData.sku?.trim() || undefined,
        brand_id: formData.brand_id ? parseInt(formData.brand_id) : undefined,
        origin: formData.origin || undefined,
        base_unit: formData.base_unit || 'unit',
        override_tax_rate_id: formData.tax_rate_id ? parseInt(formData.tax_rate_id) : undefined,
        is_variable_measure: formData.is_variable_measure,
        // Reservabilidad explícita (D-SR-4): el schema ya garantiza
        // is_bookable ⇒ SERVICE; solo SERVICE envía el flag.
        is_bookable: formData.productType === 'SERVICE' ? formData.is_bookable : false,
        scale_code: formData.is_variable_measure ? (formData.scale_code?.trim() || null) : null,
        state: true,
        is_active: true,
      };
      
      const productId = product?.product_id || product?.id;
      if (isEditMode) {
        const { base_unit, ...updateData } = productData;
        await updateProduct(productId, updateData);
        success(t('products.toast.updated', 'Producto actualizado exitosamente'));
      } else {
        await createProduct(productData);
        success(t('products.toast.created', 'Producto creado exitosamente'));
      }
      
      onClose();
    } catch (error: any) {
      errorFrom(error, {
        fallback: t('products.toast.save_error', 'No se pudo guardar el producto'),
      });
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
      success(t('products.toast.deleted', 'Producto eliminado exitosamente'));
      setShowDeleteConfirm(false);
      onClose();
    } catch (error: any) {
      errorFrom(error, {
        fallback: t('products.toast.delete_error', 'No se pudo eliminar el producto'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openCategoryManager = useCallback(() => {
    setIsCategoryManagerOpen(true);
  }, []);

  const closeCategoryManager = useCallback(() => {
    setIsCategoryManagerOpen(false);
  }, []);

  const handleCategoryCreated = useCallback((created: { id: number } | { category?: { id: number } } | { data?: { id: number } }) => {
    const id =
      (created as any)?.id ??
      (created as any)?.category?.id ??
      (created as any)?.data?.id;
    if (typeof id !== 'number') return;
    setFormData(prev => ({ ...prev, category: id.toString() }));
    setErrors(prev => ({ ...prev, category: undefined }));
  }, []);

  const handleCategoryDeleted = useCallback((deletedId: number) => {
    setFormData(prev => {
      if (prev.category === deletedId.toString()) {
        return { ...prev, category: '' };
      }
      return prev;
    });
  }, []);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    isDeleting,
    isEditMode,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isCategoryManagerOpen,
    openCategoryManager,
    closeCategoryManager,
    handleCategoryCreated,
    handleCategoryDeleted,
    categories,
    taxRates,
    brands,
    loadingCategories,
    loadingTaxRates,
    loadingBrands,
    handleChange,
    handleSubmit,
    handleDelete,
    loadBrands
  };
}
