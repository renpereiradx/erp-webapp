/**
 * Generic destructive-action confirmation dialog (DESIGN §6.6).
 * Wraps EnhancedModal with variant="error" and a confirm/cancel footer.
 */

import { useI18n } from '@/lib/i18n';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <EnhancedModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={title}
      variant="error"
      size="sm"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel ?? t('common.cancel', 'Cancelar')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t('common.confirm', 'Confirmar')}
          </Button>
        </div>
      }
    >
      {description && <p className="text-body-md text-on-surface-deep">{description}</p>}
    </EnhancedModal>
  );
}
