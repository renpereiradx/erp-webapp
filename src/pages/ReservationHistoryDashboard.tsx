import React from 'react';
import { useReservationHistory } from '@/hooks/useReservationHistory';
import { Reservation, ConsistencyIssue } from '@/domain/reservation/models';

const ReservationHistoryDashboard: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    history,
    report,
    consistency,
    isLoading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate
  } = useReservationHistory();

  return (
    <div className="bg-[#f9f9ff] text-[#181c22] min-h-screen flex flex-col font-sans">
      <header className="flex items-center justify-between w-full sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-blue-800 tracking-tight">Precision Audit</span>
          <div className="h-6 w-px bg-slate-200"></div>
          <h2 className="text-base font-semibold text-slate-800">Historial y Auditoría de Reservas</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
            <span className="material-symbols-outlined text-slate-500 text-sm">calendar_today</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-slate-600 font-mono text-xs outline-none" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
            <span className="text-slate-400">—</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-slate-600 font-mono text-xs outline-none" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-sm">ios_share</span>
              Exportar
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-10 flex-1 overflow-auto">
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <span className="material-symbols-outlined text-blue-600">analytics</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Reservations</p>
            <h3 className="text-3xl font-black text-slate-800 font-mono">{report.total}</h3>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Confirmed</p>
            <h3 className="text-3xl font-black text-slate-800 font-mono">{report.confirmed}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <span className="material-symbols-outlined text-red-600">cancel</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Cancelled</p>
            <h3 className="text-3xl font-black text-slate-800 font-mono">{report.cancelled}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined text-slate-600">speed</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Completion Rate</p>
            <h3 className="text-3xl font-black text-slate-800 font-mono">{report.completionRate}%</h3>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-8 border-b border-slate-200 px-2">
            <button 
              className={`pb-3 text-sm font-bold relative ${activeTab === 'historial' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveTab('historial')}
            >
              Historial Completo
              {activeTab === 'historial' && <div className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-blue-600"></div>}
            </button>
            <button 
              className={`pb-3 text-sm font-bold relative ${activeTab === 'auditoria' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setActiveTab('auditoria')}
            >
              Auditoría de Consistencia
              {activeTab === 'auditoria' && <div className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-blue-600"></div>}
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading data...</div>
          ) : activeTab === 'historial' ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">ID de Reserva</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Producto</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Hora Inicio</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Duración</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item: Reservation, i: number) => (
                    <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-blue-600 font-medium">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{item.product_id}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-800">{item.client_name || item.client_id}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-sm text-slate-600">
                        {item.start_time ? new Date(item.start_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded">{item.duration}h</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                          ${item.status === 'CONFIRMED' || item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : ''}
                          ${item.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : ''}
                          ${item.status === 'RESERVED' || item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : ''}
                        `}>
                          {item.status || 'UNKNOWN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No reservations found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Element ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Issue Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Details</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consistency.map((issue: ConsistencyIssue, i: number) => (
                    <tr key={i} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-600">{issue.id}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-red-600 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        {issue.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{issue.details}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Resolve</button>
                      </td>
                    </tr>
                  ))}
                  {consistency.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-green-600 font-medium">
                        No consistency issues found. Everything looks good.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReservationHistoryDashboard;