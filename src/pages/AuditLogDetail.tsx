import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import auditService from '@/services/bi/auditService';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';

/**
 * Detalle de evento de auditoría.
 * Migración FASE 6: .tsx + hook de feature inline + PageHeader + 3 estados.
 * Datos fake del legacy eliminados: método 'POST' y endpoint
 * '/api/v1/sales' hardcodeados y correlation-id 'f9a2-55d1-42e8-b80c'
 * inventado — ahora solo se muestran si el log real los trae. Locale
 * es-ES -> es-PY.
 */

interface AuditLogDetailData {
  id?: string | number
  level?: string
  timestamp?: string
  ip_address?: string | null
  duration_ms?: number | null
  method?: string | null
  endpoint?: string | null
  correlation_id?: string | null
  user_name?: string | null
  action?: string | null
  description?: string | null
  [key: string]: unknown
}

export default function AuditLogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [log, setLog] = useState<AuditLogDetailData | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (await auditService.getLogById(id as string)) as AuditLogDetailData;
      setLog(data);
    } catch (err) {
      console.error('Error fetching log details:', err);
      setError((err as Error)?.message || t('bi.audit.detail.loadError', 'No se pudo cargar el detalle del evento.', {}));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchLogDetail();
  }, [fetchLogDetail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg" aria-busy="true" data-testid="audit-detail-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-56 bg-surface-muted rounded-md animate-pulse" />
            ))}
          </div>
          <GenericSkeletonList count={5} data-testid="page-skeleton-list" />
        </div>
      </div>
    );
  }

  if (error && !log) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg mt-lg">
          <ErrorState title={t('bi.audit.detail.errorTitle', 'Error al cargar el detalle', {})} message={error} onRetry={fetchLogDetail} />
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg mt-lg">
          <EmptyState
            icon={FileText}
            title={t('bi.audit.detail.notFound', 'Log no encontrado.', {})}
            actionLabel={t('bi.audit.detail.backToLogs', 'Volver a la auditoría', {})}
            onAction={() => navigate('/auditoria/logs')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.audit.breadcrumb', 'Auditoría', {})}
          title={`${t('bi.audit.detail.title', 'Detalle de Evento', {})} #${log.id}`}
          actions={
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
              {t('common.back', 'Volver', {})}
            </button>
          }
        />

        <div className="flex items-center gap-sm mt-lg">
          <span
            className={`px-sm py-xs rounded-full text-body-sm-bold border ${
              log.level === 'INFO' ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'
            }`}
          >
            {log.level}
          </span>
        </div>

        {/* Metadata Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-lg">
          {/* Technical Card */}
          <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper flex flex-col gap-md">
            <div className="flex items-center gap-xs text-foreground font-bold border-b border-border-subtle pb-sm uppercase tracking-tight text-body-sm-bold">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">terminal</span>
              <h3>{t('bi.audit.detail.technical', 'Información Técnica', {})}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-sm gap-x-md font-data-mono text-data-mono text-body-md">
              <div className="flex flex-col gap-xs">
                <span className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.audit.detail.timestamp', 'Fecha y Hora', {})}
                </span>
                <div className="flex items-center gap-xs text-foreground font-bold">
                  <span className="material-symbols-outlined text-body-md text-on-surface-deep" aria-hidden="true">calendar_today</span>
                  <span>{new Date(log.timestamp ?? '').toLocaleString('es-PY')}</span>
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.audit.detail.ip', 'Dirección IP', {})}
                </span>
                <div className="flex items-center gap-xs text-foreground font-bold">
                  <span className="material-symbols-outlined text-body-md text-on-surface-deep" aria-hidden="true">lan</span>
                  <span>{log.ip_address || 'N/A'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.audit.detail.duration', 'Duración', {})}
                </span>
                <div className="flex items-center gap-xs text-foreground font-bold">
                  <span className="material-symbols-outlined text-body-md text-on-surface-deep" aria-hidden="true">timer</span>
                  <span>{log.duration_ms ?? 0}ms</span>
                </div>
              </div>
              {log.method && log.endpoint && (
                <div className="flex flex-col gap-xs">
                  <span className="text-label-caps uppercase text-on-surface-deep">
                    {t('bi.audit.detail.http', 'Solicitud HTTP', {})}
                  </span>
                  <div className="flex items-center gap-xs text-foreground font-bold">
                    <span className="px-xs py-0.5 rounded-xs bg-primary/10 text-primary font-data-mono text-data-mono uppercase">
                      {log.method}
                    </span>
                    <span>{log.endpoint}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Context Card */}
          <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper flex flex-col gap-md">
            <div className="flex items-center gap-xs text-foreground font-bold border-b border-border-subtle pb-sm uppercase tracking-tight text-body-sm-bold">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">person</span>
              <h3>{t('bi.audit.detail.context', 'Contexto', {})}</h3>
            </div>
            <div className="grid grid-cols-1 gap-y-sm gap-x-md text-body-md">
              <div className="flex flex-col gap-xs">
                <span className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.audit.detail.user', 'Usuario', {})}
                </span>
                <span className="text-foreground font-bold">{log.user_name || 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.audit.detail.action', 'Acción', {})}
                </span>
                <span className="text-foreground font-bold">{log.action || log.description || 'N/A'}</span>
              </div>
              {log.correlation_id && (
                <div className="flex flex-col gap-xs">
                  <span className="text-label-caps uppercase text-on-surface-deep">
                    {t('bi.audit.detail.correlation', 'ID Correlación', {})}
                  </span>
                  <span className="text-foreground font-bold font-data-mono text-data-mono">{log.correlation_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
