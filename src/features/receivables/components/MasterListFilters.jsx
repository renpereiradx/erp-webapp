import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Panel de filtros para la lista maestra de cuentas por cobrar.
 */
const MasterListFilters = ({ filters, onFilterChange, onReset }) => {
  const { t } = useI18n();

  return (
    <div className="rec-filter-panel">
      <div className="rec-filter-panel__row">
        {/* Búsqueda */}
        <div className="rec-input-group">
          <label className="rec-input-group__label">{t('receivables.master.filter.search_client')}</label>
          <div className="rec-input-group__wrapper">
            <div className="rec-input-group__icon">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              type="text" 
              className="rec-input" 
              placeholder={t('receivables.master.filter.company_placeholder')}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        {/* Estado */}
        <div className="rec-input-group">
          <label className="rec-input-group__label">{t('receivables.master.filter.status')}</label>
          <div className="rec-select-wrapper">
            <select 
              className="rec-select"
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              <option value="all">{t('receivables.master.filter.all_statuses')}</option>
              <option value="pending">Pendiente</option>
              <option value="overdue">Vencido</option>
              <option value="partial">Pago Parcial</option>
              <option value="paid">Pagado</option>
            </select>
          </div>
        </div>

        {/* Rango de Fechas */}
        <div className="rec-input-group">
          <label className="rec-input-group__label">{t('receivables.master.filter.date_range')}</label>
          <div className="flex gap-2 items-center">
            <div className="rec-input-group__wrapper">
              <input type="date" className="rec-input" />
            </div>
            <span className="text-secondary">-</span>
            <div className="rec-input-group__wrapper">
              <input type="date" className="rec-input" />
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset}>
            {t('receivables.master.filter.clear')}
          </Button>
          <Button variant="primary">
            <span className="material-symbols-outlined">filter_list</span>
            <span>{t('receivables.master.filter.apply')}</span>
          </Button>
        </div>
      </div>

      {/* Etiquetas Activas */}
      <div className="rec-filter-panel__active-tags">
        {filters.status !== 'all' && (
          <div className="rec-tag rec-tag--blue">
            {t('receivables.master.filter.status')}: {filters.status}
            <span className="rec-tag__close material-symbols-outlined" onClick={() => onFilterChange('status', 'all')}>close</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterListFilters;
