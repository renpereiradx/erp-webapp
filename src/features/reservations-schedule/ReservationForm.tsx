import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  productPricing: ProductPricing;
  maxAvailableDuration?: number;
  reservationTypes?: ReservationType[];
  onSubmit: (clientId: string, startTime: string, duration: number, reservationType?: string) => Promise<void>;
  onSearchClients: (name: string) => Promise<any[]>;
  onDurationChange?: (duration: number) => void;
  onCancel: () => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  selectedSlot,
  productPricing,
  maxAvailableDuration,
  reservationTypes = [],
  onSubmit,
  onSearchClients,
  onDurationChange,
  onCancel,
}) => {
  const { t } = useI18n();
  const [clientId, setClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [duration, setDuration] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(selectedSlot || '');
  const [selectedReservationType, setSelectedReservationType] = useState<string>('');

  const baseRate = productPricing?.base_rate || 0;
  const lightingFee = productPricing?.lighting_fee || 0;
  const minDuration = productPricing?.min_duration || 1;
  const productMaxDuration = productPricing?.max_duration || 4;
  const effectiveMaxDuration = Math.min(maxAvailableDuration || productMaxDuration, productMaxDuration);
  const showDurationWarning = duration > (maxAvailableDuration || 4);

  useEffect(() => {
    if (selectedSlot) {
      setStartTime(selectedSlot);
    }
  }, [selectedSlot]);

  useEffect(() => {
    if (reservationTypes.length > 0 && !selectedReservationType) {
      setSelectedReservationType(reservationTypes[0].id);
    }
  }, [reservationTypes, selectedReservationType]);

  const calculatedLightingFee = duration > 1.5 ? lightingFee : 0;
  const total = (baseRate * duration) + calculatedLightingFee;

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

  const handleDurationChange = (val: number) => {
    setDuration(val);
    if (onDurationChange) onDurationChange(val);
  };

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

  const formatDateTimeForInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      // Si la fecha ya viene con T, la parseamos tal cual
      // Si viene con espacio, lo cambiamos a T
      let d = dateStr.replace(' ', 'T');
      // Removemos la Z para que new Date lo interprete como hora local y no haga desfase
      d = d.replace('Z', '');
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <div className="space-y-xs">
          <Label htmlFor="reservation-start" className="text-body-md-bold text-foreground">
            {t('reservations.form.startTime')}
          </Label>
          <Input
            id="reservation-start"
            type="datetime-local"
            value={formatDateTimeForInput(startTime)}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
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
      </div>

      {/* Duración */}
      <div className="space-y-sm rounded-md bg-surface-muted p-md">
        <div className="flex items-center justify-between">
          <span className="text-label-caps uppercase text-on-surface-deep">
            {t('reservations.form.duration')}
          </span>
          <span className={`rounded-input bg-surface px-sm py-xs text-data-mono font-data-mono text-body-md-bold ${showDurationWarning ? 'text-error' : 'text-primary'}`}>
            {t('reservations.form.durationHours', '{n} h', { n: duration })}
          </span>
        </div>
        <Slider
          className="w-full"
          defaultValue={[duration]}
          min={minDuration}
          max={effectiveMaxDuration}
          step={1}
          value={[duration]}
          onValueChange={(values: number[]) => handleDurationChange(values[0])}
          aria-label={t('reservations.form.duration')}
        />
        <div className="flex justify-between text-body-sm-bold text-on-surface-deep">
          <span>{t('reservations.form.durationHours', '{n} h', { n: minDuration })}</span>
          <span>{t('reservations.form.durationMax', '{max} h máx.', { max: effectiveMaxDuration })}</span>
        </div>
        {showDurationWarning && (
          <p className="rounded-input bg-error-container px-md py-sm text-body-sm-bold text-on-error-container">
            {t('reservations.form.durationWarning', 'No hay suficientes horarios consecutivos libres para {max} h.', { max: maxAvailableDuration || 4 })}
          </p>
        )}
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
