/**
 * Componente de calendario compacto y minimalista para reservas
 * Diseñado con estilo neo-brutalista para mayor impacto visual
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BrutalistBadge } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const CalendarReservation = ({ 
  selectedDate, 
  onDateSelect, 
  availableSlots = [],
  selectedTime,
  onTimeSelect,
  reservations = []
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);

  // Generar slots de tiempo de 9 AM a 6 PM cada 30 minutos
  useEffect(() => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break; // No mostrar después de 6:00 PM
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    setTimeSlots(slots);
  }, []);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: false,
        isPast: prevDate < new Date().setHours(0, 0, 0, 0)
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const today = new Date();
      const isToday = currentDate.toDateString() === today.toDateString();
      const isPast = currentDate < new Date().setHours(0, 0, 0, 0);

      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isToday,
        isPast
      });
    }

    // Días del mes siguiente para completar la grilla
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isToday: false,
        isPast: false
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isTimeSlotAvailable = (time) => {
    if (!selectedDate) return false;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    const timeSlotKey = `${dateStr}_${time}`;
    
    // Verificar si hay reservas en este slot
    const isBooked = reservations.some(reservation => {
      const reservationDate = new Date(reservation.startTime).toISOString().split('T')[0];
      const reservationTime = new Date(reservation.startTime).toTimeString().slice(0, 5);
      return reservationDate === dateStr && reservationTime === time;
    });
    
    return !isBooked;
  };

  const getReservationsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.startTime).toISOString().split('T')[0];
      return reservationDate === dateStr;
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="space-y-4">
      {/* Header del calendario */}
      <div className="flex items-center justify-between p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth(-1)}
          className="border-2 border-black"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h3 className="text-lg font-black uppercase tracking-wide">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth(1)}
          className="border-2 border-black"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map(day => (
          <div
            key={day}
            className="p-2 text-center text-xs font-black uppercase tracking-wide bg-gray-200 border-2 border-black"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
          const dayReservations = getReservationsForDate(day.date);
          const hasReservations = dayReservations.length > 0;
          
          return (
            <button
              key={index}
              onClick={() => day.isCurrentMonth && !day.isPast && onDateSelect(day.date)}
              disabled={!day.isCurrentMonth || day.isPast}
              className={cn(
                "relative h-10 border-2 border-black text-sm font-bold transition-all duration-150",
                day.isCurrentMonth 
                  ? day.isPast 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : day.isToday
                      ? "bg-brutalist-yellow text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                      : "bg-white text-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                  : "bg-gray-50 text-gray-300",
                isSelected && "bg-brutalist-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                hasReservations && day.isCurrentMonth && !day.isPast && "ring-2 ring-brutalist-green"
              )}
            >
              <span>{day.date.getDate()}</span>
              {hasReservations && (
                <div className="absolute -top-1 -right-1">
                  <BrutalistBadge color="green" className="text-xs">
                    {dayReservations.length}
                  </BrutalistBadge>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selector de hora */}
      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <h4 className="font-black uppercase text-sm">
              Horarios para {selectedDate.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {timeSlots.map(time => {
              const isAvailable = isTimeSlotAvailable(time);
              const isSelected = selectedTime === time;
              
              return (
                <button
                  key={time}
                  onClick={() => isAvailable && onTimeSelect(time)}
                  disabled={!isAvailable}
                  className={cn(
                    "p-2 text-xs font-bold border-2 border-black transition-all duration-150",
                    isAvailable
                      ? isSelected
                        ? "bg-brutalist-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white text-black hover:bg-gray-50 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
          
          {selectedDate && (
            <div className="flex items-center justify-between p-3 bg-brutalist-lime border-2 border-black">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-black uppercase">
                  {getReservationsForDate(selectedDate).length} reservas este día
                </span>
              </div>
              {selectedTime && (
                <BrutalistBadge color="blue">
                  Seleccionado: {selectedTime}
                </BrutalistBadge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarReservation;
