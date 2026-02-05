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

  const renderKPI = (title, icon, value, type = 'neutral') => (
    <div className={`consolidated-alerts__kpi-card consolidated-alerts__kpi-card--${type}`}>
      <div className="consolidated-alerts__kpi-card-header">
        <span className={`consolidated-alerts__kpi-card-header-title consolidated-alerts__kpi-card-header-title--${type}`}>
          {title}
        </span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="consolidated-alerts__kpi-card-value">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="consolidated-alerts">
      {/* Header */}
      <header className="consolidated-alerts__header">
        <div className="consolidated-alerts__header-content">
          <h1 className="consolidated-alerts__header-title">Alertas Consolidadas</h1>
          <p className="consolidated-alerts__header-subtitle">
            Monitoreo en tiempo real de eventos críticos del sistema.
          </p>
        </div>
        <div className="consolidated-alerts__header-actions">
          <Button variant="outline" className="gap-2">
            <CheckCheck size={18} />
            Marcar Todo Leído
          </Button>
          <Button variant="primary" className="gap-2" onClick={() => fetchDashboardData()}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualizar Datos
          </Button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="consolidated-alerts__kpi-grid">
        {renderKPI(
            'Total Activas', 
            <List size={20} className="text-secondary" />, 
            metrics.total, 
            'neutral'
        )}
        {renderKPI(
            'Críticas', 
            <AlertCircle size={20} className="text-error" fill="currentColor" fillOpacity={0.2} />, 
            metrics.critical, 
            'critical'
        )}
        {renderKPI(
            'Advertencias', 
            <AlertTriangle size={20} className="text-warning" />, 
            metrics.warning, 
            'warning'
        )}
        {renderKPI(
            'Información', 
            <Info size={20} className="text-info" />, 
            metrics.info, 
            'info'
        )}
      </div>

      {/* Toolbar */}
      <div className="consolidated-alerts__toolbar">
        <div className="consolidated-alerts__toolbar-filters">
          <div className="consolidated-alerts__toolbar-search">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
              <Search size={18} />
            </div>
            <Input className="pl-10" placeholder="Filtrar alertas..." />
          </div>
          
          <div className="divider divider--vertical divider--compact hidden sm:block"></div>

          <Badge 
            variant={filterSeverity === 'all' ? 'default' : 'outline'} 
            className="gap-2 px-3 py-1.5 cursor-pointer"
            onClick={() => setFilterSeverity('all')}
          >
            Todas
          </Badge>
          <Badge 
             variant={filterSeverity === 'critical' ? 'destructive' : 'outline'}
             className="gap-2 px-3 py-1.5 cursor-pointer"
             onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
          >
             Críticas
          </Badge>
           <Badge 
             variant={filterSeverity === 'warning' ? 'warning' : 'outline'}
             className="gap-2 px-3 py-1.5 cursor-pointer"
             onClick={() => setFilterSeverity(filterSeverity === 'warning' ? 'all' : 'warning')}
          >
             Advertencias
          </Badge>
        </div>
      </div>

      {/* Alert List */}
      <div className="consolidated-alerts__list">
        {!loading && filteredAlerts.length === 0 && (
             <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-dashed">
                 No hay alertas activas que coincidan con los filtros.
             </div>
        )}

        {filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;
          const AlertIcon = getCategoryIcon(alert.category);

          return (
            <div 
                key={alert.id} 
                className={`alert-item ${getSeverityClass(alert.severity)}`}
            >
              <div className="alert-item__header" onClick={() => toggleAlert(alert.id)}>
                <div className="alert-item__header-main">
                  <div className={`alert-item__header-icon ${getSeverityIconColor(alert.severity)}`}>
                    <AlertIcon size={24} />
                  </div>
                  <div className="alert-item__header-info">
                    <h3 className="alert-item__header-title">{alert.title}</h3>
                    <span className="alert-item__header-meta">
                      ID: #{alert.id} • {alert.category}
                    </span>
                  </div>
                </div>

                <div className="alert-item__header-actions">
                  <Badge 
                    variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'warning' : 'secondary'}
                    className="capitalize"
                  >
                    {alert.severity === 'critical' ? 'Crítica' : alert.severity === 'warning' ? 'Advertencia' : 'Info'}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <Clock size={16} />
                    {new Date(alert.created_at).toLocaleDateString()} {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>

                  <Button variant="ghost" size="icon" className="ml-1">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="alert-item__expanded">
                  <div className="alert-item__expanded-grid">
                    <div className="alert-item__expanded-details col-span-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Detalle del Evento</h4>
                      <p className="alert-item__expanded-description">
                        {alert.message}
                      </p>
                      
                        {/* Dynamic Details Rendering based on API 'details' map */}
                        {alert.details && Object.keys(alert.details).length > 0 && (
                            <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                                <h5 className="font-semibold text-xs text-gray-500 mb-2 uppercase">Datos Técnicos</h5>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(alert.details).map(([key, val]) => (
                                        <div key={key} className="flex flex-col">
                                            <span className="text-xs text-secondary capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="font-medium text-gray-800 break-all">
                                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                  </div>

                  <div className="alert-item__expanded-actions-bar mt-4">
                    <Button variant="secondary" className="gap-2" onClick={(e) => { e.stopPropagation(); }}>
                        <BellOff size={18} />
                        Silenciar
                    </Button>
                    <div className="flex-1"></div>
                    {alert.action_url && (
                        <Button variant="primary" className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(alert.action_url); }}>
                            Ver Detalle / Resolver
                            <ArrowRight size={18} />
                        </Button>
                    )}
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
