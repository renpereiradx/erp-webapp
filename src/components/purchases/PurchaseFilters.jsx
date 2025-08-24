/**
 * PurchaseFilters - Filtros Avanzados para Compras
 * Wave 1: Arquitectura Base Sólida
 * Sistema completo de filtros con debounce, validación y accesibilidad
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  DollarSign, 
  Package, 
  User,
  RefreshCw,
  Download
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Custom Components
import SupplierSelector from '@/components/SupplierSelector';

// Hooks
import { useDebounce } from '@/hooks/useDebounce';
import { useI18n } from '@/lib/i18n';

// Types y constantes
import { PURCHASE_STATUS, PAYMENT_STATUS, PURCHASE_PRIORITY } from '@/types/purchaseTypes';

/**
 * @typedef {Object} PurchaseFiltersProps
 * @property {Object} filters - Filtros actuales
 * @property {function} onFiltersChange - Callback cuando cambian los filtros
 * @property {boolean} isLoading - Si está cargando datos
 * @property {number} totalResults - Total de resultados
 * @property {function} onExport - Callback para exportar resultados
 * @property {boolean} showAdvanced - Si mostrar filtros avanzados por defecto
 */

/**
 * Componente de filtros avanzados para compras
 */
const PurchaseFilters = ({
  filters = {},
  onFiltersChange,
  isLoading = false,
  totalResults = 0,
  onExport,
  showAdvanced = false
}) => {
  const { t } = useI18n();
  
  // Estado local para filtros
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: '',
    supplier_id: null,
    start_date: '',
    end_date: '',
    min_amount: '',
    max_amount: '',
    created_by: '',
    payment_status: '',
    priority: '',
    ...filters
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);

  // Debounce para búsqueda
  const debouncedSearch = useDebounce(localFilters.search, 300);
  const debouncedMinAmount = useDebounce(localFilters.min_amount, 500);
  const debouncedMaxAmount = useDebounce(localFilters.max_amount, 500);

  // Sincronizar filtros debounced con parent
  useEffect(() => {
    const updatedFilters = {
      ...localFilters,
      search: debouncedSearch,
      min_amount: debouncedMinAmount,
      max_amount: debouncedMaxAmount
    };
    
    onFiltersChange?.(updatedFilters);
  }, [debouncedSearch, debouncedMinAmount, debouncedMaxAmount, localFilters, onFiltersChange]);

  // Calcular filtros activos
  const activeFiltersCount = useMemo(() => {
    return Object.entries(localFilters).filter(([key, value]) => {
      if (key === 'search') return value.trim() !== '';
      return value !== '' && value !== null && value !== undefined;
    }).length;
  }, [localFilters]);

  // Handlers
  const handleFilterChange = useCallback((key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    const clearedFilters = {
      search: '',
      status: '',
      supplier_id: null,
      start_date: '',
      end_date: '',
      min_amount: '',
      max_amount: '',
      created_by: '',
      payment_status: '',
      priority: ''
    };
    
    setLocalFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  }, [onFiltersChange]);

  const handleExport = useCallback(() => {
    onExport?.(localFilters);
  }, [onExport, localFilters]);

  const toggleAdvanced = useCallback(() => {
    setIsAdvancedOpen(prev => !prev);
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('purchases.filters.title')}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Total Results */}
            <span className="text-sm text-gray-600">
              {t('purchases.filters.results', { count: totalResults })}
            </span>
            
            {/* Export Button */}
            {onExport && totalResults > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('purchases.actions.export')}
              </Button>
            )}
            
            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                {t('purchases.filters.clear')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <Label htmlFor="search">
              {t('purchases.filters.search')}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder={t('purchases.filters.search_placeholder')}
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">
              {t('purchases.filters.status')}
            </Label>
            <Select
              value={localFilters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('purchases.filters.all_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  {t('purchases.filters.all_status')}
                </SelectItem>
                {Object.values(PURCHASE_STATUS).map(status => (
                  <SelectItem key={status} value={status}>
                    {t(`purchases.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier */}
          <div>
            <Label htmlFor="supplier">
              {t('purchases.filters.supplier')}
            </Label>
            <SupplierSelector
              value={localFilters.supplier_id}
              onChange={(value) => handleFilterChange('supplier_id', value)}
              disabled={isLoading}
              placeholder={t('purchases.filters.all_suppliers')}
              allowClear
            />
          </div>
        </div>

        {/* Filtros Avanzados */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAdvanced}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isAdvancedOpen ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('purchases.filters.hide_advanced')}
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4 mr-2" />
                  {t('purchases.filters.show_advanced')}
                </>
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              {/* Date Range */}
              <div>
                <Label htmlFor="start_date">
                  {t('purchases.filters.start_date')}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="start_date"
                    type="date"
                    value={localFilters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="end_date">
                  {t('purchases.filters.end_date')}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="end_date"
                    type="date"
                    value={localFilters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <Label htmlFor="min_amount">
                  {t('purchases.filters.min_amount')}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="min_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={localFilters.min_amount}
                    onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="max_amount">
                  {t('purchases.filters.max_amount')}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="max_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={localFilters.max_amount}
                    onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <Label htmlFor="payment_status">
                  {t('purchases.filters.payment_status')}
                </Label>
                <Select
                  value={localFilters.payment_status}
                  onValueChange={(value) => handleFilterChange('payment_status', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('purchases.filters.all_payment_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      {t('purchases.filters.all_payment_status')}
                    </SelectItem>
                    <SelectItem value="unpaid">
                      {t('purchases.payment_status.unpaid')}
                    </SelectItem>
                    {Object.values(PAYMENT_STATUS).map(status => (
                      <SelectItem key={status} value={status}>
                        {t(`purchases.payment_status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <Label htmlFor="priority">
                  {t('purchases.filters.priority')}
                </Label>
                <Select
                  value={localFilters.priority}
                  onValueChange={(value) => handleFilterChange('priority', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('purchases.filters.all_priorities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      {t('purchases.filters.all_priorities')}
                    </SelectItem>
                    {Object.values(PURCHASE_PRIORITY).map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {t(`purchases.priority.${priority}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Created By */}
              <div>
                <Label htmlFor="created_by">
                  {t('purchases.filters.created_by')}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="created_by"
                    type="text"
                    placeholder={t('purchases.filters.created_by_placeholder')}
                    value={localFilters.created_by}
                    onChange={(e) => handleFilterChange('created_by', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <span className="text-sm text-gray-600 mr-2">
              {t('purchases.filters.active_filters')}:
            </span>
            
            {/* Search Filter */}
            {localFilters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                {localFilters.search}
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 hover:text-red-600"
                  aria-label={t('purchases.filters.remove_filter')}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Status Filter */}
            {localFilters.status && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {t(`purchases.status.${localFilters.status}`)}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1 hover:text-red-600"
                  aria-label={t('purchases.filters.remove_filter')}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Date Range Filter */}
            {(localFilters.start_date || localFilters.end_date) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {localFilters.start_date && localFilters.end_date
                  ? `${localFilters.start_date} - ${localFilters.end_date}`
                  : localFilters.start_date
                  ? `From ${localFilters.start_date}`
                  : `Until ${localFilters.end_date}`
                }
                <button
                  onClick={() => {
                    handleFilterChange('start_date', '');
                    handleFilterChange('end_date', '');
                  }}
                  className="ml-1 hover:text-red-600"
                  aria-label={t('purchases.filters.remove_filter')}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {/* Amount Range Filter */}
            {(localFilters.min_amount || localFilters.max_amount) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {localFilters.min_amount && localFilters.max_amount
                  ? `$${localFilters.min_amount} - $${localFilters.max_amount}`
                  : localFilters.min_amount
                  ? `From $${localFilters.min_amount}`
                  : `Up to $${localFilters.max_amount}`
                }
                <button
                  onClick={() => {
                    handleFilterChange('min_amount', '');
                    handleFilterChange('max_amount', '');
                  }}
                  className="ml-1 hover:text-red-600"
                  aria-label={t('purchases.filters.remove_filter')}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {t('purchases.filters.loading')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(PurchaseFilters);
