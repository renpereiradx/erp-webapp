import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useDashboardStore from '@/store/useDashboardStore';
import DashboardNav from '@/components/business-intelligence/DashboardNav';

const ConsolidatedAlerts = () => {
  const navigate = useNavigate();
  const { alerts, fetchDashboardData, loading } = useDashboardStore();
  const [expandedAlertId, setExpandedAlertId] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleAlert = (id) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
  };

  // Icon mapping by category (Material Symbols)
  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('inv')) return 'inventory_2';
    if (cat.includes('fin')) return 'payments';
    if (cat.includes('sal')) return 'shopping_cart';
    if (cat.includes('sec')) return 'shield';
    if (cat.includes('infra')) return 'dns';
    return 'notifications';
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    if (!alerts) return { total: 0, critical: 0, warning: 0, info: 0 };
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length
    };
  }, [alerts]);

  // Filtering logic
  const filteredAlerts = useMemo(() => {
      if (!alerts) return [];
      let result = alerts;
      
      if (filterSeverity !== 'all') {
        result = result.filter(a => a.severity === filterSeverity);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(a => 
          a.title?.toLowerCase().includes(query) || 
          a.message?.toLowerCase().includes(query) ||
          String(a.id).includes(query)
        );
      }
      
      return result;
  }, [alerts, filterSeverity, searchQuery]);

  return (
    <div className="flex flex-col gap-6 font-display animate-in fade-in duration-500">
      
      {/* Page Heading & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#111418] dark:text-white leading-none">Consolidated Alerts</h1>
          <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">Real-time monitoring of critical system events. Last updated: Just now</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] text-[#111418] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark All Read
          </button>
          <button 
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#106ebe] text-white text-sm font-medium hover:bg-[#005a9e] transition-colors shadow-sm disabled:opacity-50"
            onClick={() => fetchDashboardData()}
            disabled={loading}
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh Data
          </button>
        </div>
      </div>

      <DashboardNav />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active */}
        <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] shadow-fluent-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#617589] dark:text-gray-400">Total Active</span>
            <span className="material-symbols-outlined text-[#617589] text-[20px]">list_alt</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111418] dark:text-white">{metrics.total}</span>
            <span className="text-xs font-medium text-green-600 flex items-center">
              <span className="material-symbols-outlined text-[14px]">trending_down</span>
              12%
            </span>
          </div>
        </div>

        {/* Critical */}
        <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] border-l-4 border-l-red-500 shadow-fluent-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-600">Critical</span>
            <span className="material-symbols-outlined text-red-600 text-[20px] fill-current">error</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111418] dark:text-white">{metrics.critical}</span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-medium">Needs attention</span>
          </div>
        </div>

        {/* Warnings */}
        <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] border-l-4 border-l-orange-500 shadow-fluent-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-600">Warnings</span>
            <span className="material-symbols-outlined text-orange-600 text-[20px]">warning</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111418] dark:text-white">{metrics.warning}</span>
            <span className="text-xs font-medium text-red-500 flex items-center">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +2
            </span>
          </div>
        </div>

        {/* Information */}
        <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] border-l-4 border-l-[#106ebe] shadow-fluent-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#106ebe]">Information</span>
            <span className="material-symbols-outlined text-[#106ebe] text-[20px]">info</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111418] dark:text-white">{metrics.info}</span>
            <span className="text-xs text-[#617589] dark:text-gray-400 font-medium">Routine logs</span>
          </div>
        </div>
      </div>

      {/* Filters & Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1b2631] p-2 rounded-xl border border-slate-200 dark:border-[#374151] shadow-sm">
        {/* Left: Search and Chips */}
        <div className="flex flex-1 w-full md:w-auto items-center gap-3 overflow-x-auto no-scrollbar py-1 px-1">
          <div className="relative min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#617589]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-[#374151] bg-[#f6f7f8] dark:bg-[#101922] pl-9 pr-3 text-sm focus:border-[#106ebe] focus:outline-none focus:ring-1 focus:ring-[#106ebe] dark:text-white placeholder:text-[#617589] font-medium" 
              placeholder="Filter alerts..."
            />
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-[#374151] mx-1 shrink-0"></div>
          
          <button 
            className={`flex shrink-0 h-8 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors ${
              filterSeverity === 'all' 
                ? 'bg-[#106ebe]/10 text-[#106ebe] border border-[#106ebe]/20 font-bold' 
                : 'bg-[#f6f7f8] dark:bg-[#101922] border border-slate-200 dark:border-[#374151] hover:bg-gray-100 dark:hover:bg-gray-700 text-[#111418] dark:text-white'
            }`}
            onClick={() => setFilterSeverity('all')}
          >
            Status: Open
            {filterSeverity === 'all' && <span className="material-symbols-outlined text-[16px] ml-1 font-bold">close</span>}
          </button>

          <button 
            className={`flex shrink-0 h-8 items-center gap-2 rounded-full border border-slate-200 dark:border-[#374151] hover:bg-gray-100 dark:hover:bg-gray-700 px-3 text-xs font-medium text-[#111418] dark:text-white transition-colors ${
              filterSeverity !== 'all' ? 'bg-[#106ebe]/10 border-[#106ebe]/20 font-bold text-[#106ebe]' : 'bg-[#f6f7f8] dark:bg-[#101922]'
            }`}
          >
            Severity
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>

          <button 
            className="flex shrink-0 h-8 items-center gap-2 rounded-full bg-[#f6f7f8] dark:bg-[#101922] border border-slate-200 dark:border-[#374151] hover:bg-gray-100 dark:hover:bg-gray-700 px-3 text-xs font-medium text-[#111418] dark:text-white transition-colors"
          >
            Category
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
        </div>

        {/* Right: View Options */}
        <div className="flex items-center gap-2 shrink-0 pr-2">
          <span className="text-xs text-[#617589] font-medium hidden sm:block mr-2">Sort by: Severity (High to Low)</span>
          <button className="p-2 text-[#617589] hover:text-[#106ebe] rounded-lg hover:bg-[#f6f7f8] dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-[20px]">sort</span>
          </button>
          <button className="p-2 text-[#617589] hover:text-[#106ebe] rounded-lg hover:bg-[#f6f7f8] dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </div>

      {/* Alerts List Container */}
      <div className="flex flex-col gap-3 pb-10">
        {filteredAlerts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1b2631] rounded-xl border border-dashed border-slate-300 dark:border-[#374151]">
            <span className="material-symbols-outlined text-6xl text-[#617589] mb-4">notifications_off</span>
            <p className="text-[#617589] font-bold uppercase tracking-widest text-xs">Clear System Status</p>
            <p className="text-[#617589] text-xs opacity-60 mt-1">No active alerts found.</p>
          </div>
        )}

        {filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;
          const severityColorClass = alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-orange-500' : 'bg-[#106ebe]';
          const severityBg = alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' : alert.severity === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
          const severityText = alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'warning' ? 'text-orange-600' : 'text-[#106ebe]';
          const badgeClass = alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 ring-red-600/10' : 
                             alert.severity === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 ring-orange-600/10' : 
                             'bg-blue-50 dark:bg-blue-900/20 text-[#106ebe] dark:text-blue-300 ring-[#106ebe]/20';
          
          return (
            <div 
              key={alert.id}
              className={`group relative flex flex-col rounded-xl bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] shadow-fluent-shadow transition-all duration-300 ${isExpanded ? 'ring-1 ring-[#106ebe]/20' : 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),_0_8px_16px_rgba(0,0,0,0.08)]'}`}
            >
              {/* Color Strip Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${severityColorClass} rounded-l-xl z-10`}></div>
              
              {/* Header / Summary Row */}
              <div 
                className="flex flex-col sm:flex-row items-start sm:items-center p-4 pl-6 gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleAlert(alert.id)}
              >
                {/* Icon & Title */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={`size-10 rounded-full ${severityBg} flex items-center justify-center shrink-0 ${severityText}`}>
                    <span className="material-symbols-outlined">{getCategoryIcon(alert.category)}</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-[#111418] dark:text-white leading-tight">{alert.title || alert.message}</h3>
                    <span className="text-sm text-[#617589] dark:text-gray-400 font-medium">ID: #{alert.id} • {alert.category || 'System'}</span>
                  </div>
                </div>

                {/* Meta Tags */}
                <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${badgeClass}`}>
                    {alert.severity}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[#617589] font-bold">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-gray-800 shadow-sm ml-2 hidden sm:flex items-center justify-center text-[10px] font-bold text-slate-500">
                    AD
                  </div>
                  <button className="p-1 text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors">
                    <span className={`material-symbols-outlined transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                </div>
              </div>

              {/* Expanded Detail View */}
              {isExpanded && (
                <div className="flex flex-col gap-6 border-t border-slate-200 dark:border-[#374151] bg-[#f6f7f8]/50 dark:bg-[#101922]/30 p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Details Text */}
                    <div className="lg:col-span-2 space-y-3">
                      <h4 className="text-sm font-semibold text-[#111418] dark:text-white uppercase tracking-wider">Issue Description</h4>
                      <p className="text-sm text-[#617589] dark:text-gray-300 leading-relaxed font-medium">
                        {alert.message}
                      </p>
                      <div className="flex gap-4 pt-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Diagnostic ID</span>
                          <span className="text-xs font-mono bg-white dark:bg-black/20 px-2 py-1 rounded-lg border border-slate-200 dark:border-[#374151] font-bold text-[#111418] dark:text-white">ERR_ALT_{alert.id}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Affected Node</span>
                          <span className="text-xs font-bold dark:text-white capitalize">{alert.category || 'General'}</span>
                        </div>
                      </div>
                      
                      {alert.details && Object.keys(alert.details).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-[#374151] mt-2">
                           {Object.entries(alert.details).map(([key, val]) => (
                              <div key={key} className="flex flex-col gap-1">
                                 <span className="text-[10px] font-bold text-[#617589] uppercase tracking-tighter">{key.replace(/_/g, ' ')}</span>
                                 <span className="text-xs font-mono bg-white dark:bg-black/20 px-2 py-1 rounded-lg border border-slate-200 dark:border-[#374151] break-all font-bold text-slate-700 dark:text-slate-200">
                                   {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                 </span>
                              </div>
                           ))}
                        </div>
                      )}
                    </div>
                    {/* Mini Chart / Visual */}
                    <div className="lg:col-span-1 flex flex-col justify-end bg-white dark:bg-[#1b2631] rounded-xl p-4 border border-slate-200 dark:border-[#374151] shadow-sm h-full min-h-[120px]">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-semibold text-[#617589]">Latency (ms) - Last 1h</span>
                        <span className={`text-xs font-bold ${alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>842ms Peak</span>
                      </div>
                      <div className="flex items-end justify-between gap-1.5 h-24 w-full px-1">
                        <div className="w-full bg-[#106ebe]/20 rounded-full h-[20%]"></div>
                        <div className="w-full bg-[#106ebe]/20 rounded-full h-[25%]"></div>
                        <div className="w-full bg-[#106ebe]/20 rounded-full h-[22%]"></div>
                        <div className="w-full bg-[#106ebe]/30 rounded-full h-[35%]"></div>
                        <div className="w-full bg-[#106ebe]/40 rounded-full h-[45%]"></div>
                        <div className="w-full bg-orange-300 rounded-full h-[60%]"></div>
                        <div className="w-full bg-red-400 dark:bg-red-500/80 rounded-full h-[85%]"></div>
                        <div className="w-full bg-red-500 dark:bg-red-500 rounded-full h-[95%]"></div>
                      </div>
                    </div>
                  </div>
                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#374151] mt-4 px-2 pb-2">
                    <button className="flex items-center gap-2 h-9 px-4 rounded-lg text-[#617589] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                      <span className="material-symbols-outlined text-[18px]">notifications_off</span>
                      Mute Alert
                    </button>
                    <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white dark:bg-[#1b2631] border border-slate-200 dark:border-[#374151] text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      View Logs
                    </button>
                    <button 
                      className="flex items-center gap-2 h-9 px-6 rounded-lg bg-[#106ebe] text-white hover:bg-[#005a9e] transition-colors text-sm font-bold shadow-md"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if(alert.action_url) navigate(alert.action_url); 
                      }}
                    >
                      Investigate
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
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
