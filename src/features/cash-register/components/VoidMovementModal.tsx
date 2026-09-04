import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatPYG } from '@/domain/cash-register/format';
import type { VoidableMovement } from '../constants';
import type { ActionResult } from '../hooks/useCashMovements';

interface VoidMovementModalProps {
  movement: VoidableMovement | null;
  isVoiding: boolean;
  onClose: () => void;
  onConfirm: (movementId: number, reason: string) => Promise<ActionResult>;
}

const MIN_REASON_LENGTH = 5;

/** Irreversible movement void confirmation (variant="error" per DESIGN §6.6). */
export function VoidMovementModal({ movement, isVoiding, onClose, onConfirm }: VoidMovementModalProps) {
  const { t } = useI18n();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (movement) {
      setReason('');
      setError(null);
    }
  }, [movement]);

  const reasonInvalid = reason.trim().length < MIN_REASON_LENGTH;

  const handleConfirm = async () => {
    if (!movement) return;
    if (reasonInvalid) {
      setError(t('cashMovement.void.reasonRequired', 'La razón debe tener al menos 5 caracteres'));
      return;
    }
    const movementId = movement.movement_id;
    if (typeof movementId !== 'number') return;

    const result = await onConfirm(movementId, reason.trim());
    if (!result.ok) {
      setError(
        result.error
          ? t(result.error, result.error)
          : t('cashMovement.void.error', 'Error al anular el movimiento')
      );
    }
  };

  return (
    <EnhancedModal
      isOpen={!!movement}
      onClose={onClose}
      title={t('cashMovement.void.title', 'Anular Movimiento')}
      subtitle={t('cashMovement.void.dialogDescription', 'Esta acción es irreversible y revertirá el saldo.')}
      variant="error"
      size="sm"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose} disabled={isVoiding}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            loading={isVoiding}
            disabled={reasonInvalid}
          >
            {t('cashMovement.void.confirmAction', 'Confirmar anulación')}
          </Button>
        </div>
      }
    >
      <div className="space-y-md">
        {movement && (
          <div className="p-md bg-surface-muted rounded-md">
            <p className="text-body-md-bold text-foreground">{movement.concept}</p>
            <p className="text-data-mono font-data-mono text-error mt-xs">
              {formatPYG(movement.amount)}
            </p>
          </div>
        )}

        <div className="space-y-sm">
          <Label htmlFor="void-movement-reason" className="text-body-md-bold text-foreground">
            {t('cashMovement.void.reasonLabel', 'Razón de anulación')} *
          </Label>
          <Input
            id="void-movement-reason"
            value={reason}
            onChange={e => {
              setReason(e.target.value);
              setError(null);
            }}
            placeholder={t('cashMovement.void.reasonPlaceholder', 'Ingrese la razón de la anulación (mínimo 5 caracteres)')}
            state={error ? 'error' : ''}
          />
          <p className="text-body-sm text-on-surface-deep">
            {t('cashMovement.void.reasonHint', 'Se requieren al menos 5 caracteres.')}
          </p>
          {error && (
            <p className="text-body-md text-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </EnhancedModal>
  );
}
