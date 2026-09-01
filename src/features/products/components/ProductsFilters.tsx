import React from 'react';
import { Search, Filter, RefreshCw, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  searchInputRef: React.RefObject<HTMLInputElement | null>;
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
  onRefresh: () => void;
  loading: boolean;
}

const filterLabelClass = 'text-label-caps uppercase text-on-surface-deep';

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
  onRefresh,
  loading,
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
    <Card className="bg-surface border-0 rounded-md shadow-whisper p-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <span className="absolute inset-y-0 left-0 pl-sm flex items-center text-on-surface-deep pointer-events-none">
            {isSearching ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </span>
          <Input
            ref={searchInputRef}
            type="search"
            className="block w-full pl-10"
            placeholder={t('products.search.by_name_sku') + ' (F2)'}
            value={searchTerm}
            onChange={onSearchChange}
            onKeyDown={onSearchKeyDown}
          />
          {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
            <p className="absolute -bottom-6 left-0 text-body-sm-bold text-warning">
              {t('products.search.min_chars', 'Escribe al menos 3 caracteres')} (
              {searchTerm.trim().length}/3)
            </p>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-sm">
          <Button
            variant={showFilters ? 'subtle' : 'secondary'}
            size="default"
            onClick={onToggleFilters}
            aria-pressed={showFilters}
            className={cn(
              'h-10 font-body-sm-bold rounded-button',
              showFilters && 'bg-surface-subtle text-foreground'
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            {t('products.filter.advanced', 'Filtros Avanzados')}
          </Button>
          <Button
            variant="secondary"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 font-body-sm-bold rounded-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {t('products.action.refresh', 'Refrescar')}
            </span>
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mt-lg pt-lg border-t border-border-subtle animate-in fade-in slide-in-from-top-2 duration-150">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
            {/* Category Filter */}
            <div className="space-y-sm">
              <Label htmlFor="filter-category" className={filterLabelClass}>
                {t('products.filter.category', 'Categoría')}
              </Label>
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
                <SelectTrigger id="filter-category" className="w-full rounded-input">
                  <SelectValue placeholder={t('products.filter.all_categories')} />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-fluent-8">
                  <SelectItem value="all" className="text-body-md">
                    {t('products.filter.all_categories')}
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id.toString()}
                      className="text-body-md"
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-sm">
              <Label htmlFor="filter-status" className={filterLabelClass}>
                {t('products.filter.status', 'Estado')}
              </Label>
              <Select
                value={localFilters.status}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="filter-status" className="w-full rounded-input">
                  <SelectValue placeholder={t('products.filter.all_statuses')} />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-fluent-8">
                  <SelectItem value="all" className="text-body-md">
                    {t('products.filter.all_statuses')}
                  </SelectItem>
                  <SelectItem value="active" className="text-body-md">
                    {t('products.state.active')}
                  </SelectItem>
                  <SelectItem value="inactive" className="text-body-md">
                    {t('products.state.inactive')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-sm">
              <Label htmlFor="filter-sort" className={filterLabelClass}>
                {t('products.filter.sort_by', 'Ordenar Por')}
              </Label>
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
                <SelectTrigger id="filter-sort" className="w-full rounded-input">
                  <SelectValue placeholder={t('products.filter.sort_by')} />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-fluent-8">
                  <SelectItem value="newest" className="text-body-md">{t('products.filter.sort.newest')}</SelectItem>
                  <SelectItem value="name_asc" className="text-body-md">{t('products.filter.sort.name_asc')}</SelectItem>
                  <SelectItem value="name_desc" className="text-body-md">{t('products.filter.sort.name_desc')}</SelectItem>
                  <SelectItem value="price_asc" className="text-body-md">{t('products.filter.sort.price_asc')}</SelectItem>
                  <SelectItem value="price_desc" className="text-body-md">{t('products.filter.sort.price_desc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stock Toggle */}
            <div className="flex flex-col justify-center pt-sm">
              <div className="flex items-center gap-md bg-surface-muted p-md rounded-md">
                <Switch
                  id="filter-in-stock"
                  checked={advancedSearchPayload?.in_stock_only || false}
                  onCheckedChange={(checked) => {
                    if (setAdvancedSearchPayload) {
                      setAdvancedSearchPayload(prev => ({ ...prev, in_stock_only: checked }));
                    }
                  }}
                />
                <Label htmlFor="filter-in-stock" className="text-body-sm-bold text-foreground">
                  {t('products.filter.in_stock_only', 'Solo con stock disponible')}
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
            {/* Dynamic Facets (Brands, Tags, Attributes) */}
            {facets.map((facet) => {
              if (facet.code === 'price') {
                return (
                  <div key={facet.code} className="space-y-sm col-span-1 md:col-span-2">
                    <span className={filterLabelClass}>{facet.name}</span>
                    <div className="flex items-center gap-sm">
                      <Input
                        id="filter-price-min"
                        type="number"
                        placeholder={t('products.filter.price_min', 'Mínimo')}
                        className="rounded-input"
                        aria-label={t('products.filter.price_min', 'Mínimo')}
                        value={advancedSearchPayload?.price_min || ''}
                        onChange={(e) => {
                          if (setAdvancedSearchPayload) {
                            setAdvancedSearchPayload(prev => ({ ...prev, price_min: e.target.value ? Number(e.target.value) : undefined }));
                          }
                        }}
                      />
                      <span className="text-on-surface-deep">-</span>
                      <Input
                        id="filter-price-max"
                        type="number"
                        placeholder={t('products.filter.price_max', 'Máximo')}
                        className="rounded-input"
                        aria-label={t('products.filter.price_max', 'Máximo')}
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
                <div key={facet.code} className="space-y-sm">
                  <Label htmlFor={`filter-facet-${facet.code}`} className={filterLabelClass}>
                    {facet.name}
                  </Label>
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
                    <SelectTrigger id={`filter-facet-${facet.code}`} className="w-full rounded-input">
                      <SelectValue placeholder={t('products.filter.any_value', { name: facet.name.toLowerCase() })} />
                    </SelectTrigger>
                    <SelectContent className="rounded-md shadow-fluent-8 max-h-64">
                      <SelectItem value="all" className="text-body-md">
                        {t('products.filter.all', 'Todos')}
                      </SelectItem>
                      {facet.options.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value.toString()}
                          className="text-body-md"
                        >
                          <span>{opt.label}</span>
                          {opt.count && <span className="text-on-surface-deep ml-2">({opt.count})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-sm mt-lg pt-lg border-t border-border-subtle">
            <Button
              variant="ghost"
              className="font-body-sm-bold rounded-button"
              onClick={onClearFilters}
            >
              <X className="w-4 h-4 mr-2" />
              {t('products.filter.clear', 'Limpiar')}
            </Button>
            <Button
              variant="secondary"
              className="font-body-sm-bold rounded-button"
              onClick={onApplyFilters}
            >
              <Search className="w-4 h-4 mr-2" />
              {t('products.filter.apply', 'Aplicar Filtros')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
