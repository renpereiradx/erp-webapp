import React, { useState, useEffect } from 'react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Package, FileText, DollarSign, Layers } from 'lucide-react';

const DetailSection = ({ title, children }) => {
  const { styles } = useThemeStyles();
  return (
    <div className="space-y-4">
      <h3 className={styles.header('h3')}>{title}</h3>
      <div className="space-y-2 p-4 border rounded-md bg-muted/50">{children}</div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{value || 'N/A'}</span>
  </div>
);

const ProductDetailModal = ({ isOpen, onClose, product }) => {
  const { styles } = useThemeStyles();
  const { t } = useI18n();

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col ${styles.card()}`}>
        <div className="flex justify-between items-center p-4 border-b-2 border-border">
          <div>
            <h2 className={styles.header('h2')}>{product.name}</h2>
            <p className="text-sm text-muted-foreground">ID: {product.id}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info"><Package className="w-4 h-4 mr-2"/>{t('products.tabs.info')}</TabsTrigger>
              <TabsTrigger value="description"><FileText className="w-4 h-4 mr-2"/>{t('products.tabs.description')}</TabsTrigger>
              <TabsTrigger value="price"><DollarSign className="w-4 h-4 mr-2"/>{t('products.tabs.price')}</TabsTrigger>
              <TabsTrigger value="stock"><Layers className="w-4 h-4 mr-2"/>{t('products.tabs.stock')}</TabsTrigger>
            </TabsList>
            <div className="mt-4">
              <TabsContent value="info">
                <DetailSection title={t('products.info_general')}>
                  <DetailRow label={t('field.category')} value={product.category_name} />
                  <DetailRow label={t('products.type_label')} value={product.product_type} />
                  <DetailRow label={t('status.label', 'Estado')} value={product.is_active ? t('status.active') : t('status.inactive')} />
                </DetailSection>
              </TabsContent>
              <TabsContent value="description">
                <DetailSection title={t('products.description_heading')}>
                  <p className="text-sm text-muted-foreground">{product.description?.description || t('products.no_description')}</p>
                </DetailSection>
              </TabsContent>
              <TabsContent value="price">
                <DetailSection title={t('products.configure_prices')}>
                  <DetailRow label={t('field.price')} value={product.price_formatted} />
                  <DetailRow label={t('field.cost_price', 'Precio de Costo')} value={product.purchase_price} />
                  {/* Agrega más detalles de precio si están disponibles */}
                </DetailSection>
              </TabsContent>
              <TabsContent value="stock">
                <DetailSection title={t('products.configure_stock')}>
                  <DetailRow label={t('field.stock')} value={product.stock_quantity} />
                  <DetailRow label={t('field.stock_status', 'Estado de Stock')} value={product.stock_status} />
                </DetailSection>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="p-4 border-t border-border mt-auto text-right">
          <Button onClick={onClose} className={styles.button('secondary')}>{t('action.close', 'Cerrar')}</Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;