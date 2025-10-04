/**
 * Tests para el endpoint enriquecido de movimientos de caja (v2.1)
 * GET /cash-registers/{id}/movements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cashRegisterService } from '@/services/cashRegisterService';
import { apiClient } from '@/services/api';

// Mock del apiClient
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

describe('CashRegister Movements v2.1 - Enriched Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería retornar movimientos enriquecidos con balance acumulado', async () => {
    // Mock de respuesta del backend con datos enriquecidos
    const mockEnrichedMovements = [
      {
        movement_id: 12,
        movement_type: 'INCOME',
        amount: 20000,
        concept: 'Efectivo recibido - SALE-1759353369-669',
        created_at: '2025-10-02T14:01:44.594198Z',
        running_balance: 470000, // ✅ Balance acumulado
        created_by: '2pmK5NPfHiRwZUkcd3d3cETC2JW',
        user_first_name: 'Pedro',
        user_last_name: 'Sanchez',
        user_full_name: 'Pedro Sanchez', // ✅ Nombre completo del usuario
        related_payment_id: 33,
        related_sale_id: 'SALE-1759353369-669',
        related_purchase_id: null,
        sale_total: 29100, // ✅ Información de venta
        sale_status: 'PARTIAL_PAYMENT',
        sale_client_name: 'Horacio Cartel', // ✅ Nombre del cliente
        sale_payment_method: 'Pago con tarjeta de débito'
      },
      {
        movement_id: 13,
        movement_type: 'EXPENSE',
        amount: 900,
        concept: 'Vuelto para venta #SALE-1759429403-849',
        created_at: '2025-10-02T15:24:02.413105Z',
        running_balance: 2046600, // ✅ Balance acumulado actualizado
        created_by: '2pmK5NPfHiRwZUkcd3d3cETC2JW',
        user_first_name: 'Pedro',
        user_last_name: 'Sanchez',
        user_full_name: 'Pedro Sanchez',
        related_payment_id: 42,
        related_sale_id: 'SALE-1759429403-849',
        related_purchase_id: null,
        sale_total: 9100,
        sale_status: 'PAID',
        sale_client_name: 'Erika Magdalena Maciel',
        sale_payment_method: 'Pago en efectivo'
      }
    ];

    apiClient.get.mockResolvedValueOnce(mockEnrichedMovements);

    const cashRegisterId = 6;
    const movements = await cashRegisterService.getMovements(cashRegisterId);

    // Verificar llamada al endpoint correcto
    expect(apiClient.get).toHaveBeenCalledWith(`/cash-registers/${cashRegisterId}/movements`);

    // Verificar estructura enriquecida
    expect(movements).toHaveLength(2);
    expect(movements[0]).toMatchObject({
      movement_id: 12,
      movement_type: 'INCOME',
      amount: 20000,
      running_balance: 470000, // Balance acumulado presente
      user_full_name: 'Pedro Sanchez', // Nombre de usuario presente
      sale_client_name: 'Horacio Cartel', // Nombre de cliente presente
      sale_total: 29100 // Info de venta presente
    });
  });

  it('debería manejar movimientos sin información de venta (valores null)', async () => {
    const mockMovementsWithoutSale = [
      {
        movement_id: 14,
        movement_type: 'ADJUSTMENT',
        amount: 5000,
        concept: 'Ajuste manual por arqueo',
        created_at: '2025-10-02T16:00:00Z',
        running_balance: 505000,
        created_by: '2pmK5NPfHiRwZUkcd3d3cETC2JW',
        user_first_name: 'Pedro',
        user_last_name: 'Sanchez',
        user_full_name: 'Pedro Sanchez',
        related_payment_id: null, // Sin pago relacionado
        related_sale_id: null, // Sin venta relacionada
        related_purchase_id: null,
        sale_total: null, // Campos de venta en null
        sale_status: null,
        sale_client_name: null,
        sale_payment_method: null,
        purchase_total: null,
        purchase_status: null,
        purchase_supplier: null
      }
    ];

    apiClient.get.mockResolvedValueOnce(mockMovementsWithoutSale);

    const movements = await cashRegisterService.getMovements(6);

    expect(movements[0]).toMatchObject({
      movement_id: 14,
      movement_type: 'ADJUSTMENT',
      running_balance: 505000,
      user_full_name: 'Pedro Sanchez',
      related_sale_id: null,
      sale_client_name: null
    });
  });

  it('debería calcular el balance correctamente a través de múltiples movimientos', async () => {
    const mockMovementsWithBalance = [
      {
        movement_id: 1,
        movement_type: 'INCOME',
        amount: 100000,
        running_balance: 450000, // 350000 (inicial) + 100000
        created_at: '2025-10-02T10:00:00Z',
        concept: 'Pago de venta',
        created_by: 'user123',
        user_full_name: 'Usuario Test',
        related_payment_id: 1,
        related_sale_id: 'SALE-001',
        related_purchase_id: null,
        sale_total: 100000,
        sale_status: 'PAID',
        sale_client_name: 'Cliente Test',
        sale_payment_method: 'Efectivo'
      },
      {
        movement_id: 2,
        movement_type: 'EXPENSE',
        amount: 50000,
        running_balance: 400000, // 450000 - 50000
        created_at: '2025-10-02T11:00:00Z',
        concept: 'Retiro de efectivo',
        created_by: 'user123',
        user_full_name: 'Usuario Test',
        related_payment_id: null,
        related_sale_id: null,
        related_purchase_id: null,
        sale_total: null,
        sale_status: null,
        sale_client_name: null,
        sale_payment_method: null
      }
    ];

    apiClient.get.mockResolvedValueOnce(mockMovementsWithBalance);

    const movements = await cashRegisterService.getMovements(6);

    // Verificar progresión del balance
    expect(movements[0].running_balance).toBe(450000);
    expect(movements[1].running_balance).toBe(400000);

    // Verificar que el balance disminuye correctamente en EXPENSE
    const balanceDifference = movements[0].running_balance - movements[1].running_balance;
    expect(balanceDifference).toBe(movements[1].amount);
  });

  it('debería incluir información completa de compras cuando aplique', async () => {
    const mockPurchaseMovement = [
      {
        movement_id: 15,
        movement_type: 'EXPENSE',
        amount: 150000,
        concept: 'Pago a proveedor',
        created_at: '2025-10-02T12:00:00Z',
        running_balance: 200000,
        created_by: 'user123',
        user_first_name: 'Juan',
        user_last_name: 'Pérez',
        user_full_name: 'Juan Pérez',
        related_payment_id: 50,
        related_sale_id: null,
        related_purchase_id: 10, // ✅ Compra relacionada
        sale_total: null,
        sale_status: null,
        sale_client_name: null,
        sale_payment_method: null,
        purchase_total: 150000, // ✅ Info de compra
        purchase_status: 'PAID',
        purchase_supplier: 'Proveedor XYZ' // ✅ Nombre del proveedor
      }
    ];

    apiClient.get.mockResolvedValueOnce(mockPurchaseMovement);

    const movements = await cashRegisterService.getMovements(6);

    expect(movements[0]).toMatchObject({
      related_purchase_id: 10,
      purchase_total: 150000,
      purchase_supplier: 'Proveedor XYZ'
    });
  });

  it('debería manejar errores del backend correctamente', async () => {
    const mockError = new Error('Cash register not found');
    mockError.status = 404;

    // El servicio usa retry, así que rechazamos todas las llamadas
    apiClient.get.mockRejectedValue(mockError);

    await expect(
      cashRegisterService.getMovements(999)
    ).rejects.toThrow('Cash register not found');
  });

  it('debería pasar filtros como query parameters', async () => {
    apiClient.get.mockResolvedValueOnce([]);

    const filters = {
      movement_type: 'INCOME',
      start_date: '2025-10-01',
      end_date: '2025-10-31'
    };

    await cashRegisterService.getMovements(6, filters);

    const expectedUrl = '/cash-registers/6/movements?movement_type=INCOME&start_date=2025-10-01&end_date=2025-10-31';
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });
});

describe('Beneficios de la versión enriquecida v2.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería reducir llamadas API eliminando necesidad de buscar usuarios', async () => {
    const mockEnrichedMovements = [
      {
        movement_id: 1,
        movement_type: 'INCOME',
        amount: 10000,
        running_balance: 360000,
        created_by: 'user123',
        user_full_name: 'Pedro Sanchez', // ✅ Ya incluido, no necesita query adicional
        concept: 'Pago',
        created_at: '2025-10-02T10:00:00Z',
        related_payment_id: null,
        related_sale_id: null,
        related_purchase_id: null,
        sale_total: null,
        sale_status: null,
        sale_client_name: null,
        sale_payment_method: null
      }
    ];

    apiClient.get.mockResolvedValueOnce(mockEnrichedMovements);

    const movements = await cashRegisterService.getMovements(6);

    // Solo UNA llamada API necesaria
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    // Información del usuario ya disponible
    expect(movements[0].user_full_name).toBe('Pedro Sanchez');
  });

  it('debería mostrar información contextual completa para UI', async () => {
    const mockMovement = [{
      movement_id: 1,
      movement_type: 'INCOME',
      amount: 50000,
      running_balance: 400000,
      created_by: 'user123',
      user_full_name: 'Ana García',
      concept: 'Pago de venta',
      created_at: '2025-10-02T14:30:00Z',
      related_payment_id: 25,
      related_sale_id: 'SALE-001',
      related_purchase_id: null,
      sale_total: 50000,
      sale_status: 'PAID',
      sale_client_name: 'María López', // ✅ Lista para mostrar en UI
      sale_payment_method: 'Efectivo'
    }];

    apiClient.get.mockResolvedValueOnce(mockMovement);

    const movements = await cashRegisterService.getMovements(6);
    const movement = movements[0];

    // Todo listo para renderizar en una tabla
    const displayData = {
      tipo: movement.movement_type,
      monto: `$${movement.amount.toLocaleString()}`,
      balance: `$${movement.running_balance.toLocaleString()}`,
      usuario: movement.user_full_name,
      cliente: movement.sale_client_name,
      venta: movement.related_sale_id,
      totalVenta: `$${movement.sale_total.toLocaleString()}`
    };

    expect(displayData).toEqual({
      tipo: 'INCOME',
      monto: '$50,000',
      balance: '$400,000',
      usuario: 'Ana García',
      cliente: 'María López',
      venta: 'SALE-001',
      totalVenta: '$50,000'
    });
  });
});
