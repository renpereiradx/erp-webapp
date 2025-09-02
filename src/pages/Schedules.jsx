/**
 * Página de Gestión de Horarios (Schedules)
 * Siguiendo guía MVP: funcionalidad básica navegable
 * Para administración de horarios y disponibilidad de servicios
 */

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, Search, Edit, ToggleLeft, ToggleRight, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import DataState from '@/components/ui/DataState';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';

// Stores
import useScheduleStore from '@/store/useScheduleStore';
import useProductStore from '@/store/useProductStore';

const Schedules = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  
  // Estados del store
  const {
    schedules,
    loading,
    error,
    fetchSchedules,
    updateScheduleAvailability,
    generateDailySchedules,
    generateSchedulesForDate,
    generateSchedulesForNextDays,
    clearError
  } = useScheduleStore();

  const { products, fetchProducts } = useProductStore();

  // Estados locales para UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    type: 'daily', // 'daily', 'date', 'next-days'
    targetDate: '',
    days: 7
  });
  // Paginación cliente
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cargar datos al montar
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    fetchSchedules({
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      page: 1,
      pageSize: 50
    });
    fetchProducts();
  }, [fetchSchedules, fetchProducts]);

  // Filtrar horarios
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.id?.toString().includes(searchTerm);
    const matchesProduct = !selectedProduct || schedule.product_id === selectedProduct;
    const matchesDate = !dateFilter || schedule.start_time.startsWith(dateFilter);
    
    return matchesSearch && matchesProduct && matchesDate;
  });

  // Ajustar página si los filtros reducen el total
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredSchedules.length, pageSize, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const paginatedSchedules = filteredSchedules.slice(pageStart, pageEnd);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  // Reset page on key filter changes
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedProduct, dateFilter, pageSize]);

  // Handlers
  const handleToggleAvailability = async (schedule) => {
    try {
      await updateScheduleAvailability(schedule.id, !schedule.is_available);
    } catch (error) {
      console.error('Error updating schedule availability:', error);
    }
  };

  const handleGenerateSchedules = async (e) => {
    e.preventDefault();
    
    try {
      switch (generateForm.type) {
        case 'daily':
          await generateDailySchedules();
          break;
        case 'date':
          await generateSchedulesForDate(generateForm.targetDate);
          break;
        case 'next-days':
          await generateSchedulesForNextDays(generateForm.days);
          break;
        default:
          break;
      }
      
      setShowGenerateModal(false);
      setGenerateForm({
        type: 'daily',
        targetDate: '',
        days: 7
      });

      // Recargar horarios
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      fetchSchedules({
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
        page: 1,
        pageSize: 50
      });
    } catch (error) {
      console.error('Error generating schedules:', error);
    }
  };

  // Estados de UI
  if (loading && schedules.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }

  if (error) {
    return (
      <DataState 
        variant="error" 
        title={t('schedules.error.title', 'Error')}
        message={error}
        onRetry={() => {
          clearError();
          fetchSchedules();
        }}
      />
    );
  }

  return (
    <div className={styles.container()} data-testid="schedules-page">
      <PageHeader
        title={t('schedules.title', 'Gestión de Horarios')}
        subtitle={t('schedules.subtitle', 'Administra la disponibilidad de horarios para servicios')}
        breadcrumb={[
          { label: t('navigation.operations', 'Operaciones'), href: '/dashboard' }, 
          { label: t('schedules.title', 'Horarios') }
        ]}
      />

      {/* Filtros y acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('schedules.search.placeholder', 'Buscar horarios...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${styles.input()}`}
          />
        </div>

        {/* Filtro por producto */}
        <div>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className={styles.input()}
          >
            <option value="">{t('schedules.filter.all_products', 'Todos los servicios')}</option>
            {products
              .filter(product => product.type === 'service' || product.reservable)
              .map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))
            }
          </select>
        </div>

        {/* Filtro por fecha */}
        <div>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={styles.input()}
            placeholder={t('schedules.filter.date', 'Filtrar por fecha')}
          />
        </div>

        {/* Botón generar horarios */}
        <div>
          <Button 
            onClick={() => setShowGenerateModal(true)} 
            variant="primary"
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            {t('schedules.generate', 'Generar Horarios')}
          </Button>
        </div>
      </div>

      {/* Lista de horarios */}
      {!loading && filteredSchedules.length === 0 ? (
        <DataState
          variant="empty"
          title={t('schedules.empty.title', 'Sin horarios')}
          message={t('schedules.empty.message', 'No hay horarios registrados para los filtros actuales')}
          actionLabel={t('schedules.generate', 'Generar Horarios')}
          onAction={() => setShowGenerateModal(true)}
        />
      ) : (
        <>
          {/* Controles de paginación */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="text-sm text-muted-foreground">
              {filteredSchedules.length > 0 ? (
                <span>
                  {t('pagination.showing', 'Mostrando')} {pageStart + 1}-{Math.min(pageEnd, filteredSchedules.length)} {t('pagination.of', 'de')} {filteredSchedules.length}
                </span>
              ) : (
                <span>{t('pagination.no_results', 'Sin resultados')}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">
                {t('pagination.page_size', 'Por página')}:
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className={styles.input('!py-1 !h-8')}
              >
                {[5,10,20,30,50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          {paginatedSchedules.map(schedule => (
            <Card key={schedule.id} className={styles.card()}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">
                        {schedule.product_name || `Producto ID: ${schedule.product_id}`}
                      </h3>
                      <Badge 
                        variant={schedule.is_available ? 'default' : 'secondary'}
                      >
                        {schedule.is_available ? 
                          t('schedules.status.available', 'Disponible') : 
                          t('schedules.status.unavailable', 'No Disponible')
                        }
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          <strong>Fecha:</strong> {new Date(schedule.start_time).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          <strong>Horario:</strong> {new Date(schedule.start_time).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} - {new Date(schedule.end_time).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div>
                        <strong>ID:</strong> {schedule.id}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleToggleAvailability(schedule)}
                      className={`border-2 border-black ${
                        schedule.is_available ? 'bg-green-100' : 'bg-red-100'
                      }`}
                      title={
                        schedule.is_available ? 
                          t('schedules.disable', 'Deshabilitar') : 
                          t('schedules.enable', 'Habilitar')
                      }
                    >
                      {schedule.is_available ? (
                        <ToggleRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-red-600" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
          {/* Navegación páginas */}
          {filteredSchedules.length > pageSize && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >«</Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >{t('pagination.prev', 'Anterior')}</Button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
                // Si hay muchas páginas, mostrar primeras 3, última y alrededor de la actual (simplificado)
                const page = idx + 1;
                if (totalPages > 7) {
                  const show = page <= 2 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  if (!show) return null;
                }
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => goToPage(page)}
                  >{page}</Button>
                );
              })}
              {totalPages > 7 && currentPage < totalPages - 2 && (
                <span className="px-2">…</span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >{t('pagination.next', 'Siguiente')}</Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >»</Button>
            </div>
          )}
        </>
      )}

      {/* Modal Generar Horarios */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={styles.container('max-w-md w-full mx-4')}>
            <Card className={styles.card()}>
              <CardHeader>
                <CardTitle className={styles.header('h3')}>
                  {t('schedules.modal.generate', 'Generar Horarios')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateSchedules} className="space-y-4">
                  <div>
                    <label className={styles.label()}>
                      {t('schedules.generate_type', 'Tipo de Generación')}
                    </label>
                    <select
                      value={generateForm.type}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, type: e.target.value }))}
                      className={styles.input()}
                      required
                    >
                      <option value="daily">
                        {t('schedules.generate.daily', 'Horarios diarios automáticos')}
                      </option>
                      <option value="date">
                        {t('schedules.generate.date', 'Para fecha específica')}
                      </option>
                      <option value="next-days">
                        {t('schedules.generate.next_days', 'Próximos N días')}
                      </option>
                    </select>
                  </div>

                  {generateForm.type === 'date' && (
                    <div>
                      <label className={styles.label()}>
                        {t('schedules.target_date', 'Fecha Objetivo')}
                      </label>
                      <Input
                        type="date"
                        value={generateForm.targetDate}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, targetDate: e.target.value }))}
                        className={styles.input()}
                        required
                      />
                    </div>
                  )}

                  {generateForm.type === 'next-days' && (
                    <div>
                      <label className={styles.label()}>
                        {t('schedules.days_count', 'Número de Días')}
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={generateForm.days}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, days: parseInt(e.target.value) }))}
                        className={styles.input()}
                        required
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1"
                      variant="primary"
                    >
                      {loading ? 
                        t('action.generating', 'Generando...') : 
                        t('action.generate', 'Generar')
                      }
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => setShowGenerateModal(false)}
                      className="flex-1"
                    >
                      {t('action.cancel', 'Cancelar')}
                    </Button>
                  </div>
                </form>
                
                {error && (
                  <p className="text-red-600 text-sm mt-2 font-bold">
                    {error}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;