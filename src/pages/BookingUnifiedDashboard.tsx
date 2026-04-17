import React, { Suspense } from 'react';
import ReservationDashboard from '../features/reservations-schedule/ReservationDashboard';

const BookingUnifiedDashboard: React.FC = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono">Cargando Dashboard de Reservas...</div>}>
      <ReservationDashboard />
    </Suspense>
  );
};

export default BookingUnifiedDashboard;
