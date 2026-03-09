import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import auditService from '@/services/auditService';

export default function AuditLogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogDetail();
  }, [id]);

  const fetchLogDetail = async () => {
    try {
      setLoading(true);
      const data = await auditService.getLogById(id);
      setLog(data);
    } catch (error) {
      console.error('Error fetching log details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando detalle de evento...</div>;
  }

  if (!log) {
    return <div className="text-red-500">Log no encontrado.</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-inter max-w-6xl mx-auto w-full">
      
      {/* Breadcrumbs & Header Actions */}
      <div className="flex flex-col gap-4">
        <nav className="flex items-center gap-2 text-sm">
          <span onClick={() => navigate('/auditoria/logs')} className="text-slate-500 hover:text-[#137fec] transition-colors cursor-pointer font-medium">Auditoría</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-bold uppercase tracking-tighter text-xs">Detalle del Evento</span>
        </nav>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight">Detalle de Evento #{log.id}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              log.level === 'INFO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {log.level}
            </span>
          </div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-[18px] font-bold">arrow_back</span>
            <span>Volver</span>
          </button>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3 uppercase tracking-tight text-sm">
            <span className="material-symbols-outlined text-[#137fec] font-bold">terminal</span>
            <h3>Información Técnica</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 font-mono text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-sans font-black uppercase tracking-wider">Fecha y Hora</span>
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                <span>{new Date(log.timestamp).toLocaleString('es-ES')}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-sans font-black uppercase tracking-wider">Dirección IP</span>
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <span className="material-symbols-outlined text-sm text-slate-400">lan</span>
                <span>{log.ip_address || 'N/A'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-sans font-black uppercase tracking-wider">Duración</span>
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <span className="material-symbols-outlined text-sm text-slate-400">timer</span>
                <span>{log.duration_ms}ms</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-sans font-black uppercase tracking-wider">Solicitud HTTP</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-black text-[10px] uppercase">POST</span>
                <span className="text-slate-700 font-bold">/api/v1/sales</span>
              </div>
            </div>
          </div>
        </div>

        {/* Context Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3 uppercase tracking-tight text-sm">
            <span className="material-symbols-outlined text-[#137fec] font-bold">contextual_token</span>
            <h3>Contexto de Negocio</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-sans font-black uppercase tracking-wider">Usuario Responsable</span>
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-[#137fec]/10 text-[#137fec] flex items-center justify-center font-black text-[10px] uppercase">
                  {log.username?.charAt(0)}
                </div>
                <span className="text-slate-700 font-bold">{log.username}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-sans font-black uppercase tracking-wider">Entidad</span>
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <span className="material-symbols-outlined text-sm text-slate-400">receipt_long</span>
                <span className="text-[#137fec]">{log.entity_id || 'N/A'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-sans font-black uppercase tracking-wider">Categoría</span>
              <div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-black text-[10px] uppercase">{log.category}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px] font-sans font-black uppercase tracking-wider">Acción Realizada</span>
              <div>
                <span className="px-2 py-0.5 rounded bg-[#137fec]/10 text-[#137fec] font-black text-[10px] uppercase">{log.action}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">Comparación de Datos (JSON)</h2>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-[#137fec] transition-colors"><span className="material-symbols-outlined text-xl">content_copy</span></button>
            <button className="p-2 text-slate-400 hover:text-[#137fec] transition-colors"><span className="material-symbols-outlined text-xl">fullscreen</span></button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valores Anteriores</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold uppercase">OLD</span>
            </div>
            <div className="p-6 min-h-[300px] bg-slate-50/30 font-mono text-xs overflow-auto custom-scrollbar">
              <pre className="text-slate-400 italic">
                {log.old_values ? JSON.stringify(log.old_values, null, 2) : 'null'}
              </pre>
            </div>
          </div>
          <div className="flex flex-col rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-black text-[#137fec] uppercase tracking-widest">Valores Nuevos</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#137fec]/20 text-[#137fec] font-bold uppercase">NEW</span>
            </div>
            <div className="p-6 min-h-[300px] bg-slate-50/30 font-mono text-xs overflow-auto custom-scrollbar">
              <pre className="text-slate-700 leading-relaxed">
                {JSON.stringify(log.new_values, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Metadata Bottom */}
      <footer className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">fingerprint</span>
            <span>ID Correlación: <span className="font-mono text-slate-600">f9a2-55d1-42e8-b80c</span></span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">history</span>
          <span>Registro generado el {new Date(log.timestamp).toLocaleString('es-ES')}</span>
        </div>
      </footer>
    </div>
  );
}