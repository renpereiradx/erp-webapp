/**
 * Tests FASE 5 (plan auditoría BI): componentes del feature de análisis de
 * proveedor (auditoría 2A/F3B). Suite única con fixture compartido — cada
 * componente es puro y recibe el contrato ya mapeado por useSupplierAnalysis.
 * H7 (FASE 5): la tabla ya no tiene Filtrar/Exportar/paginación ni acciones
 * por fila — regla FE-2: toda afordancia funciona o desaparece.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SupplierHeader from '../components/SupplierAnalysis/SupplierHeader';
import DebtKpis from '../components/SupplierAnalysis/DebtKpis';
import AnalysisCards from '../components/SupplierAnalysis/AnalysisCards';
import ActiveObligationsTable from '../components/SupplierAnalysis/ActiveObligationsTable';
import type { SupplierAnalysisData, SupplierInvoiceRow } from '../types';

const invoices: SupplierInvoiceRow[] = [
  {
    id: 'FAC-1',
    date: '01 ago. 2026',
    dueDate: '01 sept. 2026',
    originalAmount: 1000000,
    pendingAmount: 1000000,
    status: 'OVERDUE',
    isOverdue: true,
  },
  {
    id: 'FAC-2',
    date: '20 ago. 2026',
    dueDate: '01 oct. 2026',
    originalAmount: 2000000,
    pendingAmount: 500000,
    status: 'PARTIAL',
    isOverdue: false,
  },
];

const stats: SupplierAnalysisData['stats'] = {
  totalPending: 3009450,
  totalOverdue: 1200000,
  avgPaymentDays: 18.4,
  activeInvoices: 2,
  overdueCount: 1,
  shareOfPayables: 42.5,
};

const rating: SupplierAnalysisData['rating'] = {
  historyLabel: 'Pobre',
  color: 'rose',
  avgDays: 18.4,
  description: 'Historial de pago pobre según los registros — paga en promedio a 18 días.',
};

const terms: SupplierAnalysisData['terms'] = {
  creditDays: 30,
  oldestInvoice: '15 ene. 2026',
};

describe('SupplierHeader', () => {
  it('muestra iniciales, nombre, badge de importancia e id', () => {
    render(
      <SupplierHeader
        supplier={{ name: 'BodyTech S.A.', importance: 'Crítica', id: 'SUP-1', contact: '' }}
      />,
    );

    expect(screen.getByText('BO')).toBeInTheDocument();
    expect(screen.getByText('BodyTech S.A.')).toBeInTheDocument();
    expect(screen.getByText('Crítica')).toBeInTheDocument();
    expect(screen.getByText('SUP-1')).toBeInTheDocument();
  });

  it('sin importancia no muestra badge y sin contacto no muestra el ítem', () => {
    render(
      <SupplierHeader supplier={{ name: 'Acme', importance: null, id: 'SUP-2', contact: '' }} />,
    );

    expect(screen.queryByText('Crítica')).not.toBeInTheDocument();
    expect(screen.queryByText('No disponible')).not.toBeInTheDocument();
  });
});

describe('DebtKpis', () => {
  it('muestra pendiente, vencido, DPO y share reales', () => {
    render(<DebtKpis stats={stats} />);

    expect(screen.getByText('Total Pendiente')).toBeInTheDocument();
    expect(screen.getByText(/Gs\. 3\.009\.450/)).toBeInTheDocument();
    expect(screen.getByText(/Gs\. 1\.200\.000/)).toBeInTheDocument();
    expect(screen.getByText('18 Días')).toBeInTheDocument();
    expect(screen.getByText('42.5%')).toBeInTheDocument();
    expect(screen.getByText('2 facturas con saldo pendiente')).toBeInTheDocument();
    expect(screen.getByText('1 factura supera la fecha límite')).toBeInTheDocument();
  });

  it('DPO nulo o cero muestra guión (sin inventar promedio)', () => {
    render(
      <DebtKpis stats={{ ...stats, avgPaymentDays: null }} />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('AnalysisCards', () => {
  it('muestra el enum real de historial (sin score/100) y términos de crédito', () => {
    render(<AnalysisCards rating={rating} terms={terms} />);

    expect(screen.getByText('Pobre')).toBeInTheDocument();
    expect(screen.getByText('Calificación de Pago')).toBeInTheDocument();
    expect(screen.getByText(rating.description)).toBeInTheDocument();
    expect(screen.queryByText(/\/100/)).not.toBeInTheDocument();
    expect(screen.getByText('Net 30 días')).toBeInTheDocument();
    expect(screen.getByText('15 ene. 2026')).toBeInTheDocument();
  });

  it('términos sin datos muestran guión', () => {
    render(
      <AnalysisCards
        rating={rating}
        terms={{ creditDays: null, oldestInvoice: 'N/A' }}
      />,
    );
    expect(screen.getAllByText('—')).toHaveLength(1);
  });
});

describe('ActiveObligationsTable', () => {
  it('renderiza facturas con montos, vencimiento resaltado y badge de estado', () => {
    render(
      <ActiveObligationsTable invoices={invoices} summary={{ total: 2, overdue: 1 }} />,
    );

    expect(screen.getByText('Obligaciones Activas')).toBeInTheDocument();
    expect(screen.getByText('FAC-1')).toBeInTheDocument();
    expect(screen.getByText('FAC-2')).toBeInTheDocument();
    expect(screen.getAllByText(/Gs\. 1\.000\.000/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Gs\. 2\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Gs\. 500\.000/)).toBeInTheDocument();
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
    expect(screen.getByText('Parcial')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 2 de 2 facturas')).toBeInTheDocument();
  });

  it('H7: no existen controles muertos (Filtrar/Exportar/paginación/acciones por fila)', () => {
    render(
      <ActiveObligationsTable invoices={invoices} summary={{ total: 2, overdue: 1 }} />,
    );

    expect(screen.queryByText('Filtrar')).not.toBeInTheDocument();
    expect(screen.queryByText('Exportar')).not.toBeInTheDocument();
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
    expect(screen.queryByText('Siguiente')).not.toBeInTheDocument();
    expect(screen.queryByText('Acciones')).not.toBeInTheDocument();
  });
});
