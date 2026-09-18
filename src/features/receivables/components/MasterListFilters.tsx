import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import type { MasterListFiltersState as Filters } from '../hooks/useReceivablesMasterList';

/**
 * Filtros de la lista maestra de CxC.
 * Migración FASE 3: .tsx + tokens. El botón "Aplicar" sin handler se
 * eliminó (los filtros aplican al cambio, §2.6).
 */

interface MasterListFiltersProps {
  filters: Filters
  onFilterChange: (key: string, value: string) => void
  onReset: () => void
}

const MasterListFilters = ({ filters, onFilterChange, onReset }: MasterListFiltersProps) => {
  const { t } = useI18n();

  const statusLabel = (value: string) => {
    const labels: Record<string, string> = {
      pending: t('bi.receivables.status.PENDING', 'Pendiente', {}),
      overdue: t('bi.receivables.status.OVERDUE', 'Vencido', {}),
      partial: t('bi.receivables.status.PARTIAL', 'Pago Parcial', {}),
      paid: t('bi.receivables.status.PAID', 'Pagado', {}),
    };
    return labels[value] || value;
  };

  const hasActiveFilters = filters.status !== 'all' || filters.dateStart || filters.dateEnd;
  const badgeClass = 'flex items-center gap-1 bg-primary/10 text-primary text-body-sm-bold px-sm py-xs rounded-sm border border-primary/20';

  return (
    <div className="bg-surface rounded-md border border-border-subtle shadow-whisper p-md">
      <div className="flex flex-col lg:flex-row gap-md lg:items-end">
        {/* Search Client */}
        <div className="flex-1 min-w-[200px]">
          <Label className="text-body-sm-bold text-foreground pb-xs block" htmlFor="search-client">
            {t('receivables.master.filter.search_client', 'Buscar Cliente', {})}
          </Label>
          <Input
            id="search-client"
            type="text"
            placeholder={t('receivables.master.filter.company_placeholder', 'Empresa o Nombre', {})}
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex-1 min-w-[200px]">
          <Label className="text-body-sm-bold text-foreground pb-xs block">
            {t('receivables.master.filter.status', 'Estado', {})}
          </Label>
          <Select value={filters.status} onValueChange={(v) => onFilterChange('status', v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('receivables.master.filter.all_statuses', 'Todos los estados', {})} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('receivables.master.filter.all_statuses', 'Todos los estados', {})}</SelectItem>
              <SelectItem value="pending">{t('bi.receivables.status.PENDING', 'Pendiente', {})}</SelectItem>
              <SelectItem value="overdue">{t('bi.receivables.status.OVERDUE', 'Vencido', {})}</SelectItem>
              <SelectItem value="partial">{t('bi.receivables.status.PARTIAL', 'Pago Parcial', {})}</SelectItem>
              <SelectItem value="paid">{t('bi.receivables.status.PAID', 'Pagado', {})}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="flex-1 min-w-[240px]">
          <Label className="text-body-sm-bold text-foreground pb-xs block">
            {t('receivables.master.filter.date_range', 'Rango de Fechas', {})}
          </Label>
          <div className="flex gap-sm items-center">
            <Input
              type="date"
              aria-label={t('bi.receivables.master.filter.from', 'Desde', {})}
              className="w-full"
              value={filters.dateStart}
              onChange={(e) => onFilterChange('dateStart', e.target.value)}
            />
            <span className="text-on-surface-deep">-</span>
            <Input
              type="date"
              aria-label={t('bi.receivables.master.filter.to', 'Hasta', {})}
              className="w-full"
              value={filters.dateEnd}
              onChange={(e) => onFilterChange('dateEnd', e.target.value)}
            />
          </div>
        </div>

        {/* Action */}
        <Button variant="secondary" onClick={onReset}>
          {t('receivables.master.filter.clear', 'Limpiar', {})}
        </Button>
      </div>

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-sm mt-md">
          {filters.status !== 'all' && (
            <div className={badgeClass}>
              {t('receivables.master.filter.status', 'Estado', {})}: {statusLabel(filters.status)}
              <button
                type="button"
                aria-label={t('common.clear', 'Limpiar', {})}
                className="hover:text-primary/70 ml-xs flex items-center"
                onClick={() => onFilterChange('status', 'all')}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
              </button>
            </div>
          )}
          {filters.dateStart && (
            <div className={badgeClass}>
              {t('bi.receivables.master.filter.from', 'Desde', {})}: {filters.dateStart}
              <button
                type="button"
                aria-label={t('common.clear', 'Limpiar', {})}
                className="hover:text-primary/70 ml-xs flex items-center"
                onClick={() => onFilterChange('dateStart', '')}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
              </button>
            </div>
          )}
          {filters.dateEnd && (
            <div className={badgeClass}>
              {t('bi.receivables.master.filter.to', 'Hasta', {})}: {filters.dateEnd}
              <button
                type="button"
                aria-label={t('common.clear', 'Limpiar', {})}
                className="hover:text-primary/70 ml-xs flex items-center"
                onClick={() => onFilterChange('dateEnd', '')}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MasterListFilters
