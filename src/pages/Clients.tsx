import { Search, Plus, ChevronLeft, ChevronRight, RefreshCw, MoreVertical, User, Users } from 'lucide-react';
import { useClientsView } from './useClientsView';
import ClientFormModal from '@/features/party/components/ClientFormModal';
import ClientDetailsModal from '@/features/party/components/ClientDetailsModal';
import WithPermission from '@/components/auth/WithPermission';
import ToastContainer from '@/components/ui/ToastContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

interface ClientRow {
  id?: string | number;
  _key?: string | number;
  name?: string;
  displayName?: string;
  document_id?: string;
  status?: boolean;
  is_active?: boolean;
  contact?: { phone?: string; email?: string; raw?: string };
}

const ClientsPage = () => {
  const { state, actions } = useClientsView();
  const {
    clients, searchTerm, selectedIds, hasSearched, isFormModalOpen, isDetailsModalOpen, selectedClient,
    isLoading, error, page, totalPages, totalClients, startIndex, endIndex, toasts
  } = state;
  const {
    handleSearchChange, handleSearchKeyDown, handleSelectClient, handleSelectAll,
    handleCreate, handleEdit, handleViewDetails, handleCloseModal, handleCloseDetailsModal,
    handlePageChange, handleRefresh, removeToast, t
  } = actions;

  const showMinCharsHint = searchTerm.trim().length > 0 && searchTerm.trim().length < 3;

  return (
    <div className="flex flex-col gap-lg">

      {/* Toolbar: search + actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div className="relative w-full max-w-sm flex-1">
          <Input
            type="search"
            className="pl-9 h-9 bg-surface-muted border-transparent rounded-md focus:bg-background transition-colors"
            placeholder={t('clients.search.placeholder', 'Buscar por nombre, documento o ID...')}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            aria-label={t('clients.search.label', 'Buscar clientes')}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep pointer-events-none">
            {isLoading ? (
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-4" aria-hidden="true" />
            )}
          </span>
        </div>
        {showMinCharsHint && (
          <p className="text-body-sm-bold text-error" role="status">
            {t('clients.search.min_chars', 'Escribe al menos 3 caracteres para buscar ({count}/3)', { count: searchTerm.trim().length })}
          </p>
        )}

        <div className="flex items-center gap-sm shrink-0">
          <Button variant="ghost" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`size-4 mr-xs ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('action.refresh', 'Actualizar')}</span>
          </Button>
          <Button variant="ghost">
            <span className="hidden sm:inline">{t('action.export', 'Exportar')}</span>
          </Button>
          <Button variant="secondary">
            {t('action.filter', 'Filtrar')}
          </Button>
          <WithPermission anyOf={['parties:write', 'clients:write']}>
            <Button variant="primary" onClick={handleCreate}>
              <Plus className="size-4 mr-xs" />
              <span>{t('clients.action.create', 'Nuevo Cliente')}</span>
            </Button>
          </WithPermission>
        </div>
      </div>

      {/* Data states (loading / error / empty) */}
      {isLoading && clients.length === 0 && (
        <GenericSkeletonList count={6} lineHeight={44} data-testid="datastate-loading" />
      )}

      {!isLoading && error && (
        <ErrorState
          title={t('clients.error.title', 'Error al cargar clientes')}
          message={error}
          onRetry={handleRefresh}
          data-testid="datastate-error"
        />
      )}

      {!isLoading && !error && clients.length === 0 && (
        <EmptyState
          icon={Users}
          title={t('clients.empty.title', 'Buscar Clientes')}
          description={
            !hasSearched
              ? t('clients.empty.message', 'Usa la barra de búsqueda para encontrar clientes por nombre o documento')
              : t('clients.search.no_results_message', 'No se encontraron clientes con ese criterio de búsqueda')
          }
          actionLabel={t('clients.action.create', 'Nuevo Cliente')}
          onAction={handleCreate}
          data-testid="datastate-empty"
        />
      )}

      {/* Clients table */}
      {!isLoading && !error && clients.length > 0 && (
        <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                <TableHead className="w-[60px] text-center px-md">
                  <Checkbox
                    checked={selectedIds.length === clients.length && clients.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label={t('clients.table.select_all', 'Seleccionar todos los clientes')}
                    className=""
                  />
                </TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep py-4 px-4">
                  {t('clients.table.name', 'NOMBRE DEL CLIENTE')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep py-4 px-4">
                  {t('clients.table.document', 'DOCUMENTO')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep py-4 px-4">
                  {t('clients.table.contact', 'CONTACTO')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep py-4 px-4">
                  {t('clients.table.status', 'ESTADO')}
                </TableHead>
                <TableHead className="w-16 py-4 px-md">
                  <span className="sr-only">{t('action.edit', 'Editar')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client: ClientRow) => {
                const isActive = client.status !== false && client.is_active !== false;
                const clientId = client.id || client._key;

                return (
                  <TableRow
                    key={clientId}
                    className="hover:bg-surface-muted transition-colors duration-150 group cursor-pointer"
                    onClick={() => handleViewDetails(client)}
                  >
                    <TableCell className="py-4 px-md text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(client.id as string)}
                        onCheckedChange={() => handleSelectClient(client.id as string)}
                        aria-label={(client.displayName || client.name) as string}
                        className=""
                      />
                    </TableCell>

                    <TableCell className="py-4 px-4">
                      <div className="flex items-center gap-md">
                        <div className="size-9 bg-surface-muted rounded-full flex items-center justify-center border border-border-subtle text-on-surface-deep overflow-hidden">
                          <User className="size-4" aria-hidden="true" />
                        </div>
                        <span className="text-body-md-bold text-foreground">
                          {client.displayName || client.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-4 text-data-mono font-data-mono text-on-surface-deep">
                      {client.document_id || '-'}
                    </TableCell>

                    <TableCell className="py-4 px-4 text-body-md text-on-surface-deep">
                      {client.contact?.phone || client.contact?.email || client.contact?.raw || '-'}
                    </TableCell>

                    <TableCell className="py-4 px-4">
                      <Badge variant={isActive ? 'success' : 'secondary'} size="sm" className="gap-xs">
                        <span
                          className={`size-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-outline-fg'}`}
                          aria-hidden="true"
                        />
                        {isActive
                          ? t('clients.status.active', 'Activo')
                          : t('clients.status.inactive', 'Inactivo')}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-4 px-md text-right" onClick={(e) => e.stopPropagation()}>
                      <WithPermission anyOf={['parties:write', 'clients:write']}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                          aria-label={t('action.edit', 'Editar')}
                          onClick={() => handleEdit(client)}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </WithPermission>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination footer */}
          <div className="px-md py-4 flex items-center justify-between bg-surface-muted border-t border-border-subtle">
            <p className="text-body-sm-bold text-on-surface-deep">
              {t('common.pagination.showing', 'Mostrando')}{' '}
              <span className="text-data-mono font-data-mono text-foreground">{startIndex}</span>{' '}
              {t('common.pagination.to', 'a')}{' '}
              <span className="text-data-mono font-data-mono text-foreground">{endIndex}</span>{' '}
              {t('common.pagination.of', 'de')}{' '}
              <span className="text-data-mono font-data-mono text-foreground">{totalClients}</span>
            </p>
            <div className="flex items-center gap-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || isLoading}
                aria-label={t('common.pagination.previous', 'Anterior')}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-body-sm-bold text-foreground text-data-mono font-data-mono">
                {page} / {totalPages || 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || totalPages === 0 || isLoading}
                aria-label={t('common.pagination.next', 'Siguiente')}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        client={selectedClient}
      />

      <ClientDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        client={selectedClient}
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default ClientsPage;
