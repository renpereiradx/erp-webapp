/**
 * Tests FASE 5 (plan auditoría BI): PaymentCalendar del feature cash-flow.
 * Contrato: grupos por día desde /payables/schedule (ya mapeados por
 * useCashFlow). Empty state honesto cuando no hay pagos programados.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentCalendar from '../components/PaymentCalendar';
import type { ScheduledPaymentGroup } from '../types';

const groups: ScheduledPaymentGroup[] = [
  {
    date: '17 sept.',
    isToday: true,
    subtotal: 300000,
    items: [
      {
        id: 'PO-1',
        code: 'BO',
        name: 'BodyTech',
        description: 'Vence en 0 días',
        category: 'URGENT',
        amount: 300000,
        priority: 'PRIORIDAD ALTA',
      },
    ],
  },
  {
    date: '20 sept.',
    isToday: false,
    subtotal: 150000,
    items: [
      {
        id: 'PO-2',
        code: 'AC',
        name: 'Acme',
        description: 'Vence en 3 días',
        category: 'MEDIA',
        amount: 150000,
        priority: 'PROGRAMADO',
      },
    ],
  },
];

describe('PaymentCalendar (cash-flow)', () => {
  it('renderiza los grupos con badge HOY, subtotal y filas por obligación', () => {
    render(<PaymentCalendar pendingPayments={groups} />);

    expect(screen.getByText('Calendario de Pagos Pendientes')).toBeInTheDocument();
    expect(screen.getByText('HOY')).toBeInTheDocument();
    expect(screen.getByText('17 sept.')).toBeInTheDocument();
    expect(screen.getByText('20 sept.')).toBeInTheDocument();
    // el subtotal del grupo y el monto del ítem repiten el mismo monto
    expect(screen.getAllByText(/Gs\. 300\.000/)).toHaveLength(2);
    expect(screen.getAllByText(/Gs\. 150\.000/)).toHaveLength(2);
    expect(screen.getByText('BodyTech')).toBeInTheDocument();
    expect(screen.getByText('Vence en 0 días')).toBeInTheDocument();
    expect(screen.getByText('PRIORIDAD ALTA')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('PROGRAMADO')).toBeInTheDocument();
  });

  it('sin pagos programados muestra el estado vacío honesto', () => {
    render(<PaymentCalendar pendingPayments={[]} />);

    expect(
      screen.getByText('Sin pagos programados en el período seleccionado.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('HOY')).not.toBeInTheDocument();
  });
});
