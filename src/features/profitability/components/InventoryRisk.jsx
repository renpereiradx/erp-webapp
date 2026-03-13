import React from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  ShoppingCart, 
  Search, 
  Download, 
  BarChart2, 
  Clock, 
  Bell,
  ArrowRight,
  Target
} from 'lucide-react';

/**
 * Formateador de moneda en Guaraníes
 */
const formatPYG = (value) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
  }).format(value).replace('PYG', 'Gs.');
};

const RiskBadge = ({ level }) => {
  const styles = {
    Alto: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200',
    Medio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
    Bajo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${styles[level]}`}>
      {level}
    </span>
  );
};

const InventoryRisk = () => {
  // Mocks locales para análisis de riesgos
  const deadStock = [
    { name: 'Lubricante Sintético 5W30', days: 120, value: 4500000, action: 'Descontinuar' },
    { name: 'Filtro de Aire Premium XL', days: 105, value: 1200000, action: 'Liquidación' },
    { name: 'Batería 12V 75Ah', days: 95, value: 3800000, action: 'Liquidación' },
    { name: 'Pastillas Freno Cerámica', days: 92, value: 2100000, action: 'Liquidación' },
  ];

  const stockoutRisk = [
    { name: 'Bujías Iridium X4', level: 'Alto', days: 3, projection: -240, progress: 90 },
    { name: 'Amortiguador Delantero', level: 'Medio', days: 12, projection: -15, progress: 60 },
    { name: 'Kit Correa Distribución', level: 'Bajo', days: 28, projection: 2, progress: 20 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Riesgos y Stock Muerto</h1>
          <div className="flex items-center gap-2 text-slate-500 mt-2 uppercase text-[10px] font-bold tracking-widest">
            <Clock size={14} /> <span>Última auditoría: hace 5 minutos</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 h-10 px-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Bell size={16} /> Configurar Alertas
          </button>
          <button className="flex items-center gap-2 h-10 px-5 bg-[#137fec] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">
            <Download size={16} /> Exportar Reporte
          </button>
        </div>
      </div>

      {/* Impact KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-rose-500 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-none">Pérdida Potencial (Stock Muerto)</p>
            <TrendingDown className="text-rose-500 group-hover:scale-110 transition-transform" size={24} />
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-none">{formatPYG(15420000)}</p>
          <div className="flex items-center gap-2 mt-4 text-rose-600 text-[10px] font-black uppercase tracking-widest">
            <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">-12.5%</span>
            <span className="opacity-60">Optimización vs mes anterior</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-none">Valor Reorden Recomendado</p>
            <ShoppingCart className="text-emerald-500 group-hover:scale-110 transition-transform" size={24} />
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-none">{formatPYG(8900000)}</p>
          <div className="flex items-center gap-2 mt-4 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">+5.2%</span>
            <span className="opacity-60">Cobertura de demanda proyectada</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dead Stock Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
              <BarChart2 className="text-[#137fec]" size={18} /> Análisis de Inactividad (&gt;90 días)
            </h2>
            <span className="text-[9px] font-black px-3 py-1 bg-[#137fec]/10 text-[#137fec] rounded-xl uppercase tracking-widest">6 SKU Detectados</span>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[9px] border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5">Producto / SKU</th>
                    <th className="px-6 py-5 text-center">Antigüedad</th>
                    <th className="px-6 py-5 text-right font-mono">Valor Capital</th>
                    <th className="px-8 py-5 text-center">Protocolo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-mono text-[11px]">
                  {deadStock.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group/row">
                      <td className="px-8 py-6 font-sans font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs group-hover/row:text-[#137fec] transition-colors">{item.name}</td>
                      <td className="px-6 py-6 text-center text-slate-500 font-bold">{item.days} DÍAS</td>
                      <td className="px-6 py-6 text-right font-black text-slate-900 dark:text-white">{formatPYG(item.value)}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          item.action === 'Descontinuar' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {item.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Forecast Panel */}
        <div className="flex flex-col gap-6">
          <h2 className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
            <AlertTriangle className="text-rose-500 animate-pulse" size={18} /> Pronóstico de Quiebre
          </h2>
          <div className="flex flex-col gap-5 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {stockoutRisk.map((item, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-[#137fec] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{item.name}</h3>
                  <RiskBadge level={item.level} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 opacity-70">Tiempo Limite</span>
                    <span className="text-rose-600 font-mono">{item.days} DÍAS</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-slate-400 opacity-70">Gap Proyectado</span>
                    <span className="text-slate-900 dark:text-white font-mono">{item.projection} UDS</span>
                  </div>
                </div>
                <div className="mt-5 h-2 w-full bg-white dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200/20">
                  <div className={`h-full transition-all duration-1500 ${item.level === 'Alto' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-amber-500'}`} style={{ width: `${item.progress}%` }}></div>
                </div>
              </div>
            ))}
            <button className="mt-4 w-full flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#137fec] hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-2xl transition-all border border-transparent hover:border-[#137fec]/20">
              Visualizar Todos <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Meta Footer */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-[#137fec] transition-colors">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#137fec]/10 rounded-2xl text-[#137fec]">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Precisión de Auditoría IA</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Modelo predictivo basado en histórico de los últimos 24 meses</p>
          </div>
        </div>
        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
          <div className="flex flex-col items-end">
            <span className="text-slate-400">Margen Error</span>
            <span className="text-emerald-500 font-mono mt-1">± 1.2%</span>
          </div>
          <div className="h-10 w-px bg-slate-100 dark:bg-slate-800"></div>
          <div className="flex flex-col items-end">
            <span className="text-slate-400">ID Auditoría</span>
            <span className="text-slate-900 dark:text-white font-mono mt-1">INV-2026-X99</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryRisk;
