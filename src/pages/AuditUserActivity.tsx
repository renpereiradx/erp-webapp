import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Fingerprint, Users, Activity, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import auditService from '@/services/bi/auditService';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';

/**
 * Actividad de un usuario (auditoría BI).
 * Migración full (VERIFICACION_POST_CIERRE 2026-09-21, deuda legacy):
 * tokens DESIGN + i18n `bi.audit.user.*` + iconos lucide + 3 estados
 * (PageHeader/GenericSkeletonList/ErrorState). Honestidad: fuera los
 * badges de crecimiento (+12%/+5%/-2%), el bloque "Tendencia Positiva
 * +15%", "Última actividad: hace poco", la IP hardcodeada, el punto de
 * "presencia" verde y los botones muertos (Exportar Reporte / Editar
 * Perfil / Ver todo) — sin dato real no hay UI.
 */

interface ActivityAction {
  id?: string | number;
  action?: string;
  description?: string;
  entity_id?: string | number | null;
  timestamp?: string;
  success?: boolean;
  category?: string;
  ip_address?: string | null;
}

interface UserActivity {
  username?: string;
  user_id?: string;
  summary?: {
    total_actions?: number;
    avg_actions_per_day?: number;
    unique_categories?: number;
    successful_actions?: number;
  };
  actions_by_category?: Array<{ category?: string; count?: number; percentage?: number }>;
  recent_actions?: ActivityAction[];
}

const AuditUserActivity = () => {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUserActivity = async () => {
    try {
      setLoading(true);
      const data = await auditService.getUserActivity(id || '');
      setActivity(data);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      setActivity(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg mt-lg space-y-lg" aria-busy="true" data-testid="user-activity-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
            ))}
          </div>
          <GenericSkeletonList count={5} data-testid="page-skeleton-list" />
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg mt-lg">
          <ErrorState
            title={t('bi.audit.user.loadError', 'No se encontraron datos de actividad', {})}
            message={t('bi.audit.user.loadErrorHint', 'El usuario no existe o no tiene actividad registrada.', {})}
            onRetry={fetchUserActivity}
          />
        </div>
      </div>
    );
  }

  const successRate = activity.summary?.total_actions
    ? ((activity.summary.successful_actions ?? 0) / activity.summary.total_actions) * 100
    : 0;

  const kpis = [
    {
      label: t('bi.audit.user.kpi.totalActions', 'Acciones Totales'),
      value: (activity.summary?.total_actions ?? 0).toLocaleString(),
      icon: <Activity size={18} className="text-primary" />,
    },
    {
      label: t('bi.audit.user.kpi.dailyAvg', 'Promedio Diario'),
      value: activity.summary?.avg_actions_per_day ?? 0,
      icon: <BarChart3 size={18} className="text-primary" />,
    },
    {
      label: t('bi.audit.user.kpi.uniqueCategories', 'Categorías Únicas'),
      value: activity.summary?.unique_categories ?? 0,
      icon: <Users size={18} className="text-primary" />,
    },
    {
      label: t('bi.audit.user.kpi.successRate', 'Tasa de Éxito'),
      value: `${successRate.toFixed(1)}%`,
      icon: <CheckCircle2 size={18} className="text-primary" />,
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      <PageHeader
        breadcrumb={t('bi.audit.user.breadcrumb', 'Auditoría de Usuarios', {})}
        title={activity.username || '—'}
        subtitle={`${t('bi.audit.user.userId', 'ID de usuario', {})}: ${activity.user_id ?? '—'}`}
      />

      {/* User Profile Header */}
      <section className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle flex items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center font-black text-2xl text-primary uppercase">
          {activity.username?.charAt(0) ?? '?'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{activity.username}</h1>
          <span className="flex items-center text-sm text-on-surface-deep mt-1">
            <Fingerprint size={16} className="mr-1" />
            {t('bi.audit.user.userId', 'ID de usuario', {})}: {activity.user_id}
          </span>
        </div>
      </section>

      {/* Summary KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-surface p-5 rounded-lg border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 bg-primary/10 rounded-lg">{kpi.icon}</span>
            </div>
            <p className="text-on-surface-deep text-sm font-medium uppercase tracking-tight">{kpi.label}</p>
            <h3 className="text-3xl font-black text-foreground mt-1">{kpi.value}</h3>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Card */}
        <section className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground tracking-tight">{t('bi.audit.user.byCategory', 'Acciones por Categoría')}</h2>
            <BarChart3 size={20} className="text-on-surface-deep" />
          </div>
          <div className="space-y-6">
            {(activity.actions_by_category ?? []).map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">{item.category}</span>
                  <span className="text-on-surface-deep">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-surface-muted rounded-full h-3 overflow-hidden shadow-inner">
                  <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {(!activity.actions_by_category || activity.actions_by_category.length === 0) && (
              <p className="py-6 text-center text-on-surface-deep text-sm italic">
                {t('bi.audit.user.emptyCategories', 'Sin categorías registradas en el período.')}
              </p>
            )}
          </div>
        </section>

        {/* Activity Timeline */}
        <section className="bg-surface rounded-xl p-6 shadow-sm border border-border-subtle">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground tracking-tight">{t('bi.audit.user.timeline', 'Línea de Tiempo de Actividad')}</h2>
          </div>
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-surface-muted">
            {(activity.recent_actions ?? []).map((action) => (
              <div key={action.id} className="relative flex items-center gap-6">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-surface z-10 shadow-sm ${
                  action.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {action.success ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </div>
                <div className="flex flex-col grow">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-foreground">{action.description} {action.entity_id ? `: #${action.entity_id}` : ''}</p>
                    <span className="text-[10px] font-black text-on-surface-deep uppercase">
                      {action.timestamp ? new Date(action.timestamp).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-deep mt-0.5 font-medium uppercase tracking-tight">
                    {t('bi.audit.user.module', 'Módulo', {})} {action.category ?? '—'} &middot; IP: {action.ip_address || '—'}
                  </p>
                </div>
              </div>
            ))}
            {(!activity.recent_actions || activity.recent_actions.length === 0) && (
              <p className="py-6 text-center text-on-surface-deep text-sm italic">
                {t('bi.audit.user.emptyTimeline', 'Sin actividad registrada en el período.')}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuditUserActivity;
