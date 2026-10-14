import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SearchableDropdown, { SearchableDropdownItem } from '@/components/ui/SearchableDropdown';
import { HighlightText } from '@/components/ui/HighlightText';
import { formatPYG } from '@/utils/currencyUtils';
import { ScheduleSlot } from '../../domain/reservation';
import { isSlotBookable, getMaxConsecutiveDuration } from '../../domain/reservation/slotAvailability';
import { formatSlotTime, formatSlotRangeEnd } from '../../domain/reservation/timeFormat';

interface ReservationType {
  id: string;
  labelKey: string;
}

interface ProductPricing {
  base_rate: number;
  lighting_fee?: number;
  min_duration?: number;
  max_duration?: number;
}

interface SelectedClient extends SearchableDropdownItem {
  document_id?: string;
}

interface ReservationFormProps {
  selectedSlot: string | null;
  /** Slots del día: alimentan la tira de selección de rango horario. */
  slots: ScheduleSlot[];
  productPricing: ProductPricing;
  reservationTypes?: ReservationType[];
  onSubmit: (clientId: string, startTime: string, duration: number, reservationType?: string) => Promise<void>;
  onSearchClients: (name: string) => Promise<any[]>;
  onDurationChange?: (duration: number) => void;
  onCancel: () => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  selectedSlot,
  slots,
  productPricing,
  reservationTypes = [],
  onSubmit,
  onSearchClients,
  onDurationChange,
  onCancel,
}) => {
  const { t } = useI18n();
  const [clientId, setClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [startTime, setStartTime] = useState(selectedSlot || '');
  const [duration, setDuration] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReservationType, setSelectedReservationType] = useState<string>('');

  const baseRate = productPricing?.base_rate || 0;
  const lightingFee = productPricing?.lighting_fee || 0;
  const productMaxDuration = productPricing?.max_duration || 4;

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [slots],
  );

  // Horas consecutivas libres desde el inicio elegido: techo de los chips de duración.
  const maxDuration = getMaxConsecutiveDuration(sortedSlots, startTime, productMaxDuration);

  useEffect(() => {
    if (reservationTypes.length > 0 && !selectedReservationType) {
      setSelectedReservationType(reservationTypes[0].id);
    }
  }, [reservationTypes, selectedReservationType]);

  const changeStartTime = (slotTime: string) => {
    if (slotTime === startTime) return;
    setStartTime(slotTime);
    setDuration(1);
    if (onDurationChange) onDurationChange(1);
  };

  const changeDuration = (val: number) => {
    setDuration(val);
    if (onDurationChange) onDurationChange(val);
  };

  const searchClients = async (term: string): Promise<SelectedClient[]> => {
    const results = (await onSearchClients(term)) || [];
    return results.map((c: any) => ({
      id: String(c.id),
      name: `${c.name || ''} ${c.last_name || ''}`.trim(),
      document_id: c.document_id,
    }));
  };

  const selectClient = (client: SelectedClient) => {
    setSelectedClient(client);
    setClientId(client.id);
  };

  const clearClient = () => {
    setSelectedClient(null);
    setClientId('');
  };

  const calculatedLightingFee = duration > 1.5 ? lightingFee : 0;
  const total = (baseRate * duration) + calculatedLightingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !clientId) return;

    setIsSubmitting(true);
    try {
      let d = startTime.replace(' ', 'T');
      if (!d.includes('Z') && !d.match(/[-+]\d{2}:\d{2}$/)) d += 'Z';
      const isoTime = new Date(d).toISOString().split('.')[0] + 'Z';
      await onSubmit(clientId, isoTime, duration, selectedReservationType);
      setClientId('');
      setSelectedClient(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSlotChip = (slot: ScheduleSlot) => {
    const bookable = isSlotBookable(slot);
    const isSelectedStart = slot.start_time === startTime;
    const slotIndex = sortedSlots.findIndex(s => s.start_time === slot.start_time);
    const startIndex = sortedSlots.findIndex(s => s.start_time === startTime);
    const inRange = !isSelectedStart && startIndex !== -1 && slotIndex > startIndex && slotIndex < startIndex + duration;

    const chipClass = isSelectedStart
      ? 'bg-primary text-on-primary border-primary'
      : inRange
        ? 'bg-primary-fixed text-foreground border-primary'
        : bookable
          ? 'bg-surface text-foreground border-border-subtle hover:border-primary'
          : 'bg-surface-subtle text-on-surface-deep border-border-subtle opacity-60 cursor-not-allowed';

    return (
      <button
        key={slot.id || slot.start_time}
        type="button"
        disabled={!bookable}
        onClick={() => changeStartTime(slot.start_time)}
        aria-pressed={isSelectedStart}
        className={`rounded-input border px-sm py-xs text-data-mono font-data-mono text-body-sm-bold transition-colors duration-150 ${chipClass}`}
      >
        {formatSlotTime(slot.start_time)}
      </button>
    );
  };

  const renderDurationChip = (hours: number) => {
    const available = hours <= maxDuration;
    const isSelected = duration === hours;

    return (
      <button
        key={hours}
        type="button"
        disabled={!available}
        onClick={() => changeDuration(hours)}
        aria-pressed={isSelected}
        className={`rounded-input border px-md py-xs text-data-mono font-data-mono text-body-sm-bold transition-colors duration-150 ${
          isSelected
            ? 'border-primary bg-primary-fixed text-foreground'
            : available
              ? 'border-border-subtle bg-surface text-foreground hover:border-primary'
              : 'border-border-subtle bg-surface-subtle text-on-surface-deep opacity-60 cursor-not-allowed'
        }`}
      >
        {t('reservations.form.durationHours', '{n} h', { n: hours })}
      </button>
    );
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit} className="space-y-md">
      {/* Cliente con buscador compartido */}
      <div className="space-y-xs">
        <Label htmlFor="reservation-client" className="text-body-md-bold text-foreground">
          {t('reservations.form.client')}
        </Label>
        {selectedClient ? (
          <div className="flex items-center gap-sm">
            <div className="flex min-w-0 items-center gap-xs rounded-full bg-primary-fixed py-1 pl-md pr-1">
              <span className="truncate text-body-sm-bold text-on-primary-fixed">
                {selectedClient.name}
              </span>
              <button
                type="button"
                onClick={clearClient}
                aria-label={t('reservations.form.clearClient')}
                className="flex size-5 shrink-0 items-center justify-center rounded-full hover:bg-primary-fixed-dim"
              >
                <X className="h-3 w-3 text-on-primary-fixed" />
              </button>
            </div>
            {selectedClient.document_id && (
              <span className="text-data-mono font-data-mono text-body-sm text-on-surface-deep">
                {selectedClient.document_id}
              </span>
            )}
          </div>
        ) : (
          <SearchableDropdown<SelectedClient>
            inputId="reservation-client"
            onSearch={searchClients}
            placeholder={t('reservations.form.clientPlaceholder')}
            minSearchLength={2}
            emptyMessage={t('reservations.form.clientEmpty')}
            renderItem={(item, _index, _isHighlighted, searchTerm) => (
              <div className="flex items-center justify-between gap-sm">
                <HighlightText text={item.name} term={searchTerm} />
                {item.document_id && (
                  <span className="text-data-mono font-data-mono text-body-sm text-on-surface-deep">
                    {item.document_id}
                  </span>
                )}
              </div>
            )}
            onSelect={selectClient}
          />
        )}
      </div>

      {/* Rango horario: tira de horas del día + duración */}
      <div className="space-y-sm rounded-md bg-surface-muted p-md">
        <div className="flex items-center justify-between gap-sm">
          <span className="text-label-caps uppercase text-on-surface-deep">
            {t('reservations.form.schedule')}
          </span>
          {startTime && (
            <span className="text-data-mono font-data-mono text-body-md-bold text-foreground">
              {formatSlotTime(startTime)} → {formatSlotRangeEnd(startTime, duration)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-xs">
          {sortedSlots.length > 0 ? (
            sortedSlots.map(renderSlotChip)
          ) : (
            <span className="text-body-sm text-on-surface-deep">{t('reservations.form.scheduleEmpty')}</span>
          )}
        </div>
        <p className="text-body-sm text-on-surface-deep">{t('reservations.form.scheduleHint')}</p>

        <div className="flex flex-wrap items-center gap-sm border-t border-divider pt-sm">
          <span className="text-label-caps uppercase text-on-surface-deep">
            {t('reservations.form.duration')}
          </span>
          <div className="flex flex-wrap gap-xs">
            {Array.from({ length: productMaxDuration }, (_, i) => i + 1).map(renderDurationChip)}
          </div>
        </div>
      </div>

      {/* Tipo de turno */}
      <div className="space-y-xs">
        <Label htmlFor="reservation-type" className="text-body-md-bold text-foreground">
          {t('reservations.form.type')}
        </Label>
        <Select value={selectedReservationType} onValueChange={setSelectedReservationType}>
          <SelectTrigger id="reservation-type" className="rounded-input w-full" aria-label={t('reservations.form.type')}>
            <SelectValue placeholder={t('reservations.form.type')} />
          </SelectTrigger>
          <SelectContent>
            {reservationTypes.map((type) => (
              <SelectItem key={type.id} value={type.id} className="text-body-md">
                {t(type.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desglose de precios */}
      <div className="space-y-sm rounded-md bg-surface-muted p-md">
        <div className="flex items-center justify-between">
          <span className="text-body-md text-on-surface-deep">
            {t('reservations.form.rateLine', 'Tarifa base ({duration} h × {rate}/h)', {
              duration,
              rate: formatPYG(baseRate),
            })}
          </span>
          <span className="text-data-mono font-data-mono text-body-md-bold text-foreground">
            {formatPYG(baseRate * duration)}
          </span>
        </div>
        {calculatedLightingFee > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-body-md text-on-surface-deep">{t('reservations.form.lightingFee')}</span>
            <span className="text-data-mono font-data-mono text-body-md-bold text-foreground">
              {formatPYG(calculatedLightingFee)}
            </span>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-divider pt-sm">
          <span className="text-label-caps uppercase text-foreground">{t('reservations.form.total')}</span>
          <span className="text-data-mono font-data-mono text-headline-lg-mobile text-primary">
            {formatPYG(total)}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-sm pt-sm">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel', 'Cancelar')}
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={!startTime || !clientId}>
          {t('reservations.form.confirm')}
        </Button>
      </div>
    </form>
  );
};
