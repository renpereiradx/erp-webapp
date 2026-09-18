import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Clock, Wallet, AlertCircle, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatNumber, formatPYG } from '@/utils/currencyUtils';
import { usePayables } from '@/features/accounts-payable/hooks/usePayables';
import {
  buildAgingDistribution,
  buildAgingReportKpis,
  buildAgingSegments,
  buildSupplierAgingRows,
} from '@/domain/payables/aging';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';

/**
 * Reporte de Antigüedad de Deuda (CxP).
 * Migración FASE 4 (plan §4): god component dividido — KPIs / hero de
 * distribución / tabla analítica. Fuera (§2.6 + honestidad): los 4 botones
 * muertos (Filtrar/Excel/Imprimir/Nuevo Pago), el mini-chart DPO con
 * alturas `h-[${h}%]` que nunca compilaron y el gauge clipPath con etiqueta
 * "ALTO" fabricada. Retry vía refetch (no reload).
 */

const PAGE_SIZE = 10;

const PayablesAgingReport = () => {
  const { t } = useI18n();
  const { loading, error, overview, agingReport, statistics, fetchOverview, fetchAgingReport, fetchStatistics } = usePayables();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOverview();
    fetchAgingReport();
    fetchStatistics('month');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    fetchOverview();
    fetchAgingReport();
    fetchStatistics('month');
  };

  const agingKpis = useMemo(() => buildAgingReportKpis(overview, statistics), [overview, statistics]);
  const distribution = useMemo(() => buildAgingDistribution(overview), [overview]);
  const distributionSegments = useMemo(() => buildAgingSegments(distribution), [distribution]);
  const filteredTableData = useMemo(
    () => buildSupplierAgingRows(agingReport?.by_supplier as never, searchTerm),
    [agingReport, searchTerm],
  );

  const paginatedData = useMemo(
    () => filteredTableData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredTableData, currentPage],
  );
  const totalPages = Math.max(1, Math.ceil(filteredTableData.length / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.payables.breadcrumb', 'Finanzas', {})}
          title={t('bi.payables.agingReport.title', 'Reporte de Antigüedad de Deuda', {})}
          subtitle={`${t('bi.payables.agingReport.asOf', 'Corte al', {})}: ${new Date().toLocaleDateString('es-PY', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`}
        />

        {loading && !overview && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="aging-report-skeleton">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
              ))}
            </div>
            <div className="h-24 bg-surface-muted rounded-md animate-pulse" />
            <GenericSkeletonList count={6} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && !overview && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.payables.agingReport.errorTitle', 'No se pudo cargar el reporte de antigüedad', {})}
              message={error}
              onRetry={retry}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Hero: distribución global */}
            <section className="bg-surface p-lg rounded-md shadow-whisper mt-lg">
              <div className="flex flex-col md:flex-row justify-between md:items-end mb-lg gap-sm">
                <div>
                  <h2 className="text-title-md text-foreground">
                    {t('bi.payables.agingReport.hero.title', 'Distribución Global por Vencimiento', {})}
                  </h2>
                  <p className="text-body-md text-on-surface-deep">
                    {t('bi.payables.agingReport.hero.subtitle', 'Visualización del flujo de caja comprometido y deuda vencida.', {})}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('bi.payables.agingReport.hero.total', 'Deuda Total Consolidada', {})}
                  </p>
                  <p className="text-headline-lg-mobile font-data-mono text-data-mono text-foreground tracking-tight">
                    {formatPYG(distribution?.total || 0)}
                  </p>
                </div>
              </div>

              <div className="mb-md space-y-sm">
                <div className="flex flex-wrap gap-sm">
                  {distributionSegments.map((segment) => (
                    <span
                      key={segment.key}
                      className="inline-flex items-center gap-xs px-sm py-xs rounded-sm bg-surface-muted border border-border-subtle"
                    >
                      <span className={`w-2 h-2 rounded-full ${segment.bgClass}`} aria-hidden="true" />
                      <span className="text-label-caps uppercase text-on-surface-deep">{segment.shortLabel}</span>
                      <span className="text-body-sm-bold font-data-mono text-data-mono text-foreground">
                        {formatNumber(segment.percentage)}%
                      </span>
                    </span>
                  ))}
                </div>

                <div className="relative w-full rounded-md bg-surface-muted p-xs border border-border-subtle overflow-hidden">
                  <div className="flex h-12 md:h-16 w-full rounded-sm overflow-hidden">
                    {distributionSegments.map((segment, index) => {
                      const percentLabel = `${formatNumber(segment.percentage)}%`;
                      const showFullLabel = segment.percentage >= 12;
                      const showCompactLabel = segment.percentage >= 6;
                      return (
                        <div
                          key={segment.key}
                          className={`relative h-full flex items-center justify-center transition-all hover:brightness-110 ${segment.bgClass} ${index > 0 ? 'border-l border-white/30' : ''}`}
                          style={{ width: `${segment.percentage}%` }}
                          title={`${segment.label} ${segment.shortLabel}: ${percentLabel}`}
                        >
                          {showFullLabel && (
                            <span className={`hidden md:block px-sm text-body-sm-bold whitespace-nowrap ${segment.textClass}`}>
                              {segment.shortLabel} ({percentLabel})
                            </span>
                          )}
                          {!showFullLabel && showCompactLabel && (
                            <span className={`hidden md:block px-sm text-body-sm-bold whitespace-nowrap ${segment.textClass}`}>
                              {percentLabel}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Leyenda */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                {[
                  { dot: 'bg-success', label: t('bi.payables.agingSummary.onTime', 'Al Día', {}), amount: distribution?.current.amount },
                  { dot: 'bg-warning', label: t('bi.payables.agingReport.legend.days30', 'Vencido (31-60 d)', {}), amount: distribution?.days30_60.amount },
                  { dot: 'bg-warning', label: t('bi.payables.agingReport.legend.days60', 'Vencido (61-90 d)', {}), amount: distribution?.days60_90.amount },
                  { dot: 'bg-error', label: t('bi.payables.agingReport.legend.over90', 'Crítico (+90 d)', {}), amount: distribution?.over90.amount },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-xs p-sm rounded-md bg-surface-muted border border-transparent hover:border-border-subtle transition-colors">
                    <div className="flex items-center gap-sm">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} aria-hidden="true" />
                      <p className="text-label-caps uppercase text-on-surface-deep">{item.label}</p>
                    </div>
                    <p className="text-body-md-bold font-data-mono text-data-mono text-foreground">{formatPYG(item.amount || 0)}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* KPI Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-md mt-lg">
              <div className="bg-surface p-lg rounded-md shadow-whisper" data-testid="kpi-dpo">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                      {t('bi.payables.agingReport.kpi.dpo', 'DPO (Días Promedio de Pago)', {})}
                    </p>
                    <h3 className="text-headline-lg-mobile font-data-mono text-data-mono text-foreground tracking-tight">
                      {agingKpis.dpo}
                    </h3>
                  </div>
                  <div className="bg-primary/10 p-sm rounded-md shrink-0 text-primary border border-primary/10">
                    <Clock size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-surface p-lg rounded-md shadow-whisper" data-testid="kpi-overdue-pct">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                      {t('bi.payables.agingReport.kpi.overduePct', '% de Deuda Vencida', {})}
                    </p>
                    <h3 className="text-headline-lg-mobile font-data-mono text-data-mono text-foreground tracking-tight">
                      {agingKpis.overdue}
                    </h3>
                  </div>
                  <div className="bg-warning/10 p-sm rounded-md shrink-0 text-warning border border-warning/10">
                    <AlertCircle size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-surface p-lg rounded-md shadow-whisper" data-testid="kpi-critical">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-label-caps uppercase text-on-surface-deep mb-xs">
                      {t('bi.payables.agingReport.kpi.critical', 'Monto en Riesgo Crítico', {})}
                    </p>
                    <h3 className="text-title-md font-data-mono text-data-mono text-error tracking-tight break-words">
                      {agingKpis.critical}
                    </h3>
                  </div>
                  <div className="bg-error/10 p-sm rounded-md shrink-0 text-error border border-error/10">
                    <AlertTriangle size={20} />
                  </div>
                </div>
                <div className="mt-md flex items-center gap-sm">
                  <span className="text-label-caps uppercase text-on-surface-deep bg-surface-muted px-sm py-xs rounded-xs border border-border-subtle">
                    {t('bi.payables.agingReport.kpi.suppliers', '{n} PROVEEDORES', { n: filteredTableData.length })}
                  </span>
                </div>
              </div>
            </section>

            {/* Tabla analítica */}
            <section className="bg-surface rounded-md shadow-whisper overflow-hidden mt-lg">
              <div className="px-md py-sm border-b border-border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm bg-surface-muted">
                <h2 className="text-title-md text-foreground">
                  {t('bi.payables.agingReport.table.title', 'Desglose Analítico por Proveedor', {})}
                </h2>
                <div className="flex items-center gap-sm w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep h-4 w-4" aria-hidden="true" />
                    <input
                      className="w-full pl-9 pr-4 py-sm bg-surface border border-border-subtle rounded-md text-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all"
                      placeholder={t('bi.payables.agingReport.table.search', 'Buscar proveedor...', {})}
                      type="text"
                      aria-label={t('bi.payables.agingReport.table.search', 'Buscar proveedor...', {})}
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-surface-muted text-on-surface-deep text-label-caps uppercase border-b border-border-subtle">
                      <th className="px-md py-sm sticky left-0 bg-surface-muted z-10">{t('bi.payables.suppliers.col.name', 'Nombre del Proveedor', {})}</th>
                      <th className="px-md py-sm text-right">{t('bi.receivables.aging.byClient.col.current', 'Al Día', {})}</th>
                      <th className="px-md py-sm text-right">{t('bi.payables.agingReport.table.col.days30', '31-60 Días', {})}</th>
                      <th className="px-md py-sm text-right">{t('bi.payables.agingReport.table.col.days60', '61-90 Días', {})}</th>
                      <th className="px-md py-sm text-right">{t('bi.payables.agingReport.table.col.over90', '+90 Días', {})}</th>
                      <th className="px-md py-sm text-right">{t('bi.payables.agingReport.table.col.total', 'Total Pendiente', {})}</th>
                      <th className="px-md py-sm text-center">{t('bi.receivables.overdue.col.priority', 'Prioridad', {})}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {paginatedData.map((row) => (
                      <tr
                        key={row.id}
                        className={`transition-colors duration-150 hover:bg-surface-muted ${row.risk === 'Crítico' ? 'bg-error/5' : ''}`}
                      >
                        <td className="px-md py-sm sticky left-0 bg-surface group-hover:bg-surface-muted transition-colors z-10 text-body-md-bold text-foreground truncate max-w-[200px]">
                          {row.name}
                        </td>
                        <td className="px-md py-sm text-right font-data-mono text-data-mono text-foreground">{formatPYG(row.current ?? 0)}</td>
                        <td className="px-md py-sm text-right font-data-mono text-data-mono text-warning">{formatPYG(row.days30_60 ?? 0)}</td>
                        <td className="px-md py-sm text-right font-data-mono text-data-mono text-warning">{formatPYG(row.days60_90 ?? 0)}</td>
                        <td className="px-md py-sm text-right font-data-mono text-data-mono text-error">{formatPYG(row.over90 ?? 0)}</td>
                        <td className="px-md py-sm text-right font-data-mono text-data-mono text-foreground">{formatPYG(row.total ?? 0)}</td>
                        <td className="px-md py-sm text-center">
                          <span className={`px-sm py-0.5 rounded-xs text-body-sm-bold uppercase border ${row.riskClass}`}>
                            {row.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {paginatedData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-md py-lg text-center text-on-surface-deep text-body-md italic">
                          {t('bi.payables.agingReport.table.empty', 'No se encontraron proveedores.', {})}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-surface-muted border-t-2 border-border-subtle">
                    <tr>
                      <td className="px-md py-sm sticky left-0 bg-surface-muted z-10 text-label-caps uppercase text-on-surface-deep">
                        {t('bi.payables.agingReport.table.totals', 'TOTALES', {})}
                      </td>
                      <td className="px-md py-sm text-right font-data-mono text-data-mono text-foreground">{formatPYG(distribution?.current.amount || 0)}</td>
                      <td className="px-md py-sm text-right font-data-mono text-data-mono text-foreground">{formatPYG(distribution?.days30_60.amount || 0)}</td>
                      <td className="px-md py-sm text-right font-data-mono text-data-mono text-foreground">{formatPYG(distribution?.days60_90.amount || 0)}</td>
                      <td className="px-md py-sm text-right font-data-mono text-data-mono text-foreground">{formatPYG(distribution?.over90.amount || 0)}</td>
                      <td className="px-md py-sm text-right font-data-mono text-data-mono text-primary">{formatPYG(distribution?.total || 0)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-md py-sm border-t border-border-subtle flex justify-between items-center bg-surface-muted">
                <p className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.payables.agingReport.table.showing', 'Mostrando {n} de {t} proveedores', {
                    n: paginatedData.length,
                    t: filteredTableData.length,
                  })}
                </p>
                <div className="flex items-center gap-xs">
                  <button
                    type="button"
                    aria-label={t('bi.profitability.products.pagination.prev', 'Página anterior', {})}
                    className="p-sm rounded-md border border-border-subtle text-on-surface-deep disabled:opacity-30 hover:bg-surface transition-colors"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`size-8 rounded-md text-body-sm-bold transition-colors ${
                        p === currentPage ? 'bg-primary text-on-primary shadow-whisper' : 'text-on-surface-deep hover:bg-surface'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    aria-label={t('bi.profitability.products.pagination.next', 'Página siguiente', {})}
                    className="p-sm rounded-md border border-border-subtle text-on-surface-deep disabled:opacity-30 hover:bg-surface transition-colors"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </section>

            <p className="flex items-center gap-xs mt-lg text-label-caps uppercase text-on-surface-deep">
              <Wallet size={14} className="shrink-0" />
              {t('bi.payables.agingReport.hint', 'Fuente: /payables/aging/report + /payables/aging/summary.', {})}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PayablesAgingReport
