import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const MasterListFilters = ({ filters, onFilterChange, onReset }) => {
  const { t } = useI18n();

  const statusLabel = (value) => {
    const labels = { pending: 'Pendiente', overdue: 'Vencido', partial: 'Pago Parcial', paid: 'Pagado' };
    return labels[value] || value;
  };

  const hasActiveFilters = filters.status !== 'all' || filters.dateStart || filters.dateEnd;

  return (
    <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm p-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
        {/* Search Client */}
        <div className="flex-1 min-w-[200px]">
          <Label className="text-[#111418] dark:text-white text-xs font-semibold leading-normal pb-1.5 block" htmlFor="search-client">
            {t('receivables.master.filter.search_client', 'Buscar Cliente')}
          </Label>
          <div className="flex w-full items-stretch rounded-lg h-10 bg-white dark:bg-gray-800 border border-[#d1d5db] dark:border-gray-600 hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <div className="text-[#617589] flex items-center justify-center pl-3">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <Input
              id="search-client"
              type="text"
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-[#111418] dark:text-white text-sm placeholder:text-[#9ca3af] px-2 shadow-none"
              placeholder={t('receivables.master.filter.company_placeholder', 'Empresa o Nombre')}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex-1 min-w-[200px]">
          <Label className="text-[#111418] dark:text-white text-xs font-semibold leading-normal pb-1.5 block">
            {t('receivables.master.filter.status', 'Estado')}
          </Label>
          <div className="relative">
            <Select value={filters.status} onValueChange={(v) => onFilterChange('status', v)}>
              <SelectTrigger className="w-full h-10 rounded-lg bg-white dark:bg-gray-800 border border-[#d1d5db] dark:border-gray-600 text-[#111418] dark:text-white text-sm px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-none font-normal">
                <SelectValue placeholder={t('receivables.master.filter.all_statuses', 'Todos los estados')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('receivables.master.filter.all_statuses', 'Todos los estados')}</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="partial">Pago Parcial</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex-1 min-w-[240px]">
          <Label className="text-[#111418] dark:text-white text-xs font-semibold leading-normal pb-1.5 block">
            {t('receivables.master.filter.date_range', 'Rango de Fechas')}
          </Label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Input
                type="date"
                className="w-full h-10 rounded-lg bg-white dark:bg-gray-800 border-[#d1d5db] dark:border-gray-600 text-[#111418] dark:text-white text-sm px-3 focus-visible:ring-primary shadow-none"
                value={filters.dateStart}
                onChange={(e) => onFilterChange('dateStart', e.target.value)}
              />
            </div>
            <span className="text-[#617589]">-</span>
            <div className="relative flex-1">
              <Input
                type="date"
                className="w-full h-10 rounded-lg bg-white dark:bg-gray-800 border-[#d1d5db] dark:border-gray-600 text-[#111418] dark:text-white text-sm px-3 focus-visible:ring-primary shadow-none"
                value={filters.dateEnd}
                onChange={(e) => onFilterChange('dateEnd', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={onReset}
            className="h-10 px-4 rounded-lg bg-[#f0f2f4] dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t('receivables.master.filter.clear', 'Limpiar')}
          </button>
          <button className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 shadow-sm transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            {t('common.apply', 'Aplicar')}
          </button>
        </div>
      </div>

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.status !== 'all' && (
            <div className="flex items-center gap-1 bg-[#e3f2fd] text-primary text-xs font-medium px-2 py-1 rounded-md border border-blue-100">
              {t('receivables.master.filter.status')}: {statusLabel(filters.status)}
              <button className="hover:text-blue-800 ml-1 flex items-center" onClick={() => onFilterChange('status', 'all')}>
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
          {filters.dateStart && (
            <div className="flex items-center gap-1 bg-[#e3f2fd] text-primary text-xs font-medium px-2 py-1 rounded-md border border-blue-100">
              Desde: {filters.dateStart}
              <button className="hover:text-blue-800 ml-1 flex items-center" onClick={() => onFilterChange('dateStart', '')}>
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
          {filters.dateEnd && (
            <div className="flex items-center gap-1 bg-[#e3f2fd] text-primary text-xs font-medium px-2 py-1 rounded-md border border-blue-100">
              Hasta: {filters.dateEnd}
              <button className="hover:text-blue-800 ml-1 flex items-center" onClick={() => onFilterChange('dateEnd', '')}>
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MasterListFilters;
