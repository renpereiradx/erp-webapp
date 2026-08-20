import { describe, it, expect } from 'vitest';
import {
  CANCELLATION_DEADLINE_HOURS,
  cancellationDeadlineHours,
  cancellationWindow,
  parseFiscalDateTime,
} from './cancellation';

// Referencias fijas (sin zona, formato del backend).
const APROBADA = '2026-08-19T10:00:00';

describe('cancellationDeadlineHours', () => {
  it('48 h para FE (iTiDE 1) y 168 h para NCE/NDE (5/6) — MT §11.1.2', () => {
    expect(CANCELLATION_DEADLINE_HOURS[1]).toBe(48);
    expect(CANCELLATION_DEADLINE_HOURS[5]).toBe(168);
    expect(CANCELLATION_DEADLINE_HOURS[6]).toBe(168);
  });

  it('fallback conservador 168 h para tipos desconocidos', () => {
    expect(cancellationDeadlineHours(99)).toBe(168);
    expect(cancellationDeadlineHours(0)).toBe(168);
  });
});

describe('parseFiscalDateTime', () => {
  it('parsea "YYYY-MM-DDTHH:MM:SS" en local (sin desplazamiento UTC)', () => {
    const d = parseFiscalDateTime(APROBADA)!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // agosto (0-indexed)
    expect(d.getDate()).toBe(19);
    expect(d.getHours()).toBe(10);
  });

  it('tolera formato con espacio y sin segundos', () => {
    expect(parseFiscalDateTime('2026-08-19 10:00')!.getMinutes()).toBe(0);
    expect(parseFiscalDateTime('2026-08-19T10:00:00')!.getSeconds()).toBe(0);
  });

  it('devuelve null para entradas inválidas', () => {
    expect(parseFiscalDateTime('')).toBeNull();
    expect(parseFiscalDateTime('no-es-fecha')).toBeNull();
  });
});

describe('cancellationWindow', () => {
  const within = new Date(2026, 7, 19, 20, 0); // 10 h después de la aprobación
  const past = new Date(2026, 7, 22, 12, 0); // > 48 h después (FE vencido)

  it('computa deadline = aprobación + horas legales (FE 48 h)', () => {
    const w = cancellationWindow({ doc_type: 1, fecha_proceso: APROBADA }, within);
    expect(w.computable).toBe(true);
    expect(w.deadlineHours).toBe(48);
    expect(w.deadline!.getFullYear()).toBe(2026);
    expect(w.deadline!.getMonth()).toBe(7);
    expect(w.deadline!.getDate()).toBe(21);
    expect(w.deadline!.getHours()).toBe(10);
    expect(w.withinDeadline).toBe(true);
  });

  it('NCE/NDE usan 168 h', () => {
    const w = cancellationWindow({ doc_type: 5, fecha_proceso: APROBADA }, past);
    expect(w.deadlineHours).toBe(168);
    // 168 h = 7 días → 2026-08-26T10:00, aún dentro el 22
    expect(w.withinDeadline).toBe(true);
  });

  it('detecta FE fuera de plazo', () => {
    const w = cancellationWindow({ doc_type: 1, fecha_proceso: APROBADA }, past);
    expect(w.withinDeadline).toBe(false);
    expect(w.hoursLeft).toBeLessThan(0);
  });

  it('fallback a fecha de firma cuando no hay proceso', () => {
    const w = cancellationWindow(
      { doc_type: 1, fecha_firma: '2026-08-19T09:30:00' },
      new Date(2026, 7, 19, 10, 0),
    );
    expect(w.computable).toBe(true);
    expect(w.hoursLeft).toBeCloseTo(47.5, 5);
  });

  it('sin fecha de referencia → no computable (UI sin advertencia)', () => {
    const w = cancellationWindow({ doc_type: 1 });
    expect(w.computable).toBe(false);
    expect(w.deadline).toBeNull();
    expect(w.withinDeadline).toBe(true);
  });

  it('el plazo exacto (0 h restantes) cuenta como dentro de plazo', () => {
    const w = cancellationWindow(
      { doc_type: 1, fecha_proceso: APROBADA },
      new Date(2026, 7, 21, 10, 0), // = deadline exacto
    );
    expect(w.hoursLeft).toBe(0);
    expect(w.withinDeadline).toBe(true);
  });
});
