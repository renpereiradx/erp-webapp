/**
 * EmitNoteModal — emisión de NCE/NDE sobre el DE original de una venta
 * (FE4.3, S4.3 — MT §11.1.3). Solo con FE aprobada (APROBADO/APROBADO_OBS).
 *
 * El motivo es iMotEmi (E401, tabla E5: 1-8). El monto es opcional: vacío =
 * todo el disponible del DE original; la regla de monto la valida el backend
 * (disponible = total original − notas vivas). El tope visible es el total
 * de la venta (aproximación; el 409 del backend informa el disponible real).
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { fiscalService } from '@/features/fiscal/services/fiscalService';
import { NOTE_EMISSION_MOTIVES, validateNoteMonto } from '@/domain/fiscal/notes';
import { fiscalDocTypeFromCode } from '@/domain/fiscal/states';

export interface EmitNoteModalProps {
  open: boolean;
  onClose: () => void;
  saleId: string;
  /** Tope visible del monto (total de la venta del detalle). */
  saleTotal?: number;
  /** Tipo de nota inicial (NCE por defecto — devoluciones). */
  initialType?: 'NCE' | 'NDE';
}

const EmitNoteModal: React.FC<EmitNoteModalProps> = ({
  open,
  onClose,
  saleId,
  saleTotal,
  initialType = 'NCE',
}) => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [noteType, setNoteType] = useState<'NCE' | 'NDE'>(initialType);
  const [motivo, setMotivo] = useState(1);
  const [monto, setMonto] = useState('');

  const reset = () => {
    setNoteType(initialType);
    setMotivo(1);
    setMonto('');
    onClose();
  };

  const montoError = validateNoteMonto(monto, saleTotal);

  const emitMutation = useMutation({
    mutationFn: () =>
      fiscalService.emitNote(saleId, noteType, {
        motivo,
        ...(monto.trim() !== '' ? { monto: monto.trim() } : {}),
      }),
    onSuccess: (nota) => {
      addToast(t('fiscal.notes.emitted', 'Nota emitida: CDC {cdc}', { cdc: nota.cdc }), 'success');
      queryClient.invalidateQueries({ queryKey: ['sale-fiscal', saleId] });
      reset();
    },
    onError: (err: any) =>
      addToast(
        err?.response?.data?.message || err?.message || t('fiscal.notes.error', 'No se pudo emitir la nota'),
        'error',
      ),
  });

  const docTypeLabel = fiscalDocTypeFromCode(noteType === 'NCE' ? 5 : 6);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !emitMutation.isPending) reset(); }}>
      <DialogContent className="max-w-md rounded-xl border-border-subtle shadow-fluent-64">
        <DialogHeader className="text-center">
          <div className="mx-auto size-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
            <FileText size={26} />
          </div>
          <DialogTitle className="text-lg font-black uppercase tracking-tight">
            {t('fiscal.notes.title', 'Nota de crédito / débito')}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            {t('fiscal.notes.subtitle', 'Sobre el DE original de la venta (gCamDEAsoc)')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de nota */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-secondary">
              {t('fiscal.notes.type', 'Tipo de nota')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['NCE', 'NDE'] as const).map((type) => {
                const info = fiscalDocTypeFromCode(type === 'NCE' ? 5 : 6);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNoteType(type)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                      noteType === type
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border-subtle bg-white text-text-secondary hover:bg-slate-50'
                    }`}
                  >
                    {info ? t(info.i18nKey) : type}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-text-secondary font-medium">{t('fiscal.notes.typeHint', 'NCE para devoluciones/ajustes; NDE para incrementos')}</p>
          </div>

          {/* Motivo E401 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-secondary">
              {t('fiscal.notes.motivo', 'Motivo de emisión (E401)')}
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(Number(e.target.value))}
              className="w-full h-11 px-3 border border-slate-200 rounded-md bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none hover:bg-slate-50 transition-colors"
            >
              {NOTE_EMISSION_MOTIVES.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.code} — {t(m.i18nKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Monto opcional */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-secondary">
              {t('fiscal.notes.monto', 'Monto (opcional)')}
            </label>
            <Input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder={saleTotal !== undefined ? String(saleTotal) : ''}
              className={`text-sm h-11 font-mono ${montoError ? 'border-error focus:ring-error/20' : ''}`}
            />
            {montoError ? (
              <p className="text-[11px] font-semibold text-error">{t(montoError)}</p>
            ) : (
              <p className="text-[10px] text-text-secondary font-medium">
                {t('fiscal.notes.montoHint', 'Vacío = todo el disponible del DE original. Tope visible: {total}', {
                  total: saleTotal !== undefined ? String(saleTotal) : '—',
                })}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 font-bold uppercase text-[10px] tracking-widest"
            onClick={reset}
            disabled={emitMutation.isPending}
          >
            {t('fiscal.cancel.keep', 'Volver')}
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold uppercase text-[10px] tracking-widest shadow-fluent-4"
            onClick={() => emitMutation.mutate()}
            disabled={emitMutation.isPending || !!montoError}
          >
            {emitMutation.isPending ? (
              <><Loader2 size={14} className="animate-spin mr-1.5" />{t('fiscal.notes.emitting', 'Emitiendo...')}</>
            ) : (
              `${t('fiscal.notes.submit', 'Emitir nota')} · ${docTypeLabel ? t(docTypeLabel.i18nKey) : noteType}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmitNoteModal;
