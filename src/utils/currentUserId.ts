/**
 * Identidad del operador sin hooks: usable en inicializadores perezosos de
 * estado y en handlers (donde no hay render en curso).
 *
 * Orden de resolución: user del auth store y, si no (AuthContext no lo
 * sincroniza), el claim user_id del JWT vivo en localStorage. Sin sesión
 * resuelta, el sentinel 'frontend_operator'.
 */

import useAuthStore from '@/store/useAuthStore';

export const currentUserId = (): string => {
  const u = useAuthStore.getState().user;
  const fromStore = u?.id || u?.user_id;
  if (fromStore) return fromStore;
  try {
    const token = localStorage.getItem('authToken');
    const payload = token
      ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      : null;
    return payload?.user_id || 'frontend_operator';
  } catch {
    return 'frontend_operator';
  }
};
