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

  const hasActiveFilters = filters.status !== 'all' || filters.dateStart || filters.dateEnd
    || filters.minAmount || filters.maxAmount || filters.daysOverdue;

  return (
    <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-sm space-y-6">
      {/* Row 1: Search | Status | Date range */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70" htmlFor="search-client">{t('receivables.master.filter.search_client')}</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              <Search size={18} />
            </div>
            <Input
              id="search-client"
              type="text"
              className="pl-10 h-11 border-border-subtle bg-slate-50/50 focus:bg-white transition-all rounded-lg"
              placeholder={t('receivables.master.filter.company_placeholder')}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.master.filter.status')}</Label>
          <Select value={filters.status} onValueChange={(v) => onFilterChange('status', v)}>
            <SelectTrigger className="h-11 border-border-subtle bg-slate-50/50 rounded-lg font-bold text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('receivables.master.filter.all_statuses')}</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
              <SelectItem value="partial">Pago Parcial</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.master.filter.date_range')}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-11 border-border-subtle bg-slate-50/50 rounded-lg font-bold text-xs"
              value={filters.dateStart}
              onChange={(e) => onFilterChange('dateStart', e.target.value)}
            />
            <span className="text-text-secondary font-black opacity-30">—</span>
            <Input
              type="date"
              className="h-11 border-border-subtle bg-slate-50/50 rounded-lg font-bold text-xs"
              value={filters.dateEnd}
              onChange={(e) => onFilterChange('dateEnd', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Amount range | Days overdue | Clear */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.master.filter.amount_range')}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="h-11 border-border-subtle bg-slate-50/50 rounded-lg font-bold text-sm"
              placeholder={t('receivables.master.filter.min_amount')}
              value={filters.minAmount}
              onChange={(e) => onFilterChange('minAmount', e.target.value)}
              min="0"
            />
            <span className="text-text-secondary font-black opacity-30">—</span>
            <Input
              type="number"
              className="h-11 border-border-subtle bg-slate-50/50 rounded-lg font-bold text-sm"
              placeholder={t('receivables.master.filter.max_amount')}
              value={filters.maxAmount}
              onChange={(e) => onFilterChange('maxAmount', e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{t('receivables.master.filter.days_overdue')}</Label>
          <Input
            type="number"
            className="h-11 border-border-subtle bg-slate-50/50 rounded-lg font-bold text-sm"
            placeholder={t('receivables.master.filter.days_overdue_placeholder')}
            value={filters.daysOverdue}
            onChange={(e) => onFilterChange('daysOverdue', e.target.value)}
            min="0"
          />
        </div>

        <div className="flex items-end">
          <Button variant="outline" size="md" onClick={onReset} className="w-full h-11 border-border-subtle bg-white hover:bg-slate-50 text-xs font-black uppercase tracking-widest">
            {t('receivables.master.filter.clear')}
          </Button>
        </div>
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border-subtle/50">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 mr-2">Filtros Activos:</span>
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-primary border-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
              {t('receivables.master.filter.status')}: {statusLabel(filters.status)}
              <X className="size-3 cursor-pointer hover:text-error transition-colors" onClick={() => onFilterChange('status', 'all')} />
            </Badge>
          )}
          {filters.dateStart && (
            <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-primary border-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
              Desde: {filters.dateStart}
              <X className="size-3 cursor-pointer hover:text-error transition-colors" onClick={() => onFilterChange('dateStart', '')} />
            </Badge>
          )}
          {filters.dateEnd && (
            <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-primary border-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
              Hasta: {filters.dateEnd}
              <X className="size-3 cursor-pointer hover:text-error transition-colors" onClick={() => onFilterChange('dateEnd', '')} />
            </Badge>
          )}
          {filters.minAmount && (
            <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-primary border-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
              Min: {Number(filters.minAmount).toLocaleString()}
              <X className="size-3 cursor-pointer hover:text-error transition-colors" onClick={() => onFilterChange('minAmount', '')} />
            </Badge>
          )}
          {filters.maxAmount && (
            <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-primary border-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
              Max: {Number(filters.maxAmount).toLocaleString()}
              <X className="size-3 cursor-pointer hover:text-error transition-colors" onClick={() => onFilterChange('maxAmount', '')} />
            </Badge>
          )}
          {filters.daysOverdue && (
            <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-primary border-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
              {filters.daysOverdue}+ días
              <X className="size-3 cursor-pointer hover:text-error transition-colors" onClick={() => onFilterChange('daysOverdue', '')} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default MasterListFilters;
