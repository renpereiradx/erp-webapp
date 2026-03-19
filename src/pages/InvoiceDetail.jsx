import React, { useEffect, useState } from 'react';
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
  ChevronLeft,
  ArrowLeft,
  FileBadge
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Detalle de Factura de Pagos e Historial (Payables)
 * 100% STITCH FIDELITY - Tailwind CSS Implementation
 */
const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  const invoice = {
    id: id || 'po_001',
    status: 'PARCIAL',
    montoOriginal: 12450.00,
    montoPagado: 4500.00,
    saldoPendiente: 7950.00,
    progreso: 36.1,
    detalle: {
      emision: '12 Oct, 2023',
      vencimiento: '11 Nov, 2023',
      terminos: 'Net 30 días',
      prioridad: 'Alta'
    },
    proveedor: {
      nombre: 'Suministros Industriales S.A.',
      ruc: '800.231.990-1',
      contacto: 'Carlos Rodriguez',
      email: 'c.rodriguez@sumindustriales.co',
      direccion: 'Av. Industrial #45-12, Piso 4, Bogotá, Colombia'
    },
    pagos: [
      { id: '#PY-00124', fecha: '15 Oct, 2023', metodo: 'Transferencia', ref: 'TXN-8829-KB', user: 'A. Mendoza', userInit: 'AM', monto: 2500.00 },
      { id: '#PY-00138', fecha: '28 Oct, 2023', metodo: 'Tarjeta Corp.', ref: 'VISA-4421-XX', user: 'A. Mendoza', userInit: 'AM', monto: 2000.00 },
    ],
    actividad: [
      { titulo: 'Factura Creada', desc: 'Sistema Automatizado', date: '12 Oct, 2023 · 08:45 AM', type: 'add', color: 'primary' },
      { titulo: 'Pago #PY-00124 Registrado', desc: 'Por: Alejandro Mendoza', date: '15 Oct, 2023 · 02:20 PM', type: 'check', color: 'emerald-500' },
      { titulo: 'Recordatorio Enviado', desc: 'Automático (3 días antes del vto)', date: '08 Nov, 2023 · 09:00 AM', type: 'email', color: 'slate-400' },
      { titulo: 'Nuevo Pago Registrado', desc: 'Por: Alejandro Mendoza', date: '10 Nov, 2023 · 11:32 AM', type: 'money', color: 'primary' },
    ]
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const formatAmount = (val) => {
    return formatPYG(val);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* Refined Header Area */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs with better styling */}
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
                <div className="flex items-center px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-100 dark:border-amber-800/50 uppercase tracking-widest shadow-sm">
                  <span className="size-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                  {invoice.status}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                <FileBadge size={14} className="opacity-50" />
                <span>Referencia: <span className="text-slate-600 dark:text-slate-300 font-mono">OR-45920-X</span></span>
                <span className="mx-1 opacity-30">•</span>
                <span className="flex items-center gap-1 font-medium">
                  <User size={14} className="opacity-50" />
                  Auditado por Sistema
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:mb-1">
            <button className="inline-flex items-center px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300">
              <Download className="w-4 h-4 mr-2 text-slate-400" />
              PDF
            </button>
            <button className="inline-flex items-center px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300">
              <Send className="w-4 h-4 mr-2 text-slate-400" />
              Notificar
            </button>
            <button className="inline-flex items-center px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-white hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95">
              <Wallet className="w-4.5 h-4.5 mr-2" />
              Pagar Ahora
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-1">
        <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] p-6 md:p-8 rounded-2xl flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">Monto Original</div>
            <div className="text-2xl xl:text-3xl font-mono font-black text-slate-900 dark:text-white break-words tabular-nums">{formatAmount(invoice.montoOriginal)}</div>
          </div>
          <div className="mt-5 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div className="bg-slate-400 h-full w-full rounded-full opacity-50"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] p-6 md:p-8 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-colors">Monto Pagado</div>
            <div className="text-2xl xl:text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400 break-words tabular-nums">{formatAmount(invoice.montoPagado)}</div>
          </div>
          <div className="mt-5 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${invoice.progreso}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] p-6 md:p-8 rounded-2xl border-l-4 border-l-primary flex flex-col justify-between overflow-hidden group hover:shadow-md transition-all">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">Saldo Pendiente</div>
            <div className="text-2xl xl:text-3xl font-mono font-black text-primary break-words tabular-nums">{formatAmount(invoice.saldoPendiente)}</div>
          </div>
          <div className="mt-5 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div className="bg-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(19,127,236,0.4)]" style={{ width: `${100 - invoice.progreso}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column (8/12) */}
        <div className="col-span-12 xl:col-span-8 space-y-6 lg:space-y-8">
          
          {/* Order Details */}
          <section className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h2 className="text-lg font-extrabold flex items-center tracking-tight text-slate-900 dark:text-white">
                <DescriptionIcon className="mr-2 text-slate-400" size={18} />
                Detalle de la Orden
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 italic font-medium">Sistema Interno</span>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha de Emisión</div>
                <div className="text-sm md:text-base font-mono font-bold text-slate-900 dark:text-white">{invoice.detalle.emision}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha de Vencimiento</div>
                <div className="text-sm md:text-base font-mono font-black text-fluent-danger">{invoice.detalle.vencimiento}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Términos de Crédito</div>
                <div className="text-sm md:text-base font-bold text-slate-900 dark:text-white">{invoice.detalle.terminos}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prioridad</div>
                <div className="flex items-center text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mr-2 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></span>
                  {invoice.detalle.prioridad}
                </div>
              </div>
            </div>
          </section>

          {/* Payment History */}
          <section className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] rounded-2xl overflow-hidden">
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
                  {invoice.pagos.map((pago, idx) => (
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
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 md:py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-right flex items-center justify-end">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 mr-4">Total Pagado:</span>
              <span className="text-lg md:text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">{formatAmount(invoice.montoPagado)}</span>
            </div>
          </section>
        </div>

        {/* Right Column (4/12) */}
        <div className="col-span-12 xl:col-span-4 space-y-6 lg:space-y-8">
          
          {/* Vendor Info */}
          <section className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] rounded-2xl overflow-hidden">
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
                  <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-1">NIT: {invoice.proveedor.ruc}</p>
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
              
              <button className="w-full mt-8 py-2.5 text-[10px] font-black text-primary uppercase tracking-[0.2em] border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 rounded-xl transition-all active:scale-95">
                Ver Perfil Completo
              </button>
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <h2 className="text-lg font-extrabold flex items-center tracking-tight text-slate-900 dark:text-white">
                <BoltIcon className="mr-2 text-slate-400" size={18} />
                Línea de Tiempo
              </h2>
            </div>
            <div className="p-6 relative">
              {/* Timeline Line */}
              <div className="absolute left-9 top-10 bottom-10 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
              
              <div className="space-y-8 relative px-1">
                {invoice.actividad.map((act, idx) => {
                  let iconBg = 'bg-slate-400';
                  if (act.color === 'primary') iconBg = 'bg-primary';
                  if (act.color === 'emerald-500') iconBg = 'bg-emerald-500';

                  return (
                    <div key={idx} className="flex gap-4 group cursor-default">
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg} ring-4 ring-white dark:ring-[#1b2633] group-hover:scale-110 transition-transform`}>
                        {act.type === 'add' && <Plus className="text-white w-3.5 h-3.5" />}
                        {act.type === 'check' && <Check className="text-white w-3.5 h-3.5" />}
                        {act.type === 'email' && <Mail className="text-white w-3 h-3" />}
                        {act.type === 'money' && <DollarSign className="text-white w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{act.titulo}</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{act.desc}</div>
                        <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mt-1.5">{act.date}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button className="w-full mt-8 py-2 text-[10px] font-black text-slate-400 hover:text-slate-800 dark:hover:text-white uppercase tracking-[0.2em] transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg">
                Ver historial completo
              </button>
            </div>
          </section>

          {/* Map / Location Placeholder */}
          <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl h-48 flex items-center justify-center overflow-hidden relative border border-slate-200 dark:border-slate-800 shadow-sm group cursor-pointer">
            <img 
              alt="Mapa de ubicación" 
              className="w-full h-full object-cover opacity-60 dark:opacity-40 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6VeuvkJhpjU6CLSV4cjBWbM0cW9WgzmT4Z3pBgfKDd9h6VFKucKaDlRtMm94u4KsQeVHIxrKsksEzbzrSWa8vlhCoe-f29C0vPjLLTF48QnpTh-SNUTihNWbC3bGgq07l3YPVozVEp2PCCYOGg5_qMk8vNjeBX6UZr_94ZoCqrR8Zc6Cb7zoZOvZ8T2SGikiK59Rv36_owBuRZnZ_X98grhXoj3AwPDf_HHB-kMsbgRWX5--gdG7aUPvY6rnX93k-UbRF1_WsLg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <span className="bg-white/95 dark:bg-slate-800/95 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur flex items-center text-slate-800 dark:text-slate-200 border border-white/20">
                <MapPin size={14} className="mr-1.5 text-primary" />
                Sede Norte, Bogotá
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
