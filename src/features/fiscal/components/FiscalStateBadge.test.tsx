/**
 * FiscalStateBadge — tests de renderizado (FE5.1).
 * Verifica el mapeo estado → label i18n + variante de badge, el fallback
 * para estados desconocidos y el estado vacío (venta no fiscal).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FiscalStateBadge from './FiscalStateBadge';

describe('FiscalStateBadge', () => {
  it('renderiza el label i18n del estado', () => {
    render(<FiscalStateBadge state="APROBADO" />);
    expect(screen.getByText('Aprobado')).toBeTruthy();
  });

  it('mapea APROBADO_OBS a su label completo', () => {
    render(<FiscalStateBadge state="APROBADO_OBS" />);
    expect(screen.getByText('Aprobado con observación')).toBeTruthy();
  });

  it('estados desconocidos caen al fallback UNKNOWN sin romper', () => {
    render(<FiscalStateBadge state="ESTADO_NUEVO_BACKEND" />);
    expect(screen.getByText('Estado desconocido')).toBeTruthy();
  });

  it('sin estado renderiza el emptyLabel (venta no fiscal)', () => {
    render(<FiscalStateBadge emptyLabel="No fiscal" />);
    expect(screen.getByText('No fiscal')).toBeTruthy();
  });

  it('sin estado y sin emptyLabel usa el guion por defecto', () => {
    render(<FiscalStateBadge />);
    expect(screen.getByText('—')).toBeTruthy();
  });
});
