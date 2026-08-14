import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stockMovementsService } from '@/services/stockMovementsService';
import { apiClient } from '@/services/api';

// Mock the API client (apiClient.get/post return data directly, not {data})
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// vi.mocked() afirma que son mocks de vitest con sus helpers .mockResolvedValue/etc.
const mockPost = vi.mocked(apiClient.post);
const mockGet = vi.mocked(apiClient.get);

describe('stockMovementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerMovement', () => {
    it('POSTs to /stock-transactions/ with the payload and returns the created transaction', async () => {
      const created = { id: 99, product_id: 'P1', transaction_type: 'ADJUSTMENT', quantity_change: 2 };
      mockPost.mockResolvedValue(created);

      const payload = {
        product_id: 'P1',
        transaction_type: 'ADJUSTMENT' as const,
        quantity_change: 2,
        reference_type: 'inventory_check' as const,
        metadata: { operator: 'jperez' },
      };

      const result = await stockMovementsService.registerMovement(payload);

      expect(result).toEqual(created);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith('/stock-transactions/', payload);
    });

    it('never sends branch_id (backend resolves it from the JWT)', async () => {
      mockPost.mockResolvedValue({ id: 1 });
      await stockMovementsService.registerMovement({
        product_id: 'P1',
        transaction_type: 'ADJUSTMENT',
        quantity_change: 1,
      });
      const [, body] = mockPost.mock.calls[0];
      expect(body).not.toHaveProperty('branch_id');
    });

    it('normalizes errors via toApiError', async () => {
      mockPost.mockRejectedValue(new Error('boom'));
      await expect(
        stockMovementsService.registerMovement({
          product_id: 'P1',
          transaction_type: 'ADJUSTMENT',
          quantity_change: 1,
        }),
      ).rejects.toThrow();
    });
  });

  describe('reads', () => {
    it('getProductHistory hits /stock-transactions/product/{id} with limit/offset params', async () => {
      mockGet.mockResolvedValue([{ id: 1 }]);
      const result = await stockMovementsService.getProductHistory('P1', 25, 0);
      expect(result).toEqual([{ id: 1 }]);
      expect(mockGet).toHaveBeenCalledWith('/stock-transactions/product/P1', {
        params: { limit: 25, offset: 0 },
      });
    });

    it('getMovementsByDate builds the correct params', async () => {
      mockGet.mockResolvedValue([]);
      await stockMovementsService.getMovementsByDate({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        transactionType: 'ADJUSTMENT',
      });
      expect(mockGet).toHaveBeenCalledWith('/stock-transactions/by-date', {
        params: {
          start_date: '2026-01-01',
          end_date: '2026-01-31',
          type: 'ADJUSTMENT',
          limit: 50,
          offset: 0,
        },
      });
    });

    it('getMovementSummary passes start_date/end_date (required by backend)', async () => {
      mockGet.mockResolvedValue([]);
      await stockMovementsService.getMovementSummary({ startDate: '2026-01-01', endDate: '2026-01-31' });
      expect(mockGet).toHaveBeenCalledWith('/stock-transactions/movement-summary', {
        params: { start_date: '2026-01-01', end_date: '2026-01-31' },
      });
    });

    it('validateConsistency omits params when no productId', async () => {
      mockGet.mockResolvedValue([]);
      await stockMovementsService.validateConsistency();
      expect(mockGet).toHaveBeenCalledWith('/stock-transactions/validate-consistency', {
        params: {},
      });
    });

    it('getDiscrepancyReport sends date_from/date_to', async () => {
      mockGet.mockResolvedValue([]);
      await stockMovementsService.getDiscrepancyReport('2026-01-01', '2026-01-31');
      expect(mockGet).toHaveBeenCalledWith('/stock-transactions/discrepancy-report', {
        params: { date_from: '2026-01-01', date_to: '2026-01-31' },
      });
    });

    it('coerces non-array responses into empty arrays', async () => {
      mockGet.mockResolvedValue({ not: 'an array' });
      const result = await stockMovementsService.getProductHistory('P1');
      expect(result).toEqual([]);
    });
  });
});
