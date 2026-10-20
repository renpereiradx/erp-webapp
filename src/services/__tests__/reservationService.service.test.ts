/**
 * reservationService.manageReserve — normalización del envelope {Data}.
 *
 * El backend envuelve el resultado de transactions.manage_reserve en
 * {"Data": {...}} (struct Go ReserveResponse sin json tag). El servicio debe
 * des-envolverlo en la frontera: los callers (walk-in del checkout, agenda)
 * leen success/reserve_id/error directamente. Antes de este fix el walk-in
 * veía el envelope sin reserve_id y fallaba SIEMPRE aunque el backend hubiera
 * creado la reserva (bug reportado por el owner 2026-10-05).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const makeRequestMock = vi.fn();

vi.mock('../api', () => ({
  apiClient: { makeRequest: (...args: unknown[]) => makeRequestMock(...args) },
}));

import { reservationService } from '../reservationService';

describe('reservationService.manageReserve — unwrap del envelope {Data}', () => {
  beforeEach(() => {
    makeRequestMock.mockReset();
  });

  it('des-envuelve {Data: {...}} y devuelve el payload interno', async () => {
    makeRequestMock.mockResolvedValue({
      Data: { success: true, action: 'CREATE', reserve_id: 42, total_amount: 13000 },
    });

    const out = await reservationService.manageReserve({
      action: 'CREATE',
      product_id: 'p1',
      client_id: 'c1',
      start_time: '2026-10-05T14:00:00Z',
      duration: 1,
    } as never);

    expect(out).toEqual({
      success: true,
      action: 'CREATE',
      reserve_id: 42,
      total_amount: 13000,
    });
    // POST al endpoint correcto con el body intacto.
    const [endpoint, options] = makeRequestMock.mock.calls[0];
    expect(endpoint).toBe('/reserve/manage');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body).action).toBe('CREATE');
  });

  it('propaga el error del SQL (Data.success false) como objeto plano legible', async () => {
    makeRequestMock.mockResolvedValue({
      Data: { success: false, code: 'RESERVE_CONFLICT', error: 'El horario acaba de ser tomado' },
    });

    const out = (await reservationService.manageReserve({
      action: 'CREATE',
    } as never)) as { success: boolean; error: string };

    expect(out.success).toBe(false);
    expect(out.error).toContain('horario');
  });

  it('respuestas sin envelope (p. ej. ApiError paths o cambios de contract) pasan tal cual', async () => {
    const plain = { success: true, reserve_id: 7 };
    makeRequestMock.mockResolvedValue(plain);
    await expect(
      reservationService.manageReserve({ action: 'CONFIRM' } as never),
    ).resolves.toBe(plain);
  });
});

describe('reservationService.getSchedulesForProductAndDate — normalización de slots', () => {
  beforeEach(() => {
    makeRequestMock.mockReset();
  });

  it('un slot con reserva ANULADA vuelve a ser reservable (la huella CANCELLED no lo bloquea)', async () => {
    makeRequestMock.mockResolvedValue([
      {
        id: 1,
        product_id: 'p1',
        start_time: '2026-10-14T16:00:00Z',
        end_time: '2026-10-14T17:00:00Z',
        is_available: true,
        reserve_id: 45,
        reserve_status: 'CANCELLED',
      },
      {
        id: 2,
        product_id: 'p1',
        start_time: '2026-10-14T18:00:00Z',
        end_time: '2026-10-14T19:00:00Z',
        is_available: false,
        reserve_id: 47,
        reserve_status: 'RESERVED',
      },
      {
        id: 3,
        product_id: 'p1',
        start_time: '2026-10-14T19:00:00Z',
        end_time: '2026-10-14T20:00:00Z',
        is_available: true,
      },
      // Regresión fix 2026-10-19: slot trabado (is_available=false) cuya única
      // reserva está CANCELLED — la huella veta la ocupación entera.
      {
        id: 4,
        product_id: 'p1',
        start_time: '2026-10-14T20:00:00Z',
        end_time: '2026-10-14T21:00:00Z',
        is_available: false,
        reserve_id: 50,
        reserved_by: 'RENE PEREIRA',
        reserve_status: 'CANCELLED',
      },
    ]);

    const slots = await reservationService.getSchedulesForProductAndDate('p1', '2026-10-14');

    expect(slots).toHaveLength(4);
    // Slot anulado: libre otra vez, sin reserve adjunta.
    expect(slots[0].status).toBe('AVAILABLE');
    expect(slots[0].reserve).toBeUndefined();
    // Slot reservado activo: sigue ocupado con su reserve.
    expect(slots[1].status).toBe('RESERVED');
    expect(slots[1].reserve?.id).toBe(47);
    // Slot libre sin huella: disponible.
    expect(slots[2].status).toBe('AVAILABLE');
    expect(slots[2].reserve).toBeUndefined();
    // Slot trabado con huella CANCELLED: libre para la UI aunque el API diga
    // is_available=false (bug de CANCEL no idempotente, pre-fix BE).
    expect(slots[3].status).toBe('AVAILABLE');
    expect(slots[3].reserve).toBeUndefined();
  });
});
