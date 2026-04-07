import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import sessionService from '@/services/sessionService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminSessionsDashboard() {
  const { t } = useI18n();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Resumen
  const [metrics, setMetrics] = useState({
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
      const response = await sessionService.getAllActiveSessions();
      
      // Manejar diferentes formatos de respuesta del backend
      const data = response.data || response || [];
      const sessionList = Array.isArray(data) ? data : [];
      
      setSessions(sessionList);
      
      // Calcular métricas
      setMetrics({
        active: sessionList.filter(s => s.is_active !== false).length,
        revokedToday: sessionList.filter(s => s.is_active === false).length, // Asumiendo data mock/real
        anomalies: sessionList.filter(s => s.is_anomaly).length || 0
      });
      
    } catch (error) {
      toast.error('Error al cargar las sesiones');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await sessionService.adminRevokeSession(id);
      toast.success('Sesión revocada exitosamente');
      fetchSessions();
    } catch (error) {
      toast.error('Error al revocar la sesión');
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

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Sessions Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time monitoring and management of active user sessions across the ERP ecosystem.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Card className="px-6 py-4 min-w-[160px] flex flex-col items-center border-l-4 border-l-blue-500 border-y-0 border-r-0 shadow-sm rounded-lg">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Active</span>
            <span className="text-2xl font-bold text-slate-900">{metrics.active}</span>
          </Card>
          <Card className="px-6 py-4 min-w-[160px] flex flex-col items-center border-l-4 border-l-orange-500 border-y-0 border-r-0 shadow-sm rounded-lg">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Revoked Today</span>
            <span className="text-2xl font-bold text-slate-900">{metrics.revokedToday}</span>
          </Card>
          <Card className="px-6 py-4 min-w-[160px] flex flex-col items-center border-l-4 border-l-red-500 border-y-0 border-r-0 shadow-sm rounded-lg">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Anomalies</span>
            <span className="text-2xl font-bold text-red-600">{metrics.anomalies}</span>
          </Card>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-3 shadow-sm rounded-lg border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 relative min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <Input 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 transition-all" 
              placeholder="Search by user, IP, or Device" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select 
              className="text-sm py-2 px-4 border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 border"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Idle">Idle</option>
              <option value="Revoked">Revoked</option>
            </select>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
          <Button 
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
            onClick={handleRevokeAll}
          >
            <span className="material-symbols-outlined">block</span>
            Revoke All
          </Button>
        </div>
      </Card>

      {/* High Density Data Grid */}
      <Card className="overflow-hidden shadow-sm rounded-lg border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Device/Browser</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">Cargando sesiones...</td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No se encontraron sesiones activas</td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={session.user?.avatar_url} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {session.user?.first_name?.charAt(0) || session.user?.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {session.user?.first_name ? `${session.user.first_name} ${session.user.last_name || ''}` : session.user?.username || 'Usuario Desconocido'}
                          </span>
                          <span className="text-[10px] text-slate-500">{session.user?.email || `ID: ${session.user_id}`}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-slate-600">{session.ip_address || 'Desconocida'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">
                          {session.device_type === 'mobile' ? 'smartphone' : 'laptop_mac'}
                        </span>
                        <span className="text-sm text-slate-600">{session.user_agent ? session.user_agent.substring(0, 20) + '...' : 'Browser / OS'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
                        <span className="text-sm text-slate-600">{session.location_info || 'Unknown Location'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500">
                        {session.last_activity ? new Date(session.last_activity).toLocaleString() : 'Recientemente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.is_active === false ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">Revoked</span>
                      ) : session.is_idle ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">Idle</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={session.is_active === false}
                        onClick={() => handleRevoke(session.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all h-8"
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination / Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Showing {filteredSessions.length} of {metrics.active} active sessions</span>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 text-slate-400 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 text-slate-600">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
