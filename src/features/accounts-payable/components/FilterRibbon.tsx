import { Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Filtro del dashboard de CxP (período, moneda, búsqueda).
 * Migración FASE 4: .tsx + tokens; el botón "Filtros avanzados" sin
 * handler se eliminó (§2.6).
 */

interface FilterRibbonProps {
  filters?: { period?: string; currency?: string; search?: string }
  onFilterChange?: (key: string, value: string) => void
}

const FilterRibbon = ({ filters = {}, onFilterChange = () => {} }: FilterRibbonProps) => {
  const { t } = useI18n();

  return (
    <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper flex flex-wrap items-center gap-lg overflow-hidden">
      <div className="flex flex-col gap-xs">
        <label htmlFor="payables-period" className="text-label-caps uppercase text-on-surface-deep">
          {t('bi.payables.filter.period', 'Período', {})}
        </label>
        <select
          id="payables-period"
          value={filters.period || 'month'}
          onChange={(e) => onFilterChange('period', e.target.value)}
          className="bg-surface-muted border border-transparent focus:border-primary/30 rounded-sm text-body-md focus:ring-2 focus:ring-primary/10 min-w-[180px] p-sm outline-none transition-colors cursor-pointer text-foreground"
        >
          <option value="today">{t('bi.payables.filter.today', 'Hoy', {})}</option>
          <option value="week">{t('bi.payables.filter.week', 'Esta Semana', {})}</option>
          <option value="month">{t('bi.payables.filter.month', 'Este Mes', {})}</option>
          <option value="quarter">{t('bi.payables.filter.quarter', 'Último Trimestre', {})}</option>
          <option value="year">{t('bi.payables.filter.year', 'Año Fiscal', {})}</option>
        </select>
      </div>

      <div className="flex flex-col gap-xs">
        <label htmlFor="payables-currency" className="text-label-caps uppercase text-on-surface-deep">
          {t('bi.payables.filter.currency', 'Moneda', {})}
        </label>
        <select
          id="payables-currency"
          value={filters.currency || 'PYG'}
          onChange={(e) => onFilterChange('currency', e.target.value)}
          className="bg-surface-muted border border-transparent focus:border-primary/30 rounded-sm text-body-md focus:ring-2 focus:ring-primary/10 p-sm outline-none transition-colors cursor-pointer text-foreground"
        >
          <option value="PYG">PYG - Guaraní</option>
          <option value="USD">USD - Dólar</option>
        </select>
      </div>

      <div className="ml-auto flex items-center gap-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-deep" aria-hidden="true" />
          <input
            type="text"
            aria-label={t('bi.payables.filter.search', 'Buscar', {})}
            placeholder={t('bi.payables.filter.search', 'Buscar...', {})}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9 pr-4 py-sm bg-surface-muted border border-transparent focus:border-primary/30 rounded-sm text-body-md text-foreground outline-none transition-all w-48 focus:w-64"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterRibbon
