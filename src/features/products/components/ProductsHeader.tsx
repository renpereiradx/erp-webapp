import React from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';

interface ProductsHeaderProps {
  onOpenCreateModal: () => void;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({ onOpenCreateModal }) => {
  const { t } = useI18n();
  // PLAN_CATALOGO_VENDEDOR 3.4: crear producto es gestión (products:write),
  // no puro products:read.
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('products:write');

  return (
    <PageHeader
      breadcrumb={t('products.breadcrumb.inventory', 'Inventario')}
      title={t('products.page.title')}
      subtitle={t('products.page.subtitle')}
      actions={
        canWrite ? (
          <Button variant="primary" onClick={onOpenCreateModal} data-testid="products-new">
            <Plus className="w-4 h-4 mr-2" />
            {t('products.action.new_product', 'Nuevo Producto')}
          </Button>
        ) : undefined
      }
    />
  );
};
