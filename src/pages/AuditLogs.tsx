import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import auditService from '@/services/bi/auditService';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';

/** Fila de GET /api/v1/audit/logs (contrato real: id/timestamp/username/action/entity/category/description/level). */
interface AuditLogRow {
  id: number | string;
  timestamp: string;
  username?: string;
  action: string;
  entity_id?: string;
  category?: string;
  description?: string;
  level?: string;
}

interface AuditLogsPayload {
  logs?: AuditLogRow[];
  total?: number;
  total_pages?: number;
}

interface AuditLogFilters {
  search: string;
  category: string;
  level: string;
  success: string;
  start_date: string;
  end_date: string;
}

interface AuditKPIs {
  total_actions?: number | string;
  successful_actions?: number | string;
  failed_actions?: number | string;
  unique_users?: number | string;
}

const EMPTY_KPI_FORM: Array<{ key: keyof AuditKPIs; label: string; icon: string; iconClass: string }> = [
  { key: 'total_actions', label: 'Acciones Totales', icon: 'data_exploration', iconClass: 'bg-primary/10 text-primary' },
  { key: 'successful_actions', label: 'Éxitos', icon: 'check_circle', iconClass: 'bg-success/10 text-success' },
  { key: 'failed_actions', label: 'Fallos', icon: 'error', iconClass: 'bg-error-container text-error' },
  { key: 'unique_users', label: 'Usuarios Únicos', icon: 'person_search', iconClass: 'bg-warning/10 text-warning' },
];

const LEVEL_BADGES: Record<string, string> = {
  INFO: 'bg-success/10 text-success border-success/20',
  WARNING: 'bg-warning/10 text-warning border-warning/20',
  ERROR: 'bg-error-container text-on-error-container border-error/20',
};

export default function AuditLogs() {
  const navigate = useNavigate();
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: '',
    category: '',
    level: '',
    success: '',
    start_date: '',
    end_date: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [kpis, setKpis] = useState<AuditKPIs | null>(null);

  const fetchKpis = useCallback(async () => {
    try {
      const res = await auditService.getSummary('month');
      setKpis(res?.data?.kpis || null);
    } catch {
      // Sin KPIs reales no se muestran métricas (regla FE-1)
      setKpis(null);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
        page,
        page_size: pageSize,
      };
      const res = await auditService.getLogs(params);
      const payload = ((res as any)?.data || {}) as AuditLogsPayload;
      setLogs(payload.logs || []);
      setTotal(payload.total || 0);
      setTotalPages(payload.total_pages || 1);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err.message);
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  // Exporta con los filtros activos (POST /api/v1/audit/export → archivo CSV).
  const handleExport = async () => {
    try {
      setExporting(true);
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { blob, filename } = await auditService.exportLogs(activeFilters, { format: 'csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Exportación descargada');
    } catch (err: any) {
      console.error('Error exporting logs:', err);
      toast.errorFrom(err, { fallback: 'No se pudo exportar el registro de auditoría' });
    } finally {
      setExporting(false);
    }
  };

  const kpiValue = (key: keyof AuditKPIs) =>
    kpis && kpis[key] != null ? Number(kpis[key]).toLocaleString('es-PY') : '—';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-inter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Registro de Auditoría</h1>
          <p className="text-on-surface-deep text-sm">Monitoreo avanzado de actividades del sistema en tiempo real.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border-subtle text-sm font-bold text-foreground hover:bg-surface-muted transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-deep uppercase tracking-wider">Desde</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-lg text-sm focus:ring-primary focus:border-primary transition-all outline-none text-foreground"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-deep uppercase tracking-wider">Hasta</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-lg text-sm focus:ring-primary focus:border-primary transition-all outline-none text-foreground"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-deep uppercase tracking-wider">Usuario</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-lg text-sm focus:ring-primary focus:border-primary transition-all outline-none text-foreground"
              placeholder="Email o ID..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-deep uppercase tracking-wider">Categoría</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-lg text-sm focus:ring-primary focus:border-primary transition-all outline-none text-foreground"
            >
              <option value="">Todas</option>
              <option value="SALE">Ventas</option>
              <option value="AUTH">Autenticación</option>
              <option value="INVENTORY">Inventario</option>
              <option value="PRODUCT">Productos</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-deep uppercase tracking-wider">Nivel</label>
            <select
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-lg text-sm focus:ring-primary focus:border-primary transition-all outline-none text-foreground"
            >
              <option value="">Todos</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-deep uppercase tracking-wider">Resultado</label>
            <select
              name="success"
              value={filters.success}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded-lg text-sm focus:ring-primary focus:border-primary transition-all outline-none text-foreground"
            >
              <option value="">Todos</option>
              <option value="true">Éxito</option>
              <option value="false">Fallo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border-subtle">
                <th className="px-6 py-4 text-xs font-bold text-on-surface-deep uppercase tracking-wider w-48">Fecha y Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-deep uppercase tracking-wider w-64">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-deep uppercase tracking-wider w-32">Acción</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-deep uppercase tracking-wider w-48">Entidad</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-deep uppercase tracking-wider min-w-[300px]">Descripción</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-deep uppercase tracking-wider w-32">Nivel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 font-bold text-on-surface-deep uppercase tracking-widest animate-pulse">Cargando...</td></tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <p className="text-sm font-bold text-foreground">No se pudieron cargar los registros de auditoría.</p>
                    <button
                      onClick={fetchLogs}
                      className="mt-4 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-on-surface-deep">No se encontraron resultados</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-muted transition-colors group cursor-pointer" onClick={() => navigate(`/auditoria/logs/${log.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-deep font-medium">
                      {new Date(log.timestamp).toLocaleDateString('es-PY')} {new Date(log.timestamp).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full overflow-hidden shrink-0 bg-surface-subtle border border-border-subtle shadow-sm flex items-center justify-center font-black text-[10px] text-on-surface-deep">
                          {(log.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary">{log.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-black text-foreground tracking-tighter uppercase">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">{log.entity_id || 'N/A'}</span>
                        <span className="text-[10px] text-on-surface-deep uppercase font-black tracking-tighter">{log.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-deep font-medium truncate max-w-xs">{log.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${LEVEL_BADGES[log.level || ''] || 'bg-surface-subtle text-on-surface-deep border-border-subtle'}`}>
                        {log.level}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination (server-side real: total/total_pages del endpoint) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-surface-muted border-t border-border-subtle">
          <div className="flex items-center gap-4">
            <span className="text-sm text-on-surface-deep">Filas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="bg-transparent text-sm font-bold text-foreground focus:ring-0 p-0 cursor-pointer"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-on-surface-deep font-medium">{total.toLocaleString('es-PY')} registros</span>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-sm text-on-surface-deep font-medium">Página <span className="font-black text-foreground">{page}</span> de <span className="font-black text-foreground">{totalPages}</span></p>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded-lg border border-border-subtle bg-surface text-on-surface-deep disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                className="p-1.5 rounded-lg border border-border-subtle bg-surface text-foreground hover:text-primary disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span className="material-symbols-outlined text-lg font-bold">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary Footer (fuente real: /api/v1/audit/dashboard kpis) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        {EMPTY_KPI_FORM.map((stat) => (
          <div key={stat.key} className="bg-surface p-4 rounded-lg border border-border-subtle shadow-sm flex items-center gap-4">
            <div className={`size-10 flex items-center justify-center rounded-lg ${stat.iconClass}`}>
              <span className="material-symbols-outlined font-bold">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-on-surface-deep uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-foreground">{kpiValue(stat.key)}</p>
            </div>
          </div>
        ))}
      </div>

      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
}
