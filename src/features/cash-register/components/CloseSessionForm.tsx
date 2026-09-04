import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { CashRegister } from '@/store/useCashRegisterStore';
import { validateCloseForm } from '@/domain/cash-register/validators';
import {
  closingDifference,
  formatPYG,
  groupDigits,
  parseGroupedDigits,
  systemBalanceOf,
} from '@/domain/cash-register/format';

export interface CloseSessionInput {
  final_balance: number;
  notes: string | null;
}

interface CloseSessionFormProps {
  session: CashRegister;
  isClosing: boolean;
  onCloseJourney: (input: CloseSessionInput) => Promise<void>;
  onCancel: () => void;
}

/** Cierre de caja form for /caja-registradora, with live cash-count difference. */
export function CloseSessionForm({ session, isClosing, onCloseJourney, onCancel }: CloseSessionFormProps) {
  const { t } = useI18n();
  const [finalBalance, setFinalBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const systemBalance = systemBalanceOf(session);
  const counted = parseFloat(parseGroupedDigits(finalBalance));
  const difference = finalBalance ? closingDifference(counted, systemBalance) : null;
  const isBalanced = difference === 0;

  const handleAmountChange = (value: string) => {
    setFinalBalance(parseGroupedDigits(value));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationKey = validateCloseForm(counted);
    if (validationKey) {
      setError(t(validationKey, 'El saldo ingresado no es válido'));
      return;
    }

    try {
      await onCloseJourney({ final_balance: counted, notes: notes.trim() || null });
      setFinalBalance('');
      setNotes('');
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : t('cashRegister.error.closing', 'Error al cerrar la caja registradora')
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-md" noValidate>
      <div className="p-md bg-surface-muted rounded-md flex flex-col sm:flex-row justify-between gap-md">
        <div>
          <p className="text-body-md-bold text-foreground">
            {t('cashRegister.close.countRequired', 'Arqueo requerido')}
          </p>
          <p className="text-body-md text-on-surface-deep mt-xs">
            {t('cashRegister.close.countHelp', 'Ingrese el efectivo total contado físicamente en {name}.', {
              name: session.name,
            })}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-body-sm-bold text-on-surface-deep">
            {t('cashRegister.close.systemBalance', 'Saldo del Sistema')}
          </p>
          <p className="text-data-mono font-data-mono text-foreground">
            {formatPYG(systemBalance)}
          </p>
        </div>
      </div>

      <div className="space-y-sm">
        <Label htmlFor="close-session-balance" className="text-body-md-bold text-foreground">
          {t('cashRegister.close.physicalFinal', 'Balance físico final')} *
        </Label>
        <div className="relative">
          <span
            className="absolute inset-y-0 left-0 pl-sm flex items-center text-body-md-bold text-on-surface-deep"
            aria-hidden="true"
          >
            ₲
          </span>
          <Input
            id="close-session-balance"
            type="text"
            inputMode="numeric"
            value={groupDigits(finalBalance)}
            onChange={e => handleAmountChange(e.target.value)}
            placeholder="0"
            state={error ? 'error' : ''}
            className="pl-lg text-title-md font-data-mono"
            required
          />
        </div>
      </div>

      {difference !== null && (
        <div
          className={`p-md rounded-md flex items-center justify-between gap-md border ${
            isBalanced ? 'bg-success/10 border-success/20' : 'bg-error-container border-error/20'
          }`}
          role="status"
        >
          <div className="flex items-center gap-md">
            <span
              className={`w-10 h-10 rounded-md flex items-center justify-center ${
                isBalanced ? 'bg-success text-white' : 'bg-error text-white'
              }`}
              aria-hidden="true"
            >
              {isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </span>
            <div>
              <p className={`text-body-sm-bold ${isBalanced ? 'text-success' : 'text-on-error-container'}`}>
                {t('cashRegister.close.auditDifference', 'Diferencia de auditoría')}
              </p>
              <p className={`text-title-md font-data-mono ${isBalanced ? 'text-success' : 'text-on-error-container'}`}>
                {difference !== null && difference > 0 ? '+' : ''}
                {formatPYG(difference ?? 0)}
              </p>
            </div>
          </div>
          <span
            className={`hidden sm:inline-flex text-body-sm-bold px-sm py-xs rounded-xs ${
              isBalanced ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            }`}
          >
            {isBalanced
              ? t('cashRegister.close.balanced', 'Balance cuadrado')
              : t('cashRegister.close.needsJustification', 'Requiere justificación')}
          </span>
        </div>
      )}

      <div className="space-y-sm">
        <Label htmlFor="close-session-notes" className="text-body-md-bold text-foreground">
          {t('cashRegister.close.observations', 'Observaciones de cierre')}
        </Label>
        <Textarea
          id="close-session-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={t(
            'cashRegister.close.observationsPlaceholder',
            'Describa el motivo de cualquier discrepancia detectada o novedades durante el turno...'
          )}
          className="min-h-20 resize-none"
        />
      </div>

      {error && (
        <p className="p-sm bg-error-container text-on-error-container rounded-md text-body-md-bold" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-sm pt-md border-t border-divider">
        <Button type="button" variant="secondary" disabled={isClosing} onClick={onCancel}>
          {t('common.cancel', 'Cancelar')}
        </Button>
        <Button type="submit" variant="destructive" loading={isClosing}>
          {isClosing
            ? t('cashRegister.closing', 'Cerrando caja...')
            : t('cashRegister.close.finalize', 'Finalizar y cerrar caja')}
        </Button>
      </div>
    </form>
  );
}
