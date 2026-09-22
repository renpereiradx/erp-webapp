import type { ReactNode } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import TablePagination from '@/components/ui/TablePagination';
import DrilldownTable from './DrilldownTable';
import EntitySearchSelect from './EntitySearchSelect';
import type { EntityOption } from './EntitySearchSelect';
import { useDrilldownQuery } from '../hooks/useDrilldownQuery';
import type { DrilldownFetcher } from '../hooks/useDrilldownQuery';
import type { DrilldownColumn } from '@/domain/relational-analytics/types';

interface DrilldownPageProps<Row> {
  /** id de la entidad (query param de la ruta); ausente → selector */
  entityId?: string | null;
  titleKey: string;
  titleFallback: string;
  subtitleKey: string;
  subtitleFallback: string;
  entityLabelKey: string;
  entityLabelFallback: string;
  columns: readonly DrilldownColumn<Row>[];
  rowKey: (row: Row) => string;
  defaultSort: string;
  fetcher: DrilldownFetcher<Row>;
  /** búsqueda para el selector (producto/cliente/proveedor) */
  searchEntity?: (term: string) => Promise<EntityOption[]>;
  onEntityPicked?: (id: string) => void;
  /** banner opcional (ej. meta excluded_other_currency del endpoint #4) */
  renderMetaBanner?: (view: { excludedOtherCurrency: number }) => ReactNode;
  emptyKey: string;
  emptyFallback: string;
  testId?: string;
}

/**
 * Shell genérico de los 4 drill-downs relacionales: encabezado, selector de
 * entidad (sin id), barra de filtros (rango de fechas + q draft/aplicado +
 * refresh), tabla ordenable y paginación server-side (T9: 10 filas).
 */
function DrilldownPage<Row>({
  entityId,
  titleKey,
  titleFallback,
  subtitleKey,
  subtitleFallback,
  entityLabelKey,
  entityLabelFallback,
  columns,
  rowKey,
  defaultSort,
  fetcher,
  searchEntity,
  onEntityPicked,
  renderMetaBanner,
  emptyKey,
  emptyFallback,
  testId,
}: DrilldownPageProps<Row>) {
  const { t } = useI18n();
  const query = useDrilldownQuery<Row>({ id: entityId ?? undefined, fetcher, defaultSort });
  const searchPlaceholder = t(entityLabelKey, entityLabelFallback);

  if (!entityId) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display" data-testid={testId ?? 'drilldown-page'}>
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase leading-none">{t(titleKey, titleFallback)}</h1>
          <p className="text-on-surface-deep text-sm font-medium">{t(subtitleKey, subtitleFallback)}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface p-6 shadow-sm space-y-4 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-deep">
            {t('bi.relational.pick.prompt', 'Elegí {entity} para ver el detalle', { entity: searchPlaceholder })}
          </p>
          {searchEntity && onEntityPicked ? (
            <EntitySearchSelect search={searchEntity} onPick={onEntityPicked} />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display" data-testid={testId ?? 'drilldown-page'}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase leading-none">{t(titleKey, titleFallback)}</h1>
          <p className="text-on-surface-deep text-sm font-medium">{t(subtitleKey, subtitleFallback)}</p>
          <p className="font-mono text-[10px] font-black uppercase tracking-widest text-on-surface-deep">
            {searchPlaceholder}: {entityId}
          </p>
        </div>
        <button
          type="button"
          onClick={query.refresh}
          className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 shadow-sm hover:bg-surface-muted transition-colors"
        >
          <RefreshCcw size={14} className={query.loading ? 'animate-spin text-primary' : 'text-on-surface-deep'} aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-widest">{t('bi.relational.filters.refresh', 'Actualizar')}</span>
        </button>
      </div>

      {renderMetaBanner ? renderMetaBanner({ excludedOtherCurrency: query.view.excludedOtherCurrency }) : null}

      {/* Filtros: fechas + búsqueda (se aplican con Enter/botón; tipear no fetcha) */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-surface p-3 shadow-sm">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-deep">
          {t('bi.relational.filters.from', 'Desde')}
          <input
            type="date"
            value={query.dateFrom}
            onChange={(event) => query.setDateFrom(event.target.value)}
            className="rounded-input border border-border-subtle bg-surface px-2 py-1.5 text-sm font-medium"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-deep">
          {t('bi.relational.filters.to', 'Hasta')}
          <input
            type="date"
            value={query.dateTo}
            onChange={(event) => query.setDateTo(event.target.value)}
            className="rounded-input border border-border-subtle bg-surface px-2 py-1.5 text-sm font-medium"
          />
        </label>
        <div className="flex flex-1 items-center gap-2 min-w-[220px]">
          <input
            type="text"
            value={query.qDraft}
            onChange={(event) => query.setQDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') query.applyQ();
            }}
            placeholder={t('bi.relational.filters.qPlaceholder', 'Buscar por nombre o documento...')}
            className="w-full rounded-input border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium outline-none focus:border-primary"
            aria-label={t('bi.relational.filters.qPlaceholder', 'Buscar por nombre o documento...')}
          />
          <button
            type="button"
            onClick={query.applyQ}
            className="rounded-button bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-widest text-on-primary hover:bg-primary-container transition-colors"
          >
            {t('bi.relational.filters.apply', 'Aplicar')}
          </button>
        </div>
      </div>

      {query.loading ? (
        <div className="flex items-center justify-center min-h-[280px]" data-testid="drilldown-loading">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" aria-hidden="true" />
          <span className="ml-3 font-bold text-on-surface-deep uppercase tracking-widest text-xs">
            {t('bi.relational.loading', 'Cargando...')}
          </span>
        </div>
      ) : query.error ? (
        <div className="flex flex-col items-center justify-center min-h-[280px] gap-3" data-testid="drilldown-error">
          <p className="text-sm font-bold text-foreground">{t('bi.relational.loadError', 'No se pudieron cargar los datos.')}</p>
          <p className="text-xs text-on-surface-deep uppercase tracking-widest">{t('bi.common.checkConnection', 'Verifique la conexión e intente nuevamente')}</p>
          <button
            type="button"
            onClick={query.refresh}
            className="rounded-button bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-on-primary hover:bg-primary-container transition-colors"
          >
            {t('bi.relational.retry', 'Reintentar')}
          </button>
        </div>
      ) : (
        <>
          <DrilldownTable
            columns={columns}
            rows={query.view.rows}
            rowKey={rowKey}
            sort={query.sort}
            onSort={query.toggleSort}
            emptyKey={emptyKey}
            emptyFallback={emptyFallback}
          />
          <TablePagination
            page={query.view.page}
            totalPages={query.view.totalPages}
            totalItems={query.view.total}
            onPageChange={query.setPage}
          />
        </>
      )}
    </div>
  );
}

export default DrilldownPage;
