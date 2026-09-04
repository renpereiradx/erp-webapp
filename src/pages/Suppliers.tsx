import { useContext } from 'react';
import {
  Search,
  Filter,
  Share,
  Plus,
  MoreVertical,
  Truck,
  RefreshCw,
  Eye,
  TrendingUp,
  Pencil,
  Copy,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { useSuppliersView } from './useSuppliersView';
import SupplierFormModal from '@/features/party/components/SupplierFormModal';
import SupplierDetailsModal from '@/features/party/components/SupplierDetailsModal';
import WithPermission from '@/components/auth/WithPermission';
import { AuthContext } from '@/contexts/AuthContext';
import { ConfirmationModal } from '@/components/ui/EnhancedModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import ToastContainer from '@/components/ui/ToastContainer';

interface SupplierRow {
  id?: string | number;
  _key?: string | number;
  name?: string;
  status?: boolean;
  taxId?: string;
  tax_id?: string;
  created_at?: string;
  createdAt?: string;
  contact?: { email?: string; phone?: string; address?: string };
}

const SuppliersPage = () => {
  const { state, actions } = useSuppliersView();
  const {
    dataset, searchTerm, selectedIds, hasSearched, isFormOpen, currentSupplier, detailsSupplier,
    pendingAction, pendingMessage, isLoading, error, toasts
  } = state;
  const {
    handleSearchChange, handleSearchKeyDown, handleSelectSupplier, handleSelectAll,
    openCreateModal, handleConfirmAction,
    setIsFormOpen, setDetailsSupplier, setPendingAction, refreshAfterMutation,
    handleViewSupplier, handleAnalyzeSupplier, handleEditSupplier, handleCopySupplierId, handleDeleteSupplier, handleReactivateSupplier,
    removeToast, t
  } = actions;
  // Fail-closed sin AuthProvider (mismo contrato que WithPermission)
  const authCtx = useContext(AuthContext);
  const canWrite = authCtx ? authCtx.hasAnyPermission('parties:write', 'suppliers:write') : false;

  return (
    <div className="flex flex-col gap-lg">

      {/* Toolbar: search + actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div className="relative w-full max-w-sm flex-1">
          <Input
            type="search"
            className="pl-9 h-9 bg-surface-muted border-transparent rounded-md focus:bg-background transition-colors"
            placeholder={t('supplier.search.placeholder', 'Buscar por nombre o ID...')}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            aria-label={t('supplier.search.label', 'Buscar proveedores')}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep pointer-events-none">
            {isLoading ? (
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-4" aria-hidden="true" />
            )}
          </span>
        </div>

        <div className="flex items-center gap-sm shrink-0">
          <Button variant="ghost" onClick={() => refreshAfterMutation()} disabled={isLoading}>
            <RefreshCw className={`size-4 mr-xs ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('action.refresh', 'Actualizar')}</span>
          </Button>
          <Button variant="ghost">
            <Share className="size-4 mr-xs" />
            <span className="hidden sm:inline">{t('action.export', 'Exportar')}</span>
          </Button>
          <Button variant="secondary">
            <Filter className="size-4 mr-xs" />
            {t('action.filter', 'Filtrar')}
          </Button>
          <WithPermission anyOf={['parties:write', 'suppliers:write']}>
            <Button variant="primary" onClick={openCreateModal}>
              <Plus className="size-4 mr-xs" />
              <span>{t('supplier.action.create', 'Nuevo proveedor')}</span>
            </Button>
          </WithPermission>
        </div>
      </div>

      {/* Data states (loading / error / empty) */}
      {isLoading && dataset.length === 0 && (
        <GenericSkeletonList count={6} lineHeight={44} data-testid="datastate-loading" />
      )}

      {!isLoading && error && (
        <ErrorState
          title={t('supplier.error.title', 'Error al cargar proveedores')}
          message={error}
          onRetry={() => refreshAfterMutation()}
          data-testid="datastate-error"
        />
      )}

      {!isLoading && !error && dataset.length === 0 && (
        <EmptyState
          icon={Truck}
          title={t('supplier.empty.title', 'No hay proveedores')}
          description={
            hasSearched
              ? t('supplier.search.no_results', 'No se encontraron proveedores con ese criterio')
              : t('supplier.empty.prompt', 'Utiliza la barra de búsqueda para comenzar')
          }
          actionLabel={
            !hasSearched && canWrite
              ? t('supplier.action.create', 'Nuevo proveedor')
              : undefined
          }
          onAction={!hasSearched && canWrite ? openCreateModal : undefined}
          data-testid="datastate-empty"
        />
      )}

      {/* Suppliers table */}
      {!isLoading && !error && dataset.length > 0 && (
        <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                <TableHead className="w-[60px] text-center px-md">
                  <Checkbox
                    checked={dataset.length > 0 && selectedIds.length === dataset.length}
                    onCheckedChange={handleSelectAll}
                    aria-label={t('supplier.table.select_all', 'Seleccionar todos los proveedores')}
                    className=""
                  />
                </TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep py-4 px-4">
                  {t('supplier.table.name', 'Proveedor')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep py-4 px-4">
                  {t('supplier.table.contact', 'Contacto')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep py-4 px-4">
                  {t('supplier.table.tax', 'RFC / Tax ID')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep py-4 px-4">
                  {t('supplier.table.created', 'Creado')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep py-4 px-4">
                  {t('supplier.table.status', 'Estado')}
                </TableHead>
                <TableHead className="w-16 py-4 px-md">
                  <span className="sr-only">{t('action.edit', 'Editar')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.map((supplier: SupplierRow) => {
                const contact = supplier.contact || {};
                const contactSummary = [contact.email, contact.phone]
                  .filter(Boolean)
                  .join(' • ');
                const createdAt = supplier.created_at || supplier.createdAt;
                const isActive = supplier.status !== false;

                return (
                  <TableRow
                    key={supplier.id || supplier._key}
                    className="hover:bg-surface-muted transition-colors duration-150 group cursor-pointer"
                    onClick={() => handleViewSupplier(supplier)}
                  >
                    <TableCell
                      className="py-4 px-md text-center"
                      onClick={(event: React.MouseEvent) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.includes(supplier.id as string)}
                        onCheckedChange={() => handleSelectSupplier(supplier.id as string)}
                        aria-label={supplier.name}
                        className=""
                      />
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="flex items-center gap-md">
                        <div className="size-9 bg-surface-muted rounded-full flex items-center justify-center border border-border-subtle text-on-surface-deep overflow-hidden">
                          <Truck className="size-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-body-md-bold text-foreground">
                            {supplier.name}
                          </span>
                          {contact.address && (
                            <span className="text-body-sm-bold text-on-surface-deep line-clamp-1 mt-0.5">
                              {contact.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-body-md text-on-surface-deep">
                      {contactSummary || '-'}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-data-mono font-data-mono text-on-surface-deep">
                      {supplier.taxId || supplier.tax_id || '-'}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-data-mono font-data-mono text-on-surface-deep">
                      {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Badge variant={isActive ? 'success' : 'secondary'} size="sm" className="gap-xs">
                        <span
                          className={`size-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-outline-fg'}`}
                          aria-hidden="true"
                        />
                        {isActive
                          ? t('supplier.status.active', 'Activo')
                          : t('supplier.status.inactive', 'Inactivo')}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="py-4 px-md text-right"
                      onClick={(event: React.MouseEvent) => event.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                            aria-label={t('supplier.action.view', 'Ver detalle')}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onSelect={() => handleViewSupplier(supplier)}>
                            <Eye className="size-4 mr-sm text-on-surface-deep" aria-hidden="true" />
                            {t('supplier.action.view', 'Ver detalle')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAnalyzeSupplier(supplier)}>
                            <TrendingUp className="size-4 mr-sm text-on-surface-deep" aria-hidden="true" />
                            {t('supplier.action.analyze', 'Análisis de Deuda')}
                          </DropdownMenuItem>
                          {canWrite && (
                            <DropdownMenuItem onSelect={() => handleEditSupplier(supplier)}>
                              <Pencil className="size-4 mr-sm text-on-surface-deep" aria-hidden="true" />
                              {t('supplier.action.edit', 'Editar')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onSelect={() => handleCopySupplierId(supplier)}>
                            <Copy className="size-4 mr-sm text-on-surface-deep" aria-hidden="true" />
                            {t('supplier.action.copy_id', 'Copiar ID')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {supplier.status ? (
                            <DropdownMenuItem
                              className="text-error focus:text-error"
                              onSelect={() => handleDeleteSupplier(supplier)}
                            >
                              <Archive className="size-4 mr-sm" aria-hidden="true" />
                              {t('supplier.action.deactivate', 'Marcar inactivo')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-success focus:text-success"
                              onSelect={() => handleReactivateSupplier(supplier)}
                            >
                              <RotateCcw className="size-4 mr-sm" aria-hidden="true" />
                              {t('supplier.action.reactivate', 'Reactivar')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <SupplierFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        supplier={currentSupplier}
      />

      <SupplierDetailsModal
        isOpen={Boolean(detailsSupplier)}
        onClose={() => setDetailsSupplier(null)}
        supplier={detailsSupplier}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingAction.type)}
        onClose={() => setPendingAction({ type: null, supplier: null })}
        onConfirm={handleConfirmAction}
        title={
          pendingAction.type === 'delete'
            ? t('supplier.delete.title', 'Desactivar proveedor')
            : t('supplier.reactivate.title', 'Reactivar proveedor')
        }
        message={pendingMessage}
        variant={pendingAction.type === 'delete' ? 'error' : 'default'}
        confirmText={
          pendingAction.type === 'delete'
            ? t('supplier.delete.confirm', 'Desactivar proveedor')
            : t('supplier.reactivate.confirm', 'Reactivar proveedor')
        }
        cancelText={t('modal.cancel', 'Cancelar')}
        loading={isLoading}
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default SuppliersPage;
