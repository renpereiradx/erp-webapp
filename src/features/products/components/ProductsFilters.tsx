import React from 'react';
import { Search, Filter, RefreshCw, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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

  const handleAttributeChange = (code: string, value: string) => {
    if (!setAdvancedSearchPayload) return;
    setAdvancedSearchPayload((prev) => {
      const attrs = { ...prev.attributes };
      if (value === 'all') {
        delete attrs[code];
      } else {
        attrs[code] = [value];
      }
      return { ...prev, attributes: Object.keys(attrs).length > 0 ? attrs : undefined };
    });
  };

  return (
    <Card className="bg-surface-container-lowest border-none rounded-xl shadow-whisper p-6">
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
            className="block w-full pl-10 pr-3 py-2.5 border border-[#455f89]/20 rounded-input bg-surface focus:bg-white focus:ring focus:ring-primary/20 focus:border-primary transition-all h-11 font-body-md text-on-surface"
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
              'h-11 px-6 font-body-sm-bold rounded-button transition-all',
              showFilters
                ? 'bg-gradient-to-br from-primary to-primary-container text-white border-none'
                : 'bg-surface-container-low border-none text-on-surface hover:bg-surface-container'
            )}
          >
            <Filter className="size-4 mr-2" />
            Filtros Avanzados
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                {t('products.filter.category', 'Categoría')}
              </label>
              <Select
                value={localFilters.category}
                onValueChange={(value) => {
                  setLocalFilters((prev) => ({ ...prev, category: value }));
                  if (setAdvancedSearchPayload) {
                    setAdvancedSearchPayload((prev) => ({
                      ...prev,
                      category_id: value === 'all' ? undefined : parseInt(value)
                    }));
                  }
                }}
              >
                    <SelectTrigger className="w-full border border-[#455f89]/20 bg-surface h-11 font-body-md rounded-input focus:ring focus:ring-primary/20 focus:border-primary">
                  <SelectValue placeholder={t('products.filter.all_categories')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-whisper">
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
                    <SelectTrigger className="w-full border border-[#455f89]/20 bg-surface h-11 font-body-md rounded-input focus:ring focus:ring-primary/20 focus:border-primary">
                  <SelectValue placeholder={t('products.filter.all_statuses')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-whisper">
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

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                Ordenar Por
              </label>
              <Select
                value={advancedSearchPayload?.sort_by || 'newest'}
                onValueChange={(value: any) => {
                  if (setAdvancedSearchPayload) {
                    setAdvancedSearchPayload(prev => ({
                      ...prev,
                      sort_by: value
                    }));
                  }
                }}
              >
                    <SelectTrigger className="w-full border border-[#455f89]/20 bg-surface h-11 font-body-md rounded-input focus:ring focus:ring-primary/20 focus:border-primary">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-whisper">
                  <SelectItem value="newest" className="font-bold text-xs uppercase">Más recientes</SelectItem>
                  <SelectItem value="name_asc" className="font-bold text-xs uppercase">Nombre (A-Z)</SelectItem>
                  <SelectItem value="name_desc" className="font-bold text-xs uppercase">Nombre (Z-A)</SelectItem>
                  <SelectItem value="price_asc" className="font-bold text-xs uppercase">Menor Precio</SelectItem>
                  <SelectItem value="price_desc" className="font-bold text-xs uppercase">Mayor Precio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stock Toggle */}
            <div className="space-y-2 flex flex-col justify-center pt-5">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-border-subtle">
                <Switch 
                  checked={advancedSearchPayload?.in_stock_only || false}
                  onCheckedChange={(checked) => {
                    if (setAdvancedSearchPayload) {
                      setAdvancedSearchPayload(prev => ({ ...prev, in_stock_only: checked }));
                    }
                  }}
                />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Solo con stock disponible
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dynamic Facets (Brands, Tags, Attributes) */}
            {facets.map((facet) => {
              if (facet.code === 'price') {
                return (
                  <div key={facet.code} className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                      {facet.name}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        placeholder="Mínimo" 
                        className="h-11 border border-[#455f89]/20 bg-surface rounded-input font-body-md focus:ring focus:ring-primary/20 focus:border-primary"
                        value={advancedSearchPayload?.price_min || ''}
                        onChange={(e) => {
                          if (setAdvancedSearchPayload) {
                            setAdvancedSearchPayload(prev => ({ ...prev, price_min: e.target.value ? Number(e.target.value) : undefined }));
                          }
                        }}
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <Input 
                        type="number" 
                        placeholder="Máximo" 
                        className="h-11 border border-[#455f89]/20 bg-surface rounded-input font-body-md focus:ring focus:ring-primary/20 focus:border-primary"
                        value={advancedSearchPayload?.price_max || ''}
                        onChange={(e) => {
                          if (setAdvancedSearchPayload) {
                            setAdvancedSearchPayload(prev => ({ ...prev, price_max: e.target.value ? Number(e.target.value) : undefined }));
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              }

              let currentValue = 'all';
              if (facet.code === 'brand' || facet.code === 'brand_id') {
                currentValue = advancedSearchPayload?.brand_ids?.[0]?.toString() || 'all';
              } else if (facet.code === 'tag') {
                currentValue = advancedSearchPayload?.tag_slugs?.[0] || 'all';
              } else {
                currentValue = advancedSearchPayload?.attributes?.[facet.code]?.[0] || 'all';
              }

              return (
                <div key={facet.code} className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                    {facet.name}
                  </label>
                  <Select
                    value={currentValue}
                    onValueChange={(value) => {
                      if (!setAdvancedSearchPayload) return;
                      if (facet.code === 'brand' || facet.code === 'brand_id') {
                        setAdvancedSearchPayload(prev => ({ ...prev, brand_ids: value === 'all' ? undefined : [parseInt(value)] }));
                      } else if (facet.code === 'tag') {
                        setAdvancedSearchPayload(prev => ({ ...prev, tag_slugs: value === 'all' ? undefined : [value] }));
                      } else {
                        handleAttributeChange(facet.code, value);
                      }
                    }}
                  >
                        <SelectTrigger className="w-full border border-[#455f89]/20 bg-surface h-11 font-body-md rounded-input focus:ring focus:ring-primary/20 focus:border-primary">
                      <SelectValue placeholder={`Cualquier ${facet.name.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-whisper max-h-64">
                      <SelectItem value="all" className="font-bold text-xs uppercase">
                        Todos
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
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
            <Button
              variant="ghost"
              className="px-6 bg-surface-container-low border-none text-on-surface h-11 hover:bg-surface-container font-body-sm-bold rounded-button"
              onClick={onClearFilters}
            >
              <X className="size-4 mr-2" />
              {t('products.filter.clear', 'Limpiar')}
            </Button>
            <Button
              className="px-8 bg-gradient-to-br from-primary to-primary-container text-white h-11 font-body-sm-bold rounded-button shadow-whisper"
              onClick={onApplyFilters}
            >
              <Search className="size-4 mr-2" />
              {t('products.filter.apply', 'Aplicar Filtros')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

