/**
 * Tests deuda ≤10 filas (VERIFICACION_POST_CIERRE 2026-09-21): OverdueTable
 * consume la metadata server-side de /receivables/overdue vía el pager
 * compartido; onPageChange dispara el refetch del hook. Mock en la frontera
 * del router (useNavigate); i18n real.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import OverdueTable from '../components/OverdueTable';
import type { OverdueAccount } from '../types';

const account = (over: Partial<OverdueAccount> = {}): OverdueAccount => ({
  id: 1,
  client: 'María González',
  clientId: 'C-1',
  amount: 500000,
  daysOverdue: 75,
  priority: 'High',
  days: '75 días',
  ...over,
});

const renderTable = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('OverdueTable', () => {
  it('pagina server-side: expone totales reales del BE y notifica el cambio de página', async () => {
    const onPageChange = vi.fn();
    renderTable(
      <OverdueTable
        accounts={[account()]}
        pagination={{ page: 2, total_items: 34, total_pages: 4 }}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText('María González')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 4 (34 items)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('sin metadata cae en 1/1 honesto (sin totales fabricados)', () => {
    renderTable(<OverdueTable accounts={[account()]} />);

    expect(screen.getByText('Página 1 de 1 (1 items)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('sin cuentas muestra el estado vacío', () => {
    renderTable(<OverdueTable accounts={[]} />);

    expect(screen.getByText('No hay cuentas vencidas')).toBeInTheDocument();
  });
});
