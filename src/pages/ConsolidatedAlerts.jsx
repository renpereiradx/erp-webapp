import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Bell, 
  CheckCheck, 
  RefreshCw, 
  List, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  TrendingDown, 
  TrendingUp, 
  X, 
  ChevronDown, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Server, 
  Clock, 
  ChevronUp, 
  Eye, 
  ArrowRight, 
  BellOff, 
  DollarSign, 
  Users, 
  ShieldAlert,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

// Mock Data
const ALERTS_DATA = [
  {
    id: 'ALT-2024-892',
    title: 'High Latency on DB-Cluster-04',
    source: 'Infrastructure',
    severity: 'critical', // critical, warning, info
    timestamp: '12 mins ago',
    assignee: 'https://github.com/shadcn.png', // Placeholder
    description: 'Database query latency has exceeded the critical threshold of 500ms for the last 15 minutes. Automated diagnostics indicate a potential deadlock in the payment processing queue. Requires immediate investigation to prevent transaction failures.',
    errorCode: 'ERR_TIMEOUT_504',
    affectedUsers: '~1,240 sessions',
    chartData: [20, 25, 22, 35, 45, 60, 85, 95, 90, 80],
    icon: Server
  },
  {
    id: 'ALT-2024-890',
    title: 'Q3 Budget Threshold Approaching',
    source: 'Finance',
    severity: 'warning',
    timestamp: '2h ago',
    assignee: 'https://github.com/shadcn.png',
    description: 'Departmental spending is at 92% of the allocated budget for Q3. Projected spend indicates an overage by end of month if not adjusted.',
    errorCode: 'FIN_BUDGET_WARN',
    affectedUsers: 'Finance Dept',
    chartData: [10, 15, 20, 30, 40, 50, 60, 70, 85, 92],
    icon: DollarSign
  },
  {
    id: 'ALT-2024-885',
    title: 'New Enterprise Accounts Onboarded',
    source: 'Sales Ops',
    severity: 'info',
    timestamp: 'Yesterday',
    assignee: null, // Unassigned
    description: 'Successfully onboarded 3 new enterprise accounts. Initial setup complete, awaiting customer verification.',
    errorCode: 'OPS_SUCCESS',
    affectedUsers: 'Sales Team',
    chartData: [5, 5, 10, 10, 15, 20, 20, 25, 30, 35],
    icon: Users
  },
  {
    id: 'ALT-2024-881',
    title: 'Unauthorized Access Attempt Blocked',
    source: 'Security',
    severity: 'critical',
    timestamp: 'Yesterday',
    assignee: 'https://github.com/shadcn.png',
    description: 'Multiple failed login attempts detected from IP range 192.168.x.x. Firewall rules automatically updated to block source.',
    errorCode: 'SEC_AUTH_FAIL',
    affectedUsers: 'System',
    chartData: [1, 2, 1, 5, 20, 45, 10, 2, 1, 0],
    icon: ShieldAlert
  }
];

const ConsolidatedAlerts = () => {
  const [expandedAlertId, setExpandedAlertId] = useState('ALT-2024-892'); // Default open first

  const toggleAlert = (id) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
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

  const renderKPI = (title, icon, value, trend, trendValue, trendDirection, type = 'neutral') => (
    <div className={`consolidated-alerts__kpi-card consolidated-alerts__kpi-card--${type}`}>
      <div className="consolidated-alerts__kpi-card-header">
        <span className={`consolidated-alerts__kpi-card-header-title consolidated-alerts__kpi-card-header-title--${type}`}>
          {title}
        </span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="consolidated-alerts__kpi-card-value">{value}</span>
        {trend && (
          <span className={`consolidated-alerts__kpi-card-trend consolidated-alerts__kpi-card-trend--${trendDirection}`}>
            {trendDirection === 'positive' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trendValue}
          </span>
        )}
        {!trend && trendValue && (
            <span className="consolidated-alerts__kpi-card-trend consolidated-alerts__kpi-card-trend--neutral">
                {trendValue}
            </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="consolidated-alerts">
      {/* Header */}
      <header className="consolidated-alerts__header">
        <div className="consolidated-alerts__header-content">
          <h1 className="consolidated-alerts__header-title">Consolidated Alerts</h1>
          <p className="consolidated-alerts__header-subtitle">
            Real-time monitoring of critical system events. Last updated: Just now
          </p>
        </div>
        <div className="consolidated-alerts__header-actions">
          <Button variant="outline" className="gap-2">
            <CheckCheck size={18} />
            Mark All Read
          </Button>
          <Button variant="primary" className="gap-2">
            <RefreshCw size={18} />
            Refresh Data
          </Button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="consolidated-alerts__kpi-grid">
        {renderKPI(
            'Total Active', 
            <List size={20} className="text-secondary" />, 
            '24', 
            true, 
            '12%', 
            'positive', 
            'neutral'
        )}
        {renderKPI(
            'Critical', 
            <AlertCircle size={20} className="text-error" fill="currentColor" fillOpacity={0.2} />, 
            '3', 
            false, 
            'Needs attention', 
            'neutral', 
            'critical'
        )}
        {renderKPI(
            'Warnings', 
            <AlertTriangle size={20} className="text-warning" />, 
            '8', 
            true, 
            '+2', 
            'negative', 
            'warning'
        )}
        {renderKPI(
            'Information', 
            <Info size={20} className="text-info" />, 
            '13', 
            false, 
            'Routine logs', 
            'neutral', 
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
            <Input className="pl-10" placeholder="Filter alerts..." />
          </div>
          
          <div className="divider divider--vertical divider--compact hidden sm:block"></div>

          <Badge variant="subtle-info" className="gap-2 px-3 py-1.5 cursor-pointer">
            Status: Open
            <X size={14} />
          </Badge>
          <Button variant="outline" size="sm" className="gap-2 rounded-full font-normal">
            Severity
            <ChevronDown size={14} />
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full font-normal">
            Category
            <ChevronDown size={14} />
          </Button>
        </div>

        <div className="consolidated-alerts__toolbar-view-options">
          <span className="text-sm text-secondary font-medium hidden sm:block">
            Sort by: Severity (High to Low)
          </span>
          <Button variant="ghost" size="icon">
            <ArrowUpDown size={20} className="text-secondary" />
          </Button>
          <Button variant="ghost" size="icon">
            <SlidersHorizontal size={20} className="text-secondary" />
          </Button>
        </div>
      </div>

      {/* Alert List */}
      <div className="consolidated-alerts__list">
        {ALERTS_DATA.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;
          const AlertIcon = alert.icon;

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
                      ID: #{alert.id} • {alert.source}
                    </span>
                  </div>
                </div>

                <div className="alert-item__header-actions">
                  <Badge 
                    variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'warning' : 'secondary'}
                    className="capitalize"
                  >
                    {alert.severity}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <Clock size={16} />
                    {alert.timestamp}
                  </div>

                  {alert.assignee ? (
                    <Avatar className="h-8 w-8 ml-2 border border-white shadow-sm hidden sm:block">
                      <AvatarImage src={alert.assignee} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="alert-item__unassigned-avatar hidden sm:flex">
                        <User size={16} />
                    </div>
                  )}

                  <Button variant="ghost" size="icon" className="ml-1">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="alert-item__expanded">
                  <div className="alert-item__expanded-grid">
                    <div className="alert-item__expanded-details">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Issue Description</h4>
                      <p className="alert-item__expanded-description">
                        {alert.description}
                      </p>
                      
                      <div className="flex gap-6 pt-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-secondary">Error Code</span>
                          <code className="text-sm">
                            {alert.errorCode}
                          </code>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-secondary">Affected Users</span>
                          <span className="text-sm font-medium">{alert.affectedUsers}</span>
                        </div>
                      </div>
                    </div>

                    <div className="alert-item__expanded-chart-container">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-semibold text-secondary">Latency (ms) - Last 1h</span>
                            <span className="text-xs font-bold text-red-600">842ms Peak</span>
                        </div>
                        <div className="alert-item__expanded-chart">
                            {alert.chartData.map((value, idx) => (
                                <div 
                                    key={idx} 
                                    className={`alert-item__expanded-bar ${value > 80 ? 'alert-item__expanded-bar--critical' : value > 50 ? 'alert-item__expanded-bar--high' : ''}`}
                                    style={{ height: `${value}%` }}
                                ></div>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className="alert-item__expanded-actions-bar">
                    <Button variant="ghost" className="gap-2 text-secondary">
                        <BellOff size={18} />
                        Mute Alert
                    </Button>
                    <Button variant="secondary" className="gap-2">
                        <Eye size={18} />
                        View Logs
                    </Button>
                    <Button variant="primary" className="gap-2">
                        Investigate
                        <ArrowRight size={18} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-center pt-4">
        <Button variant="ghost" className="gap-2 text-secondary hover:text-primary">
            Show older alerts
            <ChevronDown size={18} />
        </Button>
      </div>
    </div>
  );
};

export default ConsolidatedAlerts;
