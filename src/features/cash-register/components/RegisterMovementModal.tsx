import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import EnhancedModal from '@/components/ui/EnhancedModal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { validateMovementForm } from '@/domain/cash-register/validators';
import { groupDigits, parseGroupedDigits } from '@/domain/cash-register/format';
import { MOVEMENT_CONCEPTS, type MovementDirection } from '../constants';
import type { ActionResult } from '../hooks/useCashMovements';

export interface RegisterMovementPayload {
  movement_type: MovementDirection;
  conceptId: string;
  amount: number;
  notes: string;
}

interface RegisterMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: RegisterMovementPayload) => Promise<ActionResult>;
}

interface MovementFormState {
  movementType: MovementDirection;
  conceptId: string;
  amount: string;
  notes: string;
}

const EMPTY_FORM: MovementFormState = { movementType: 'INCOME', conceptId: '', amount: '', notes: '' };

const TYPE_OPTIONS: ReadonlyArray<{
  value: MovementDirection;
  labelKey: string;
  fallback: string;
}> = [
  { value: 'INCOME', labelKey: 'cashMovement.type.income', fallback: 'Ingreso (+)' },
  { value: 'EXPENSE', labelKey: 'cashMovement.type.expense', fallback: 'Egreso (-)' },
];

/** Manual cash movement dialog (EnhancedModal per DESIGN §6.6). */
export function RegisterMovementModal({ isOpen, onClose, onSubmit }: RegisterMovementModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<MovementFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Each open starts from a clean form.
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setError(null);
    }
  }, [isOpen]);

  const setField = <K extends keyof MovementFormState>(field: K, value: MovementFormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleTypeChange = (value: string) => {
    setForm(prev => ({ ...prev, movementType: value as MovementDirection, conceptId: '' }));
    setError(null);
  };

  const handleSubmit = async () => {
    const amount = parseFloat(parseGroupedDigits(form.amount));

    if (!form.conceptId) {
      setError(t('cashMovement.error.noConcept', 'Debe seleccionar un concepto'));
      return;
    }
    const validationKey = validateMovementForm(amount, form.conceptId);
    if (validationKey) {
      setError(t(validationKey, 'Datos inválidos'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        movement_type: form.movementType,
        conceptId: form.conceptId,
        amount,
        notes: form.notes.trim(),
      });

      if (!result.ok) {
        setError(
          result.error
            ? t(result.error, result.error)
            : t('cashMovement.error.generic', 'Error al registrar el movimiento')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('cashMovement.modal.registerTitle', 'Registrar movimiento manual')}
      subtitle={t(
        'cashMovement.modal.registerDescription',
        'Agregue fondos o registre egresos directamente en la caja.'
      )}
      variant="info"
      size="md"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button form="register-movement-form" type="submit" variant="primary" loading={isSubmitting}>
            {t('action.save', 'Guardar')}
          </Button>
        </div>
      }
    >
      <form
        id="register-movement-form"
        onSubmit={e => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-md"
        noValidate
      >
        <div className="space-y-sm">
          <Label className="text-body-md-bold text-foreground">
            {t('cashMovement.field.movementType', 'Tipo de Movimiento')}
          </Label>
          <SegmentedControl
            options={TYPE_OPTIONS.map(o => ({
              value: o.value,
              label: t(o.labelKey, o.fallback),
            }))}
            value={form.movementType}
            onChange={handleTypeChange}
            aria-label={t('cashMovement.field.movementType', 'Tipo de Movimiento')}
          />
        </div>

        <div className="space-y-sm">
          <Label htmlFor="register-movement-concept" className="text-body-md-bold text-foreground">
            {t('cashMovement.field.conceptRequired', 'Concepto de operación')} *
          </Label>
          <Select value={form.conceptId} onValueChange={value => setField('conceptId', value)}>
            <SelectTrigger id="register-movement-concept">
              <SelectValue placeholder={t('cashMovement.placeholder.concept', 'Seleccione un motivo...')} />
            </SelectTrigger>
            <SelectContent>
              {MOVEMENT_CONCEPTS[form.movementType].map(concept => (
                <SelectItem key={concept.id} value={concept.id} className="text-body-md">
                  {t(concept.labelKey, concept.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-sm">
          <Label htmlFor="register-movement-amount" className="text-body-md-bold text-foreground">
            {t('cashMovement.field.amountPYG', 'Monto (₲)')} *
          </Label>
          <div className="relative">
            <span
              className="absolute inset-y-0 left-0 pl-sm flex items-center text-body-md-bold text-on-surface-deep"
              aria-hidden="true"
            >
              ₲
            </span>
            <Input
              id="register-movement-amount"
              type="text"
              inputMode="numeric"
              value={groupDigits(form.amount)}
              onChange={e => setField('amount', parseGroupedDigits(e.target.value))}
              placeholder="0"
              state={error ? 'error' : ''}
              className="pl-lg font-data-mono"
              required
            />
          </div>
        </div>

        <div className="space-y-sm">
          <Label htmlFor="register-movement-notes" className="text-body-md-bold text-foreground">
            {t('cashMovement.field.additionalNotes', 'Notas adicionales')}
          </Label>
          <Textarea
            id="register-movement-notes"
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder={t('cashMovement.placeholder.notes', 'Añada una descripción detallada si es necesario...')}
            className="min-h-20 resize-none"
          />
        </div>

        {error && (
          <p className="p-sm bg-error-container text-on-error-container rounded-md text-body-md-bold" role="alert">
            {error}
          </p>
        )}
      </form>
    </EnhancedModal>
  );
}
