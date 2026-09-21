import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import auditService from '@/services/bi/auditService';

/**
 * Actividad de un usuario (auditoría BI).
 * Cierre VERIFICACION_POST_CIERRE (2026-09-21): fuera las fabricaciones sin
 * dato real — badges de crecimiento (+12%/+5%/-2%), "Tendencia Positiva
 * +15%", "Última actividad: hace poco", "IP: 192.168.1.104" — y los botones
 * muertos (Exportar Reporte / Editar Perfil / Ver todo), regla §2.6.
 * Pendiente de migración full (tokens DESIGN, i18n, iconos): deuda legacy.
 */
export default function AuditUserActivity() {
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserActivity();
  }, [id]);

  const fetchUserActivity = async () => {
    try {
      setLoading(true);
      const data = await auditService.getUserActivity(id || '');
      setActivity(data);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando actividad...</div>;
  }

  if (!activity) {
    return <div className="text-red-500">No se encontraron datos de actividad para este usuario.</div>;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 font-inter max-w-7xl mx-auto w-full">
      
      {/* User Profile Header */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#137fec] to-blue-400 p-0.5 shadow-lg">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                <div className="size-full bg-slate-100 flex items-center justify-center font-black text-2xl text-[#137fec] uppercase">
                  {activity.username?.charAt(0)}
                </div>
              </div>
            </div>
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{activity.username}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center text-sm text-slate-500">
                <span className="material-symbols-outlined text-base mr-1">fingerprint</span>
                ID: {activity.user_id}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Summary KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Acciones Totales', val: activity.summary.total_actions.toLocaleString(), icon: 'analytics', bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Promedio Diario', val: activity.summary.avg_actions_per_day, icon: 'query_stats', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Categorías Únicas', val: activity.summary.unique_categories, icon: 'category', bg: 'bg-orange-50', color: 'text-orange-600' },
          { label: 'Tasa de Éxito', val: `${((activity.summary.successful_actions/activity.summary.total_actions)*100).toFixed(1)}%`, icon: 'check_circle', bg: 'bg-green-50', color: 'text-green-600' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start mb-4">
              <span className={`p-2 ${kpi.bg} ${kpi.color} rounded-lg material-symbols-outlined font-bold`}>{kpi.icon}</span>
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-tight">{kpi.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{kpi.val}</h3>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Card */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Acciones por Categoría</h2>
            <span className="material-symbols-outlined text-slate-400">info</span>
          </div>
          <div className="space-y-6">
            {activity.actions_by_category.map((item: any) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-700">{item.category}</span>
                  <span className="text-slate-500">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                  <div className="bg-[#137fec] h-full rounded-full transition-all duration-1000" style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity Timeline */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Línea de Tiempo de Actividad</h2>
          </div>
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
            {activity.recent_actions.map((action: any) => (
              <div key={action.id} className="relative flex items-center gap-6">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white z-10 shadow-sm ${
                  action.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <span className="material-symbols-outlined text-xl font-bold">
                    {action.action === 'CREATE' ? 'check' : action.action === 'LOGIN' ? 'login' : 'description'}
                  </span>
                </div>
                <div className="flex flex-col grow">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-slate-900">{action.description} {action.entity_id ? `: #${action.entity_id}` : ''}</p>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(action.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-tight">Módulo {action.category} &middot; IP: {action.ip_address || 'Local'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
