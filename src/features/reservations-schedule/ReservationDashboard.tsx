import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CalendarOff, CalendarPlus, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useReservation } from '../../hooks/useReservation';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EnhancedModal from '@/components/ui/EnhancedModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ReservationForm } from './ReservationForm';
import { ReservationDetail } from './ReservationDetail';
import { ScheduleSettings } from './ScheduleSettings';
import { ScheduleSlot } from '../../domain/reservation';
import { getMaxConsecutiveDuration } from '../../domain/reservation/slotAvailability';

type PanelMode = 'closed' | 'new' | 'detail';

const RESERVATION_TYPES = [
  { id: 'normal', labelKey: 'reservations.type.normal' },
  { id: 'training', labelKey: 'reservations.type.training' },
  { id: 'match', labelKey: 'reservations.type.match' },
  { id: 'event', labelKey: 'reservations.type.event' },
];

const ReservationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    productId,
    setProductId,
    targetDate,
    setTargetDate,
    slots,
    config,
    loading,
    error,
    handleGenerateToday,
    createReservation,
    confirmReservation,
    cancelReservation,
    searchClients,
    products,
    updateConfig,
    refresh,
  } = useReservation();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [panelMode, setPanelMode] = useState<PanelMode>('closed');
  const [detailSlot, setDetailSlot] = useState<ScheduleSlot | null>(null);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);

  const currentProduct = products.find(p => (p.id || p.product_id) === productId);

  // Extraer precio del producto (puede estar en unit_prices o como campo directo)
  const extractPrice = (product: any): number => {
    if (product?.unit_prices && Array.isArray(product.unit_prices) && product.unit_prices.length > 0) {
      const firstPrice = product.unit_prices[0];
      return firstPrice.price_per_unit || firstPrice.unit_price || firstPrice.price || firstPrice.base_price || firstPrice.sale_price || 0;
    }
    return product?.base_price || product?.price || product?.unit_price || product?.price_per_unit || product?.sale_price || 0;
  };

  const productPricing = {
    base_rate: extractPrice(currentProduct) || 12000,
    lighting_fee: currentProduct?.lighting_fee || currentProduct?.lightingFee || 0,
    min_duration: currentProduct?.min_duration || 1,
    max_duration: currentProduct?.max_duration || 4,
  };

  const handleShowDetail = (slot: ScheduleSlot) => {
    setDetailSlot(slot);
    setPanelMode('detail');
  };

  const handleConfirm = async (reserveId: number) => {
    try {
      await confirmReservation(reserveId);
      toast.success(t('reservations.toasts.confirmedTitle'), { description: t('reservations.toasts.confirmedDesc') });
      if (panelMode === 'detail') setPanelMode('closed');
    } catch (err) {
      toast.error(t('reservations.errors.confirm'), { description: t('reservations.toasts.actionError') });
    }
  };

  // La acción real pide confirmación; la prop tipada del timeline espera Promise.
  const handleCancelRequest = (reserveId: number): Promise<void> => {
    setCancelTarget(reserveId);
    return Promise.resolve();
  };

  const handleCancelConfirmed = async () => {
    if (!cancelTarget) return;
    try {
      await cancelReservation(cancelTarget);
      toast.success(t('reservations.toasts.cancelledTitle'), { description: t('reservations.toasts.cancelledDesc') });
      if (panelMode === 'detail') setPanelMode('closed');
    } catch (err) {
      toast.error(t('reservations.errors.cancel'), { description: t('reservations.toasts.actionError') });
    } finally {
      setCancelTarget(null);
    }
  };

  const handleUpdateConfig = async (newConfig: any) => {
    try {
      await updateConfig(newConfig);
      toast.success(t('reservations.toasts.configSavedTitle'));
    } catch (err) {
      toast.error(t('reservations.errors.config'));
    }
  };

  const handleInvoice = (reserveId: number, clientId: string) => {
    navigate('/ventas', {
      state: {
        reserve_id: reserveId,
        client_id: clientId,
        product_id: productId
      }
    });
  };

  // Duración máxima desde el slot elegido (misma regla de dominio que usa el form).
  const maxAvailableDuration = getMaxConsecutiveDuration(slots, selectedSlot, productPricing.max_duration);

  const handleNewReservation = () => {
    if (!selectedSlot) {
      toast.warning(t('reservations.toasts.selectSlotTitle'), {
        description: t('reservations.toasts.selectSlotDesc'),
      });
      return;
    }

    if (maxAvailableDuration === 0) {
      toast.error(t('reservations.toasts.slotUnavailableTitle'), {
        description: t('reservations.toasts.slotUnavailableDesc'),
      });
      return;
    }

    setPanelMode('new');
  };

  const isNoSchedulesError = Boolean(error?.includes(t('reservations.errors.noSchedules')));

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-container-max space-y-xl px-md lg:px-lg pb-xl">
        <PageHeader
          title={t('reservations.title')}
          subtitle={t('reservations.subtitle')}
          actions={
            <Button variant="primary" onClick={handleNewReservation}>
              <CalendarPlus className="h-4 w-4" />
              {t('reservations.new')}
            </Button>
          }
        />

        {/* Controles: recurso + fecha + generación */}
        <section className="rounded-md bg-surface p-lg shadow-whisper">
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="space-y-xs">
              <Label htmlFor="agenda-resource" className="text-body-md-bold text-foreground">
                {t('reservations.controls.resource')}
              </Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="agenda-resource" className="rounded-input w-full" aria-label={t('reservations.controls.resource')}>
                  <SelectValue placeholder={products.length > 0 ? t('reservations.controls.resourcePlaceholder') : t('reservations.controls.loadingResources')} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-body-md">
                      {p.name || p.product_name || p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-xs">
              <Label htmlFor="agenda-date" className="text-body-md-bold text-foreground">
                {t('reservations.controls.date')}
              </Label>
              <Input
                id="agenda-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="text-data-mono font-data-mono"
              />
            </div>

            <div className="flex sm:col-span-2 lg:justify-end">
              <Button variant="secondary" onClick={handleGenerateToday} disabled={!productId}>
                <RefreshCw className="h-4 w-4" />
                {t('reservations.controls.generate')}
              </Button>
            </div>
          </div>
        </section>

        {/* Error de carga (no confundir con "no hay horarios": ese es empty state) */}
        {error && !isNoSchedulesError && (
          <ErrorState
            title={t('reservations.errors.loadTitle')}
            message={error}
            onRetry={refresh}
          />
        )}

        {/* Cronograma */}
        {!loading && slots.length === 0 && (!error || isNoSchedulesError) ? (
          <EmptyState
            icon={CalendarOff}
            title={t('reservations.empty.title')}
            description={t('reservations.empty.description')}
            actionLabel={t('reservations.empty.generate')}
            onAction={handleGenerateToday}
          />
        ) : (
          <ScheduleTimeline
            slots={slots}
            loading={loading}
            selectedSlot={selectedSlot}
            selectedDuration={selectedDuration}
            onSelectSlot={(time) => {
              setSelectedSlot(time);
              setPanelMode('new');
            }}
            onShowDetail={handleShowDetail}
            onConfirm={handleConfirm}
            onCancel={handleCancelRequest}
            onInvoice={handleInvoice}
          />
        )}

        {/* Ventana de generación */}
        <ScheduleSettings
          config={config}
          onSave={handleUpdateConfig}
        />
      </div>

      {/* Modal: nueva reserva */}
      <EnhancedModal
        isOpen={panelMode === 'new'}
        onClose={() => setPanelMode('closed')}
        title={t('reservations.form.title')}
        subtitle={t('reservations.form.subtitle')}
        size="md"
        // Las acciones viven dentro del <form> del wizard (receta §6.4).
        footer={undefined}
      >
        {panelMode === 'new' && (
          <ReservationForm
            selectedSlot={selectedSlot}
            slots={slots}
            productPricing={productPricing}
            reservationTypes={RESERVATION_TYPES}
            onSearchClients={searchClients}
            onDurationChange={setSelectedDuration}
            onCancel={() => setPanelMode('closed')}
            onSubmit={async (clientId, startTime, duration) => {
              try {
                await createReservation(clientId, startTime, duration);
                toast.success(t('reservations.toasts.createdTitle'), { description: t('reservations.toasts.createdDesc') });
                setPanelMode('closed');
              } catch (err) {
                // El hook ya surfaceó el mensaje específico; el toast es el eco de la acción.
                toast.error(t('reservations.errors.create'), { description: t('reservations.toasts.actionError') });
              }
            }}
          />
        )}
      </EnhancedModal>

      {/* Modal: detalle de reserva */}
      <EnhancedModal
        isOpen={panelMode === 'detail' && detailSlot !== null}
        onClose={() => setPanelMode('closed')}
        title={t('reservations.detail.title')}
        size="sm"
        // Las acciones contextuales del detalle van dentro del contenido.
        footer={undefined}
      >
        {panelMode === 'detail' && detailSlot && (
          <ReservationDetail
            slot={detailSlot}
            onConfirm={handleConfirm}
            onCancel={handleCancelRequest}
            onInvoice={handleInvoice}
            onClose={() => setPanelMode('closed')}
          />
        )}
      </EnhancedModal>

      {/* Confirmación de anulación (encima del modal de detalle) */}
      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
        title={t('reservations.cancelConfirm.title')}
        description={t('reservations.cancelConfirm.message')}
        onConfirm={handleCancelConfirmed}
      />
    </div>
  );
};

export default ReservationDashboard;
