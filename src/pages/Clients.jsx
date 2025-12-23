// ===========================================================================
// Clients Page - MVP Implementation
// Patrón: Fluent Design System 2 + BEM + Zustand
// Basado en: docs/GUIA_MVP_DESARROLLO.md y diseño de Products
// ===========================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Share, Plus, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import useClientStore from '@/store/useClientStore';
import ClientFormModal from '@/components/ClientFormModal';
import ClientDetailsModal from '@/components/ClientDetailsModal';
import '@/styles/scss/pages/_clients.scss';

/**
 * Custom hook para debounce
 * @param {Function} callback - Función a ejecutar después del debounce
 * @param {number} delay - Retraso en milisegundos
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

  // Cleanup al desmontar
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

  // Zustand store
  const {
    searchResults,
    loading,
    error,
    totalClients,
    page,
    totalPages,
    setPage,
    clearError,
    searchClients,
  } = useClientStore();

  // Use searchResults as clients for the page
  const clients = searchResults;

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Función de búsqueda
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
    } catch (error) {
      // El error ya se maneja en el store, no es necesario registrarlo aquí
    } finally {
      setIsSearching(false);
    }
  }, [searchClients, clearError]);

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
        // Ejecutar búsqueda inmediatamente al presionar Enter
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
    if (selectedIds.length === clients.length) {
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
    setSelectedClient(null);

    if (shouldRefresh && searchTerm) {
      // Refrescar la búsqueda actual
      await searchClients(searchTerm);
    }
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

  // Estados de UI
  const isLoading = loading || isSearching;

  return (
    <div className="clients-page">
      {/* Header */}
      <div className="clients-page__header">
        <div className="clients-page__header-left">
          <h1 className="clients-page__title">
            {t('clients.title', 'Gestión de Clientes')}
          </h1>
          <p className="clients-page__subtitle">
            {t('clients.subtitle', 'Administra, filtra y visualiza todos los clientes del sistema.')}
          </p>
        </div>

        <button
          className="btn btn--primary"
          onClick={handleCreate}
          aria-label={t('clients.action.create', 'Nuevo Cliente')}
        >
          <Plus className="btn__icon" size={20} />
          {t('clients.action.create', 'Nuevo Cliente')}
        </button>
      </div>

      {/* Toolbar */}
      <div className="clients-page__toolbar">
        <div style={{ flex: 1, maxWidth: '28rem' }}>
          <div className="search-box search-box--with-icon">
            <Search className="search-box__icon" size={20} />
            <input
              type="text"
              className="search-box__input"
              placeholder={t('clients.search.placeholder', 'Buscar por nombre, documento...')}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              aria-label={t('clients.search.label', 'Buscar clientes')}
              aria-describedby="search-helper"
            />
          </div>
          {searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
            <p id="search-helper" style={{ fontSize: '11px', marginTop: '4px', color: '#605e5c' }}>
              Escribe al menos 3 caracteres para buscar ({searchTerm.trim().length}/3)
            </p>
          )}
        </div>

        <div className="clients-page__toolbar-actions">
          <button
            className="btn btn--secondary btn--icon"
            aria-label={t('action.filter', 'Filtrar')}
            title={t('action.filter', 'Filtrar')}
          >
            <Filter size={20} />
          </button>

          <button
            className="btn btn--secondary btn--icon"
            aria-label={t('action.export', 'Exportar')}
            title={t('action.export', 'Exportar')}
          >
            <Share size={20} />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="clients-page__table-container">
        <table className="clients-table">
          <thead className="clients-table__header">
            <tr>
              <th className="clients-table__header-cell clients-table__header-cell--checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.length === clients.length && clients.length > 0}
                  onChange={handleSelectAll}
                  aria-label={t('action.select_all', 'Seleccionar todos')}
                />
              </th>
              <th className="clients-table__header-cell">
                {t('clients.table.name', 'NOMBRE DEL CLIENTE')}
              </th>
              <th className="clients-table__header-cell">
                {t('clients.table.document', 'DOCUMENTO')}
              </th>
              <th className="clients-table__header-cell">
                {t('clients.table.contact', 'CONTACTO')}
              </th>
              <th className="clients-table__header-cell">
                {t('clients.table.status', 'ESTADO')}
              </th>
              <th className="clients-table__header-cell clients-table__header-cell--actions">
                {/* Acciones */}
              </th>
            </tr>
          </thead>

          <tbody className="clients-table__body">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="clients-table__cell" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div>{t('clients.loading', 'Cargando...')}</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="clients-table__cell" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ color: 'var(--color-error)' }}>{error}</div>
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan="6" className="clients-table__cell" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div>
                    {!hasSearched
                      ? t('clients.empty.message', 'Usa la barra de búsqueda para encontrar clientes por nombre o documento')
                      : t('clients.search.no_results_message', 'No se encontraron clientes con ese criterio de búsqueda')
                    }
                  </div>
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.id || client._key}
                  className="clients-table__row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleViewDetails(client)}
                >
                  <td
                    className="clients-table__cell clients-table__cell--checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      aria-label={t('action.select_item', 'Seleccionar item')}
                    />
                  </td>

                  <td className="clients-table__cell clients-table__cell--name">
                    <span className="clients-table__name">
                      {client.displayName || client.name}
                    </span>
                  </td>

                  <td className="clients-table__cell">
                    <span className="clients-table__document">
                      {client.document_id || '-'}
                    </span>
                  </td>

                  <td className="clients-table__cell">
                    <span className="clients-table__contact">
                      {client.contact?.phone || client.contact?.email || client.contact?.raw || '-'}
                    </span>
                  </td>

                  <td className="clients-table__cell">
                    <span className={`badge badge--${client.status ? 'success' : 'default'}`}>
                      {client.status
                        ? t('clients.status.active', 'Activo')
                        : t('clients.status.inactive', 'Inactivo')
                      }
                    </span>
                  </td>

                  <td
                    className="clients-table__cell clients-table__cell--actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="action-btn"
                      aria-label={t('action.edit', 'Editar') + ' ' + (client.displayName || client.name)}
                      onClick={() => handleEdit(client)}
                    >
                      <MoreHorizontal className="action-btn__icon" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="clients-page__pagination">
          <span className="clients-page__pagination-info">
            {t('pagination.showing', 'Mostrando')} {((page - 1) * 10) + 1} {t('pagination.to', 'a')} {Math.min(page * 10, totalClients)} {t('pagination.of', 'de')} {totalClients} {t('pagination.results', 'resultados')}
          </span>

          <div className="clients-page__pagination-controls">
            <button
              className="btn btn--secondary btn--icon"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              aria-label={t('pagination.previous', 'Anterior')}
            >
              <ChevronLeft size={20} />
            </button>

            <span className="clients-page__pagination-page">
              {t('pagination.page', 'Página')} {page} {t('pagination.of', 'de')} {totalPages}
            </span>

            <button
              className="btn btn--secondary btn--icon"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              aria-label={t('pagination.next', 'Siguiente')}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Formulario */}
      {isFormModalOpen && (
        <ClientFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModal}
          client={selectedClient}
        />
      )}

      {/* Modal de Detalles */}
      {isDetailsModalOpen && (
        <ClientDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          client={selectedClient}
        />
      )}
    </div>
  );
};

export default ClientsPage;
