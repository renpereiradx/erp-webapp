/**
 * SkippedNumbersPage — vista de saltos de numeración e inutilización
 * (FE4.2 — S4.2, MT §11.1.1). Admin global (permisos sifen:*).
 *
 * Flujo: seleccionar branch + tipo de documento + timbrado → el backend
 * reporta los números sin DE emitido ni evento de inutilización
 * (GET /sifen/inutilize/skipped) → se agrupan en rangos consecutivos
 * (≤ 1000) → acción de inutilización con justificativa obligatoria.
 * Debajo, el historial de eventos de inutilización con su estado.
 */
import React, { useState } from 'react';
import { Ban, FileWarning, Loader2, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useSkippedNumbers, type SkippedDocType } from '@/features/fiscal/hooks/useSkippedNumbers';
import InutilizeRangeModal from '@/features/fiscal/components/InutilizeRangeModal';
import { FISCAL_DOC_TYPES } from '@/domain/fiscal/states';
import { formatRangePadded, type NumberRange } from '@/domain/fiscal/ranges';
import type { InutilizacionPublic } from '@/features/fiscal/types';

const INUTILIZE_STATE_BADGE: Record<string, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  PENDIENTE: 'warning',
  REGISTRADA: 'success',
  RECHAZADA: 'destructive',
};

const inutilizeStateBadge = (state: string) => INUTILIZE_STATE_BADGE[state] ?? 'secondary';

const SkippedNumbersPage: React.FC = () => {
  const { t } = useI18n();
  const hook = useSkippedNumbers();
  const [targetRange, setTargetRange] = useState<NumberRange | null>(null);

  const selectedTimbrado = hook.timbrados.find(c => c.timbrado === hook.timbradoNum);
  const configLabel = selectedTimbrado
    ? `${selectedTimbrado.establishment_code}-${selectedTimbrado.expedition_point}-${selectedTimbrado.serie || 'AA'} · ${t('fiscal.branch.timbrado', 'Número de Timbrado')} ${selectedTimbrado.timbrado}`
    : undefined;

  const rangeCountTotal = hook.ranges.reduce((acc, r) => acc + (r.hasta - r.desde + 1), 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-text-main flex items-center gap-3">
          <span className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileWarning size={20} />
          </span>
          {t('fiscal.skipped.title', 'Saltos de numeración')}
        </h1>
        <p className="text-sm text-text-secondary mt-1">{t('fiscal.skipped.subtitle', 'Números sin DE emitido ni evento de inutilización')}</p>
      </div>

      {/* Filtros */}
      <Card className="rounded-xl border-border-subtle shadow-fluent-2">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{t('fiscal.skipped.branch', 'Sucursal')}</label>
              <select
                className="w-full h-11 px-3 border border-slate-200 rounded-md bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none hover:bg-slate-50 transition-colors"
                value={hook.branchId ?? ''}
                onChange={(e) => hook.setBranchId(e.target.value ? Number(e.target.value) : null)}
                disabled={hook.branchesLoading}
              >
                <option value="">—</option>
                {hook.branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{t('fiscal.skipped.documentType', 'Tipo de documento')}</label>
              <select
                className="w-full h-11 px-3 border border-slate-200 rounded-md bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none hover:bg-slate-50 transition-colors"
                value={hook.documentType}
                onChange={(e) => hook.setDocumentType(e.target.value as SkippedDocType)}
              >
                {FISCAL_DOC_TYPES.map(d => (
                  <option key={d.docType} value={d.docType}>{t(d.i18nKey)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{t('fiscal.skipped.timbrado', 'Timbrado')}</label>
              <select
                className="w-full h-11 px-3 border border-slate-200 rounded-md bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none hover:bg-slate-50 transition-colors disabled:bg-slate-50"
                value={hook.timbradoNum}
                onChange={(e) => hook.setTimbradoNum(e.target.value)}
                disabled={hook.branchId === null}
              >
                <option value="">—</option>
                {hook.timbrados.map(c => (
                  <option key={c.id} value={c.timbrado}>
                    {c.timbrado} · {c.establishment_code}-{c.expedition_point}-{c.serie || 'AA'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full h-11 bg-primary hover:bg-primary-hover text-white font-bold uppercase text-xs tracking-widest shadow-sm"
                onClick={hook.consultar}
                disabled={!hook.hasSelection || hook.skippedLoading}
              >
                {hook.skippedLoading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Search size={14} className="mr-1.5" />}
                {t('fiscal.skipped.load', 'Consultar saltos')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rangos de saltos */}
      <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-border-subtle p-6">
          <CardTitle className="text-base font-black tracking-tight uppercase">{t('fiscal.skipped.title', 'Saltos de numeración')}</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
            {hook.skippedLoading
              ? '…'
              : hook.ranges.length > 0
                ? t('fiscal.skipped.ranges', '{count} número(s) en {ranges} rango(s)', { count: String(rangeCountTotal), ranges: String(hook.ranges.length) })
                : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {hook.skippedLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>
          ) : !hook.hasSelection || hook.skipped === null ? (
            <div className="py-12 text-center text-text-secondary font-bold italic uppercase text-[10px] tracking-widest">
              {t('fiscal.skipped.loadHint', 'Seleccioná sucursal, tipo y timbrado y consultá los saltos')}
            </div>
          ) : hook.ranges.length === 0 ? (
            <div className="py-12 text-center text-text-secondary font-bold italic uppercase text-[10px] tracking-widest">
              {t('fiscal.skipped.empty', 'Sin saltos de numeración para la selección')}
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {hook.ranges.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
                      <Ban size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-text-main">{formatRangePadded(r)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                        {t('fiscal.skipped.col.numbers', 'Números')}: {r.hasta - r.desde + 1}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-bold gap-1.5 text-error border-error/30 hover:bg-error hover:text-white shrink-0"
                    onClick={() => setTargetRange(r)}
                  >
                    <Ban size={13} /> {t('fiscal.skipped.inutilize', 'Inutilizar rango')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de inutilizaciones */}
      <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-border-subtle p-6 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-black tracking-tight uppercase">{t('fiscal.skipped.history', 'Inutilizaciones recientes')}</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
              {hook.branchId !== null ? hook.documentType : ''}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white transition-all"
            onClick={hook.retryPending}
            disabled={hook.retrying || hook.branchId === null}
          >
            {hook.retrying ? <Loader2 size={12} className="animate-spin mr-1" /> : <RefreshCw size={12} className="mr-1" />}
            {t('fiscal.skipped.retry', 'Reintentar pendientes')}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {hook.inutilizacionesLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>
          ) : hook.inutilizaciones.length === 0 ? (
            <div className="py-12 text-center text-text-secondary font-bold italic uppercase text-[10px] tracking-widest">
              {t('fiscal.skipped.historyEmpty', 'Sin eventos de inutilización')}
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {hook.inutilizaciones.map((inu: InutilizacionPublic) => (
                <div key={inu.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-sm font-bold text-text-main">
                      {inu.establecimiento}-{inu.punto_expedicion}-{inu.serie} · {formatRangePadded({ desde: inu.desde, hasta: inu.hasta })}
                    </p>
                    <Badge variant={inutilizeStateBadge(inu.estado)} dot>
                      {t(`fiscal.inutilize.states.${inu.estado}`, inu.estado)}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">{inu.motivo}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                    <span>{t('fiscal.branch.timbrado', 'Número de Timbrado')}: {inu.timbrado_num}</span>
                    <span>{new Date(inu.created_at).toLocaleString()}</span>
                    {inu.codigo_respuesta && <span className="font-mono">{inu.codigo_respuesta}</span>}
                    {inu.mensaje && <span className="normal-case tracking-normal">{inu.mensaje}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InutilizeRangeModal
        open={targetRange !== null}
        onClose={() => setTargetRange(null)}
        range={targetRange}
        configLabel={configLabel}
        isSubmitting={hook.inutilizando}
        onSubmit={(motivo) => {
          if (targetRange) {
            hook.inutilizeRange({ motivo, desde: targetRange.desde, hasta: targetRange.hasta });
          }
          setTargetRange(null);
        }}
      />
    </div>
  );
};

export default SkippedNumbersPage;
