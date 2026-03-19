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
import { formatPYG } from '@/utils/currencyUtils';
import { usePayables } from '@/hooks/usePayables';

/**
 * Invoices Master List Page - Fluent ERP 2.0 Optimized
 * STRICT API MODE - NO MOCKS ALLOWED.
 */
const InvoicesMasterList = () => {
  const navigate = useNavigate();
  const { loading, error, fetchPayables, payables } = usePayables();
  
  const [viewMode, setViewMode] = useState('table');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const loadData = useCallback(async () => {
    try {
      await fetchPayables();
    } catch (err) {
      console.error("API Error in Master List:", err);
    }
  }, [fetchPayables]);

  useEffect(() => {
    document.title = 'Lista Maestra de Facturas | Fluent ERP';
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    loadData();

    return () => window.removeEventListener('resize', handleResize);
  }, [loadData]);

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

  const toggleSelection = (e, id) => {
    e.stopPropagation();
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAll = (e) => {
    e.stopPropagation();
    if (selectedInvoices.length === payables.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(payables.map(inv => inv.id));
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
      <div className="bg-white dark:bg-slate-900 p-1.5 md:p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div className="relative w-full md:flex-grow group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-transparent focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 rounded-xl text-sm transition-all outline-none font-medium placeholder:text-slate-400" 
              placeholder="Buscar por ID, proveedor o RUC..." 
              type="text"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1 md:py-0">
            <select className="bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl text-xs px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold cursor-pointer transition-all min-w-[140px]">
              <option value="">Estados: Todos</option>
              <option value="pendiente">PENDIENTE</option>
              <option value="parcial">PARCIAL</option>
              <option value="vencido">VENCIDO</option>
            </select>
            <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-xl px-4 py-2.5 gap-2 text-xs font-bold cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all border border-transparent whitespace-nowrap">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">Este Año</span>
            </div>
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent shrink-0">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      <main className="flex flex-col gap-0 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden min-h-[400px]">
        
        {/* Command Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {selectedInvoices.length > 0 ? (
              <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-md tracking-wider">
                  {selectedInvoices.length} seleccionados
                </span>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                  <button className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Enviar Email">
                    <Mail size={16} />
                  </button>
                  <button className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Imprimir">
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="font-bold text-[10px] uppercase tracking-[0.15em] text-slate-400">
                  <span className="text-slate-900 dark:text-white font-black">{payables.length}</span> Facturas encontradas
                </span>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex bg-slate-200/50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`p-1 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}
                  >
                    <ListIcon size={14} />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-primary transition-colors font-black uppercase text-[9px] tracking-[0.2em]"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            <button className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-primary">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        {loading && payables.length === 0 ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando con Servidor...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="size-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 shadow-sm">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Error de Conexión</h3>
                <p className="text-sm text-slate-500 max-w-[300px]">No se pudo obtener la información de facturación del servidor central.</p>
              </div>
              <button 
                onClick={loadData}
                className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Reintentar Conexión
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'table' && !isMobile ? (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-4 py-3.5 w-[50px] text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedInvoices.length === payables.length && payables.length > 0}
                          onChange={toggleAll}
                          className="rounded border-slate-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-slate-700" 
                        />
                      </th>
                      <th className="px-3 py-3.5 w-[140px] font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">ID Factura</th>
                      <th className="px-3 py-3.5 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Proveedor</th>
                      <th className="px-3 py-3.5 w-[140px] font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Vencimiento</th>
                      <th className="px-3 py-3.5 w-[160px] font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 text-right">Importe Total</th>
                      <th className="px-3 py-3.5 w-[160px] font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 text-right">Imp. Pendiente</th>
                      <th className="px-3 py-3.5 w-[140px] font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 text-center">Estado</th>
                      <th className="px-3 py-3.5 w-[120px] font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Prioridad</th>
                      <th className="px-3 py-3.5 w-[50px] text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {Array.isArray(payables) && payables.map((invoice) => {
                      const statusStyle = getStatusStyles(invoice.status);
                      const isOverdue = invoice.status?.toUpperCase() === 'VENCIDO';
                      const isSelected = selectedInvoices.includes(invoice.id);
                      
                      let priorityColor = 'border-slate-200 text-slate-500';
                      if (invoice.priority === 'ALTA') priorityColor = 'border-red-200 text-red-600 dark:text-red-400';
                      else if (invoice.priority === 'MEDIA') priorityColor = 'border-blue-200 text-blue-600 dark:text-blue-400';

                      return (
                        <tr 
                          key={invoice.id} 
                          className={`hover:bg-primary/[0.03] dark:hover:bg-primary/[0.05] transition-all group cursor-pointer ${isSelected ? 'bg-primary/[0.05] dark:bg-primary/[0.08]' : ''}`}
                          onClick={() => handleRowClick(invoice.id)}
                        >
                          <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => toggleSelection(e, invoice.id)}
                              className="rounded border-slate-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-slate-700" 
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 group/id">
                              <span className="text-[11px] font-mono font-bold text-slate-400 group-hover/id:text-primary transition-colors">#{invoice.id}</span>
                              <ExternalLink size={12} className="opacity-0 group-hover/id:opacity-100 text-primary transition-all" />
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div 
                              className="flex items-center gap-3 group/vendor"
                              onClick={(e) => handleVendorClick(e, invoice.vendorId || 'PRV-001')}
                            >
                              <div className="size-7 shrink-0 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group-hover/vendor:border-primary transition-colors">
                                {invoice.logo ? (
                                  <img className="size-full object-cover" src={invoice.logo} alt="" />
                                ) : (
                                  <span className="text-[10px] font-black text-primary">{invoice.initials || invoice.vendor?.charAt(0)}</span>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-extrabold text-slate-900 dark:text-white truncate group-hover/vendor:text-primary transition-colors">{invoice.vendor}</span>
                                <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover/vendor:opacity-100 transition-opacity">
                                  Ver Análisis <ExternalLink size={8} />
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className={`px-3 py-2.5 text-[11px] font-black whitespace-nowrap ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            {invoice.dueDate}
                          </td>
                          <td className="px-3 py-2.5 text-[13px] text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(invoice.totalAmount)}
                          </td>
                          <td className={`px-3 py-2.5 text-[13px] text-right font-mono font-black tabular-nums ${invoice.pendingAmount > 0 && isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                            {formatCurrency(invoice.pendingAmount)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-sm ${statusStyle.container}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-[0.1em] ${priorityColor}`}>
                              {invoice.priority}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all rounded-lg">
                              <MoreVertical size={16} />
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
                  const isSelected = selectedInvoices.includes(invoice.id);
                  
                  return (
                    <div 
                      key={invoice.id}
                      onClick={() => handleRowClick(invoice.id)}
                      className={`bg-white dark:bg-slate-900 p-5 transition-all flex flex-col gap-4 relative cursor-pointer ${isSelected ? 'bg-primary/[0.03] dark:bg-primary/[0.05]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 group/vendor"
                          onClick={(e) => handleVendorClick(e, invoice.vendorId || 'PRV-001')}
                        >
                          <div className="size-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm group-hover/vendor:border-primary transition-colors">
                            {invoice.logo ? (
                              <img className="size-full rounded-xl object-cover" src={invoice.logo} alt="" />
                            ) : (
                              <span className="text-xs font-black text-primary">{invoice.initials || invoice.vendor?.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[15px] font-black text-slate-900 dark:text-white truncate max-w-[160px] group-hover/vendor:text-primary transition-colors">{invoice.vendor}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-mono font-bold text-primary hover:underline">#{invoice.id}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-widest ${invoice.priority === 'ALTA' ? 'border-red-200 text-red-600' : 'border-slate-200 text-slate-400'}`}>
                                {invoice.priority}
                              </span>
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

                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-300" />
                          Vence: <span className={isOverdue ? 'text-red-600 font-black' : ''}>{invoice.dueDate}</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => toggleSelection(e, invoice.id)}
                          className="size-5 rounded-lg border-slate-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-slate-700 shadow-sm" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 mt-auto">
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span>Mostrar</span>
            <select className="bg-transparent border-none rounded-lg p-0 text-[10px] font-black text-primary focus:ring-0 outline-none cursor-pointer">
              <option>25</option>
              <option selected>50</option>
              <option>100</option>
            </select>
            <span>por página</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all disabled:opacity-30 shadow-sm active:scale-90" disabled>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1 mx-1">
              <button className="size-9 rounded-xl bg-primary text-white font-black text-xs shadow-md shadow-primary/20">1</button>
              <button className="size-9 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-500 font-bold text-xs transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">2</button>
              <button className="size-9 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-500 font-bold text-xs transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">3</button>
            </div>
            <button className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all shadow-sm active:scale-90">
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
