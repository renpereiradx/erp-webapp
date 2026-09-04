/**
 * State and orchestration for the user detail page.
 * Wraps the global users store for a single user lifecycle.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useI18n } from '@/lib/i18n';
import useUserStore from '@/store/useUserStore';
import type { User } from '@/types';

import type { ConfirmRequest, Role, TFn } from '../types';

interface UsersStoreSlice {
  selectedUser: User | null;
  roles: Role[];
  loading: boolean;
  error: string | null;
  fetchUserById: (id: string) => Promise<{ success: boolean; error?: string }>;
  fetchRoles: () => Promise<void>;
  activateUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  deactivateUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function useUserDetail() {
  const { t } = useI18n() as unknown as { t: TFn };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const store = useUserStore() as UsersStoreSlice;
  const { selectedUser: user, roles, loading, error, fetchUserById, fetchRoles } = store;

  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const refresh = useCallback(() => {
    if (id) fetchUserById(id);
  }, [id, fetchUserById]);

  useEffect(() => {
    refresh();
    fetchRoles();
  }, [refresh, fetchRoles]);

  const backToList = useCallback(() => navigate('/configuracion/usuarios'), [navigate]);

  const handleToggleStatus = useCallback(
    async (user: User) => {
      setIsToggling(true);
      try {
        const action =
          user.status === 'active'
            ? useUserStore.getState().deactivateUser
            : useUserStore.getState().activateUser;
        const result = await action(user.id);
        if (!result.success) {
          toast.error(result.error || t('users.deleteError', 'No se pudo actualizar el estado'));
        }
        refresh();
      } finally {
        setIsToggling(false);
      }
    },
    [t, refresh],
  );

  const requestDeleteUser = useCallback(
    (user: User) => {
      setConfirmRequest({
        title: t('users.deleteTitle', 'Eliminar usuario'),
        description: t('users.confirmDelete', '¿Seguro que deseas eliminar a {{name}}?', {
          name: `${user.first_name} ${user.last_name}`,
        }),
        confirmLabel: t('users.deleteConfirm', 'Eliminar'),
        action: async () => {
          const result = await useUserStore.getState().deleteUser(user.id);
          if (result.success) {
            toast.success(t('users.deleteSuccess', 'Usuario eliminado correctamente'));
            backToList();
          } else {
            toast.error(result.error || t('users.deleteError', 'Error al eliminar el usuario'));
          }
        },
      });
    },
    [t, backToList],
  );

  const handleConfirm = useCallback(async () => {
    if (!confirmRequest) return;
    setIsConfirming(true);
    try {
      await confirmRequest.action();
    } finally {
      setIsConfirming(false);
      setConfirmRequest(null);
    }
  }, [confirmRequest]);

  return {
    user,
    roles,
    loading,
    error,
    isToggling,
    handleToggleStatus,
    requestDeleteUser,
    confirmRequest,
    isConfirming,
    handleConfirm,
    closeConfirm: () => setConfirmRequest(null),
    backToList,
    refresh,
  };
}
