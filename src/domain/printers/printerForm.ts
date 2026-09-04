/**
 * Reglas del formulario de impresoras (lógica pura, sin React). Espejan las
 * validaciones del backend (internal/documents/service.go): nombre y host
 * requeridos, puerto 1-65535, papel 58/80 mm, code pages ESC/POS soportadas.
 * Los mensajes son claves i18n ('printers.*') — el formulario las resuelve
 * con t() para respetar la regla "cero strings hardcoded".
 */
import { z } from 'zod';

export const PRINTER_PURPOSES = ['RECEIPT', 'KITCHEN', 'BAR'] as const;
export const PRINTER_CODE_PAGES = ['CP858', 'CP850', 'CP437'] as const;
export const PRINTER_WIDTHS = [58, 80] as const;

export const printerFormSchema = z.object({
  name: z.string().trim().min(1, 'printers.form.nameRequired'),
  host: z.string().trim().min(1, 'printers.form.hostRequired'),
  port: z.coerce
    .number()
    .int()
    .min(1, 'printers.form.portInvalid')
    .max(65535, 'printers.form.portInvalid'),
  purpose: z.enum(PRINTER_PURPOSES),
  width_mm: z.union([z.literal(58), z.literal(80)], {
    message: 'printers.form.widthInvalid', // inalcanzable en la UI (select cerrado)
  }),
  code_page: z.enum(PRINTER_CODE_PAGES),
  branch_id: z.number().int().positive().nullable(),
  kick_drawer: z.boolean(),
  is_default: z.boolean(),
  is_active: z.boolean(),
});

export type PrinterFormValues = z.infer<typeof printerFormSchema>;

/** Errores de validación indexados por campo (primer mensaje por campo). */
export function printerFieldErrors(error: z.ZodError): Partial<Record<keyof PrinterFormValues, string>> {
  const out: Partial<Record<keyof PrinterFormValues, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in out)) {
      out[field as keyof PrinterFormValues] = issue.message;
    }
  }
  return out;
}

/** Valores por defecto de una nueva impresora (igual que el backend). */
export function emptyPrinterForm(): PrinterFormValues {
  return {
    name: '',
    host: '',
    port: 9100,
    purpose: 'RECEIPT',
    width_mm: 80,
    code_page: 'CP858',
    branch_id: null,
    kick_drawer: false,
    is_default: false,
    is_active: true,
  };
}
