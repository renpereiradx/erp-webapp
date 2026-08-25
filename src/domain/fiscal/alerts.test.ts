import { describe, expect, it } from 'vitest';
import { maxAlertLevel, sortAlertsBySeverity } from './alerts';
import type { FiscalAlert } from '@/features/fiscal/types';

const alert = (nivel: FiscalAlert['nivel'], tipo = 'test'): FiscalAlert => ({ nivel, tipo, mensaje: 'm' });

describe('sortAlertsBySeverity (S7-H4 espejo FE)', () => {
  it('ordena crit antes que warn antes que info', () => {
    const input = [alert('info'), alert('warn'), alert('crit'), alert('warn')];
    expect(sortAlertsBySeverity(input).map(a => a.nivel)).toEqual(['crit', 'warn', 'warn', 'info']);
  });

  it('es estable dentro del mismo nivel', () => {
    const input = [alert('warn', 'a'), alert('warn', 'b'), alert('warn', 'c')];
    expect(sortAlertsBySeverity(input).map(a => a.tipo)).toEqual(['a', 'b', 'c']);
  });

  it('no muta el array original', () => {
    const input = [alert('info'), alert('crit')];
    sortAlertsBySeverity(input);
    expect(input.map(a => a.nivel)).toEqual(['info', 'crit']);
  });
});

describe('maxAlertLevel', () => {
  it('devuelve el nivel más severo del lote', () => {
    expect(maxAlertLevel([alert('warn'), alert('info')])).toBe('warn');
    expect(maxAlertLevel([alert('info'), alert('crit')])).toBe('crit');
  });

  it('lote vacío → info (contrato del backend)', () => {
    expect(maxAlertLevel([])).toBe('info');
  });
});
