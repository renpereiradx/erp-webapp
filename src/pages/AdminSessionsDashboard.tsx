import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import sessionService from '@/services/sessionService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSession } from '@/types';

interface Metrics {
  active: number;
  revokedToday: number;
  anomalies: number;
}

export default function AdminSessionsDashboard() {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Resumen
  const [metrics, setMetrics] = useState<Metrics>({
    active: 0,
    revokedToday: 0,
    anomalies: 0
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sessionService.getAllActiveSessions();
      
      const sessionList = response.data || [];
      setSessions(sessionList);
      
      // Calcular métricas
      setMetrics({
        active: sessionList.filter(s => s.is_active !== false).length,
        revokedToday: sessionList.filter(s => s.is_active === false).length,
        anomalies: sessionList.filter(s => s.is_anomaly).length || 0
      });
      
    } catch (err: any) {
      const message = err.message || 'Error al cargar las sesiones';
      setError(message);
      if (err.status === 403 || message.includes('403')) {
        toast.error('No tienes permisos para ver esta información administrativa');
      } else {
        toast.error(message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string | number) => {
    try {
      await sessionService.adminRevokeSession(id);
      toast.success('Sesión revocada exitosamente');
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || 'Error al revocar la sesión');
    }
  };

  const handleRevokeAll = () => {
    if (window.confirm('¿Está seguro de que desea revocar TODAS las sesiones activas?')) {
      toast.info('Funcionalidad de revocar todas las sesiones en desarrollo');
    }
  };

  // Filtrado
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.ip_address?.includes(searchTerm) ||
      session.device_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && session.is_active !== false) ||
      (statusFilter === 'Revoked' && session.is_active === false) ||
      (statusFilter === 'Idle' && session.is_idle === true);
      
    return matchesSearch && matchesStatus;
  });

  if (error && (error.includes('403') || error.includes('Forbidden'))) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
        <div className="size-20 rounded-full bg-error/10 text-error flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl">block</span>
        </div>
        <h2 className="text-2xl font-black text-text-main uppercase tracking-tight mb-2">Acceso Denegado</h2>
        <p className="text-text-secondary max-w-md mb-8">Esta es una sección administrativa. Tu usuario no cuenta con los permisos necesarios para gestionar sesiones globales.</p>
        <Button onClick={() => window.history.back()}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight uppercase">Control Global de Sesiones</h1>
          <p className="text-text-secondary text-sm mt-1">Monitoreo y gestión en tiempo real de sesiones activas en todo el ecosistema ERP.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Card className="px-6 py-4 min-w-[160px] flex flex-col items-center border-l-4 border-l-blue-500 border-y-0 border-r-0 shadow-sm rounded-lg bg-surface">
            <span className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mb-1">Total Activas</span>
            <span className="text-2xl font-bold text-text-main">{metrics.active}</span>
          </Card>
          <Card className="px-6 py-4 min-w-[160px] flex flex-col items-center border-l-4 border-l-orange-500 border-y-0 border-r-0 shadow-sm rounded-lg bg-surface">
            <span className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mb-1">Revocadas Hoy</span>
            <span className="text-2xl font-bold text-text-main">{metrics.revokedToday}</span>
          </Card>
          <Card className="px-6 py-4 min-w-[160px] flex flex-col items-center border-l-4 border-l-red-500 border-y-0 border-r-0 shadow-sm rounded-lg bg-surface">
            <span className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mb-1">Anomalías</span>
            <span className="text-2xl font-bold text-error">{metrics.anomalies}</span>
          </Card>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-3 shadow-sm rounded-lg border-border-subtle bg-surface">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 relative min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <Input 
              className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-slate-900 border-border-subtle rounded-lg text-sm focus:ring-primary focus:border-primary transition-all" 
              placeholder="Buscar por usuario, IP o dispositivo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">Estado:</span>
            <select 
              className="text-sm py-2 px-4 border-border-subtle rounded-lg bg-surface text-text-main focus:ring-primary focus:border-primary border outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Todos</option>
              <option value="Active">Activos</option>
              <option value="Idle">Inactivos</option>
              <option value="Revoked">Revocados</option>
            </select>
          </div>
          <div className="h-8 w-px bg-border-subtle mx-2 hidden sm:block"></div>
          <Button 
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 border-error/20 text-error rounded-lg text-sm font-semibold hover:bg-error/5 transition-colors"
            onClick={handleRevokeAll}
          >
            <span className="material-symbols-outlined">block</span>
            Revocar Todas
          </Button>
        </div>
      </Card>

      {/* High Density Data Grid */}
      <Card className="overflow-hidden shadow-sm rounded-lg border-border-subtle bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border-subtle">
                <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Dirección IP</th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Dispositivo/Navegador</th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Última Actividad</th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">Cargando sesiones...</td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">No se encontraron sesiones activas</td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={session.user?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {session.user?.first_name?.charAt(0) || session.user?.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-text-main">
                            {session.user?.first_name ? `${session.user.first_name} ${session.user.last_name || ''}` : session.user?.username || 'Usuario Desconocido'}
                          </span>
                          <span className="text-[10px] text-text-secondary">{session.user?.email || `ID: ${session.user_id}`}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-text-secondary">{session.ip_address || 'Desconocida'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">
                          {session.device_type === 'mobile' ? 'smartphone' : 'laptop_mac'}
                        </span>
                        <span className="text-sm text-text-secondary">{session.user_agent ? (session.user_agent.length > 20 ? session.user_agent.substring(0, 20) + '...' : session.user_agent) : 'Browser / OS'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
                        <span className="text-sm text-text-secondary">{session.location_info || 'Ubicación Desconocida'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-secondary">
                        {session.last_activity ? new Date(session.last_activity).toLocaleString() : 'Recientemente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.is_active === false ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-error/10 text-error uppercase">Revocada</span>
                      ) : session.is_idle ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-warning/10 text-warning uppercase">Inactiva</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-success/10 text-success uppercase">Activa</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={session.is_active === false}
                        onClick={() => handleRevoke(session.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-text-secondary border-border-subtle rounded-md hover:bg-error/5 hover:text-error hover:border-error/20 transition-all h-8"
                      >
                        Revocar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination / Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-border-subtle flex items-center justify-between">
          <span className="text-xs text-text-secondary font-medium">Mostrando {filteredSessions.length} de {metrics.active} sesiones activas</span>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 text-text-secondary border-border-subtle disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 text-text-secondary border-border-subtle">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Dashboard Insights (Asymmetric Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="md:col-span-2 p-6 rounded-lg shadow-sm border-border-subtle bg-surface">
          <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Tendencias de Actividad de Sesiones
          </h3>
          <div className="h-48 flex items-end justify-between gap-2 px-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-[40%]"></div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-[55%]"></div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-[35%]"></div>
            <div className="w-full bg-primary/60 rounded-t h-[80%]"></div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-[60%]"></div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-[45%]"></div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-[70%]"></div>
            <div className="w-full bg-primary rounded-t h-[95%]"></div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-[50%]"></div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-[65%]"></div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-[40%]"></div>
            <div className="w-full bg-primary/80 rounded-t h-[85%]"></div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-text-secondary font-bold uppercase">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </Card>
        <Card className="p-6 flex flex-col justify-between rounded-lg shadow-sm border-border-subtle bg-surface">
          <div>
            <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-warning">public</span>
              Distribución Geográfica
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Sudamérica (Paraguay)</span>
                <span className="font-bold text-text-main">82%</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Norteamérica</span>
                <span className="font-bold text-text-main">12%</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Europa</span>
                <span className="font-bold text-text-main">4%</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Otros</span>
                <span className="font-bold text-text-main">2%</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <Button variant="ghost" className="w-full py-2 text-primary text-xs font-bold rounded-lg hover:bg-primary/5 transition-colors uppercase tracking-wider h-auto">
              Ver Mapa Detallado
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
