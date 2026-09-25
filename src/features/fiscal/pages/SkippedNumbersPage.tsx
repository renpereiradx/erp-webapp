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
import { Ban, FileWarning, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg">
        <PageHeader
          breadcrumb={t('nav.sifenFiscalGroup', 'Fiscal (SIFEN)')}
          title={t('fiscal.skipped.title', 'Saltos de numeración')}
          subtitle={t('fiscal.skipped.subtitle', 'Números sin DE emitido ni evento de inutilización')}
        />

        {/* Filtros */}
        <Card className="rounded-md bg-surface border-0 shadow-whisper">
          <CardContent className="p-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-md items-end">
              <div className="space-y-xs">
                <Label htmlFor="skipped-branch" className="text-body-sm-bold text-on-surface-deep">
                  {t('fiscal.skipped.branch', 'Sucursal')}
                </Label>
                <Select
                  value={hook.branchId === null ? 'none' : String(hook.branchId)}
                  onValueChange={(val: string) => hook.setBranchId(val === 'none' ? null : Number(val))}
                >
                  <SelectTrigger id="skipped-branch" className="w-full" disabled={hook.branchesLoading}>
                    <SelectValue placeholder={t('fiscal.skipped.branch', 'Sucursal')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {hook.branches.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-xs">
                <Label htmlFor="skipped-doc-type" className="text-body-sm-bold text-on-surface-deep">
                  {t('fiscal.skipped.documentType', 'Tipo de documento')}
                </Label>
                <Select value={hook.documentType} onValueChange={(val: string) => hook.setDocumentType(val as SkippedDocType)}>
                  <SelectTrigger id="skipped-doc-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_DOC_TYPES.map(d => (
                      <SelectItem key={d.docType} value={d.docType}>{t(d.i18nKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-xs">
                <Label htmlFor="skipped-timbrado" className="text-body-sm-bold text-on-surface-deep">
                  {t('fiscal.skipped.timbrado', 'Timbrado')}
                </Label>
                <Select
                  value={hook.timbradoNum === '' ? 'none' : hook.timbradoNum}
                  onValueChange={(val: string) => hook.setTimbradoNum(val === 'none' ? '' : val)}
                  disabled={hook.branchId === null}
                >
                  <SelectTrigger id="skipped-timbrado" className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {hook.timbrados.map(c => (
                      <SelectItem key={c.id} value={c.timbrado}>
                        <span className="text-data-mono font-data-mono">{c.timbrado}</span> · {c.establishment_code}-{c.expedition_point}-{c.serie || 'AA'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="primary"
                onClick={hook.consultar}
                disabled={!hook.hasSelection || hook.skippedLoading}
              >
                <Search className="size-4" aria-hidden="true" />
                {t('fiscal.skipped.load', 'Consultar saltos')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rangos de saltos */}
        <Card className="rounded-md bg-surface border-0 shadow-whisper overflow-hidden">
          <CardHeader className="px-lg py-md bg-surface-muted border-b border-border-subtle space-y-0">
            <CardTitle className="text-title-md text-foreground">{t('fiscal.skipped.title', 'Saltos de numeración')}</CardTitle>
            <CardDescription className="text-body-md text-on-surface-deep">
              {hook.skippedLoading
                ? '…'
                : hook.ranges.length > 0
                  ? t('fiscal.skipped.ranges', '{count} número(s) en {ranges} rango(s)', { count: String(rangeCountTotal), ranges: String(hook.ranges.length) })
                  : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {hook.skippedLoading ? (
              <div className="p-lg space-y-md" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-surface-muted rounded-md animate-pulse" />
                ))}
              </div>
            ) : !hook.hasSelection || hook.skipped === null ? (
              <EmptyState
                variant="instruction"
                icon={Search}
                title={t('fiscal.skipped.loadHint', 'Seleccioná sucursal, tipo y timbrado y consultá los saltos')}
              />
            ) : hook.ranges.length === 0 ? (
              <EmptyState
                icon={FileWarning}
                title={t('fiscal.skipped.empty', 'Sin saltos de numeración para la selección')}
              />
            ) : (
              <div className="divide-y divide-border-subtle">
                {hook.ranges.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-md p-md hover:bg-surface-muted transition-colors duration-150">
                    <div className="flex items-center gap-md min-w-0">
                      <div className="size-9 rounded-md bg-error/10 text-error flex items-center justify-center shrink-0">
                        <Ban className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-data-mono font-data-mono text-foreground">{formatRangePadded(r)}</p>
                        <p className="text-label-caps uppercase text-on-surface-deep">
                          {t('fiscal.skipped.col.numbers', 'Números')}: {r.hasta - r.desde + 1}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-error border-error/30 hover:bg-error hover:text-on-error shrink-0"
                      onClick={() => setTargetRange(r)}
                    >
                      <Ban className="size-3.5" aria-hidden="true" /> {t('fiscal.skipped.inutilize', 'Inutilizar rango')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de inutilizaciones */}
        <Card className="rounded-md bg-surface border-0 shadow-whisper overflow-hidden">
          <CardHeader className="px-lg py-md bg-surface-muted border-b border-border-subtle flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-title-md text-foreground">{t('fiscal.skipped.history', 'Inutilizaciones recientes')}</CardTitle>
              <CardDescription className="text-body-md text-on-surface-deep">
                {hook.branchId !== null ? hook.documentType : ''}
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={hook.retryPending}
              disabled={hook.retrying || hook.branchId === null}
            >
              <RefreshCw className={`size-3.5 ${hook.retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
              {t('fiscal.skipped.retry', 'Reintentar pendientes')}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {hook.inutilizacionesLoading ? (
              <div className="p-lg space-y-md" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-surface-muted rounded-md animate-pulse" />
                ))}
              </div>
            ) : hook.inutilizacionesError ? (
              <div className="p-md">
                <ErrorState
                  title={t('fiscal.skipped.historyError', 'No se pudieron cargar las inutilizaciones')}
                  onRetry={hook.refetchInutilizaciones}
                />
              </div>
            ) : hook.inutilizaciones.length === 0 ? (
              <EmptyState
                icon={FileWarning}
                title={t('fiscal.skipped.historyEmpty', 'Sin eventos de inutilización')}
              />
            ) : (
              <div className="divide-y divide-border-subtle">
                {hook.inutilizaciones.map((inu: InutilizacionPublic) => (
                  <div key={inu.id} className="p-md hover:bg-surface-muted transition-colors duration-150 space-y-sm">
                    <div className="flex items-center justify-between gap-md">
                      <p className="text-data-mono font-data-mono text-foreground">
                        {inu.establecimiento}-{inu.punto_expedicion}-{inu.serie} · {formatRangePadded({ desde: inu.desde, hasta: inu.hasta })}
                      </p>
                      <Badge variant={inutilizeStateBadge(inu.estado)} dot>
                        {t(`fiscal.inutilize.states.${inu.estado}`, inu.estado)}
                      </Badge>
                    </div>
                    <p className="text-body-md text-on-surface-deep line-clamp-2">{inu.motivo}</p>
                    <div className="flex flex-wrap gap-x-md gap-y-xs text-body-sm text-on-surface-deep">
                      <span>
                        {t('fiscal.branch.timbrado', 'Número de Timbrado')}:{' '}
                        <span className="text-data-mono font-data-mono">{inu.timbrado_num}</span>
                      </span>
                      <span className="text-data-mono font-data-mono">{new Date(inu.created_at).toLocaleString()}</span>
                      {inu.codigo_respuesta && <span className="text-data-mono font-data-mono">{inu.codigo_respuesta}</span>}
                      {inu.mensaje && <span>{inu.mensaje}</span>}
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
    </div>
  );
};

export default SkippedNumbersPage;
