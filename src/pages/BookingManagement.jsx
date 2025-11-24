/**
 * Página de Gestión de Reservas - MVP
 * Implementación siguiendo GUIA_MVP_DESARROLLO.md y FLUENT_DESIGN_SYSTEM.md
 *
 * Funcionalidades:
 * - Header con navegación
 * - Sistema de tabs (Radix UI)
 * - Tab "Reservas": Listado, filtros, búsqueda, paginación
 * - Estados: Loading, Error, Empty (DataState)
 * - Integración con useReservationStore
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  ChevronDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataState from '@/components/ui/DataState';
import BookingFormModal from '@/components/BookingFormModal';
import { useI18n } from '@/lib/i18n';
import useReservationStore from '@/store/useReservationStore';
import useProductStore from '@/store/useProductStore';
import useClientStore from '@/store/useClientStore';

const BookingManagement = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  // Estados del store
  const {
    reservations,
    loading,
    error,
    fetchReservations,
    clearError
  } = useReservationStore();

  const { products, fetchProducts } = useProductStore();
  const { searchResults: clients } = useClientStore();

  // Estados locales para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);

  // Cargar datos al montar
  useEffect(() => {
    fetchReservations();
    fetchProducts();
    // Note: Clients are loaded on-demand via search, not pre-loaded
  }, [fetchReservations, fetchProducts]);

  // Filtrado local de reservas
  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      // Filtro por búsqueda (nombre de cliente)
      const clientName = reservation.client_name || '';
      const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por producto
      const matchesProduct = selectedProduct === 'all' ||
        reservation.product_id === parseInt(selectedProduct);

      // Filtro por cliente
      const matchesClient = selectedClient === 'all' ||
        reservation.client_id === parseInt(selectedClient);

      // Filtro por estado
      const matchesStatus = selectedStatus === 'all' ||
        reservation.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesProduct && matchesClient && matchesStatus;
    });
  }, [reservations, searchTerm, selectedProduct, selectedClient, selectedStatus]);

  // Paginación local
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProduct, selectedClient, selectedStatus]);

  // Handlers
  const handleBack = () => {
    navigate('/gestion-reservas');
  };

  const handleCreateReservation = () => {
    setEditingReservation(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReservation(null);
  };

  const handleModalSuccess = () => {
    // Refresh reservations list after creating/updating
    fetchReservations();
  };

  const handleRetry = () => {
    clearError();
    fetchReservations();
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'confirmed' || statusLower === 'confirmada') {
      return 'status-badge--confirmed';
    }
    if (statusLower === 'pending' || statusLower === 'pendiente') {
      return 'status-badge--pending';
    }
    if (statusLower === 'cancelled' || statusLower === 'cancelada') {
      return 'status-badge--cancelled';
    }
    return '';
  };

  const getStatusLabel = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'confirmed') return t('booking.status.confirmed');
    if (statusLower === 'pending') return t('booking.status.pending');
    if (statusLower === 'cancelled') return t('booking.status.cancelled');
    if (statusLower === 'completed') return t('booking.status.completed');
    return status || '-';
  };

  const formatDuration = (duration) => {
    if (!duration) return '-';
    return `${duration} ${t('booking.duration.minutes')}`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Estados de UI
  if (loading && reservations.length === 0) {
    return (
      <div className="booking-management-page">
        <DataState variant="loading" skeletonVariant="list" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-management-page">
        <DataState
          variant="error"
          title={t('booking.error.title')}
          message={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="booking-management-page">
      {/* Header con navegación */}
      <header className="booking-management-page__header">
        <div className="booking-management-page__header-left">
          <button
            className="booking-management-page__back-button"
            onClick={handleBack}
            aria-label={t('booking.action.back')}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="booking-management-page__title">
            {t('booking.title')}
          </h1>
        </div>

        <div className="booking-management-page__header-actions">
          <Button
            className="btn btn--primary"
            onClick={handleCreateReservation}
          >
            <Plus size={20} />
            {t('booking.action.create')}
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="reservations" className="booking-management-page__tabs">
        <TabsList>
          <TabsTrigger value="reservations">
            {t('booking.tab.reservations')}
          </TabsTrigger>
          {/* Tabs adicionales para futuro */}
          {/* <TabsTrigger value="dashboard">
            {t('booking.tab.dashboard')}
          </TabsTrigger> */}
        </TabsList>

        {/* Tab: Reservas */}
        <TabsContent value="reservations" className="booking-management-page__tab-content">
          {/* Barra de filtros */}
          <div className="filters-bar">
            <div className="filters-bar__filters">
              {/* Filtro: Producto */}
              <select
                className="filter-button"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                aria-label={t('booking.filter.product')}
              >
                <option value="all">{t('booking.filter.all_products')}</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              {/* Filtro: Cliente */}
              <select
                className="filter-button"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                aria-label={t('booking.filter.client')}
              >
                <option value="all">{t('booking.filter.all_clients')}</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>

              {/* Filtro: Estado */}
              <select
                className="filter-button"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label={t('booking.filter.status')}
              >
                <option value="all">{t('booking.filter.all_statuses')}</option>
                <option value="confirmed">{t('booking.status.confirmed')}</option>
                <option value="pending">{t('booking.status.pending')}</option>
                <option value="cancelled">{t('booking.status.cancelled')}</option>
              </select>
            </div>

            {/* Búsqueda */}
            <div className="filters-bar__search">
              <div className="search-input">
                <Search className="search-input__icon" size={20} />
                <input
                  type="text"
                  className="search-input__field"
                  placeholder={t('booking.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label={t('booking.search.placeholder')}
                />
              </div>
            </div>
          </div>

          {/* Tabla de reservas */}
          {filteredReservations.length === 0 ? (
            <DataState
              variant="empty"
              title={searchTerm || selectedProduct !== 'all' || selectedClient !== 'all' || selectedStatus !== 'all'
                ? t('booking.empty.no_results')
                : t('booking.empty.title')}
              message={t('booking.empty.message')}
              actionLabel={t('booking.action.create')}
              onAction={handleCreateReservation}
            />
          ) : (
            <>
              <div className="reservations-table">
                <div className="reservations-table__wrapper">
                  <table className="reservations-table__table" role="table">
                    <thead className="reservations-table__thead">
                      <tr>
                        <th className="reservations-table__th" scope="col">
                          {t('booking.table.product')}
                        </th>
                        <th className="reservations-table__th" scope="col">
                          {t('booking.table.client')}
                        </th>
                        <th className="reservations-table__th" scope="col">
                          {t('booking.table.user')}
                        </th>
                        <th className="reservations-table__th" scope="col">
                          {t('booking.table.created_date')}
                        </th>
                        <th className="reservations-table__th" scope="col">
                          {t('booking.table.status')}
                        </th>
                        <th className="reservations-table__th" scope="col">
                          {t('booking.table.duration')}
                        </th>
                        <th className="reservations-table__th reservations-table__th--right" scope="col">
                          {t('booking.table.total')}
                        </th>
                        <th className="reservations-table__th reservations-table__th--center" scope="col">
                          {t('booking.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="reservations-table__tbody">
                      {paginatedReservations.map((reservation) => (
                        <tr key={reservation.id || reservation.reserve_id} className="reservations-table__tr">
                          <td className="reservations-table__td reservations-table__td--product">
                            {reservation.product_name || '-'}
                          </td>
                          <td className="reservations-table__td reservations-table__td--secondary">
                            {reservation.client_name || '-'}
                          </td>
                          <td className="reservations-table__td reservations-table__td--secondary">
                            {reservation.user_email || reservation.created_by || '-'}
                          </td>
                          <td className="reservations-table__td reservations-table__td--secondary">
                            {formatDateTime(reservation.created_at)}
                          </td>
                          <td className="reservations-table__td">
                            <div className={`status-badge ${getStatusBadgeClass(reservation.status)}`}>
                              <span className="status-badge__dot"></span>
                              {getStatusLabel(reservation.status)}
                            </div>
                          </td>
                          <td className="reservations-table__td reservations-table__td--secondary">
                            {formatDuration(reservation.duration)}
                          </td>
                          <td className="reservations-table__td reservations-table__td--right">
                            {formatCurrency(reservation.total_amount)}
                          </td>
                          <td className="reservations-table__td reservations-table__td--center">
                            <button
                              className="actions-menu-button"
                              aria-label={t('booking.table.actions')}
                              title={t('booking.table.actions')}
                            >
                              <MoreVertical size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="pagination">
                  <div className="pagination__info">
                    {t('booking.pagination.showing')}{' '}
                    <span className="pagination__info-highlight">
                      {startIndex + 1}{t('booking.pagination.to')}{Math.min(endIndex, filteredReservations.length)}
                    </span>{' '}
                    {t('booking.pagination.of')}{' '}
                    <span className="pagination__info-highlight">
                      {filteredReservations.length}
                    </span>
                  </div>

                  <div className="pagination__controls">
                    <button
                      className="pagination__button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      aria-label={t('booking.pagination.previous')}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`pagination__button ${page === currentPage ? 'pagination__button--active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                        aria-label={`Página ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      className="pagination__button"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      aria-label={t('booking.pagination.next')}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de crear/editar reserva */}
      <BookingFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingReservation={editingReservation}
      />
    </div>
  );
};

export default BookingManagement;
