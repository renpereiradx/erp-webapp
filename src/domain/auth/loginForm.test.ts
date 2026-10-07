import { describe, it, expect } from 'vitest';
import {
  EMPTY_LOGIN_FORM,
  fieldErrorsFromZod,
  loginFormSchema,
} from './loginForm';

describe('loginFormSchema', () => {
  it('acepta credenciales con los mínimos cumplidos', () => {
    const parsed = loginFormSchema.safeParse({
      username: 'admin',
      password: 'admin123',
    });
    expect(parsed.success).toBe(true);
  });

  it('campos vacíos → clave "required" (gana sobre la de mínimo)', () => {
    const parsed = loginFormSchema.safeParse(EMPTY_LOGIN_FORM);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const errors = fieldErrorsFromZod(parsed.error);
    expect(errors.username).toBe('login.validation.username.required');
    expect(errors.password).toBe('login.validation.password.required');
  });

  it('usuario por debajo del mínimo → clave "min"', () => {
    const parsed = loginFormSchema.safeParse({
      username: 'ab',
      password: 'admin123',
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const errors = fieldErrorsFromZod(parsed.error);
    expect(errors.username).toBe('login.validation.username.min');
    expect(errors.password).toBeUndefined();
  });

  it('contraseña por debajo del mínimo → clave "min"', () => {
    const parsed = loginFormSchema.safeParse({
      username: 'admin',
      password: '12345',
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const errors = fieldErrorsFromZod(parsed.error);
    expect(errors.username).toBeUndefined();
    expect(errors.password).toBe('login.validation.password.min');
  });
});

describe('fieldErrorsFromZod', () => {
  it('conserva solo un mensaje por campo (el primero emitido)', () => {
    const parsed = loginFormSchema.safeParse({ username: '', password: '' });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const errors = fieldErrorsFromZod(parsed.error);
    expect(Object.keys(errors).sort()).toEqual(['password', 'username']);
  });
});
