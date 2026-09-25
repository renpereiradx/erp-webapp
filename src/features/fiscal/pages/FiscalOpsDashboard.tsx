/**
 * FiscalOpsDashboard — dashboard de operación fiscal SIFEN (FE5.2, S7.2).
 * KPIs: pendientes de envío (ventana 72 h, MT §6.2), extemporáneos,
 * caducidad de timbrados; panel de alertas accionables (S7-H9-b), tabla de
 * rechazos por código (d_cod_res) y estado del ambiente (FE6/H9-audit S6).
 *
 * Consume GET /sifen/metrics/overview + GET /sifen/metrics/alerts +
 * GET /sifen/config/{TEST,PROD} (permiso sifen:read). El backend clasifica
 * contra su propio reloj; el FE solo renderiza (re-ordena las alertas por
 * severidad y resuelve el ambiente activo en domain/fiscal).
 */
import React from 'react';
import {
  AlertTriangle,
  BellRing,
  Clock,
  FileWarning,
  Hourglass,
  RefreshCw,
  Server,
  ShieldAlert,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { useI18n } from '@/lib/i18n';
import { useFiscalMetrics } from '@/features/fiscal/hooks/useFiscalMetrics';
import { fiscalDocTypeFromCode } from '@/domain/fiscal/states';
import { sortAlertsBySeverity } from '@/domain/fiscal/alerts';
import type { EnvironmentStatus } from '@/domain/fiscal/environment';
import type { FiscalAlert, FiscalAlertNivel, TimbradoVencimiento } from '@/features/fiscal/types';

// S6-H6: el locale sigue el idioma activo de la UI (es → es-PY, en → en-US).
const localeFromLang = (lang: string): string => (lang === 'en' ? 'en-US' : 'es-PY');

const formatDateTime = (iso: string, locale: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso || '-';
  return date.toLocaleString(locale);
};

const formatDate = (iso: string, locale: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso || '-';
  return date.toLocaleDateString(locale);
};

type KpiTone = 'info' | 'warning' | 'destructive' | 'neutral';

// §2.2/§2.3: semántica de tokens — nada de rojo/ámbar genéricos.
const KPI_TONE_TEXT: Record<KpiTone, string> = {
  destructive: 'text-error',
  warning: 'text-warning',
  info: 'text-primary',
  neutral: 'text-foreground',
};

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  tone?: KpiTone;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, hint, tone = 'neutral' }) => (
  <div className="flex flex-col gap-sm rounded-md bg-surface border border-border-subtle shadow-whisper p-lg">
    <div className="flex items-center justify-between">
      <span className="text-label-caps uppercase text-on-surface-deep">{label}</span>
      <span className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </span>
    </div>
    <div className="flex items-center gap-md">
      <span className={`text-4xl font-black font-mono ${KPI_TONE_TEXT[tone]}`}>{value}</span>
      {value > 0 && tone !== 'neutral' && (
        <Badge variant={tone === 'destructive' ? 'destructive' : tone === 'warning' ? 'warning' : 'info'}>
          {value}
        </Badge>
      )}
    </div>
    {hint && <p className="text-body-md text-on-surface-deep">{hint}</p>}
  </div>
);

// S7-H9-b: panel de alertas accionables. La severidad mapea a la variante del
// Badge (crit=destructive, warn=warning, info=info) y el orden lo decide el
// dominio (crit primero), no la respuesta HTTP.
const alertTone = (nivel: FiscalAlertNivel): 'destructive' | 'warning' | 'info' =>
  nivel === 'crit' ? 'destructive' : nivel === 'warn' ? 'warning' : 'info';

const AlertaRow: React.FC<{ item: FiscalAlert; t: ReturnType<typeof useI18n>['t'] }> = ({ item, t }) => (
  <div className="flex items-start gap-md py-sm border-t border-border-subtle first:border-t-0">
    <Badge variant={alertTone(item.nivel)} size="sm" className="mt-0.5 shrink-0">
      {t(`fiscal.ops.alerts.nivel.${item.nivel}`, item.nivel)}
    </Badge>
    <div className="min-w-0">
      <div className="text-label-caps uppercase text-on-surface-deep">
        {t(`fiscal.ops.alerts.tipo.${item.tipo}`, item.tipo)}
      </div>
      <div className="text-body-md text-foreground break-words">{item.mensaje}</div>
    </div>
  </div>
);

/**
 * FE6 (H9-audit S6): franja de estado del ambiente SIFEN — cierra la promesa
 * FE2.2 de lectura de estado (ambiente activo, emisión habilitada, CSC y
 * certificado cargados) sin exponer secretos (el endpoint público solo trae
 * flags). La resolución del ambiente que rige es dominio puro.
 */
const EnvironmentStrip: React.FC<{ environment: EnvironmentStatus | undefined; t: ReturnType<typeof useI18n>['t'] }> = ({ environment, t }) => {
  let body: React.ReactNode;
  if (!environment) {
    // Error de la query de ambiente (las métricas pueden seguir OK): degrada solo esta franja.
    body = <span className="text-body-md text-on-surface-deep">{t('fiscal.ops.env.unavailable', 'Estado del ambiente no disponible')}</span>;
  } else if (environment.health === 'unconfigured') {
    body = (
      <>
        <Badge variant="outline" size="sm">{t('fiscal.ops.env.unconfiguredBadge', 'Sin configurar')}</Badge>
        <span className="text-body-md text-on-surface-deep">
          {t('fiscal.ops.env.unconfigured', 'Ningún ambiente configurado — la emisión SIFEN está deshabilitada')}
        </span>
      </>
    );
  } else if (environment.health === 'inactive') {
    body = (
      <>
        <Badge variant="secondary" size="sm">
          {t(`fiscal.ops.env.ambiente.${environment.active?.ambiente ?? ''}`, environment.active?.ambiente ?? '?')}
        </Badge>
        <span className="text-body-md text-on-surface-deep">
          {t('fiscal.ops.env.inactive', 'Configurado pero inactivo — emisión SIFEN apagada')}
        </span>
      </>
    );
  } else {
    const { active, health } = environment;
    body = (
      <>
        <Badge variant={active?.ambiente === 'PROD' ? 'warning' : 'info'} size="sm">
          {t(`fiscal.ops.env.ambiente.${active?.ambiente ?? ''}`, active?.ambiente ?? '?')}
        </Badge>
        <Badge variant="success" size="sm">{t('fiscal.ops.env.emissionOn', 'Emisión SIFEN activa')}</Badge>
        {health === 'ok' ? (
          <Badge variant="success" size="sm">{t('fiscal.ops.env.ready', 'CSC y certificado listos')}</Badge>
        ) : (
          <>
            {!active?.csc_set && <Badge variant="warning" size="sm">{t('fiscal.ops.env.cscMissing', 'CSC sin configurar')}</Badge>}
            {!active?.has_cert && <Badge variant="warning" size="sm">{t('fiscal.ops.env.certMissing', 'Sin certificado cargado')}</Badge>}
          </>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-sm md:gap-md rounded-md bg-surface border border-border-subtle shadow-whisper p-md animate-in fade-in">
      <div className="flex items-center gap-sm shrink-0">
        <Server className="size-4 text-primary" aria-hidden="true" />
        <span className="text-label-caps uppercase text-foreground">
          {t('fiscal.ops.env.title', 'Ambiente SIFEN')}
        </span>
      </div>
      <div className="flex items-center gap-sm flex-wrap md:ml-auto">{body}</div>
    </div>
  );
};

// El backend solo lista los timbrados por vencer (0–30 días): dias_restantes
// es siempre ≥ 0 aquí (S6-H8) — los vencidos viven en el KPI timbrados_vencidos.
const TimbradoRow: React.FC<{ item: TimbradoVencimiento; locale: string }> = ({ item, locale }) => {
  const { t } = useI18n();
  const docType = fiscalDocTypeFromCode(item.document_type === 'FACTURA' ? 1 : item.document_type === 'NCE' ? 5 : 6);

  return (
    <div className="flex items-center justify-between gap-md py-md border-t border-border-subtle first:border-t-0">
      <div className="min-w-0">
        <div className="text-body-md-bold text-foreground truncate">{item.branch_name}</div>
        <div className="text-body-md text-on-surface-deep">
          {docType ? t(docType.i18nKey, docType.docType) : item.document_type} · {t('fiscal.ops.timbrados.timbrado', 'Timbrado')}{' '}
          <span className="text-data-mono font-data-mono">{item.timbrado}</span> · {t('fiscal.ops.timbrados.validTo', 'Vence')}{' '}
          <span className="text-data-mono font-data-mono">{formatDate(item.valid_to, locale)}</span>
        </div>
      </div>
      <Badge variant="warning" size="sm" className="shrink-0">
        {t('fiscal.ops.timbrados.daysLeft', '{days} día(s)', { days: String(item.dias_restantes) })}
      </Badge>
    </div>
  );
};

const FiscalOpsDashboard: React.FC = () => {
  const { t, lang } = useI18n();
  const locale = localeFromLang(lang);
  const { data, alerts, environment, loading, isFetching, error, refresh } = useFiscalMetrics(30);

  const hasRechazos = (data?.rechazos_por_codigo?.length ?? 0) > 0;
  const hasTimbrados = (data?.timbrados_por_vencer?.length ?? 0) > 0;
  const alertasOrdenadas = alerts ? sortAlertsBySeverity(alerts.alertas ?? []) : [];
  const errorMessage = error instanceof Error ? error.message : undefined;

  if (loading && !data) {
    // §6.7: skeleton que imita la forma final (franja + KPIs + 2 paneles).
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg" aria-busy="true" data-testid="fiscal-ops-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse" />
          <div className="h-14 bg-surface-muted rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-surface-muted rounded-md animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
            <div className="h-64 bg-surface-muted rounded-md animate-pulse" />
            <div className="h-64 bg-surface-muted rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg">
        <PageHeader
          breadcrumb={t('nav.sifenFiscalGroup', 'Fiscal (SIFEN)')}
          title={t('fiscal.ops.title', 'Dashboard de ops fiscal')}
          subtitle={t('fiscal.ops.subtitle', 'Rechazos, ventana de envío (72 h) y caducidad de timbrados')}
          actions={
            <div className="flex items-center gap-md">
              {data?.generado_en && (
                <span className="text-data-mono font-data-mono text-on-surface-deep">
                  {t('fiscal.ops.generatedAt', 'Generado: {time}', { time: formatDateTime(data.generado_en, locale) })}
                </span>
              )}
              <Button variant="secondary" onClick={refresh} disabled={isFetching}>
                <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                {t('fiscal.ops.refresh', 'Actualizar')}
              </Button>
            </div>
          }
        />

        {!!error && !data && (
          <section>
            <ErrorState
              title={t('fiscal.ops.error.title', 'No se pudieron cargar las métricas fiscales.')}
              message={errorMessage}
              onRetry={refresh}
            />
          </section>
        )}

        {!error && (
          <>
            {/* Estado del ambiente (FE6/H9-audit S6): contexto previo a todo KPI */}
            <EnvironmentStrip environment={environment} t={t} />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
              <KpiCard
                icon={<Clock className="size-5" aria-hidden="true" />}
                label={t('fiscal.ops.kpi.pending', 'Pendientes de envío')}
                value={data?.pendientes_envio ?? 0}
                hint={t('fiscal.ops.kpi.pendingHint', 'Ventana de {hours} h (MT §6.2)', { hours: String(data?.ventana_horas ?? 72) })}
                tone="info"
              />
              <KpiCard
                icon={<Hourglass className="size-5" aria-hidden="true" />}
                label={t('fiscal.ops.kpi.extemporaneous', 'Extemporáneos')}
                value={data?.extemporaneos ?? 0}
                hint={t('fiscal.ops.kpi.extemporaneousHint', 'Fuera de ventana / aprobados con observación')}
                tone={(data?.extemporaneos ?? 0) > 0 ? 'destructive' : 'neutral'}
              />
              <KpiCard
                icon={<AlertTriangle className="size-5" aria-hidden="true" />}
                label={t('fiscal.ops.kpi.expiring', 'Timbrados por vencer')}
                value={data?.timbrados_por_vencer?.length ?? 0}
                hint={t('fiscal.ops.kpi.expiringHint', 'Vencen en ≤ 30 días')}
                tone={(data?.timbrados_por_vencer?.length ?? 0) > 0 ? 'warning' : 'neutral'}
              />
              <KpiCard
                icon={<ShieldAlert className="size-5" aria-hidden="true" />}
                label={t('fiscal.ops.kpi.expired', 'Timbrados vencidos')}
                value={data?.timbrados_vencidos ?? 0}
                hint={t('fiscal.ops.kpi.expiredHint', 'Vigencia finalizada sin renovar')}
                tone={(data?.timbrados_vencidos ?? 0) > 0 ? 'destructive' : 'neutral'}
              />
            </div>

            {/* Alertas de operación (S7-H9-b): lo primero que ops debe ver */}
            {alertasOrdenadas.length > 0 && (
              <div className="rounded-md bg-surface border border-border-subtle shadow-whisper animate-in fade-in">
                <div className="p-lg pb-md space-y-xs">
                  <div className="flex items-center gap-sm">
                    <BellRing className="size-4 text-primary" aria-hidden="true" />
                    <h2 className="text-title-md text-foreground">{t('fiscal.ops.alerts.title', 'Alertas de operación')}</h2>
                    <Badge variant={alertTone(alerts?.nivel_max ?? 'info')} size="sm">
                      {t('fiscal.ops.alerts.count', '{count} activa(s)', { count: String(alerts?.total ?? alertasOrdenadas.length) })}
                    </Badge>
                  </div>
                  <p className="text-body-md text-on-surface-deep">
                    {t('fiscal.ops.alerts.subtitle', 'Ordenadas por severidad (crit → warn → info)')}
                  </p>
                </div>
                <div className="px-lg pb-md">
                  {alertasOrdenadas.slice(0, 10).map((a, i) => (
                    <AlertaRow key={`${a.tipo}-${a.cdc ?? a.timbrado ?? i}-${i}`} item={a} t={t} />
                  ))}
                  {alertasOrdenadas.length > 10 && (
                    <p className="pt-sm text-body-md text-on-surface-deep">
                      {t('fiscal.ops.alerts.more', '+ {count} alerta(s) más', { count: String(alertasOrdenadas.length - 10) })}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
              {/* Rechazos por código */}
              <div className="rounded-md bg-surface border border-border-subtle shadow-whisper overflow-hidden">
                <div className="p-lg pb-md space-y-xs">
                  <div className="flex items-center gap-sm">
                    <FileWarning className="size-4 text-primary" aria-hidden="true" />
                    <h2 className="text-title-md text-foreground">{t('fiscal.ops.rechazos.title', 'Rechazos por código')}</h2>
                  </div>
                  <p className="text-body-md text-on-surface-deep">
                    {t('fiscal.ops.rechazos.subtitle', 'Últimos {days} días', { days: '30' })}
                  </p>
                </div>
                {!hasRechazos ? (
                  <EmptyState
                    size="small"
                    icon={FileWarning}
                    title={t('fiscal.ops.rechazos.empty', 'Sin rechazos en el período')}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                        <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('fiscal.ops.rechazos.col.codigo', 'Código')}</TableHead>
                        <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('fiscal.ops.rechazos.col.mensaje', 'Mensaje')}</TableHead>
                        <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">{t('fiscal.ops.rechazos.col.cantidad', 'Cantidad')}</TableHead>
                        <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">{t('fiscal.ops.rechazos.col.ultima', 'Última ocurrencia')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.rechazos_por_codigo.map(r => (
                        <TableRow key={r.codigo} className="hover:bg-surface-muted transition-colors duration-150">
                          <TableCell>
                            <Badge variant="destructive" size="sm" className="text-data-mono font-data-mono">{r.codigo}</Badge>
                          </TableCell>
                          <TableCell className="text-body-md text-on-surface-deep">{r.mensaje || '—'}</TableCell>
                          <TableCell className="text-data-mono font-data-mono text-right">{r.cantidad}</TableCell>
                          <TableCell className="text-data-mono font-data-mono text-right whitespace-nowrap text-on-surface-deep">
                            {formatDateTime(r.ultima_ocurrencia, locale)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Timbrados por vencer / vencidos */}
              <div className="rounded-md bg-surface border border-border-subtle shadow-whisper overflow-hidden">
                <div className="p-lg pb-md space-y-xs">
                  <div className="flex items-center gap-sm">
                    <AlertTriangle className="size-4 text-primary" aria-hidden="true" />
                    <h2 className="text-title-md text-foreground">{t('fiscal.ops.timbrados.title', 'Caducidad de timbrados')}</h2>
                  </div>
                  <p className="text-body-md text-on-surface-deep">
                    {t('fiscal.ops.timbrados.subtitle', 'Configs fiscales activas con fin de vigencia')}
                  </p>
                </div>
                <div className="px-lg pb-lg">
                  {/* S6-H8: el vacío se decide por la lista — con vencidos > 0 y
                      lista vacía se explica en vez de renderizar un div mudo. */}
                  {!hasTimbrados ? (
                    <EmptyState
                      size="small"
                      icon={AlertTriangle}
                      title={
                        (data?.timbrados_vencidos ?? 0) > 0
                          ? t('fiscal.ops.timbrados.onlyExpired', 'Sin timbrados por vencer — {count} vencido(s) (ver KPI)', { count: String(data?.timbrados_vencidos ?? 0) })
                          : t('fiscal.ops.timbrados.empty', 'Sin timbrados próximos a vencer ni vencidos')
                      }
                    />
                  ) : (
                    <div>
                      {data?.timbrados_por_vencer?.map(tb => (
                        <TimbradoRow key={`${tb.branch_id}-${tb.timbrado}`} item={tb} locale={locale} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FiscalOpsDashboard;
