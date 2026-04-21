import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Download, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  RefreshCcw,
  Settings,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Mail,
  Printer,
  ExternalLink,
  User
} from 'lucide-react';
import { formatPYG, formatNumber } from '@/utils/currencyUtils';
import { usePayables } from '@/hooks/usePayables';

/**
 * Invoices Master List Page - Fluent ERP 2.0 Optimized
 * STRICT API MODE - NO MOCKS ALLOWED.
 */
const InvoicesMasterList = () => {
  const navigate = useNavigate();
  const { loading, error, fetchPayables, payables, pagination } = usePayables();
  
  const [viewMode, setViewMode] = useState('table');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Estado de filtros alineado con la API
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 20
  });

  const loadData = useCallback(async (currentFilters = filters) => {
    try {
      // Mapeo de filtros de UI a parámetros de API
      const apiParams = {
        status: currentFilters.status || undefined,
        priority: currentFilters.priority || undefined,
        search: currentFilters.search || undefined,
        start_date: currentFilters.startDate || undefined,
        end_date: currentFilters.endDate || undefined,
      };

      // Paginación
      const paginationParams = {
        page: currentFilters.page,
        page_size: currentFilters.pageSize
      };

      await fetchPayables(apiParams, paginationParams);
    } catch (err) {
      console.error("API Error in Master List:", err);
    }
  }, [fetchPayables, filters]);

  // Efecto para búsqueda y filtros con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.priority, filters.startDate, filters.endDate, filters.page, filters.pageSize, loadData]);

  useEffect(() => {
    document.title = 'Lista Maestra de Facturas | Fluent ERP';
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: 20
    });
  };

  const handleRowClick = (id) => {
    navigate(`/payables/detail/${id}`);
  };

  const handleVendorClick = (e, vendorId) => {
    e.stopPropagation();
    if (vendorId) {
      navigate(`/payables/suppliers/${vendorId}/analysis`);
    } else {
      console.warn("No vendor ID provided for analysis");
    }
  };

  const formatCurrency = (val) => formatPYG(val);

  const getStatusStyles = (status = '') => {
    switch (status.toUpperCase()) {
      case 'VENCIDO':
        return {
          container: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-100/50 dark:border-red-800/50',
          dot: 'bg-red-500',
        };
      case 'PARCIAL':
        return {
          container: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-amber-100/50 dark:border-amber-800/50',
          dot: 'bg-amber-500',
        };
      case 'PAGADO':
        return {
          container: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-100/50 dark:border-emerald-800/50',
          dot: 'bg-emerald-500',
        };
      default:
        return {
          container: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-100/50 dark:border-blue-800/50',
          dot: 'bg-blue-500',
        };
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      
      {/* Header Section */}
      <header className="flex flex-col gap-1">
        <nav className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1 px-0.5">
          <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/dashboard/payables')}>Finanzas</span>
          <ChevronRight size={12} className="mx-1.5 opacity-30" />
          <span className="text-slate-600 dark:text-slate-300">Cuentas por Pagar</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Lista Maestra de Facturas
          </h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95">
              <Download size={14} />
              Exportar
            </button>
            <button 
              onClick={() => navigate('/payables/new')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/25 text-xs font-black active:scale-95"
            >
              <Plus size={16} />
              Nueva Factura
            </button>
          </div>
        </div>
      </header>

      {/* Advanced Command Panel */}
      <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-grow group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 rounded-xl text-sm transition-all outline-none font-medium placeholder:text-slate-400 border" 
              placeholder="Buscar por ID, proveedor o RUC..." 
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <select 
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold cursor-pointer transition-all min-w-[140px]"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Estados: Todos</option>
              <option value="PENDING">PENDIENTE</option>
              <option value="PARTIAL">PARCIAL</option>
              <option value="OVERDUE">VENCIDO</option>
              <option value="PAID">PAGADO</option>
            </select>
            <select 
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold cursor-pointer transition-all min-w-[140px]"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">Prioridad: Todas</option>
              <option value="URGENT">URGENTE</option>
              <option value="HIGH">ALTA</option>
              <option value="MEDIUM">MEDIA</option>
              <option value="LOW">BAJA</option>
            </select>
            
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none p-0 text-[11px] font-bold outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none p-0 text-[11px] font-bold outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {(filters.search || filters.status || filters.priority || filters.startDate || filters.endDate) && (
              <button 
                onClick={clearFilters}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                title="Limpiar Filtros"
              >
                <RefreshCcw size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="flex flex-col gap-0 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden min-h-[400px]">
        
        {/* Command Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Mostrando <span className="text-primary font-black">{payables.length}</span> Facturas Registradas
              </span>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ListIcon size={14} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => loadData()}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-primary transition-all font-black uppercase text-[9px] tracking-[0.15em] shadow-sm active:scale-95"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        {loading && payables.length === 0 ? (
          <div className="flex-grow flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Accediendo al Libro Mayor...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-grow flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-5 text-center px-6">
              <div className="size-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 shadow-inner border border-red-100 dark:border-red-800/30">
                <AlertTriangle size={40} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Fallo de Comunicación</h3>
                <p className="text-sm text-slate-500 max-w-[320px] font-medium leading-relaxed">Hubo un problema al intentar conectar con los servicios financieros centrales.</p>
              </div>
              <button 
                onClick={() => loadData()}
                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
              >
                Reintentar Conexión
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'table' && !isMobile ? (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 w-1/6 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">ID Factura</th>
                      <th className="px-3 py-4 w-1/3 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Proveedor / Emisor</th>
                      <th className="px-3 py-4 w-1/6 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 hidden lg:table-cell">Vencimiento</th>
                      <th className="px-3 py-4 w-1/4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 text-right">Balance Financiero</th>
                      <th className="px-3 py-4 w-[160px] font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 text-center hidden md:table-cell">Estado</th>
                      <th className="px-6 py-4 w-[60px] text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {Array.isArray(payables) && payables.map((invoice) => {
                      const statusStyle = getStatusStyles(invoice.status);
                      const isOverdue = invoice.status?.toUpperCase() === 'VENCIDO';
                      const progress = invoice.totalAmount > 0 
                        ? ((invoice.totalAmount - invoice.pendingAmount) / invoice.totalAmount) * 100 
                        : 0;
                      
                      return (
                        <tr 
                          key={invoice.id} 
                          className="hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition-all group cursor-pointer border-l-2 border-transparent hover:border-primary"
                          onClick={() => handleRowClick(invoice.id)}
                        >
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="text-[12px] font-mono font-black text-slate-900 dark:text-white">#{invoice.id}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Documento Oficial</span>
                            </div>
                          </td>
                          <td className="px-3 py-5">
                            <div 
                              className="flex items-center gap-4 group/vendor"
                              onClick={(e) => handleVendorClick(e, invoice.vendorId)}
                            >
                              <div className="size-9 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group-hover/vendor:border-primary transition-all group-hover/vendor:scale-105">
                                {invoice.logo ? (
                                  <img className="size-full object-cover" src={invoice.logo} alt="" />
                                ) : (
                                  <span className="text-[11px] font-black text-primary">{invoice.initials}</span>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] font-black text-slate-900 dark:text-white truncate group-hover/vendor:text-primary transition-colors tracking-tight">{invoice.vendor}</span>
                                <div className="flex items-center gap-2 md:hidden">
                                   <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-widest ${statusStyle.container}`}>
                                    {invoice.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-5 hidden lg:table-cell">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[12px] font-black ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                {invoice.dueDate}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vencimiento</span>
                            </div>
                          </td>
                          <td className="px-3 py-5 text-right">
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-col">
                                <span className="text-[14px] font-mono font-black text-slate-900 dark:text-white tabular-nums">
                                  {formatCurrency(invoice.totalAmount)}
                                </span>
                                {invoice.pendingAmount > 0 && (
                                  <span className={`text-[10px] font-mono font-bold tabular-nums ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                    Pdte: {formatCurrency(invoice.pendingAmount)}
                                  </span>
                                )}
                              </div>
                              <div className="w-24 ml-auto h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                <div 
                                  className={`h-full transition-all duration-1000 ${isOverdue ? 'bg-red-500' : 'bg-primary'}`} 
                                  style={{ width: `${formatNumber(progress)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-5 text-center hidden md:table-cell">
                            <span className={`inline-flex items-center px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border shadow-sm transition-all group-hover:scale-105 ${statusStyle.container}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90">
                              <MoreVertical size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Mobile Content - Cards Optimized */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800">
                {Array.isArray(payables) && payables.map((invoice) => {
                  const statusStyle = getStatusStyles(invoice.status);
                  const isOverdue = invoice.status?.toUpperCase() === 'VENCIDO';
                  const progress = invoice.totalAmount > 0 
                    ? ((invoice.totalAmount - invoice.pendingAmount) / invoice.totalAmount) * 100 
                    : 0;
                  
                  return (
                    <div 
                      key={invoice.id}
                      onClick={() => handleRowClick(invoice.id)}
                      className="bg-white dark:bg-slate-900 p-5 transition-all flex flex-col gap-4 relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 group/vendor"
                          onClick={(e) => handleVendorClick(e, invoice.vendorId)}
                        >
                          <div className="size-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm group-hover/vendor:border-primary transition-colors">
                            {invoice.logo ? (
                              <img className="size-full rounded-xl object-cover" src={invoice.logo} alt="" />
                            ) : (
                              <span className="text-xs font-black text-primary">{invoice.initials}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[15px] font-black text-slate-900 dark:text-white truncate max-w-[160px] group-hover/vendor:text-primary transition-colors">{invoice.vendor}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-mono font-bold text-primary hover:underline">#{invoice.id}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border tracking-wider shadow-sm ${statusStyle.container}`}>
                          {invoice.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe Total</span>
                          <span className="text-base font-mono font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-right border-l border-slate-200 dark:border-slate-700 pl-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendiente</span>
                          <span className={`text-base font-mono font-black tabular-nums ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                            {formatCurrency(invoice.pendingAmount)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Mobile progress bar */}
                      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${isOverdue ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-300" />
                          Vence: <span className={isOverdue ? 'text-red-600 font-black' : ''}>{invoice.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 mt-auto">
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span>Mostrar</span>
            <select 
              className="bg-transparent border-none rounded-lg p-0 text-[10px] font-black text-primary focus:ring-0 outline-none cursor-pointer"
              value={filters.pageSize}
              onChange={(e) => handleFilterChange('pageSize', Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>de <span className="text-slate-900 dark:text-white">{pagination.totalItems}</span> registros</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleFilterChange('page', filters.page - 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all disabled:opacity-30 shadow-sm active:scale-90" 
              disabled={filters.page <= 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-1.5 mx-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Página <span className="text-primary">{pagination.page}</span> de {pagination.totalPages}
              </span>
            </div>

            <button 
              onClick={() => handleFilterChange('page', filters.page + 1)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all disabled:opacity-30 shadow-sm active:scale-90"
              disabled={filters.page >= pagination.totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </main>

      {/* Floating Action Button - Mobile */}
      {isMobile && (
        <button 
          onClick={() => navigate('/payables/new')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Helper FAB - Fluent Style */}
      {!isMobile && (
        <button className="fixed bottom-8 right-8 w-12 h-12 bg-white dark:bg-slate-900 text-slate-400 hover:text-primary rounded-full shadow-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 transition-all hover:scale-110 active:scale-95 group z-50">
          <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">help</span>
        </button>
      )}
    </div>
  );
};

export default InvoicesMasterList;
