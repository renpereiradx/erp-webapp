import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Category } from '@/domain/products/models';
import { ProductSearchFacet, AdvancedProductSearchPayload } from '@/types';

interface ProductsFiltersProps {
  isSearching: boolean;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  showFilters: boolean;
  onToggleFilters: () => void;
  localFilters: { category: string; status: string };
  setLocalFilters: React.Dispatch<React.SetStateAction<{ category: string; status: string }>>;
  categories: Category[];
  onApplyFilters: () => void;
  onClearFilters: () => void;
  facets?: ProductSearchFacet[];
  advancedSearchPayload?: AdvancedProductSearchPayload;
  setAdvancedSearchPayload?: React.Dispatch<React.SetStateAction<AdvancedProductSearchPayload>>;
}

export const ProductsFilters: React.FC<ProductsFiltersProps> = ({
  isSearching,
  searchTerm,
  onSearchChange,
  onSearchKeyDown,
  searchInputRef,
  showFilters,
  onToggleFilters,
  localFilters,
  setLocalFilters,
  categories,
  onApplyFilters,
  onClearFilters,
  facets = [],
  advancedSearchPayload = {},
  setAdvancedSearchPayload,
}) => {
  const { t } = useI18n();

  return (
    <Card className="bg-white border-border-subtle rounded-xl shadow-fluent-2 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            {isSearching ? (
              <RefreshCw className="size-5 animate-spin" />
            ) : (
              <Search className="size-5" />
            )}
          </span>
          <Input
            ref={searchInputRef}
            type="search"
            className="block w-full pl-10 pr-3 py-2.5 border-border-subtle rounded-full bg-slate-50 focus:bg-white transition-all h-11 font-bold text-xs uppercase tracking-wider"
            placeholder={t('products.search.by_name_sku') + ' (F2)'}
            value={searchTerm}
            onChange={onSearchChange}
            onKeyDown={onSearchKeyDown}
          />
          {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
            <p className="absolute -bottom-6 left-0 text-[10px] font-black uppercase tracking-widest text-warning">
              {t('products.search.min_chars', 'Escribe al menos 3 caracteres')} (
              {searchTerm.trim().length}/3)
            </p>
          )}
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleFilters}
            className={cn(
              'h-11 px-6 font-black uppercase text-[10px] tracking-widest transition-all',
              showFilters
                ? 'bg-primary text-white'
                : 'bg-white border-border-subtle text-text-secondary hover:bg-slate-50'
            )}
          >
            <Filter className="size-4 mr-2" />
            {t('products.action.filter')}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
              {t('products.filter.category', 'Categoría')}
            </label>
            <Select
              value={localFilters.category}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="w-full border-border-subtle bg-white h-11 font-bold text-sm rounded-xl shadow-sm">
                <SelectValue placeholder={t('products.filter.all_categories')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border-subtle shadow-fluent-16">
                <SelectItem value="all" className="font-bold text-xs uppercase">
                  {t('products.filter.all_categories')}
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id.toString()}
                    className="font-bold text-xs uppercase"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
              {t('products.filter.status', 'Estado')}
            </label>
            <Select
              value={localFilters.status}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-full border-border-subtle bg-white h-11 font-bold text-sm rounded-xl shadow-sm">
                <SelectValue placeholder={t('products.filter.all_statuses')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border-subtle shadow-fluent-16">
                <SelectItem value="all" className="font-bold text-xs uppercase">
                  {t('products.filter.all_statuses')}
                </SelectItem>
                <SelectItem value="active" className="font-bold text-xs uppercase">
                  {t('products.state.active')}
                </SelectItem>
                <SelectItem value="inactive" className="font-bold text-xs uppercase">
                  {t('products.state.inactive')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Facets (Brands, etc) */}
          {facets.filter(f => f.code === 'brand' || f.code === 'brand_id').map((facet) => (
            <div key={facet.code} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                {facet.name}
              </label>
              <Select
                value={advancedSearchPayload?.brand_ids?.[0]?.toString() || 'all'}
                onValueChange={(value) => {
                  if (setAdvancedSearchPayload) {
                    setAdvancedSearchPayload(prev => ({
                      ...prev,
                      brand_ids: value === 'all' ? undefined : [parseInt(value)]
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full border-border-subtle bg-white h-11 font-bold text-sm rounded-xl shadow-sm">
                  <SelectValue placeholder={`Seleccionar ${facet.name}`} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border-subtle shadow-fluent-16">
                  <SelectItem value="all" className="font-bold text-xs uppercase">
                    Todas
                  </SelectItem>
                  {facet.options.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value.toString()}
                      className="font-bold text-xs uppercase flex justify-between"
                    >
                      <span>{opt.label}</span>
                      {opt.count && <span className="text-slate-400 ml-2">({opt.count})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex items-end gap-3">
            <Button
              className="flex-1 bg-primary hover:bg-primary-hover text-white h-11 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-fluent-2"
              onClick={onApplyFilters}
            >
              {t('products.filter.apply', 'Aplicar')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-border-subtle text-text-secondary h-11 hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest rounded-xl"
              onClick={onClearFilters}
            >
              {t('products.filter.clear', 'Limpiar')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
