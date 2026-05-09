import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import useClientStore from '@/store/useClientStore';
import { useToast } from '@/hooks/useToast';
import { telemetry } from '@/utils/telemetry';

export const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return debouncedFunction;
};

export function useClientsView() {
  const { t } = useI18n();
  const toast = useToast();

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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const clients = hasSearched ? (searchResults || []) : (allClients || []);

  useEffect(() => {
    if (error) {
      telemetry.record('clients.error.store', { message: error });
    }
  }, [error]);

  const performSearch = useCallback(async (term: string) => {
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
    } catch (err: any) {
      toast.errorFrom(err, { fallback: t('clients.error.generic') });
    } finally {
      setIsSearching(false);
    }
  }, [searchClients, clearError, toast, t]);

  const debouncedSearch = useDebounce(performSearch, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedSearch(newValue);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = searchTerm.trim();
      if (value.length >= 3) performSearch(value);
    }
  };

  const handleSelectClient = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === clients.length && clients.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clients.map((c: any) => c.id));
    }
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  const handleViewDetails = (client: any) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModal = async (shouldRefresh = false) => {
    setIsFormModalOpen(false);
    if (shouldRefresh) {
      if (searchTerm) await searchClients(searchTerm);
      else await fetchClients(page, 10);
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleRefresh = () => {
    if (searchTerm) performSearch(searchTerm);
    else fetchClients(page, 10);
  };

  const isLoading = loading || isSearching;
  const startIndex = (page - 1) * 10 + 1;
  const endIndex = Math.min(page * 10, totalClients);

  return {
    state: {
      clients, searchTerm, selectedIds, hasSearched, isFormModalOpen, isDetailsModalOpen, selectedClient,
      isLoading, error, page, totalPages, totalClients, startIndex, endIndex, toasts: toast.toasts
    },
    actions: {
      handleSearchChange, handleSearchKeyDown, handleSelectClient, handleSelectAll,
      handleCreate, handleEdit, handleViewDetails, handleCloseModal, handleCloseDetailsModal,
      handlePageChange, handleRefresh, removeToast: toast.removeToast, t
    }
  };
}