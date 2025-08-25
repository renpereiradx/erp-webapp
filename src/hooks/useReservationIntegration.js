/**
 * Hook para integración opcional entre Ventas y Reservas
 * Permite vincular una reserva existente a una venta (flujo reserva → venta)
 * Mantiene separación de concerns mientras preserva la funcionalidad de integración
 */

import { useState, useCallback, useMemo } from 'react';
import useReservationStore from '@/store/useReservationStore';
import { useI18n } from '@/lib/i18n';

export const useReservationIntegration = () => {
  const { t } = useI18n();
  const [linkedReservation, setLinkedReservation] = useState(null);
  
  // Acceso al store de reservas para consultas
  const {
    reservations,
    getReservationById,
    updateReservation
  } = useReservationStore();

  // Verificar si hay reservas disponibles para vincular
  const canLinkReservation = useMemo(() => {
    // Solo permitir vinculación si hay reservas confirmadas sin venta asociada
    return reservations?.some(reservation => 
      reservation.status === 'confirmed' && 
      !reservation.sale_id
    ) || false;
  }, [reservations]);

  // Obtener reservas disponibles para vincular
  const getAvailableReservations = useCallback(() => {
    if (!reservations) return [];
    
    return reservations.filter(reservation => 
      reservation.status === 'confirmed' && 
      !reservation.sale_id
    );
  }, [reservations]);

  // Vincular una reserva a la venta actual
  const linkReservation = useCallback((reservation) => {
    if (!reservation) return;
    
    setLinkedReservation(reservation);
    
    console.log('[telemetry] sales.reservation.linked', {
      reservationId: reservation.id,
      reservationAmount: reservation.total_amount,
      clientId: reservation.client_id
    });
  }, []);

  // Desvincular reserva actual
  const unlinkReservation = useCallback(() => {
    if (linkedReservation) {
      console.log('[telemetry] sales.reservation.unlinked', {
        reservationId: linkedReservation.id
      });
    }
    
    setLinkedReservation(null);
  }, [linkedReservation]);

  // Obtener detalles formateados de la reserva vinculada
  const getReservationDetails = useCallback((reservation) => {
    if (!reservation) return '';
    
    const startTime = new Date(reservation.start_time);
    const date = startTime.toLocaleDateString('es-ES');
    const time = startTime.toTimeString().slice(0, 5);
    
    return `${reservation.product_name || reservation.product_id} - ${date} ${time}`;
  }, []);

  // Validar compatibilidad entre reserva y venta
  const validateReservationCompatibility = useCallback((reservation, saleData) => {
    const issues = [];
    
    // Verificar que el cliente coincida
    if (reservation.client_id !== saleData.client_id) {
      issues.push(t('sales.reservation.validation.client_mismatch') || 'Cliente no coincide');
    }
    
    // Verificar que la reserva esté confirmada
    if (reservation.status !== 'confirmed') {
      issues.push(t('sales.reservation.validation.not_confirmed') || 'Reserva no confirmada');
    }
    
    // Verificar que no tenga ya una venta asociada
    if (reservation.sale_id) {
      issues.push(t('sales.reservation.validation.already_linked') || 'Ya tiene venta asociada');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }, [t]);

  // Finalizar vinculación al completar la venta
  const finalizeReservationLink = useCallback(async (saleId) => {
    if (!linkedReservation || !saleId) return;
    
    try {
      // Actualizar la reserva con el ID de la venta
      await updateReservation(linkedReservation.id, {
        sale_id: saleId,
        status: 'completed' // Marcar como completada al vincular con venta
      });
      
      console.log('[telemetry] sales.reservation.finalized', {
        reservationId: linkedReservation.id,
        saleId,
        newStatus: 'completed'
      });
      
      // Limpiar el estado local
      setLinkedReservation(null);
      
      return true;
    } catch (error) {
      console.error('[telemetry] sales.reservation.finalize.error', {
        reservationId: linkedReservation.id,
        saleId,
        error: error.message
      });
      
      throw error;
    }
  }, [linkedReservation, updateReservation]);

  // Obtener información de la reserva por ID
  const getReservationInfo = useCallback(async (reservationId) => {
    try {
      const reservation = await getReservationById(reservationId);
      return reservation;
    } catch (error) {
      console.error('[telemetry] sales.reservation.get_info.error', {
        reservationId,
        error: error.message
      });
      return null;
    }
  }, [getReservationById]);

  // Obtener estadísticas de integración
  const getIntegrationStats = useMemo(() => {
    if (!reservations) return null;
    
    const total = reservations.length;
    const withSales = reservations.filter(r => r.sale_id).length;
    const available = reservations.filter(r => 
      r.status === 'confirmed' && !r.sale_id
    ).length;
    
    return {
      totalReservations: total,
      linkedToSales: withSales,
      availableToLink: available,
      linkingRate: total > 0 ? (withSales / total * 100).toFixed(1) : 0
    };
  }, [reservations]);

  return {
    // Estado
    linkedReservation,
    canLinkReservation,
    
    // Acciones principales
    linkReservation,
    unlinkReservation,
    finalizeReservationLink,
    
    // Utilidades
    getReservationDetails,
    getAvailableReservations,
    getReservationInfo,
    validateReservationCompatibility,
    
    // Estadísticas
    getIntegrationStats
  };
};

export default useReservationIntegration;
