import { Clock, History, MapPin, Wallet } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/EmptyState';
import type { CashRegister } from '@/store/useCashRegisterStore';
import { formatPYG, sessionDuration } from '@/domain/cash-register/format';

interface CashRegisterStatusCardProps {
  session: CashRegister | null;
  onCloseJourney: () => void;
}

/**
 * Sidebar card for /caja-registradora: the active terminal summary,
 * or an informative empty state when no session is open.
 */
export function CashRegisterStatusCard({ session, onCloseJourney }: CashRegisterStatusCardProps) {
  const { t } = useI18n();

  if (!session) {
    return (
      <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
        <EmptyState
          icon={Wallet}
          size="small"
          title={t('cashRegister.session.noActiveTerminal', 'Sin terminal activa')}
          description={t(
            'cashRegister.session.noActiveTerminalDesc',
            'No hay una jornada abierta. Inicie la apertura para registrar movimientos.'
          )}
        />
      </div>
    );
  }

  const duration = sessionDuration(session.opened_at);

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
      <div className="px-lg py-md border-b border-divider bg-success/10 flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
          <span className="text-body-sm-bold text-success">
            {t('cashRegister.session.activeTerminal', 'Terminal activa')}
          </span>
        </div>
        {duration && (
          <span className="flex items-center gap-xs text-body-sm-bold text-success">
            <Clock className="w-4 h-4" aria-hidden="true" />
            {duration}
          </span>
        )}
      </div>

      <div className="p-lg space-y-md">
        <div>
          <p className="text-body-sm-bold text-on-surface-deep">
            {t('cashRegister.field.identifier', 'Identificador')}
          </p>
          <h3 className="text-title-md text-foreground leading-tight">{session.name}</h3>
        </div>

        <div className="p-md bg-surface-muted rounded-md">
          <p className="text-body-sm-bold text-on-surface-deep">
            {t('cashRegister.session.systemBalance', 'Saldo en sistema')}
          </p>
          <p className="text-title-md font-data-mono text-foreground">
            {formatPYG(session.current_balance || 0)}
          </p>
        </div>

        <div className="space-y-sm">
          <div className="flex items-center justify-between gap-sm">
            <span className="flex items-center gap-xs text-body-md text-on-surface-deep">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              {t('cashRegister.open.location', 'Ubicación')}
            </span>
            <span className="text-body-md-bold text-foreground text-right">
              {session.location || t('cashRegister.session.notDefined', 'No definida')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-sm">
            <span className="flex items-center gap-xs text-body-md text-on-surface-deep">
              <History className="w-4 h-4" aria-hidden="true" />
              {t('cashRegister.field.initialFloat', 'Fondo inicial')}
            </span>
            <span className="text-data-mono font-data-mono text-foreground">
              {formatPYG(session.initial_balance || 0)}
            </span>
          </div>
        </div>

        <Button variant="destructive" block onClick={onCloseJourney}>
          {t('cashRegister.action.closeJourney', 'Cerrar jornada')}
        </Button>
      </div>
    </div>
  );
}
