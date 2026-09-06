/**
 * Reglas del formulario de terminales (lógica pura, sin React). Espejan las
 * validaciones del backend (internal/devices/service.go): nombre requerido,
 * sucursal requerida. Los mensajes son claves i18n ('devices.*') — el
 * formulario las resuelve con t() para respetar la regla "cero strings
 * hardcoded".
 */
import { z } from 'zod';

export const deviceFormSchema = z.object({
  name: z.string().trim().min(1, 'devices.form.nameRequired'),
  // 0 = sin elegir (el select vacío coercea a 0 y falla positive()).
  branch_id: z.coerce.number().int().positive('devices.form.branchRequired'),
  is_active: z.boolean(),
  regenerate_pairing_code: z.boolean(),
});

export type DeviceFormValues = z.infer<typeof deviceFormSchema>;

/** Errores de validación indexados por campo (primer mensaje por campo). */
export function deviceFieldErrors(error: z.ZodError): Partial<Record<keyof DeviceFormValues, string>> {
  const out: Partial<Record<keyof DeviceFormValues, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in out)) {
      out[field as keyof DeviceFormValues] = issue.message;
    }
  }
  return out;
}

/** Valores por defecto de una nueva terminal (igual que el backend). */
export function emptyDeviceForm(): DeviceFormValues {
  return {
    name: '',
    branch_id: 0,
    is_active: true,
    regenerate_pairing_code: false,
  };
}
