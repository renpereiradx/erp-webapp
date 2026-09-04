import { Plus, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Movement } from '@/store/useCashRegisterStore';
import { formatDateTimeEs, formatPYG } from '@/domain/cash-register/format';

interface MovementsTableProps {
  movements: Movement[];
  onVoid: (movement: Movement) => void;
}

/** Movements list for /movimientos-caja (DESIGN §6.3). */
export function MovementsTable({ movements, onVoid }: MovementsTableProps) {
  const { t } = useI18n();

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
          <TableHead className="text-label-caps uppercase text-on-surface-deep w-40">
            {t('cashMovement.table.dateTime', 'Fecha y Hora')}
          </TableHead>
          <TableHead className="text-label-caps uppercase text-on-surface-deep">
            {t('cashMovement.table.concept', 'Concepto')}
          </TableHead>
          <TableHead className="text-label-caps uppercase text-on-surface-deep">
            {t('cashMovement.table.user', 'Usuario')}
          </TableHead>
          <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
            {t('cashMovement.table.amount', 'Monto')}
          </TableHead>
          <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
            {t('cashMovement.table.balance', 'Balance')}
          </TableHead>
          <TableHead className="w-12" aria-label={t('cashMovement.table.actions', 'Acciones')} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map(movement => {
          const isIncome = movement.movement_type === 'INCOME';
          const isVoided = !!movement.voided_at;

          return (
            <TableRow
              key={movement.movement_id ?? movement.id}
              className={`hover:bg-surface-muted transition-colors duration-150 group ${
                isVoided ? 'opacity-60' : ''
              }`}
            >
              <TableCell className="text-data-mono font-data-mono text-foreground whitespace-nowrap">
                {formatDateTimeEs(movement.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-xs">
                  <span
                    className={`flex items-center gap-xs text-body-md-bold text-foreground ${
                      isVoided ? 'line-through' : ''
                    }`}
                  >
                    {!isVoided && (
                      <span
                        className={isIncome ? 'text-success' : 'text-error'}
                        aria-hidden="true"
                      >
                        {isIncome ? <Plus className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </span>
                    )}
                    {movement.concept}
                  </span>
                  {isVoided && (
                    <span className="text-body-sm-bold text-error bg-error/10 px-xs rounded-xs inline-block max-w-max">
                      {t('cashMovement.table.voided', 'Anulado: {reason}', {
                        reason: movement.void_reason || '',
                      })}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-body-md text-foreground">
                {movement.user_full_name || t('cashMovement.user.system', 'Sistema')}
              </TableCell>
              <TableCell
                className={`text-right text-data-mono font-data-mono ${
                  isVoided
                    ? 'text-on-surface-deep'
                    : isIncome
                      ? 'text-success'
                      : 'text-error'
                }`}
              >
                {isIncome ? '+' : '-'}
                {formatPYG(movement.amount)}
              </TableCell>
              <TableCell className="text-right text-data-mono font-data-mono text-foreground">
                {formatPYG(movement.running_balance || 0)}
              </TableCell>
              <TableCell className="text-center">
                {!isVoided && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onVoid(movement)}
                    aria-label={t('cashMovement.void.button', 'Anular')}
                    title={t('cashMovement.table.voidAction', 'Anular Movimiento')}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100 text-on-surface-deep hover:text-error"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
