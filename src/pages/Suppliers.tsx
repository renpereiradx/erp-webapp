import React from 'react';
import {
  Search,
  Filter,
  Share,
  Plus,
  MoreVertical,
  Truck,
} from 'lucide-react';
import { useSuppliersView } from './useSuppliersView';
import SupplierDirectoryFormModal from '@/components/suppliers-directory/SupplierDirectoryFormModal';
import SupplierDirectoryDetailsModal from '@/components/suppliers-directory/SupplierDirectoryDetailsModal';
import { ConfirmationModal } from '@/components/ui/EnhancedModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import ToastContainer from '@/components/ui/ToastContainer';
import { RefreshCw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Eye, TrendingUp, Pencil, Copy, Archive, RotateCcw } from 'lucide-react';

const SupplierActionsMenu = ({
  context,
  onClose,
  onView,
  onAnalyze,
  onEdit,
  onCopy,
  onDeactivate,
  onReactivate,
  t,
}: any) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!context) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (context.button?.contains?.(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [context, onClose]);

  if (!context) return null;

  const { rect, supplier } = context;
  const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
  const top = rect.bottom + scrollY + 6;
  const left = rect.right + scrollX;

  const style: React.CSSProperties = {
    top: `${top}px`,
    left: `${left}px`,
    right: 'auto',
    transform: `translateX(-100%) translateX(${rect.width}px)`,
    position: 'absolute',
    zIndex: 1000,
  };

  const menu = (
    <div
      ref={menuRef}
      className='bg-white border border-[#edebe9] rounded-lg shadow-fluent-16 py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100'
      style={style}
    >
      <button 
        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#242424] hover:bg-[#f3f2f1] transition-colors text-left' 
        type='button' 
        onClick={onView}
      >
        <Eye size={16} className="text-[#616161]" />
        {t('supplier.action.view', 'Ver detalle')}
      </button>
      <button 
        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#242424] hover:bg-[#f3f2f1] transition-colors text-left' 
        type='button' 
        onClick={onAnalyze}
      >
        <TrendingUp size={16} className="text-[#616161]" />
        {t('supplier.action.analyze', 'Análisis de Deuda')}
      </button>
      <button 
        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#242424] hover:bg-[#f3f2f1] transition-colors text-left' 
        type='button' 
        onClick={onEdit}
      >
        <Pencil size={16} className="text-[#616161]" />
        {t('supplier.action.edit', 'Editar')}
      </button>
      <button 
        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#242424] hover:bg-[#f3f2f1] transition-colors text-left' 
        type='button' 
        onClick={onCopy}
      >
        <Copy size={16} className="text-[#616161]" />
        {t('supplier.action.copy_id', 'Copiar ID')}
      </button>
      <hr className="my-1 border-[#edebe9]" />
      {supplier.status ? (
        <button
          className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#d13438] hover:bg-[#fde7e9] transition-colors text-left'
          type='button'
          onClick={onDeactivate}
        >
          <Archive size={16} />
          {t('supplier.action.deactivate', 'Marcar inactivo')}
        </button>
      ) : (
        <button
          className='flex items-center gap-3 w-full px-4 py-2 text-sm text-[#107c10] hover:bg-[#dff6dd] transition-colors text-left'
          type='button'
          onClick={onReactivate}
        >
          <RotateCcw size={16} />
          {t('supplier.action.reactivate', 'Reactivar')}
        </button>
      )}
    </div>
  );

  return createPortal(menu, document.body);
};

const SuppliersPage = () => {
  const { state, actions } = useSuppliersView();
  const {
    dataset, searchTerm, selectedIds, hasSearched, isFormOpen, currentSupplier, detailsSupplier,
    menuContext, pendingAction, pendingMessage, isLoading, error, toasts
  } = state;
  const {
    handleSearchChange, handleSearchKeyDown, handleSelectSupplier, handleSelectAll,
    toggleActionMenu, openCreateModal, handleConfirmAction,
    setIsFormOpen, setDetailsSupplier, setPendingAction, refreshAfterMutation,
    closeMenu, handleViewSupplier, handleAnalyzeSupplier, handleEditSupplier, handleCopySupplierId, handleDeleteSupplier, handleReactivateSupplier,
    removeToast, t
  } = actions;

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500'>
      
      {/* Header Actions */}
      <div className='flex items-center justify-end gap-3'>
        <Button
          variant='outline'
          onClick={() => refreshAfterMutation()}
          disabled={isLoading}
          className="bg-white border-[#d1d1d1] hover:bg-[#f3f2f1] text-[#242424]"
        >
          <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          <span className='hidden sm:inline'>{t('action.refresh', 'Refrescar')}</span>
        </Button>
        <Button variant='outline' className="bg-white border-[#d1d1d1] hover:bg-[#f3f2f1] text-[#242424]">
          <Share className='size-4 mr-2' />
          <span className='hidden sm:inline'>{t('action.export', 'Exportar')}</span>
        </Button>
        <Button 
          className='bg-[#0f6cbd] hover:bg-[#115ea3] text-white px-5 shadow-sm border-none font-bold'
          onClick={openCreateModal}
        >
          <Plus className='size-4 mr-2' />
          <span>{t('supplier.action.create', 'Nuevo proveedor')}</span>
        </Button>
      </div>

      {/* Toolbar Card */}
      <Card className='bg-white border-[#edebe9] rounded-xl shadow-fluent-2 p-6'>
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
          {/* Search */}
          <div className='relative flex-1 max-w-xl'>
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#616161]">
              {isLoading ? (
                <RefreshCw className="size-5 animate-spin" />
              ) : (
                <Search className="size-5" />
              )}
            </span>
            <Input
              type='search'
              className='block w-full pl-11 pr-4 py-2.5 border-[#d1d1d1] rounded-lg bg-[#f3f2f1] text-sm focus:bg-white focus:ring-2 focus:ring-[#0f6cbd]/20 focus:border-[#0f6cbd] outline-none transition-all h-11 font-medium'
              placeholder={t('supplier.search.placeholder', 'Buscar por nombre o ID...')}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          {/* Filters */}
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='sm'
              className="h-11 px-5 bg-white border-[#d1d1d1] text-[#242424] hover:bg-[#f3f2f1] font-bold"
            >
              <Filter className='size-4 mr-2' />
              {t('action.filter', 'Filtrar')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Table Container - Following visual-refinement.md: overflow-hidden to clip corners */}
      <div className='bg-white border border-[#edebe9] rounded-xl shadow-fluent-2 overflow-hidden'>
        <Table>
          <TableHeader className="bg-[#f3f2f1]/50 border-b border-[#edebe9]">
            <TableRow className="hover:bg-transparent">
              <TableHead className='w-[60px] text-center px-6'>
                <Checkbox
                  checked={dataset.length > 0 && selectedIds.length === dataset.length}
                  onCheckedChange={handleSelectAll}
                  className="rounded border-[#d1d1d1] text-[#0f6cbd] data-[state=checked]:bg-[#0f6cbd] data-[state=checked]:border-[#0f6cbd]"
                />
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-slate-400 tracking-wider py-5 px-5">
                {t('supplier.table.name', 'Proveedor')}
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-slate-400 tracking-wider py-5 px-5">
                {t('supplier.table.contact', 'Contacto')}
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-slate-400 tracking-wider py-5 px-5">
                {t('supplier.table.tax', 'RFC / Tax ID')}
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-slate-400 tracking-wider py-5 px-5">
                {t('supplier.table.created', 'Creado')}
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-slate-400 tracking-wider py-5 px-5">
                {t('supplier.table.status', 'Estado')}
              </TableHead>
              <TableHead className='w-16 py-5 px-6'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {isLoading && dataset.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="size-10 border-4 border-[#0f6cbd]/20 border-t-[#0f6cbd] rounded-full animate-spin"></div>
                    <span className="text-[10px] text-[#616161] font-bold uppercase tracking-widest">
                      {t('supplier.loading', 'Buscando proveedores...')}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error && hasSearched ? (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center">
                  <div className="text-[#d13438] font-bold uppercase tracking-wider">{error}</div>
                </TableCell>
              </TableRow>
            ) : dataset.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center text-[#616161]">
                  <div className="max-w-md mx-auto font-medium text-sm">
                    {hasSearched
                      ? t('supplier.search.no_results', 'No se encontraron proveedores con ese criterio')
                      : t('supplier.empty.prompt', 'Utiliza la barra de búsqueda para comenzar')}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              dataset.map((supplier: any) => {
                const contact = supplier.contact || {};
                const contactSummary = [contact.email, contact.phone]
                  .filter(Boolean)
                  .join(' • ');
                const createdAt = supplier.created_at || supplier.createdAt;
                const isSelected = selectedIds.includes(supplier.id);
                const isActive = supplier.status !== false;

                return (
                  <TableRow
                    key={supplier.id || supplier._key}
                    className='hover:bg-slate-50/80 transition-colors group cursor-pointer'
                    onClick={() => handleViewSupplier(supplier)}
                  >
                    <TableCell 
                      className='py-5 px-6 text-center'
                      onClick={(event: any) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectSupplier(supplier.id)}
                        className="rounded border-[#d1d1d1] text-[#0f6cbd] data-[state=checked]:bg-[#0f6cbd] data-[state=checked]:border-[#0f6cbd]"
                      />
                    </TableCell>
                    <TableCell className='py-5 px-5'>
                      <div className="flex items-center gap-4">
                        <div className="size-9 bg-[#f3f2f1] rounded-full flex items-center justify-center border border-[#edebe9] overflow-hidden text-[#616161]">
                          <Truck size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#242424] text-sm group-hover:text-[#0f6cbd] group-hover:underline transition-colors">
                            {supplier.name}
                          </span>
                          {contact.address && (
                            <span className='text-[11px] font-medium text-[#616161] line-clamp-1 mt-0.5'>
                              {contact.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='py-5 px-5 text-sm text-[#616161] font-medium'>
                      {contactSummary || '-'}
                    </TableCell>
                    <TableCell className='py-5 px-5 text-sm font-mono font-bold text-[#616161]'>
                      {supplier.taxId || supplier.tax_id || '-'}
                    </TableCell>
                    <TableCell className='py-5 px-5 text-sm text-[#616161] font-medium'>
                      {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className='py-5 px-5'>
                      <span
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border border-transparent flex w-max items-center gap-2 ${
                          isActive
                            ? 'bg-[#dff6dd] text-[#107c10]'
                            : 'bg-[#f3f2f1] text-[#616161]'
                        }`}
                      >
                        {isActive && <span className="size-1.5 rounded-full bg-[#107c10]"></span>}
                        {!isActive && <span className="size-1.5 rounded-full bg-[#616161]"></span>}
                        {isActive
                          ? t('supplier.status.active', 'Activo')
                          : t('supplier.status.inactive', 'Inactivo')}
                      </span>
                    </TableCell>
                    <TableCell
                      className='py-5 px-8 text-right'
                      onClick={(event: any) => event.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-[#0f6cbd] hover:bg-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(event: any) => toggleActionMenu(event, supplier)}
                      >
                        <MoreVertical className="size-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <SupplierDirectoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        supplier={currentSupplier}
      />

      <SupplierDirectoryDetailsModal
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

      {menuContext && (
        <SupplierActionsMenu
          context={menuContext}
          onClose={closeMenu}
          onView={() => handleViewSupplier(menuContext.supplier)}
          onAnalyze={() => handleAnalyzeSupplier(menuContext.supplier)}
          onEdit={() => handleEditSupplier(menuContext.supplier)}
          onCopy={() => handleCopySupplierId(menuContext.supplier)}
          onDeactivate={() => handleDeleteSupplier(menuContext.supplier)}
          onReactivate={() => handleReactivateSupplier(menuContext.supplier)}
          t={t}
        />
      )}

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default SuppliersPage;
