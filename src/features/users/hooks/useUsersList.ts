/**
 * State and orchestration for the users list page.
 * Wraps the global users store, adds selection, bulk actions and
 * the destructive-action confirmation flow (no window.confirm).
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useI18n } from '@/lib/i18n';
import useUserStore from '@/store/useUserStore';
import type { User } from '@/types';

import type {
  ConfirmRequest,
  Role,
  TFn,
  UsersFilters,
  UsersPagination,
} from '../types';

interface UsersStoreSlice {
  users: User[];
  roles: Role[];
  pagination: UsersPagination;
  loading: boolean;
  error: string | null;
  filters: UsersFilters;
  fetchUsers: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: Partial<UsersFilters>) => void;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  activateUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  deactivateUser: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function useUsersList() {
  const { t } = useI18n() as unknown as { t: TFn };

  const store = useUserStore() as UsersStoreSlice;
  const {
    users,
    roles,
    pagination,
    loading,
    error,
    filters,
    fetchUsers,
    fetchRoles,
    setPage,
    setPageSize,
    setFilters,
  } = store;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const selectedCount = selectedIds.length;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? users.map((user) => user.id) : []);
    },
    [users],
  );

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: '', role_id: '' });
  }, [setFilters]);

  /** Runs an action over the selection in parallel and reports one summary toast. */
  const runBulk = useCallback(
    async (
      ids: string[],
      action: (id: string) => Promise<{ success: boolean; error?: string }>,
      successKey: string,
    ) => {
      const results = await Promise.allSettled(ids.map((id) => action(id)));
      const failed = results.filter(
        (result) => result.status === 'rejected' || !result.value?.success,
      ).length;

      if (failed === 0) {
        toast.success(t(successKey, 'Operación completada', { count: ids.length }));
      } else if (failed < ids.length) {
        toast.warning(t('users.bulk.partialError', 'Algunas operaciones no pudieron completarse'));
      } else {
        toast.error(t('users.bulk.partialError', 'Algunas operaciones no pudieron completarse'));
      }
      setSelectedIds([]);
      fetchUsers();
    },
    [t, fetchUsers],
  );

  const handleBulkActivate = useCallback(() => {
    void runBulk(selectedIds, (id) => useUserStore.getState().activateUser(id), 'users.bulk.activateSuccess');
  }, [runBulk, selectedIds]);

  const handleBulkDeactivate = useCallback(() => {
    void runBulk(selectedIds, (id) => useUserStore.getState().deactivateUser(id), 'users.bulk.deactivateSuccess');
  }, [runBulk, selectedIds]);

  const requestBulkDelete = useCallback(() => {
    setConfirmRequest({
      title: t('users.bulkDeleteTitle', 'Eliminar usuarios seleccionados'),
      description: t('users.bulkDeleteDescription', 'Se eliminarán {{count}} usuario(s).', {
        count: selectedCount,
      }),
      confirmLabel: t('users.deleteConfirm', 'Eliminar'),
      action: () => runBulk(selectedIds, (id) => useUserStore.getState().deleteUser(id), 'users.bulk.deleteSuccess'),
    });
  }, [t, selectedIds, selectedCount, runBulk]);

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
            setSelectedIds((prev) => prev.filter((id) => id !== user.id));
          } else {
            toast.error(result.error || t('users.deleteError', 'Error al eliminar el usuario'));
          }
          fetchUsers();
        },
      });
    },
    [t, fetchUsers],
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
    // data
    users,
    roles,
    pagination,
    loading,
    error,
    filters,
    // selection
    selectedIds,
    selectedCount,
    toggleSelect,
    handleSelectAll,
    clearSelection,
    // toolbar
    setPage,
    setPageSize,
    setFilters,
    clearFilters,
    // bulk + delete
    handleBulkActivate,
    handleBulkDeactivate,
    requestBulkDelete,
    requestDeleteUser,
    // confirm dialog
    confirmRequest,
    isConfirming,
    handleConfirm,
    closeConfirm: () => setConfirmRequest(null),
    refetch: fetchUsers,
  };
}
