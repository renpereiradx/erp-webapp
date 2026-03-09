import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import auditService from '@/services/auditService';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    search: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.getLogs(filters);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-inter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registro de Auditoría</h1>
          <p className="text-slate-500 text-sm">Monitoreo avanzado de actividades del sistema en tiempo real.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#137fec] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-blue-600 transition-all active:scale-95">
          <span className="material-symbols-outlined text-lg font-bold">download</span>
          Exportar CSV/JSON
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rango de Fechas</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">calendar_today</span>
              <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] transition-all outline-none" type="text" defaultValue="01/01/2026 - 07/01/2026"/>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">person_search</span>
              <input 
                type="text" 
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] transition-all outline-none" 
                placeholder="Email o ID..."
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</label>
            <select 
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] transition-all outline-none"
            >
              <option value="">Todas</option>
              <option value="SALE">Ventas</option>
              <option value="AUTH">Autenticación</option>
              <option value="INVENTORY">Inventario</option>
              <option value="PRODUCT">Usuarios</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nivel</label>
            <select 
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] transition-all outline-none"
            >
              <option value="">Todos</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resultado</label>
            <select className="w-full px-3 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] transition-all outline-none">
              <option>Todos</option>
              <option>Éxito</option>
              <option>Fallo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Fecha y Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Acción</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Entidad</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[300px]">Descripción</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Nivel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-20 font-bold text-slate-400 uppercase tracking-widest animate-pulse">Cargando...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-20 text-slate-400">No se encontraron resultados</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => window.location.href = `/auditoria/logs/${log.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {new Date(log.timestamp).toLocaleDateString('es-ES')} {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 border border-slate-100 shadow-sm flex items-center justify-center font-black text-[10px] text-slate-500">
                          {log.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-[#137fec]">{log.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-black text-slate-900 tracking-tighter uppercase">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#137fec]">{log.entity_id || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{log.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium truncate max-w-xs">{log.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        log.level === 'INFO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                        log.level === 'ERROR' ? 'bg-red-100 text-red-700 border-red-200' : 
                        'bg-orange-100 text-orange-700 border-orange-200'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Filas por página:</span>
            <select className="bg-transparent border-none text-sm font-bold text-slate-900 focus:ring-0 p-0 cursor-pointer">
              <option>20</option><option>50</option><option>100</option>
            </select>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-sm text-slate-500 font-medium">Página <span className="font-black text-slate-900">1</span> de <span className="font-black text-slate-900">30</span></p>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#137fec]">
                <span className="material-symbols-outlined text-lg font-bold">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        {[
          { label: 'Éxitos Totales', val: '12,450', icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Errores Críticos', val: '42', icon: 'error', color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Advertencias', val: '188', icon: 'warning', color: 'text-orange-600', bg: 'bg-orange-100' },
          { label: 'Eventos 24h', val: '3,120', icon: 'data_exploration', color: 'text-blue-600', bg: 'bg-blue-100' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`size-10 ${stat.bg} ${stat.color} flex items-center justify-center rounded-lg shadow-inner`}>
              <span className="material-symbols-outlined font-bold">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );}