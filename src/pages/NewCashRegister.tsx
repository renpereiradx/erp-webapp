import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import ToastContainer from '@/components/ui/ToastContainer';
import useDashboardStore from '@/store/useDashboardStore';
import { useToast } from '@/hooks/useToast';
import {
  CashRegisterStatusCard,
  CloseSessionForm,
  OpenSessionForm,
  useCashRegisterSession,
  type OpenSessionInput,
} from '@/features/cash-register';

type SessionTab = 'open' | 'close';

const SESSION_TABS: ReadonlyArray<{ id: SessionTab; labelKey: string; fallback: string }> = [
  { id: 'open', labelKey: 'cashRegister.tab.openPanel', fallback: 'Apertura de caja' },
  { id: 'close', labelKey: 'cashRegister.tab.closePanel', fallback: 'Cierre de caja' },
];

/**
 * /caja-registradora — Apertura y Cierre de la jornada de caja.
 * Thin page shell: session data comes from the feature hook, UI from feature components.
 */
export default function NewCashRegister() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const fetchDashboardData = useDashboardStore(state => state.fetchDashboardData);
  const { addToast, toasts, removeToast } = useToast();

  const {
    activeCashRegister,
    activeCashRegisterError,
    isActiveCashRegisterLoading,
    isOpeningCashRegister,
    isClosingCashRegister,
    openCashRegister,
    closeCashRegister,
    refreshActive,
  } = useCashRegisterSession();

  const [activeTab, setActiveTab] = useState<SessionTab>('open');
  const [openError, setOpenError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  const handleOpen = async (input: OpenSessionInput) => {
    setOpenError(null);
    try {
      await openCashRegister(input);
      addToast(t('cashRegister.success.opened', 'Caja registradora abierta exitosamente'), 'success');
      fetchDashboardData();
      refreshActive();
    } catch (error) {
      setOpenError(
        error instanceof Error && error.message
          ? error.message
          : t('cashRegister.error.opening', 'Error al abrir la caja registradora')
      );
    }
  };

  const handleClose = async (input: { final_balance: number; notes: string | null }) => {
    setCloseError(null);
    if (!activeCashRegister) {
      setCloseError(t('cashRegister.error.noActiveSession', 'No hay caja activa'));
      return;
    }
    if (!activeCashRegister.id) {
      setCloseError(t('cashRegister.error.noSessionId', 'No se pudo identificar la caja activa para cerrarla'));
      return;
    }
    try {
      await closeCashRegister(activeCashRegister.id, input);
      addToast(t('cashRegister.success.closed', 'Caja registradora cerrada exitosamente'), 'success');
      fetchDashboardData();
      setActiveTab('open');
      refreshActive();
    } catch (error) {
      setCloseError(
        error instanceof Error && error.message
          ? error.message
          : t('cashRegister.error.closing', 'Error al cerrar la caja registradora')
      );
    }
  };

  if (isActiveCashRegisterLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg py-xl">
          <GenericSkeletonList count={4} data-testid="cash-register-loading" />
        </div>
      </div>
    );
  }

  if (activeCashRegisterError) {
    return (
      <div className="min-h-screen bg-background">
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg py-xl">
          <ErrorState
            title={t('cashRegister.error.loadTitle', 'No se pudo cargar la caja')}
            message={t('cashRegister.error.loadingCashRegister', 'Error al cargar la caja registradora')}
            onRetry={refreshActive}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('cashRegister.title', 'Caja')}
          title={t('cashRegister.page.title', 'Jornada de caja')}
          subtitle={t(
            'cashRegister.page.subtitle',
            'Control de apertura y cierre de terminales de punto de venta.'
          )}
          actions={
            <Button variant="ghost" onClick={() => navigate('/movimientos-caja')}>
              {t('cashRegister.action.seeMovements', 'Ver movimientos')}
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start mt-lg">
          <aside className="lg:col-span-4">
            <CashRegisterStatusCard
              session={activeCashRegister}
              onCloseJourney={() => setActiveTab('close')}
            />
          </aside>

          <section className="lg:col-span-8 bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
            <div
              className="flex border-b border-divider px-sm pt-sm bg-surface-muted"
              role="tablist"
              aria-label={t('cashRegister.page.title', 'Jornada de caja')}
            >
              {SESSION_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`cash-session-tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`cash-session-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-lg py-md text-body-sm-bold border-b-2 transition-colors duration-150 rounded-t-md ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-surface'
                      : 'border-transparent text-on-surface-deep hover:text-foreground'
                  }`}
                >
                  {t(tab.labelKey, tab.fallback)}
                </button>
              ))}
            </div>

            <div className="p-lg">
              {activeTab === 'open' ? (
                <div
                  className="animate-in fade-in duration-150"
                  role="tabpanel"
                  id="cash-session-panel-open"
                  aria-labelledby="cash-session-tab-open"
                >
                  <OpenSessionForm
                    hasActiveSession={!!activeCashRegister}
                    isOpening={isOpeningCashRegister}
                    onOpen={handleOpen}
                  />
                  {openError && (
                    <p className="mt-md p-sm bg-error-container text-on-error-container rounded-md text-body-md-bold" role="alert">
                      {openError}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  className="animate-in fade-in duration-150"
                  role="tabpanel"
                  id="cash-session-panel-close"
                  aria-labelledby="cash-session-tab-close"
                >
                  {activeCashRegister ? (
                    <>
                      <CloseSessionForm
                        session={activeCashRegister}
                        isClosing={isClosingCashRegister}
                        onCloseJourney={handleClose}
                        onCancel={() => setActiveTab('open')}
                      />
                      {closeError && (
                        <p className="mt-md p-sm bg-error-container text-on-error-container rounded-md text-body-md-bold" role="alert">
                          {closeError}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="py-xl flex flex-col items-center justify-center text-center">
                      <h3 className="text-title-md text-foreground mb-sm">
                        {t('cashRegister.close.noTerminalTitle', 'No hay terminal activa')}
                      </h3>
                      <p className="text-body-md text-on-surface-deep max-w-sm mb-lg">
                        {t(
                          'cashRegister.close.noTerminalDesc',
                          'Debe existir una jornada operativa abierta para poder realizar el cierre.'
                        )}
                      </p>
                      <Button variant="primary" onClick={() => setActiveTab('open')}>
                        {t('cashRegister.close.goToOpen', 'Ir a Apertura')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
