import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { validateOpenForm } from '@/domain/cash-register/validators';
import { groupDigits, parseGroupedDigits } from '@/domain/cash-register/format';

export interface OpenSessionInput {
  name: string;
  initial_balance: number;
  location: string | null;
  notes: string | null;
}

interface OpenSessionFormProps {
  /** When a session is already open the form is disabled (one open journey at a time). */
  hasActiveSession: boolean;
  isOpening: boolean;
  onOpen: (input: OpenSessionInput) => Promise<void>;
}

interface OpenFormState {
  name: string;
  location: string;
  initialBalance: string;
  notes: string;
}

const EMPTY_FORM: OpenFormState = { name: '', location: '', initialBalance: '', notes: '' };

/** Apertura de caja form for /caja-registradora. */
export function OpenSessionForm({ hasActiveSession, isOpening, onOpen }: OpenSessionFormProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<OpenFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: keyof OpenFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAmountChange = (value: string) => {
    setForm(prev => ({ ...prev, initialBalance: parseGroupedDigits(value) }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const balance = parseFloat(form.initialBalance);
    const validationKey = validateOpenForm(form.name, balance);
    if (validationKey) {
      setError(t(validationKey, 'Datos inválidos'));
      return;
    }

    try {
      await onOpen({
        name: form.name.trim(),
        initial_balance: balance,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : t('cashRegister.error.opening', 'Error al abrir la caja registradora')
      );
    }
  };

  const disabled = hasActiveSession || isOpening;
  const inputState = error ? 'error' : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-md" noValidate>
      {hasActiveSession && (
        <div className="p-md bg-warning/10 border border-warning/20 rounded-md flex gap-sm">
          <AlertCircle className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
          <div>
            <p className="text-body-md-bold text-warning">
              {t('cashRegister.open.restrictionTitle', 'Restricción de operación')}
            </p>
            <p className="text-body-md text-on-surface-deep mt-xs">
              {t(
                'cashRegister.open.restrictionDesc',
                'Ya existe una sesión activa para este terminal. Debe finalizar la jornada actual antes de iniciar una nueva apertura de fondos.'
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <div className="md:col-span-2 space-y-sm">
          <Label htmlFor="open-session-name" className="text-body-md-bold text-foreground">
            {t('cashRegister.open.identifier', 'Nombre identificador')} *
          </Label>
          <Input
            id="open-session-name"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            placeholder={t('cashRegister.open.identifierPlaceholder', 'Ej: CAJA-01 Turno Mañana')}
            state={inputState}
            disabled={disabled}
            required
          />
        </div>

        <div className="space-y-sm">
          <Label htmlFor="open-session-location" className="text-body-md-bold text-foreground">
            {t('cashRegister.open.location', 'Ubicación')}
          </Label>
          <Input
            id="open-session-location"
            value={form.location}
            onChange={e => setField('location', e.target.value)}
            placeholder={t('cashRegister.open.location.placeholder', 'Ej: Punto de Venta 1')}
            disabled={disabled}
          />
        </div>

        <div className="space-y-sm">
          <Label htmlFor="open-session-date" className="text-body-md-bold text-foreground">
            {t('cashRegister.open.effectiveDate', 'Fecha efectiva')}
          </Label>
          <Input
            id="open-session-date"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            disabled={disabled}
          />
        </div>

        <div className="md:col-span-2 space-y-sm">
          <Label htmlFor="open-session-balance" className="text-body-md-bold text-foreground">
            {t('cashRegister.open.initialFloat', 'Fondo inicial de maniobra')} *
          </Label>
          <div className="relative">
            <span
              className="absolute inset-y-0 left-0 pl-sm flex items-center text-body-md-bold text-on-surface-deep"
              aria-hidden="true"
            >
              ₲
            </span>
            <Input
              id="open-session-balance"
              type="text"
              inputMode="numeric"
              value={groupDigits(form.initialBalance)}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="0"
              state={inputState}
              disabled={disabled}
              className="pl-lg text-body-lg font-data-mono"
              required
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-sm">
          <Label htmlFor="open-session-notes" className="text-body-md-bold text-foreground">
            {t('cashRegister.open.auditNotes', 'Notas de auditoría')}
          </Label>
          <Textarea
            id="open-session-notes"
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder={t(
              'cashRegister.open.auditNotesPlaceholder',
              'Añada detalles sobre el estado inicial del efectivo o novedades...'
            )}
            className="min-h-24 resize-none"
            disabled={disabled}
          />
        </div>
      </div>

      {error && (
        <p className="p-sm bg-error-container text-on-error-container rounded-md text-body-md-bold" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-sm pt-md border-t border-divider">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => {
            setForm(EMPTY_FORM);
            setError(null);
          }}
        >
          {t('action.clear', 'Limpiar')}
        </Button>
        <Button type="submit" variant="primary" loading={isOpening} disabled={hasActiveSession}>
          {isOpening
            ? t('cashRegister.opening', 'Abriendo caja...')
            : t('cashRegister.open.action', 'Abrir Caja')}
        </Button>
      </div>
    </form>
  );
}
