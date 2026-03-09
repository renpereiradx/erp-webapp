import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import auditService from '@/services/auditService';

export default function AuditDashboard() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [period]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const summaryData = await auditService.getSummary(period);
      setData(summaryData);
    } catch (error) {
      console.error('Error fetching audit summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando dashboard...</div>;
  }

  if (!data) {
    return <div className="text-red-500">Error al cargar los datos.</div>;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 font-inter">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight">Dashboard de Auditoría</h1>
          <p className="text-slate-500 text-sm font-medium">Control total de trazabilidad y eventos de seguridad del sistema.</p>
        </div>
        <div className="flex h-11 items-center rounded-lg bg-slate-200/50 p-1.5 shadow-inner">
          {['hoy', 'semana', 'mes', 'ano'].map((p) => (
            <label key={p} className={`flex cursor-pointer h-full items-center justify-center rounded-lg px-4 transition-all text-xs font-bold uppercase tracking-wider ${
              (p === 'mes' && period === 'month') || (p === 'hoy' && period === 'today') || (p === 'semana' && period === 'week') || (p === 'ano' && period === 'year')
                ? 'bg-white shadow-sm text-[#137fec]' 
                : 'text-slate-500 hover:text-slate-700'
            }`}>
              <span className="capitalize">{p}</span>
              <input 
                className="hidden" 
                name="period" 
                type="radio" 
                value={p} 
                checked={period === (p === 'ano' ? 'year' : p === 'mes' ? 'month' : p)}
                onChange={() => setPeriod(p === 'ano' ? 'year' : p === 'mes' ? 'month' : p)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Fila de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-center size-12 rounded-lg bg-[#137fec]/10 text-[#137fec]">
            <span className="material-symbols-outlined text-2xl">history</span>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Total de Acciones</p>
            <p className="text-2xl font-bold text-slate-900">{data.total_logs.toLocaleString()}</p>
            <p className="text-emerald-500 text-[11px] font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12.5% vs prev.
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="flex items-center justify-center size-12 rounded-lg bg-emerald-100 text-emerald-600">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Tasa de Éxito</p>
            <p className="text-2xl font-bold text-slate-900">{data.success_rate}%</p>
            <p className="text-emerald-500 text-[11px] font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">check</span> Óptimo
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="flex items-center justify-center size-12 rounded-lg bg-indigo-100 text-indigo-600">
            <span className="material-symbols-outlined text-2xl">person</span>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Usuarios Únicos</p>
            <p className="text-2xl font-bold text-slate-900">{data.unique_users}</p>
            <p className="text-slate-400 text-[11px] font-bold">Activos hoy</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100 flex items-center gap-4 bg-red-50/10">
          <div className="flex items-center justify-center size-12 rounded-lg bg-red-100 text-red-600">
            <span className="material-symbols-outlined text-2xl">report</span>
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Alertas de Seguridad</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900">{data.security_alerts.length}</p>
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">Crítico</span>
            </div>
            <p className="text-red-500 text-[11px] font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">warning</span> Requiere atención
            </p>
          </div>
        </div>
      </div>

      {/* Fila de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Tendencias de Actividad</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#137fec]"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Éxito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-300"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Fallidas</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex flex-col justify-end">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 150">
              <defs>
                <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(19,127,236,0.2)', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'rgba(19,127,236,0)', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              <path d="M0,120 Q50,60 100,100 T200,40 T300,80 T400,20 L400,150 L0,150 Z" fill="url(#grad1)"></path>
              <path d="M0,120 Q50,60 100,100 T200,40 T300,80 T400,20" fill="none" stroke="#137fec" strokeWidth="3"></path>
              <path d="M0,140 Q50,130 100,145 T200,135 T300,140 T400,130" fill="none" stroke="#cbd5e1" strokeDasharray="4" strokeWidth="2"></path>
            </svg>
            <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Acciones por Categoría</h3>
          <div className="flex items-center justify-around h-64">
            <div className="relative flex items-center justify-center size-48">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <circle className="stroke-slate-100" cx="18" cy="18" fill="none" r="16" strokeWidth="4"></circle>
                <circle cx="18" cy="18" fill="none" r="16" stroke="#137fec" strokeDasharray="33.7 66.3" strokeDashoffset="0" strokeWidth="4"></circle>
                <circle cx="18" cy="18" fill="none" r="16" stroke="#6366f1" strokeDasharray="20.1 79.9" strokeDashoffset="-33.7" strokeWidth="4"></circle>
                <circle cx="18" cy="18" fill="none" r="16" stroke="#10b981" strokeDasharray="15 85" strokeDashoffset="-53.8" strokeWidth="4"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">100%</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Log</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {data.actions_by_category.map((item, idx) => {
                const colors = ['bg-[#137fec]', 'bg-indigo-500', 'bg-emerald-500'];
                return (
                  <div key={item.category} className="flex items-center gap-3">
                    <span className={`size-3 rounded-sm ${colors[idx % colors.length]}`}></span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{item.category}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{item.percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Top Usuarios Activos</h3>
            <button className="text-[#137fec] text-xs font-bold hover:underline uppercase tracking-widest">Ver todo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4 text-center">Acciones Totales</th>
                  <th className="px-6 py-4 text-center">% Éxito</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.top_users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-[#137fec]/10 text-[#137fec] flex items-center justify-center font-black text-xs border border-[#137fec]/20 uppercase">
                          {user.username.charAt(0)}
                        </div>
                        <Link to={`/auditoria/usuarios/${user.user_id}`} className="text-sm font-semibold hover:text-[#137fec]">
                          {user.username}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-sm font-mono text-slate-600">{user.total_actions.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${(user.successful_actions/user.total_actions)*100}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{((user.successful_actions/user.total_actions)*100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="material-symbols-outlined text-slate-400 hover:text-[#137fec]">more_vert</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Alertas Recientes</h3>
            <span className="flex items-center justify-center size-5 bg-red-100 text-red-600 text-[10px] font-black rounded-full">{data.security_alerts.length}</span>
          </div>
          <div className="flex-1 space-y-4 p-4 overflow-y-auto max-h-[450px]">
            {data.security_alerts.map((alert, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-red-50 border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-black uppercase text-red-600 tracking-widest bg-red-100 px-1.5 py-0.5 rounded">{alert.severity}</span>
                  <span className="text-[10px] text-slate-500 font-medium">hace poco</span>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1 leading-snug">{alert.message}</p>
                <p className="text-[11px] text-slate-600 uppercase font-bold tracking-tighter">ID: {alert.user_id} &middot; {alert.ip_address}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 text-center">
            <button className="text-slate-500 text-xs font-bold hover:text-[#137fec] transition-colors flex items-center justify-center gap-1 w-full uppercase tracking-widest">
              Explorar historial completo <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}