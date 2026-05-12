import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Share, Plus, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface ProductsHeaderProps {
  onRefresh: () => void;
  loading: boolean;
  onOpenCreateModal: () => void;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  onRefresh,
  loading,
  onOpenCreateModal,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
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
          <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">
            {t('products.page.title')}
          </h1>
          <p className="text-text-secondary text-sm font-medium mt-1">
            {t('products.page.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
          >
            <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {t('products.action.refresh', 'Refrescar')}
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
          >
            <Share className="size-4 mr-2" />
            <span className="hidden sm:inline">{t('products.action.export')}</span>
          </Button>
          <Button
            className="bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest px-6 h-10 rounded shadow-fluent-2"
            onClick={onOpenCreateModal}
          >
            <Plus className="size-4 mr-2" />
            <span>{t('products.action.new_product')}</span>
          </Button>
        </div>
      </div>
    </>
  );
};
