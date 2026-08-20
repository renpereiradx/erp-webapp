/**
 * InutilizeRangeModal — confirmación de inutilización de un rango de
 * numeración (FE4.2 — S4.2, MT §11.1.1). Justificativa obligatoria;
 * rango secuencial ≤ 1000 (validado por el backend).
 */
import React, { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import type { NumberRange } from '@/domain/fiscal/ranges';
import { rangeCount, isRangeWithinLimit, formatRangePadded } from '@/domain/fiscal/ranges';

export interface InutilizeRangeModalProps {
  open: boolean;
  onClose: () => void;
  range: NumberRange | null;
  /** Identificación del timbrado (est-punto-serie-timbrado). */
  configLabel?: string;
  isSubmitting: boolean;
  onSubmit: (motivo: string) => void;
}

const InutilizeRangeModal: React.FC<InutilizeRangeModalProps> = ({
  open,
  onClose,
  range,
  configLabel,
  isSubmitting,
  onSubmit,
}) => {
  const { t } = useI18n();
  const [motivo, setMotivo] = useState('');

  const reset = () => {
    setMotivo('');
    onClose();
  };

  const handleConfirm = () => {
    const trimmed = motivo.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const valid = range !== null && isRangeWithinLimit(range);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isSubmitting) reset(); }}>
      <DialogContent className="max-w-md rounded-xl border-border-subtle shadow-fluent-64">
        <DialogHeader className="text-center">
          <div className="mx-auto size-14 bg-error/10 text-error rounded-full flex items-center justify-center mb-2">
            <Ban size={28} />
          </div>
          <DialogTitle className="text-lg font-black uppercase tracking-tight">
            {t('fiscal.inutilize.title', 'Inutilizar rango {range}', {
              range: range ? formatRangePadded(range) : '—',
            })}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            {configLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen del rango */}
          {range && (
            <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-slate-50 p-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                {t('fiscal.skipped.col.numbers', 'Números')}
              </span>
              <span className="font-mono text-sm font-bold text-text-main">{formatRangePadded(range)}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                {t('fiscal.skipped.ranges', '{count} número(s) en {ranges} rango(s)', {
                  count: String(rangeCount(range)),
                  ranges: '1',
                })}
              </span>
            </div>
          )}
          {range && !valid && (
            <p className="text-[11px] font-semibold text-error">
              {t('fiscal.inutilize.rangeTooBig', 'El rango excede el límite de 1000 números (MT §11.1.1). Partilo en rangos menores.')}
            </p>
          )}

          {/* Justificativa obligatoria */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-secondary">
              {t('fiscal.inutilize.reason', 'Justificativa (obligatoria)')} *
            </label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t('fiscal.inutilize.reasonPlaceholder', 'Motivo del evento de inutilización (5-500 caracteres)')}
              rows={3}
              maxLength={500}
              className="text-sm"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 font-bold uppercase text-[10px] tracking-widest"
            onClick={reset}
            disabled={isSubmitting}
          >
            {t('fiscal.cancel.keep', 'Volver')}
          </Button>
          <Button
            className="flex-1 bg-error hover:bg-error/90 text-white font-bold uppercase text-[10px] tracking-widest shadow-fluent-4"
            onClick={handleConfirm}
            disabled={isSubmitting || !motivo.trim() || !valid}
          >
            {isSubmitting ? <><Loader2 size={14} className="animate-spin mr-1.5" />{t('fiscal.inutilize.submitting', 'Inutilizando...')}</> : t('fiscal.inutilize.confirm', 'Inutilizar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InutilizeRangeModal;
