import React from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';

interface ProductsHeaderProps {
  onOpenCreateModal: () => void;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({ onOpenCreateModal }) => {
  const { t } = useI18n();

  return (
    <PageHeader
      breadcrumb={t('products.breadcrumb.inventory', 'Inventario')}
      title={t('products.page.title')}
      subtitle={t('products.page.subtitle')}
      actions={
        <Button variant="primary" onClick={onOpenCreateModal} data-testid="products-new">
          <Plus className="w-4 h-4 mr-2" />
          {t('products.action.new_product', 'Nuevo Producto')}
        </Button>
      }
    />
  );
};
