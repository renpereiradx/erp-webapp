import React from 'react';
import { 
  Search, 
  Filter, 
  Share, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  MoreVertical,
  User
} from 'lucide-react';
import { useClientsView } from './useClientsView';
import ClientFormModal from '@/components/ClientFormModal';
import ClientDetailsModal from '@/components/ClientDetailsModal';
import ToastContainer from '@/components/ui/ToastContainer';
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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-white border-[#d1d1d1] hover:bg-[#f3f2f1] text-[#242424]"
        >
          <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('action.refresh', 'Refrescar')}</span>
        </Button>
        <Button variant="outline" className="bg-white border-[#d1d1d1] hover:bg-[#f3f2f1] text-[#242424]">
          <Share className="size-4 mr-2" />
          <span className="hidden sm:inline">{t('action.export', 'Exportar')}</span>
        </Button>
        <Button 
          className="bg-[#0f6cbd] hover:bg-[#115ea3] text-white px-5 shadow-sm border-none font-bold"
          onClick={handleCreate}
        >
          <Plus className="size-4 mr-2" />
          <span>{t('clients.action.create', 'Nuevo Cliente')}</span>
        </Button>
      </div>

      {/* Toolbar Card */}
      <Card className="bg-white border-[#edebe9] rounded-xl shadow-fluent-2 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#616161]">
              {isLoading ? (
                <RefreshCw className="size-5 animate-spin" />
              ) : (
                <Search className="size-5" />
              )}
            </span>
            <Input
              type="search"
              className="block w-full pl-11 pr-4 py-2.5 border-[#d1d1d1] rounded-lg bg-[#f3f2f1] text-sm focus:bg-white focus:ring-2 focus:ring-[#0f6cbd]/20 focus:border-[#0f6cbd] outline-none transition-all h-11 font-medium"
              placeholder={t('clients.search.placeholder', 'Buscar por nombre, documento...')}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
            {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
              <p className="absolute -bottom-6 left-0 text-xs text-[#d13438] font-bold">
                Escribe al menos 3 caracteres para buscar ({searchTerm.trim().length}/3)
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-11 px-5 bg-white border-[#d1d1d1] text-[#242424] hover:bg-[#f3f2f1] font-bold"
            >
              <Filter className="size-4 mr-2" />
              {t('action.filter', 'Filtrar')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Clients Table Card - Following visual-refinement.md: overflow-hidden to clip corners */}
      <div className="bg-white border border-[#edebe9] rounded-xl shadow-fluent-2 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#f3f2f1]/50 border-b border-[#edebe9]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[60px] text-center px-6">
                <Checkbox
                  checked={selectedIds.length === clients.length && clients.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="rounded border-[#d1d1d1] text-[#0f6cbd] data-[state=checked]:bg-[#0f6cbd] data-[state=checked]:border-[#0f6cbd]"
                />
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-slate-400 tracking-wider py-5 px-5">
                {t('clients.table.name', 'NOMBRE DEL CLIENTE')}
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-slate-400 tracking-wider py-5 px-5">
                {t('clients.table.document', 'DOCUMENTO')}
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-slate-400 tracking-wider py-5 px-5">
                {t('clients.table.contact', 'CONTACTO')}
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-slate-400 tracking-wider py-5 px-5">
                {t('clients.table.status', 'ESTADO')}
              </TableHead>
              <TableHead className="w-16 py-5 px-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {isLoading && clients.length === 0 ? (
              <TableRow data-testid="datastate-loading">
                <TableCell colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="size-10 border-4 border-[#0f6cbd]/20 border-t-[#0f6cbd] rounded-full animate-spin"></div>
                    <span className="text-[10px] text-[#616161] font-bold uppercase tracking-widest">{t('clients.loading', 'Cargando...')}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow data-testid="datastate-error">
                <TableCell colSpan={6} className="py-20 text-center">
                  <div className="text-[#d13438] font-bold uppercase tracking-wider">{error}</div>
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow data-testid="datastate-empty">
                <TableCell colSpan={6} className="py-20 text-center text-[#616161]">
                  <div className="max-w-md mx-auto font-medium text-sm">
                    {!hasSearched
                      ? t('clients.empty.message', 'Usa la barra de búsqueda para encontrar clientes por nombre o documento')
                      : t('clients.search.no_results_message', 'No se encontraron clientes con ese criterio de búsqueda')
                    }
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client: any) => {
                const isActive = client.status !== false && client.is_active !== false;
                const clientId = client.id || client._key;

                return (
                  <TableRow 
                    key={clientId}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => handleViewDetails(client)}
                  >
                    <TableCell className="py-5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(client.id)}
                        onCheckedChange={() => handleSelectClient(client.id)}
                        className="rounded border-[#d1d1d1] text-[#0f6cbd] data-[state=checked]:bg-[#0f6cbd] data-[state=checked]:border-[#0f6cbd]"
                      />
                    </TableCell>

                    <TableCell className="py-5 px-5">
                      <div className="flex items-center gap-4">
                        <div className="size-9 bg-[#f3f2f1] rounded-full flex items-center justify-center border border-[#edebe9] overflow-hidden text-[#616161]">
                          <User size={16} />
                        </div>
                        <span className="font-bold text-[#242424] text-sm group-hover:text-[#0f6cbd] group-hover:underline transition-colors">
                          {client.displayName || client.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-5 px-5 text-sm font-mono font-bold text-[#616161]">
                      {client.document_id || '-'}
                    </TableCell>

                    <TableCell className="py-5 px-5 text-sm text-[#616161] font-medium">
                      {client.contact?.phone || client.contact?.email || client.contact?.raw || '-'}
                    </TableCell>

                    <TableCell className="py-5 px-5">
                      <span className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border border-transparent flex w-max items-center gap-2 ${
                        isActive 
                          ? 'bg-[#dff6dd] text-[#107c10]' 
                          : 'bg-[#f3f2f1] text-[#616161]'
                      }`}>
                        {isActive && <span className="size-1.5 rounded-full bg-[#107c10]"></span>}
                        {!isActive && <span className="size-1.5 rounded-full bg-[#616161]"></span>}
                        {isActive ? t('clients.status.active', 'Activo') : t('clients.status.inactive', 'Inactivo')}
                      </span>
                    </TableCell>

                    <TableCell className="py-5 px-8 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-[#0f6cbd] hover:bg-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => handleEdit(client)}
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

        {/* Pagination Footer */}
        <div className="px-8 py-5 flex items-center justify-between bg-[#f3f2f1]/50 border-t border-[#edebe9]">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t('pagination.showing', 'Mostrando')} <span className="text-[#242424]">{startIndex}</span> {t('pagination.to', 'a')} <span className="text-[#242424]">{endIndex}</span> {t('pagination.of', 'de')} <span className="text-[#242424]">{totalClients}</span>
          </p>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
              className="p-1 hover:bg-white border border-transparent hover:border-[#d1d1d1] rounded text-[#616161] disabled:opacity-30 h-8 w-8 transition-all"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <span className="text-sm font-semibold text-[#242424]">
              {page} / {totalPages || 1}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || totalPages === 0 || isLoading}
              className="p-1 hover:bg-white border border-transparent hover:border-[#d1d1d1] rounded text-[#616161] disabled:opacity-30 h-8 w-8 transition-all"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>

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