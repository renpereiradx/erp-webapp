import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryService } from '../services/inventoryService';
import { apiClient } from '../services/api';

// Mock the API client properly
vi.mock('../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('Inventory Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInventories', () => {
    it('should fetch inventories successfully', async () => {
      const mockResponse = {
        inventories: [
          { id: 1, user_id: 'test-user', check_date: '2025-09-06T10:00:00Z', state: true }
        ],
        pagination: { total: 1, page: 1, pageSize: 10 }
      };
      
      apiClient.get.mockResolvedValue(mockResponse);
      
      const result = await inventoryService.getInventories(1, 10);
      
      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/inventory?page=1&page_size=10');
    });

    it('should handle API error', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'));
      
      await expect(inventoryService.getInventories()).rejects.toThrow('Network error');
    });
  });

  describe('getInventoryDetails', () => {
    it('should fetch inventory details successfully', async () => {
      const mockResponse = {
        inventory: { id: 1, user_id: 'test-user', state: true },
        items: [
          { id: 1, product_id: 'PROD_001', quantity_checked: 100, previous_quantity: 90 }
        ]
      };
      
      apiClient.get.mockResolvedValue(mockResponse);
      
      const result = await inventoryService.getInventoryDetails(1);
      
      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/inventory/1');
    });
  });

  describe('createInventory', () => {
    it('should create inventory successfully', async () => {
      const inventoryData = {
        check_date: '2025-09-06T10:00:00Z',
        details: [
          { product_id: 'PROD_001', quantity_checked: 100 }
        ]
      };
      
      const mockResponse = {
        success: true,
        inventory_id: 22,
        message: 'Inventory created successfully'
      };
      
      apiClient.post.mockResolvedValue(mockResponse);
      
      const result = await inventoryService.createInventory(inventoryData);
      
      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/inventory', {
        action: 'insert',
        check_date: inventoryData.check_date,
        details: inventoryData.details
      });
    });

    it('should use current timestamp when no check_date provided', async () => {
      const inventoryData = {
        details: [{ product_id: 'PROD_001', quantity_checked: 100 }]
      };
      
      const mockResponse = { success: true, inventory_id: 22 };
      apiClient.post.mockResolvedValue(mockResponse);
      
      await inventoryService.createInventory(inventoryData);
      
      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.action).toBe('insert');
      expect(callArgs.check_date).toBeDefined();
      expect(callArgs.details).toEqual(inventoryData.details);
    });
  });

  describe('invalidateInventory', () => {
    it('should invalidate inventory successfully', async () => {
      const mockResponse = {
        success: true,
        inventory_id: 22,
        message: 'Inventory invalidated successfully'
      };
      
      apiClient.post.mockResolvedValue(mockResponse);
      
      const result = await inventoryService.invalidateInventory(22);
      
      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/inventory/invalidate', {
        action: 'invalidate',
        id_inventory: 22
      });
    });
  });

  describe('getProductTransactionHistory', () => {
    it('should fetch transaction history successfully', async () => {
      const mockTransactions = [
        {
          id: 1,
          product_id: 'PROD_001',
          transaction_type: 'PURCHASE',
          quantity_change: 50,
          quantity_before: 10,
          quantity_after: 60
        }
      ];
      
      apiClient.get.mockResolvedValue(mockTransactions);
      
      const result = await inventoryService.getProductTransactionHistory('PROD_001', 20, 0);
      
      expect(result).toEqual(mockTransactions);
      expect(apiClient.get).toHaveBeenCalledWith('/stock-transactions/product/PROD_001?limit=20&offset=0');
    });
  });

  describe('createStockTransaction', () => {
    it('should create stock transaction successfully', async () => {
      const transactionData = {
        product_id: 'PROD_001',
        transaction_type: 'PURCHASE',
        quantity_change: 25,
        unit_price: 10.50,
        reason: 'Weekly purchase'
      };
      
      const mockResponse = {
        id: 123,
        message: 'Transaction created successfully'
      };
      
      apiClient.post.mockResolvedValue(mockResponse);
      
      const result = await inventoryService.createStockTransaction(transactionData);
      
      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/stock-transactions', transactionData);
    });
  });

  describe('getTransactionTypes', () => {
    it('should fetch transaction types successfully', async () => {
      const mockTypes = {
        'PURCHASE': 'Compra',
        'SALE': 'Venta',
        'ADJUSTMENT': 'Ajuste Manual'
      };
      
      apiClient.get.mockResolvedValue(mockTypes);
      
      const result = await inventoryService.getTransactionTypes();
      
      expect(result).toEqual(mockTypes);
      expect(apiClient.get).toHaveBeenCalledWith('/stock-transactions/types');
    });
  });

  describe('createManualAdjustment', () => {
    it('should create manual adjustment successfully', async () => {
      const adjustmentData = {
        product_id: 'PROD_001',
        new_quantity: 75,
        reason: 'Damaged products removed'
      };
      
      const mockResponse = {
        success: true,
        adjustment_id: 456
      };
      
      apiClient.post.mockResolvedValue(mockResponse);
      
      const result = await inventoryService.createManualAdjustment(adjustmentData);
      
      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/inventory/manual-adjustment', adjustmentData);
    });
  });

  describe('validateStockConsistency', () => {
    it('should validate all stock when no productId provided', async () => {
      const mockValidation = [
        {
          product_id: 'PROD_001',
          is_consistent: true,
          current_stock: 100,
          calculated_stock: 100
        }
      ];
      
      apiClient.get.mockResolvedValue(mockValidation);
      
      const result = await inventoryService.validateStockConsistency();
      
      expect(result).toEqual(mockValidation);
      expect(apiClient.get).toHaveBeenCalledWith('/stock-transactions/validate-consistency');
    });

    it('should validate specific product stock', async () => {
      const mockValidation = [
        {
          product_id: 'PROD_001',
          is_consistent: false,
          current_stock: 100,
          calculated_stock: 98,
          difference: 2
        }
      ];
      
      apiClient.get.mockResolvedValue(mockValidation);
      
      const result = await inventoryService.validateStockConsistency('PROD_001');
      
      expect(result).toEqual(mockValidation);
      expect(apiClient.get).toHaveBeenCalledWith('/stock-transactions/validate-consistency?product_id=PROD_001');
    });
  });

  describe('Validation helpers', () => {
    describe('validateInventoryData', () => {
      it('should return no errors for valid data', () => {
        const validData = {
          details: [
            { product_id: 'PROD_001', quantity_checked: 100 },
            { product_id: 'PROD_002', quantity_checked: 50 }
          ]
        };
        
        const errors = inventoryService.validateInventoryData(validData);
        expect(errors).toEqual([]);
      });

      it('should return error when no details provided', () => {
        const invalidData = { details: [] };
        
        const errors = inventoryService.validateInventoryData(invalidData);
        expect(errors).toContain('Al menos un producto es requerido');
      });

      it('should return error for duplicate product IDs', () => {
        const invalidData = {
          details: [
            { product_id: 'PROD_001', quantity_checked: 100 },
            { product_id: 'PROD_001', quantity_checked: 50 }
          ]
        };
        
        const errors = inventoryService.validateInventoryData(invalidData);
        expect(errors).toContain('Product ID duplicado: PROD_001');
      });

      it('should return error for negative quantities', () => {
        const invalidData = {
          details: [
            { product_id: 'PROD_001', quantity_checked: -10 }
          ]
        };
        
        const errors = inventoryService.validateInventoryData(invalidData);
        expect(errors).toContain('Cantidad inválida en PROD_001');
      });

      it('should return error for too many products', () => {
        const details = Array(1001).fill().map((_, i) => ({
          product_id: `PROD_${i.toString().padStart(3, '0')}`,
          quantity_checked: 100
        }));
        
        const invalidData = { details };
        
        const errors = inventoryService.validateInventoryData(invalidData);
        expect(errors).toContain('Máximo 1000 productos por inventario');
      });
    });

    describe('validateTransactionData', () => {
      it('should return no errors for valid transaction data', () => {
        const validData = {
          product_id: 'PROD_001',
          transaction_type: 'PURCHASE',
          quantity_change: 50
        };
        
        const errors = inventoryService.validateTransactionData(validData);
        expect(errors).toEqual([]);
      });

      it('should return error when product_id missing', () => {
        const invalidData = {
          transaction_type: 'PURCHASE',
          quantity_change: 50
        };
        
        const errors = inventoryService.validateTransactionData(invalidData);
        expect(errors).toContain('product_id es requerido');
      });

      it('should return error when quantity_change is zero', () => {
        const invalidData = {
          product_id: 'PROD_001',
          transaction_type: 'PURCHASE',
          quantity_change: 0
        };
        
        const errors = inventoryService.validateTransactionData(invalidData);
        expect(errors).toContain('quantity_change debe ser un número diferente de cero');
      });

      it('should return error for invalid transaction type', () => {
        const invalidData = {
          product_id: 'PROD_001',
          transaction_type: 'INVALID_TYPE',
          quantity_change: 50
        };
        
        const errors = inventoryService.validateTransactionData(invalidData);
        expect(errors[0]).toContain('Tipo de transacción inválido');
      });
    });

    describe('validateAdjustmentData', () => {
      it('should return no errors for valid adjustment data', () => {
        const validData = {
          product_id: 'PROD_001',
          new_quantity: 75,
          reason: 'Stock correction'
        };
        
        const errors = inventoryService.validateAdjustmentData(validData);
        expect(errors).toEqual([]);
      });

      it('should return error when reason is missing', () => {
        const invalidData = {
          product_id: 'PROD_001',
          new_quantity: 75,
          reason: ''
        };
        
        const errors = inventoryService.validateAdjustmentData(invalidData);
        expect(errors).toContain('reason es requerido');
      });

      it('should return error for negative new_quantity', () => {
        const invalidData = {
          product_id: 'PROD_001',
          new_quantity: -10,
          reason: 'Test reason'
        };
        
        const errors = inventoryService.validateAdjustmentData(invalidData);
        expect(errors).toContain('new_quantity debe ser un número >= 0');
      });
    });
  });
});