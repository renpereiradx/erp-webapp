import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductScheduleConfig } from '../../domain/reservation';

interface ScheduleSettingsProps {
  config: ProductScheduleConfig | null;
  onSave: (config: any) => Promise<void>;
}

export const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({ config, onSave }) => {
  const { t } = useI18n();
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(23);
  const [timezone, setTimezone] = useState('America/Asuncion');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setStartHour(config.start_hour);
      setEndHour(config.end_hour);
      setTimezone(config.timezone);
      setIsActive(config.is_active);
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        start_hour: startHour,
        end_hour: endHour,
        timezone,
        is_active: isActive
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hourInput = (id: string, label: string, value: number, setValue: (v: number) => void, min: number, max: number) => (
    <div className="space-y-xs">
      <Label htmlFor={id} className="text-body-md-bold text-foreground">{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10) || 0)}
        className="text-data-mono font-data-mono"
      />
    </div>
  );

  return (
    <section className="rounded-md bg-surface p-lg shadow-whisper">
      <div className="mb-md flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-xs">
          <h3 className="text-title-md text-foreground">{t('reservations.settings.title')}</h3>
          <p className="text-body-md text-on-surface-deep">{t('reservations.settings.description')}</p>
        </div>
        <Button variant="secondary" onClick={handleSave} loading={isSaving}>
          {t('reservations.settings.save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
        {hourInput(
          'schedule-start-hour',
          t('reservations.settings.startHour'),
          startHour,
          setStartHour,
          0,
          23,
        )}
        {hourInput(
          'schedule-end-hour',
          t('reservations.settings.endHour'),
          endHour,
          setEndHour,
          1,
          24,
        )}
        <div className="space-y-xs">
          <Label htmlFor="schedule-timezone" className="text-body-md-bold text-foreground">
            {t('reservations.settings.timezone')}
          </Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="schedule-timezone" className="rounded-input w-full" aria-label={t('reservations.settings.timezone')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Asuncion" className="text-body-md">
                {t('reservations.settings.tzPY')}
              </SelectItem>
              <SelectItem value="America/Bogota" className="text-body-md">
                {t('reservations.settings.tzBOG')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-sm rounded-md border border-border-subtle px-md py-sm sm:justify-start sm:py-0">
          <Label htmlFor="schedule-active" className="text-body-md-bold text-foreground">
            {t('reservations.settings.active')}
          </Label>
          <Switch
            id="schedule-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>
    </section>
  );
};
