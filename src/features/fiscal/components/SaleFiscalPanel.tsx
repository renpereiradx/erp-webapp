/**
 * SaleFiscalPanel — panel fiscal SIFEN del detalle de venta (FE3).
 * Complementa SalesOrderDetail: estado del DE, CDC, timbrado, QR del KuDE
 * (renderizado desde la URL que arma el backend — el FE nunca calcula el
 * hash, regla 4) y acciones (reenviar / reimprimir / email).
 */
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Mail, Printer, Download, RefreshCw, Receipt, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataState from '@/components/ui/DataState';
import { useI18n } from '@/lib/i18n';
import { useSaleFiscalPanel } from '@/features/fiscal/hooks/useSaleFiscalPanel';
import { fiscalStateMeta, fiscalDocTypeFromCode } from '@/domain/fiscal/states';
import { formatCDC } from '@/domain/fiscal/cdc';
import { formatInvoiceNumber } from '@/domain/fiscal/validity';
import { fiscalService } from '@/features/fiscal/services/fiscalService';

interface SaleFiscalPanelProps {
  saleId: string;
}

const Field = ({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-1">{label}</p>
    <p className={`text-sm font-semibold text-text-main break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
  </div>
);

const SaleFiscalPanel: React.FC<SaleFiscalPanelProps> = ({ saleId }) => {
  const { t } = useI18n();
  const {
    status, isLoading, isNotFiscal, error,
    retrying, emailing, reprinting, reprintCount,
    retry, emailComprobante, reprintTicket,
  } = useSaleFiscalPanel(saleId);

  if (isLoading) {
    return (
      <Card className="rounded-xl border-border-subtle shadow-fluent-2">
        <CardContent className="p-10 flex justify-center"><DataState variant="loading" /></CardContent>
      </Card>
    );
  }

  if (isNotFiscal) {
    return (
      <Card className="rounded-xl border-border-subtle shadow-fluent-2">
        <CardContent className="p-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><Receipt size={20} /></div>
            <div>
              <p className="font-black uppercase tracking-tight text-sm text-text-main">{t('fiscal.panel.notFiscal.title', 'Venta sin documento fiscal')}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{t('fiscal.panel.notFiscal.subtitle', 'La sucursal no tiene emisión SIFEN activada (D3)')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card className="rounded-xl border-border-subtle shadow-fluent-2">
        <CardContent className="p-10"><DataState variant="error" title={t('fiscal.panel.error', 'No se pudo cargar el estado fiscal')} onRetry={retry} /></CardContent>
      </Card>
    );
  }

  const stateMeta = fiscalStateMeta(status.estado);
  const docType = fiscalDocTypeFromCode(status.doc_type);
  const isRetryable = status.estado === 'EMITIDO' || status.estado === 'RECHAZADO';

  return (
    <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-border-subtle p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Receipt size={20} /></div>
            <div>
              <CardTitle className="text-base font-black tracking-tight uppercase flex items-center gap-2">
                {t('fiscal.panel.title', 'Facturación Electrónica SIFEN')}
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                {docType ? t(docType.i18nKey) : `DE ${status.doc_type}`} · {status.establecimiento}-{status.punto_expedicion}-{status.serie}-{formatInvoiceNumber(status.numero_doc)}
              </CardDescription>
            </div>
          </div>
          <Badge variant={stateMeta.badgeVariant} dot>
            {t(stateMeta.i18nKey)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Datos del DE */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div className="col-span-2 md:col-span-3">
            <Field label={t('fiscal.panel.cdc', 'CDC')} value={formatCDC(status.cdc)} mono />
          </div>
          <Field label={t('fiscal.branch.timbrado', 'Número de Timbrado')} value={status.timbrado_num} mono />
          <Field label={t('fiscal.panel.protocol', 'Protocolo')} value={status.protocolo} mono />
          <Field label={t('fiscal.panel.attempts', 'Intentos de envío')} value={String(status.intentos)} />
          <Field label={t('fiscal.panel.signedAt', 'Fecha de firma')} value={status.fecha_firma ? new Date(status.fecha_firma).toLocaleString() : ''} />
          <Field label={t('fiscal.panel.processedAt', 'Fecha de proceso')} value={status.fecha_proceso ? new Date(status.fecha_proceso).toLocaleString() : ''} />
        </div>

        {/* Respuesta de SIFEN (rechazo / observación) */}
        {(status.codigo_respuesta || status.mensaje || status.last_error) && (
          <div className={`rounded-xl border p-4 space-y-2 ${status.estado === 'RECHAZADO' ? 'bg-error/5 border-error/20' : 'bg-amber-50/50 border-amber-200/60'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
              {t('fiscal.panel.sifenResponse', 'Respuesta de SIFEN')}
              {status.codigo_respuesta && <span className="ml-2 font-mono text-error">{status.codigo_respuesta}</span>}
            </p>
            {status.mensaje && <p className="text-sm text-text-main font-medium">{status.mensaje}</p>}
            {status.last_error && <p className="text-xs text-text-secondary font-mono break-all">{status.last_error}</p>}
          </div>
        )}

        {/* QR + acciones */}
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex items-center gap-4">
            {status.qr_url ? (
              <div className="border border-border-subtle rounded-xl p-3 bg-white shadow-sm">
                <QRCodeSVG value={status.qr_url} size={112} level="M" />
              </div>
            ) : (
              <div className="size-[112px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 bg-slate-50/50">
                <QrCode size={28} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{t('fiscal.panel.qrPending', 'QR al firmar el DE')}</span>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{t('fiscal.panel.qrTitle', 'Comprobante electrónico')}</p>
              <p className="text-xs text-text-secondary max-w-[220px]">{t('fiscal.panel.qrHint', 'Verificable en el portal e-Kuatia del SIFEN')}</p>
              {reprintCount !== null && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('fiscal.panel.reprints', '{count} reimpresión(es)', { count: String(reprintCount) })}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-bold gap-1.5"
              onClick={() => { window.open(fiscalService.comprobanteUrl(saleId), '_blank', 'noopener'); }}
            >
              <Download size={14} /> {t('fiscal.panel.downloadPdf', 'KuDE PDF')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-bold gap-1.5"
              onClick={reprintTicket}
              disabled={reprinting}
            >
              {reprinting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
              {t('fiscal.panel.reprint', 'Reimprimir ticket')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-bold gap-1.5"
              onClick={emailComprobante}
              disabled={emailing}
            >
              {emailing ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              {t('fiscal.panel.email', 'Enviar por email')}
            </Button>
            {isRetryable && (
              <Button
                size="sm"
                className="h-9 text-xs font-bold gap-1.5 bg-primary hover:bg-primary-hover text-white shadow-sm"
                onClick={retry}
                disabled={retrying}
              >
                {retrying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {t('fiscal.panel.retry', 'Reenviar a SIFEN')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SaleFiscalPanel;
