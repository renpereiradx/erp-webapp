/**
 * InutilizeRangeModal — confirmación de inutilización de un rango de
 * numeración (FE4.2 — S4.2, MT §11.1.1). Justificativa obligatoria;
 * rango secuencial ≤ 1000 (validado por el backend).
 */
import React, { useState } from 'react';
import { Ban } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
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
    // Backend validarMotivo: 5-500 chars (S6-H5) — mismo mínimo en el FE.
    if (trimmed.length < 5) return;
    onSubmit(trimmed);
  };

  const valid = range !== null && isRangeWithinLimit(range);
  const motivoTooShort = motivo.trim().length > 0 && motivo.trim().length < 5;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isSubmitting) reset(); }}>
      <DialogContent className="max-w-md rounded-xl border-border-subtle shadow-fluent-16">
        <DialogHeader className="text-center">
          <div className="mx-auto size-14 bg-error/10 text-error rounded-full flex items-center justify-center mb-2">
            <Ban size={28} />
          </div>
          <DialogTitle className="text-foreground">
            {t('fiscal.inutilize.title', 'Inutilizar rango {range}', {
              range: range ? formatRangePadded(range) : '—',
            })}
          </DialogTitle>
          <DialogDescription className="text-body-md text-on-surface-deep">
            {configLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-md">
          {/* Resumen del rango */}
          {range && (
            <div className="flex items-center justify-between gap-md rounded-md border border-border-subtle bg-surface-muted px-md py-sm">
              <span className="text-label-caps uppercase text-on-surface-deep shrink-0">
                {t('fiscal.skipped.col.numbers', 'Números')}
              </span>
              <span className="text-data-mono font-data-mono text-foreground whitespace-nowrap">{formatRangePadded(range)}</span>
              <span className="text-label-caps uppercase text-on-surface-deep shrink-0">
                {t('fiscal.skipped.col.numbers', 'Números')}: {rangeCount(range)}
              </span>
            </div>
          )}
          {range && !valid && (
            <p className="text-body-sm-bold text-error">
              {t('fiscal.inutilize.rangeTooBig', 'El rango excede el límite de 1000 números (MT §11.1.1). Partilo en rangos menores.')}
            </p>
          )}

          {/* Justificativa obligatoria */}
          <div className="space-y-sm">
            <Label htmlFor="inutilize-motivo" className="text-body-sm-bold text-on-surface-deep">
              {t('fiscal.inutilize.reason', 'Justificativa (obligatoria)')} *
            </Label>
            <Textarea
              id="inutilize-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t('fiscal.inutilize.reasonPlaceholder', 'Motivo del evento de inutilización (5-500 caracteres)')}
              rows={3}
              minLength={5}
              maxLength={500}
              className="text-body-md"
              autoFocus
            />
            {motivoTooShort && (
              <p className="text-body-sm-bold text-error">
                {t('fiscal.inutilize.reasonTooShort', 'La justificativa debe tener al menos 5 caracteres')}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-md pt-sm">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={reset}
            disabled={isSubmitting}
          >
            {t('fiscal.cancel.keep', 'Volver')}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={motivo.trim().length < 5 || !valid}
          >
            {isSubmitting ? t('fiscal.inutilize.submitting', 'Inutilizando...') : t('fiscal.inutilize.confirm', 'Inutilizar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InutilizeRangeModal;
