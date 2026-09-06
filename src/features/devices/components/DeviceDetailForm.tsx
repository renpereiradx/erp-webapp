/**
 * DeviceDetailForm — detalle del workspace de terminales. Alta/edición con
 * validación Zod (domain/devices), rotación de código de emparejamiento y
 * baja con confirmación. Solo presentación: reglas en domain, estado en
 * useDevices (FASE E).
 */
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { branchService } from '@/features/branches/services/branchService';
import {
  deviceFormSchema, deviceFieldErrors, emptyDeviceForm,
  type DeviceFormValues,
} from '@/domain/devices/deviceForm';
import type { Device } from '@/features/devices/types';

interface DeviceDetailFormProps {
  /** Terminal en edición; null = alta. */
  device: Device | null;
  saving: boolean;
  deleting: boolean;
  onSave: (values: DeviceFormValues) => void;
  onDelete: (id: number) => void;
  onCancel: () => void;
}

const selectClasses =
  'w-full h-10 px-3 border border-border-subtle rounded-input bg-surface text-body-md text-foreground focus:ring-2 focus:ring-primary/20 outline-none hover:bg-surface-muted transition-colors disabled:bg-surface-subtle';

const DeviceDetailForm: React.FC<DeviceDetailFormProps> = ({
  device, saving, deleting, onSave, onDelete, onCancel,
}) => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const isNew = device === null;

  // key={selectedId} desde la página: el estado se re-inicializa por selección
  // sin efectos (rerender-derived-state-no-effect).
  const [values, setValues] = useState<DeviceFormValues>(() =>
    device
      ? {
          name: device.name,
          branch_id: device.branch_id ?? 0,
          is_active: device.is_active,
          regenerate_pairing_code: false,
        }
      : emptyDeviceForm(),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof DeviceFormValues, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const branchesQuery = useQuery({
    queryKey: ['branches', 'active'],
    queryFn: () => branchService.getBranches({ is_active: true, page_size: 200 }),
    staleTime: 5 * 60 * 1000,
    retry: false, // sin branches:read el select queda vacío
  });
  const branches = useMemo(() => branchesQuery.data?.branches ?? [], [branchesQuery.data]);

  const set = <K extends keyof DeviceFormValues>(field: K, value: DeviceFormValues[K]) =>
    setValues((v) => ({ ...v, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = deviceFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(deviceFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onSave(parsed.data);
  };

  const fieldError = (field: keyof DeviceFormValues) =>
    errors[field] ? <p className="text-body-md text-error">{t(errors[field]!, errors[field]!)}</p> : null;

  const copyCode = () => {
    if (!device) return;
    void navigator.clipboard?.writeText(device.pairing_code);
    addToast(t('devices.list.copied', 'Código copiado'), 'success');
  };

  return (
    <Card className="rounded-xl border-border-subtle shadow-fluent-2 h-full flex flex-col">
      <CardHeader className="bg-surface-muted/60 border-b border-border-subtle p-md">
        <CardTitle className="text-title-md text-foreground">
          {isNew ? t('devices.form.newTitle', 'Nueva terminal') : t('devices.form.editTitle', 'Editar terminal')}
        </CardTitle>
        {!isNew && (
          <CardDescription className="text-data-mono font-data-mono text-on-surface-deep">
            #{device.id}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-md flex-1 overflow-auto">
        <form className="space-y-md" onSubmit={handleSubmit}>
          <div className="space-y-xs">
            <Label htmlFor="device-name" className="text-body-md-bold text-foreground">{t('devices.form.name', 'Nombre')}</Label>
            <Input
              id="device-name"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={t('devices.form.namePlaceholder', 'Caja 1')}
              state={errors.name ? 'error' : ''}
            />
            {fieldError('name')}
          </div>

          <div className="space-y-xs">
            <Label htmlFor="device-branch" className="text-body-md-bold text-foreground">{t('devices.form.branch', 'Sucursal de la terminal')}</Label>
            <select
              id="device-branch"
              className={selectClasses}
              value={values.branch_id || ''}
              onChange={(e) => set('branch_id', Number(e.target.value))}
            >
              <option value="">{t('devices.form.branchPlaceholder', 'Seleccionar sucursal…')}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {fieldError('branch_id')}
            <p className="text-body-sm text-on-surface-deep">
              {t('devices.form.branchHint', 'Quienes operen esta terminal sin branches:switch entran directo a esta sucursal.')}
            </p>
          </div>

          {!isNew && device && (
            <div className="space-y-xs rounded-md border border-border-subtle bg-surface-muted p-md">
              <Label className="text-body-md-bold text-foreground">{t('devices.form.pairingCode', 'Código de emparejamiento')}</Label>
              <div className="flex items-center justify-between gap-sm">
                <span className="text-data-mono font-data-mono text-foreground" data-testid="device-pairing-code">
                  {device.pairing_code}
                </span>
                <Button type="button" variant="ghost" size="sm" className="size-8 p-0" aria-label={t('devices.list.copyCode', 'Copiar código de {name}', { name: device.name })} onClick={copyCode}>
                  <Copy size={14} />
                </Button>
              </div>
              <label className="flex items-center gap-sm text-body-md text-foreground cursor-pointer pt-xs">
                <Checkbox
                  className="shrink-0"
                  checked={values.regenerate_pairing_code}
                  onCheckedChange={(c) => set('regenerate_pairing_code', c === true)}
                />
                <span className="inline-flex items-center gap-xs">
                  <RefreshCw size={14} />
                  {t('devices.form.regenerateCode', 'Rotar código al guardar')}
                </span>
              </label>
            </div>
          )}

          <div className="space-y-sm pt-xs">
            <label className="flex items-center gap-sm text-body-md text-foreground cursor-pointer">
              <Checkbox className="shrink-0" checked={values.is_active} onCheckedChange={(c) => set('is_active', c === true)} />
              {t('devices.form.isActive', 'Activa')}
            </label>
          </div>

          {/* Footer de acciones: [delete] … [cancelar, guardar] */}
          <div className="flex flex-wrap items-center justify-between gap-sm pt-md border-t border-border-subtle">
            {!isNew && device && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-error hover:bg-error hover:text-on-error"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} /> {t('devices.form.delete', 'Eliminar')}
              </Button>
            )}
            <div className="flex gap-sm ml-auto">
              <Button type="button" variant="ghost" onClick={onCancel}>{t('devices.form.cancel', 'Cancelar')}</Button>
              <Button type="submit" variant="primary" loading={saving}>
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t('devices.form.saving', 'Guardando…')}
                  </>
                ) : (
                  t('devices.form.save', 'Guardar')
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>

      <ConfirmDialog
        open={confirmDelete}
        title={t('devices.delete.title', 'Eliminar terminal')}
        description={device ? t('devices.delete.confirm', '¿Eliminar la terminal "{name}"? Esta acción no se puede deshacer.', { name: device.name }) : ''}
        loading={deleting}
        onConfirm={() => {
          if (device) onDelete(device.id);
          setConfirmDelete(false);
        }}
        onOpenChange={setConfirmDelete}
      />
    </Card>
  );
};

export default DeviceDetailForm;
