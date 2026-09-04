import { useState } from 'react';
import { Download, Plus, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import PageHeader from '@/components/ui/PageHeader';
import type { User } from '@/types';

import { useUsersList } from '../hooks/useUsersList';
import { UserFormModal } from './UserFormModal';
import { UsersPagination } from './UsersPagination';
import { UsersTable } from './UsersTable';
import { UsersToolbar } from './UsersToolbar';

const PageHeaderX = PageHeader as unknown as React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: string;
}>;
const SkeletonList = GenericSkeletonList as unknown as React.FC<{ count?: number }>;
const LoadErrorState = ErrorState as unknown as React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}>;
const NoDataState = EmptyState as unknown as React.FC<{
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}>;

/** /configuracion/usuarios — users administration workspace. */
export function UsersPage() {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string };
  const list = useUsersList();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const openCreate = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    toast.info(t('users.exportSoon', 'La exportación estará disponible pronto.'));
  };

  const hasFilters = Boolean(list.filters.search || list.filters.status || list.filters.role_id);

  return (
    <div className="space-y-lg animate-in fade-in duration-300">
      <PageHeaderX
        breadcrumb={t('nav.settings', 'Configuración')}
        title={t('users.title', 'Usuarios')}
        subtitle={t('users.description', 'Administra accesos, roles y seguridad de la plataforma.')}
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="size-4 mr-sm" />
              {t('users.export', 'Exportar')}
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="size-4 mr-sm" />
              {t('users.addUser', 'Agregar usuario')}
            </Button>
          </>
        }
      />

      <UsersToolbar
        filters={list.filters}
        roles={list.roles}
        selectedCount={list.selectedCount}
        onFiltersChange={list.setFilters}
        onClearFilters={list.clearFilters}
        onBulkActivate={() => void list.handleBulkActivate()}
        onBulkDeactivate={() => void list.handleBulkDeactivate()}
        onBulkDelete={list.requestBulkDelete}
        onClearSelection={list.clearSelection}
      />

      <div className="rounded-md bg-surface shadow-whisper overflow-hidden">
        {list.loading ? (
          <div className="p-md">
            <SkeletonList count={6} />
          </div>
        ) : list.error ? (
          <div className="p-lg">
            <LoadErrorState
              title={t('users.error.title', 'Error al cargar usuarios')}
              message={list.error}
              onRetry={list.refetch}
            />
          </div>
        ) : list.users.length === 0 ? (
          <div className="p-lg">
            <NoDataState
              icon={UsersIcon}
              title={
                hasFilters
                  ? t('users.empty.searchTitle', 'Sin resultados')
                  : t('users.empty.title', 'Sin usuarios')
              }
              description={
                hasFilters
                  ? t('users.empty.searchDescription', 'Ajusta la búsqueda o los filtros e inténtalo de nuevo.')
                  : t('users.empty.description', 'Crea el primer usuario para comenzar a gestionar accesos.')
              }
              actionLabel={hasFilters ? undefined : t('users.addUser', 'Agregar usuario')}
              onAction={hasFilters ? undefined : openCreate}
            />
          </div>
        ) : (
          <>
            <UsersTable
              users={list.users}
              selectedIds={list.selectedIds}
              onToggleSelect={list.toggleSelect}
              onSelectAll={list.handleSelectAll}
              onEdit={openEdit}
              onDelete={list.requestDeleteUser}
            />
            <UsersPagination
              pagination={list.pagination}
              onPageChange={list.setPage}
              onPageSizeChange={list.setPageSize}
            />
          </>
        )}
      </div>

      <UserFormModal
        user={userToEdit}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSaved={list.refetch}
      />
      <ConfirmDialog
        open={Boolean(list.confirmRequest)}
        title={list.confirmRequest?.title ?? ''}
        description={list.confirmRequest?.description}
        confirmLabel={list.confirmRequest?.confirmLabel}
        loading={list.isConfirming}
        onConfirm={() => void list.handleConfirm()}
        onOpenChange={(open) => (open ? undefined : list.closeConfirm())}
      />
    </div>
  );
}
