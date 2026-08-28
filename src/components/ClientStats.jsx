import React, { useEffect } from 'react';
import useClientStore from '../store/useClientStore';
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react';

const StatCard = ({ title, value, icon, loading }) => {

  return (
    <div className="bg-card text-card-foreground border rounded-lg shadow-sm">
      <div className="flex items-center p-4">
        <div className="p-3 bg-primary/10 text-primary rounded-lg mr-4">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-muted animate-pulse mt-1 rounded-md"></div>
          ) : (
            <p className="text-2xl font-semibold text-foreground">{value ?? '-'}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ClientStats = () => {
  const { stats, statsLoading, fetchStatistics } = useClientStore();

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard 
        title="Clientes Totales" 
        value={stats?.total_clients} 
        icon={<Users className="w-6 h-6" />} 
        loading={statsLoading}
      />
      <StatCard 
        title="Activos" 
        value={stats?.active_clients} 
        icon={<UserCheck className="w-6 h-6" />} 
        loading={statsLoading}
      />
      <StatCard 
        title="Nuevos (este mes)" 
        value={stats?.new_clients} 
        icon={<UserPlus className="w-6 h-6" />} 
        loading={statsLoading}
      />
      <StatCard 
        title="Inactivos" 
        value={stats?.inactive_clients} 
        icon={<UserX className="w-6 h-6" />} 
        loading={statsLoading}
      />
    </div>
  );
};

export default ClientStats;
