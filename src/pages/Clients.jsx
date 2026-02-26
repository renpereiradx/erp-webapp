// ===========================================================================
// Clients Page - Refactored with Tailwind CSS & Fluent Design System 2
// Consistent with Products page design
// ===========================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Share, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  RefreshCw,
  MoreVertical,
  User,
  Users
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import useClientStore from '@/store/useClientStore';
import ClientFormModal from '@/components/ClientFormModal';
import ClientDetailsModal from '@/components/ClientDetailsModal';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';
import { telemetry } from '@/utils/telemetry';
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

/**
 * Custom hook for debounce
 */
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedFunction = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunction;
};

const ClientsPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();

  // Zustand store
  const {
    clients: allClients,
    searchResults,
    loading,
    error,
    totalClients,
    page,
    totalPages,
    setPage,
    clearError,
    searchClients,
    fetchClients,
  } = useClientStore();

  // Local states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Use searchResults if searching, otherwise use general clients list
  const clients = hasSearched ? (searchResults || []) : (allClients || []);

  // Record store errors in telemetry
  useEffect(() => {
    if (error) {
      telemetry.record('clients.error.store', { message: error });
    }
  }, [error]);

  // Search function
  const performSearch = useCallback(async (term) => {
    const trimmedTerm = term.trim();

    if (!trimmedTerm) {
      setIsSearching(false);
      setHasSearched(false);
      clearError();
      return;
    }

    if (trimmedTerm.length < 3) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      await searchClients(trimmedTerm);
    } catch (err) {
      toast.errorFrom(err, { fallback: t('clients.error.generic') });
    } finally {
      setIsSearching(false);
    }
  }, [searchClients, clearError, toast, t]);

  // Debounced search
  const debouncedSearch = useDebounce(performSearch, 500);

  // Handlers
  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedSearch(newValue);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = searchTerm.trim();
      if (value.length >= 3) {
        performSearch(value);
      }
    }
  };

  const handleSelectClient = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === clients.length && clients.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clients.map(client => client.id));
    }
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModal = async (shouldRefresh = false) => {
    setIsFormModalOpen(false);
    
    if (shouldRefresh) {
      if (searchTerm) {
        await searchClients(searchTerm);
      } else {
        await fetchClients(page, 10);
      }
      const successMsg = selectedClient 
        ? t('clients.modal.success.update', 'Cliente actualizado exitosamente') 
        : t('clients.modal.success.create', 'Cliente creado exitosamente');
      toast.success(successMsg);
    }
    
    setSelectedClient(null);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedClient(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleRefresh = () => {
    if (searchTerm) {
      performSearch(searchTerm);
    } else {
      fetchClients(page, 10);
    }
  };

  // UI state
  const isLoading = loading || isSearching;
  const startIndex = (page - 1) * 10 + 1;
  const endIndex = Math.min(page * 10, totalClients);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#323130] p-8 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest gap-2 mb-6">
          <span onClick={() => navigate('/dashboard')} className="hover:text-[#106ebe] cursor-pointer transition-colors">
            {t('clients.breadcrumb.home', 'Inicio')}
          </span>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-[#242424] font-bold">{t('clients.title', 'Clientes')}</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-l-4 border-[#106ebe] pl-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-[#242424]">
              {t('clients.title', 'Clientes')}
            </h1>
            <p className="text-[#616161] text-sm font-medium mt-1">
              {t('clients.subtitle', 'Administra, filtra y visualiza todos los clientes del sistema.')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('action.refresh', 'Refrescar')}</span>
            </Button>
            <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700">
              <Share className="size-4 mr-2" />
              <span className="hidden sm:inline">{t('action.export', 'Exportar')}</span>
            </Button>
            <Button 
              className="bg-[#106ebe] hover:bg-[#005a9e] text-white px-5 shadow-sm border-none"
              onClick={handleCreate}
            >
              <Plus className="size-4 mr-2" />
              <span>{t('clients.action.create', 'Nuevo Cliente')}</span>
            </Button>
          </div>
        </div>

        {/* Toolbar Card */}
        <Card className="bg-white border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                {isLoading ? (
                  <RefreshCw className="size-5 animate-spin" />
                ) : (
                  <Search className="size-5" />
                )}
              </span>
              <Input
                type="search"
                className="block w-full pl-10 pr-3 py-2.5 border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#106ebe] focus:border-transparent outline-none transition-all h-11"
                placeholder={t('clients.search.placeholder', 'Buscar por nombre, documento...')}
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
              {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
                <p className="absolute -bottom-6 left-0 text-xs text-orange-600 font-bold">
                  Escribe al menos 3 caracteres para buscar ({searchTerm.trim().length}/3)
                </p>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-11 px-4 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Filter className="size-4 mr-2" />
                {t('action.filter', 'Filtrar')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Clients Table Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50 border-b border-gray-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60px] text-center px-6">
                  <Checkbox
                    checked={selectedIds.length === clients.length && clients.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="border-gray-300 data-[state=checked]:bg-[#106ebe] data-[state=checked]:border-[#106ebe]"
                  />
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('clients.table.name', 'NOMBRE DEL CLIENTE')}
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('clients.table.document', 'DOCUMENTO')}
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('clients.table.contact', 'CONTACTO')}
                </TableHead>
                <TableHead className="text-[13px] text-gray-700 font-semibold py-4 px-4">
                  {t('clients.table.status', 'ESTADO')}
                </TableHead>
                <TableHead className="w-16 py-4 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && clients.length === 0 ? (
                <TableRow data-testid="datastate-loading">
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="size-10 border-4 border-[#106ebe]/20 border-t-[#106ebe] rounded-full animate-spin"></div>
                      <span className="text-sm text-[#616161] font-bold uppercase tracking-widest">{t('clients.loading', 'Cargando...')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow data-testid="datastate-error">
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="text-[#a4262c] font-black uppercase tracking-wider">{error}</div>
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow data-testid="datastate-empty">
                  <TableCell colSpan={6} className="py-20 text-center text-[#616161]">
                    <div className="max-w-md mx-auto font-medium">
                      {!hasSearched
                        ? t('clients.empty.message', 'Usa la barra de búsqueda para encontrar clientes por nombre o documento')
                        : t('clients.search.no_results_message', 'No se encontraron clientes con ese criterio de búsqueda')
                      }
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => {
                  const isActive = client.status !== false && client.is_active !== false;
                  const clientId = client.id || client._key;

                  return (
                    <TableRow 
                      key={clientId}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer"
                      onClick={() => handleViewDetails(client)}
                    >
                      <TableCell className="px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(client.id)}
                          onCheckedChange={() => handleSelectClient(client.id)}
                          className="border-gray-300 data-[state=checked]:bg-[#106ebe] data-[state=checked]:border-[#106ebe]"
                        />
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden text-[#106ebe]">
                            <User size={20} />
                          </div>
                          <span className="font-medium text-[#242424] hover:text-[#106ebe] hover:underline transition-colors">
                            {client.displayName || client.name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-4 text-xs font-mono font-bold text-gray-600">
                        {client.document_id || '-'}
                      </TableCell>

                      <TableCell className="py-4 px-4 text-xs text-gray-600 font-medium">
                        {client.contact?.phone || client.contact?.email || client.contact?.raw || '-'}
                      </TableCell>

                      <TableCell className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isActive 
                            ? 'bg-[#dff6dd] text-[#107c10]' 
                            : 'bg-[#f3f4f6] text-[#616161]'
                        }`}>
                          {isActive ? t('clients.status.active', 'Activo') : t('clients.status.inactive', 'Inactivo')}
                        </span>
                      </TableCell>

                      <TableCell className="text-right px-6" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all"
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
          <div className="px-6 py-4 flex items-center justify-between bg-[#fafafa] border-t border-gray-100">
            <p className="text-[13px] text-gray-500 font-medium">
              {t('pagination.showing', 'Mostrando')} {startIndex} {t('pagination.to', 'a')} {endIndex} {t('pagination.of', 'de')} {totalClients} {t('pagination.results', 'resultados')}
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || isLoading}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30 h-8 w-8"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <span className="text-sm font-semibold text-gray-700">
                {page} / {totalPages || 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || totalPages === 0 || isLoading}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30 h-8 w-8"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default ClientsPage;
