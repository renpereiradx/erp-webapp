import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Plus, Wallet } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ToastContainer from '@/components/ui/ToastContainer';
import type { Movement } from '@/store/useCashRegisterStore';
import { useToast } from '@/hooks/useToast';
import { formatPYG, systemBalanceOf } from '@/domain/cash-register/format';
import {
  MovementsFilterPanel,
  MovementsTable,
  RegisterMovementModal,
  VoidMovementModal,
  MOVEMENT_CONCEPTS,
  isVoidableMovement,
  useCashMovements,
  type MovementDirection,
  type RegisterMovementPayload,
} from '@/features/cash-register';

/**
 * /movimientos-caja — Movimientos manuales de la caja activa.
 * Thin page shell: data/actions come from useCashMovements; UI from feature components.
 */
export default function CashMovements() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addToast, toasts, removeToast } = useToast();

  const {
    activeCashRegister,
    isActiveCashRegisterLoading,
    activeCashRegisterError,
    movements,
    isMovementsLoading,
    movementsError,
    filters,
    hasActiveFilters,
    setFilter,
    applyFilters,
    clearFilters,
    isVoiding,
    createMovement,
    voidMovement,
    refresh,
  } = useCashMovements();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Movement | null>(null);

  /** Resolves a concept id into its translated label; injected into the hook to keep it UI-free. */
  const translateConcept = (direction: MovementDirection, conceptId: string): string => {
    const concept = MOVEMENT_CONCEPTS[direction].find(c => c.id === conceptId);
    return concept ? t(concept.labelKey, conceptId) : conceptId;
  };

  const handleCreateMovement = async (payload: RegisterMovementPayload) => {
    const result = await createMovement({ ...payload, translateConcept });
    if (result.ok) {
      addToast(t('cashMovement.success', 'Movimiento registrado con éxito'), 'success');
      setIsRegisterOpen(false);
    } else {
      addToast(
        result.error
          ? t(result.error, result.error)
          : t('cashMovement.error.generic', 'Error al registrar el movimiento'),
        'error'
      );
    }
    return result;
  };

  const handleVoidMovement = async (movementId: number, reason: string) => {
    const result = await voidMovement(movementId, reason);
    if (result.ok) {
      addToast(t('cashMovement.void.success', 'Movimiento anulado correctamente'), 'success');
      setVoidTarget(null);
    } else {
      addToast(
        result.error
          ? t(result.error, result.error)
          : t('cashMovement.void.error', 'Error al anular el movimiento'),
        'error'
      );
    }
    return result;
  };

  const handleClearFilters = () => {
    clearFilters();
    setIsFiltersOpen(false);
  };

  if (isActiveCashRegisterLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg py-xl">
          <GenericSkeletonList count={4} data-testid="cash-movements-loading" />
        </div>
      </div>
    );
  }

  if (activeCashRegisterError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg py-xl">
          <ErrorState
            title={t('cashMovement.error.title', 'No se pudo completar el registro')}
            message={t('cashMovement.error.loadingCashRegister', 'Error al cargar la caja registradora')}
            onRetry={refresh}
          />
        </div>
      </div>
    );
  }

  if (!activeCashRegister) {
    return (
      <div className="min-h-screen bg-background">
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg py-xl">
          <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
            <EmptyState
              icon={Wallet}
              title={t('cashMovement.noCashRegister.title', 'No hay caja activa')}
              description={t(
                'cashMovement.noCashRegister.description',
                'Debe abrir una caja registradora para ver y registrar movimientos.'
              )}
              actionLabel={t('cashMovement.noCashRegister.action', 'Ir a Caja Registradora')}
              onAction={() => navigate('/caja-registradora')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('cashMovement.pageTitle', 'Movimientos de Caja')}
          title={t('cashMovement.pageTitle', 'Movimientos de Caja')}
          subtitle={
            <span className="inline-flex items-center gap-sm">
              <span className="inline-flex items-center gap-xs">
                <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
                <span className="text-body-md-bold text-foreground">{activeCashRegister.name}</span>
              </span>
              <span className="text-on-surface-deep" aria-hidden="true">
                |
              </span>
              <span className="text-body-md text-on-surface-deep">
                {t('cashMovement.currentBalance', 'Saldo')}:{' '}
                <span className="text-data-mono font-data-mono text-foreground">
                  {formatPYG(systemBalanceOf(activeCashRegister))}
                </span>
              </span>
            </span>
          }
          actions={
            <>
              <Button
                variant={hasActiveFilters ? 'filter' : 'secondary'}
                onClick={() => setIsFiltersOpen(open => !open)}
              >
                <Filter className="w-4 h-4 mr-xs" aria-hidden="true" />
                {t('cashMovement.page.filter', 'Filtros')}
              </Button>
              <Button variant="primary" onClick={() => setIsRegisterOpen(true)}>
                <Plus className="w-4 h-4 mr-xs" aria-hidden="true" />
                {t('cashMovement.page.register', 'Registrar movimiento')}
              </Button>
            </>
          }
        />

        {isFiltersOpen && (
          <section className="mt-lg animate-in slide-in-from-top-2 duration-200">
            <MovementsFilterPanel
              filters={filters}
              onFilterChange={setFilter}
              onApply={() => {
                applyFilters();
                setIsFiltersOpen(false);
              }}
              onClear={handleClearFilters}
            />
          </section>
        )}

        <section className="mt-lg bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
          {isMovementsLoading ? (
            <div className="p-lg">
              <GenericSkeletonList count={6} data-testid="movements-loading" />
            </div>
          ) : movementsError ? (
            <ErrorState
              title={t('cashMovement.error.title', 'No se pudo completar el registro')}
              message={t('cashMovement.error.loadingMovements', 'Error al cargar los movimientos')}
              onRetry={refresh}
            />
          ) : movements.length === 0 ? (
            <EmptyState
              icon={Filter}
              title={t('cashMovement.empty.title', 'Sin resultados')}
              description={t(
                'cashMovement.empty.description',
                'No se encontraron movimientos registrados con los filtros actuales.'
              )}
              actionLabel={
                hasActiveFilters
                  ? t('cashMovement.empty.seeAll', 'Ver todos los movimientos')
                  : t('cashMovement.page.register', 'Registrar movimiento')
              }
              onAction={hasActiveFilters ? clearFilters : () => setIsRegisterOpen(true)}
            />
          ) : (
            <MovementsTable movements={movements} onVoid={setVoidTarget} />
          )}
        </section>
      </div>

      <RegisterMovementModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={handleCreateMovement}
      />

      <VoidMovementModal
        movement={isVoidableMovement(voidTarget) ? voidTarget : null}
        isVoiding={isVoiding}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleVoidMovement}
      />
    </div>
  );
}
