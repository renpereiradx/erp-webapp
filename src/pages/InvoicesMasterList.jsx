import React, { useEffect } from 'react';
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
  ChevronsRight
} from 'lucide-react';
import { invoicesMasterData } from '../features/accounts-payable/data/invoicesMockData';

/**
 * Invoices Master List Page.
 * 100% Fidelity with Stitch design, following layout-guidelines.md
 * Optimized for 1920x1080 screens by slightly reducing font sizes and cell padding.
 */
const InvoicesMasterList = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = 'Lista Maestra de Facturas | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Title & Actions Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-1 gap-1 font-medium">
            <span>Finanzas</span>
            <ChevronRight size={14} className="opacity-50" />
            <span>Cuentas por Pagar</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Lista Maestra de Facturas
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95">
            <Download size={18} />
            Exportar CSV
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-primary/20 text-sm font-semibold active:scale-95">
            <Plus size={18} />
            Nueva Cuenta por Pagar
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-4 overflow-hidden">
        <div className="relative flex-grow max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-transparent focus:ring-4 focus:ring-primary/10 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm transition-all outline-none font-medium" 
            placeholder="Buscar proveedor o factura..." 
            type="text"
          />
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none font-medium cursor-pointer transition-all">
            <option value="">Estado: Todos</option>
            <option value="pendiente">PENDIENTE</option>
            <option value="parcial">PARCIAL</option>
            <option value="vencido">VENCIDO</option>
          </select>
          <select className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none font-medium cursor-pointer transition-all">
            <option value="">Prioridad: Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg px-4 py-2.5 gap-2 text-sm font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-200">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">01/01/2024 - 31/12/2024</span>
          </div>
          <button className="p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all border border-transparent hover:border-slate-200">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <main>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 text-sm text-slate-500 dark:text-slate-400 px-1">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-xs uppercase tracking-tight">Mostrando <span className="text-slate-900 dark:text-white font-black">124</span> de <span className="text-slate-900 dark:text-white font-black">1,452</span> facturas</span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors font-black uppercase text-[10px] tracking-[0.15em]">
              <Settings size={14} />
              Configurar columnas
            </button>
          </div>
          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-primary">
            <RefreshCcw size={18} />
          </button>
        </div>

        {/* Data Grid - Optimized column sizes and padding */}
        <div className="bg-white dark:bg-[#1b2633] rounded-xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] overflow-hidden overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-3 py-4 w-10 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-slate-600" />
                </th>
                <th className="px-3 py-4 font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">ID Factura</th>
                <th className="px-3 py-4 font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-slate-500">Proveedor</th>
                <th className="px-3 py-4 font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Fecha Pedido</th>
                <th className="px-3 py-4 font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Vencimiento</th>
                <th className="px-3 py-4 font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-slate-500 text-right whitespace-nowrap">Importe Total</th>
                <th className="px-3 py-4 font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-slate-500 text-right whitespace-nowrap">Imp. Pendiente</th>
                <th className="px-3 py-4 font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-slate-500 text-center whitespace-nowrap">Estado/Días</th>
                <th className="px-3 py-4 font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-slate-500">Prioridad</th>
                <th className="px-3 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {invoicesMasterData.invoices.map((invoice) => {
                const isOverdue = invoice.status === 'Vencido';
                const isPartial = invoice.status === 'Parcial';
                
                let statusClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
                let dotClass = 'bg-blue-500';
                
                if (isOverdue) {
                  statusClasses = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                  dotClass = 'bg-red-500';
                } else if (isPartial) {
                  statusClasses = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
                  dotClass = 'bg-amber-500';
                }

                let priorityClasses = 'border-slate-200 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
                if (invoice.priority === 'ALTA') {
                  priorityClasses = 'border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
                } else if (invoice.priority === 'MEDIA') {
                  priorityClasses = 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
                }

                return (
                  <tr key={invoice.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group cursor-pointer">
                    <td className="px-3 py-3.5 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-slate-600" />
                    </td>
                    <td 
                      className="px-3 py-3.5 text-[13px] font-mono font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors whitespace-nowrap cursor-pointer hover:underline"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                    >
                      #{invoice.id}
                    </td>
                    <td 
                      className="px-3 py-3.5 cursor-pointer group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 transition-colors"
                      onClick={() => navigate(`/proveedores/PRV-8820/analisis`)}
                    >
                      <div className="flex items-center gap-2.5">
                        {invoice.logo ? (
                          <img className="size-7 rounded-full bg-slate-100 object-cover border border-slate-100 dark:border-slate-700" src={invoice.logo} alt={invoice.vendor} />
                        ) : (
                          <div className="size-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary font-black text-[9px]">
                            {invoice.initials}
                          </div>
                        )}
                        <span className="text-[13px] font-extrabold text-slate-900 dark:text-white truncate max-w-[180px] group-hover:text-primary transition-colors hover:underline">{invoice.vendor}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-[12px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{invoice.orderDate}</td>
                    <td className={`px-3 py-3.5 text-[12px] font-bold whitespace-nowrap ${isOverdue ? 'text-fluent-danger' : 'text-slate-900 dark:text-white'}`}>{invoice.dueDate}</td>
                    <td className="px-3 py-3.5 text-[13px] text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className={`px-3 py-3.5 text-[13px] text-right font-mono font-black whitespace-nowrap ${invoice.pendingAmount > 0 && isOverdue ? 'text-fluent-danger' : isPartial ? 'text-fluent-warning' : 'text-slate-900 dark:text-white'}`}>
                      {formatCurrency(invoice.pendingAmount)}
                    </td>
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] xl:text-[10px] font-black uppercase tracking-wider ${statusClasses}`}>
                        <span className={`size-1 rounded-full ${dotClass} mr-1 animate-pulse`}></span>
                        {invoice.status} ({invoice.daysOverdue}d)
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${priorityClasses}`}>
                        {invoice.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <button className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <footer className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pb-4 px-1">
          <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            <span>Filas por página:</span>
            <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[10px] focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer hover:border-primary/30">
              <option>25</option>
              <option selected="">50</option>
              <option>100</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md" disabled>
              <ChevronsLeft size={16} />
            </button>
            <button className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md" disabled>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1 mx-2">
              <button className="size-9 rounded-xl bg-primary text-white font-black text-xs shadow-lg shadow-primary/20 transition-transform active:scale-95">1</button>
              <button className="size-9 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-500 font-bold text-xs transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-none hover:shadow-sm">2</button>
              <button className="size-9 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-500 font-bold text-xs transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-none hover:shadow-sm">3</button>
              <span className="px-2 text-slate-300 font-black">...</span>
              <button className="size-9 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-500 font-bold text-xs transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-none hover:shadow-sm">29</button>
            </div>
            <button className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md">
              <ChevronRight size={16} />
            </button>
            <button className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md">
              <ChevronsRight size={16} />
            </button>
          </div>
        </footer>
      </main>

      {/* Floating Help Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-white dark:bg-[#1b2633] text-primary rounded-full shadow-2xl flex items-center justify-center border border-primary/20 hover:scale-110 transition-all active:scale-95 group z-50">
        <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">help</span>
      </button>
    </div>
  );
};

export default InvoicesMasterList;
