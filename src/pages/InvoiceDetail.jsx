import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Download, 
  Send, 
  History as HistoryIcon,
  FileText as DescriptionIcon,
  Building2 as BusinessIcon,
  Zap as BoltIcon,
  MapPin,
  Check,
  Plus,
  Mail,
  DollarSign,
  User,
  AtSign,
  Store,
  ChevronRight,
  Wallet,
  ArrowLeft,
  FileBadge,
  AlertTriangle
} from 'lucide-react';
import { formatPYG } from '@/utils/currencyUtils';
import { usePayables } from '@/hooks/usePayables';

/**
 * Detalle de Factura de Pagos e Historial (Payables)
 * STRICT API MODE - NO MOCKS ALLOWED.
 */
const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, fetchPayableById, selectedPayable: invoice } = usePayables();

  useEffect(() => {
    if (id) {
      fetchPayableById(id);
    }
  }, [id, fetchPayableById]);

  const formatAmount = (val) => {
    return formatPYG(val);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Recuperando Registro Maestro...</span>
    </div>
  );

  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="size-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 shadow-inner">
        <AlertTriangle size={40} />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Error de Carga</h3>
        <p className="text-sm text-slate-500 max-w-[320px] font-medium leading-relaxed">{error}</p>
      </div>
      <button 
        onClick={() => fetchPayableById(id)}
        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
      >
        Reintentar
      </button>
    </div>
  );

  if (!invoice) return null;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-12">
      
      {/* Refined Header Area */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          <Link to="/dashboard/payables" className="hover:text-primary transition-colors flex items-center gap-1">
            Finanzas
          </Link>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <Link to="/payables/invoices" className="hover:text-primary transition-colors">
            Cuentas por Pagar
          </Link>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <span className="text-slate-600 dark:text-slate-300">Detalle de Factura</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start gap-5">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl border border-slate-100 dark:border-slate-700 transition-all active:scale-95 shadow-sm group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase flex items-center">
                  Factura <span className="text-primary font-mono font-black ml-2">#{invoice.id}</span>
                </h1>
                <div className={`flex items-center px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-widest shadow-sm ${
                  invoice.status === 'VENCIDO' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100' :
                  invoice.status === 'PAGADO' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100' :
                  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100'
                }`}>
                  <span className={`size-1.5 rounded-full mr-1.5 ${
                    invoice.status === 'VENCIDO' ? 'bg-red-500' :
                    invoice.status === 'PAGADO' ? 'bg-emerald-500' :
                    'bg-amber-500 animate-pulse'
                  }`}></span>
                  {invoice.status}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                <FileBadge size={14} className="opacity-50" />
                <span>ID Orden: <span className="text-slate-600 dark:text-slate-300 font-mono">{invoice.purchaseOrderId}</span></span>
                <span className="mx-1 opacity-30">•</span>
                <span className="flex items-center gap-1 font-medium">
                  <User size={14} className="opacity-50" />
                  Sincronizado vía API
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:mb-1">
            <button className="inline-flex items-center px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300">
              <Download className="w-4 h-4 mr-2 text-slate-400" />
              PDF
            </button>
            <button className="inline-flex items-center px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-white hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95">
              <Wallet className="w-4.5 h-4.5 mr-2" />
              Registrar Pago
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-1">
        <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-sm p-6 md:p-8 rounded-2xl flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">Monto Original</div>
            <div className="text-2xl xl:text-3xl font-mono font-black text-slate-900 dark:text-white break-words tabular-nums">{formatAmount(invoice.totalAmount)}</div>
          </div>
          <div className="mt-5 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div className="bg-slate-400 h-full w-full rounded-full opacity-50"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-sm p-6 md:p-8 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-colors">Monto Pagado</div>
            <div className="text-2xl xl:text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400 break-words tabular-nums">{formatAmount(invoice.paidAmount)}</div>
          </div>
          <div className="mt-5 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${invoice.progress}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-sm p-6 md:p-8 rounded-2xl border-l-4 border-l-primary flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">Saldo Pendiente</div>
            <div className="text-2xl xl:text-3xl font-mono font-black text-primary break-words tabular-nums">{formatAmount(invoice.pendingAmount)}</div>
          </div>
          <div className="mt-5 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div className="bg-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(19,127,236,0.4)]" style={{ width: `${100 - invoice.progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column (8/12) */}
        <div className="col-span-12 xl:col-span-8 space-y-6 lg:space-y-8">
          
          {/* Order Details */}
          <section className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h2 className="text-lg font-extrabold flex items-center tracking-tight text-slate-900 dark:text-white">
                <DescriptionIcon className="mr-2 text-slate-400" size={18} />
                Detalle de la Orden
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 italic font-medium">Validado por Sistema</span>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha de Emisión</div>
                <div className="text-sm md:text-base font-mono font-bold text-slate-900 dark:text-white">{invoice.detalle.emision}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha de Vencimiento</div>
                <div className={`text-sm md:text-base font-mono font-black ${invoice.status === 'VENCIDO' ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{invoice.detalle.vencimiento}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Términos de Crédito</div>
                <div className="text-sm md:text-base font-bold text-slate-900 dark:text-white">{invoice.detalle.terminos}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prioridad</div>
                <div className="flex items-center text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  <span className={`w-2 h-2 rounded-full mr-2 shadow-sm ${invoice.detalle.prioridad === 'Alta' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                  {invoice.detalle.prioridad}
                </div>
              </div>
            </div>
          </section>

          {/* Payment History */}
          <section className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h2 className="text-lg font-extrabold flex items-center tracking-tight text-slate-900 dark:text-white">
                <HistoryIcon className="mr-2 text-slate-400" size={18} />
                Historial de Pagos
              </h2>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">ID de Pago</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Fecha</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Método</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Referencia</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Registrado por</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {invoice.pagos.length > 0 ? invoice.pagos.map((pago, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer">
                      <td className="px-6 py-4 font-mono text-sm font-black text-primary group-hover:underline">{pago.id}</td>
                      <td className="px-4 py-4 text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{pago.fecha}</td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{pago.metodo}</td>
                      <td className="px-4 py-4 text-sm font-mono font-medium text-slate-500">{pago.ref}</td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black mr-2.5 uppercase text-slate-600 dark:text-slate-300 border border-white dark:border-slate-600 shadow-sm">
                            {pago.userInit}
                          </div>
                          {pago.user}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm tabular-nums">
                        {formatAmount(pago.monto)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No se registran pagos para esta factura</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 md:py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-right flex items-center justify-end">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 mr-4">Total Pagado:</span>
              <span className="text-lg md:text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">{formatAmount(invoice.paidAmount)}</span>
            </div>
          </section>
        </div>

        {/* Right Column (4/12) */}
        <div className="col-span-12 xl:col-span-4 space-y-6 lg:space-y-8">
          
          {/* Vendor Info */}
          <section className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <h2 className="text-lg font-extrabold flex items-center tracking-tight text-slate-900 dark:text-white">
                <BusinessIcon className="mr-2 text-slate-400" size={18} />
                Información del Proveedor
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 shadow-sm border border-primary/10">
                  <Store size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg leading-tight text-slate-900 dark:text-white truncate">{invoice.proveedor.nombre}</h3>
                  <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-1">NIT/RUC: {invoice.proveedor.ruc}</p>
                </div>
              </div>
              
              <div className="space-y-5 px-1">
                <div className="flex items-center gap-3.5 group cursor-pointer">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all flex-shrink-0 border border-transparent group-hover:border-primary/10">
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Contacto Principal</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate block">{invoice.proveedor.contacto}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 group cursor-pointer">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all flex-shrink-0 border border-transparent group-hover:border-primary/10">
                    <AtSign size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Correo Electrónico</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate block">{invoice.proveedor.email}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 group cursor-pointer">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all flex-shrink-0 mt-0.5 border border-transparent group-hover:border-primary/10">
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Dirección</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug block">{invoice.proveedor.direccion}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/payables/suppliers/${invoice.vendor?.id}/analysis`)}
                className="w-full mt-8 py-2.5 text-[10px] font-black text-primary uppercase tracking-[0.2em] border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 rounded-xl transition-all active:scale-95"
              >
                Análisis de Proveedor
              </button>
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <h2 className="text-lg font-extrabold flex items-center tracking-tight text-slate-900 dark:text-white">
                <BoltIcon className="mr-2 text-slate-400" size={18} />
                Línea de Tiempo
              </h2>
            </div>
            <div className="p-6 relative">
              <div className="absolute left-9 top-10 bottom-10 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
              
              <div className="space-y-8 relative px-1">
                {invoice.actividad.length > 0 ? invoice.actividad.map((act, idx) => {
                  let iconBg = 'bg-slate-400';
                  if (act.color === 'primary') iconBg = 'bg-primary';
                  if (act.color === 'success') iconBg = 'bg-emerald-500';

                  return (
                    <div key={idx} className="flex gap-4 group cursor-default">
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg} ring-4 ring-white dark:ring-[#1b2633] transition-transform`}>
                        {act.type === 'creation' ? <Plus className="text-white w-3.5 h-3.5" /> : <Check className="text-white w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{act.titulo}</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{act.desc}</div>
                        <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mt-1.5">{act.date}</div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin actividad registrada</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
