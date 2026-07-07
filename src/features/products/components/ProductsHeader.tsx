import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Share, Plus, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface ProductsHeaderProps {}

export const ProductsHeader: React.FC<ProductsHeaderProps> = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 font-label-caps text-on-surface-variant uppercase">
        <span
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors"
        >
          <span className="material-icons-round text-xs">home</span>{' '}
          {t('products.breadcrumb.home', 'Inicio')}
        </span>
        <span className="material-icons-round text-[10px]">chevron_right</span>
        <span className="hover:text-primary cursor-pointer transition-colors">
          {t('products.breadcrumb.inventory', 'Inventario')}
        </span>
        <span className="material-icons-round text-[10px]">chevron_right</span>
        <span className="text-text-main">{t('products.page.title')}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div>
          <h1 className="font-headline-lg text-on-surface">
            {t('products.page.title')}
          </h1>
          <p className="text-on-surface-variant font-body-md mt-1">
            {t('products.page.subtitle')}
          </p>
        </div>
      </div>
    </>
  );
};
