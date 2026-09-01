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
  Activity,
  AlertTriangle,
  BellRing,
  Clock,
  FileWarning,
  Hourglass,
  Loader2,
  RefreshCw,
  Server,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useFiscalMetrics } from '@/features/fiscal/hooks/useFiscalMetrics';
import { fiscalDocTypeFromCode } from '@/domain/fiscal/states';
import { sortAlertsBySeverity } from '@/domain/fiscal/alerts';
import type { EnvironmentStatus } from '@/domain/fiscal/environment';
import type { FiscalAlert, FiscalAlertNivel, RechazoPorCodigo, TimbradoVencimiento } from '@/features/fiscal/types';

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

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  tone?: 'info' | 'warning' | 'destructive' | 'neutral';
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, hint, tone = 'neutral' }) => {
  const valueClass =
    tone === 'destructive'
      ? 'text-red-600 dark:text-red-400'
      : tone === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : tone === 'info'
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-text-main';

  return (
    <Card className="rounded-xl border-border-subtle shadow-fluent-2">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </span>
          {value > 0 && tone !== 'neutral' && (
            <Badge variant={tone === 'destructive' ? 'destructive' : tone === 'warning' ? 'warning' : 'info'}>
              {value}
            </Badge>
          )}
        </div>
        <div className={`text-3xl font-black mt-3 ${valueClass}`}>{value}</div>
        <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mt-1">{label}</div>
        {hint && <div className="text-xs text-text-secondary/70 mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
};

const RechazoRow: React.FC<{ item: RechazoPorCodigo; locale: string }> = ({ item, locale }) => (
  <tr className="border-t border-border-subtle hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
    <td className="px-4 py-3">
      <Badge variant="destructive" size="sm">{item.codigo}</Badge>
    </td>
    <td className="px-4 py-3 text-sm text-text-secondary">{item.mensaje || '—'}</td>
    <td className="px-4 py-3 text-sm font-bold text-right">{item.cantidad}</td>
    <td className="px-4 py-3 text-xs text-text-secondary text-right whitespace-nowrap">
      {formatDateTime(item.ultima_ocurrencia, locale)}
    </td>
  </tr>
);

// S7-H9-b: panel de alertas accionables. La severidad mapea a la variante del
// Badge (crit=destructive, warn=warning, info=info) y el orden lo decide el
// dominio (crit primero), no la respuesta HTTP.
const alertTone = (nivel: FiscalAlertNivel): 'destructive' | 'warning' | 'info' =>
  nivel === 'crit' ? 'destructive' : nivel === 'warn' ? 'warning' : 'info';

const AlertaRow: React.FC<{ item: FiscalAlert; t: ReturnType<typeof useI18n>['t'] }> = ({ item, t }) => (
  <div className="flex items-start gap-3 py-2.5 border-t border-border-subtle first:border-t-0">
    <Badge variant={alertTone(item.nivel)} size="sm" className="mt-0.5 shrink-0">
      {t(`fiscal.ops.alerts.nivel.${item.nivel}`, item.nivel)}
    </Badge>
    <div className="min-w-0">
      <div className="text-xs font-bold uppercase tracking-wide text-text-secondary">
        {t(`fiscal.ops.alerts.tipo.${item.tipo}`, item.tipo)}
      </div>
      <div className="text-sm text-text-main break-words">{item.mensaje}</div>
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
    body = <span className="text-sm text-text-secondary">{t('fiscal.ops.env.unavailable', 'Estado del ambiente no disponible')}</span>;
  } else if (environment.health === 'unconfigured') {
    body = (
      <>
        <Badge variant="outline" size="sm">{t('fiscal.ops.env.unconfiguredBadge', 'Sin configurar')}</Badge>
        <span className="text-sm text-text-secondary">
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
        <span className="text-sm text-text-secondary">
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
    <Card className="rounded-xl border-border-subtle shadow-fluent-2 animate-in fade-in">
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-2.5 md:gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Server size={16} className="text-primary" />
          <span className="text-sm font-black uppercase tracking-wide text-text-main">
            {t('fiscal.ops.env.title', 'Ambiente SIFEN')}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap md:ml-auto">{body}</div>
      </CardContent>
    </Card>
  );
};

// El backend solo lista los timbrados por vencer (0–30 días): dias_restantes
// es siempre ≥ 0 aquí (S6-H8) — los vencidos viven en el KPI timbrados_vencidos.
const TimbradoRow: React.FC<{ item: TimbradoVencimiento; locale: string }> = ({ item, locale }) => {
  const { t } = useI18n();
  const docType = fiscalDocTypeFromCode(item.document_type === 'FACTURA' ? 1 : item.document_type === 'NCE' ? 5 : 6);

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-t border-border-subtle first:border-t-0">
      <div className="min-w-0">
        <div className="text-sm font-bold text-text-main truncate">{item.branch_name}</div>
        <div className="text-xs text-text-secondary">
          {docType ? t(docType.i18nKey, docType.docType) : item.document_type} · {t('fiscal.ops.timbrados.timbrado', 'Timbrado')}{' '}
          {item.timbrado} · {t('fiscal.ops.timbrados.validTo', 'Vence')} {formatDate(item.valid_to, locale)}
        </div>
      </div>
      <Badge variant="warning" size="sm">
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-text-main flex items-center gap-3">
            <span className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Activity size={20} />
            </span>
            {t('fiscal.ops.title', 'Dashboard de ops fiscal')}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {t('fiscal.ops.subtitle', 'Rechazos, ventana de envío (72 h) y caducidad de timbrados')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching}>
            <RefreshCw size={14} className={`mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            {t('fiscal.ops.refresh', 'Actualizar')}
          </Button>
          {data?.generado_en && (
            <span className="text-xs text-text-secondary">
              {t('fiscal.ops.generatedAt', 'Generado: {time}', { time: formatDateTime(data.generado_en, locale) })}
            </span>
          )}
        </div>
      </div>

      {!!error && !data && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 p-4 flex items-center justify-between gap-4">
          <p className="text-sm">{t('fiscal.ops.error.title', 'No se pudieron cargar las métricas fiscales.')}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            {t('fiscal.ops.error.retry', 'Reintentar')}
          </Button>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center min-h-[300px] text-text-secondary">
          <Loader2 className="animate-spin mr-2" size={18} />
          <span className="text-sm font-medium">{t('fiscal.ops.loading', 'Cargando métricas...')}</span>
        </div>
      ) : (
        <>
          {/* Estado del ambiente (FE6/H9-audit S6): contexto previo a todo KPI */}
          <EnvironmentStrip environment={environment} t={t} />

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              icon={<Clock size={20} />}
              label={t('fiscal.ops.kpi.pending', 'Pendientes de envío')}
              value={data?.pendientes_envio ?? 0}
              hint={t('fiscal.ops.kpi.pendingHint', 'Ventana de {hours} h (MT §6.2)', { hours: String(data?.ventana_horas ?? 72) })}
              tone="info"
            />
            <KpiCard
              icon={<Hourglass size={20} />}
              label={t('fiscal.ops.kpi.extemporaneous', 'Extemporáneos')}
              value={data?.extemporaneos ?? 0}
              hint={t('fiscal.ops.kpi.extemporaneousHint', 'Fuera de ventana / aprobados con observación')}
              tone={(data?.extemporaneos ?? 0) > 0 ? 'destructive' : 'neutral'}
            />
            <KpiCard
              icon={<AlertTriangle size={20} />}
              label={t('fiscal.ops.kpi.expiring', 'Timbrados por vencer')}
              value={data?.timbrados_por_vencer?.length ?? 0}
              hint={t('fiscal.ops.kpi.expiringHint', 'Vencen en ≤ 30 días')}
              tone={(data?.timbrados_por_vencer?.length ?? 0) > 0 ? 'warning' : 'neutral'}
            />
            <KpiCard
              icon={<ShieldAlert size={20} />}
              label={t('fiscal.ops.kpi.expired', 'Timbrados vencidos')}
              value={data?.timbrados_vencidos ?? 0}
              hint={t('fiscal.ops.kpi.expiredHint', 'Vigencia finalizada sin renovar')}
              tone={(data?.timbrados_vencidos ?? 0) > 0 ? 'destructive' : 'neutral'}
            />
          </div>

          {/* Alertas de operación (S7-H9-b): lo primero que ops debe ver */}
          {alertasOrdenadas.length > 0 && (
            <Card className="rounded-xl border-border-subtle shadow-fluent-2 animate-in fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-wide text-text-main flex items-center gap-2">
                  <BellRing size={16} className="text-primary" />
                  {t('fiscal.ops.alerts.title', 'Alertas de operación')}
                  <Badge variant={alertTone(alerts?.nivel_max ?? 'info')} size="sm">
                    {t('fiscal.ops.alerts.count', '{count} activa(s)', { count: String(alerts?.total ?? alertasOrdenadas.length) })}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-text-secondary">
                  {t('fiscal.ops.alerts.subtitle', 'Ordenadas por severidad (crit → warn → info)')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 px-5 pb-3">
                {alertasOrdenadas.slice(0, 10).map((a, i) => (
                  <AlertaRow key={`${a.tipo}-${a.cdc ?? a.timbrado ?? i}-${i}`} item={a} t={t} />
                ))}
                {alertasOrdenadas.length > 10 && (
                  <p className="pt-2 text-xs text-text-secondary">
                    {t('fiscal.ops.alerts.more', '+ {count} alerta(s) más', { count: String(alertasOrdenadas.length - 10) })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Rechazos por código */}
            <Card className="rounded-xl border-border-subtle shadow-fluent-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-wide text-text-main flex items-center gap-2">
                  <FileWarning size={16} className="text-primary" />
                  {t('fiscal.ops.rechazos.title', 'Rechazos por código')}
                </CardTitle>
                <CardDescription className="text-xs text-text-secondary">
                  {t('fiscal.ops.rechazos.subtitle', 'Últimos {days} días', { days: '30' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!hasRechazos ? (
                  <p className="px-5 py-8 text-sm text-text-secondary text-center">
                    {t('fiscal.ops.rechazos.empty', 'Sin rechazos en el período')}
                  </p>
                ) : (
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-border-subtle">
                        <th scope="col" className="px-4 py-2">{t('fiscal.ops.rechazos.col.codigo', 'Código')}</th>
                        <th scope="col" className="px-4 py-2">{t('fiscal.ops.rechazos.col.mensaje', 'Mensaje')}</th>
                        <th scope="col" className="px-4 py-2 text-right">{t('fiscal.ops.rechazos.col.cantidad', 'Cantidad')}</th>
                        <th scope="col" className="px-4 py-2 text-right">{t('fiscal.ops.rechazos.col.ultima', 'Última ocurrencia')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.rechazos_por_codigo.map(r => (
                        <RechazoRow key={r.codigo} item={r} locale={locale} />
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Timbrados por vencer / vencidos */}
            <Card className="rounded-xl border-border-subtle shadow-fluent-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-wide text-text-main flex items-center gap-2">
                  <AlertTriangle size={16} className="text-primary" />
                  {t('fiscal.ops.timbrados.title', 'Caducidad de timbrados')}
                </CardTitle>
                <CardDescription className="text-xs text-text-secondary">
                  {t('fiscal.ops.timbrados.subtitle', 'Configs fiscales activas con fin de vigencia')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 px-5 pb-4">
                {/* S6-H8: el vacío se decide por la lista — con vencidos > 0 y
                    lista vacía se explica en vez de renderizar un div mudo. */}
                {!hasTimbrados ? (
                  <p className="py-8 text-sm text-text-secondary text-center">
                    {(data?.timbrados_vencidos ?? 0) > 0
                      ? t('fiscal.ops.timbrados.onlyExpired', 'Sin timbrados por vencer — {count} vencido(s) (ver KPI)', { count: String(data?.timbrados_vencidos ?? 0) })
                      : t('fiscal.ops.timbrados.empty', 'Sin timbrados próximos a vencer ni vencidos')}
                  </p>
                ) : (
                  <div>
                    {data?.timbrados_por_vencer?.map(tb => (
                      <TimbradoRow key={`${tb.branch_id}-${tb.timbrado}`} item={tb} locale={locale} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default FiscalOpsDashboard;
