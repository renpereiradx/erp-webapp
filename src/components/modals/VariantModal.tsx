import React, { useState, useEffect } from 'react';
import { useBranch } from '../../contexts/BranchContext';
import { useI18n } from '@/lib/i18n';
import { attributeService } from '../../services/attributeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { X, Plus } from 'lucide-react';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
  product?: any;
  variantToEdit?: any;
}

export const VariantModal: React.FC<VariantModalProps> = ({ isOpen, onClose, onCreate, product, variantToEdit }) => {
  const { t } = useI18n();
  const [barcode, setBarcode] = useState('');
  const [stock, setStock] = useState<number | string>('');
  const [precio, setPrecio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [customAttributes, setCustomAttributes] = useState<Array<{key: string, value: string}>>([]);
  const [attributesLoaded, setAttributesLoaded] = useState(false);
  const { currentBranchId } = useBranch();

  useEffect(() => {
    if (isOpen) {
      setAttributesLoaded(false);
      let fetchPromise;

      if (product?.category_id) {
        fetchPromise = attributeService.getCategoryAttributes(product.category_id);
      } else if (product?.id) {
        fetchPromise = attributeService.getApplicableAttributes(product.id);
      } else {
        setDynamicAttributes([]);
        setAttributesLoaded(true);
        return;
      }

      fetchPromise
        .then((res: any) => {
          const definitions = Array.isArray(res) ? res : (res?.data || []);
          // Filter ONLY variant attributes for the variant modal, fallback to all if none marked
          const variantsOnly = definitions.filter((d: any) => d.is_variant || d.isVariant);
          setDynamicAttributes(variantsOnly.length > 0 ? variantsOnly : definitions);
        })
        .catch(console.error)
        .finally(() => {
          setAttributesLoaded(true);
        });
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (isOpen && variantToEdit) {
      setBarcode(variantToEdit.barcode && variantToEdit.barcode !== '-' ? variantToEdit.barcode : '');
      setStock(variantToEdit.stock_quantity || variantToEdit.stock || '');
      setPrecio(variantToEdit.current_price || variantToEdit.price || '');

      if (attributesLoaded) {
        const attrs = variantToEdit.raw_attributes || variantToEdit.variant_attributes || {};
        const dynValues: Record<string, string> = {};
        const custAttrs: Array<{key: string, value: string}> = [];

        const dynKeys = dynamicAttributes.map((d: any) => (d.slug || d.code).toLowerCase());

        Object.entries(attrs).forEach(([k, v]) => {
          if (dynKeys.includes(k.toLowerCase())) {
            dynValues[k.toLowerCase()] = String(v);
          } else {
            custAttrs.push({ key: k, value: String(v) });
          }
        });

        setAttributeValues(dynValues);
        setCustomAttributes(custAttrs);
      }
    } else if (isOpen) {
      setBarcode('');
      setStock('');
      setPrecio('');
      setAttributeValues({});
      setCustomAttributes([]);
    }
  }, [isOpen, variantToEdit, attributesLoaded, dynamicAttributes]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const hasDynamicValues = Object.values(attributeValues).some(v => typeof v === 'string' && v.trim() !== '');
    const hasCustomAttributes = customAttributes.some(a => a.key.trim() !== '' && a.value.trim() !== '');

    if (!hasDynamicValues && !hasCustomAttributes) {
      alert(t('products.variants.alert.attribute_required'));
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        variant_attributes: { ...attributeValues },
      };

      if (barcode) {
        payload.barcode = barcode;
      }

      const numPrecio = Number(precio);
      const numStock = Number(stock);

      if (precio !== '' || (stock !== '' && numStock > 0)) {
        if (!precio) {
          alert(t('products.variants.alert.price_required'));
          setSubmitting(false);
          return;
        }
        if (!currentBranchId) {
          alert(t('products.variants.alert.branch_required'));
          setSubmitting(false);
          return;
        }

        payload.initial_price = numPrecio;
        payload.stock_branch_id = currentBranchId;

        if (stock !== '') {
          payload.initial_stock = numStock;
        }
      }

      customAttributes.forEach(attr => {
        if (attr.key.trim() && attr.value.trim()) {
          payload.variant_attributes[attr.key.trim().toLowerCase()] = attr.value.trim();
        }
      });

      await onCreate(payload);
      // Reset form
      setBarcode('');
      setAttributeValues({});
      setCustomAttributes([]);
      setStock('');
      setPrecio('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = 'text-body-md-bold text-foreground';

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={variantToEdit
        ? t('products.variants.modal.edit_title', 'Editar Variante')
        : t('products.variants.action.new', 'Nueva Variante')}
      variant="default"
      size="lg"
      closeOnOverlayClick={false}
      className="rounded-xl flex flex-col"
      testId="variant-modal"
      footer={
        <div className="flex justify-end gap-sm">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('products.modal.action.cancel')}
          </Button>
          <Button type="button" variant="primary" loading={submitting} disabled={submitting} onClick={handleSubmit}>
            {submitting
              ? t('products.modal.action.saving')
              : variantToEdit
                ? t('products.variants.action.save', 'Guardar Cambios')
                : t('products.variants.action.create', 'Crear Variante')}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">

        {/* Columna Izquierda: Identificación e Inventario */}
        <div className="space-y-md">
          <div className="grid grid-cols-3 gap-sm">
            <div className="col-span-1 space-y-xs">
              <Label htmlFor="variant-sku" className={labelClass}>SKU</Label>
              <Input
                id="variant-sku"
                placeholder="Auto"
                type="text"
                disabled
                className="text-data-mono font-data-mono bg-surface-muted text-on-surface-deep"
              />
            </div>
            <div className="col-span-2 space-y-xs">
              <Label htmlFor="variant-barcode" className={labelClass}>{t('products.variants.field.barcode', 'Código de Barras')}</Label>
              <Input
                id="variant-barcode"
                placeholder={t('products.variants.field.barcode_placeholder', 'Escanear o ingresar')}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                disabled={submitting}
                className="text-data-mono font-data-mono"
              />
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="grid grid-cols-2 gap-sm">
            <div className="space-y-xs">
              <Label htmlFor="variant-branch" className={labelClass}>{t('products.variants.field.branch', 'Sucursal')}</Label>
              <Input
                id="variant-branch"
                value={currentBranchId ?? ''}
                disabled
                className="text-data-mono font-data-mono bg-surface-muted text-on-surface-deep"
              />
            </div>
            <div className="space-y-xs">
              <Label htmlFor="variant-stock" className={labelClass}>{t('products.variants.field.stock', 'Stock Inicial')}</Label>
              <Input
                id="variant-stock"
                min="0"
                placeholder={t('products.variants.field.stock_placeholder', 'Opcional')}
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                disabled={submitting}
                className="text-data-mono font-data-mono text-right"
              />
            </div>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="variant-price" className={labelClass}>{t('products.variants.field.price', 'Precio Inicial')}</Label>
            <Input
              id="variant-price"
              placeholder="0"
              step="0.01"
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              disabled={submitting}
              className="text-data-mono font-data-mono"
            />
          </div>
        </div>

        {/* Columna Derecha: Atributos */}
        <div className="space-y-md">
          <div className="space-y-sm">
            <h3 className="text-label-caps uppercase text-on-surface-deep">{t('products.variants.field.attributes', 'Atributos de Variante')}</h3>
            <div className="grid grid-cols-2 gap-sm max-h-40 overflow-y-auto">
              {!attributesLoaded ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full bg-surface-muted" />
                ))
              ) : dynamicAttributes.length === 0 ? (
                <div className="text-body-md text-on-surface-deep italic col-span-2">
                  {t('products.variants.field.no_category_attributes')}
                </div>
              ) : (
                dynamicAttributes.map((attr) => (
                  <div key={attr.id || attr.code} className="flex flex-col gap-xs">
                    <Label className="text-body-sm-bold text-on-surface-deep" htmlFor={attr.slug || attr.code}>{attr.name}</Label>
                    <Input
                      id={attr.slug || attr.code}
                      placeholder={t('products.attributes.field.value_placeholder_text')}
                      value={attributeValues[attr.slug || attr.code] || ''}
                      onChange={(e) => setAttributeValues(prev => ({ ...prev, [attr.slug || attr.code]: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="space-y-sm">
            <div className="flex items-center justify-between gap-sm">
              <h3 className="text-label-caps uppercase text-on-surface-deep">{t('products.variants.field.custom', 'Atributos Personalizados')}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCustomAttributes([...customAttributes, { key: '', value: '' }])}
                className="text-primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('products.variants.field.custom_add', '+ Agregar atributo extra')}
              </Button>
            </div>
            <div className="space-y-sm max-h-36 overflow-y-auto">
              {customAttributes.length === 0 ? (
                <div className="text-body-md text-on-surface-deep italic">{t('products.variants.field.custom_empty')}</div>
              ) : (
                customAttributes.map((attr, index) => (
                  <div key={index} className="flex gap-sm items-center">
                    <div className="flex-1 space-y-xs">
                      <Label htmlFor={`custom-attr-name-${index}`} className="sr-only">{t('products.variants.field.custom_name')}</Label>
                      <Input
                        id={`custom-attr-name-${index}`}
                        placeholder={t('products.variants.field.custom_name')}
                        value={attr.key}
                        onChange={e => {
                          const newAttrs = [...customAttributes];
                          newAttrs[index].key = e.target.value;
                          setCustomAttributes(newAttrs);
                        }}
                        disabled={submitting}
                      />
                    </div>
                    <div className="flex-1 space-y-xs">
                      <Label htmlFor={`custom-attr-value-${index}`} className="sr-only">{t('products.variants.field.custom_value')}</Label>
                      <Input
                        id={`custom-attr-value-${index}`}
                        placeholder={t('products.variants.field.custom_value')}
                        value={attr.value}
                        onChange={e => {
                          const newAttrs = [...customAttributes];
                          newAttrs[index].value = e.target.value;
                          setCustomAttributes(newAttrs);
                        }}
                        disabled={submitting}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t('products.modal.action.delete')}
                      className="text-on-surface-deep hover:text-error shrink-0"
                      onClick={() => {
                        const newAttrs = customAttributes.filter((_, i) => i !== index);
                        setCustomAttributes(newAttrs);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </EnhancedModal>
  );
};
