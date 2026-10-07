import { z } from 'zod';

/**
 * Formulario de login. Los mensajes del schema son claves i18n; el dominio
 * no conoce el idioma (mismo patrón que party/clientForm.ts). Los mínimos
 * (3 / 6) reflejan las claves existentes login.validation.*.
 */
export const loginFormSchema = z.object({
  username: z
    .string()
    .min(1, 'login.validation.username.required')
    .min(3, 'login.validation.username.min'),
  password: z
    .string()
    .min(1, 'login.validation.password.required')
    .min(6, 'login.validation.password.min'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export type LoginField = 'username' | 'password';

/** Primer mensaje i18n por campo, listo para mostrarse bajo el input (§6.4). */
export type LoginFormErrors = Partial<Record<LoginField, string>>;

export const EMPTY_LOGIN_FORM: LoginFormValues = {
  username: '',
  password: '',
};

/**
 * Colapsa los issues de Zod al primer mensaje por campo. Zod evalúa los
 * checks en orden de declaración, así que en un campo vacío gana la clave
 * "required" sobre la de longitud mínima.
 */
export const fieldErrorsFromZod = (error: z.ZodError): LoginFormErrors => {
  const result: LoginFormErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if ((field === 'username' || field === 'password') && !result[field]) {
      result[field] = issue.message;
    }
  }
  return result;
};
