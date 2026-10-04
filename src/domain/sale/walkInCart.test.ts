import { describe, expect, it } from 'vitest';
import { replacePlainCourtItem, type CartLineProductRef } from './walkInCart';

interface Line extends CartLineProductRef {
  id: string;
}

const line = (id: string, productId: string, extra: Partial<Line> = {}): Line => ({
  id,
  productId,
  ...extra,
});

describe('replacePlainCourtItem (walk-in convierte línea pelada)', () => {
  it('reemplaza la línea pelada de la misma cancha por la línea con reserva', () => {
    const cart = [
      line('a', 'CANCHITA_01'),
      line('b', 'OTRO_PROD'),
    ];
    const reserved = line('res', 'CANCHITA_01', { reserveId: 42 });

    const result = replacePlainCourtItem(cart, reserved, 'CANCHITA_01');

    expect(result).toHaveLength(2);
    expect(result.some((i) => i.id === 'a')).toBe(false);
    expect(result.some((i) => i.id === 'res' && i.reserveId === 42)).toBe(true);
    // El otro producto queda intacto y en su posición.
    expect(result[0].id).toBe('b');
  });

  it('no toca líneas con reserva ni de venta pendiente aunque sean del mismo producto', () => {
    const cart = [
      line('pend', 'CANCHITA_01', { isFromPendingSale: true }),
      line('otra-res', 'CANCHITA_01', { reserveId: 7 }),
    ];
    const reserved = line('res', 'CANCHITA_01', { reserveId: 42 });

    const result = replacePlainCourtItem(cart, reserved, 'CANCHITA_01');

    expect(result).toHaveLength(3);
    expect(result.map((i) => i.id)).toEqual(['pend', 'otra-res', 'res']);
  });

  it('con carrito de otro producto, solo agrega la línea con reserva (sin duplicar)', () => {
    const cart = [line('b', 'OTRO_PROD')];
    const reserved = line('res', 'CANCHITA_01', { reserveId: 42 });

    const result = replacePlainCourtItem(cart, reserved, 'CANCHITA_01');

    expect(result).toHaveLength(2);
    expect(result.some((i) => i.productId === 'CANCHITA_01' && i.reserveId === 42)).toBe(true);
  });
});
