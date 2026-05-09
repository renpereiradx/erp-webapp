import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import useSupplierDirectoryStore from '@/store/useSupplierDirectoryStore';
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

export function useSuppliersView() {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();

  const suppliers = useSupplierDirectoryStore(state => state.suppliers);
  const searchResults = useSupplierDirectoryStore(state => state.searchResults);
  const loading = useSupplierDirectoryStore(state => state.loading);
  const error = useSupplierDirectoryStore(state => state.error);
  const searchSuppliers = useSupplierDirectoryStore(state => state.searchSuppliers);
  const clearError = useSupplierDirectoryStore(state => state.clearError);
  const deleteSupplier = useSupplierDirectoryStore(state => state.deleteSupplier);
  const reactivateSupplier = useSupplierDirectoryStore(state => state.reactivateSupplier);
  const refreshAfterMutation = useSupplierDirectoryStore(state => state.refreshAfterMutation);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<any>(null);
  const [detailsSupplier, setDetailsSupplier] = useState<any>(null);
  const [menuContext, setMenuContext] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<{type: string | null, supplier: any}>({
    type: null,
    supplier: null,
  });

  useEffect(() => {
    if (error) {
      telemetry.record('suppliers.error.store', { message: error });
    }
  }, [error]);

  useEffect(() => () => clearError(), [clearError]);

  const closeMenu = () => setMenuContext(null);

  const handleViewSupplier = (supplier: any) => {
    closeMenu();
    setDetailsSupplier(supplier);
  };

  const handleAnalyzeSupplier = (supplier: any) => {
    closeMenu();
    navigate(`/proveedores/${supplier.id}/analisis`);
  };

  const handleEditSupplier = (supplier: any) => {
    closeMenu();
    setCurrentSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDeleteSupplier = (supplier: any) => {
    closeMenu();
    setPendingAction({ type: 'delete', supplier });
  };

  const handleReactivateSupplier = (supplier: any) => {
    closeMenu();
    setPendingAction({ type: 'reactivate', supplier });
  };

  const handleCopySupplierId = async (supplier: any) => {
    closeMenu();
    try {
      await navigator.clipboard.writeText(String(supplier.id));
      toast.success(t('supplier.action.copied', 'ID de proveedor copiado'));
    } catch {
      toast.error(t('supplier.action.copy_error', 'No se pudo copiar el ID'));
    }
  };

  const dataset = useMemo(
    () => (hasSearched ? searchResults : suppliers),
    [hasSearched, searchResults, suppliers]
  );

  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => dataset.some((item: any) => item.id === id)));
  }, [dataset]);

  const performSearch = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) {
        setHasSearched(false);
        setIsSearchPending(false);
        clearError();
        setSelectedIds([]);
        useSupplierDirectoryStore.setState({ searchResults: [], lastSearchTerm: '' });
        return;
      }

      setHasSearched(true);
      setIsSearchPending(true);
      try {
        await searchSuppliers(trimmed);
      } catch (err: any) {
        toast.error(err?.message || t('supplier.search.error', 'No se pudo completar la búsqueda'));
      } finally {
        setIsSearchPending(false);
      }
    },
    [clearError, searchSuppliers, t, toast]
  );

  const debouncedSearch = useDebounce(performSearch, 500);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (!value.trim()) {
      setHasSearched(false);
      debouncedSearch('');
    } else {
      debouncedSearch(value);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      performSearch(searchTerm);
    }
  };

  const handleSelectSupplier = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === dataset.length && dataset.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(dataset.map((s: any) => s.id));
    }
  };

  const toggleActionMenu = (event: React.MouseEvent, supplier: any) => {
    event.stopPropagation();
    const buttonNode = event.currentTarget;
    const rect = buttonNode.getBoundingClientRect();
    setMenuContext((current: any) =>
      current?.id === supplier.id
        ? null
        : { id: supplier.id, supplier, button: buttonNode, rect }
    );
  };

  const isLoading = loading || isSearchPending;

  const openCreateModal = () => {
    setCurrentSupplier(null);
    setIsFormOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction.supplier || !pendingAction.type) return;

    const { supplier, type } = pendingAction;
    let result;

    try {
      if (type === 'delete') {
        result = await deleteSupplier(supplier.id);
        if (result?.success) {
          toast.success(t('supplier.delete.success', 'Proveedor desactivado'));
        }
      } else if (type === 'reactivate') {
        result = await reactivateSupplier(supplier.id);
        if (result?.success) {
          toast.success(t('supplier.reactivate.success', 'Proveedor reactivado'));
        }
      }

      if (!result?.success) {
        toast.error(result?.error || t('supplier.action.error', 'No se pudo completar la acción'));
      } else {
        await refreshAfterMutation();
      }
    } catch (err: any) {
      toast.error(err?.message || t('supplier.action.error', 'No se pudo completar la acción'));
    } finally {
      setPendingAction({ type: null, supplier: null });
      closeMenu();
    }
  };

  const pendingMessage = useMemo(() => {
    if (!pendingAction.supplier || !pendingAction.type) return '';
    const name = pendingAction.supplier.name || pendingAction.supplier.displayName || '-';
    if (pendingAction.type === 'delete') {
      return t('supplier.delete.message', `Esta acción marcará como inactivo al proveedor "${name}".`).replace('{name}', name);
    }
    return t('supplier.reactivate.message', `Esta acción reactivará al proveedor "${name}".`).replace('{name}', name);
  }, [pendingAction, t]);

  return {
    state: {
      dataset, searchTerm, selectedIds, hasSearched, isFormOpen, currentSupplier, detailsSupplier,
      menuContext, pendingAction, pendingMessage, isLoading, error, toasts: toast.toasts
    },
    actions: {
      handleSearchChange, handleSearchKeyDown, handleSelectSupplier, handleSelectAll,
      toggleActionMenu, openCreateModal, handleConfirmAction,
      setIsFormOpen, setDetailsSupplier, setPendingAction, refreshAfterMutation,
      closeMenu, handleViewSupplier, handleAnalyzeSupplier, handleEditSupplier, handleCopySupplierId, handleDeleteSupplier, handleReactivateSupplier,
      removeToast: toast.removeToast, t
    }
  };
}