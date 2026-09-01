import React, { useState } from 'react';
import { Package, Layers } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { ProductVariantsManager } from '@/features/products/components/ProductVariantsManager';
import { ProductAttributesManager } from '@/features/products/components/ProductAttributesManager';
import { ProductTagsManager } from '@/features/products/components/ProductTagsManager';

interface VariantsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

type ManagerTab = 'variants' | 'attributes';

export const VariantsManagerModal: React.FC<VariantsManagerModalProps> = ({ isOpen, onClose, product }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ManagerTab>('variants');

  if (!isOpen) return null;

  const productId = product?.id || product?.product_id;
  const categoryId = product?.categoryId || product?.category_id || product?.category?.id || product?.category;
  const productName = product?.name || product?.product_name;

  const tabs: Array<{ id: ManagerTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'variants',
      label: t('products.variants.manager.tab_variants', 'Variantes (SKUs)'),
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'attributes',
      label: t('products.variants.manager.tab_attributes', 'Ficha Técnica (Atributos y Etiquetas)'),
      icon: <Layers className="w-4 h-4" />,
    },
  ];

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('products.variants.manager.title', 'Administrar Variantes, Atributos y Etiquetas')}
      subtitle={productName}
      variant="default"
      size="full"
      className="rounded-xl flex flex-col"
      testId="variants-manager-modal"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('action.close', 'Cerrar')}
          </Button>
        </div>
      }
    >
      {/* Tabs */}
      <div role="tablist" aria-label={t('products.variants.manager.title')} className="flex gap-lg border-b border-border-subtle mb-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-sm px-xs text-body-sm-bold uppercase tracking-wider border-b-2 transition-colors duration-150 flex items-center gap-xs whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-deep hover:text-foreground'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Context header */}
      <div className="bg-surface-muted rounded-md p-md mb-lg flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <div className="flex items-center gap-xs text-primary mb-xs">
            {activeTab === 'variants' ? <Package className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            <span className="text-label-caps uppercase text-on-surface-deep">
              {activeTab === 'variants'
                ? t('products.variants.matrix', 'Matriz de Variantes')
                : t('products.variants.technical_sheet', 'Ficha Técnica')}
            </span>
          </div>
          <h2 className="text-title-md text-foreground">{productName}</h2>
          {activeTab === 'attributes' && (
            <p className="text-body-md text-on-surface-deep mt-sm leading-relaxed">
              <strong className="text-primary">{t('products.variants.attributes_help_label', 'Atributos:')}</strong>{' '}
              {t('products.variants.attributes_help_text')}
              <br />
              <strong className="text-primary">{t('products.variants.tags_help_label', 'Etiquetas:')}</strong>{' '}
              {t('products.variants.tags_help_text')}
            </p>
          )}
        </div>
      </div>

      {activeTab === 'variants' && (
        <div role="tabpanel">
          <ProductVariantsManager productId={productId} categoryId={categoryId} />
        </div>
      )}

      {activeTab === 'attributes' && (
        <div role="tabpanel" className="space-y-lg">
          {/* Sección de Etiquetas (Tags) */}
          <div className="bg-surface-muted rounded-md p-md">
            <div className="flex items-center gap-sm mb-md">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="text-title-md text-foreground">{t('products.tags.section_title', 'Etiquetas del Producto')}</h3>
            </div>
            <ProductTagsManager productId={productId} categoryId={categoryId} />
            <p className="text-body-sm-bold text-on-surface-deep mt-sm uppercase">
              {t('products.tags.hint', 'Agregue etiquetas rápidas para filtros y catálogos (Ej. "Nuevo", "Oferta", "Destacado").')}
            </p>
          </div>

          {/* Sección de Atributos (Ficha Técnica) */}
          <div className="bg-surface-muted rounded-md p-md">
            <div className="flex items-center gap-sm mb-md">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="text-title-md text-foreground">{t('products.attributes.section_title', 'Atributos Descriptivos')}</h3>
            </div>
            <ProductAttributesManager productId={productId} categoryId={categoryId} />
          </div>
        </div>
      )}
    </EnhancedModal>
  );
};
