/**
 * Componente ReservationCard - Tarjeta de reserva individual
 * Muestra información de una reserva con acciones rápidas
 */

import React from 'react';
import { Calendar, Clock, User, Package, MoreHorizontal, Edit, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n';
import useFocusManagement from '@/hooks/useFocusManagement';

const ReservationCard = ({ 
  reservation, 
  onEdit, 
  onCancel, 
  onConfirm, 
  onView,
  className = '' 
}) => {
  const { t } = useI18n();
  const { announce } = useFocusManagement();

  if (!reservation) return null;

  // Determinar estado visual de la reserva
  const getStatusConfig = (status) => {
    const configs = {
      'RESERVED': {
        label: t('reservations.status.reserved') || 'Reservado',
        variant: 'warning',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      'confirmed': {
        label: t('reservations.status.confirmed') || 'Confirmado',
        variant: 'success',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      'completed': {
        label: t('reservations.status.completed') || 'Completado',
        variant: 'secondary',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      },
      'cancelled': {
        label: t('reservations.status.cancelled') || 'Cancelado',
        variant: 'destructive',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    };
    return configs[status] || configs['RESERVED'];
  };

  const statusConfig = getStatusConfig(reservation.status);

  // Formatear fecha y hora
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const startDateTime = formatDateTime(reservation.start_time);
  const endDateTime = formatDateTime(reservation.end_time);

  // Determinar acciones disponibles según estado
  const canEdit = reservation.status === 'RESERVED';
  const canConfirm = reservation.status === 'RESERVED';
  const canCancel = ['RESERVED', 'confirmed'].includes(reservation.status);

  // Handlers con anuncios de accesibilidad
  const handleConfirm = (id) => {
    onConfirm?.(id);
    announce(t('reservations.a11y.confirming') || 'Confirmando reserva...');
  };

  const handleCancel = (id) => {
    onCancel?.(id);
    announce(t('reservations.a11y.cancelling') || 'Cancelando reserva...');
  };

  const handleEdit = (reservation) => {
    onEdit?.(reservation);
    announce(t('reservations.a11y.editing') || 'Abriendo formulario de edición...');
  };

  const handleView = (reservation) => {
    onView?.(reservation);
    announce(t('reservations.a11y.viewing') || 'Mostrando detalles de la reserva...');
  };

  // Generar descripción accesible de la reserva
  const getAccessibleDescription = () => {
    const parts = [
      `Reserva ${statusConfig.label}`,
      reservation.product_name && `para ${reservation.product_name}`,
      reservation.client_name && `cliente ${reservation.client_name}`,
      startDateTime.date && `el ${startDateTime.date}`,
      startDateTime.time && `a las ${startDateTime.time}`,
      reservation.duration && `duración ${reservation.duration} horas`
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  return (
    <Card 
      className={`${statusConfig.bgColor} ${statusConfig.borderColor} transition-all hover:shadow-md ${className}`}
      data-testid={`reservation-card-${reservation.id}`}
      role="article"
      aria-labelledby={`reservation-${reservation.id}-title`}
      aria-describedby={`reservation-${reservation.id}-description`}
      tabIndex={0}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div 
              id={`reservation-${reservation.id}-title`}
              className="flex items-center gap-2 mb-2"
            >
              <Badge 
                variant={statusConfig.variant}
                aria-label={t('reservations.a11y.status_badge', { status: statusConfig.label }) ||
                  `Estado de la reserva: ${statusConfig.label}`}
              >
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-gray-500" aria-label="Número de reserva">
                #{reservation.id}
              </span>
            </div>
            
            {/* Información del producto/servicio */}
            {(reservation.product_name || reservation.product_id) && (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Package className="w-4 h-4" aria-hidden="true" />
                <span aria-label={t('reservations.a11y.service') || 'Servicio'}>
                  {reservation.product_name || reservation.product_id}
                </span>
              </div>
            )}
            
            {/* Información del cliente */}
            {(reservation.client_name || reservation.client_id) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <User className="w-4 h-4" aria-hidden="true" />
                <span aria-label={t('reservations.a11y.client') || 'Cliente'}>
                  {reservation.client_name || reservation.client_id}
                </span>
              </div>
            )}
          </div>

          {/* Menú de acciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                aria-label={t('reservations.a11y.actions_menu', { id: reservation.id }) ||
                  `Abrir menú de acciones para reserva ${reservation.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">
                  {t('reservations.actions.menu') || 'Abrir menú'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" aria-label="Acciones de reserva">
              <DropdownMenuItem 
                onClick={() => handleView(reservation)}
                aria-label={t('reservations.a11y.view_details') || 'Ver detalles completos de la reserva'}
              >
                <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                {t('reservations.actions.view') || 'Ver detalles'}
              </DropdownMenuItem>
              
              {canEdit && (
                <DropdownMenuItem 
                  onClick={() => handleEdit(reservation)}
                  aria-label={t('reservations.a11y.edit_reservation') || 'Editar información de la reserva'}
                >
                  <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('reservations.actions.edit') || 'Editar'}
                </DropdownMenuItem>
              )}
              
              {canConfirm && (
                <DropdownMenuItem 
                  onClick={() => handleConfirm(reservation.id)}
                  aria-label={t('reservations.a11y.confirm_reservation') || 'Confirmar esta reserva'}
                >
                  <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('reservations.actions.confirm') || 'Confirmar'}
                </DropdownMenuItem>
              )}
              
              {canCancel && (
                <DropdownMenuItem 
                  onClick={() => handleCancel(reservation.id)}
                  className="text-red-600"
                  aria-label={t('reservations.a11y.cancel_reservation') || 'Cancelar esta reserva'}
                >
                  <X className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('reservations.actions.cancel') || 'Cancelar'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Descripción accesible oculta */}
        <div id={`reservation-${reservation.id}-description`} className="sr-only">
          {getAccessibleDescription()}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Fecha y hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm" role="group" aria-label="Información de fecha y hora">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" aria-hidden="true" />
              <div>
                <div className="font-medium" aria-label={`Fecha de la reserva: ${startDateTime.date}`}>
                  {startDateTime.date}
                </div>
                {reservation.duration && (
                  <div className="text-gray-500" aria-label={`Duración: ${reservation.duration} horas`}>
                    {t('reservations.card.duration', { hours: reservation.duration }) || `${reservation.duration}h duración`}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" aria-hidden="true" />
              <div>
                <div className="font-medium" aria-label={`Horario: de ${startDateTime.time} a ${endDateTime.time}`}>
                  {startDateTime.time} - {endDateTime.time}
                </div>
                {reservation.total_amount && (
                  <div className="text-green-600 font-semibold" aria-label={`Precio total: $${reservation.total_amount}`}>
                    ${reservation.total_amount}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descripción del producto si está disponible */}
          {reservation.product_description && (
            <div 
              className="text-sm text-gray-600 bg-white/50 rounded p-2 border"
              role="note"
              aria-label="Descripción del servicio"
            >
              {reservation.product_description}
            </div>
          )}

          {/* Botones de acción rápida */}
          <div className="flex gap-2 pt-2" role="group" aria-label="Acciones rápidas">
            {canConfirm && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConfirm(reservation.id)}
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                aria-label={t('reservations.a11y.quick_confirm') || 'Acción rápida: confirmar reserva'}
              >
                <Check className="w-4 h-4 mr-1" aria-hidden="true" />
                {t('reservations.actions.confirm') || 'Confirmar'}
              </Button>
            )}
            
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(reservation)}
                className="flex-1"
                aria-label={t('reservations.a11y.quick_edit') || 'Acción rápida: editar reserva'}
              >
                <Edit className="w-4 h-4 mr-1" aria-hidden="true" />
                {t('reservations.actions.edit') || 'Editar'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservationCard;
