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
    <div className="rec-filter-panel">
      {/* Row 1: Search | Status | Date range */}
      <div className="rec-filter-panel__row">
        <div className="rec-filter-panel__field">
          <Label htmlFor="search-client">{t('receivables.master.filter.search_client')}</Label>
          <div className="input-search">
            <Search className="input-search__icon" style={{ zIndex: 1 }} />
            <Input
              id="search-client"
              type="text"
              placeholder={t('receivables.master.filter.company_placeholder')}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className="rec-filter-panel__field">
          <Label>{t('receivables.master.filter.status')}</Label>
          <Select value={filters.status} onValueChange={(v) => onFilterChange('status', v)}>
            <SelectTrigger className="rec-filter-panel__select-trigger">
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

        <div className="rec-filter-panel__field">
          <Label>{t('receivables.master.filter.date_range')}</Label>
          <div className="rec-filter-panel__range">
            <Input
              type="date"
              value={filters.dateStart}
              onChange={(e) => onFilterChange('dateStart', e.target.value)}
            />
            <span className="rec-filter-panel__separator">—</span>
            <Input
              type="date"
              value={filters.dateEnd}
              onChange={(e) => onFilterChange('dateEnd', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Amount range | Days overdue | Clear */}
      <div className="rec-filter-panel__row">
        <div className="rec-filter-panel__field">
          <Label>{t('receivables.master.filter.amount_range')}</Label>
          <div className="rec-filter-panel__range">
            <Input
              type="number"
              placeholder={t('receivables.master.filter.min_amount')}
              value={filters.minAmount}
              onChange={(e) => onFilterChange('minAmount', e.target.value)}
              min="0"
            />
            <span className="rec-filter-panel__separator">—</span>
            <Input
              type="number"
              placeholder={t('receivables.master.filter.max_amount')}
              value={filters.maxAmount}
              onChange={(e) => onFilterChange('maxAmount', e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="rec-filter-panel__field">
          <Label>{t('receivables.master.filter.days_overdue')}</Label>
          <Input
            type="number"
            placeholder={t('receivables.master.filter.days_overdue_placeholder')}
            value={filters.daysOverdue}
            onChange={(e) => onFilterChange('daysOverdue', e.target.value)}
            min="0"
          />
        </div>

        <div className="rec-filter-panel__field" style={{ justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onReset} className="w-full">
            {t('receivables.master.filter.clear')}
          </Button>
        </div>
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="rec-filter-panel__active-tags">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1.5">
              {t('receivables.master.filter.status')}: {statusLabel(filters.status)}
              <X className="size-3 cursor-pointer" onClick={() => onFilterChange('status', 'all')} />
            </Badge>
          )}
          {filters.dateStart && (
            <Badge variant="secondary" className="gap-1.5">
              Desde: {filters.dateStart}
              <X className="size-3 cursor-pointer" onClick={() => onFilterChange('dateStart', '')} />
            </Badge>
          )}
          {filters.dateEnd && (
            <Badge variant="secondary" className="gap-1.5">
              Hasta: {filters.dateEnd}
              <X className="size-3 cursor-pointer" onClick={() => onFilterChange('dateEnd', '')} />
            </Badge>
          )}
          {filters.minAmount && (
            <Badge variant="secondary" className="gap-1.5">
              Min: {Number(filters.minAmount).toLocaleString()}
              <X className="size-3 cursor-pointer" onClick={() => onFilterChange('minAmount', '')} />
            </Badge>
          )}
          {filters.maxAmount && (
            <Badge variant="secondary" className="gap-1.5">
              Max: {Number(filters.maxAmount).toLocaleString()}
              <X className="size-3 cursor-pointer" onClick={() => onFilterChange('maxAmount', '')} />
            </Badge>
          )}
          {filters.daysOverdue && (
            <Badge variant="secondary" className="gap-1.5">
              {filters.daysOverdue}+ días
              <X className="size-3 cursor-pointer" onClick={() => onFilterChange('daysOverdue', '')} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default MasterListFilters;
