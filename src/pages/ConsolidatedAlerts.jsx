import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useDashboardStore from '@/store/useDashboardStore';
import { 
  Search, 
  CheckCheck, 
  RefreshCw, 
  List, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Server, 
  Clock, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight, 
  BellOff, 
  DollarSign, 
  ShieldAlert,
  Package,
  ShoppingCart,
  Activity,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DashboardNav from '@/components/business-intelligence/DashboardNav';

const ConsolidatedAlerts = () => {
  const navigate = useNavigate();
  const { alerts, fetchDashboardData, loading } = useDashboardStore();
  const [expandedAlertId, setExpandedAlertId] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    // Cargar datos si no hay (o forzar refresh si se desea explícito, pero asumimos caché de store)
    // Para asegurar datos frescos al entrar a la página:
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleAlert = (id) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
  };

  // Helper para iconos por categoría
  const getCategoryIcon = (category) => {
    if (!category) return Activity;
    switch (category.toLowerCase()) {
      case 'inventory': return Package;
      case 'financial': return DollarSign;
      case 'sales': return ShoppingCart;
      case 'security': return ShieldAlert;
      case 'infrastructure': return Server;
      default: return Activity;
    }
  };

  const getSeverityIconColor = (severity) => {
    switch (severity) {
      case 'critical': return 'alert-item__header-icon--critical';
      case 'warning': return 'alert-item__header-icon--warning';
      case 'info': return 'alert-item__header-icon--info';
      default: return '';
    }
  };

  const getSeverityClass = (severity) => {
    return `alert-item--${severity}`;
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    if (!alerts) return { total: 0, critical: 0, warning: 0, info: 0 };
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length
    };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
      if (!alerts) return [];
      if (filterSeverity === 'all') return alerts;
      return alerts.filter(a => a.severity === filterSeverity);
  }, [alerts, filterSeverity]);

  const renderKPI = (title, icon, value, type = 'neutral') => {
    const colors = {
      neutral: 'bg-blue-50 text-primary border-blue-100',
      critical: 'bg-red-50 text-error border-red-100',
      warning: 'bg-amber-50 text-amber-600 border-amber-100',
      info: 'bg-blue-50 text-info border-blue-100'
    };
    
    return (
      <div className={`p-6 rounded-xl border shadow-fluent-2 hover:shadow-fluent-8 transition-all group ${colors[type]}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
            {title}
          </span>
          <div className="group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">Alertas Consolidadas</h1>
          <p className="text-sm text-text-secondary font-medium">
            Monitoreo en tiempo real de eventos críticos del sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" className="shadow-sm border-border-subtle bg-surface">
            <CheckCheck size={18} className="mr-2" />
            Marcar Todo Leído
          </Button>
          <Button variant="primary" size="md" className="shadow-md" onClick={() => fetchDashboardData()}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Datos
          </Button>
        </div>
      </header>

      <DashboardNav />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderKPI(
            'Total Activas', 
            <List size={20} />, 
            metrics.total, 
            'neutral'
        )}
        {renderKPI(
            'Críticas', 
            <AlertCircle size={20} />, 
            metrics.critical, 
            'critical'
        )}
        {renderKPI(
            'Advertencias', 
            <AlertTriangle size={20} />, 
            metrics.warning, 
            'warning'
        )}
        {renderKPI(
            'Información', 
            <Info size={20} />, 
            metrics.info, 
            'info'
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <Search size={18} />
          </div>
          <Input className="pl-10 h-10 border-border-subtle rounded-lg bg-background-light/50 focus:bg-white transition-all" placeholder="Filtrar alertas..." />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Badge 
            variant={filterSeverity === 'all' ? 'default' : 'outline'} 
            className={`px-4 py-1.5 cursor-pointer whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${filterSeverity === 'all' ? 'bg-primary' : 'border-border-subtle'}`}
            onClick={() => setFilterSeverity('all')}
          >
            Todas
          </Badge>
          <Badge 
             variant={filterSeverity === 'critical' ? 'destructive' : 'outline'}
             className={`px-4 py-1.5 cursor-pointer whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${filterSeverity === 'critical' ? 'bg-error text-white border-transparent' : 'border-border-subtle'}`}
             onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
          >
             Críticas
          </Badge>
           <Badge 
             variant={filterSeverity === 'warning' ? 'warning' : 'outline'}
             className={`px-4 py-1.5 cursor-pointer whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${filterSeverity === 'warning' ? 'bg-warning text-black border-transparent' : 'border-border-subtle'}`}
             onClick={() => setFilterSeverity(filterSeverity === 'warning' ? 'all' : 'warning')}
          >
             Advertencias
          </Badge>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-4 pb-10">
        {!loading && filteredAlerts.length === 0 && (
             <div className="p-12 text-center bg-surface rounded-xl border border-dashed border-border-subtle">
                 <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">No hay alertas activas que coincidan con los filtros.</p>
             </div>
        )}

        {filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;
          const AlertIcon = getCategoryIcon(alert.category);
          
          const severityColors = {
            critical: 'border-l-error bg-red-50/10 hover:bg-red-50/20',
            warning: 'border-l-warning bg-amber-50/10 hover:bg-amber-50/20',
            info: 'border-l-info bg-blue-50/10 hover:bg-blue-50/20'
          };

          const iconColors = {
            critical: 'bg-red-50 text-error',
            warning: 'bg-amber-50 text-amber-600',
            info: 'bg-blue-50 text-primary'
          };

          return (
            <div 
                key={alert.id} 
                className={`bg-surface rounded-xl border border-border-subtle border-l-4 shadow-sm transition-all overflow-hidden ${severityColors[alert.severity]} ${isExpanded ? 'shadow-md' : 'hover:shadow-fluent-2'}`}
            >
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer" onClick={() => toggleAlert(alert.id)}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`size-12 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${iconColors[alert.severity]}`}>
                    <AlertIcon size={24} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-black text-text-main truncate group-hover:text-primary transition-colors uppercase tracking-tight">{alert.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">
                      <span>#{alert.id}</span>
                      <span className="size-1 rounded-full bg-slate-300"></span>
                      <span>{alert.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge 
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      alert.severity === 'critical' ? 'bg-error text-white' : 
                      alert.severity === 'warning' ? 'bg-warning text-black' : 
                      'bg-info text-white'
                    }`}
                  >
                    {alert.severity === 'critical' ? 'Crítica' : alert.severity === 'warning' ? 'Advertencia' : 'Info'}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary whitespace-nowrap opacity-60">
                    <Clock size={14} />
                    <span>{new Date(alert.created_at).toLocaleDateString()} {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>

                  <div className="hidden sm:block">
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-text-secondary">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </Button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-border-subtle/50">
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Detalle del Evento</h4>
                        <p className="text-sm text-text-secondary leading-relaxed font-medium">
                          {alert.message}
                        </p>
                      </div>
                      
                      {alert.details && Object.keys(alert.details).length > 0 && (
                          <div className="p-4 bg-background-light/50 rounded-lg border border-border-subtle">
                              <h5 className="text-[10px] font-black text-text-secondary mb-4 uppercase tracking-widest">Datos Técnicos</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {Object.entries(alert.details).map(([key, val]) => (
                                      <div key={key} className="space-y-1">
                                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60 capitalize">{key.replace(/_/g, ' ')}</span>
                                          <p className="text-xs font-black text-text-main break-all">
                                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                          </p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-end gap-3">
                      <Button variant="secondary" className="w-full h-11 shadow-sm border-border-subtle bg-surface hover:bg-slate-50 font-black uppercase tracking-widest text-xs" onClick={(e) => { e.stopPropagation(); }}>
                          <BellOff size={18} className="mr-2" />
                          Silenciar
                      </Button>
                      {alert.action_url && (
                          <Button variant="primary" className="w-full h-11 shadow-md font-black uppercase tracking-widest text-xs" onClick={(e) => { e.stopPropagation(); navigate(alert.action_url); }}>
                              Resolver
                              <ArrowRight size={18} className="ml-2" />
                          </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConsolidatedAlerts;
