/**
 * Componente ReservationStats - Panel de estadísticas de reservas
 * Muestra métricas clave en cards informativas
 */

import React from 'react';
import { Calendar, Clock, CheckCircle, XCircle, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

const ReservationStats = ({ stats = {}, className = '' }) => {
  const { t } = useI18n();

  // Valores por defecto
  const defaultStats = {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    ...stats
  };

  // Calcular estadísticas derivadas
  const activeReservations = defaultStats.pending + defaultStats.confirmed;
  const completionRate = defaultStats.total > 0 
    ? ((defaultStats.completed / defaultStats.total) * 100).toFixed(1)
    : '0';
  const cancellationRate = defaultStats.total > 0 
    ? ((defaultStats.cancelled / defaultStats.total) * 100).toFixed(1)
    : '0';

  // Configuración de cards de estadísticas
  const statCards = [
    {
      title: t('reservations.stats.total') || 'Total Reservas',
      value: defaultStats.total,
      icon: Calendar,
      description: t('reservations.stats.total_desc') || 'Reservas registradas',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('reservations.stats.today') || 'Hoy',
      value: defaultStats.today,
      icon: Clock,
      description: t('reservations.stats.today_desc') || 'Reservas para hoy',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('reservations.stats.active') || 'Activas',
      value: activeReservations,
      icon: TrendingUp,
      description: t('reservations.stats.active_desc') || 'Pendientes + Confirmadas',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: t('reservations.stats.completed') || 'Completadas',
      value: defaultStats.completed,
      icon: CheckCircle,
      description: `${completionRate}% ${t('reservations.stats.completion_rate') || 'de finalización'}`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  // Estados de reserva con badges
  const statusStats = [
    {
      label: t('reservations.status.reserved') || 'Reservado',
      value: defaultStats.pending,
      variant: 'warning'
    },
    {
      label: t('reservations.status.confirmed') || 'Confirmado',
      value: defaultStats.confirmed,
      variant: 'success'
    },
    {
      label: t('reservations.status.completed') || 'Completado',
      value: defaultStats.completed,
      variant: 'secondary'
    },
    {
      label: t('reservations.status.cancelled') || 'Cancelado',
      value: defaultStats.cancelled,
      variant: 'destructive'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`} data-testid="reservation-stats">
      {/* Cards principales de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stat.description}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Panel de estados y métricas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estados de reserva */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('reservations.stats.by_status') || 'Por Estado'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusStats.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant} className="min-w-[80px] justify-center">
                      {status.label}
                    </Badge>
                  </div>
                  <span className="font-semibold">{status.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Métricas de rendimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('reservations.stats.performance') || 'Rendimiento'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('reservations.stats.completion_rate') || 'Tasa de finalización'}
                </span>
                <span className="font-semibold text-green-600">
                  {completionRate}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('reservations.stats.cancellation_rate') || 'Tasa de cancelación'}
                </span>
                <span className="font-semibold text-red-600">
                  {cancellationRate}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('reservations.stats.this_week') || 'Esta semana'}
                </span>
                <span className="font-semibold">
                  {defaultStats.thisWeek}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('reservations.stats.this_month') || 'Este mes'}
                </span>
                <span className="font-semibold">
                  {defaultStats.thisMonth}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReservationStats;
