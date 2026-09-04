/**
 * PrinterDetailForm — detalle del workspace de impresoras. Alta/edición con
 * validación Zod (domain/printers), página de prueba y baja con confirmación.
 * Solo presentación: reglas en domain, estado en usePrinters.
 */
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useI18n } from '@/lib/i18n';
import { branchService } from '@/features/branches/services/branchService';
import {
  printerFormSchema, printerFieldErrors, emptyPrinterForm,
  PRINTER_PURPOSES, PRINTER_CODE_PAGES, PRINTER_WIDTHS,
  type PrinterFormValues,
} from '@/domain/printers/printerForm';
import type { Printer } from '@/features/printers/types';

interface PrinterDetailFormProps {
  /** Impresora en edición; null = alta. */
  printer: Printer | null;
  saving: boolean;
  testing: boolean;
  deleting: boolean;
  onSave: (values: PrinterFormValues) => void;
  onDelete: (id: number) => void;
  onTest: (id: number) => void;
  onCancel: () => void;
}

const selectClasses =
  'w-full h-10 px-3 border border-border-subtle rounded-input bg-surface text-body-md text-foreground focus:ring-2 focus:ring-primary/20 outline-none hover:bg-surface-muted transition-colors disabled:bg-surface-subtle';

const PrinterDetailForm: React.FC<PrinterDetailFormProps> = ({
  printer, saving, testing, deleting, onSave, onDelete, onTest, onCancel,
}) => {
  const { t } = useI18n();
  const isNew = printer === null;

  // key={selectedId} desde la página: el estado se re-inicializa por selección
  // sin efectos (rerender-derived-state-no-effect).
  const [values, setValues] = useState<PrinterFormValues>(() =>
    printer ? { ...printer, branch_id: printer.branch_id ?? null } : emptyPrinterForm(),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof PrinterFormValues, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const branchesQuery = useQuery({
    queryKey: ['branches', 'active'],
    queryFn: () => branchService.getBranches({ is_active: true, page_size: 200 }),
    staleTime: 5 * 60 * 1000,
    retry: false, // sin branches:read el select queda en "todas las sucursales"
  });
  const branches = useMemo(() => branchesQuery.data?.branches ?? [], [branchesQuery.data]);

  const set = <K extends keyof PrinterFormValues>(field: K, value: PrinterFormValues[K]) =>
    setValues((v) => ({ ...v, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = printerFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(printerFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onSave(parsed.data);
  };

  const fieldError = (field: keyof PrinterFormValues) =>
    errors[field] ? <p className="text-body-md text-error">{t(errors[field]!, errors[field]!)}</p> : null;

  return (
    <Card className="rounded-xl border-border-subtle shadow-fluent-2 h-full flex flex-col">
      <CardHeader className="bg-surface-muted/60 border-b border-border-subtle p-md">
        <CardTitle className="text-title-md text-foreground">
          {isNew ? t('printers.form.newTitle', 'Nueva impresora') : t('printers.form.editTitle', 'Editar impresora')}
        </CardTitle>
        {!isNew && (
          <CardDescription className="text-data-mono font-data-mono text-on-surface-deep">
            {printer.host}:{printer.port} · {printer.connection}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-md flex-1 overflow-auto">
        <form className="space-y-md" onSubmit={handleSubmit}>
          <div className="space-y-xs">
            <Label htmlFor="printer-name" className="text-body-md-bold text-foreground">{t('printers.form.name', 'Nombre')}</Label>
            <Input
              id="printer-name"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={t('printers.form.namePlaceholder', 'Caja 1')}
              state={errors.name ? 'error' : ''}
            />
            {fieldError('name')}
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-xs">
              <Label htmlFor="printer-host" className="text-body-md-bold text-foreground">{t('printers.form.host', 'Host / IP')}</Label>
              <Input
                id="printer-host"
                value={values.host}
                onChange={(e) => set('host', e.target.value)}
                placeholder={t('printers.form.hostPlaceholder', '192.168.1.50')}
                className="font-data-mono text-data-mono"
                state={errors.host ? 'error' : ''}
              />
              {fieldError('host')}
            </div>
            <div className="space-y-xs">
              <Label htmlFor="printer-port" className="text-body-md-bold text-foreground">{t('printers.form.port', 'Puerto')}</Label>
              <Input
                id="printer-port"
                type="number"
                min={1}
                max={65535}
                value={values.port}
                onChange={(e) => set('port', Number(e.target.value))}
                className="font-data-mono text-data-mono"
                state={errors.port ? 'error' : ''}
              />
              {fieldError('port')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-xs">
              <Label htmlFor="printer-purpose" className="text-body-md-bold text-foreground">{t('printers.form.purpose', 'Destino')}</Label>
              <select
                id="printer-purpose"
                className={selectClasses}
                value={values.purpose}
                onChange={(e) => set('purpose', e.target.value as PrinterFormValues['purpose'])}
              >
                {PRINTER_PURPOSES.map((p) => (
                  <option key={p} value={p}>{t(`printers.purpose.${p}`, p)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-xs">
              <Label htmlFor="printer-width" className="text-body-md-bold text-foreground">{t('printers.form.width', 'Ancho de papel')}</Label>
              <select
                id="printer-width"
                className={selectClasses}
                value={values.width_mm}
                onChange={(e) => set('width_mm', Number(e.target.value) as PrinterFormValues['width_mm'])}
              >
                {PRINTER_WIDTHS.map((w) => (
                  <option key={w} value={w}>{t(`printers.width.${w}`, `${w} mm`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-xs">
              <Label htmlFor="printer-codepage" className="text-body-md-bold text-foreground">{t('printers.form.codePage', 'Tabla de caracteres')}</Label>
              <select
                id="printer-codepage"
                className={selectClasses}
                value={values.code_page}
                onChange={(e) => set('code_page', e.target.value as PrinterFormValues['code_page'])}
              >
                {PRINTER_CODE_PAGES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-xs">
              <Label htmlFor="printer-branch" className="text-body-md-bold text-foreground">{t('printers.form.branch', 'Sucursal')}</Label>
              <select
                id="printer-branch"
                className={selectClasses}
                value={values.branch_id ?? ''}
                onChange={(e) => set('branch_id', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t('printers.form.branchAny', 'Todas las sucursales')}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-sm pt-xs">
            <label className="flex items-center gap-sm text-body-md text-foreground cursor-pointer">
              <Checkbox className="shrink-0" checked={values.is_active} onCheckedChange={(c) => set('is_active', c === true)} />
              {t('printers.form.isActive', 'Activa')}
            </label>
            <label className="flex items-center gap-sm text-body-md text-foreground cursor-pointer">
              <Checkbox className="shrink-0" checked={values.is_default} onCheckedChange={(c) => set('is_default', c === true)} />
              {t('printers.form.isDefault', 'Predeterminada para recibos')}
            </label>
            <label className="flex items-center gap-sm text-body-md text-foreground cursor-pointer">
              <Checkbox className="shrink-0" checked={values.kick_drawer} onCheckedChange={(c) => set('kick_drawer', c === true)} />
              {t('printers.form.kickDrawer', 'Abrir cajón monedero al imprimir')}
            </label>
          </div>

          {/* Footer de acciones: [test/delete] … [cancelar, guardar] */}
          <div className="flex flex-wrap items-center justify-between gap-sm pt-md border-t border-border-subtle">
            <div className="flex gap-sm">
              {!isNew && printer && (
                <>
                  <Button type="button" variant="secondary" size="sm" onClick={() => onTest(printer.id)} disabled={testing}>
                    {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {t('printers.form.test', 'Página de prueba')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-error hover:bg-error hover:text-on-error"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={14} /> {t('printers.form.delete', 'Eliminar')}
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-sm ml-auto">
              <Button type="button" variant="ghost" onClick={onCancel}>{t('printers.form.cancel', 'Cancelar')}</Button>
              <Button type="submit" variant="primary" loading={saving}>
                {saving ? t('printers.form.saving', 'Guardando…') : t('printers.form.save', 'Guardar')}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>

      <ConfirmDialog
        open={confirmDelete}
        title={t('printers.delete.title', 'Eliminar impresora')}
        description={printer ? t('printers.delete.confirm', '¿Eliminar la impresora "{name}"? Esta acción no se puede deshacer.', { name: printer.name }) : ''}
        loading={deleting}
        onConfirm={() => {
          if (printer) onDelete(printer.id);
          setConfirmDelete(false);
        }}
        onOpenChange={setConfirmDelete}
      />
    </Card>
  );
};

export default PrinterDetailForm;
