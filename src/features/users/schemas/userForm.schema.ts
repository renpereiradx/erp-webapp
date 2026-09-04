/**
 * Zod schema for the create/edit user form.
 * Create requires credentials + role; edit only updates profile fields
 * (backend contract: PUT /users/{id} accepts first_name, last_name, email, phone).
 */

import { z } from 'zod';

const PHONE_REGEX = /^\+?[0-9\s().-]{6,20}$/;

export type UserFormMode = 'create' | 'edit';

const profileFields = {
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().trim().email('Correo electrónico inválido'),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Teléfono inválido (ej. +595 9xx xxx xxx)')
    .or(z.literal('')),
};

const createFields = {
  username: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, punto, guion y guion bajo'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.string().min(1, 'Seleccioná un rol'),
};

export function getUserFormSchema(mode: UserFormMode) {
  if (mode === 'create') {
    return z.object({ ...profileFields, ...createFields });
  }
  // Edit: credentials fields stay in the form shape but are disabled and optional.
  return z.object({
    ...profileFields,
    username: z.string().optional(),
    password: z.string().optional(),
    role: z.string().optional(),
  });
}

export type UserFormValues = z.infer<ReturnType<typeof getUserFormSchema>>;

export const emptyUserForm: UserFormValues = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  role: '',
};
